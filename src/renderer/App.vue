<template>
  <div :class="['app-container', isDarkMode ? 'theme-dark' : 'theme-light']">
    
    <div class="theme-toggle-wrapper">
      <button class="neu-toggle-btn" @click="toggleTheme">
        <span class="theme-icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
      </button>
    </div>

    <UserRegister 
      v-if="!isRegistered" 
      @register-success="handleRegisterSuccess" 
    />

    <div v-else class="chat-main glass-panel">
      <PeerSidebar 
        :peerList="peerList"
        :currentPeer="currentPeer"
        :myName="username"
        :myGroup="group"
        @select-peer="handleSelectPeer"
      />
      
      <ChatArea 
        :currentPeer="currentPeer"
        :messages="messages"
        :fileStatus="fileStatus"
        @send-message="handleSendMessage"
        @trigger-send-file="handleTriggerSendFile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UserRegister from './components/UserRegister.vue';
import PeerSidebar from './components/PeerSidebar.vue';
import ChatArea from './components/ChatArea.vue';

type ChatMessage = {
  sender: 'me' | 'other';
  senderName: string;
  text: string;
  fileName?: string;
  filePath?: string;
  isImage?: boolean;
  previewUrl?: string | null;
};

const username = ref('');
const group = ref('Default');
const isRegistered = ref(false);
const currentPeer = ref<any>(null);
const fileStatus = ref({ status: '', progress: 0, fileName: '' });

const isDarkMode = ref(false);
const toggleTheme = () => { isDarkMode.value = !isDarkMode.value; };

const peerList = ref<Array<any>>([]);
const messages = ref<ChatMessage[]>([]);

// 核心功能：接收注册表单发来的 Payload 回调，完成用户本地授权激活
const handleRegisterSuccess = (payload: { username: string, group: string }) => {
  username.value = payload.username;
  group.value = payload.group;
  isRegistered.value = true;
};

// 核心功能：处理侧边栏鼠标选中节点，清空历史残余变量，锁定目标 TCP 会话信道
const handleSelectPeer = (peer: any) => {
  currentPeer.value = peer;
  messages.value = [];
};

// 核心功能：中转文本事件。本地推入右侧聊天框，随后调用 ElectronAPI 的连接指令
const handleSendMessage = (text: string) => {
  if (!currentPeer.value) return;
  messages.value.push({ sender: 'me', senderName: username.value, text });
  (window as any).electronAPI.sendChatMessage(currentPeer.value.ip, currentPeer.value.tcpPort, username.value, text);
};

// 核心功能：中转文件传输事件。抽取目标端口，通知主进程唤醒原生选档弹窗
const handleTriggerSendFile = () => {
  if (!currentPeer.value) return;
  (window as any).electronAPI.selectAndSendFile(currentPeer.value.ip, currentPeer.value.filePort);
};

onMounted(() => {
  // 核心监听：常驻监听主进程推送上来的局域网在线 P2P 邻居信息，做动态排重合并
  (window as any).electronAPI.onPeerOnline((peer: any) => {
    if (!peer.username || peer.username.trim() === "") return;
    if (!peerList.value.some(p => p.username === peer.username)) {
      peerList.value.push(peer);
    }
  });

  // 核心监听：常驻接收文本信道数据，并在前端塞入左侧/对方气泡通知面板
  (window as any).electronAPI.onReceiveMessage((data: any) => {
    if (currentPeer.value && currentPeer.value.username === data.senderName) {
      messages.value.push({ sender: 'other', senderName: data.senderName, text: data.text });
    }
  });

  // 核心监听：处理大文件收发进度。不仅驱动进度条滚动，更在 100% 成功时，追加特殊的系统级消息记录
  (window as any).electronAPI.onFileProgress((data: any) => {
    fileStatus.value = { status: data.status.toUpperCase(), progress: data.progress, fileName: data.fileName || 'Unknown' };
    
    if (data.status === 'received_success') {
      messages.value.push({
        sender: 'other',
        senderName: currentPeer.value?.username || 'Peer',
        text: `📂 [Received File] -> ${data.fileName}`,
        fileName: data.fileName,
        filePath: data.filePath,
        isImage: data.isImage,
        previewUrl: data.previewUrl,
      });
    }
    if (data.status === 'send_success') {
      messages.value.push({
        sender: 'me',
        senderName: username.value,
        text: `📂 [Sent File] -> ${data.fileName}`,
        fileName: data.fileName,
        filePath: data.filePath,
        isImage: data.isImage,
        previewUrl: data.previewUrl,
      });
    }
    if (data.status.includes('success') || data.status === 'failed') {
      setTimeout(() => { fileStatus.value = { status: '', progress: 0, fileName: '' }; }, 3000);
    }
  });
});
</script>

