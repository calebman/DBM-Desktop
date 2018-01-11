import Vue from 'vue';
import App from './App';
import Router from 'vue-router';
import Vuex from 'vuex';
import Util from './libs/util';
import cookie from './libs/cookie';
import iView from 'iview';
import 'iview/dist/styles/iview.css';
import {routers, otherRouter, appRouter} from './router/index';
import VueI18n from 'vue-i18n';
import Locales from './locale';
import zhLocale from 'iview/src/locale/lang/zh-CN';
import enLocale from 'iview/src/locale/lang/en-US';
import zhTLocale from 'iview/src/locale/lang/zh-TW';
import electron from 'electron';


Vue.prototype.appPath = 'http://127.0.0.1:12500/file';
Vue.prototype.appFilePath = 'C:/Users/Lenovo/Desktop/nginx-1.13.6/files';
if (!process.env.IS_WEB) {
    Vue.use(require('vue-electron'));
    const shell = require('electron').shell
    const ipc = electron.ipcRenderer;
    const dialog = require('electron').dialog

    Vue.prototype.getSaveFilePath = function (options) {
        ipc.send('save-dialog', options);
        ipc.once('saved-file', function (event, path) {
            callback(path);
        });
    };

    Vue.prototype.getOpenFilePath = function (options, callback) {
        ipc.send('open-dialog', options);
        ipc.once('open-dialog', function (event, files) {
            callback(files);
        });
    };

    Vue.prototype.openFile = function (filePath) {
        shell.openItem(filePath);
    }

    let gotAppPath = ipc.sendSync('get-app-path');
    if (gotAppPath.indexOf('DBM') > -1)
        gotAppPath = gotAppPath.substring(0, gotAppPath.indexOf('DBM') + 'DBM'.length+1) + 'data';
    if (process.env.BUILD_TARGET) {
        Vue.prototype.appPath = gotAppPath;
        Vue.prototype.appFilePath = gotAppPath;
    };
    //C:\Users\Lenovo\AppData\Local\Programs\DBM\resources\app.asar
    console.log('app path is ' + gotAppPath);

    Vue.prototype.doLogic = function () {
        let param = [];
        let logicName = arguments[0];
        for (let key in arguments)
            if (key != 0)
                param.push(arguments[key]);
        console.info('do '+logicName);
        let result = ipc.sendSync('app-logic', logicName, param);
        console.info(logicName +' return '+JSON.stringify(result));
        return result;
    };
}
Vue.config.productionTip = false;
Vue.use(iView);
Vue.use(Router);
Vue.use(Vuex);
Vue.use(VueI18n);


//部分组件需要全局注册
import IndexColumn from './views/datatable/components/index-column.vue';
import TextColumn from './views/datatable/components/text-column.vue';
import NumberColumn from './views/datatable/components/number-column.vue';
import FileColumn from './views/datatable/components/file-column.vue';
import DatetimeColumn from './views/datatable/components/datetime-column.vue';

Vue.component('IndexColumn', IndexColumn);
Vue.component('TextColumn', TextColumn);
Vue.component('NumberColumn', NumberColumn);
Vue.component('FileColumn', FileColumn);
Vue.component('DatetimeColumn', DatetimeColumn);


// 自动设置语言
const navLang = navigator.language;
const localLang = (navLang === 'zh-CN' || navLang === 'en-US') ? navLang : false;
const lang = window.localStorage.lang || localLang || 'zh-CN';
Vue.config.lang = lang;

// 多语言配置
const locales = Locales;
const mergeZH = Object.assign(zhLocale, locales['zh-CN']);
const mergeEN = Object.assign(enLocale, locales['en-US']);
const mergeTW = Object.assign(zhTLocale, locales['zh-TW']);
Vue.locale('zh-CN', mergeZH);
Vue.locale('en-US', mergeEN);
Vue.locale('zh-TW', mergeTW);

// 路由配置
const RouterConfig = {
    // mode: 'history',
    routes: routers
};
const router = new Router(RouterConfig);

