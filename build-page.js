// Joins the source parts in src/ into app/index.html. Run by "npm start" and "npm run dist".
const fs=require('fs'),path=require('path');
const order=['p1.html','p2.js','p3.js','p4a.js','p4b.js','p5a.js','p6.js','p7.js','p8.js','p9.js','p5b.js'];
const body=order.map(f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8')).join('');
const html='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui}</style></head><body>\n'+body+'\n</body></html>\n';
fs.mkdirSync(path.join(__dirname,'app'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'app','index.html'),html);
console.log('app/index.html written ('+Math.round(html.length/1024)+' KB)');
