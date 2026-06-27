<template>
  <div class="register-screen">
    <div class="register-box neu-card">
      <h3>P2P Chat Portal</h3>
      <p class="subtitle">Enter credentials to scan local mesh network</p>
      
      <div class="wave-group">
        <input v-model="localUsername" required type="text" class="input" placeholder=" " />
        <span class="bar"></span>
        <label class="label">
          <span v-for="(char, i) in 'Username'" :key="i" class="label-char" :style="{ '--index': i }">{{ char }}</span
        ></label>
      </div>

      <div class="wave-group">
        <input v-model="localGroup" required type="text" class="input" placeholder=" " />
        <span class="bar"></span>
        <label class="label">
          <span v-for="(char, i) in 'Group Name'" :key="i" class="label-char" :style="{ '--index': i }">{{ char }}</span>
        </label>
      </div>

      <button @click="submitRegister" class="styled-button">
        <span>Join Local Network</span>
        <div class="inner-button">
          <svg class="icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const localUsername = ref('');
const localGroup = ref('Default');

const emit = defineEmits(['register-success']);

// 核心功能：提交表单并触发桥梁，向局域网大范围抛出上线盲搜数据，同时引发父外壳视图状态跳转
const submitRegister = () => {
  if (!localUsername.value.trim()) return;
  (window as any).electronAPI.registerUser(localUsername.value, localGroup.value);
  emit('register-success', { username: localUsername.value, group: localGroup.value });
};
</script>
<style>
/* 保持登录特有控件动画，未加 scoped，全自动通过层级渗透继承 App.vue 根节点的新拟态全局高光变元 */
.register-screen { margin: auto; display: flex; justify-content: center; align-items: center; }
.register-box { padding: 40px; width: 340px; display: flex; flex-direction: column; align-items: center; gap: 30px; }
.register-box h3 { margin: 0; font-size: 22px; font-weight: 700; }
.subtitle { font-size: 12px; color: var(--text-muted); text-align: center; margin: -15px 0 10px 0; }
.wave-group { position: relative; width: 100%; }
.wave-group .input { font-size: 15px; padding: 12px 10px 8px 5px; display: block; width: 100%; border: none; border-bottom: 2px solid var(--text-muted); background: transparent; color: var(--text-main); box-sizing: border-box; }
.wave-group .input:focus { outline: none; }
.wave-group .label { color: var(--text-muted); font-size: 15px; position: absolute; pointer-events: none; left: 5px; top: 12px; display: flex; }
.wave-group .label-char { transition: 0.25s cubic-bezier(0.5, 1, 0.5, 12) all; transition-delay: calc(var(--index) * .04s); }
.wave-group .input:focus ~ label .label-char, .wave-group .input:not(:placeholder-shown) ~ label .label-char { transform: translateY(-24px); font-size: 12px; color: var(--accent-color); font-weight: bold; }
.wave-group .bar { position: relative; display: block; width: 100%; }
.wave-group .bar:before, .wave-group .bar:after { content: ''; height: 2px; width: 0; bottom: 0px; position: absolute; background: var(--accent-color); transition: 0.3s ease all; }
.wave-group .bar:before { left: 50%; } .wave-group .bar:after { right: 50%; }
.wave-group .input:focus ~ .bar:before, .wave-group .input:focus ~ .bar:after { width: 50%; }
.styled-button { position: relative; padding: 10px 24px; font-size: 14px; font-weight: bold; color: #ffffff; background: linear-gradient(to bottom, #2c3545, #151b24); border-radius: 9999px; cursor: pointer; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #3a4659; width: 100%; box-sizing: border-box; margin-top: 10px; }
.styled-button:active { transform: translateY(2px); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
.styled-button .inner-button { position: relative; display: flex; align-items: center; justify-content: center; background: linear-gradient(to bottom, #1e2530, #2b3445); width: 32px; height: 32px; margin-left: 12px; border-radius: 50%; border: 1px solid #364254; }
.styled-button .icon { transition: all 0.3s ease; }
.styled-button:hover .icon { transform: translateX(3px); }
</style>
