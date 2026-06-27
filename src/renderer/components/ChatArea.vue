<template>
  <div class="chat-window">
    <div v-if="currentPeer" class="chat-box">
      <div class="chat-header glass-sub-panel">
        <h4>Conversing with: <span class="highlight">{{ currentPeer.username }}</span></h4>
        <span class="ip-indicator glass-inset-tag">{{ currentPeer.ip }}</span>
      </div>
      
      <div v-if="fileStatus.status" class="top-file-progress glass-sub-panel">
        <div class="progress-meta">
          <span class="file-name-lbl">📂 {{ fileStatus.fileName }}</span>
          <span class="file-status-lbl">[{{ fileStatus.status }}]</span>
          <span class="file-percent-lbl">{{ fileStatus.progress }}%</span>
        </div>
        <div class="glass-progress-track">
          <div class="progress-bar-fill" :style="{ width: fileStatus.progress + '%' }"></div>
        </div>
      </div>

      <div class="message-list glass-timeline">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['msg-item', msg.sender === 'me' ? 'msg-me' : 'msg-other']"
        >
          <div class="msg-wrapper">
            <small class="msg-name">{{ msg.senderName }}</small>
            <div class="msg-bubble">
              <p>{{ msg.text }}</p>
              <img
                v-if="msg.isImage && msg.previewUrl"
                :src="msg.previewUrl"
                :alt="msg.fileName || 'image preview'"
                class="msg-image-preview"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="input-row-wrapper">
        <div class="messageBox">
          <div class="fileUploadWrapper">
            <button 
              :class="['plus-toggle-btn', { 'is-active': isFileMenuOpen }]" 
              @click="toggleFileMenu"
              title="Toggle file attachment"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            
            <transition name="pop-up">
              <div v-if="isFileMenuOpen" class="floating-file-menu neu-card" @click="handleSendFile">
                <span class="tooltip-arrow"></span>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Upload Files</span>
              </div>
            </transition>
          </div>

          <input 
            v-model="inputText"
            required
            type="text" 
            id="messageInput" 
            placeholder="Type a message..." 
            @keyup.enter="handleSendMessage"
          />
          
          <button @click="handleSendMessage" id="sendButton">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon glass-sub-panel">💬</div>
      <h4>No Node Link</h4>
      <p>Please select an active peer node from the left mesh sidebar to bridge a real-time stream channel.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  currentPeer: any;
  messages: Array<{
    sender: 'me' | 'other';
    senderName: string;
    text: string;
    fileName?: string;
    isImage?: boolean;
    previewUrl?: string | null;
  }>;
  fileStatus: any;
}>();

const emit = defineEmits(['send-message', 'trigger-send-file']);

const inputText = ref('');
const isFileMenuOpen = ref(false);

const toggleFileMenu = () => {
  isFileMenuOpen.value = !isFileMenuOpen.value;
};

const handleSendMessage = () => {
  if (!inputText.value.trim()) return;
  emit('send-message', inputText.value);
  inputText.value = '';
};

const handleSendFile = () => {
  isFileMenuOpen.value = false;
  emit('trigger-send-file');
};
</script>

