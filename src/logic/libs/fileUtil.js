var fs = require('fs');
var path = require("path");
async function pipeFile(filePath,currentPath) {
    let readable = fs.createReadStream(filePath);
    let writable = fs.createWriteStream(currentPath);
    readable.pipe(writable);
    return true;
}

export default {
    pipeFile:pipeFile
}