router.beforeEach((to, from, next) => {
    iView.LoadingBar.start();
    Util.title(to.meta.title);
    if (!cookie.get('cookie-user') && to.name !== 'login') {  // 判断是否已经登录且前往的页面不是登录页
        next({
            name: 'login'
        });
    } else if (cookie.get('cookie-user') && to.name === 'login') {  // 判断是否已经登录且前往的是登录页
        Util.title();
        if(!process.env.IS_WEB)
            Vue.prototype.doLogic('buildConn',{
                database: cookie.get('cookie-user'),
                password: cookie.get('cookie-password')
            });
        next({
            name: 'home_index'
        });
    } else {
        cookie.set(cookie.get('cookie-user'));
        cookie.set(cookie.get('cookie-password'));
        if (Util.getRouterObjByName([otherRouter, ...appRouter], to.name).access !== undefined) {  // 判断用户是否有权限访问当前页
            if (Util.getRouterObjByName([otherRouter, ...appRouter], to.name).access === parseInt(cookie.get('cookie-access'))) {
                Util.toDefaultPage([otherRouter, ...appRouter], to.name, router, next);  // 如果在地址栏输入的是一级菜单则默认打开其第一个二级菜单的页面
            } else {
                router.replace({
                    name: 'error_401'
                });
                next();
            }
        } else {
            if (to.name === 'home_index')
                if(!process.env.IS_WEB)
                    Vue.prototype.doLogic('buildConn',{
                        database: cookie.get('cookie-user'),
                        password: cookie.get('cookie-password')
                    });
            Util.toDefaultPage([otherRouter, ...appRouter], to.name, router, next);
        }
    }
    iView.LoadingBar.finish();
});

