let cookie = {

};

cookie.set = function (key,value,time) {
    let obj = {};
    obj.data = value;
    obj.curTime = new Date().getTime();
    if(arguments.length === 2)
        obj.time = 3000*1000;
    if(arguments.length === 3)
        obj.time = time*1000;
    localStorage.setItem(key,JSON.stringify(obj));
}

cookie.get = function (key) {
    var objData = localStorage.getItem(key);
    if(isJSON(objData)){
        var obj = JSON.parse(objData);
        if (obj.time!=0&&new Date().getTime() - obj.curTime > obj.time)
            return undefined;
        return obj.data;
    }else return undefined;
}

cookie.remove = function (key) {
    localStorage.removeItem(key);
}

function isJSON(str) {
    if (typeof str == 'string') {
        try {
            var obj=JSON.parse(str);
            if(str.indexOf('{')>-1){
                return true;
            }else{
                return false;
            }

        } catch(e) {
            console.log(e);
            return false;
        }
    }
    return false;
}

export default cookie;