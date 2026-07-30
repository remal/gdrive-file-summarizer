export interface FileRef {
    id: string
    uri: string
    mimeType: string
}

export type ResponseSchema = Record<string, string>

export interface LLM {
    upload(fileId: string): FileRef

    summarize(fileRef: FileRef, instructions: string, schema: ResponseSchema): Record<string, string>

    deleteFile(fileRef: FileRef): void
}
