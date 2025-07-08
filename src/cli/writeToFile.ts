import path from "path"
import { promises as fs } from "fs";
import {downloadDir} from '../config'

export async function writeBufferToFile(file_data:ArrayBuffer, file_name:string){
    const save_dir = downloadDir
    // TODO assert file contains extension and log a warning if not

    // check if save_dir exists and create if not
    try {
        await fs.access(save_dir);
    } catch {
        await fs.mkdir(save_dir, { recursive: true });
    }

    const file_path = path.join(save_dir, file_name);
    const buffer = Buffer.from(file_data)
    fs.writeFile(file_path, buffer)
}
