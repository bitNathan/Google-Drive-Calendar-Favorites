import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Request, Response} from 'express';
import { shutdownServer } from './server';
import {oauthFilePath} from "../config"
import logger from '../logger'

function saveAccessToken(json_tokens:string){
    // TODO encrypt storage files
    const data = json_tokens
    try {
        fs.writeFileSync(oauthFilePath, data, { encoding: 'utf8' });
        return true;
    } catch (err) {
        logger.error("Failed to save access token:", err);
        return false;
    }
}

function loadTokens(){
    // TODO decrypt storage
    // validation currently done in server.ts
    
    if (!fs.existsSync(oauthFilePath)) {
        logger.error(`OAuth file does not exist: ${oauthFilePath}`);
        return null;
    }
    
    try {
        const data = fs.readFileSync(oauthFilePath, { encoding: 'utf8' });
        
        // TODO json validation?
        const jsonData = JSON.parse(data);
        
        return jsonData;
    } catch (err) {
        logger.error(`Failed to read tokens from file ${oauthFilePath}:`, err);
        return false;
    }
}

export function getOauth2Client(){
    // Read file contents to get oath2 keys and create authentication object
   
    const key_file_path = path.join(__dirname, '../../oath2.keys.json') // TODO get from config file or just use absolute path
    if (!fs.existsSync(key_file_path)){
        const err_str = 
            "Key file path not found: " + 
            key_file_path + " does not exist"
        throw new Error(err_str)
    }
    const keys = JSON.parse(fs.readFileSync(key_file_path, 'utf8')).web;

    const oauth2Client = new google.auth.OAuth2(
        keys.client_id,
        keys.client_secret,
        keys.redirect_uris[0],
    )

    // set credentials to encrypted tokens if we have them
    // currently server.ts chercks validity/expiry date of the tokens
    const tokens = loadTokens()
    logger.debug(`loadTokens() (in authController) returned:`, tokens);
    
    if (tokens){
        oauth2Client.setCredentials({
            access_token: tokens.access_token, 
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date
        })
    } else {
        logger.info(`No tokens found on startup, OAuth2Client will not have credentials set`);
    }

    // TODO when deploying to web change token persistance to work on render's postgress db
    // set a handler so that we automatically request new refresh tokens as needed
    oauth2Client.on('tokens', (tokens) => {
        // FIX: Preserve existing refresh token when saving new tokens
        // Google doesn't always send refresh tokens on token refresh - only on initial auth
        const existingTokens = loadTokens();
        const existingRefreshToken = existingTokens?.refresh_token;
        
        // FIX: Build new token object preserving refresh token if not provided
        const tokensToSave: any = {};
        
        if (tokens.access_token) {
            tokensToSave.access_token = tokens.access_token;
        }
        
        if (tokens.expiry_date) {
            tokensToSave.expiry_date = tokens.expiry_date;
        }
        
        // Use new refresh token if provided, otherwise keep existing one
        if (tokens.refresh_token) {
            tokensToSave.refresh_token = tokens.refresh_token;
        } else if (existingRefreshToken) {
            tokensToSave.refresh_token = existingRefreshToken;
            logger.info("Preserving existing refresh token during token update");
        }
        
        if (Object.keys(tokensToSave).length > 0) {
            const success = saveAccessToken(JSON.stringify(tokensToSave));
            if (success) {
                logger.info("Successfully saved OAuth2 tokens to file");
            } else {
                logger.error("Failed to save OAuth2 tokens to file");
            }
        } else {
            logger.error("No valid tokens to save");
        }
    });

    return oauth2Client
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
        logger.error(err);
        res.status(500).send('Authentication failed');
       }
       return 0
    }
}
