import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Request, Response} from 'express';
import { shutdownServer } from './server';

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

export async function authorize(req: Request, res: Response, oauth2Client:any, scope:string, request_state:string){
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scope,
        state: request_state,
        });
    res.redirect(url);
}

export async function oauth2callback(req: Request, res: Response, oauth2Client:any, request_state:string){
    const code = req.query.code as string;
    const state = req.query.state as string;
    res.set('Connection', 'close');

    if (!code){res.send('Missing authorization code.')}
    else if (!state || state != request_state){res.send('Invalid state. Possible CSRF.')}
    else{
      try {
        const { tokens } = await oauth2Client.getToken(code);
        res.send('Authentication successful! You are now free to close this page.');
        
        shutdownServer()
        return tokens
      } catch (err) {
        console.error(err);
        res.status(500).send('Authentication failed');
       }
       return 0
    }
}
