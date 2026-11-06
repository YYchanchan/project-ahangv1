<script setup lang="ts">
import { computed } from "vue";
import type { Animal, MemorialCommentRecord } from "../types";
import AhangIcon from "./AhangIcon.vue";
import AnimalImage from "./AnimalImage.vue";

const props = defineProps<{
  animals: Animal[];
  comments: MemorialCommentRecord[];
  candleCounts: Record<string, number>;
}>();

const emit = defineEmits<{
  openAnimal: [animalId: string];
  upload: [];
  notify: [message: string];
}>();

const memorialAnimals = computed(() =>
  props.animals.filter((animal) => animal.memorialEnabled || animal.status === "deceased"),
);

function commentCount(animalId: string) {
  return props.comments.filter((comment) => comment.animalId === animalId).length;
}

function flowerCount(animalId: string) {
  return props.comments.filter((comment) => comment.animalId === animalId).reduce(
    (sum, comment) => sum + comment.flowers,
    0,
  );
}

function candleCount(animalId: string) {
  return props.candleCounts[animalId] || 0;
}
</script>

<template>
  <view class="memorial-page">
    <view class="memorial-intro">
      <view>
        <text>纪念动物</text>
        <text>每一只被记得的动物，都有属于它的一页。</text>
        <text>这里记录的是由公众在小程序内留下的纪念，以及经审核后归档的历史资料。</text>
      </view>
      <button @click="emit('upload')"><AhangIcon name="plus" :size="14" /> 提供历史资料</button>
    </view>

    <view class="memorial-list">
      <view v-for="animal in memorialAnimals" :key="animal.id" class="memorial-animal-card">
        <view class="memorial-animal-card__image">
          <AnimalImage
            :species="animal.species"
            :src="animal.image || animal.coverUrl"
            :alt="animal.name"
          />
          <view class="memorial-animal-card__identity">
            <view><text>{{ animal.name }}</text><text>{{ animal.commonName || animal.species }}</text></view>
            <text v-if="animal.relationships?.[0]">{{ animal.relationships[0].label }}</text>
          </view>
        </view>
        <view class="memorial-animal-card__body">
          <text>📍 {{ animal.institution }} · 🕒 {{ animal.lifeSpan }}</text>
          <text>{{ animal.summary || animal.description }}</text>
          <view class="memorial-stats">
            <view><text>纪念留言</text><text>{{ commentCount(animal.id) }} 条</text></view>
            <view><text>献花总数</text><text>{{ flowerCount(animal.id) }} 朵</text></view>
            <view><text>点亮蜡烛</text><text>{{ candleCount(animal.id) }} 盏</text></view>
          </view>
          <button @click="emit('openAnimal', animal.id)">进入纪念页 <AhangIcon name="next" :size="14" /></button>
        </view>
      </view>
    </view>

    <button class="more-button" @click="emit('notify', '更多纪念动物档案正在整理中')">
      🍂 查看更多纪念动物
    </button>
  </view>
</template>

<style scoped>
button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1.2;
}

button::after {
  display: none;
}

.memorial-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px 100px;
}

.memorial-intro {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid rgba(214, 211, 209, 0.7);
  border-radius: 17px;
  background: #fafaf9;
}

.memorial-intro > view {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.memorial-intro > view text:first-child {
  color: #292524;
  font-family: Georgia, "Songti SC", serif;
  font-size: 17px;
  font-weight: 700;
}

.memorial-intro > view text:nth-child(2) {
  color: #b83b26;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
}

.memorial-intro > view text:last-child {
  color: #78716c;
  font-size: 9px;
  line-height: 1.55;
}

.memorial-intro > button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
  padding: 8px 11px;
  border-radius: 999px;
  background: #b83b26;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

.memorial-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.memorial-animal-card {
  overflow: hidden;
  border: 1px solid rgba(214, 211, 209, 0.7);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(41, 37, 36, 0.06);
}

.memorial-animal-card__image {
  position: relative;
  height: 170px;
  overflow: hidden;
  background: #e7e5e4;
}

.memorial-animal-card__image > :deep(.animal-image) {
  width: 100%;
  height: 100%;
}

.memorial-animal-card__image::after {
  position: absolute;
  inset: 40% 0 0;
  content: "";
  background: linear-gradient(transparent, rgba(28, 25, 23, 0.82));
}

.memorial-animal-card__identity {
  position: absolute;
  z-index: 1;
  right: 14px;
  bottom: 12px;
  left: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  color: #fff;
}

.memorial-animal-card__identity > view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memorial-animal-card__identity > view text:first-child {
  font-family: Georgia, "Songti SC", serif;
  font-size: 20px;
  font-weight: 700;
}

.memorial-animal-card__identity > view text:last-child {
  color: #d6d3d1;
  font-size: 10px;
}

.memorial-animal-card__identity > text {
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(184, 59, 38, 0.9);
  font-size: 8px;
}

.memorial-animal-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.memorial-animal-card__body > text:first-child {
  color: #a8a29e;
  font-size: 9px;
}

.memorial-animal-card__body > text:nth-child(2) {
  color: #57534e;
  font-family: Georgia, "Songti SC", serif;
  font-size: 10px;
  line-height: 1.7;
}

.memorial-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid #eeeae6;
  border-radius: 11px;
  background: #faf8f5;
}

.memorial-stats > view {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 4px;
  text-align: center;
}

.memorial-stats > view:not(:last-child) {
  border-right: 1px solid #eeeae6;
}

.memorial-stats text:first-child {
  color: #a8a29e;
  font-size: 8px;
}

.memorial-stats text:last-child {
  color: #44403c;
  font-size: 10px;
  font-weight: 700;
}

.memorial-animal-card__body > button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px;
  border-radius: 10px;
  background: #292524;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.more-button {
  width: 100%;
  padding: 11px;
  border: 1px dashed #d6d3d1;
  border-radius: 12px;
  color: #78716c;
  font-size: 10px;
}
</style>
