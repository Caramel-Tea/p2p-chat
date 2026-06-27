// ==========================================
// 文件职责：负责局域网内的 P2P 节点盲搜发现与自动动态组网握手（UDP 广播与单播）
// ==========================================
import dgram from 'dgram';
import type { WebContents } from 'electron';

const BASE_UDP_PORT = 41234;

export function setupUDP(webContents: WebContents) {
  const offset = process.env.PORT_OFFSET ? parseInt(process.env.PORT_OFFSET) : 0;
  const myUdpPort = BASE_UDP_PORT + offset;
  const targetUdpPort = offset === 0 ? BASE_UDP_PORT + 1 : BASE_UDP_PORT;
  const server = dgram.createSocket('udp4');

  let myUsername = '';
  let myGroup = '';
  let myTcpPort = 41240;
  let myFilePort = 41300;

  // 核心功能：监听局域网内其他节点抛出的 UDP 广播或单播握手包
  server.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'ONLINE') {
        if (data.username === myUsername) return; // 过滤自己发出去的回环广播

        // 将捕获到的对等方网卡 IP、TCP 文本端口、TCP 文件端口同步推送给前端 Vue 渲染列表
        webContents.send('peer-online', {
          username: data.username,
          group: data.group,
          ip: rinfo.address === '127.0.0.1' ? '127.0.0.1' : rinfo.address,
          tcpPort: data.tcpPort || 41240,
          filePort: data.filePort || 41300 
        });
        
        // 如果对方是初次盲搜上线（isReply 为 false），则立马向对方的专属端口定向单播回应，完成双向握手
        if (!data.isReply) {
          const replyMessage = JSON.stringify({
            type: 'ONLINE',
            username: myUsername,
            group: myGroup,
            tcpPort: myTcpPort,
            filePort: myFilePort,
            isReply: true
          });
          server.send(replyMessage, targetUdpPort, '127.0.0.1');
        }
      }
    } catch (e) {
      console.error('[UDP Error] Parse data failed:', e);
    }
  });

  // 核心功能：UDP 服务端口绑定成功后，全网激活 Broadcast（广播）权限
  server.on('listening', () => {
    try { server.setBroadcast(true); } catch (e) {}
    console.log(`[UDP Ready] Bound to port ${myUdpPort}, Target port: ${targetUdpPort}`);
  });

  server.bind(myUdpPort);

  // 核心功能：主动向局域网内广播/定向单播发送自己的“上线通知包”
  function broadcastOnline(username: string, group: string, tcpPort: number, incomingFilePort: number) {
    myUsername = username;
    myGroup = group;
    myTcpPort = tcpPort;
    myFilePort = incomingFilePort; 

    const message = JSON.stringify({
      type: 'ONLINE',
      username,
      group,
      tcpPort,
      filePort: incomingFilePort, 
      isReply: false
    });
    
    server.send(message, targetUdpPort, '127.0.0.1');
  }

  return { broadcastOnline };
}
