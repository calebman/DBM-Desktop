var squel = require('squel');
var xlsx = require('node-xlsx');
var fs = require('fs');
import conn from '../mysql/connection';

var setConn = function (config) {
    if(config)
        conn.buildPool(config);
    else conn.buildPool({});
}

var getTablesData = async function () {
    let result = [];
    let sql = "";
    sql = squel.select().from('information_schema.tables')
        .field('table_name','tableName')
        .field('table_rows','count')
        .where('table_schema = ?',conn.config.database)
        .where('table_type = ?','base table').toString();
    let tables = await conn.execute(sql);
    let tableNamesIn = '(';
    for(let index in tables){
        let item = tables[index];
        tableNamesIn = tableNamesIn+("'"+item.tableName+"',")
        result.push({
            tableName:item.tableName,
            dataCount:item.count,
            cols:[]
        })
    }
    tableNamesIn = tableNamesIn.substring(0,tableNamesIn.length-1)+')';
    sql = squel.select().from('information_schema.columns')
        .field('table_name','tableName')
        .field('column_name','columnName')
        .field('column_key','columnKey')
        .field('column_default','columnDefault')
        .field('is_nullable','isNullable')
        .field('data_type','dataType')
        .where('table_name IN '+tableNamesIn)
        .where('table_schema = ?',conn.config.database).toString();
    let cols = await conn.execute(sql);
    let col = {};
    let table = {};
    for(let index in cols){
        col = cols[index];
        for(let tableIndex in result){
            table = result[tableIndex];
            if(col.tableName == table.tableName){
                delete col.tableName;
                table.cols.push(col);
            }
        }
    }
    return result;
};

var editTable = async function (table,oldColumn,newColumn) {
    let sql = '';
    if(oldColumn) sql = createUpdateColumnSql(table,oldColumn,newColumn);
    else sql = createAddColumnSql(table,newColumn);
    return await conn.execute(sql);
}

var deleteTable = async function (table,deleteColumns) {
    if(deleteColumns&&deleteColumns.length>0){
        return await conn.execute(createDeleteColumnSql(table,deleteColumns));
    }else return await conn.execute('DROP TABLE '+conn.config.database+'.'+table.tableName);
}

var changeTableName = async function (oldTableName,newTableName) {
    return await conn.execute('ALTER TABLE '+oldTableName+' RENAME TO '+newTableName);
}

var importTableFromExcel = async function(tables,filePath) {
    const workSheetsFromFile = xlsx.parse(filePath);
    let fileName = filePath.substring(filePath.lastIndexOf('\\')+1, filePath.indexOf('.'));
    if(workSheetsFromFile.length < 1)
        return null;
    if(workSheetsFromFile[0].length < 1)
        return null;
    let header = JSON.parse(JSON.stringify(workSheetsFromFile[0].data[0]));
    workSheetsFromFile[0].data.splice(0,1);
    let body = [];
    for(let index in workSheetsFromFile[0].data){
        let item = {};
        for(let jndex in header){
            let text = workSheetsFromFile[0].data[index][jndex];
            if(text.length > 240) text = text.substring(0,240);
            item[header[jndex]] = text;
        }
        body.push(item);
    }
    let convertedData = {
        header:header,
        body:body
    };
    let importTable = getImportTable(tables,convertedData,fileName);
    let sqls = getImportTableSql(importTable,convertedData);
    await conn.execute(sqls.createTableSql);
    await conn.execute(sqls.insertDataSql);
    return importTable;
}

function createDeleteColumnSql(table,deleteColumns) {
    let col = {};
    let sql = 'ALTER TABLE '+conn.config.database+'.'+table.tableName;
    for(let index in deleteColumns){
        col = deleteColumns[index];
        sql+= ' drop '+col.columnName+',';
    }
    sql=sql.substring(0,sql.length-1);
    return sql;
}

function createAddColumnSql(table,column) {
    let sql = 'ALTER TABLE '+table.tableName+' ADD COLUMN '+column.columnName+' ';
    switch (column.dataType){
        case 'varchar':sql+=' varchar(255) ';break;
        case 'decimal':sql+=' decimal(18,9) ';break;
        case 'text':sql+=' text ';break;
        case 'datetime':sql+=' datetime ';break;
    }
    switch (column.isNullable){
        case 'YES':sql+=' NULL ';break;
        case 'NO':sql+=' NOT NULL ';break;
    }
    if(column.columnDefault != null)
        sql+=' DEFAULT'+column.columnDefault+' ';
    if(column.columnKey == 'PRI'){
        if(havePRIKey(table))
            sql+=',\nDROP PRIMARY KEY ';
        let prikeys = [];
        for(let index in table.cols){
            let col = table.cols[index];
            if(col.columnKey == 'PRI')
                prikeys.push(col.columnName);
        }
        sql+=',\nADD PRIMARY KEY ('
        for(let index in prikeys)
            sql=sql+prikeys[index]+',';
        sql = sql+column.columnName+')';
    }
    return sql;
}

