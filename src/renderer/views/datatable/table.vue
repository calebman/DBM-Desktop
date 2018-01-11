<style lang="less">
    @import '../common.less';
    @import './table.less';
</style>
<template>
    <div class="table-div">
        <!--<div>-->
            <!--<Card>-->
                <!--<div slot="title">-->
                    <!--<Icon type="stats-bars"></Icon>-->
                    <!--{{table.tableName}}-->
                <!--</div>-->
                <!--<div class="table-console-con">-->
                    <!--&lt;!&ndash;<span style="font-size: 18px">{{executeSql}}</span>&ndash;&gt;-->
                <!--</div>-->
            <!--</Card>-->
        <!--</div>-->
        <Card class="table-card">
            <div slot="title" style="height: 20px">
                <Col span="6">
                <Icon type="stats-bars"></Icon>
                {{table.tableName}}
                &nbsp;&nbsp;
                <Tooltip content="打印表格内容" placement="bottom">
                    <a @click.prevent="printer">
                        <Icon type="printer" size="18"></Icon>
                    </a>
                </Tooltip>
                &nbsp;&nbsp;
                <Tooltip content="导出表格数据" placement="bottom">
                    <a @click.prevent="exportData">
                        <Icon type="ios-folder-outline" size="18"></Icon>
                    </a>
                </Tooltip>
                &nbsp;&nbsp;
                <Tooltip content="插入一条数据" placement="bottom">
                    <a @click.prevent="insert">
                        <Icon type="plus-round" size="18"></Icon>
                    </a>
                </Tooltip>
                &nbsp;&nbsp;
                <Poptip trigger="hover" placement="bottom" transfer>
                    <Icon type="android-funnel" size="18" color="blue"></Icon>
                    <div slot="content" style="overflow:hidden">
                        <div v-for="var (item,index) in this.table.cols">
                            <Checkbox v-model="item.show">{{item.columnName}}</Checkbox>
                        </div>
                    </div>
                </Poptip>
                &nbsp;&nbsp;
                <Tooltip :content="isOpenFilter?'关闭筛选':'开启筛选'" placement="bottom">
                    <a @click.prevent="openFilter">
                        <Icon v-if="isOpenFilter" type="ios-settings-strong" size="18" color="red"></Icon>
                        <Icon v-else type="ios-settings" size="20"></Icon>
                    </a>
                </Tooltip>
                &nbsp;&nbsp;
                <Tooltip content="重新加载数据" placement="bottom">
                    <a @click.prevent="refreshData">
                        <Icon type="refresh" size="18"></Icon>
                    </a>
                </Tooltip>
                </Col>
                <Col span="18">
                <div class="float-right">
                    <v-pagination @page-change="pageChange"
                                  @page-size-change="pageSizeChange"
                                  size="small"
                                  :pageIndex="pagination.pageCurrent"
                                  :pageSizeOption="titleRows"
                                  :pageSize="pagination.pageSize"
                                  :total="pagination.totalCount"
                                  :layout="['total', 'prev', 'pager', 'next', 'sizer', 'jumper']">
                    </v-pagination>
                </div>
                </Col>
            </div>
            <div class="table-con">
                <v-table
                        ref="dataTable"
                        :is-loading="isLoading"
                        is-horizontal-resize
                        is-vertical-resize
                        :is-filter = "isOpenFilter"
                        :vertical-resize-offset="verticalResizeOffset"
                        :error-content-height="minHeight"
                        style="width:100%;"
                        :min-height="minHeight"
                        :columns="columns"
                        :table-data="tableData"
                        row-hover-color="#eee"
                        row-click-color="#edf7ff"
                        :row-height="rowHeight"
                        :cellClickData="cellClickData"
                        :cell-click-done="cellClickDone"
                        :paging-index="(pagination.pageCurrent-1)*pagination.pageSize"
                        :clearFilterFlag="clearFilterFlag"
                        :dataFilterRules="dataFilterRules"
                        @on-custom-comp="customCompFunc"
                        @on-filter-change = "onFilterChange"
                ></v-table>
            </div>
        </Card>
        <files-preview :fileValue="filePreview.value" :initIndex="filePreview.initIndex"
                       :showPreview="filePreview.showPreview" @close="filePreviewClose"
                       @delete="filePreviewDelete"></files-preview>
    </div>
