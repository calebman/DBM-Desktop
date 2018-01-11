<style lang="less">
    @import '../../common.less';
    @import 'index-column.less';
</style>
<template>
    <div class="index-div">
        <div class="span-index">
            <span>{{(currentIndex + 1)}}</span>
        </div>
        <div class="close-index">
            <Tooltip :content="'删除第'+(currentIndex + 1)+'行'" placement="right-start" transfer>
                <a @click.prevent="deleteRow">
                    <Icon type="close" color="red"></Icon>
                </a>
            </Tooltip>
        </div>
    </div>
</template>
<script>
    export default {
        name: 'indexcolumn',
        components: {},
        data() {
            return {

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
            pagingIndex:{
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
            currentIndex(){
                return this.index + this.pagingIndex;
            }
        },
        methods: {
            deleteRow(){
                let params = {
                    type:'onRowDelete',
                    rowIndex:this.index,
                    rowData:this.rowData,
                }
                this.$emit('on-custom-comp',params);
            }
        }
    }
</script>