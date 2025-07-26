import express, { Request, Response } from 'express';
import { getOauth2Client, authorize, oauth2callback } from './authController';

const app = express()
const oauth2Client = getOauth2Client()
const scope = "https://www.googleapis.com/auth/drive"
const request_state = 'gdcf-oath2-callback'

/*
techincally the following should be in routes then we import that, 
but not sure how much that form matters for this small authentication server
*/
app.get('/authorize', async (req: Request, res: Response) => {
    authorize(req, res, oauth2Client, scope, request_state)
})

app.get('/oauth2callback', async (req: Request, res: Response) => {
    oauth2Client.setCredentials(await oauth2callback(req, res, oauth2Client, request_state));
})

export { app, oauth2Client };
export default app;