</template>

<script>
    import datatableMock from './data/datatable_mock.js'
    import filesPreview from './components/files-preview.vue'
    import './easytable/themes-base/index.css';
    import easytable from './easytable';
    import uuid from 'uuid';
    import cookie from '../../libs/cookie'
    import dbmUtil from '../../libs/dbmUtil';
    import printUtil from '../../libs/printUtil';
    import moment from 'moment';
    let VTable = easytable.VTable;
    let VPagination = easytable.VPagination;
    export default {
        name: 'datatable',
        components: {
            filesPreview,VTable,VPagination
        },
        data() {
            return {
                isLoading: true,
                table: {
                    cols: [],
                    tableName: '',
                    dataCount: 0
                },
                tableData: [],
                pagination: {
                    pageSize: 30,
                    pageCurrent: 1,
                    totalCount: 0
                },
                cellClickData: {
                    index: -1,
                    field: ''
                },
                filePreview: {
                    value: {},
                    initIndex: 0,
                    showPreview: false
                },
                filterParam:[],
                isOpenFilter:false,
                titleRows: [30, 60, 90],
                rowHeight: 35,
                verticalResizeOffset: 10,
                minHeight: 300,
                isCancelClick: false,
                clearFilterFlag:false,
                updateColumnVisible:false,
                dataFilterRules:{}
            }
        },
        computed: {
            columns() {
                let cols = this.table.cols;
                let resultColumns = [];
                resultColumns.push({
                    field: 'dbm_custome_index_system',
                    title: '#',
                    width: 50,
                    titleAlign: 'center',
                    columnAlign: 'center',
                    componentName: 'IndexColumn',
                    isFrozen: true
                })
                let v = {};
                for (let index in cols) {
                    v = cols[index];
                    if(!v.columnTitle||v.columnTitle == '') v.columnTitle = v.columnName;
                    if(!v.show) continue;
                    let componentName = 'TextColumn';
                    let width = 150;
                    switch (v.dataType) {
                        case 'datetime':
                            componentName = 'DatetimeColumn';
                            width = 180;
                            break;
                        case 'decimal':
                            componentName = 'NumberColumn';
                            break;
                        case 'text':
                            componentName = 'FileColumn';
                            width = 180;
                            break;
                        default:
                            componentName = 'TextColumn';
                            break;
                    }
                    resultColumns.push({
                        field: v.columnName,
                        title: v.columnTitle,
                        dataType:v.dataType,
                        width: width,
                        titleAlign: 'center',
                        columnAlign: 'center',
                        componentName: componentName,
                        isResize: true
                    })
                }
                this.updateColumnVisible = !this.updateColumnVisible;
                return resultColumns;
            },
            hideMenuText(){
                return this.$store.state.hideMenuText;
            }
        },
        methods: {
            async getData() {
                this.isLoading = true;
                let result = {};
                for(let cindex in this.table.cols){
                    let col = this.table.cols[cindex];
                    if(col.columnTitle == col.columnName)
                        continue;
                    col.columnTitle = '';
                    this.table.cols.splice(cindex,1,col);
                }
                for(let pindex in this.filterParam){
                    for(let cindex in this.table.cols){
                        if(this.table.cols[cindex].columnName == this.filterParam[pindex].columnName){
                            let col = this.table.cols[cindex];
                            let param = this.filterParam[pindex];
                            col.columnTitle = param.columnName+' '+dbmUtil.getRuleTitleFromType(col.dataType,param.type)+' '+param.value;
                            this.table.cols.splice(cindex,1,col);
                        }
                    }
                }
                if (process.env.IS_WEB){
                    result = datatableMock.mockData(this.table,this.pagination);
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.getDataFromTable(this.table.tableName, this.filterParam,this.pagination)
                    });
                } else result = await this.doLogic('getDataFromTable',this.table.tableName,this.filterParam, this.pagination);
                this.tableData = result.tableData;
                if(result.pagination)
                    this.pagination = result.pagination;
                this.isLoading = false;
            },
            async onValueChange(rowIndex, rowData, field, newValue, filePath) {
                this.tableData[rowIndex][field] = newValue;
                this.cancelSelect();
                if (process.env.IS_WEB){
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.updateDataFromTable(this.table, rowData, field, newValue)
                    });
                    return ;
                }
                let result = await this.doLogic('updateDataFromTable',this.table, rowData, field, newValue, this.appFilePath,filePath);
                if (!result) {
                    this.tableData[rowIndex][field] = rowData[field];
                    this.$Message.error('编辑有误');
                }

            },
            cellClickDone(rowIndex, rowData, field) {
                if (this.isCancelClick) {
                    this.isCancelClick = false;
                } else {
                    this.cellClickData = {
                        index: rowIndex,
                        field: field
                    }
                }

            },
            pageChange(pageCuurent) {
                this.pagination.pageCurrent = pageCuurent;
                this.getData();
            },
            pageSizeChange(pageSize) {
                this.pagination.pageCurrent = 1;
                this.pagination.pageSize = pageSize;
                this.getData();
            },
            exportData() {
                if (process.env.IS_WEB){
                    this.$Message.warning('该功能需要electron的支持');
                    return ;
                }
                if (dbmUtil.hasFileColumn(this.table.cols)) {
                    this.getOpenFilePath(this, {
                        properties: ['openDirectory']
                    }, function (files, doLogic, ctx) {
                        if (!files||!files.length||files.length == 0)
                            return;
                        let dirPath = files[0];
                        doLogic('exportExcelAndFileFromTable',ctx.table, dirPath, ctx.appFilePath);
                        ctx.$Modal.confirm({
                            title: 'Excel与附件数据导出成功',
                            content: '<span style="font-size: 18px">是否需要打开文件夹</span>',
                            onOk: () => {
                                ctx.openFile(dirPath + "\\" + ctx.table.tableName);
                            }
                        });
                    })
                } else {
                    this.getSaveFilePath(this, {
                        title: '导出为Excel文件',
                        filters: [{name: 'Excel', extensions: ['xls', 'xlsx']}]
                    }, function (filePath, doLogic, ctx) {
                        if (filePath) {
                            doLogic('exportExcelFromTable',ctx.table, filePath);
                            ctx.$Modal.confirm({
                                title: '导出Excel成功',
                                content: '<span style="font-size: 18px">是否需要打开文件</span>',
                                onOk: () => {
                                    ctx.openFile(filePath);
                                }
                            });
                        }
                    })
                }
            },
            async printer(){
                //拿到所有打印数据
                let result = {};
                if (process.env.IS_WEB){
                    result = datatableMock.mockData(this.table);
                } else result = await this.doLogic('getDataFromTable',this.table.tableName,this.filterParam);
                let tableData = result.tableData;
                printUtil.printTable(this.table,tableData,this.appFilePath);
            },
            async insert(){
                let cols = this.table.cols;
                let v ;
                let rowData = {};
                for(let index in cols){
                    v = cols[index];
                    switch (v.dataType) {
                        case 'datetime':
                            rowData[v.columnName] = v.columnDefault?v.columnDefault:moment().format('YYYY-MM-DD HH:mm:ss');
                            break;
                        case 'decimal':
                            rowData[v.columnName] = v.columnDefault?v.columnDefault:0;
                            break;
                        case 'text':
                            rowData[v.columnName] = v.columnDefault?v.columnDefault:'';
                            break;
                        default:
                            rowData[v.columnName] = v.columnDefault?v.columnDefault:'';
                            break;
                    }
                }
                let result = true;
                if (process.env.IS_WEB){
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.insertDataFromTable(this.table, rowData)
                    });
                } else result = await this.doLogic('insertDataFromTable',this.table, rowData);
                if (result) {
                    this.tableData.splice(0,0,rowData);
                }else  this.$Message.error('存在冲突，插入失败');
            },
            async deleteRow(index,rowData){
                let result = true;
                if (process.env.IS_WEB){
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.deleteDataFromTable(this.table, rowData)
                    });
                } else result = await this.doLogic('deleteDataFromTable',this.table, rowData,this.appFilePath);
                if (result) {
                    this.tableData.splice(index,1);
                }
            },
            clearFilterParam(){
                this.clearFilterFlag = !this.clearFilterFlag;
            },
            openFilter(){
                if(this.isOpenFilter){
                    this.filterParam = [];
                    this.getData();
                }
                this.isOpenFilter = !this.isOpenFilter;
            },
            refreshData() {
                this.getData();
            },
            cancelSelect() {
                this.cellClickData = {
                    index: -1,
                    field: ''
                }
            },
            filePreviewClose() {
                this.filePreview = {
                    value: {},
                    initIndex: 0,
                    showPreview: false
                };
            },
            fileAdd(rowIndex, rowData, field) {
                if (process.env.IS_WEB){
                    this.$Message.warning('该功能需要electron的支持');
                    return;
                }
                this.getOpenFilePath(this, {
                    properties: ['openFile']
                }, function (files, mysql, ctx) {
                    if (!files||!files.length||files.length == 0)
                        return;
                    let filePath = files[0];
                    let fileName = filePath.substring(filePath.lastIndexOf('\\')+1,filePath.length);
                    let fileValue = {dir:uuid.v1().replace(/[&\|\\\*^%$#@\-]/g,""),files:[]};
                    if(dbmUtil.isFileColumn(ctx.$data.tableData[rowIndex][field]))
                        fileValue = JSON.parse(ctx.$data.tableData[rowIndex][field]);
                    let filesArray = fileValue.files;
                    filesArray.splice(filesArray.length,0,fileName);
                    ctx.onValueChange(rowIndex, rowData, field, JSON.stringify({
                        dir:fileValue.dir,
                        files:filesArray
                    }),filePath);
                })
            },
            filePreviewDelete(deleteIndex) {
                let rowIndex = this.filePreview.rowIndex;
                let rowData = this.filePreview.rowData;
                let field = this.filePreview.field;
                let fileValue = JSON.parse(this.tableData[rowIndex][field]);
                let filesArray = fileValue.files;
                filesArray.splice(deleteIndex, 1);
                this.onValueChange(rowIndex, rowData, field, JSON.stringify({
                    dir:fileValue.dir,
                    files:filesArray
                }));
                this.filePreviewClose();
            },
            customCompFunc(params) {
                switch (params.type) {
                    case 'onValueChange':
                        this.onValueChange(params.rowIndex, params.rowData, params.field, params.newValue);
                        break;
                    case 'onValueCancel':
                        this.isCancelClick = true;
                        this.cancelSelect();
                        break;
                    case 'onRowDelete':
                        this.deleteRow(params.rowIndex,params.rowData);
                        break;
                    case 'filePreview':
                        this.filePreview = {
                            value: params.value,
                            showPreview: true,
                            rowIndex: params.rowIndex,
                            initIndex: params.initIndex,
                            rowData: params.rowData,
                            field: params.field
                        };
                        break;
                    case 'fileAdd':
                        this.fileAdd(params.rowIndex, params.rowData, params.field);
                        break;
                }
            },
            async onFilterChange(filterParam){
                this.filterParam = filterParam;
                this.getData();
            }
        },
        watch: {
            hideMenuText(val){
                this.$refs['dataTable'].resize(250);
            },
            updateColumnVisible(val){
                this.$refs['dataTable'].resize();
            }
        },
        created() {
            this.table = JSON.parse(cookie.get('cookie_table'));
            this.dataFilterRules = dbmUtil.getDataFilterRules();
            this.getData();
        }
    };
</script>