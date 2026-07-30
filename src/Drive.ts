const GOOGLE_WORKSPACE_MIME_PREFIX = 'application/vnd.google-apps.'

export function listFilesRecursively_(folderId: string): GoogleAppsScript.Drive.File[] {
    const files: GoogleAppsScript.Drive.File[] = []
    collectFiles_(DriveApp.getFolderById(folderId), files)
    return files
}

function collectFiles_(folder: GoogleAppsScript.Drive.Folder, files: GoogleAppsScript.Drive.File[]): void {
    const fileIterator = folder.getFiles()
    while (fileIterator.hasNext()) {
        const file = fileIterator.next()
        // Google Docs/Sheets/Slides (and Forms, Drawings, etc.) only exist as an on-demand
        // export; skip them rather than reading a converted copy into memory.
        if (!file.getMimeType().startsWith(GOOGLE_WORKSPACE_MIME_PREFIX)) {
            files.push(file)
        }
    }

    const folderIterator = folder.getFolders()
    while (folderIterator.hasNext()) {
        collectFiles_(folderIterator.next(), files)
    }
}

export function computeSignature_(file: GoogleAppsScript.Drive.File): string {
    return file.getLastUpdated().getTime().toString()
}
