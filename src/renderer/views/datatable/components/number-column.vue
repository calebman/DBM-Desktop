<style lang="less">
    @import '../../common.less';
    @import 'number-column.less';
</style>
<template>
    <div class="table-body-cell">
        <input class="cell-text-edit-input" @blur="changeValue" v-number-only
               v-if="inSelect" @keyup="enter($event)" v-model="inputNum" v-focus/>
        <span class="cell-text" v-else>{{inputNum}}</span>
    </div>
</template>
<script>
    let num = 0;
    export default {
        name: 'numbercolumn',
        components: {},
        data() {
            return {
                value:this.rowData[this.field]==null?'':this.rowData[this.field],
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
            inputNum:{
                get:function(){
                    return this.value;

                },
                set:function(newValue){
                    if(isNaN(newValue)&&newValue.length == 1)
                        newValue = num;
                    if(newValue.length == 0)
                        newValue = '0';

                    this.value=newValue.replace(/[^\d.]/g,"");
                    num = this.value;
                }
            }
        },
        directives: {
            focus: {
                inserted: function (el) {
                    el.focus()
                }
            },
            numberOnly: {
                bind: function(el) {
                    el.handler = function() {
                        var val = el.value;
                        el.value = val.replace(/[^\d.]/g,"");
                    }
                    el.addEventListener('input', el.handler)
                },
                unbind: function(el) {
                    el.removeEventListener('input', el.handler)
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
    };
</script>