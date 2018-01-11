var squel = require('squel');
var moment = require('moment');
var fs = require('fs');
var path = require("path");
function createExpr(table,rowData) {
    let columnKeys = getPRIKeys(table.cols);
    let expr = squel.expr();
    if(columnKeys.length > 0){
        for(let index in columnKeys){
            let key = columnKeys[index];
            let value =rowData[key];
            if(value instanceof Date) value = moment(value).format('YYYY-MM-DD HH:mm:ss');
            if(value == null) expr.and(key + ' is NULL');
            else expr.and(key + ' = ?',value);
        }
    }else{
        for(let key in rowData){
            let value =rowData[key];
            if(value instanceof Date) value = moment(value).format('YYYY-MM-DD HH:mm:ss');
            if(value == null) expr.and(key + ' is NULL');
            else expr.and(key + ' = ?',value);
        }
    }
    return expr;
}

function createFilter(tableName,filterParam) {
    let expr = squel.expr();
    let param = {};
    for(let index in filterParam){
        param = filterParam[index];
        let value = param.value == ''?'':"'"+param.value+"'";
        let field = tableName+'.'+param.columnName;
        let exp = param.type;
        switch (param.type){
            case 'IS NULL':exp="IS NULL OR "+field+" = ''";break;
            case 'IS NOT NULL':exp="IS NOT NULL AND "+field+" != ''";break;
            case 'LIKE':value = "'%"+param.value+"%'";break;
            case 'NOT LIKE':value = "'%"+param.value+"%'";break;
            case '>=':value = param.value;break;
            case '<=':value = param.value;break;
            default : break;
        }
        expr.and(field+' '+exp+' '+value);
    }
    return expr;
}

function getPRIKeys(cols) {
    let columnKeys = [];
    for(let index in cols){
        if(cols[index]['columnKey'] == 'PRI')
            columnKeys.push(cols[index]['columnName']);
    }
    return columnKeys;
}

function getTextColumn(cols) {
    let columns = [];
    for(let index in cols){
        if(cols[index]['dataType'] == 'text')
            columns.push(cols[index]);
    }
    return columns;
}

function isTextColumn(cols,field) {
    for(let index in cols){
        if(cols[index]['columnName'] == field && cols[index]['dataType'] == 'text')
            return true;
    }
    return false;
}

function deleteall(path) {
    var files = [];
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

//递归创建目录 同步方法
function mkdirsSync(dirname, mode){
    if(fs.existsSync(dirname)){
        return true;
    }else{
        if(mkdirsSync(path.dirname(dirname), mode)){
            fs.mkdirSync(dirname, mode);
            return true;
        }
    }
}

function difference(arr1,arr2) {
    var diff = [];
    var isAdd = arr1.length < arr2.length;
    var tmp = arr2;
    arr1.forEach(function(val1, i){
        if (arr2.indexOf(val1) < 0) {
            diff.push(val1);
        } else {
            tmp.splice(tmp.indexOf(val1), 1);
        }
    });
    return {isAdd:isAdd,data:diff.concat(tmp)};
};

function isFileColumn(str) {
    if (typeof str == 'string') {
        try {
            var obj=JSON.parse(str);
            if(str.indexOf('{')>-1){
                if(obj.dir&&obj.files&&Object.prototype.toString.call(obj.files) === '[object Array]')
                    return true;
            }else{
                return false;
            }
        } catch(e) {
            return false;
        }
    }
    return false;
}

export default{
    createExpr:createExpr,
    createFilter:createFilter,
    getPRIKeys:getPRIKeys,
    getTextColumn:getTextColumn,
    isTextColumn:isTextColumn,
    deleteall:deleteall,
    mkdirsSync:mkdirsSync,
    difference:difference,
    isFileColumn:isFileColumn
}