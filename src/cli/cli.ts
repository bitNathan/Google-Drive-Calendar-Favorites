import {getAllFilesWithinFolder, clearUsedOnDate, getFileContents, getFileProperties, setUsedOnDate, getAllFoldersWithinFolder} from './api'
import { google, drive_v3 } from 'googleapis';
import { oauth2Client } from '../express/app';
import readline from 'readline';
import { writeBufferToFile } from './writeToFile';
import logger from '../logger'
import { parse, isValid } from 'date-fns';

// TODO make helper fuynction for all these prompt things
// TODO fully integrate with logger
// TODO instead of having several prompts for each, parse the initial arg and use that info

async function downloadFile(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    
    console.log("Input any id into this field and press enter to download that file")
    rl.question('File ID: ', async (fileId) => {
        try {
            const {buffer: file_buffer, name: file_name} = await getFileContents(drive, fileId.trim());

            await writeBufferToFile(file_buffer, file_name);
            logger.info("Downloaded ", file_name)
        } catch (error) {
            logger.error('Error downloading file:', error);
        }
        onDone(); // resume CLI
    });
}

async function logFoldersWithinFolder(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    console.log("Input a folder id to get folders within that folder (keep blank to get folders within root)")
    rl.question('File ID: ', async (folderID) => {try {
        if (folderID.trim() == "") folderID = "root"
        const folders = await getAllFoldersWithinFolder(drive, folderID);

        console.log('Folders:');
        folders.data.files?.forEach(file => {
            console.log(`  ${file.name} (${file.id})`);
        });
        } catch (error) {
            logger.error('Error fetching folders:', error);
        }
        onDone();
    });
}

async function logFileList(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    console.log("Input a folder id to get files within that folder (keep blank to get files within root)")
    rl.question('File ID: ', async (folderID) => {try {
        if (folderID.trim() == "") folderID = "root"
        const files = await getAllFilesWithinFolder(drive, folderID);

        console.log('Files within ' + folderID +":");
        files.data.files?.forEach(file => {
            console.log(`  ${file.name} (${file.id})`);
        });
        } catch (error) {
            logger.error('Error fetching files:', error);
        }
        onDone();
    });
}

async function logFileProperties(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    
    console.log("Input any id into this field and press enter to view that file's properties")
    rl.question('File ID: ', async (fileId) => {
        try {
            const fileProperties = await getFileProperties(drive, fileId.trim());
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
        onDone(); // resume CLI
    });
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

async function setUsedOnDateCLI(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    console.log("Input any id into this field, press enter, then input a date (with format yyyyMMdd) and hit enter again."+
        "\n  To input a date range use format \"yyyyMMdd - yyyyMMdd\". To input multiple dates use format yyyyMMdd, yyyyMMdd, ..."
    )
    rl.question('File ID: ', async (fileId) => {
        rl.question('Date: ', async (userDateStr) => {
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
            onDone(); // resume after second prompt completes, not first
        });
    });
}

async function clearUsedOnDateCLI(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    console.log("Input any id into this field to clear the last used properties.")
    rl.question('File ID: ', async (fileId) => {
        try {
            await clearUsedOnDate(drive, fileId)
        } catch (error) {
            logger.error('Error clearing file used on properties:', error);
        }
        onDone(); // resume after second prompt completes, not first
    });
}
export async function startCLI(){
    const drive = google.drive({ version: 'v3', auth: oauth2Client });  
    
    console.log("Welcome to the Google Drive Calendar CLI")
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    async function prompt() {
        rl.question('Enter a command: ', async (input) => {
            switch (input.trim()) {
                case 'folders':
                case 'f':
                    await logFoldersWithinFolder(drive, rl, prompt);
                    break;
                case 'ls':
                case 'files':
                case 'list':
                    await logFileList(drive, rl, prompt);
                    break;
                case 'd':
                case 'download':
                    await downloadFile(drive, rl, prompt);
                    break;
                case 'p':
                case 'properties':
                    await logFileProperties(drive, rl, prompt)
                    break;
                case 's':
                case 'set':
                    await setUsedOnDateCLI(drive, rl, prompt) // TODO bad naming, should change when I have an idea
                    break;
                case 'c':
                case 'clear':
                    await clearUsedOnDateCLI(drive, rl, prompt)
                    break;
                case 'q':
                case 'quit':
                    rl.close();
                    return;
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
                    prompt();
            }
        });
    }
    prompt();
    
}
