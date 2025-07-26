import {startServer, serverClosed} from './express/server'
import { startCLI } from './cli/cli';

async function main(){

  const wasServerStarted = await startServer()
  if (wasServerStarted) await serverClosed;

  startCLI()
}

main().catch(console.error);
