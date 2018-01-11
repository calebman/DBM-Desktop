//导入所需模块
var mysql=require("mysql");
//导入配置文件
var config  =require("../conf/db.json");
import logUtil from '../libs/logUtil';
logUtil.getLog('logic.mysql.connection');

var pool  = mysql.createPool(config);

var buildPool = function (buildConfig) {
    for(let buildKey in buildConfig)
        for(let configKey in config)
            if(buildKey == configKey)
                config[configKey] = buildConfig[buildKey];
    logUtil.info("mysql build config: "+JSON.stringify(config));
    pool = mysql.createPool(config);
}

//执行sql语句
var execute = function(sql){
    return new Promise(function (resolve, reject) {
        pool.getConnection(function(err,conn){
            if(err){
                logUtil.error(err);
                reject(err);
            }else{
                logUtil.log('execute '+sql);
                conn.query(sql,function(err,vals){
                    if(err)
                        reject(err);
                    resolve(vals);
                    conn.release();
                });
            }
        });
    })
};
export default{
    config:config,
    buildPool:buildPool,
    execute:execute
}