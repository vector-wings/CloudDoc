const fs = require('fs')
const zlib = require('zlib')

// 创建可读流
const src = fs.createReadStream('./test.js')

// 创建可写流
const writeDesc = fs.createWriteStream('./test.gz')

src.pipe(zlib.createGzip()).pipe(writeDesc)