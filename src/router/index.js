import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import StatusView from '@/views/StatusView.vue';
import RoadmapView from '@/views/RoadmapView.vue';
import RoadmapDevView from '@/views/RoadmapDevView.vue';
import RoadmapBacklogView from '@/views/RoadmapBacklogView.vue';
import RoadmapEntregasView from '@/views/RoadmapEntregasView.vue';
import MetricsConfigView from '@/views/MetricsConfigView.vue';
import OnboardingView from '@/views/OnboardingView.vue';
import { getRoadmapTypeMeta, isRoadmapType } from '@/config/roadmapTypes';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { title: 'Product Hub' }
        },
        {
            path: '/roadmap',
            redirect: '/roadmap/saas'
        },
        {
            path: '/roadmap/desenvolvimento',
            redirect: '/roadmap/saas/desenvolvimento'
        },
        {
            path: '/roadmap/:type',
            name: 'roadmap',
            component: RoadmapView,
            props: true,
            meta: {
                title: (route) => `Roadmap ${getRoadmapTypeMeta(route.params.type).label}`
            }
        },
        {
            path: '/roadmap/:type/backlog',
            name: 'roadmap-backlog',
            component: RoadmapBacklogView,
            props: true,
            meta: {
                title: (route) => `Backlog · Roadmap ${getRoadmapTypeMeta(route.params.type).label}`
            }
        },
        {
            path: '/roadmap/:type/desenvolvimento',
            name: 'roadmap-dev',
            component: RoadmapDevView,
            props: true,
            meta: {
                title: (route) => `Desenvolvimento · Roadmap ${getRoadmapTypeMeta(route.params.type).label}`
            }
        },
        {
            path: '/entregas',
            name: 'entregas',
            component: RoadmapEntregasView,
            meta: { title: 'Entregas' }
        },
        {
            path: '/onboarding',
            name: 'onboarding',
            component: OnboardingView,
            meta: { title: 'Onboarding de clínicas' }
        },
        {
            path: '/configuracoes/metricas',
            name: 'config-metricas',
            component: MetricsConfigView,
            meta: { title: 'Métricas de sucesso' }
        },
        {
            path: '/roadmap/:type/entregas',
            redirect: '/entregas'
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

router.beforeEach((to) => {
    if (to.params.type && !isRoadmapType(to.params.type)) {
        return '/roadmap/saas';
    }

    const titleMeta = to.meta.title;
    if (typeof titleMeta === 'function') {
        to.meta.title = titleMeta(to);
    }
});

export default router;
