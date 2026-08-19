<script setup>
import { onMounted, ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import { fetchHealth } from '@/api/client';
import '@/assets/home.css';

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
    <VuePressLayout>
        <div class="home-page">
            <div class="wrap">
                <PageHeader
                    title="Status da API"
                    subtitle="Verifica a conexão com o backend product_hub_api."
                />

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
            </div>
        </div>
    </VuePressLayout>
</template>
