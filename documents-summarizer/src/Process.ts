import {computeSignature_, listFilesRecursively_} from './Drive'
import {LLM, ResponseSchema} from './LLM'

export interface ProcessResult {
    fileId: string
    fileName: string
    signature: string
    response: Record<string, string>
}

export function process(
    folderId: string,
    knownSignatures: Record<string, string>,
    instructions: string,
    llm: LLM,
    schema: ResponseSchema,
): ProcessResult[] {
    const results: ProcessResult[] = []

    for (const file of listFilesRecursively_(folderId)) {
        const signature = computeSignature_(file)
        if (knownSignatures[file.getId()] === signature) {
            continue
        }

        const fileRef = llm.upload(file.getId())
        let response: Record<string, string>
        try {
            response = llm.summarize(fileRef, instructions, schema)
        } finally {
            llm.deleteFile(fileRef)
        }

        results.push({
            fileId: file.getId(),
            fileName: file.getName(),
            signature,
            response,
        })
    }

    return results
}