router.afterEach(() => {
    iView.LoadingBar.finish();
    window.scrollTo(0, 0);
});
// 状态管理
const store = new Vuex.Store({
    state: {
        routers: [
            otherRouter,
            ...appRouter
        ],
        menuList: [],
        tagsList: [...otherRouter.children],
        pageOpenedList: [{
            title: '首页',
            path: '',
            name: 'home_index'
        }],
        currentPageName: '',
        currentPath: [
            {
                title: '首页',
                path: '',
                name: 'home_index'
            }
        ],  // 面包屑数组
        openedSubmenuArr: [],  // 要展开的菜单数组
        menuTheme: '', // 主题
        theme: '',
        cachePage: [],
        lang: '',
        isFullScreen: false,
        hideMenuText:false,
        msgs:[[
            {
                title: '这是一条未读信息',
                time: 1507390106000,
                msg:'这是您点击的《这是一条未读信息》的相关内容。'
            }
        ],[
            {
                title: '这是一条您已经读过的消息',
                time: 1507330106000,
                msg:'这是您点击的《这是一条您已经读过的消息》的相关内容。'
            }
        ],[
            {
                title: '这是一条被删除的消息',
                time: 1506390106000,
                msg:'这是您点击的《这是一条被删除的消息》的相关内容。'
            }
        ]],
        dontCache: []  // 在这里定义你不想要缓存的页面的name属性值(参见路由配置router.js)
        //dontCache: ['table', 'database']  // 在这里定义你不想要缓存的页面的name属性值(参见路由配置router.js)
    },
    mutations: {
        setTagsList(state, list) {
            state.tagsList.push(...list);
        },
        closePage(state, name) {
            state.cachePage.forEach((item, index) => {
                if (item === name) {
                    state.cachePage.splice(index, 1);
                }
            });
        },
        increateTag(state, tagObj) {
            if (!Util.oneOf(tagObj.name, state.dontCache)) {
                state.cachePage.push(tagObj.name);
                localStorage.cachePage = JSON.stringify(state.cachePage);
            }
            state.pageOpenedList.push(tagObj);
        },
        initCachepage(state) {
            if (localStorage.cachePage) {
                state.cachePage = JSON.parse(localStorage.cachePage);
            }
        },
        removeTag(state, name) {
            state.pageOpenedList.map((item, index) => {
                if (item.name === name) {
                    state.pageOpenedList.splice(index, 1);
                }
            });
        },
        pageOpenedList(state, get) {
            let openedPage = state.pageOpenedList[get.index];
            if (get.argu) {
                openedPage.argu = get.argu;
            }
            if (get.query) {
                openedPage.query = get.query;
            }
            state.pageOpenedList.splice(get.index, 1, openedPage);
            localStorage.pageOpenedList = JSON.stringify(state.pageOpenedList);
        },
        clearAllTags(state) {
            state.pageOpenedList.splice(1);
            router.push({
                name: 'home_index'
            });
            state.cachePage.length = 0;
            localStorage.pageOpenedList = JSON.stringify(state.pageOpenedList);
        },
        clearOtherTags(state, vm) {
            let currentName = vm.$route.name;
            let currentIndex = 0;
            state.pageOpenedList.forEach((item, index) => {
                if (item.name === currentName) {
                    currentIndex = index;
                }
            });
            if (currentIndex === 0) {
                state.pageOpenedList.splice(1);
            } else {
                state.pageOpenedList.splice(currentIndex + 1);
                state.pageOpenedList.splice(1, currentIndex - 1);
            }
            let newCachepage = state.cachePage.filter(item => {
                return item === currentName;
            });
            state.cachePage = newCachepage;
            localStorage.pageOpenedList = JSON.stringify(state.pageOpenedList);
        },
        setOpenedList(state) {
            state.pageOpenedList = localStorage.pageOpenedList ? JSON.parse(localStorage.pageOpenedList) : [otherRouter.children[0]];
        },
        setCurrentPath(state, pathArr) {
            state.currentPath = pathArr;
        },
        setCurrentPageName(state, name) {
            state.currentPageName = name;
        },
        addOpenSubmenu(state, name) {
            let hasThisName = false;
            let isEmpty = false;
            if (name.length === 0) {
                isEmpty = true;
            }
            if (state.openedSubmenuArr.indexOf(name) > -1) {
                hasThisName = true;
            }
            if (!hasThisName && !isEmpty) {
                state.openedSubmenuArr.push(name);
            }
        },
        clearOpenedSubmenu(state) {
            state.openedSubmenuArr.length = 0;
        },
        changeMenuTheme(state, theme) {
            state.menuTheme = theme;
        },
        changeMainTheme(state, mainTheme) {
            state.theme = mainTheme;
        },
        setMenuList(state, menulist) {
            state.menuList = menulist;
        },
        updateMenulist(state) {
            let accessCode = parseInt(cookie.get('cookie-access'));
            let menuList = [];
            appRouter.forEach((item, index) => {
                if (item.access !== undefined) {
                    if (Util.showThisRoute(item.access, accessCode)) {
                        if (item.children.length === 1) {
                            menuList.push(item);
                        } else {
                            let len = menuList.push(item);
                            let childrenArr = [];
                            childrenArr = item.children.filter(child => {
                                if (child.access !== undefined) {
                                    if (child.access === accessCode) {
                                        return child;
                                    }
                                } else {
                                    return child;
                                }
                            });
                            menuList[len - 1].children = childrenArr;
                        }
                    }
                } else {
                    if (item.children.length === 1) {
                        menuList.push(item);
                    } else {
                        let len = menuList.push(item);
                        let childrenArr = [];
                        childrenArr = item.children.filter(child => {
                            if (child.access !== undefined) {
                                if (Util.showThisRoute(child.access, accessCode)) {
                                    return child;
                                }
                            } else {
                                return child;
                            }
                        });
                        let handledItem = JSON.parse(JSON.stringify(menuList[len - 1]));
                        handledItem.children = childrenArr;
                        menuList.splice(len - 1, 1, handledItem);
                    }
                }
            });
            state.menuList = menuList;
        },
        setAvator(state, path) {
            localStorage.avatorImgPath = path;
        },
        switchLang(state, lang) {
            state.lang = lang;
            Vue.config.lang = lang;
        },
        handleFullScreen(state) {
            let main = document.body;
            if (state.isFullScreen) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            } else {
                if (main.requestFullscreen) {
                    main.requestFullscreen();
                } else if (main.mozRequestFullScreen) {
                    main.mozRequestFullScreen();
                } else if (main.webkitRequestFullScreen) {
                    main.webkitRequestFullScreen();
                } else if (main.msRequestFullscreen) {
                    main.msRequestFullscreen();
                }
            }
        },
        changeFullScreenState(state) {
            state.isFullScreen = !state.isFullScreen;
        },
        changeHideMenuText(state){
            state.hideMenuText = !state.hideMenuText
        },
        addMessage(state,msg){
            let unreadList =  state.msgs[0];
            unreadList.push(msg);
            state.msgs.splice(0,1,unreadList);
        }
    }
});


/* eslint-disable no-new */
var vm = new Vue({
    components: {App},
    router: router,
    store: store,
    data: {
        currentPageName: ''
    },
    mounted() {
        this.currentPageName = this.$route.name;
        this.$store.commit('initCachepage');
        // 权限菜单过滤相关
        this.$store.commit('updateMenulist');
        // 全屏相关
        // 全屏相关
        document.addEventListener('fullscreenchange', () => {
            this.$store.commit('changeFullScreenState');
        });
        document.addEventListener('mozfullscreenchange', () => {
            this.$store.commit('changeFullScreenState');
        });
        document.addEventListener('webkitfullscreenchange', () => {
            this.$store.commit('changeFullScreenState');
        });
        document.addEventListener('msfullscreenchange', () => {
            this.$store.commit('changeFullScreenState');
        });
    },
    created() {
        let tagsList = [];
        appRouter.map((item) => {
            if (item.children.length <= 1) {
                tagsList.push(item.children[0]);
            } else {
                tagsList.push(...item.children);
            }
        });
        this.$store.commit('setTagsList', tagsList);
    },
    template: '<App/>'
}).$mount('#app')
