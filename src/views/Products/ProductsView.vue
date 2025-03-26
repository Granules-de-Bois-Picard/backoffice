<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import SearchInput from "@/components/commons/SearchInput.vue";
import ActionButton from "@/components/commons/ActionButton.vue";
import CustomTable from "@/components/table/CustomTable.vue";
import CustomRow from "@/components/table/CustomRow.vue";
import CustomRowItem from "@/components/table/CustomRowItem.vue";
import { useProductsStore } from "@/stores/products";
import CustomHeaderItem from "@/components/table/CustomHeaderItem.vue";
import CustomHeader from "@/components/table/CustomHeader.vue";
import CustomPagination from "@/components/table/CustomPagination.vue";
import { useRouter } from "vue-router";
import ProductCreationForm from "@/components/form/ProductCreationForm.vue";
import Modal from "@/components/modals/Modal.vue";
import ProductEditionForm from "@/components/form/ProductEditionForm.vue";
import BestSellerStar from "@/components/products/BestSellerStar.vue";

const router = useRouter();
const productsStore = useProductsStore();
const search = ref<string>('');
const products = computed(() => productsStore.products);
const isProductModalOpen = ref(false);
const isProductEditionModalOpen = ref(false);

const currentPage = computed(() => productsStore.pagination.currentPage);
const total = computed(() => productsStore.pagination.total);
const perPage = computed(() => productsStore.pagination.perPage);

const handlePrev = async () => {
  if (currentPage.value > 1) {
    await productsStore.fetchProducts(currentPage.value - 1, productsStore.currentSearch);
  }
}

const handleNext = async () => {
  if (currentPage.value < productsStore.pagination.totalPages) {
    await productsStore.fetchProducts(currentPage.value + 1, productsStore.currentSearch);
  }
}

const handleRowClick = (e: MouseEvent, uuid: string) => {
  if ((e.target as HTMLElement).tagName !== 'A') {
    productsStore.fetchProduct(uuid).then(() => {
      openProductEditionModal();
    });
  }
}

const closeProductModal = () => {
  isProductModalOpen.value = false;
}

const closeProductEditionModal = () => {
  isProductEditionModalOpen.value = false;
}
const openProductModal = () => {
  isProductModalOpen.value = true;
}

const openProductEditionModal = () => {
  isProductEditionModalOpen.value = true;
}

onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts(1),
    productsStore.fetchBestSeller()
  ]);
})

watch(search, (value) => {
  if (value) {
    productsStore.fetchProducts(1, value);
  } else {
    productsStore.fetchProducts(1);
  }
})
</script>

<template>
  <div class="flex flex-col justify-between gap-8 min-h-[calc(100vh-128px)]">
    <div class="flex flex-col gap-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-3xl font-semibold">{{ $t('pages.products.title') }}</h1>
        <div class="flex flex-wrap gap-4">
          <SearchInput v-model="search" :placeholder="$t('common.actions.search')" />
          <ActionButton @action="openProductModal" :label="$t('common.actions.add')" />
        </div>
      </div>

      <CustomTable :title="$t('pages.products.list.title')" :count="total" :loading="productsStore.loading && isProductModalOpen">        <template #header>
        <CustomHeader>
          <CustomHeaderItem class="w-1/12 min-w-[50px]"></CustomHeaderItem>
          <CustomHeaderItem class="w-3/12 min-w-[200px]">{{ $t('pages.products.list.columns.name') }}</CustomHeaderItem>
          <CustomHeaderItem class="w-3/12 min-w-[200px]">{{ $t('pages.products.list.columns.brand') }}</CustomHeaderItem>
          <CustomHeaderItem class="w-2/12 min-w-[150px]">{{ $t('pages.products.list.columns.type') }}</CustomHeaderItem>
          <CustomHeaderItem class="w-3/12 min-w-[200px]">{{ $t('pages.products.list.columns.createdAt') }}</CustomHeaderItem>
        </CustomHeader>
      </template>

        <template #body>
          <CustomRow
              v-for="product in products"
              :key="product.id"
              class="cursor-pointer transition-all"
              :is-last="product === products[products.length - 1]"
              @click="handleRowClick($event, product.id)"
          >
            <CustomRowItem class="flex justify-center items-center">
              <BestSellerStar :product-id="product.id" :is-best-seller="product.isBestSeller" />
            </CustomRowItem>
            <CustomRowItem>{{ product.name }}</CustomRowItem>
            <CustomRowItem>{{ product.brand }}</CustomRowItem>
            <CustomRowItem>{{ product.type }}</CustomRowItem>
            <CustomRowItem>{{ product.created_at }}</CustomRowItem>
          </CustomRow>
        </template>
      </CustomTable>
    </div>

    <CustomPagination
        :current-page="currentPage"
        :total="total"
        :per-page="perPage"
        @prev="handlePrev"
        @next="handleNext"
    />
  </div>
  <Modal v-bind:visible="isProductModalOpen" v-on:close="closeProductModal" :title="$t('modals.productCreate.title')">
    <ProductCreationForm @close="closeProductModal" />
  </Modal>
  <Modal v-bind:visible="isProductEditionModalOpen" v-on:close="closeProductEditionModal" :title="$t('modals.productEdit.title')">
    <ProductEditionForm @close="closeProductEditionModal" />
  </Modal>
</template>

<style scoped>

</style>