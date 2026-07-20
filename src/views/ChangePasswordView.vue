<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api/authClient';
import { useAuth } from '@/composables/useAuth';
import ProductHubLogo from '@/components/ProductHubLogo.vue';
import '@/assets/auth.css';

const router = useRouter();
const { user, mustChangePassword, setUser, logout } = useAuth();

const password = ref('');
const confirm = ref('');
const loading = ref(false);
const error = ref('');

const valid = computed(() => password.value.length >= 8 && password.value === confirm.value);

async function onSubmit() {
    if (!valid.value) {
        error.value = password.value.length < 8
            ? 'A senha precisa ter ao menos 8 caracteres.'
            : 'As senhas não conferem.';
        return;
    }
    loading.value = true;
    error.value = '';
    try {
        const data = await authApi.changePassword(password.value, confirm.value);
        if (data?.user) setUser(data.user);
        router.push('/');
    } catch (err) {
        error.value = err.fields?.password?.[0] || err.message || 'Não foi possível atualizar a senha.';
    } finally {
        loading.value = false;
    }
}

async function onLogout() {
    await logout();
    router.push('/login');
}
</script>

<template>
    <div class="auth-shell">
        <div class="auth-card">
            <div class="auth-logo">
                <ProductHubLogo :size="40" />
            </div>
            <h1 class="auth-title">Defina sua senha</h1>
            <p class="auth-subtitle">Olá, {{ user?.name }} — crie uma senha só sua para continuar</p>

            <form class="auth-form" @submit.prevent="onSubmit">
                <label class="auth-field">
                    <span>Nova senha</span>
                    <Password
                        v-model="password"
                        :feedback="false"
                        toggle-mask
                        autocomplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                    />
                </label>
                <label class="auth-field">
                    <span>Confirme a senha</span>
                    <Password
                        v-model="confirm"
                        :feedback="false"
                        toggle-mask
                        autocomplete="new-password"
                        placeholder="Repita a senha"
                    />
                </label>

                <p v-if="error" class="auth-error">{{ error }}</p>
                <p v-if="!mustChangePassword" class="auth-note">Sua senha já foi definida.</p>

                <Button
                    type="submit"
                    label="Salvar senha"
                    icon="pi pi-check"
                    :loading="loading"
                    :disabled="!valid"
                    class="auth-submit"
                />
            </form>

            <button type="button" class="auth-linkbtn" @click="onLogout">Sair</button>
        </div>
        <p class="auth-footer">Aleevia · Product Hub</p>
    </div>
</template>

<style scoped>
.auth-linkbtn {
    margin-top: 16px;
    border: none;
    background: transparent;
    color: #62718b;
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
}
.auth-linkbtn:hover {
    color: #1e4fe0;
}
</style>
