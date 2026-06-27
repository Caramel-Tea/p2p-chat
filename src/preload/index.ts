import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  registerUser: (username: string, group: string) => ipcRenderer.send('register-user', { username, group }),
  onPeerOnline: (callback: (peer: any) => void) => ipcRenderer.on('peer-online', (_event, peer) => callback(peer)),
  
  // IPC 通道
  sendChatMessage: (targetIp: string, targetTcpPort: number, senderName: string, text: string) => 
    ipcRenderer.send('send-chat-msg', { targetIp, targetTcpPort, senderName, text }),
    
  // 接消息监听通道
  onReceiveMessage: (callback: (data: any) => void) => 
    ipcRenderer.on('receive-message', (_event, data) => callback(data)),

  selectAndSendFile: (targetIp: string, targetFilePort: number) => 
    ipcRenderer.send('select-and-send-file', { targetIp, targetFilePort }),

  // 监听文件进度条
  onFileProgress: (callback: (data: any) => void) => 
    ipcRenderer.on('file-progress', (_event, data) => callback(data))
});
