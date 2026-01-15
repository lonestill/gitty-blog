const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPosts: () => ipcRenderer.invoke('get-posts'),
  savePost: (data) => ipcRenderer.invoke('save-post', data),
  deletePost: (filename) => ipcRenderer.invoke('delete-post', filename),
  uploadPost: (data) => ipcRenderer.invoke('upload-post', data),
  generateIndex: () => ipcRenderer.invoke('generate-index'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config)
});
