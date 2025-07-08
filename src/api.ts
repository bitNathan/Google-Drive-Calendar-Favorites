import {drive_v3} from 'googleapis'

export async function getAllFiles(drive: drive_v3.Drive) {
    return drive.files.list({
        pageSize: 100,
        fields: 'files(id, name)',
    });
}

export async function getFile(drive: drive_v3.Drive, file_id:string) {
    // Fetch file metadata to check capabilities
    // TODO if file of certian types then we need to use files.export instead
    //  do so by checking metadata.mimeType
    const metadata = await drive.files.get({
        fileId: file_id,
        fields: 'size, capabilities',
    });
    if (!metadata.data.capabilities?.canDownload) {
        throw new Error('File cannot be downloaded due to permissions.');
    }
    // TODO verify file's size
    /*Actual size metadata field appears to be 0 even when .HEIC file is intact, so take a look later ig*/
    // else if (metadata.data.size?.match("0")){
    //     throw new Error('File has size 0 and cannot be downloaded.');
    // }
    const res = await drive.files.get(
        { fileId: file_id, alt: 'media', supportsAllDrives: true },
        {responseType:'arraybuffer'}
    )
    return res.data as ArrayBuffer;
}
