import {startServer, serverClosed} from './express/server'
import { google } from 'googleapis';
import { oauth2Client } from './express/app'; // if we ever need it here...

async function main(){

  console.log("Starting Google Drive Favorites Calendar")

  startServer()
  // TODO should save tokens locally
  console.log("Please be patient after completion. Authentication may take up to a minute")
  
  await serverClosed;

  // temporary testing code that lists all files within user's google drive
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const res = await drive.files.list({
    pageSize: 100,
    fields: 'files(id, name)',
  });

  console.log('Files:');
  res.data.files?.forEach(file => {
    console.log(`  ${file.name} (${file.id})`);
  });
}

main().catch(console.error);