import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug-notifications.log');

export function logDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;

    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (error) {
        // Fail silently to avoid breaking app
        console.error('Failed to write to debug log:', error);
    }
}
