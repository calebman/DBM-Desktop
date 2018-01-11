var moment = require('moment');
import dbmUtil from './dbmUtil';
let util = {

};
let LODOP;

util.printTable = function (table,tableData,appFilePath) {
    LODOP=getLodop();
    LODOP.PRINT_INIT("表格"+table.tableName);
    LODOP.ADD_PRINT_HTM(0,0,"100%","100%",getTbaleHtml(table,tableData,appFilePath));
    LODOP.SET_PRINT_PAGESIZE(2,"100%","100%","");
    LODOP.SET_SHOW_MODE("LANDSCAPE_DEFROTATED",1);
    LODOP.PREVIEW();
}


var CreatedOKLodop7766=null;

//====判断是否需要安装CLodop云打印服务器:====
function needCLodop(){
    try{
        var ua=navigator.userAgent;
        if (ua.match(/Windows\sPhone/i) !=null) return true;
        if (ua.match(/iPhone|iPod/i) != null) return true;
        if (ua.match(/Android/i) != null) return true;
        if (ua.match(/Edge\D?\d+/i) != null) return true;

        var verTrident=ua.match(/Trident\D?\d+/i);
        var verIE=ua.match(/MSIE\D?\d+/i);
        var verOPR=ua.match(/OPR\D?\d+/i);
        var verFF=ua.match(/Firefox\D?\d+/i);
        var x64=ua.match(/x64/i);
        if ((verTrident==null)&&(verIE==null)&&(x64!==null))
            return true; else
        if ( verFF !== null) {
            verFF = verFF[0].match(/\d+/);
            if ((verFF[0]>= 41)||(x64!==null)) return true;
        } else
        if ( verOPR !== null) {
            verOPR = verOPR[0].match(/\d+/);
            if ( verOPR[0] >= 32 ) return true;
        } else
        if ((verTrident==null)&&(verIE==null)) {
            var verChrome=ua.match(/Chrome\D?\d+/i);
            if ( verChrome !== null ) {
                verChrome = verChrome[0].match(/\d+/);
                if (verChrome[0]>=41) return true;
            };
        };
        return false;
    } catch(err) {return true;};
};

//====页面引用CLodop云打印必须的JS文件：====
if (needCLodop()) {
    var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
    var oscript = document.createElement("script");
    oscript.src ="http://localhost:8000/CLodopfuncs.js?priority=1";
    head.insertBefore( oscript,head.firstChild );

    //引用双端口(8000和18000）避免其中某个被占用：
    oscript = document.createElement("script");
    oscript.src ="http://localhost:18000/CLodopfuncs.js?priority=0";
    head.insertBefore( oscript,head.firstChild );
};

//====获取LODOP对象的主过程：====
function getLodop(oOBJECT,oEMBED) {
    var strHtmInstall="<br><font color='#FF00FF'>打印控件未安装!点击这里<a href='install_lodop32.exe' target='_self'>执行安装</a>,安装后请刷新页面或重新进入。</font>";
    var strHtmUpdate="<br><font color='#FF00FF'>打印控件需要升级!点击这里<a href='install_lodop32.exe' target='_self'>执行升级</a>,升级后请重新进入。</font>";
    var strHtm64_Install="<br><font color='#FF00FF'>打印控件未安装!点击这里<a href='install_lodop64.exe' target='_self'>执行安装</a>,安装后请刷新页面或重新进入。</font>";
    var strHtm64_Update="<br><font color='#FF00FF'>打印控件需要升级!点击这里<a href='install_lodop64.exe' target='_self'>执行升级</a>,升级后请重新进入。</font>";
    var strHtmFireFox="<br><br><font color='#FF00FF'>（注意：如曾安装过Lodop旧版附件npActiveXPLugin,请在【工具】->【附加组件】->【扩展】中先卸它）</font>";
    var strHtmChrome="<br><br><font color='#FF00FF'>(如果此前正常，仅因浏览器升级或重安装而出问题，需重新执行以上安装）</font>";
    var strCLodopInstall="<br><font color='#FF00FF'>CLodop云打印服务(localhost本地)未安装启动!点击这里<a href='CLodop_Setup_for_Win32NT.exe' target='_self'>执行安装</a>,安装后请刷新页面。</font>";
    var strCLodopUpdate="<br><font color='#FF00FF'>CLodop云打印服务需升级!点击这里<a href='CLodop_Setup_for_Win32NT.exe' target='_self'>执行升级</a>,升级后请刷新页面。</font>";
    var LODOP;
    try{
        var isIE = (navigator.userAgent.indexOf('MSIE')>=0) || (navigator.userAgent.indexOf('Trident')>=0);
        if (needCLodop()) {
            try{ LODOP=getCLodop();} catch(err) {};
            if (!LODOP && document.readyState!=="complete") {alert("C-Lodop没准备好，请稍后再试！"); return;};
            if (!LODOP) {
                if (isIE) document.write(strCLodopInstall); else
                    document.body.innerHTML=strCLodopInstall+document.body.innerHTML;
                return;
            } else {

                if (CLODOP.CVERSION<"3.0.2.5") {
                    if (isIE) document.write(strCLodopUpdate); else
                        document.body.innerHTML=strCLodopUpdate+document.body.innerHTML;
                };
                if (oEMBED && oEMBED.parentNode) oEMBED.parentNode.removeChild(oEMBED);
                if (oOBJECT && oOBJECT.parentNode) oOBJECT.parentNode.removeChild(oOBJECT);
            };
        } else {
            var is64IE  = isIE && (navigator.userAgent.indexOf('x64')>=0);
            //=====如果页面有Lodop就直接使用，没有则新建:==========
            if (oOBJECT!=undefined || oEMBED!=undefined) {
                if (isIE) LODOP=oOBJECT; else  LODOP=oEMBED;
            } else if (CreatedOKLodop7766==null){
                LODOP=document.createElement("object");
                LODOP.setAttribute("width",0);
                LODOP.setAttribute("height",0);
                LODOP.setAttribute("style","position:absolute;left:0px;top:-100px;width:0px;height:0px;");
                if (isIE) LODOP.setAttribute("classid","clsid:2105C259-1E0C-4534-8141-A753534CB4CA");
                else LODOP.setAttribute("type","application/x-print-lodop");
                document.documentElement.appendChild(LODOP);
                CreatedOKLodop7766=LODOP;
            } else LODOP=CreatedOKLodop7766;
            //=====Lodop插件未安装时提示下载地址:==========
            if ((LODOP==null)||(typeof(LODOP.VERSION)=="undefined")) {
                if (navigator.userAgent.indexOf('Chrome')>=0)
                    document.body.innerHTML=strHtmChrome+document.body.innerHTML;
                if (navigator.userAgent.indexOf('Firefox')>=0)
                    document.body.innerHTML=strHtmFireFox+document.body.innerHTML;
                if (is64IE) document.write(strHtm64_Install); else
                if (isIE)   document.write(strHtmInstall);    else
                    document.body.innerHTML=strHtmInstall+document.body.innerHTML;
                return LODOP;
            };
        };
        if (LODOP.VERSION<"6.2.2.0") {
            if (!needCLodop()){
                if (is64IE) document.write(strHtm64_Update); else
                if (isIE) document.write(strHtmUpdate); else
                    document.body.innerHTML=strHtmUpdate+document.body.innerHTML;
            };
            return LODOP;
        };
        //===如下空白位置适合调用统一功能(如注册语句、语言选择等):===

        //===========================================================
        return LODOP;
    } catch(err) {alert("getLodop出错:"+err);};
};

