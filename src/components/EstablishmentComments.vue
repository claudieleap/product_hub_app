<script setup>
import { computed, ref, watch } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import { useAuth } from '@/composables/useAuth';
import '@/assets/commercial.css';

const props = defineProps({
    id: { type: String, default: '' }
});

const { getEstablishment, fetchComments, postComment } = useEstablishments();
const { user } = useAuth();

const establishment = computed(() => getEstablishment(props.id));

const comments = ref([]);
const commentsLoading = ref(false);
const commentsError = ref(null);
const commentText = ref('');
const commentSaving = ref(false);

async function loadComments() {
    comments.value = [];
    commentsError.value = null;
    commentText.value = '';
    if (!establishment.value) return;

    commentsLoading.value = true;
    try {
        comments.value = await fetchComments(establishment.value.id);
    } catch (error) {
        commentsError.value = error.message || 'Não foi possível carregar os comentários.';
    } finally {
        commentsLoading.value = false;
    }
}

watch(() => establishment.value?.id, loadComments, { immediate: true });

async function submitComment() {
    const text = commentText.value.trim();
    if (!text || !establishment.value) return;

    commentSaving.value = true;
    commentsError.value = null;

    try {
        const created = await postComment(establishment.value.id, text);
        comments.value = [created, ...comments.value];
        commentText.value = '';
    } catch (error) {
        commentsError.value = error.message || 'Não foi possível salvar o comentário.';
    } finally {
        commentSaving.value = false;
    }
}

function formatCommentDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
    <template v-if="establishment">
        <div class="com-field">
            <Textarea v-model="commentText" rows="2" :placeholder="`Comentando como ${user?.name ?? 'você'}...`" />
            <div style="display: flex; align-items: center; gap: 10px">
                <Button
                    type="button"
                    size="small"
                    label="Comentar"
                    :loading="commentSaving"
                    :disabled="!commentText.trim()"
                    @click="submitComment"
                />
                <span v-if="commentsError" style="font-size: 12px; color: var(--hub-coral, #cf4a3e)">{{ commentsError }}</span>
            </div>
        </div>

        <p v-if="commentsLoading" class="com-comment-empty">Carregando comentários...</p>
        <p v-else-if="!comments.length" class="com-comment-empty">Nenhum comentário ainda.</p>

        <ul v-else class="com-comment-list">
            <li v-for="item in comments" :key="item.id" class="com-comment">
                <div class="com-comment__head">
                    <span class="com-comment__author">{{ item.authorName }}</span>
                    <span class="com-comment__date">{{ formatCommentDate(item.createdAt) }}</span>
                </div>
                <p class="com-comment__text">{{ item.comment }}</p>
            </li>
        </ul>
    </template>
</template>
