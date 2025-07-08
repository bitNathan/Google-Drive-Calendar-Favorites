import app from './app'
import logger from '../logger'

let server: any = null;
let serverClosedResolver: (() => void) | null = null;
export const serverClosed = new Promise<void>((resolve) => {
    serverClosedResolver = resolve;
});

export function startServer() {
    // TODO handle refresh tokens
    // TODO check if user needs to authorize, should only need to be done once per user
    // TODO should save tokens locally

    server = app.listen(process.env.PORT || 3000, () => {
        console.log('Follow this link to authenticate http://localhost:3000/authorize \n' +
            'Please be patient after completion. Authentication may take up to a minute');
    });

    logger.info("Server started")
}

export function shutdownServer() {
    if (server) {
        server.close(() => {
            logger.info("Server shutting down")
            if (serverClosedResolver) serverClosedResolver();
        });
    }
}