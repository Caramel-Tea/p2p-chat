<template>
  <div class="sidebar">
    <div class="my-identity-card glass-inset-tag">
      <span class="dot-indicator"></span>
      <span class="identity-lbl">My Node: <strong>{{ myName }}</strong> <small>({{ myGroup }})</small></span>
    </div>

    <div class="sidebar-header">
      <h4>Mesh Peers</h4>
      <span class="badge glass-sub-panel">{{ peerList.length }} online</span>
    </div>
    
    <div class="peer-container">
      <ul class="peer-ul">
        <li 
          v-for="peer in peerList" 
          :key="peer.username" 
          :class="['peer-li', { active: currentPeer?.username === peer.username }]"
          @click="$emit('select-peer', peer)"
        >
          <div class="peer-avatar glass-sub-panel">👤</div>
          <div class="peer-info">
            <strong class="peer-name">{{ peer.username }}</strong>
            <small class="peer-group">#{{ peer.group }}</small>
            <span class="ip-text">{{ peer.ip }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// 声明接收父组件下发的数据通道（包括列表状态、选中节点、身份元数据）
defineProps<{
  peerList: Array<any>;
  currentPeer: any;
  myName: string;
  myGroup: string;
}>();

defineEmits(['select-peer']);
</script>

<style>
.sidebar { width: 290px; border-right: 1px solid var(--glass-border); padding: 24px 16px; display: flex; flex-direction: column; gap: 16px; }
.my-identity-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 13px; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.03); }
/* 极客感动态呼吸灯动画规则定义 */
.dot-indicator { width: 8px; height: 8px; background: var(--accent-color); border-radius: 50%; box-shadow: 0 0 8px var(--accent-color); animation: pulse 2s infinite; }
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}
.identity-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 0 8px; }
.sidebar h4 { margin: 0; font-size: 15px; font-weight: 600; }
.badge { font-size: 11px; padding: 4px 10px; font-weight: 500; }
.peer-container { flex: 1; overflow-y: auto; padding: 10px 8px; margin: -10px -8px; }
.peer-ul { padding: 0; margin: 0; list-style: none; }
.peer-li { display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; border-radius: 16px; margin-bottom: 12px; border: 1px solid transparent; background: transparent; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.peer-li:hover { background: rgba(255, 255, 255, 0.12); border-color: var(--glass-border); }
/* 被激活的好友节点利用全局变量满血复活新拟态浮雕卡片效果 */
.peer-li.active { background: var(--bg-app); box-shadow: 5px 5px 12px var(--neu-dark), -5px -5px 12px var(--neu-light); border-color: rgba(255, 255, 255, 0.1); }
.peer-avatar { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 16px; border-radius: 12px; }
.peer-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.peer-name { font-size: 14px; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.peer-group { font-size: 11px; color: var(--text-muted); }
.ip-text { font-size: 11px; color: var(--text-muted); }
</style>
