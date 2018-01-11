<style lang="less">
    @import '../common.less';
    @import './components/database-table.less';
</style>

<template>
    <div>
        <Row>
            <Col span="9">
            <Card>
                <p slot="title">
                    <Col span="17">
                    <Icon type="load-b"></Icon>
                    简单说明
                    </Col>
                    <Col span="7">
                    <CountTo :endVal="loadCount" :mainStyle="mainStyle" :countStyle="countStyle">
                        <span slot="leftText">已加载&nbsp;</span>
                        <span slot="rightText">&nbsp;个表格</span>
                    </CountTo>
                    </Col>
                </p>
                <div class="edittable-test-con">
                    <Alert show-icon>
                        <span slot="icon"><Icon type="ios-search" size="18"></Icon></span>
                        <span style="font-size: 15px">查看表格数据</span>
                    </Alert>
                    <Alert show-icon>
                        <span slot="icon"><Icon type="ios-plus-empty" size="18"></Icon></span>
                        <span style="font-size: 15px">添加表格数据项</span>
                    </Alert>
                    <Alert show-icon type="warning">
                        <span slot="icon"><Icon type="ios-close-empty" size="18"></Icon></span>
                        <span style="font-size: 15px">勾选时删除列，勾选为空时删除表</span>
                    </Alert>
                    <Alert show-icon>
                        <span slot="icon"><Icon type="information-circled" size="17"></Icon></span>
                        <span style="font-size: 15px">编辑表格数据项</span>
                    </Alert>
                </div>
            </Card>
            </Col>
            <Col span="10" class="padding-left-10">
            <Card>
                <div class="edittable-con-1">
                    <template v-if="!spinShow">
                        <table-data-pie :tableData="tableData"></table-data-pie>
                    </template>
                    <span v-if="spinShow" style="font-size: 18px;color: #7f8c8d;text-align:center;display:block;">图表加载中...</span>
                </div>
            </Card>
            </Col>
            <Col span="5" class="padding-left-10">
            <Card>
                <p slot="title">
                    <Col span="12">
                    <Icon type="navicon-round"></Icon>
                    控制台
                    </Col>
                    <Col span="10">
                    <CountTo :endVal="tableCount" :mainStyle="mainStyle" :countStyle="countStyle">
                        <span slot="leftText">表格总数&nbsp;</span>
                        <span slot="rightText">&nbsp;个</span>
                    </CountTo>
                    </Col>
                    <Col span="2" class="refurbish">
                    <Icon title="刷新表格" type="ios-loop-strong" size="18" @click.native="refurbish"></Icon>
                    </Col>
                </p>
                <div class="console-con">
                    <AutoComplete
                            v-model="searchData"
                            :data="tableNames"
                            :filter-method="filterMethod"
                            icon="ios-search"
                            placeholder="筛选表格"
                            style="width:75%;margin: 6px;">
                    </AutoComplete>
                    <xlxs-table style="width:75%;margin-top: 6px;" @on-select-file="importExcelFile">
                    </xlxs-table>
                </div>
            </Card>
            </Col>
        </Row>
        <div class="demo-spin-container">
            <template v-if="!spinShow" v-for="(row, rowIndex) in tableList">
                <Row class="margin-top-10">
                    <template v-for="(col, colIndex) in row">
                        <Col :span="24/loadCountOfRow" v-if="colIndex %loadCountOfRow == 0">
                        <table-card :table="col" @showTable="showTable" @editColumn="editColumn"
                                    @deleteColumn="deleteColumn"></table-card>
                        </Col>
                        <Col :span="24/loadCountOfRow" v-else class="padding-left-10">
                        <table-card :table="col" @showTable="showTable" @editColumn="editColumn"
                                    @deleteColumn="deleteColumn"></table-card>
                        </Col>
                    </template>
                </Row>
            </template>
            <Spin fix v-if="spinShow">
                <Icon type="load-c" size=22 class="demo-spin-icon-load"></Icon>
                <div style="font-size: 16px">Loading</div>
            </Spin>
        </div>
        <div class="load-more" v-if="searchData == ''&&showTableData.length != tableData.length">
            <div class="load-more-text" @click="loadMore">
                <Icon type="ios-arrow-down" size="18"></Icon>
                <span>加载更多....</span>
            </div>
        </div>
    </div>
</template>

