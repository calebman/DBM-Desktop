<style lang="less">
    @import 'files-preview.less';
</style>

<template>
    <transition name="fade">
        <div class="media-wrapper" v-if="isShow">
            <div class="media-right-top">
                <Button type="text" class="download" shape="circle" icon="android-download" @click="download"></Button>
                <Button type="text" class="open" shape="circle" icon="android-folder-open" @click="open"></Button>
                <Button type="text" class="delete" shape="circle" icon="trash-b" @click="del"></Button>
                <Button type="text" class="close" shape="circle" icon="close" @click="close"></Button>
            </div>
            <div class="media-controller">
                <Button-group shape='circle'>
                    <Button size="large" type="primary" icon="ios-skipbackward" @click.prevent="prev"></Button>
                    <Button size="large" type="primary" icon="ios-skipforward" @click.prevent="next"></Button>
                </Button-group>
            </div>
            <div class="media-content">
                <div v-for="(item,index) in fileValue.files" :key="index" :class="type(index)">
                    <img v-if="isImg(item)" :src="getImgPath(item)" @click="toggle(index)">
                    <video :src="appPath+'/'+fileValue.dir+'/'+item" v-else-if="isVideo(item)" @click="toggle(index)"></video>
                    <img v-else :src="CheckIconExists(item)" @click="toggle(index)">
                    <br>
                    <span class="file-content">{{getFileName(fileValue.files[index])}}</span>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
    import dbmUtil from '../../../libs/dbmUtil';
    export default {
        name: 'imagespreview',
        data: function () {
            return {
                showIndex:this.initIndex,
                isShow:this.showPreview
            }
        },
        props: {
            fileValue:{
                 type:Object,
                 default:function () {
                     return{
                         dir:'',
                         files:[]
                     }
                 }
             },
            initIndex:{
                 type:Number,
                default:0
            },
            showPreview:Boolean
        },
        methods: {
            next() {
                if (this.showIndex == this.fileValue.files.length - 1) {
                    this.$Message.warning('已到达最后一张');
                } else {
                    this.showIndex++;
                }
            },
            prev() {
                if (this.showIndex == 0) {
                    this.$Message.warning('已到达第一张');
                } else {
                    this.showIndex--;
                }
            },
            type(index) {
                if (index == this.showIndex) {
                    return 'media-center'
                } else if (index - this.showIndex == 1) {
                    return 'media-right'
                } else if (index - this.showIndex == -1) {
                    return 'media-left'
                } else {
                    return 'media-hide'
                }
            },
            isImg(fileName){
                let suffix = dbmUtil.getSuffix(fileName);
                return suffix == ('jpg' || 'png' || 'gif') ? true : false;
            },
            getImgPath(item){
               return dbmUtil.getImgPath(this.appPath,this.fileValue.dir,item);
            },
            isVideo(fileName){
                let suffix = dbmUtil.getSuffix(fileName);
                return suffix == ('mp4','ogg') ? true : false;
            },
            getSuffix(fileName){
               return dbmUtil.getSuffix(fileName);
            },
            toggle(index) {
                if (index - this.showIndex == 1) {
                    this.showIndex++;
                } else if (index - this.showIndex == -1) {
                    this.showIndex--;
                }
            },
            close() {
                this.isShow = false;
                this.showIndex = 0;
                this.$emit('close');
            },
            download(){
                if (process.env.IS_WEB){
                    this.$Message.warning('该功能需要electron的支持');
                    return ;
                }
                let filePath = this.appFilePath+'\\'+this.fileValue.dir+'\\'+this.fileValue.files[this.showIndex];
                let fileName = this.fileValue.files[this.showIndex];
                let suffix = this.getSuffix(fileName);
                this.getSaveFilePath(this, {
                        title: '文件另存为',
                        filters: [{name: suffix, extensions: [suffix]}]
                    }, function (currentPath, doLogic, ctx) {
                    if(!currentPath)
                        return;
                    doLogic('pipeFile',filePath,currentPath);
                    ctx.$Modal.confirm({
                        title: '保存成功',
                        content: '<span style="font-size: 18px">是否需要打开文件</span>',
                        onOk: () => {
                            ctx.openFile(currentPath);
                        }
                    });
                })
            },
            open(){
                if (process.env.IS_WEB){
                    this.$Message.warning('该功能需要electron的支持');
                    return ;
                }
                this.openFile(this.appFilePath+'\\'+this.fileValue.dir+'\\'+this.fileValue.files[this.showIndex]);
            },
            del(){
                this.$emit('delete',this.showIndex);
                this.isShow = false;
                this.showIndex = 0;
            },
            CheckIconExists(item){
                return dbmUtil.CheckIconExists(item);
            },
            getFileName(file){
                return dbmUtil.getFileName(file);
            }
        },
        computed: {

        },
        watch:{
            initIndex(val){
                this.showIndex = val;
            },
            showPreview(val){
                this.isShow = val;
            }
        }
    };
</script>