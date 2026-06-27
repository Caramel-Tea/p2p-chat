// ==========================================
// 文件职责：管理面向连接、高可靠性的 P2P 聊天文本数据通信（基于原生 Node.js net 模块）
// ==========================================
import net from 'net';
import type { WebContents } from 'electron';

const offset = process.env.PORT_OFFSET ? parseInt(process.env.PORT_OFFSET) : 0;
const DEFAULT_TCP_PORT = 41240 + offset * 10; 

export function setupTCP(webContents: WebContents) {
  let currentTcpPort = DEFAULT_TCP_PORT;

  // 核心功能：创建 TCP 套接字服务器，常驻后台异步监听别的节点发来的聊天消息
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'TEXT') {
          // 通过 IPC 通道将收到的消息内容、发送方昵称、远端真实 IP 派发给前端聊天气泡面板
          webContents.send('receive-message', {
            senderName: parsed.senderName,
            text: parsed.text,
            ip: socket.remoteAddress
          });
        }
      } catch (e) {
        console.error('TCP parse data error:', e);
      }
    });
  });

  // 核心功能：启动并挂载 TCP 服务，监听来自全网特定端口的连接请求
  function startServer(port: number) {
    server.listen(port, () => {
      currentTcpPort = port;
      console.log(`[TCP Ready] Message server listening on port: ${currentTcpPort}`);
    });
  }

  // 核心功能：端口防碰撞自增策略。如果预设端口被抢占，自动 +1 寻找下一个可用端口建立服务
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[TCP Conflict] Port ${currentTcpPort} in use, trying next...`);
      startServer(currentTcpPort + 1); 
    } else {
      console.error('TCP server error:', err);
    }
  });

  startServer(DEFAULT_TCP_PORT);

  // 核心功能：作为客户端主动拨号连接到目标的 TCP 服务端，并将文本消息灌入流管道发送出去
  function sendTCPMessage(targetIp: string, targetTcpPort: number, senderName: string, text: string) {
    const client = new net.Socket();
    const ip = targetIp === '127.0.0.1' || targetIp.includes('192.168') ? '127.0.0.1' : targetIp;

    client.connect(targetTcpPort || DEFAULT_TCP_PORT, ip, () => {
      const message = JSON.stringify({
        type: 'TEXT',
        senderName,
        text
      });
      client.write(message);
      client.end(); // 传输完毕后安全关闭 Socket，释放连接资源
    });

    client.on('error', (err) => {
      console.error('TCP transmission failed:', err.message);
    });
  }

  return { 
    sendTCPMessage,
    getRealPort: () => currentTcpPort 
  };
}
