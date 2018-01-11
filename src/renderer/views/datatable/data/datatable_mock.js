var Mock = require('mockjs');
var moment = require('moment');
function mockData(table,pagination) {
    let result = {
        tableData:[],
        pagination:{}
    };
    let rowCount = mockNumber(25,100);
    if(pagination) {
        result.pagination = pagination;
        rowCount = mockNumber(15,pagination.pageSize);
    }
    result.pagination.totalCount = rowCount;
    for(let i = 0;i<rowCount;i++){
        result.tableData.push(mockRowData(table.cols));
    }
    return result;
}
function mockRowData(cols) {
    let row = {};
    let v ={};
    for(let index in cols){
        v = cols[index];
        switch (v.dataType) {
            case 'datetime':
                row[v.columnName] = mockDate();
                break;
            case 'decimal':
                row[v.columnName] = mockDecimal(1,100);
                break;
            case 'text':
                row[v.columnName] = mockFile();
                break;
            default:
                row[v.columnName] = mockStr();
                break;
        }
    }
    return row;
}
function mockStr() {
    let result = Mock.mock({'str': '@name'});
    return result.str;
}
function mockNumber(min,max) {
    let key = 'num|'+min+'-'+max;
    let param = {}
    param[key] = 100;
    return Mock.mock(param).num;
}

function mockDecimal() {
    return Mock.Random.float( 1, 100, 1, 3 )
}

function mockFile() {
    let arr = ['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','e.jpg','w.jpg','q.jpg','r.jpg','login_bg.jpg'];
    let fileCount = mockNumber(0,7);
    let result = {dir:'http://p0b7gsvff.bkt.clouddn.com/files',files:[]};
    for(let i = 0;i<fileCount;i++){
        result.files.push(Mock.mock({'oneFile|1': arr}).oneFile)
    }
    return JSON.stringify(result);
}

function mockDate() {
    let dateStr = Mock.Random.date('yyyy-MM-dd HH:mm:ss');
    return moment(dateStr,'YYYY-MM-DD HH:mm:ss');
}
export default {
    mockData:mockData
}