<script setup lang="ts">
import { ref, defineEmits, onMounted } from 'vue';
import { useFilesStore } from '@/stores/files';
import ActionButton from "@/components/commons/ActionButton.vue";
import {XMarkIcon} from "@heroicons/vue/24/solid";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits(['close']);
const filesStore = useFilesStore();
const dragOver = ref(false);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const errorMessage = ref<string | null>(null);

const props = defineProps<{
  replace?: boolean;
  currentFileId?: string;
  currentFileExtension?: string;
}>();
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  dragOver.value = false;
  if (event.dataTransfer?.files.length) {
    const file = event.dataTransfer.files[0];
    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = t('modals.uploadFile.errors.fileSize');
    } else {
      selectedFile.value = file;
      errorMessage.value = null;
    }
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  dragOver.value = true;
};

const handleDragLeave = () => {
  dragOver.value = false;
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    const file = target.files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = t('modals.uploadFile.errors.fileSize');
    } else if (props.replace) {
      // Vérification pour le remplacement de fichier
      const isSourceImage = isImageFile(file);
      const isTargetImage = isImageFile(props.currentFileExtension || '');
      
      if (isSourceImage && isTargetImage) {
        // Les deux sont des images, on peut faire la conversion
        selectedFile.value = file;
        errorMessage.value = null;
        
        // Afficher un message de conversion si les formats sont différents
        if (fileExtension !== props.currentFileExtension?.toLowerCase()) {
          // Ce message sera affiché comme une information, pas comme une erreur
          console.log(t('modals.replaceFile.imageConversion', {
            sourceFormat: fileExtension,
            targetFormat: props.currentFileExtension
          }));
        }
      } else if (!isSourceImage && !isTargetImage && fileExtension !== props.currentFileExtension?.toLowerCase()) {
        // Si ce ne sont pas des images et les extensions sont différentes
        errorMessage.value = t('modals.uploadFile.errors.fileExtension', {
          extension: props.currentFileExtension
        });
      } else {
        selectedFile.value = file;
        errorMessage.value = null;
      }
    } else {
      // Upload normal (pas de remplacement)
      selectedFile.value = file;
      errorMessage.value = null;
    }
  }
};

// Vérifie si le fichier est une image
const isImageFile = (file: File | string): boolean => {
  if (typeof file === 'string') {
    return /^(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file);
  }
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  return /^(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileExtension);
};

// Crée une prévisualisation de l'image
const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

const handleUpload = async () => {
  if (selectedFile.value) {
    await filesStore.uploadFile(selectedFile.value).then(() => {
      filesStore.fetchFiles(filesStore.pagination.currentPage);
      emit('close');
    });
  }
};

const handleReplaceUpload = async () => {
  if (selectedFile.value) {
    // Si c'est une image, on peut mettre à jour la prévisualisation immédiatement
    if (isImageFile(selectedFile.value) && props.currentFileId) {
      // Créer une URL temporaire pour la prévisualisation
      const previewUrl = createImagePreview(selectedFile.value);
      
      // Mettre à jour l'image dans le DOM pour une prévisualisation immédiate
      // On utilise un timeout pour s'assurer que cette mise à jour se produit après la fermeture de la modal
      setTimeout(() => {
        const imgElement = document.getElementById(props.currentFileId || '')?.querySelector('img');
        if (imgElement) {
          imgElement.src = previewUrl;
        }
      }, 100);
    }
    
    await filesStore.replaceFile(props.currentFileId || '', selectedFile.value).then(() => {
      filesStore.fetchFiles(filesStore.pagination.currentPage);
      emit('close');
    });
  }
};

