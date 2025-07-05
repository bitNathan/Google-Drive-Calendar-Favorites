import app from './app'

let server: any = null;
let serverClosedResolver: (() => void) | null = null;
export const serverClosed = new Promise<void>((resolve) => {
    serverClosedResolver = resolve;
});

export function startServer() {
    // TODO handle refresh tokens
    // TODO check if user needs to authorize, should only need to be done once per user

    server = app.listen(process.env.PORT || 3000, () => {
        console.log('Follow this link to authenticate http://localhost:3000/authorize');
    });
}

export function shutdownServer() {
    if (server) {
        server.close(() => {
            console.log('Server shutting down.');
            if (serverClosedResolver) serverClosedResolver();
        });
    }
}