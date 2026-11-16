/* پل ارتباط امن بین رابط برنامه و هسته Electron (برای سامانه به‌روزرسانی) */
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('amlakDesktop', {
  isDesktop: true,
  fetch:       function(url)   { return ipcRenderer.invoke('up:fetch', url) },
  readFile:    function(rel)   { return ipcRenderer.invoke('up:read-file', rel) },
  writeFiles:  function(files) { return ipcRenderer.invoke('up:write-files', files) },
  listBackups: function()      { return ipcRenderer.invoke('up:list-backups') },
  restore:     function(stamp) { return ipcRenderer.invoke('up:restore', stamp) },
  relaunch:    function()      { return ipcRenderer.invoke('up:relaunch') }
});
