const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test/notifications?userId=69327a20497d40e9eb1cd438',
    method: 'GET',
    headers: {
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
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
