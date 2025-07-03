import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export function getOath2Client(){
    /*
        Read file contents to get oath2 keys and create authentication object
    */
   
    const key_file_path = path.join(__dirname, '../oath2.keys.json')
    if (!fs.existsSync(key_file_path)){
        const err_str = 
            "Key file path not found: " + 
            key_file_path + " does not exist"
        throw new Error(err_str)
    }
    const keys = JSON.parse(fs.readFileSync(key_file_path, 'utf8')).web;

    return new google.auth.OAuth2(
        keys.client_id,
        keys.client_secret,
        keys.redirect_uris[0],
    )
};
