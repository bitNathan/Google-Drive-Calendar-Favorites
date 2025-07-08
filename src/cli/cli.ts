import {getAllFiles, getFile} from './api'
import { google, drive_v3 } from 'googleapis';
import { oauth2Client } from '../express/app';
import readline from 'readline';
import { writeBufferToFile } from './writeToFile';
import logger from '../logger'

async function downloadFile(drive: drive_v3.Drive, rl: readline.Interface, onDone: () => void){
    
    console.log("Input any id into this field and press enter to download that file")
    rl.question('File ID: ', async (fileId) => {
        try {
            const {buffer: file_buffer, name: file_name} = await getFile(drive, fileId.trim());

            await writeBufferToFile(file_buffer, file_name);
            logger.info("Downloaded ", file_name)
        } catch (error) {
            console.error('Error downloading file:', error);
        }
        onDone(); // resume CLI prompt
    });
}

async function logFileList(drive: drive_v3.Drive){
    const res = await getAllFiles(drive)
    console.log('Files:');
        res.data.files?.forEach(file => {
        console.log(`  ${file.name} (${file.id})`);
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
                case 'q':
                case 'quit':
                    rl.close();
                    return;
                case 'h':
                case 'help':
                    // TODO auto show available commands
                    console.log("HELP: show all files with `ls`, download a file with `d`, quit with `q`")
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
