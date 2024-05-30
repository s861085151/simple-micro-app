import { createApp } from 'vue'
import './style.css'
import App from './App.vue';
import SimpleMicroApp from 'simple-micro-app';

window.globalStr = 'parent';

console.log('vue 基座应用')

SimpleMicroApp.start()

createApp(App).mount('#app')
