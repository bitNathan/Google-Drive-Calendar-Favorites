import {drive_v3} from 'googleapis'
import logger from '../logger'

// TODO try/catch blocks and logger integration

export async function getAllFiles(drive: drive_v3.Drive) {
   
    logger.info("Got all drive files")
    return drive.files.list({
        pageSize: 100,
        fields: 'files(id, name)',
    });
}

export async function getFileContents(drive: drive_v3.Drive, file_id:string) {
    // Fetch file metadata to check capabilities
    // TODO if file of certian types then we need to use files.export instead
    //  do so by checking metadata.mimeType
    // TODO integrate with getFileProperties to optionally take metadata args or call automatically
    const metadata = await drive.files.get({
        fileId: file_id,
        fields: 'size, capabilities, name',
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
    // TODO actual name seems to usually be udefined, resolve it some other way since list seems to show actual name
    // TODO determine file type for extension
    logger.info("Got file for download: ", file_id)
    let fileName: string = res.data.name ? res.data.name : file_id
    return { buffer: res.data as ArrayBuffer, name: fileName };
}

export async function getFileProperties(drive: drive_v3.Drive, file_id:string){
    const metadata = await drive.files.get({
        fileId: file_id,
        fields: 'name, mimeType, capabilities/canEdit, appProperties',
    });

    return metadata.data
}

export async function setUsedOnDate(drive: drive_v3.Drive, file_id:string, date:string){
    // TOOD to support using a file on several dates a list of dates in usedOn, 
    //  to update get appProperties as a string (if any) and then append "date" to that
    //  finally, rewrite full string to file
    logger.info("Updating " + file_id + "as last used on " + date)
    const response = await drive.files.update({
        fileId: file_id,
        supportsAllDrives: true,
        requestBody: {
            appProperties: {
                usedOn: date
            }
        },
        fields: 'id, name, appProperties'
  });
  logger.info("successfully updated usedOnDate")
  return response.data
}
