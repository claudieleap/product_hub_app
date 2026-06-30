<script setup>
const modules = [
    {
        title: 'Board de Validação',
        description: 'Hipóteses de PMF, tese central e medidor de prontidão.',
        icon: 'pi pi-chart-bar',
        accent: '#1e4fe0',
        status: 'Em breve'
    },
    {
        title: 'Documentação',
        description: 'Guias e playbooks para operadoras e processos financeiros.',
        icon: 'pi pi-book',
        accent: '#0e9e92',
        status: 'Em breve'
    },
    {
        title: 'Roadmap de Produto',
        description: 'Matriz de itens por módulo, prioridade e status de desenvolvimento.',
        icon: 'pi pi-th-large',
        accent: '#6e47c9',
        status: 'Em breve'
    }
];
</script>

<template>
    <section class="space-y-8">
        <div class="space-y-3">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary">Aleevia</p>
            <h1 class="text-4xl font-bold tracking-tight text-surface-900">Product Hub</h1>
            <p class="max-w-2xl text-lg text-surface-600">
                Central de estratégia de produto: validação, documentação e roadmap em um único lugar.
                Repositório dedicado para evoluir o hub sem acoplar ao legado.
            </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
            <article
                v-for="module in modules"
                :key="module.title"
                class="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
            >
                <div
                    class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    :style="{ background: module.accent }"
                >
                    <i :class="module.icon" />
                </div>
                <h2 class="text-lg font-semibold text-surface-900">{{ module.title }}</h2>
                <p class="mt-2 text-sm text-surface-600">{{ module.description }}</p>
                <Tag class="mt-4" :value="module.status" severity="secondary" />
            </article>
        </div>
    </section>
</template>
