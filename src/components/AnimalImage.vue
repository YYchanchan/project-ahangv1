<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getSpeciesDefaultImage } from "../data/speciesImages";

const props = withDefaults(
  defineProps<{
    species: string;
    src?: string | null;
    mode?: "aspectFill" | "aspectFit" | "widthFix" | "heightFix";
    alt?: string;
  }>(),
  {
    src: "",
    mode: "aspectFill",
    alt: "动物图片",
  },
);

const failed = ref(false);
const finalSource = computed(() => props.src || getSpeciesDefaultImage(props.species));
const initials = computed(() => {
  const value = props.species || "动物";
  return value.slice(0, 2).toUpperCase();
});

watch(finalSource, () => {
  failed.value = false;
});
</script>

<template>
  <image
    v-if="finalSource && !failed"
    class="animal-image"
    :src="finalSource"
    :mode="mode"
    :alt="alt"
    @error="failed = true"
  />
  <view v-else class="animal-placeholder">
    <view class="animal-placeholder__mark">{{ initials }}</view>
    <text class="animal-placeholder__species">{{ species || "未确认物种" }}</text>
    <text class="animal-placeholder__pending">图片待补充</text>
  </view>
</template>

<style scoped>
.animal-image,
.animal-placeholder {
  width: 100%;
  height: 100%;
}

.animal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(214, 211, 209, 0.7);
  background: #f4f1ea;
  color: #57534e;
}

.animal-placeholder__mark {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(217, 195, 176, 0.5);
  border-radius: 50%;
  margin-bottom: 6px;
  background: #faf8f5;
  color: #2f5233;
  font-family: Georgia, serif;
  font-size: 11px;
  font-weight: 700;
}

.animal-placeholder__species {
  font-size: 10px;
  font-weight: 700;
}

.animal-placeholder__pending {
  margin-top: 2px;
  color: #b83b26;
  font-size: 9px;
}
</style>
