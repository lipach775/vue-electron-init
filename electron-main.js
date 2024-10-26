const { app, BrowserWindow, contextBridge, ipcMain, dialog } = require('electron');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true, // 隐藏菜单栏，但可以通过 Alt 键显示
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // 启用 Node.js API
            contextIsolation: true, // 允许主进程和渲染进程共享同一个上下文
            enableRemoteModule: true, // 确保远程模块启用
        },
    });

    // Vue 开发时使用本地服务器地址
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const loadUrl = isDev
        ? 'http://localhost:8080'
        : `file://${path.join(__dirname, 'dist/index.html')}`;

    console.log(`Loading URL: ${loadUrl}`); // 添加日志

    win.loadURL(loadUrl);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 监听从渲染进程发来的读取文件请求
ipcMain.on('read-file', (event, filePath) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            event.reply('read-file-reply', `Error: ${err.message}`);
        } else {
            event.reply('read-file-reply', data);
        }
    });
});

// 监听写入文件请求
ipcMain.on('write-file', (event, filePath, content) => {
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            event.reply('write-file-reply', `Error: ${err.message}`);
        } else {
            event.reply('write-file-reply', 'File written successfully');
        }
    });
});

// 读取 YAML 配置文件
ipcMain.on('read-config', (event) => {
    const path = require('path');

    // 确定配置文件路径（打包前后都能正常读取）
    const isDev = !app.isPackaged;
    const configPath = isDev
        ? path.join(__dirname, 'config.yaml')  // 开发模式下从项目根目录读取
        : path.join(path.dirname(process.resourcesPath), 'config.yaml'); // 打包后从 resources 目录的上一级读取，即应用跟目录

    event.reply('read-config-reply', loadConfig(configPath));
});

function loadConfig(configPath) {
    var result = {
        type: "Fail",
        config: {},
        message: ""
    };

    let config;
    try {
        const rawConfig = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(rawConfig);

        result.type = "Success";
        result.config = config;
        result.message = "读取成功！";
    } catch (err) {
        console.error("Error reading config file:", err);

        result.type = "Error";
        result.message = `${err.message}`;
    }
    console.log("electron-main.js读取配置文件结果：" + JSON.stringify(result));
    return result;
}



