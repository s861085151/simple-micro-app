<script setup lang="ts">
import { ref } from 'vue';

const showMircoApp = ref(true);
</script>

<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <h3>基座应用：Vite + Vue</h3>
  <p class="text-color">
    我是基座应用的文字
  </p>
  <button @click="showMircoApp =!showMircoApp">显示/隐藏</button>
  <micro-app name="app" url="http://localhost:6001/react17" v-if="showMircoApp"></micro-app>
</template>

<style>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.text-color {
  color: red;
}
</style>
