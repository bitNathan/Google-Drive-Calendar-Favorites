import path from "path"
import { promises as fs } from "fs";

export async function saveFileData(file_data:ArrayBuffer, file_name:string){
    // TODO file_path arg
    const save_dir = path.join(__dirname, '../downloads/')

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