function createUpdateColumnSql(table,oldColumn,newColumn) {
    let sql = 'ALTER TABLE '+table.tableName;
    let isRename = oldColumn.columnName != newColumn.columnName;
    let isUpdatePRI = oldColumn.columnKey != newColumn.columnKey;
    if(isRename) sql+= ' CHANGE COLUMN '+oldColumn.columnName+' '+newColumn.columnName+' ';
    else sql+= ' MODIFY COLUMN '+newColumn.columnName+' ';
    switch (newColumn.dataType){
        case 'varchar':sql+=' varchar(255) ';break;
        case 'decimal':sql+=' decimal(18,9) ';break;
        case 'text':sql+=' text ';break;
        case 'datetime':sql+=' datetime ';break;
    }
    switch (newColumn.isNullable){
        case 'YES':sql+=' NULL ';break;
        case 'NO':sql+=' NOT NULL ';break;
    }
    sql+= findColumnBeforeName(table.cols,oldColumn);
    if(isUpdatePRI){
        if(havePRIKey(table))
            sql+=',\nDROP PRIMARY KEY ';
        if(newColumn.columnKey == 'PRI') {
            let prikeys = [];
            for (let index in table.cols) {
                let col = table.cols[index];
                if (col.columnKey == 'PRI')
                    prikeys.push(col.columnName);
            }
            sql+=',\nADD PRIMARY KEY ('
            for(let index in prikeys)
                sql=sql+prikeys[index]+',';
            sql = sql+newColumn.columnName+')';
        }
        else {
            let prikeys = [];
            for(let index in table.cols){
                let col = table.cols[index];
                if(col.columnKey == 'PRI'&&col.columnName!= oldColumn.columnName)
                    prikeys.push(col.columnName);
            }
            sql+=',\nADD PRIMARY KEY ('
            for(let index in prikeys)
                sql=sql+prikeys[index]+',';
            sql = sql.substring(0,sql.length-1)+')';
        }
    }
    return sql;
}

function havePRIKey(table) {
    for(let index in table.cols)
        if(table.cols[index].columnKey == 'PRI')
            return true;
    return false;
}

function findColumnBeforeName(cols,col) {
    for(let index in cols)
        if(JSON.stringify(cols[index]) == JSON.stringify(col))
            return index == 0?'FIRST':'AFTER '+cols[index-1].columnName;
    return 'AFTER '+cols[cols.length-1].columnName;
}

function getImportTable(tableDatas,convertedData,fileName) {
    let tables = JSON.parse(JSON.stringify(tableDatas));
    let table = new Object();
    table.tableName = fileName;
    table.dataCount = convertedData.body.length;
    table.cols = [];
    for (let index in convertedData.header) {
        let col = new Object();
        col.columnName = convertedData.header[index];
        col.columnKey = '';
        col.dataType = 'varchar';
        col.isNullable = 'YES';
        col.columnDefault = null;
        table.cols.push(col);
    }
    let findIndex = -1;
    for (let index in tables)
        if (tables[index].tableName == table.tableName)
            findIndex = index;
    if (findIndex > -1) {
        let findTable = tables[findIndex];
        table.tableName = getDiffTableName(tables,findTable.tableName);
    }
    return table;
}

function getDiffTableName(tables,tableName,i){
    let tableNameTemp = tableName;
    if(arguments.length == 2){
        i = 0;
    }
    let isMatch = true;
    while(isMatch){
        isMatch = false;
        for(let tableIndex in tables)
            if(tables[tableIndex].tableName == tableName)
                isMatch = true;
        if(isMatch) tableName = tableNameTemp+(++i);
    }
    return tableName;
}

function getImportTableSql(createTable,convertedData) {
    let createTableSql = 'CREATE TABLE '+createTable.tableName+'('
    for(let index in createTable.cols){
        let col = createTable.cols[index];
        createTableSql+= col.columnName+' varchar(255) NULL ,';
    }
    createTableSql=createTableSql.substring(0,createTableSql.length-1)+')';
    let insertDataSql = squel.insert().into(conn.config.database+'.'+createTable.tableName)
        .setFieldsRows(convertedData.body).toString()
    return {
        createTableSql:createTableSql,
        insertDataSql:insertDataSql
    };
}

export default{
    setConn:setConn,
    getTablesData:getTablesData,
    editTable:editTable,
    deleteTable:deleteTable,
    changeTableName:changeTableName,
    importTableFromExcel:importTableFromExcel
}