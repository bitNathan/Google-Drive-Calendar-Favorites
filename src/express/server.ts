import {app, oauth2Client} from './app'
import logger from '../logger'

let server: any = null;
let serverClosedResolver: (() => void) | null = null;
export const serverClosed = new Promise<void>((resolve) => {
    serverClosedResolver = resolve;
});

function startAuthServer(){
    server = app.listen(process.env.PORT || 3000, () => {
        console.log('Follow this link to authenticate http://localhost:3000/authorize \n' +
        'Please be patient after completion. Authentication may take up to a minute');
    });
    return server
}

export async function startServer() {

    // check for valid access token and ask user to authenticate if we don't see one
    const credentials = oauth2Client.credentials
    if (!credentials.access_token){
        // No valid tokens, ask user to authenticate
        logger.info('No valid OAuth2 tokens found. User needs to authenticate.');
        server = startAuthServer()
        logger.info("Server started");
        return true
    }

    if (!credentials.expiry_date || credentials.expiry_date <= Date.now()){
        logger.info("Oauth credentials are expired or did not have valid expiration date")
        
        if (!credentials.refresh_token) {
            logger.info("No refresh token available - user must re-authenticate");
            server = startAuthServer()
            logger.info("Server started for re-authentication due to missing refresh token");
            return true
        }
        
        // if we do have refresh token (but is expired) then refresh it
        try {
            logger.info("Attempting to refresh access token using refresh token")
            const tokens = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(tokens.credentials || tokens);
            logger.info("Successfully refreshed OAuth2 tokens, no server startup needed.");
            
            return false
        } catch (err) {
            logger.error("Failed to refresh OAuth2 tokens:", err);
            
            // if we can't refresh tokens then we need user to re-authenticate to get new ones
            server = startAuthServer()
            logger.info("Server started for re-authentication");
            return true
        }
    }

    logger.info("Found valid oauth2 credentials on startup, no server startup needed")
    return false
}

export function shutdownServer() {
    if (server) {
        server.close(() => {
            logger.info("Server shutting down")
            if (serverClosedResolver) serverClosedResolver();
        });
    }
}
