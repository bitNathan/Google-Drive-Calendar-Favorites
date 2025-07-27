import {drive_v3} from 'googleapis'
import logger from '../logger'

// TODO try/catch blocks and logger integration

export async function getAllFoldersWithinFolder(drive: drive_v3.Drive, parent_folder_id:string) {
   
    logger.info("Got all folders within: " + parent_folder_id)
    // TODO pagination
    const folders_within_parent = await drive.files.list({
        q: `'${parent_folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        pageSize: 100,
        fields: 'files(id, name, mimeType, parents)',
    });

    return folders_within_parent
}

export async function getAllFilesWithinFolder(drive: drive_v3.Drive, parent_folder_id:string) {
   
    logger.info("Got all drive files within " + parent_folder_id)
    // TODO pagination
    // TODO specify mimeType?
    return drive.files.list({
        q: `'${parent_folder_id}' in parents and trashed = false`,
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

export async function clearUsedOnDate(drive: drive_v3.Drive, file_id:string){
    const response = await drive.files.update({
        fileId: file_id,
        supportsAllDrives: true,
        requestBody: {
            appProperties: {
                usedOn: "" // set as empty string
            }
        },
        fields: 'id, name, appProperties'
    });
    
    logger.info("Successfully cleared ", file_id, " usedOn dates")
    return response.data
}
export async function setUsedOnDate(drive: drive_v3.Drive, file_id:string, date:string){
    // date ranges validated in cli.ts
    // TODO seperate this all into helper functions
    // TODO try catch for errors

    // get appProperties as string, append current arg to that, then update as result
    const metadata = await drive.files.get({
        fileId: file_id,
        fields: 'appProperties',
    });

    const fileAppProperties = metadata.data.appProperties
    const currProperties = fileAppProperties
                ? fileAppProperties.usedOn
                : "";

    const newProperties = currProperties + ", " + date
    const response = await drive.files.update({
        fileId: file_id,
        supportsAllDrives: true,
        requestBody: {
            appProperties: {
                usedOn: newProperties
            }
        },
        fields: 'id, name, appProperties'
  });
  logger.info("successfully updated ", file_id, "usedOn date to ", date)
  return response.data
}
