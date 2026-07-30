import {FileRef, LLM, ResponseSchema} from './LLM'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files'
const POLL_INTERVAL_MILLIS = 2000
const POLL_TIMEOUT_MILLIS = 60000
const DEFAULT_CHUNK_GRANULARITY_BYTES = 262144
const TARGET_CHUNK_BYTES = 8 * 1024 * 1024
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'

interface GeminiFileResource {
    name: string
    uri: string
    mimeType: string
    state: 'PROCESSING' | 'ACTIVE' | 'FAILED'
}

export class GeminiLLM implements LLM {
    constructor(private readonly apiKey: string, private readonly model: string) {
    }

    upload(fileId: string): FileRef {
        const driveFile = DriveApp.getFileById(fileId)
        const mimeType = driveFile.getMimeType()
        const totalSize = driveFile.getSize()

        const startResponse = fetchOrThrow_(UPLOAD_URL, {
            method: 'post',
            headers: {
                'x-goog-api-key': this.apiKey,
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': String(totalSize),
                'X-Goog-Upload-Header-Content-Type': mimeType,
            },
            contentType: 'application/json',
            payload: JSON.stringify({file: {display_name: driveFile.getName()}}),
        })

        const startHeaders = startResponse.getAllHeaders()
        const uploadUrl = findHeader_(startHeaders, 'x-goog-upload-url')
        if (!uploadUrl) {
            throw new Error(`Gemini file upload for Drive file ${fileId} did not return an x-goog-upload-url header`)
        }
        const granularity = Number(findHeader_(startHeaders, 'x-goog-upload-chunk-granularity'))
            || DEFAULT_CHUNK_GRANULARITY_BYTES
        const chunkSize = Math.max(granularity, Math.floor(TARGET_CHUNK_BYTES / granularity) * granularity)

        const uploaded = this.uploadInChunks(
            uploadUrl,
            mimeType,
            totalSize,
            chunkSize,
            (offset, length) => fetchDriveByteRange_(fileId, offset, offset + length - 1),
        )
        const active = this.waitUntilActive(uploaded)
        return {id: active.name, uri: active.uri, mimeType: active.mimeType}
    }

    private uploadInChunks(
        uploadUrl: string,
        mimeType: string,
        totalSize: number,
        chunkSize: number,
        readChunk: (offset: number, length: number) => GoogleAppsScript.Byte[],
    ): GeminiFileResource {
        let offset = 0
        while (true) {
            const remaining = totalSize - offset
            const isFinalChunk = remaining <= chunkSize
            const length = isFinalChunk ? remaining : chunkSize
            const chunk = length === 0 ? [] : readChunk(offset, length)

            const response = fetchOrThrow_(uploadUrl, {
                method: 'post',
                headers: {
                    'X-Goog-Upload-Command': isFinalChunk ? 'upload, finalize' : 'upload',
                    'X-Goog-Upload-Offset': String(offset),
                },
                contentType: mimeType,
                payload: Utilities.newBlob(chunk, mimeType),
            })

            offset += length
            if (isFinalChunk) {
                return JSON.parse(response.getContentText()).file as GeminiFileResource
            }
        }
    }

    summarize(fileRef: FileRef, instructions: string, schema: ResponseSchema): Record<string, string> {
        const response = fetchOrThrow_(`${API_BASE}/models/${this.model}:generateContent`, {
            method: 'post',
            headers: {'x-goog-api-key': this.apiKey},
            contentType: 'application/json',
            payload: JSON.stringify({
                contents: [{
                    parts: [
                        {text: instructions},
                        {file_data: {mime_type: fileRef.mimeType, file_uri: fileRef.uri}},
                    ],
                }],
                generationConfig: {
                    response_mime_type: 'application/json',
                    response_schema: buildSchema_(schema),
                },
            }),
        })

        const text = JSON.parse(response.getContentText()).candidates[0].content.parts[0].text
        try {
            return JSON.parse(text)
        } catch (e) {
            throw new Error(`Gemini response for file ${fileRef.uri} was not valid JSON: ${text}`)
        }
    }

    deleteFile(fileRef: FileRef): void {
        fetchOrThrow_(`${API_BASE}/${fileRef.id}`, {
            method: 'delete',
            headers: {'x-goog-api-key': this.apiKey},
        })
    }

    private waitUntilActive(file: GeminiFileResource): GeminiFileResource {
        const deadline = Date.now() + POLL_TIMEOUT_MILLIS
        let current = file
        while (current.state === 'PROCESSING') {
            if (Date.now() > deadline) {
                throw new Error(`Gemini file ${current.name} stayed in PROCESSING past ${POLL_TIMEOUT_MILLIS}ms`)
            }
            Utilities.sleep(POLL_INTERVAL_MILLIS)
            const response = fetchOrThrow_(`${API_BASE}/${current.name}`, {
                headers: {'x-goog-api-key': this.apiKey},
            })
            current = JSON.parse(response.getContentText()) as GeminiFileResource
        }
        if (current.state === 'FAILED') {
            throw new Error(`Gemini failed to process uploaded file ${current.name}`)
        }
        return current
    }
}

function fetchOrThrow_(
    url: string,
    params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions,
): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const response = UrlFetchApp.fetch(url, {...params, muteHttpExceptions: true})
    const code = response.getResponseCode()
    if (code < 200 || code >= 300) {
        throw new Error(`Gemini API request to ${url} failed with status ${code}: ${response.getContentText()}`)
    }
    return response
}

function fetchDriveByteRange_(fileId: string, startByte: number, endByte: number): GoogleAppsScript.Byte[] {
    const url = `${DRIVE_FILES_URL}/${fileId}?alt=media&supportsAllDrives=true`
    const response = UrlFetchApp.fetch(url, {
        headers: {
            Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
            Range: `bytes=${startByte}-${endByte}`,
        },
        muteHttpExceptions: true,
    })

    const code = response.getResponseCode()
    if (code !== 206) {
        throw new Error(
            `Drive ranged download for file ${fileId} (bytes=${startByte}-${endByte}) expected status 206, ` +
            `got ${code}: ${response.getContentText()}`,
        )
    }
    return response.getContent()
}

function buildSchema_(schema: ResponseSchema): object {
    const keys = Object.keys(schema)
    const properties: Record<string, object> = {}
    for (const key of keys) {
        properties[key] = {type: 'STRING', description: schema[key]}
    }
    return {type: 'OBJECT', properties, required: keys}
}

function findHeader_(headers: object, name: string): string | undefined {
    const lowerName = name.toLowerCase()
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lowerName) {
            return String(value)
        }
    }
    return undefined
}
