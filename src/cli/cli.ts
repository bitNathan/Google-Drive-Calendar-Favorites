import {getAllFilesWithinFolder, clearUsedOnDate, getFileContents, getFileProperties, setUsedOnDate, getAllFoldersWithinFolder} from './api'
import { google, drive_v3 } from 'googleapis';
import { oauth2Client } from '../express/app';
import readline from 'readline';
import { writeBufferToFile } from './writeToFile';
import logger from '../logger'
import { parse, isValid } from 'date-fns';

async function downloadFile(drive: drive_v3.Drive, args: Array<string>){
    const fileId = args[0]?.trim()
    if (!fileId) {
        console.log("Error: File ID is required")
        console.log("Usage: download <fileId>")
        return
    }

    try {
        const {buffer: file_buffer, name: file_name} = await getFileContents(drive, fileId);

        await writeBufferToFile(file_buffer, file_name);
        logger.info("Downloaded ", file_name)
    } catch (error) {
        logger.error('Error downloading file:', error);
    }
}

async function logFoldersWithinFolder(drive: drive_v3.Drive, args: Array<string>){
    
    let folderID = args[0]?.trim() || "root"
    const folders = await getAllFoldersWithinFolder(drive, folderID);

    try {
        console.log('Folders:');
        folders.data.files?.forEach(file => {
            console.log(`  ${file.name} (${file.id})`);
        });
    } catch (error) {
        logger.error('Error fetching folders:', error);
    }
}

async function logFileList(drive: drive_v3.Drive, args: Array<string>){
    let folderID = args[0]?.trim() || "root"
    
    try {
        const files = await getAllFilesWithinFolder(drive, folderID);

        console.log('Files within ' + folderID +":");
        files.data.files?.forEach(file => {
            console.log(`  ${file.name} (${file.id})`);
        });
    } catch (error) {
        logger.error('Error fetching files:', error);
    }
}

async function logFileProperties(drive: drive_v3.Drive, args: Array<string>){
    const fileId = args[0]?.trim()
    if (!fileId) {
        console.log("Error: File ID is required")
        console.log("Usage: properties <fileId>")
        return
    }

    try {
        const fileProperties = await getFileProperties(drive, fileId);
        // if properties, then properties, else empty string log
        const propertyList = fileProperties.appProperties
            ? JSON.stringify(fileProperties.appProperties, null, 2)
            : "No properties on this file";
        
        console.log("Properties of " + fileProperties.name + 
            "\n  User can edit file: " + fileProperties.capabilities?.canEdit +
            "\n  List of any appProperties: " + propertyList
        )

    } catch (error) {
        logger.error('Error viewing properties of this file:', error);
    }
}

function isStrValidDate(date:string){
    const parsedDate = parse(date.trim(), "yyyyMMdd", new Date)

    return isValid(parsedDate)
}

function isValidDateRange(start:string, end:string){
    const start_date = parse(start.trim(), "yyyyMMdd", new Date)
    const end_date = parse(end.trim(), "yyyyMMdd", new Date)

    if (isValid(start_date) && isValid(end_date) && start_date <= end_date) return true
    return false
}

async function setUsedOnDateCLI(drive: drive_v3.Drive, args: Array<string>){
    const fileId = args[0]?.trim()
    const userDateStr = args[1]?.trim()
    
    if (!fileId) {
        console.log("Error: File ID is required")
        console.log("Usage: set <fileId> <date>")
        console.log("Date format: yyyyMMdd, or \"yyyyMMdd - yyyyMMdd\" for ranges, or \"yyyyMMdd, yyyyMMdd, ...\" for multiple dates")
        return
    }
    
    if (!userDateStr) {
        console.log("Error: Date is required")
        console.log("Usage: set <fileId> <date>")
        console.log("Date format: yyyyMMdd, or \"yyyyMMdd - yyyyMMdd\" for ranges, or \"yyyyMMdd, yyyyMMdd, ...\" for multiple dates")
        return
    }

    try {
        userDateStr.split(',').forEach(part => {
            // split userDateStr on commas and validate seperately, send one big string to func
            // if data contains "-" then it's a range and validate each part
            if (part.includes("-")){
                const [start, end] = part.split('-').map(s => s.trim());
                if (!isValidDateRange(start, end)) throw new Error("Invalid date range\n  "+
                    part + "is not a valid date range"
                )
            }
            else{
                // handle comma seperated and single dates
                if (!isStrValidDate(part)) throw new Error("Invalid date format\n" + 
                    "  got date -> " + part +"\n  Expected yyyyMMdd format")
            }
        });
        // writes a single date, comma seperated list, or a range via hyphen
        await setUsedOnDate(drive, fileId, userDateStr)
    } catch (error) {
        logger.error('Error setting used on date:', error);
    }
}

async function clearUsedOnDateCLI(drive: drive_v3.Drive, args: Array<string>){
    const fileId = args[0]?.trim()
    if (!fileId) {
        console.log("Error: File ID is required")
        console.log("Usage: clear <fileId>")
        return
    }

    try {
        await clearUsedOnDate(drive, fileId)
    } catch (error) {
        logger.error('Error clearing file used on properties:', error);
    }
}

async function parseCommand(input:string, drive: drive_v3.Drive){
    const splitCommand = input.split(" ")
    const command = splitCommand[0]
    const args = splitCommand.slice(1);
    let shouldContinue = true

    switch (command) {
        case 'folders':
        case 'f':
            await logFoldersWithinFolder(drive, args);
            break;
        case 'ls':
        case 'files':
        case 'list':
            await logFileList(drive, args);
            break;
        case 'd':
        case 'download':
            await downloadFile(drive, args);
            break;
        case 'p':
        case 'properties':
            await logFileProperties(drive, args)
            break;
        case 's':
        case 'set':
            await setUsedOnDateCLI(drive, args) // TODO bad naming, should change when I have an idea
            break;
        case 'c':
        case 'clear':
            await clearUsedOnDateCLI(drive, args)
            break;
        case 'q':
        case 'quit':
            shouldContinue = false
            break;
        case 'h':
        case 'help':
            // TODO auto show available commands
            console.log("HELP: "+
                "\n  show all files with `ls`, download a file with `d`, quit with `q`"+
                "\n  see a file's properties with p, and set a file's properties with s" +
                "\n  press c to clear a file's usedOn data")
            break;
        default:
            console.log('Unknown command. Use `h` or `help` to see all possible commands');
    }
    return shouldContinue
}

async function prompt(rl: readline.Interface, drive: drive_v3.Drive): Promise<boolean> {
    return new Promise((resolve) => {
        rl.question('Enter a command: ', async (input) => {
            const shouldContinue = await parseCommand(input.trim(), drive);
            resolve(shouldContinue);
        });
    });
}

export async function startCLI(){
    const drive = google.drive({ version: 'v3', auth: oauth2Client });  
    
    console.log("Welcome to the Google Drive Calendar CLI")
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let shouldContinue = true
    while (shouldContinue){
        shouldContinue  = await prompt(rl, drive);
    }

    rl.close()
    
}
