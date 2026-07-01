<script setup>
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import { ROADMAP_TYPES, roadmapDevPath, roadmapMatrixPath } from '@/config/roadmapTypes';
import '@/assets/home.css';
</script>

<template>
    <VuePressLayout home>
        <div class="home-page hub-home">
            <div class="hub-home__glow" aria-hidden="true" />

            <div class="wrap">
                <section class="hub-home__hero home-hero">
                    <p class="home-hero__eyebrow">Aleevia · Estratégia de produto</p>
                    <h1>Product Hub</h1>
                    <p class="home-hero__lead">
                        Um lugar para toda a empresa <b>ver, priorizar e acompanhar</b> o que estamos
                        construindo — em três frentes independentes, sempre atualizadas.
                    </p>
                </section>

                <section class="hub-home__cards" aria-label="Roadmaps">
                    <article
                        v-for="roadmap in ROADMAP_TYPES"
                        :key="roadmap.id"
                        class="hub-home-card"
                        :class="`hub-home-card--${roadmap.id}`"
                        :style="{
                            '--card-accent': roadmap.color,
                            '--card-wash': roadmap.wash
                        }"
                    >
                        <div class="hub-home-card__head">
                            <span class="hub-home-card__icon" :style="{ background: roadmap.color }">
                                <i :class="roadmap.icon" />
                            </span>
                            <div>
                                <p class="hub-home-card__tagline">{{ roadmap.tagline }}</p>
                                <h2 class="hub-home-card__title">Roadmap {{ roadmap.label }}</h2>
                            </div>
                        </div>

                        <p class="hub-home-card__desc">{{ roadmap.description }}</p>

                        <ul class="hub-home-card__highlights">
                            <li v-for="item in roadmap.highlights" :key="item">
                                <i class="pi pi-check" />
                                {{ item }}
                            </li>
                        </ul>

                        <div class="hub-home-card__footer">
                            <router-link :to="roadmapMatrixPath(roadmap.id)" class="hub-home-card__cta">
                                Abrir matriz
                                <i class="pi pi-arrow-right" />
                            </router-link>
                            <router-link :to="roadmapDevPath(roadmap.id)" class="hub-home-card__secondary">
                                Board de desenvolvimento
                            </router-link>
                        </div>
                    </article>
                </section>

                <section class="hub-home__guide">
                    <h2 class="hub-home__guide-title">Como acompanhar</h2>
                    <div class="hub-home__guide-grid">
                        <article class="hub-home__guide-item">
                            <span class="hub-home__guide-num">1</span>
                            <div>
                                <h3>Matriz de prioridades</h3>
                                <p>
                                    Veja o que está em Alta, Média, Baixa ou Perfumaria, organizado por módulo.
                                    Ideal para alinhar estratégia com produto e liderança.
                                </p>
                            </div>
                        </article>
                        <article class="hub-home__guide-item">
                            <span class="hub-home__guide-num">2</span>
                            <div>
                                <h3>Board de desenvolvimento</h3>
                                <p>
                                    Acompanhe o que saiu da matriz para execução — a fazer, em andamento e concluído.
                                    Visão executiva do avanço real.
                                </p>
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </div>
    </VuePressLayout>
</template>
