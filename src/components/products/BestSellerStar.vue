<script setup lang="ts">
import { ref, computed } from 'vue'
import StarIcon from '@/components/icons/StarIcon.vue'
import { useProductsStore } from '@/stores/products'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  productId: string
  isBestSeller?: boolean
}>()

const { t } = useI18n()
const productsStore = useProductsStore()
const isHovered = ref(false)

const handleClick = async (e: MouseEvent) => {
  e.stopPropagation()
  await productsStore.setBestSeller(props.productId)
}

const tooltipText = computed(() => {
  return props.isBestSeller 
    ? t('pages.products.bestSeller.alreadyBestSeller')
    : t('pages.products.bestSeller.tooltip')
})
</script>

<template>
  <div 
    class="relative cursor-pointer transition-opacity duration-200 group"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleClick"
    title=""
  >
    <StarIcon 
      :filled="props.isBestSeller" 
      :class="[
        'opacity-100',
        !props.isBestSeller ? 'text-gray-400 hover:text-yellow-500' : 'text-yellow-500'
      ].join(' ')"
    />
    <div class="absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap -left-1/2 -bottom-8 transform -translate-x-1/4">
      {{ tooltipText }}
    </div>
  </div>
</template>