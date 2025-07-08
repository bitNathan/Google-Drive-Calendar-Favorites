import {startServer, serverClosed} from './express/server'
import { startCLI } from './cli/cli';

async function main(){

  startServer()
  await serverClosed;

  startCLI()
}

main().catch(console.error);