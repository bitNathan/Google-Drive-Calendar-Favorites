import config from 'config';
import path from 'path';

const downloadDirRel: string = config.get('downloads.directory');
const downloadDir = path.resolve(process.cwd(), downloadDirRel);

const logLevel: string = config.get('logging.level');

const logFileRelPath: string = config.get('logging.file');
const logFilePath = path.resolve(process.cwd(), logFileRelPath);

export { downloadDir, logLevel, logFilePath };