<script>
    import databaseMock from './data/database_mock.js';
    import tableCard from './components/table-card.vue';
    import tableDataPie from './components/table-data-pie.vue';
    import xlxsTable from './components/xlsx-table.vue';
    import CountTo from '../my_components/CountTo.vue';
    import cookie from '../../libs/cookie';
    import dbmUtil from '../../libs/dbmUtil';
    import util from '@/libs/util.js';
    export default {
        name: 'database-table',
        components: {
            tableCard, tableDataPie, xlxsTable, CountTo
        },
        data() {
            return {
                mainStyle: {
                    fontSize: '15px'
                },
                countStyle: {
                    fontSize: '18px',
                    color: '#dc9387'
                },
                tableData: [],
                searchData: '',
                spinShow: true,
                loadCount: 0,
                eveyLoadCount:9,
                loadCountOfRow:3
            };
        },
        computed: {
            showTableData() {
                let loadShowData = [];
                let tableData = this.tableData;
                for (let index=0;index<this.loadCount;index++) {
                    loadShowData.push(tableData[index]);
                }
                return loadShowData;
            },
            tableList() {
                let list = []
                let rowData = [];
                let tableData = [];
                if(this.searchData == '')
                    tableData = this.showTableData;
                else tableData = this.tableData;
                for (let index in tableData) {
                    if (tableData[index].tableName.indexOf(this.searchData) > -1)
                        rowData.push(tableData[index]);
                    if (rowData.length == this.loadCountOfRow) {
                        list.push(rowData);
                        rowData = [];
                    }
                }
                if (rowData.length != 0)
                    list.push(rowData);
                return list;
            },
            tableNames() {
                let names = [];
                let tableData = this.tableData;
                for (let index in tableData) {
                    names.push(tableData[index].tableName);
                }
                return names;
            },
            tableCount() {
                return this.tableData.length;
            }
        },
        methods: {
            async getData() {
                const msg = this.$Message.loading({
                    content: 'Loading...',
                    duration: 0
                });
                this.tableData = [];
                this.loadCount = 0;
                let tableData = [];
                if(!process||process.env.IS_WEB) {
                    tableData = databaseMock.mockData();
                } else {
                    tableData = await this.doLogic('getTablesData');
                }
                setTimeout(msg, 100);
                this.tableData = tableData;
                this.loadMore();
            },
            showTable(table) {
                util.openNewPage(this, 'table_index');
                for(let index in table.cols)
                    table.cols[index].show = true;
                cookie.set('cookie_table',JSON.stringify(table),0);
                this.$router.push({
                    name: 'table_index'
                });
            },
            async deleteColumn(selectColumns, table) {
                let result = true;
                if (process.env.IS_WEB){
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.deleteTable(table,selectColumns)
                    });
                } else result = await this.doLogic('deleteTable',table,selectColumns);
                if (result) {
                    if (selectColumns.length == 0) {
                        for (let index in this.tableData)
                            if (this.tableData[index].tableName == table.tableName){
                                this.loadCount --;
                                this.tableData.splice(index, 1);
                            }
                    }
                    else {
                        let columns = table.cols;
                        for (let index in selectColumns)
                            for (let delIndex in columns)
                                if (columns[delIndex].columnName == selectColumns[index].columnName)
                                    columns.splice(delIndex, 1);
                    }
                } else this.$Message.error('存在冲突，操作失败');
            },
            async editColumn(selectColumn, editColumnData, table) {
                let oldColumnData = JSON.parse(JSON.stringify(selectColumn));
                let newColumnData = editColumnData;
                let result = true;
                if (process.env.IS_WEB){
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.editTable(table,oldColumnData,newColumnData)
                    });
                } else result = await this.doLogic('editTable',table,oldColumnData,newColumnData);
                if (result) {
                    if (selectColumn)
                        for (let key in selectColumn)
                            selectColumn[key] = editColumnData[key];
                    else table.cols.splice(table.cols.length-1, 0, editColumnData);
                } else this.$Message.error('存在冲突，操作失败');
            },
            filterMethod(value, option) {
                return option.toUpperCase().indexOf(value.toUpperCase()) !== -1;
            },
            importExcelFile(convertedData, file) {
                console.log(convertedData)
                let result = false;
                if(process.env.IS_WEB){
                    result = dbmUtil.importTableFromExcel(this.tableData,convertedData,file.name.substr(0, file.name.indexOf('.')));
                    this.$store.commit('addMessage',{
                        title:'正在执行Sql语句',
                        time:Date.parse(new Date()),
                        msg:dbmUtil.getImportTableSql(result,convertedData)
                    });
                } else  result = this.doLogic('importTableFromExcel',this.tableData,file.path);
                if(result) {
                    this.loadCount++;
                    this.tableData.splice(0, 0, result);
                } else this.$Message.error('存在冲突，导入失败');
            },
            loadMore(){
                let loadIndex = this.showTableData.length;
                let loadDiff = this.tableData.length - loadIndex;
                this.loadCount += loadDiff>this.eveyLoadCount?this.eveyLoadCount:loadDiff;
                if(this.loadCount == this.tableData.length)
                    this.$Message.success({
                        content:'全部加载完毕',
                        duration: 3
                    });
            },
            refurbish(){
                this.spinShow = true;
                this.getData();
                this.spinShow = false;
            }
        },
        watch: {},
        created() {
            if(window.screen.width < 1400)
                this.loadCountOfRow = 2;
            this.getData();
            this.spinShow = false;
        }
    };
</script>
