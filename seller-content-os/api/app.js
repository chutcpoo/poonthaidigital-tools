const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

module.exports = (req, res) => {
  try {
    const file = path.join(__dirname, '..', 'app.dat');
    const compressed = fs.readFileSync(file);
    const html = zlib.gunzipSync(compressed);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.end(html);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Seller Content OS load error: ' + error.message);
  }
};
