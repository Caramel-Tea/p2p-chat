// ==========================================
// 文件职责：Electron 主进程骨架生命周期管控中心，负责原生系统弹窗、数据缓存目录隔离、IPC(主网进程间双向网关通信)中转
// ==========================================
import fs from 'fs';
import { app, BrowserWindow, ipcMain, dialog } from 'electron'; 
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { setupUDP } from './udp';
import { setupTCP } from './tcp';
import { setupFileTransfer } from './tcp-file'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let udpActions: any = null;
let tcpActions: any = null;
let fileActions: any = null; 

// 核心功能：单机多开测试防锁死隔离。根据启动参数强制偏移 userData 缓存文件夹，避开系统文件占用拒绝访问 (0x5) 报错
const offset = process.env.PORT_OFFSET ? parseInt(process.env.PORT_OFFSET) : 0;
if (offset > 0) {
  app.setPath('userData', app.getPath('userData') + '_' + offset);
}

// 核心功能：创建具有毛玻璃半透明高阶滤镜支持的 Electron 原生应用系统级视窗容器
function createWindow() {
  const devIconPath = join(process.cwd(), 'build', 'icons', 'app-icon.png');

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    ...(fs.existsSync(devIconPath) ? { icon: devIconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // 注入桥梁预加载脚本
      sandbox: false, // 释放沙箱以允许使用底层 Node.js C++ 原生网卡套接字
    },
  });

  // 核心功能：生命周期事件卡点。必须等待前端渲染层 Vue 完全加载完毕后，再拉起 UDP/TCP 底层网络，防止 IPC 通信脱节丢失
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[LifeCycle] Frontend Vue UI is fully loaded. Initializing P2P layers...');
    if (!udpActions && !tcpActions && !fileActions) {
      tcpActions = setupTCP(mainWindow!.webContents);
      fileActions = setupFileTransfer(mainWindow!.webContents); 
      udpActions = setupUDP(mainWindow!.webContents);
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    const targetUrl = offset === 0 ? 'http://localhost:5173/' : 'http://localhost:5174/';
    mainWindow.loadURL(targetUrl);
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

// 核心功能：系统就绪与 IPC 跨进程通道注册中心
app.whenReady().then(() => {
  createWindow();

  // IPC 网关：中转前端 Vue 的注册请求，触发主进程底层全网网络广播上线
  ipcMain.on('register-user', (_, { username, group }) => {
    if (udpActions && tcpActions && fileActions) {
      udpActions.broadcastOnline(username, group, tcpActions.getRealPort(), fileActions.getFilePort());
    }
  });

  // IPC 网关：中转前端聊天输入框抛来的纯文本，注入底层 TCP 通道远端推送
  ipcMain.on('send-chat-msg', (_, { targetIp, targetTcpPort, senderName, text }) => {
    if (tcpActions) tcpActions.sendTCPMessage(targetIp, targetTcpPort, senderName, text);
  });

  // IPC 网关：接收前端点击文件加号请求，调用 Windows 原生对话框安全选档，随后灌入二进制发送模块
  ipcMain.on('select-and-send-file', async (_, { targetIp, targetFilePort }) => {
    if (!mainWindow || !fileActions) return;
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'] // 仅允许选单个常规文件
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const chosenPath = result.filePaths[0];
      fileActions.sendFile(targetIp, targetFilePort, chosenPath);
    }
  });
});
