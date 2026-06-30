import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';

import '@/assets/tailwind.css';
import '@/assets/app.css';

const app = createApp(App);

const ProductHubPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eef2fe',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#1e4fe0',
            600: '#1e4fe0',
            700: '#163baa',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
        }
    }
});

app.use(PrimeVue, {
    theme: {
        preset: ProductHubPreset,
        options: {
            darkModeSelector: '.dark, .app-dark'
        }
    }
});

app.use(router);
app.mount('#app');
