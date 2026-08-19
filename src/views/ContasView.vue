<script setup>
import { onMounted, ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import { authApi } from '@/api/authClient';
import { useAuth } from '@/composables/useAuth';
import '@/assets/commercial.css';

const { user: currentUser } = useAuth();

const users = ref([]);
const loading = ref(true);
const loadError = ref('');
const feedback = ref('');

const createDialogVisible = ref(false);
const form = ref({ name: '', username: '', email: '', role: 'user' });
const creating = ref(false);
const formError = ref('');

const roleOptions = [
    { label: 'Usuário (acompanha)', value: 'user' },
    { label: 'Admin (gerencia contas)', value: 'admin' }
];

async function refresh() {
    loading.value = true;
    loadError.value = '';
    try {
        const data = await authApi.listUsers();
        users.value = data?.users ?? [];
    } catch (err) {
        loadError.value = err.message || 'Não foi possível carregar as contas.';
    } finally {
        loading.value = false;
    }
}

function openCreateDialog() {
    form.value = { name: '', username: '', email: '', role: 'user' };
    formError.value = '';
    createDialogVisible.value = true;
}

async function onCreate() {
    if (!form.value.name.trim() || !form.value.username.trim()) {
        formError.value = 'Preencha nome e usuário.';
        return;
    }
    creating.value = true;
    formError.value = '';
    feedback.value = '';
    try {
        await authApi.createUser({
            name: form.value.name.trim(),
            username: form.value.username.trim().toLowerCase(),
            email: form.value.email.trim() || null,
            role: form.value.role
        });
        feedback.value = `Conta "${form.value.username}" criada com a senha padrão Mudar@2026.`;
        createDialogVisible.value = false;
        await refresh();
    } catch (err) {
        formError.value = err.fields
            ? Object.values(err.fields).flat().join(' ')
            : err.message || 'Não foi possível criar a conta.';
    } finally {
        creating.value = false;
    }
}

async function onResetPassword(target) {
    if (!window.confirm(`Redefinir a senha de "${target.username}" para Mudar@2026?`)) return;
    try {
        await authApi.resetPassword(target.id);
        feedback.value = `Senha de "${target.username}" redefinida para Mudar@2026.`;
        await refresh();
    } catch (err) {
        feedback.value = err.message || 'Falha ao redefinir a senha.';
    }
}

async function onToggleRole(target) {
    const nextRole = target.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Alterar "${target.username}" para ${nextRole}?`)) return;
    try {
        await authApi.updateRole(target.id, nextRole);
        await refresh();
    } catch (err) {
        feedback.value = err.message || 'Falha ao alterar o papel.';
    }
}

async function onDelete(target) {
    if (!window.confirm(`Excluir a conta "${target.username}"? Essa ação não pode ser desfeita.`)) return;
    try {
        await authApi.deleteUser(target.id);
        feedback.value = `Conta "${target.username}" removida.`;
        await refresh();
    } catch (err) {
        feedback.value = err.message || 'Falha ao excluir a conta.';
    }
}

onMounted(refresh);
</script>

<template>
    <VuePressLayout>
        <div class="home-page contas-page">
            <PageHeader
                eyebrow="Administração"
                title="Contas"
                subtitle="Contas do time. Senha padrão de novas contas: Mudar@2026."
            >
                <template #actions>
                    <Button text icon="pi pi-refresh" label="Atualizar" @click="refresh" />
                    <Button icon="pi pi-user-plus" label="Cadastrar novo" @click="openCreateDialog" />
                </template>
            </PageHeader>

            <p v-if="feedback" class="contas-feedback">{{ feedback }}</p>
            <p v-if="loadError" class="contas-error">{{ loadError }}</p>

            <section class="contas-card">
                <p v-if="loading" class="contas-muted">Carregando…</p>

                <div v-else class="com-table-wrap">
                    <table class="com-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>Papel</th>
                                <th>Senha</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in users" :key="u.id">
                                <td>{{ u.name }}</td>
                                <td class="contas-mono">{{ u.username }}</td>
                                <td>
                                    <span class="contas-role" :class="`contas-role--${u.role}`">
                                        {{ u.role === 'admin' ? 'Admin' : 'Usuário' }}
                                    </span>
                                </td>
                                <td>
                                    <span v-if="u.mustChangePassword" class="contas-pending" title="Ainda não trocou a senha padrão">
                                        padrão
                                    </span>
                                    <span v-else class="contas-muted">definida</span>
                                </td>
                                <td class="contas-actions">
                                    <Button
                                        text
                                        size="small"
                                        icon="pi pi-key"
                                        title="Redefinir senha para o padrão"
                                        @click="onResetPassword(u)"
                                    />
                                    <Button
                                        text
                                        size="small"
                                        :icon="u.role === 'admin' ? 'pi pi-user-minus' : 'pi pi-user-plus'"
                                        :title="u.role === 'admin' ? 'Tornar usuário' : 'Tornar admin'"
                                        @click="onToggleRole(u)"
                                    />
                                    <Button
                                        v-if="u.id !== currentUser?.id"
                                        text
                                        size="small"
                                        severity="danger"
                                        icon="pi pi-trash"
                                        title="Excluir conta"
                                        @click="onDelete(u)"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog
                v-model:visible="createDialogVisible"
                modal
                append-to="body"
                header="Cadastrar novo"
                :style="{ width: 'min(420px, 96vw)' }"
                :draggable="false"
            >
                <div class="contas-form">
                    <label class="contas-field">
                        <span>Nome</span>
                        <InputText v-model="form.name" placeholder="Nome completo" />
                    </label>
                    <label class="contas-field">
                        <span>Usuário</span>
                        <InputText v-model="form.username" placeholder="ex.: joao (sem espaços)" />
                    </label>
                    <label class="contas-field">
                        <span>E-mail (opcional)</span>
                        <InputText v-model="form.email" placeholder="para reset por e-mail no futuro" />
                    </label>
                    <label class="contas-field">
                        <span>Papel</span>
                        <Select
                            v-model="form.role"
                            :options="roleOptions"
                            option-label="label"
                            option-value="value"
                            append-to="body"
                        />
                    </label>
                    <p v-if="formError" class="contas-error">{{ formError }}</p>
                    <Button
                        label="Criar conta"
                        icon="pi pi-user-plus"
                        :loading="creating"
                        @click="onCreate"
                    />
                </div>
            </Dialog>
        </div>
    </VuePressLayout>
</template>

<style scoped>
.contas-card {
    background: var(--hub-surface);
    border: 1px solid var(--hub-line);
    border-radius: 14px;
    padding: 18px;
}

.contas-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.contas-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.contas-field > span {
    font-size: 12px;
    font-weight: 600;
    color: var(--hub-ink-soft);
}

.contas-field :deep(.p-inputtext),
.contas-field :deep(.p-select) {
    width: 100%;
}

.contas-error {
    margin: 0;
    font-size: 13px;
    color: var(--hub-coral);
}

.contas-feedback {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--hub-green);
    background: var(--hub-green-wash);
    padding: 8px 10px;
    border-radius: 8px;
}

.contas-muted {
    color: var(--hub-muted);
    font-size: 13px;
}

.contas-mono {
    font-family: 'IBM Plex Mono', monospace;
    color: var(--hub-ink-soft);
}

.contas-role {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 6px;
}

.contas-role--admin {
    background: var(--hub-moat-wash);
    color: var(--hub-moat);
}

.contas-role--user {
    background: var(--hub-blue-wash);
    color: var(--hub-blue);
}

.contas-pending {
    font-size: 11px;
    font-weight: 700;
    color: var(--hub-amber);
    background: var(--hub-amber-wash);
    padding: 3px 8px;
    border-radius: 6px;
}

.contas-actions {
    display: flex;
    gap: 2px;
    justify-content: flex-end;
}
</style>
