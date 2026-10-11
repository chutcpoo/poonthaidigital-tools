import fs from 'node:fs';
import zlib from 'node:zlib';

const parts = [
  'payload/part1.txt',
  'payload/part2a.txt',
  'payload/part2b.txt',
  'payload/part3a.txt',
  'payload/part3b.txt'
];

const base64 = parts.map((file) => fs.readFileSync(file, 'utf8').trim()).join('');
const compressed = Buffer.from(base64, 'base64');
const html = zlib.gunzipSync(compressed);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('Seller Content OS build complete:', html.length, 'bytes');
