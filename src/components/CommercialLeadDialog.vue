<script setup>
import { computed } from 'vue';
import { useEstablishments } from '@/composables/useEstablishments';
import EstablishmentDataForm from '@/components/EstablishmentDataForm.vue';
import EstablishmentComments from '@/components/EstablishmentComments.vue';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    cnpj: { type: String, default: '' }
});

const { getEstablishment } = useEstablishments();

const establishment = computed(() => getEstablishment(props.cnpj));
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="com-dialog"
        :header="establishment?.fantasia || establishment?.razaoSocial || 'Estabelecimento'"
        :style="{ width: 'min(760px, 96vw)' }"
        :content-style="{ maxHeight: '78vh' }"
        :draggable="false"
    >
        <Tabs value="dados">
            <TabList>
                <Tab value="dados">Dados</Tab>
                <Tab value="comentarios">Comentários</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="dados">
                    <EstablishmentDataForm :id="cnpj" />
                </TabPanel>
                <TabPanel value="comentarios">
                    <EstablishmentComments :id="cnpj" />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </Dialog>
</template>