<style>
.chat-window { flex: 1; display: flex; flex-direction: column; }
.chat-box { display: flex; flex-direction: column; height: 100%; padding: 24px; box-sizing: border-box; }
.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; margin-bottom: 16px; }
.chat-header h4 { margin: 0; font-size: 15px; font-weight: 500; }
.highlight { color: var(--accent-color); font-weight: 600; }
.ip-indicator { font-size: 11px; padding: 4px 10px; font-family: monospace; }
.top-file-progress { padding: 12px 20px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.progress-meta { display: flex; font-size: 12px; font-weight: 500; align-items: center; }
.file-name-lbl { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-status-lbl { color: var(--accent-color); margin-left: 6px; font-size: 11px; font-weight: bold; }
.file-percent-lbl { margin-left: auto; color: var(--text-main); font-weight: bold; }
.glass-progress-track { height: 6px; background: rgba(0, 0, 0, 0.08); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--accent-color); border-radius: 4px; transition: width 0.1s linear; }
.glass-timeline { flex: 1; padding: 24px; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 18px; background: var(--glass-timeline-bg); border: 1px solid var(--glass-border); border-radius: 20px; }
.msg-item { display: flex; width: 100%; }
/* 气泡流靠右排布规则 */
.msg-me { justify-content: flex-end; }
.msg-me .msg-wrapper { align-items: flex-end; }
.msg-me .msg-name { padding-right: 6px; padding-left: 0; }
.msg-me .msg-bubble { background: var(--bubble-me); color: var(--bubble-me-text); border-color: var(--bubble-me-border); border-top-left-radius: 14px; border-top-right-radius: 14px; border-bottom-left-radius: 14px; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(30, 109, 251, 0.04); }
/* 气泡流靠左排布规则 */
.msg-other { justify-content: flex-start; }
.msg-other .msg-wrapper { align-items: flex-start; }
.msg-other .msg-name { padding-left: 6px; padding-right: 0; }
.msg-other .msg-bubble { background: var(--bubble-other); color: var(--bubble-other-text); border-color: var(--bubble-other-border); border-top-left-radius: 14px; border-top-right-radius: 14px; border-bottom-right-radius: 14px; border-bottom-left-radius: 4px; }
.msg-wrapper { max-width: 70%; display: flex; flex-direction: column; }
.msg-name { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
.msg-bubble { border-radius: 14px; padding: 12px 16px; border: 1px solid transparent; }
.msg-bubble p { margin: 0; font-size: 14px; line-height: 1.45; word-break: break-all; }
.msg-image-preview { display: block; margin-top: 10px; max-width: min(320px, 100%); max-height: 240px; border-radius: 10px; object-fit: contain; border: 1px solid var(--glass-border); background: rgba(0, 0, 0, 0.08); }
.input-row-wrapper { display: flex; justify-content: center; width: 100%; }
.messageBox { width: 100%; height: 48px; display: flex; align-items: center; justify-content: center; background-color: var(--input-box-bg); padding: 0 16px; border-radius: 14px; border: 1px solid var(--input-box-border); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04); transition: border-color 0.3s, box-shadow 0.3s; }
.messageBox:focus-within { border: 1px solid var(--input-box-focus); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08); }
.fileUploadWrapper { width: fit-content; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; margin-right: 4px; }
.plus-toggle-btn { background: transparent; border: none; outline: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; color: var(--input-svg-fill); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, color 0.2s; }
.plus-toggle-btn:hover { background-color: rgba(255, 255, 255, 0.15); color: var(--text-main); }
.plus-toggle-btn.is-active { transform: rotate(135deg); color: var(--accent-color); }
.floating-file-menu { position: absolute; bottom: 56px; left: -10px; display: flex; align-items: center; gap: 8px; padding: 10px 16px; white-space: nowrap; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-main); border: 1px solid var(--glass-border); z-index: 99; }
.floating-file-menu:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.15); }
.tooltip-arrow { position: absolute; bottom: -6px; left: 20px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid var(--bg-app); }
#messageInput { flex: 1; height: 100%; background-color: transparent; outline: none; border: none; padding-left: 12px; color: var(--input-text); font-size: 14px; }
#sendButton { width: fit-content; height: 100%; background-color: transparent; outline: none; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--input-svg-fill); transition: all 0.25s ease; padding: 0 4px; }
#sendButton:hover { color: var(--accent-color); transform: scale(1.08); }
/* 子菜单回弹动画的贝塞尔三次方程三次曲线控制 */
.pop-up-enter-active, .pop-up-leave-active { transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease; }
.pop-up-enter-from, .pop-up-leave-to { transform: translateY(12px) scale(0.9); opacity: 0; }
.empty-state { margin: auto; text-align: center; max-width: 340px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
.empty-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.empty-state h4 { margin: 0; font-size: 18px; font-weight: 600; }
.empty-state p { margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.55; }
</style>
