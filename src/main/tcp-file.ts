// ==========================================
// 文件职责：基于 Node Stream（流）管道处理 P2P 大文件的高速二进制异步收发，防内存爆满
// ==========================================
import net from 'net';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { WebContents } from 'electron';

const offset = process.env.PORT_OFFSET ? parseInt(process.env.PORT_OFFSET) : 0;
const DEFAULT_FILE_PORT = 41300 + offset * 10; 

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg']);

function getPreviewPayload(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const isImage = IMAGE_EXTENSIONS.has(extension);

  return {
    filePath,
    isImage,
    previewUrl: isImage ? pathToFileURL(filePath).href : null,
  };
}

export function setupFileTransfer(webContents: WebContents) {
  let currentFilePort = DEFAULT_FILE_PORT;

  // 核心功能：挂载文件接收服务端。接收对端推过来的二进制文件流
  const server = net.createServer((socket) => {
    let fileStream: fs.WriteStream | null = null;
    let metaData: { fileName: string; fileSize: number } | null = null;
    let receivedSize = 0;

    socket.on('data', (chunk) => {
      // 1. 协议解析（切片粘包处理）：如果还没解析过头部，说明这是首包，先解出文件名和大写
      if (!metaData) {
        try {
          const headerEndIndex = chunk.indexOf('\n');
          if (headerEndIndex !== -1) {
            const headerStr = chunk.subarray(0, headerEndIndex).toString();
            metaData = JSON.parse(headerStr);
            
            // 在程序根目录优雅自动生成各自实例专属的文件落盘保存文件夹
            const saveDir = path.join(process.cwd(), `received_files_${offset}`);
            if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
            
            const savePath = path.join(saveDir, metaData!.fileName);
            fileStream = fs.createWriteStream(savePath); // 开启文件写入流
            
            const remainingData = chunk.subarray(headerEndIndex + 1);
            if (remainingData.length > 0) {
              fileStream.write(remainingData);
              receivedSize += remainingData.length;
            }
            return;
          }
        } catch (e) {
          console.error('[File Error] Metadata parse failed:', e);
          socket.destroy();
          return;
        }
      }

      // 2. 二进制落盘：后续传来的纯文件块，像水流一样持续不间断直接灌入硬盘写入流
      if (fileStream && metaData) {
        fileStream.write(chunk);
        receivedSize += chunk.length;
        
        // 阶梯式计算接收百分比进度，反馈给前端 Vue 视图层滑下、刷新高阶进度条
        const progress = Math.round((receivedSize / metaData.fileSize) * 100);
        webContents.send('file-progress', { status: 'receiving', progress, fileName: metaData.fileName });
      }
    });

    // 核心功能：对端流管道关闭（传输完成），安全切断落盘写入流，并推送通知弹窗
    socket.on('end', () => {
      if (fileStream) {
        fileStream.end();
        const savedFilePath = metaData ? path.join(process.cwd(), `received_files_${offset}`, metaData.fileName) : '';
        webContents.send('file-progress', {
          status: 'received_success',
          progress: 100,
          fileName: metaData?.fileName,
          ...getPreviewPayload(savedFilePath),
        });
      }
    });

    socket.on('error', (err) => {
      console.error('[File Receiver Error] Socket crashed:', err.message);
      webContents.send('file-progress', { status: 'failed', progress: 0 });
    });
  });

  function startFileServer(port: number) {
    server.listen(port, () => {
      currentFilePort = port;
      console.log(`[File Server Ready] Listening on port: ${currentFilePort}`);
    });
  }

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      startFileServer(currentFilePort + 1);
    }
  });

  startFileServer(DEFAULT_FILE_PORT);

  // 核心功能：作为发送客户端，弹出对话框后读取本地文件，并用 Stream 管道通过网络推给对端
  function sendFile(targetIp: string, targetFilePort: number, filePath: string) {
    if (!fs.existsSync(filePath)) {
      console.error(`[File Send Error] Source file does not exist: ${filePath}`);
      webContents.send('file-progress', { status: 'failed', progress: 0 });
      return;
    }

    // 单机多开动态保底策略：若接收方网络层突发性由于异步锁没就绪，使用对端默认端口保底
    const finalPort = targetFilePort && targetFilePort > 0 ? targetFilePort : (offset === 0 ? 41310 : 41300);
    const stat = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const fileSize = stat.size;
    const ip = targetIp === '127.0.0.1' || targetIp.includes('192.168') ? '127.0.0.1' : targetIp;

    console.log(`[File Outbound] Target IP: ${ip}, Target Port: ${finalPort}, File: ${fileName}`);

    const client = new net.Socket();
    
    client.connect(finalPort, ip, () => {
      // 封装传输协议头：格式为 JSON元数据 + 换行符\n
      const header = JSON.stringify({ fileName, fileSize }) + '\n';
      client.write(header);

      // 利用 fs.createReadStream 开启硬盘读取流，低开销、平滑注入网络 Socket 管道
      const readStream = fs.createReadStream(filePath);
      let sentSize = 0;

      readStream.on('data', (chunk) => {
        sentSize += chunk.length;
        const progress = Math.round((sentSize / fileSize) * 100);
        webContents.send('file-progress', { status: 'sending', progress, fileName }); // 向发送端前端抛进度
      });

      readStream.on('end', () => {
        client.end();
        webContents.send('file-progress', {
          status: 'send_success',
          progress: 100,
          fileName,
          ...getPreviewPayload(filePath),
        });
      });

      readStream.pipe(client); // 👈 核心高阶技术点：流式传输管道直连
    });

    client.on('error', (err) => {
      console.error('[File Sender Error] Connection failed:', err.message);
      webContents.send('file-progress', { status: 'failed', progress: 0 });
    });
  }

  return {
    sendFile,
    getFilePort: () => currentFilePort
  };
}
