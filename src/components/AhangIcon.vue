<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
  }>(),
  { size: 18 },
);

const glyphs: Record<string, string> = {
  home: "⌂",
  archive: "▣",
  plus: "＋",
  heart: "♡",
  user: "♙",
  search: "⌕",
  bell: "♢",
  back: "‹",
  next: "›",
  check: "✓",
  warning: "!",
  calendar: "◫",
  pin: "⌖",
  sparkle: "✦",
  share: "↗",
  camera: "▧",
  compass: "◎",
  help: "?",
  info: "i",
  like: "♡",
  comment: "◌",
  send: "➤",
  close: "×",
  clock: "◷",
  shield: "◇",
  activity: "⌁",
  file: "▤",
  users: "♙",
  flower: "✿",
  candle: "♨",
  edit: "✎",
  upload: "⇧",
  settings: "⚙",
  logout: "↪",
  ai: "✦",
};

const glyph = computed(() => glyphs[props.name] || "•");
</script>

<template>
  <text
    class="ahang-icon"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size}px` }"
    aria-hidden="true"
  >
    {{ glyph }}
  </text>
</template>

<style scoped>
.ahang-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  font-family: Georgia, "Times New Roman", serif;
  font-style: normal;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}
</style>
