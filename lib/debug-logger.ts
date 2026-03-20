import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug-notifications.log');

export function logDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();

    // Format the log for the console instead of a file
    if (data) {
        console.log(`[DEBUG][${timestamp}] ${message}`, data);
    } else {
        console.log(`[DEBUG][${timestamp}] ${message}`);
    }
}
