import Main from '@/views/Main.vue';


// 不作为Main组件的子页面展示的页面单独写，如下
export const loginRouter = {
    path: '/login',
    name: 'login',
    meta: {
        title: 'Login - 登录'
    },
    component: resolve => { require(['@/views/login'], resolve).default; }
};

export const page401 = {
    path: '/401',
    meta: {
        title: '401-权限不足'
    },
    name: 'error_401',
    component: resolve => { require(['@/views/error_page/401.vue'], resolve).default; }
};

export const page500 = {
    path: '/500',
    meta: {
        title: '500-程序内部错误'
    },
    name: 'error_500',
    component: resolve => { require(['@/views/error_page/500.vue'], resolve).default; }
};



// 作为Main组件的子页面展示但是不在左侧菜单显示的路由写在otherRouter里
export const otherRouter = {
    path: '/',
    name: 'otherRouter',
    component: Main,
    children: [
        { path: 'home', title: {i18n: 'home'}, name: 'home_index', component: resolve => { require(['@/views/home/home.vue'], resolve).default; } },
        { path: 'ownspace', title: '个人中心', name: 'ownspace_index', component: resolve => { require(['@/views/own-space/own-space.vue'], resolve).default; } },
        { path: 'message', title: '消息中心', name: 'message_index', component: resolve => { require(['@/views/message/message.vue'], resolve).default; } },
        { path: 'table', title: '表格展示', name: 'table_index', component: resolve => { require(['@/views/datatable/table.vue'], resolve).default; } }
    ]
};

// 作为Main组件的子页面展示并且在左侧菜单显示的路由写在appRouter里
export const appRouter = [
    {
        path: '/access',
        icon: 'key',
        name: 'access',
        title: '权限管理',
        component: Main,
        children: [
            { path: 'index', title: '权限管理', name: 'access_index', component: resolve => { require(['@/views/access/access.vue'], resolve).default; } }
        ]
    },
    {
        path: '/database',
        icon: 'ios-grid-view',
        name: 'database',
        title: '数据库',
        component: Main,
        children: [
            { path: 'databaseTable', title: '数据表格', name: 'database-table', icon: 'arrow-move', component: resolve => { require(['@/views/database/database-table.vue'], resolve).default; } }
        ]
    }
];
// 所有上面定义的路由都要写在下面的routers里
export const routers = [
    loginRouter,
    otherRouter,
    ...appRouter,
    page500,
    page401
];

