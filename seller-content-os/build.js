const fs = require('fs');
const zlib = require('zlib');

const compressed = fs.readFileSync('app.dat');
const html = zlib.gunzipSync(compressed);
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('Seller Content OS build complete:', html.length, 'bytes');
