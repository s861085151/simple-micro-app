import { createApp } from 'vue'
import './style.css'
import App from './App.vue';

import SimpleMicroApp from '../../../src/index.js';

SimpleMicroApp.start()

createApp(App).mount('#app')
