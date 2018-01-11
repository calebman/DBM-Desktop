<style lang="less">
    @import '../../common.less';
    @import 'text-column.less';
</style>
<template>
    <div class="table-body-cell">
        <input class="cell-text-edit-input" @blur="changeValue"
               v-if="inSelect" @keyup="enter($event)" v-model="value" v-focus/>
        <span class="cell-text" v-else>{{value}}</span>
    </div>
</template>
<script>
    export default {
        name: 'textcolumn',
        components: {},
        data() {
            return {
                value:this.rowData[this.field]==null?'':this.rowData[this.field]
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
            }
        },
        directives: {
            focus: {
                inserted: function (el) {
                    el.focus()
                }
            }
        },
        methods: {
            enter(ev){
                if(ev.keyCode == 13)
                    this.changeValue();
            },
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