<script setup>
import { onMounted, ref } from 'vue';
import { fetchHealth } from '@/api/client';

const loading = ref(true);
const error = ref('');
const health = ref(null);

onMounted(async () => {
    try {
        health.value = await fetchHealth();
    } catch (err) {
        error.value = err?.response?.data?.message || err?.message || 'Não foi possível conectar à API.';
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <section class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold text-surface-900">Status da API</h1>
            <p class="mt-2 text-surface-600">
                Verifica a conexão com o backend <code class="rounded bg-surface-100 px-1.5 py-0.5 text-sm">product_hub_api</code>.
            </p>
        </div>

        <Card>
            <template #title>Health check</template>
            <template #content>
                <div v-if="loading" class="text-surface-600">Consultando /api/v1/health…</div>
                <Message v-else-if="error" severity="warn" :closable="false">{{ error }}</Message>
                <div v-else class="space-y-2 text-sm">
                    <p><strong>Status:</strong> {{ health.status }}</p>
                    <p><strong>Serviço:</strong> {{ health.service }}</p>
                    <p><strong>Versão:</strong> {{ health.version }}</p>
                    <p><strong>Timestamp:</strong> {{ health.timestamp }}</p>
                </div>
            </template>
        </Card>
    </section>
</template>
