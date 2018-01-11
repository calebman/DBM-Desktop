var squel = require('squel');
var xlsx = require('node-xlsx');
var moment = require('moment');
var fs = require('fs');

import conn from '../mysql/connection';
import systemUtil from '../libs/systemUtil';

var setConn = function (config) {
    if(config)
        conn.buildPool(config);
    else conn.buildPool({});
}

var getDataFromTable = async function (tableName,filterParam,pagination) {
    let result = {
        tableData:[],
        pagination:{}
    };
    let sql = "";
    sql = squel.select().from(conn.config.database+'.'+tableName)
        .field('count(1)','count').where(systemUtil.createFilter(tableName,filterParam)).toString();
    let dataCount = await conn.execute(sql);
    sql = squel.select().from(conn.config.database+'.'+tableName)
        .where(systemUtil.createFilter(tableName,filterParam));
    if(pagination){
        result.pagination = pagination;
        sql.limit(result.pagination.pageSize).offset(((result.pagination.pageCurrent-1)*result.pagination.pageSize));
        result.pagination.totalCount = dataCount[0].count;
    }
    result.tableData = await conn.execute(sql.toString());
    return result;
}

var updateDataFromTable = async function (table, rowData, field, newValue, appFilePath ,filePath) {
    if(newValue instanceof Date) newValue = moment(newValue).format('YYYY-MM-DD HH:mm:ss');
    let sql = squel.update().table(conn.config.database+'.'+table.tableName).set(field,newValue).where(systemUtil.createExpr(table,rowData)).limit(1);
    if(systemUtil.isTextColumn(table.cols,field)){
        let oldData = {dir:'',files:[]};
        if(systemUtil.isFileColumn(rowData[field]))
            oldData = JSON.parse(rowData[field]);
        let newData = JSON.parse(newValue);
        let differenceObj = systemUtil.difference(oldData.files,newData.files);
        if(differenceObj.isAdd){
            let readFilePath = filePath;
            let writeFilePath = appFilePath+'\\'+newData.dir;
            systemUtil.mkdirsSync(writeFilePath);
            let readOs = fs.createReadStream(readFilePath);
            let writeOs = fs.createWriteStream((writeFilePath+"\\"+filePath.substring(filePath.lastIndexOf('\\')+1,filePath.length)));
            readOs.pipe(writeOs);
        }else{
            for(let index in differenceObj.data){
                let deletePath = appFilePath+'\\'+newData.dir+"\\"+differenceObj.data[index];
                fs.unlinkSync(deletePath);
            }
        }
    }
    return await conn.execute(sql.toString());
}

var insertDataFromTable = async function (table,rowData) {
    let sql = squel.insert().into(conn.config.database+'.'+table.tableName);
    for(let key in rowData){
        let value = rowData[key];
        sql.set(key,value);
    }
    return await conn.execute(sql.toString());
}

var deleteDataFromTable = async function (table, rowData, appFilePath) {
    let sql = squel.delete().from(conn.config.database+'.'+table.tableName).where(systemUtil.createExpr(table,rowData)).limit(1).toString();
    let textColumns = systemUtil.getTextColumn(table.cols);
    for(let index in textColumns){
        let textColName = textColumns[index].columnName;
        if(systemUtil.isFileColumn(rowData[textColName])){
            let deletePath = appFilePath+'/' + JSON.stringify(rowData[textColName]).dir;
            systemUtil.deleteall(deletePath);
        }
    }
    return await conn.execute(sql);
}

var exportExcelFromTable = async function (table,filterParam,filePath) {
    let sql = squel.select().from(conn.config.database+'.'+table.tableName)
        .where(systemUtil.createFilter(table.tableName,filterParam));
    let columns = table.cols.map(function (item) {
        return item['columnName'];
    })
    let result =  await conn.execute(sql);
    let data = result.map(function (item) {
        let itemData = [];
        for(let key in item)
            itemData.push(item[key]);
        return itemData;
    })
    data.splice(0,0,columns);
    var buffer = xlsx.build([{name: "sheet", data: data}]);
    fs.writeFileSync(filePath, buffer, 'binary');
    return true;
}

var exportExcelAndFileFromTable =  async function (table,filterParam,dirPath,appFilePath) {
    let rootPath = dirPath+"\\"+table.tableName;
    systemUtil.mkdirsSync(rootPath);
    let sql = squel.select().from(conn.config.database+'.'+table.tableName)
        .where(systemUtil.createFilter(table.tableName,filterParam));
    let textColumns = [];
    let columns = table.cols.map(function (item) {
        if(item['dataType'] == 'text')
            textColumns.push(item['columnName']);
        return item['columnName'];
    })
    let result =  await conn.execute(sql);
    let fileNameItems = [];
    let fileSavePath = '';
    let readFilePath = '';
    let writeFilePath = '';
    let readable ;
    let writable ;
    let data = [];
    for(let itemIndex in result){
        let item = result[itemIndex];
        fileSavePath = rootPath+'\\row'+(parseInt(itemIndex)+1);
        let itemData = [];
        let fileNameStr = '';
        for(let key in item){
            if(textColumns.indexOf(key) > -1){
                if(systemUtil.isFileColumn(item[key])){
                    systemUtil.mkdirsSync(fileSavePath);
                    let fileItem = JSON.parse(item[key]);
                    fileNameItems = fileItem.files;
                    for(let fileNameIndex in fileNameItems){
                        readFilePath = appFilePath+'\\'+fileItem.dir+'\\'+fileNameItems[fileNameIndex];
                        writeFilePath = fileSavePath+'\\'+fileNameItems[fileNameIndex];
                        fileNameStr += writeFilePath+';';
                        readable = fs.createReadStream(readFilePath);
                        writable = fs.createWriteStream(writeFilePath);
                        readable.pipe(writable);
                    }
                    itemData.push(fileNameStr.substring(0,fileNameStr.length-1));
                }else itemData.push('无附件');
            }else itemData.push(item[key]);
        }
        data.push(itemData);
    }
    data.splice(0,0,columns);
    console.log(data)
    var buffer = xlsx.build([{name: "sheet", data: data}]);
    fs.writeFileSync(rootPath+"\\"+table.tableName+".xlsx", buffer, 'binary');
    return true;
}


export default{
    setConn:setConn,
    getDataFromTable:getDataFromTable,
    updateDataFromTable:updateDataFromTable,
    insertDataFromTable:insertDataFromTable,
    deleteDataFromTable:deleteDataFromTable,
    exportExcelFromTable:exportExcelFromTable,
    exportExcelAndFileFromTable:exportExcelAndFileFromTable
}