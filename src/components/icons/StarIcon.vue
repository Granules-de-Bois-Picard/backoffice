<script setup lang="ts">
const props = defineProps<{
  filled?: boolean
  size?: string
  class?: string
}>()
</script>

<template>
  <svg
    :width="props.size || '24'"
    :height="props.size || '24'"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"
      :fill="props.filled ? '#FFD700' : 'none'"
      :stroke="props.filled ? '#FFD700' : 'currentColor'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>