<style>
/* 全局核心色彩变元，维持无 scoped 渗透以全面激活跨层级的新拟态卡片 */
.theme-light {
  --bg-app: #e2eaf4; --text-main: #2c3a4e; --text-muted: #627387; --neu-light: #ffffff; --neu-dark: #b5c3d8;
  --glass-base: rgba(255, 255, 255, 0.35); --glass-sub: rgba(255, 255, 255, 0.45); --glass-border: rgba(255, 255, 255, 0.5); --glass-timeline-bg: rgba(255, 255, 255, 0.22);
  --bubble-me: #ffffff; --bubble-me-text: #1a2536; --bubble-me-border: rgba(255, 255, 255, 0.6); --bubble-other: rgba(255, 255, 255, 0.6); --bubble-other-text: #2c3a4e; --bubble-other-border: rgba(255, 255, 255, 0.4);
  --accent-color: #00827a; --input-box-bg: #e6eefc; --input-box-border: #b5c3d8; --input-box-focus: #00827a; --input-text: #2c3a4e; --input-svg-fill: #627387;
}
.theme-dark {
  --bg-app: #151a22; --text-main: #f0f4f9; --text-muted: #7e8f9f; --neu-light: #1f2733; --neu-dark: #0b0e12;
  --glass-base: rgba(22, 28, 38, 0.45); --glass-sub: rgba(30, 39, 54, 0.6); --glass-border: rgba(255, 255, 255, 0.08); --glass-timeline-bg: rgba(10, 14, 20, 0.35);
  --bubble-me: #1e6dfb; --bubble-me-text: #ffffff; --bubble-me-border: rgba(255, 255, 255, 0.15); --bubble-other: rgba(30, 39, 54, 0.8); --bubble-other-text: #f0f4f9; --bubble-other-border: rgba(255, 255, 255, 0.05);
  --accent-color: #00ffd5; --input-box-bg: #2d2d2d; --input-box-border: rgb(63, 63, 63); --input-box-focus: rgb(110, 110, 110); --input-text: #ffffff; --input-svg-fill: #9e9e9e;
}
.app-container { display: flex; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: var(--bg-app); color: var(--text-main); transition: background 0.4s ease, color 0.3s ease; position: relative; overflow: hidden; }
.neu-card { background: var(--bg-app); box-shadow: 6px 6px 14px var(--neu-dark), -6px -6px 14px var(--neu-light) !important; border-radius: 16px; }
.glass-inset-tag { background: rgba(0, 0, 0, 0.05); border: 1px solid var(--glass-border); color: var(--text-muted); border-radius: 8px; box-shadow: inset 4px 4px 10px var(--neu-dark), inset -4px -4px 10px var(--neu-light) !important; }
.chat-main { display: flex; width: calc(100% - 40px); height: calc(100vh - 40px); margin: auto; border-radius: 24px; background: var(--glass-base); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid var(--glass-border); box-shadow: 0 24px 50px rgba(0, 0, 0, 0.12); overflow: hidden; }
.theme-toggle-wrapper { position: absolute; top: 15px; right: 15px; z-index: 999; }
.neu-toggle-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: var(--bg-app); box-shadow: 4px 4px 10px var(--neu-dark), -4px -4px 10px var(--neu-light); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s ease; }
.neu-toggle-btn:active { box-shadow: inset 3px 3px 6px var(--neu-dark), inset -3px -3px 6px var(--neu-light); transform: scale(0.96); }
</style>
