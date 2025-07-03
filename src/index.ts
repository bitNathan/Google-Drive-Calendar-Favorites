const {google} = require('googleapis');
const path = require('path');
const fs = require('fs');
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import {getOath2Client} from './authController'

async function main(){
  const app = express();

  console.log("Starting Google Drive Favorites Calendar")

  // documentation https://www.npmjs.com/package/googleapis#google-apis

  // TODO split auth into authController and call once here
  const oauth2Client = getOath2Client()

  const scope = "https://www.googleapis.com/auth/drive"
  const request_state = 'gdcf-oath2-callback'

  app.get('/authorize', (req: Request, res: Response) => {
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scope,
        state: request_state,
      });
      res.redirect(url);
  });

  app.get('/oath2callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    // TODO update to return value
    if (!code){res.send('Missing authorization code.')}
    else if (!state || state != request_state){res.send('Invalid state. Possible CSRF.')}
    else{
      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.send('✔️ Authentication successful! You are now free to close this page.');
        
        // TODO add next steps here so that after authentication we do stuff with the api key
        // TODO takes some time to kill server sometimes, investigate
        res.on('finish', () => {
          server.close(() => {
            console.log("Authentication completed and server closed. Exiting.");
            process.exit(0);
          });
        });
      } catch (err) {
        console.error(err);
        res.status(500).send('Authentication failed');
       }
    }
  });

  // TODO handle refresh tokens
  var server = app.listen(3000, () =>
    // TODO check if user needs to authorize, should only need to be done once per user
    console.log('Please navigate to: http://localhost:3000/authorize')
  );

}

main().catch(console.error);