function getTbaleHtml(table,tableData,appFilePath) {
    var html_div = document.createElement('div');
    var html_table = document.createElement('table');
    html_table.style.fontFamily = 'verdana,arial,sans-serif';
    html_table.style.fontSize = '15px';
    html_table.style.color = '#333333';
    html_table.style.borderWidth = '1px';
    html_table.style.borderColor = '#666666';
    html_table.style.borderCollapse = 'collapse';
    var html_thead = document.createElement('thead');
    var html_tbody = document.createElement('tbody');
    for(let index in table.cols){
        let col = table.cols[index];
        if(!col.show) continue;
        var html_thead_th = document.createElement('th');
        html_thead_th.style.padding = '8px';
        html_thead_th.style.borderWidth = '1px';
        html_thead_th.style.borderStyle = 'solid';
        html_thead_th.style.borderColor = '#666666';
        html_thead_th.style.backgroundColor = '#dedede';
        html_thead_th.style.whiteSpace = 'nowrap';
        html_thead_th.appendChild(document.createTextNode(col.columnName));
        html_thead.appendChild(html_thead_th);
    }
    html_table.appendChild(html_thead);
    for (let tIndex in tableData) {
        let item = tableData[tIndex];
        var html_tbody_tr = document.createElement('tr');
        for (let index in table.cols) {
            let col = table.cols[index];
            if(!col.show) continue;
            var html_tbody_td = document.createElement('td');
            html_tbody_td.style.padding = '8px';
            html_tbody_td.style.borderWidth = '1px';
            html_tbody_td.style.borderStyle = 'solid';
            html_tbody_td.style.borderColor = '#666666';
            html_tbody_td.style.backgroundColor = '#FFFFFF';
            html_tbody_td.style.whiteSpace = 'nowrap';
            var html_tbody_td_content;
            switch (col.dataType){
                case "datetime":
                    html_tbody_td_content = document.createTextNode(moment(item[col.columnName]).format('YYYY-MM-DD HH:mm:ss'));
                    break;
                case "text":
                    if(dbmUtil.isFileColumn(item[col.columnName])&&JSON.parse(item[col.columnName]).files.length > 0){
                        let itemContent = JSON.parse(item[col.columnName]);
                        html_tbody_td_content = document.createElement('div');
                        for(let index in itemContent.files){
                            var html_tbody_td_content_img = document.createElement('img');
                            if(dbmUtil.getSuffix(itemContent.files[index]) == ('jpg' || 'png' || 'gif'))
                                html_tbody_td_content_img.src = dbmUtil.getImgPath(appFilePath,itemContent.dir,itemContent.files[index]);
                            else html_tbody_td_content_img.src = dbmUtil.CheckIconExists(itemContent.files[index]);
                            html_tbody_td_content_img.width = 60;
                            html_tbody_td_content_img.height = 60;
                            html_tbody_td_content.appendChild(html_tbody_td_content_img);
                        }
                    }else html_tbody_td_content = document.createTextNode("无附件");
                    break;
                default:
                    html_tbody_td_content = document.createTextNode(item[col.columnName]);
                    break;
            }
            html_tbody_td.appendChild(html_tbody_td_content);
            html_tbody_tr.appendChild(html_tbody_td);
        }
        html_tbody.appendChild(html_tbody_tr);
    }

    html_table.appendChild(html_tbody);
    html_table.setAttribute('border', '1');
    html_div.appendChild(html_table);
    return html_div.innerHTML;
}


export default util;