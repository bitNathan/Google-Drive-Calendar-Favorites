import {getAllFiles, getFileContents, getFileProperties, setUsedOnDate} from './api'
import { google, drive_v3 } from 'googleapis';
import { oauth2Client } from '../express/app';
import readline from 'readline';
import { writeBufferToFile } from './writeToFile';
import logger from '../logger'

// TODO make helper fuynction for all these prompt things
// TODO fully integrate with logger

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

async function logFileList(drive: drive_v3.Drive){
    const res = await getAllFiles(drive)
    console.log('Files:');
        res.data.files?.forEach(file => {
        console.log(`  ${file.name} (${file.id})`);
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

async function setUsedOnDateCLI(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    console.log("Input any id into this field, press enter, then input a date and hit enter again.")
    rl.question('File ID: ', async (fileId) => {
        rl.question('Date: ', async (date) => {
            try {
                await setUsedOnDate(drive, fileId, date)
            } catch (error) {
                logger.error('Error setting used on date:', error);
            }
            onDone(); // resume after second prompt completes, not first
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

    async function prompt() {
        rl.question('Enter a command: ', async (input) => {
            switch (input.trim()) {
                case 'ls':
                case 'files':
                case 'list':
                    await logFileList(drive);
                    prompt();
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
                case 'q':
                case 'quit':
                    rl.close();
                    return;
                case 'h':
                case 'help':
                    // TODO auto show available commands
                    console.log("HELP: "+
                        "\n  show all files with `ls`, download a file with `d`, quit with `q`"+
                        "\n  see a file's properties with p, and set a file's properties with s")
                    prompt();
                    break;
                default:
                    console.log('Unknown command. Use `h` or `help` to see all possible commands');
                    prompt();
            }
        });
    }
    prompt();
    
}
