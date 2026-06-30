<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

watch(
    () => route.meta.title,
    (title) => {
        document.title = title ? `${title} · Product Hub` : 'Product Hub · Aleevia';
    },
    { immediate: true }
);
</script>

<template>
    <div class="app-shell min-h-screen bg-surface-50 text-surface-900">
        <header class="border-b border-surface-200 bg-white">
            <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
                <router-link to="/" class="flex items-center gap-3 no-underline text-inherit">
                    <span
                        class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-semibold"
                    >
                        PH
                    </span>
                    <div>
                        <p class="text-sm font-semibold leading-tight">Product Hub</p>
                        <p class="text-xs text-surface-500">Aleevia</p>
                    </div>
                </router-link>
                <nav class="flex items-center gap-2 text-sm">
                    <router-link to="/" class="nav-link" active-class="nav-link--active">Início</router-link>
                    <router-link to="/status" class="nav-link" active-class="nav-link--active">Status API</router-link>
                </nav>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-6 py-8">
            <router-view />
        </main>
    </div>
</template>
