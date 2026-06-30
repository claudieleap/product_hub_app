import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import StatusView from '@/views/StatusView.vue';
import RoadmapView from '@/views/RoadmapView.vue';
import RoadmapDevView from '@/views/RoadmapDevView.vue';

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
            path: '/roadmap',
            name: 'roadmap',
            component: RoadmapView,
            meta: { title: 'Roadmap de Produto' }
        },
        {
            path: '/roadmap/desenvolvimento',
            name: 'roadmap-dev',
            component: RoadmapDevView,
            meta: { title: 'Desenvolvimento · Roadmap' }
        },
        {
            path: '/status',
            name: 'status',
            component: StatusView,
            meta: { title: 'Status da API' }
        }
    ],
    scrollBehavior(to) {
        if (to.hash) {
            return { el: to.hash, behavior: 'smooth', top: 80 };
        }
        return { top: 0 };
    }
});

export default router;
