<style lang="less">
    @import '../../common.less';
    @import 'file-column.less';
</style>
<template>
    <div class="table-body-cell">
        <div class="image-list" v-for="(item,index) in value.files">
            <img v-if="isImg(item)" :src="getImgPath(item)">
            <img v-else :src="CheckIconExists(item)">
            <div class="image-list-cover">
                <Icon type="ios-eye-outline" @click.native="fileView(item,index)" size="18"></Icon>
            </div>
        </div>
        <div v-if="fileList < 7" class="image-list-add" @click="addImage">
            <div style="margin-top: 1px;margin-right: 2px; width:30px; height:30px;">
                <Icon  type="plus" size="17"></Icon>
            </div>
        </div>
    </div>
</template>
<script>
    import dbmUtil from '../../../libs/dbmUtil';
    export default {
        name: 'imagecolumn',
        components: {},
        data() {
            return {
                value:this.getValue(this.rowData)
            }
        },
        props: {
            rowData:{
                type:Object
            },
            field:{
                type:String
            },
            index:{
                type:Number
            },
            cellClickData: {
                type:Object,
                default: function () {
                    return {
                        index:-1,
                        field:''
                    }
                }
            }
        },
        computed: {
            inSelect(){
                return this.cellClickData.index == this.index&&this.cellClickData.field == this.field;
            },
            fileList(){
                return this.value.files.length;
            }
        },
        methods: {
            fileView(item,index){
                let params = {
                    type:'filePreview',
                    rowIndex:this.index,
                    rowData:this.rowData,
                    field:this.field,
                    initIndex:index,
                    value:this.value
                }
                this.$emit('on-custom-comp',params);
            },
            addImage(){
                let params = {
                    type:'fileAdd',
                    rowIndex:this.index,
                    rowData:this.rowData,
                    field:this.field
                }
                this.$emit('on-custom-comp',params);
            },
            getValue(rowData){
                let returnValue = {"dir":"","files":[]}
                if(dbmUtil.isFileColumn(rowData[this.field]))
                    returnValue = JSON.parse(rowData[this.field]);
                return returnValue;
            },
            isImg(fileName){
                let suffix = dbmUtil.getSuffix(fileName);
                return suffix == ('jpg' || 'png' || 'gif') ? true : false;
            },
            getImgPath(item){
                return dbmUtil.getImgPath(this.appPath,this.value.dir,item);
            },
            getSuffix(fileName){
                return dbmUtil.getSuffix(fileName);
            },
            CheckIconExists(item){
                return dbmUtil.CheckIconExists(item);
            }
        },
        watch: {
            rowData:{
                handler(curVal){
                    this.value = this.getValue(curVal);
                },
                deep:true
            }
        }
    };

</script>