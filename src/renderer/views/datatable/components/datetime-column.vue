<style lang="less">
    @import '../../common.less';
    @import 'datetime-column.less';
</style>
<template>
    <div class="table-body-cell">
        <DatePicker
                :open="inSelect"
                v-model="value"
                type="datetime"
                transfer
                confirm
                @on-open-change="saveHistroyValue"
                @on-clear="changeValue"
                @on-ok="changeValue">
            <Icon type="ios-calendar-outline"></Icon>
            {{showValue}}
            &nbsp;
            <a v-if="inSelect" href="javascript:void(0)" @click="handleCanel">
                <Icon type="close"></Icon>
            </a>
        </DatePicker>
    </div>
</template>
<script>
    import moment from 'moment'
    export default {
        name: 'textcolumn',
        components: {},
        data() {
            return {
                value:this.rowData[this.field]==null?'':this.rowData[this.field],
                histroyValue:null
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
            showValue(){
                return moment(this.value).format('YYYY-MM-DD HH:mm:ss');
            }
        },
        methods: {
            changeValue(){
                if(this.inSelect){
                    let params = {
                        type:'onValueChange',
                        rowIndex:this.index,
                        rowData:this.rowData,
                        field:this.field,
                        newValue:this.value
                    }
                    this.$emit('on-custom-comp',params);
                }
            },
            handleCanel () {
                if(this.inSelect){
                    this.value = this.histroyValue;
                    this.$emit('on-custom-comp',{
                        type:'onValueCancel'
                    });
                }
            },
            saveHistroyValue(isOpen){
                if(isOpen)
                    this.histroyValue = this.value;
            }
        },
        watch: {
            rowData:{
                handler(curVal){
                    this.value = curVal[this.field];
                },
                deep:true
            }
        }
    }
</script>