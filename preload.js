const { contextBridge, ipcRenderer } = require('electron');

// 将方法暴露给渲染层
contextBridge.exposeInMainWorld('electronAPI', {
    // 读写文件注册为公共方法，避免web方式访问权限问题，使用方法：
    // window.electronAPI.readFile(this.filePath);
    // 异步，运行读取方法后，读取结果在onReadFileReply方法中回调，回调方法可以写在mounted()生命周期函数中：
    // window.electronAPI.onReadFileReply((event, data) => {
    //     this.fileContent = data;
    //     this.message = '文件读取成功';
    // });
    readFile: (filePath) => ipcRenderer.send('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.send('write-file', filePath, content),
    onReadFileReply: (callback) => ipcRenderer.on('read-file-reply', callback),
    onWriteFileReply: (callback) => ipcRenderer.on('write-file-reply', callback),
});

// 读取外置配置文件config.yaml
contextBridge.exposeInMainWorld('configYaml', {
    readConfig: (callback) => ipcRenderer.send('read-config', callback),
    onReadConfigReply: (callback) => ipcRenderer.on('read-config-reply', callback),
});

const { loadConfig } = require('./src/utils/common');
contextBridge.exposeInMainWorld('configLoader', {
    loadConfig: (configPath) => loadConfig(configPath),
});

