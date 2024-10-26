import {createApp} from 'vue';
import App from './App.vue';
import router from './router'; // 引入路由

// 引入 Element Plus 和样式
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import {ElMessageBox} from 'element-plus';

import axios from 'axios';
const yaml = require('js-yaml');

// 配置文件加载成功后，创建应用实例并使用 Element Plus
function initializeApp(config) {
    const app = createApp(App);
    app.config.globalProperties.$appConfig = config;
    app.use(router); // 使用路由
    app.use(ElementPlus);
    app.mount('#app');
}

if (window.configYaml) {
    // 读取配置文件完成
    window.configYaml.onReadConfigReply((event, response) => {
        doConfig(response);
    });

    // 读取配置文件
    window.configYaml.readConfig();
} else {
    // 获取项目根目录的路径
    let response = await loadConfig('/config.yaml');
    doConfig(response);
}

function doConfig(response) {
    console.log("读取配置文件返回：" + JSON.stringify(response));
    if (response.type === "Success") {
        initializeApp(response.config);
    } else {
        // response.message = response.message.replace(/\s\d+\s\|\s/g, '</br>');
        response.message = response.message.replace(/(\s\d+\s\|\s)/g, '</br>$1');

        let messageHtml = `
    <div style="
        background-color: #f8d7da; 
        color: #721c24; 
        border: 1px solid #f5c6cb; 
        padding: 10px; 
        border-radius: 5px; 
        font-family: Arial, sans-serif; 
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h3 style="
            font-size: 14px; 
            margin-top: 0; 
            margin-bottom: 0; 
            color: #a94442;">
            请检查修正配置文件格式：
        </h3>
        <div style="
            font-size: 14px; 
            line-height: 1.5;">
            ${response.message}
        </div>
    </div>`;

        ElMessageBox.confirm(messageHtml, '配置文件读取出错', {
            showClose: false,
            dangerouslyUseHTMLString: true,
            distinguishCancelAndClose: true,
            closeOnClickModal: false,

            confirmButtonText: '关闭',
            cancelButtonText: '忽略配置文件继续'
        }).then(() => {
            // 退出程序
        }).catch(() => {
            initializeApp(response.config);
        });
    }
}

async function loadConfig(configPath) {
    var result = {
        type: "Fail",
        config: {},
        message: ""
    };

    let config;
    try {
        const response = await axios.get(configPath);
        config = yaml.load(response.data);

        result.type = "Success";
        result.config = config;
        result.message = "读取成功！";
    } catch (err) {
        console.error("Error reading config file:", err);

        result.type = "Error";
        result.message = `${err.message}`;
    }
    console.log("main.js读取配置文件结果：" + JSON.stringify(result));
    return result;
}


