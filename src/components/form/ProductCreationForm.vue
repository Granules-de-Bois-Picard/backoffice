<script setup lang="ts">
import { ref, defineEmits, watch } from "vue";
import FormInput from "@/components/form/FormInput.vue";
import FormSubmitButton from "@/components/form/FormSubmitButton.vue";
import FormCheckbox from "@/components/form/FormCheckbox.vue";
import { useProductsStore } from "@/stores/products";
import { XMarkIcon } from "@heroicons/vue/24/solid";
import ActionButton from "@/components/commons/ActionButton.vue";

const productsStore = useProductsStore();

const currentStep = ref(1);
const name = ref("");
const brand = ref("");
const type = ref("");
const model = ref("");
const dimensions = ref("");
const weight = ref("");
const certifications = ref("");
const thumbnail_url = ref("");
const formError = ref<string | null>(null);
const imagePreview = ref<string | null>(null);
const availableColors = ref<string[]>([]);
const hasWifiCompatibility = ref(false);

const emit = defineEmits(["close"]);

const nextStep = () => {
  currentStep.value++;
};

const previousStep = () => {
  currentStep.value--;
};

const handleSubmit = async () => {
  formError.value = null;

  if (!name.value.trim() || !brand.value.trim() || !type.value.trim()) {
    formError.value = "Name, brand, and type are required.";
    return;
  }

  await productsStore.createProduct({
    name: name.value.trim(),
    brand: brand.value.trim(),
    type: type.value.trim(),
    model: model.value.trim(),
    dimensions: dimensions.value.trim(),
    weight: weight.value.trim(),
    certifications: certifications.value.trim(),
    thumbnail_url: thumbnail_url.value.trim(),
    availableColors: availableColors.value,
    hasWifiCompatibility: hasWifiCompatibility.value,
  }).then(() => {
    productsStore.fetchProducts(productsStore.pagination.currentPage, productsStore.currentSearch);
    emit("close");
  }).catch((error) => {
    formError.value = error.message;
  });
};

const addColor = (color: string) => {
  if (!availableColors.value.includes(color)) {
    availableColors.value.push(color);
  }
};

const removeColor = (color: string) => {
  availableColors.value = availableColors.value.filter(c => c !== color);
};

watch(thumbnail_url, (newUrl) => {
  if (newUrl) {
    imagePreview.value = newUrl;
  } else {
    imagePreview.value = null;
  }
});
</script>

<template>
  <div>
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
      <div v-if="currentStep === 1" class="flex flex-col gap-4">
        <FormInput
            :label="$t('modals.productCreate.form.name')"
            v-model="name"
            required
            max="64"
            :placeholder="$t('modals.productCreate.form.namePlaceholder')"
            type="text"
        />
        <FormInput
            :label="$t('modals.productCreate.form.brand')"
            v-model="brand"
            required
            max="64"
            :placeholder="$t('modals.productCreate.form.brandPlaceholder')"
            type="text"
        />
        <FormInput
            :label="$t('modals.productCreate.form.type')"
            v-model="type"
            required
            max="64"
            :placeholder="$t('modals.productCreate.form.typePlaceholder')"
            type="text"
        />
        <div class="flex gap-4">
          <ActionButton :label="$t('common.pagination.next')" @click="nextStep" />
        </div>
      </div>

      <div v-if="currentStep === 2" class="flex flex-col gap-4">
        <FormInput
            :label="$t('modals.productCreate.form.model')"
            v-model="model"
            max="64"
            :placeholder="$t('modals.productCreate.form.modelPlaceholder')"
            type="text"
        />
        <FormInput
            :label="$t('modals.productCreate.form.dimensions')"
            v-model="dimensions"
            max="64"
            :placeholder="$t('modals.productCreate.form.dimensionsPlaceholder')"
            type="text"
        />
        <FormInput
            :label="$t('modals.productCreate.form.weight')"
            v-model="weight"
            max="64"
            :placeholder="$t('modals.productCreate.form.weightPlaceholder')"
            type="text"
        />
        <FormInput
            :label="$t('modals.productCreate.form.certification')"
            v-model="certifications"
            max="64"
            :placeholder="$t('modals.productCreate.form.certificationPlaceholder')"
            type="text"
        />

        <!-- Sélecteur de couleurs -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">
            {{ $t('modals.productCreate.form.colors') }}
          </label>
          <div class="flex flex-wrap gap-2">
            <input
                type="color"
                @change="(e) => addColor((e.target as HTMLInputElement).value)"
                class="w-8 h-8 rounded cursor-pointer"
            >
            <div v-for="color in availableColors" :key="color"
                 class="flex items-center gap-1 bg-gray-100 rounded-md p-1">
              <div :style="{ backgroundColor: color }" class="w-6 h-6 rounded"></div>
              <button type="button" @click="removeColor(color)"
                      class="text-xs text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Checkbox WiFi -->
        <FormCheckbox
            v-model="hasWifiCompatibility"
            :label="$t('modals.productCreate.form.wifi')"
        />

        <div class="flex gap-4">
          <ActionButton :label="$t('common.pagination.previous')" @click="previousStep" white />
          <ActionButton :label="$t('common.pagination.next')" @click="nextStep" />
        </div>
      </div>

      <div v-if="currentStep === 3" class="flex flex-col gap-4">
        <FormInput
            :label="$t('modals.productCreate.form.thumbnailUrl')"
            v-model="thumbnail_url"
            max="256"
            :placeholder="$t('modals.productCreate.form.thumbnailUrlPlaceholder')"
            type="text"
        />
        <div v-if="imagePreview" class="mt-4">
          <img :src="imagePreview" alt="Thumbnail Preview" class="max-w-full h-auto rounded-md" />
        </div>
        <div class="flex gap-4">
          <ActionButton :label="$t('common.pagination.previous')" @click="previousStep" white />
          <FormSubmitButton
              :label="$t('modals.productCreate.form.submit')"
              :loading="productsStore.loading"
          />
        </div>
      </div>

      <!-- Error message -->
      <transition name="error-transition">
        <div v-if="formError" class="bg-error p-2 rounded-md bg-opacity-10 overflow-hidden">
          <p>
            <XMarkIcon class="h-5 w-5 inline-block text-error" />
            <span class="text-sm text-error">{{ formError }}</span>
          </p>
        </div>
      </transition>
    </form>
  </div>
</template>

<style scoped>
.error-transition-enter-active,
.error-transition-leave-active {
  @apply transition-all ease-in-out duration-300;
}
.error-transition-enter-from,
.error-transition-leave-to {
  @apply p-0 opacity-0 max-h-0 overflow-hidden;
}
.error-transition-enter-to,
.error-transition-leave-from {
  @apply p-2 opacity-100 max-h-20;
}

input[type="color"] {
  -webkit-appearance: none;
  border: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}
</style>
