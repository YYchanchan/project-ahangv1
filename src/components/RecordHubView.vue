<script setup lang="ts">
import AhangIcon from "./AhangIcon.vue";

const emit = defineEmits<{
  recommend: [];
  observe: [];
  memory: [];
  correction: [];
  ai: [];
}>();

const options = [
  { id: "recommend", title: "推荐一只动物", copy: "它还没有自己的档案", icon: "plus", tone: "champagne" },
  { id: "observe", title: "上传一次观察", copy: "记录你今天看到的行为", icon: "camera", tone: "green" },
  { id: "memory", title: "分享一段回忆", copy: "上传过去的照片或故事", icon: "heart", tone: "amber" },
  { id: "correction", title: "补充或纠正资料", copy: "让已有档案更加准确", icon: "info", tone: "slate" },
] as const;

function choose(id: (typeof options)[number]["id"]) {
  if (id === "recommend") emit("recommend");
  if (id === "observe") emit("observe");
  if (id === "memory") emit("memory");
  if (id === "correction") emit("correction");
}
</script>

<template>
  <view class="record-page">
    <view class="record-heading">
      <text>记录一次相遇</text>
      <text>你的一次上传，也许会成为它生命档案的一部分。</text>
    </view>

    <view class="record-options">
      <button
        v-for="option in options"
        :key="option.id"
        :class="[`record-option--${option.tone}`]"
        @click="choose(option.id)"
      >
        <view class="record-option__icon"><AhangIcon :name="option.icon" :size="22" /></view>
        <view><text>{{ option.title }}</text><text>{{ option.copy }}</text></view>
        <AhangIcon name="next" :size="16" />
      </button>
    </view>

    <view class="ai-entry">
      <view>
        <view class="ai-entry__title"><AhangIcon name="sparkle" :size="15" /><text>不知道选择哪个？</text></view>
        <text>上传一张照片，让系统自动识别，帮您快速匹配在园动物个体并建立观察连接。</text>
      </view>
      <button @click="emit('ai')">上传一张照片，让系统帮助判断 <AhangIcon name="next" :size="14" /></button>
    </view>
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

.record-page {
  padding: 16px 20px 100px;
}

.record-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-heading text:first-child {
  color: #1c1917;
  font-family: Georgia, "Songti SC", serif;
  font-size: 21px;
  font-weight: 700;
}

.record-heading text:last-child {
  color: #78716c;
  font-size: 11px;
}

.record-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 18px;
}

.record-options > button {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 15px;
  border: 1px solid rgba(214, 211, 209, 0.75);
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(41, 37, 36, 0.05);
  text-align: left;
}

.record-option__icon {
  display: flex;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
}

.record-options > button > view:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.record-options > button > view:nth-child(2) text:first-child {
  color: #292524;
  font-size: 12px;
  font-weight: 700;
}

.record-options > button > view:nth-child(2) text:last-child {
  color: #a8a29e;
  font-size: 9px;
}

.record-option--champagne .record-option__icon {
  background: rgba(217, 195, 176, 0.12);
  color: #b99475;
}

.record-option--green .record-option__icon {
  background: rgba(47, 82, 51, 0.09);
  color: #2f5233;
}

.record-option--amber .record-option__icon {
  background: #fffbeb;
  color: #d97706;
}

.record-option--slate .record-option__icon {
  background: rgba(90, 107, 124, 0.09);
  color: #5a6b7c;
}

.ai-entry {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-top: 16px;
  padding: 18px;
  border: 1px solid #292524;
  border-radius: 23px;
  background: #1c1917;
  color: #fff;
  box-shadow: 0 8px 24px rgba(28, 25, 23, 0.18);
}

.ai-entry > view {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-entry__title {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #d9c3b0;
  font-size: 11px;
  font-weight: 700;
}

.ai-entry > view > text:last-child {
  color: #d6d3d1;
  font-size: 9px;
  line-height: 1.6;
}

.ai-entry > button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  border-radius: 10px;
  background: #d9c3b0;
  color: #1c1917;
  font-size: 9px;
  font-weight: 700;
}
</style>
