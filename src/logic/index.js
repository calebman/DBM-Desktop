import database from './system/database';
import datatable from './system/datatable';
import fileUtil from './libs/fileUtil';
import logUtil from './libs/logUtil';

logUtil.getLog('logic.index');
async function buildConn(config) {
    database.setConn(config);
    datatable.setConn(config);
    return true;
}
let logicFun = {
    buildConn:buildConn,
    getTablesData:database.getTablesData,
    importTableFromExcel:database.importTableFromExcel,
    editTable:database.editTable,
    deleteTable:database.deleteTable,
    changeTableName:database.changeTableName,
    getDataFromTable:datatable.getDataFromTable,
    updateDataFromTable:datatable.updateDataFromTable,
    insertDataFromTable:datatable.insertDataFromTable,
    deleteDataFromTable:datatable.deleteDataFromTable,
    exportExcelFromTable:datatable.exportExcelFromTable,
    exportExcelAndFileFromTable:datatable.exportExcelAndFileFromTable,
    pipeFile:fileUtil.pipeFile
}
function findLogicFun(logicName) {
    return logicFun[logicName];
}

let doLogic = async function (logicName,param) {
    logUtil.info('do '+logicName+' param '+JSON.stringify(param));
    let result;
    try{
        let func = findLogicFun(logicName);
        result = await func.apply(null,param);
    }catch(err) {
        logUtil.error(err);
        result = null;
    }finally {
        logUtil.log(logicName+' return '+result);
        return result;
    }
}

export default{
    doLogic:doLogic
}