const getFileIcon = (extension: string) => {
  const iconsMap: Record<string, { icon: string, color: string }> = {
    image: { icon: 'file-image', color: 'text-blue-500' },
    jpg: { icon: 'file-image', color: 'text-blue-500' },
    jpeg: { icon: 'file-image', color: 'text-blue-500' },
    png: { icon: 'file-image', color: 'text-blue-500' },
    gif: { icon: 'file-image', color: 'text-blue-500' },
    webp: { icon: 'file-image', color: 'text-blue-500' },
    bmp: { icon: 'file-image', color: 'text-blue-500' },
    svg: { icon: 'file-image', color: 'text-blue-500' },
    pdf: { icon: 'file-pdf', color: 'text-red-500' },
    doc: { icon: 'file-word', color: 'text-blue-700' },
    docx: { icon: 'file-word', color: 'text-blue-700' },
    xls: { icon: 'file-excel', color: 'text-green-500' },
    xlsx: { icon: 'file-excel', color: 'text-green-500' },
    csv: { icon: 'file-excel', color: 'text-green-500' },
    txt: { icon: 'file-alt', color: 'text-gray-500' },
    zip: { icon: 'file-archive', color: 'text-yellow-500' },
    ppt: { icon: 'file-powerpoint', color: 'text-orange-500' },
    pptx: { icon: 'file-powerpoint', color: 'text-orange-500' },
    mp3: { icon: 'file-audio', color: 'text-green-500' },
    mp4: { icon: 'file-video', color: 'text-purple-500' },
    json: { icon: 'file-code', color: 'text-gray-700' },
    js: { icon: 'file-code', color: 'text-gray-700' },
    html: { icon: 'file-code', color: 'text-gray-700' },
    default: { icon: 'file', color: 'text-gray-400' }
  };
  return iconsMap[extension.toLowerCase()] || iconsMap.default;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1048576).toFixed(2)} MB`;
};
</script>

<template>
  <div class="flex flex-col gap-4 items-start rounded-lg max-w-xl mx-auto">
    <div
        class="relative border-2 border-dashed p-4 rounded-lg w-full sm:w-[400px] h-[300px] sm:h-[400px] flex items-center justify-center"
        :class="{'border-blue-500': dragOver}"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @click="fileInput?.click()"
    >
      <p v-if="!selectedFile" class="text-center">
        {{ t('modals.uploadFile.description') }}
      </p>
      <div v-else class="flex flex-col items-center gap-4">
        <font-awesome-icon
            :icon="['fas', getFileIcon(selectedFile.name.split('.').pop() || '').icon]"
            :class="getFileIcon(selectedFile.name.split('.').pop() || '').color"
            class="text-8xl"
        />
        <div class="flex flex-col items-center">
          <p class="text-center">{{ selectedFile.name }}</p>
          <p class="text-sm text-gray-500 text-center">{{ formatFileSize(selectedFile.size) }}</p>
        </div>
      </div>
      <input type="file" class="hidden" ref="fileInput" @change="handleFileChange" />
    </div>

    <transition name="error-transition">
      <div v-if="errorMessage" class="bg-error p-2 rounded-md bg-opacity-10 overflow-hidden w-full">
        <p>
          <XMarkIcon class="h-5 w-5 inline-block text-error" />
          <span class="text-sm text-error">{{ errorMessage }}</span>
        </p>
      </div>
    </transition>

    <transition name="error-transition">
      <div v-if="filesStore.$state.error" class="bg-error p-2 rounded-md bg-opacity-10 overflow-hidden w-full">
        <p>
          <XMarkIcon class="h-5 w-5 inline-block text-error" />
          <span class="text-sm text-error">{{ t('errors.unexpected') }}</span>
        </p>
      </div>
    </transition>

    <ActionButton
        v-if="!replace"
        :label="t('common.actions.upload')"
        @click="handleUpload"
        :disabled="!selectedFile"
    />

    <ActionButton
        v-else
        :label="t('common.actions.replace')"
        @click="handleReplaceUpload"
        :disabled="!selectedFile"
    />
  </div>
</template>

<style scoped>
.border-blue-500 {
  border-color: #3b82f6;
}
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
</style>