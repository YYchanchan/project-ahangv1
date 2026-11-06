<script setup lang="ts">
defineProps<{ name: string; size?: number }>();
</script>

<template>
  <svg :width="size || 18" :height="size || 18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'review'"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></template>
    <template v-else-if="name === 'animal'"><path d="M6 11c-1.7 0-3-1.3-3-3s1.1-3 2.5-3S8 6.3 8 8"/><path d="M18 11c1.7 0 3-1.3 3-3s-1.1-3-2.5-3S16 6.3 16 8"/><path d="M6 14c0-4 2.7-7 6-7s6 3 6 7-2.7 7-6 7-6-3-6-7Z"/><path d="M9.5 14h.01M14.5 14h.01M10 17c1.2.8 2.8.8 4 0"/></template>
    <template v-else-if="name === 'book'"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></template>
    <template v-else-if="name === 'users'"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></template>
    <template v-else-if="name === 'log'"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></template>
    <template v-else-if="name === 'logout'"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></template>
    <template v-else-if="name === 'refresh'"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></template>
    <template v-else-if="name === 'search'"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></template>
    <template v-else-if="name === 'close'"><path d="m6 6 12 12M18 6 6 18"/></template>
    <template v-else><circle cx="12" cy="12" r="9"/></template>
  </svg>
</template>
