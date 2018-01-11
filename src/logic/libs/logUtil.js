var moment = require('moment');
var fs = require('fs');
var LOG = {
    log:"log",
    info:"info",
    warn:"warn",
    error:"error",
    sql:"sql"
}
var position = '';
function getLog(pos) {
    position = pos;
}
function show(flag,text) {
    let time = moment().format("YYYY-MM-DD HH:mm:ss");
    let showPosition = position==''?'':' ['+position+'] ';
    let showFlag = ' ['+flag+'] ';
    let logText = time+showPosition+showFlag+text+'\r\n';
    switch (flag){
        case LOG.log:
            console.log(logText);
            break;
        case LOG.info:
            console.info(logText);
            break;
        case LOG.warn:
            console.warn(logText);
            break;
        case LOG.error:
            console.error(logText);
            break;
    }
    // let path = 'C:\\Users\\Lenovo\\Desktop\\';
    // let fileName = 'DBM-'+moment().format("YYYY-MM-DD")+'.log';
    // let filePath = path+fileName;
    // fs.appendFile(filePath,logText,'utf8');
}

function log(text) {
    show(LOG.log,text);
}
function info(text) {
    show(LOG.info,text);
}
function warn(text) {
    show(LOG.warn,text);
}
function error(text) {
    show(LOG.error,text);
}

export default{
    LOG:LOG,
    getLog:getLog,
    log:log,
    info:info,
    warn:warn,
    error:error
}