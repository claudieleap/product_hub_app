import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import StatusView from '@/views/StatusView.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { title: 'Hub de Produto' }
        },
        {
            path: '/status',
            name: 'status',
            component: StatusView,
            meta: { title: 'Status da API' }
        }
    ]
});

export default router;
