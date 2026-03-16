const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
    type: 'SYSTEM_ANNOUNCEMENT',
    recipientId: '69327a20497d40e9eb1cd438' // Verified Valid User: Thakkar Bhavya
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test/notifications',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-test-secret': 'bhavya-debug-secret'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('BODY:', body);
        fs.writeFileSync('test-api-response.json', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
