<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const features = [
    {
        title: 'Roadmap de Produto',
        description: 'Matriz de itens por módulo e prioridade. Organize o que construir e quando.',
        icon: 'pi pi-th-large',
        color: '#6e47c9',
        to: { name: 'roadmap' }
    },
    {
        title: 'Board de Desenvolvimento',
        description: 'Kanban por status de implementação — a fazer, em andamento e concluído.',
        icon: 'pi pi-list-check',
        color: '#1e4fe0',
        to: { name: 'roadmap-dev' }
    },
    {
        title: 'Status da API',
        description: 'Verifique a conexão com o backend product_hub_api.',
        icon: 'pi pi-server',
        color: '#0e9e92',
        to: { name: 'status' }
    }
];
</script>

<template>
    <section class="space-y-8">
        <div class="space-y-3">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary">Aleevia</p>
            <h1 class="text-4xl font-bold tracking-tight text-surface-900">Product Hub</h1>
            <p class="max-w-2xl text-lg text-surface-600">
                Central de estratégia de produto com roadmap compartilhado via API. Tudo sincronizado entre
                equipe e ambientes.
            </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
            <router-link
                v-for="feature in features"
                :key="feature.title"
                :to="feature.to"
                class="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm no-underline text-inherit transition hover:border-primary-200 hover:shadow-md"
            >
                <div
                    class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    :style="{ background: feature.color }"
                >
                    <i :class="feature.icon" />
                </div>
                <h2 class="text-lg font-semibold text-surface-900">{{ feature.title }}</h2>
                <p class="mt-2 text-sm text-surface-600">{{ feature.description }}</p>
                <span class="mt-4 inline-block text-sm font-medium text-primary">Acessar →</span>
            </router-link>
        </div>
    </section>
</template>
