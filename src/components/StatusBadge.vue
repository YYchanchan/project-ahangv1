<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  status: string;
  label?: string;
}>();

const labels: Record<string, string> = {
  in_zoo: "在园",
  retired: "退休",
  transferred: "转园",
  deceased: "离世",
  on_trip: "出差",
  need_info: "资料待补充",
};

const text = computed(() => props.label || labels[props.status] || props.status);
</script>

<template>
  <text class="status-badge" :class="`status-badge--${status}`">{{ text }}</text>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  padding: 2px 8px;
  background: #fafaf9;
  color: #78716c;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.status-badge--in_zoo {
  border-color: rgba(47, 82, 51, 0.2);
  background: rgba(47, 82, 51, 0.09);
  color: #2f5233;
}

.status-badge--retired {
  border-color: #fde68a;
  background: #fef3c7;
  color: #92400e;
}

.status-badge--transferred {
  border-color: #dbeafe;
  background: #eff6ff;
  color: #5a6b7c;
}

.status-badge--deceased {
  border-color: #e7e5e4;
  background: #f5f5f4;
  color: #57534e;
}

.status-badge--on_trip {
  border-color: #ede9fe;
  background: #f5f3ff;
  color: #7e22ce;
}

.status-badge--need_info {
  border-color: #fee2e2;
  background: #fef2f2;
  color: #b83b26;
}
</style>
