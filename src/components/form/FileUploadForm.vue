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

// Convertit une image d'un format à un autre en utilisant Canvas
const convertImageFormat = async (file: File, targetExtension: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si le fichier n'est pas une image ou si l'extension cible n'est pas spécifiée, retourner le fichier original
    if (!isImageFile(file) || !targetExtension) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Impossible de créer le contexte canvas'));
        }
        
        // Dessiner l'image sur le canvas
        ctx.drawImage(img, 0, 0);
        
        // Déterminer le type MIME en fonction de l'extension cible
        let mimeType = 'image/jpeg';
        if (targetExtension === 'png') mimeType = 'image/png';
        else if (targetExtension === 'webp') mimeType = 'image/webp';
        else if (targetExtension === 'gif') mimeType = 'image/gif';
        
        // Convertir le canvas en blob avec le type MIME approprié
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Échec de la conversion de l\'image'));
          }
          
          // Créer un nouveau fichier avec le bon type MIME et extension
          const fileName = file.name.split('.').slice(0, -1).join('.') + '.' + targetExtension;
          const convertedFile = new File([blob], fileName, { type: mimeType });
          resolve(convertedFile);
        }, mimeType, 0.92); // Qualité de 92% pour un bon équilibre entre taille et qualité
      };
      img.onerror = () => reject(new Error('Échec du chargement de l\'image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Échec de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
};

// Fonction pour générer un nom de fichier aléatoire tout en conservant l'extension
const generateRandomFileName = (originalName: string): string => {
  const extension = originalName.split('.').pop() || '';
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${randomString}.${extension}`;
};

const handleReplaceUpload = async () => {
  if (selectedFile.value) {
    try {
      let fileToUpload = selectedFile.value;
      
      // Si c'est une image et que les formats sont différents, convertir l'image
      if (isImageFile(selectedFile.value) && props.currentFileExtension) {
        const sourceExtension = selectedFile.value.name.split('.').pop()?.toLowerCase();
        const targetExtension = props.currentFileExtension.toLowerCase();
        
        if (sourceExtension !== targetExtension) {
          // Afficher un message de conversion
          console.log(t('modals.replaceFile.imageConversion', {
            sourceFormat: sourceExtension,
            targetFormat: targetExtension
          }));
          
          // Convertir l'image au format cible
          fileToUpload = await convertImageFormat(selectedFile.value, targetExtension);
        }
      }
      
      // Si c'est une image, on peut mettre à jour la prévisualisation immédiatement
      if (isImageFile(fileToUpload) && props.currentFileId) {
        // Créer une URL temporaire pour la prévisualisation
        const previewUrl = createImagePreview(fileToUpload);
        
        // Générer un nom de fichier aléatoire pour éviter les problèmes de cache
        const randomFileName = generateRandomFileName(fileToUpload.name);
        
        // Créer une copie du fichier avec le nom aléatoire
        const randomFileBlob = fileToUpload.slice(0, fileToUpload.size, fileToUpload.type);
        const randomFile = new File([randomFileBlob], randomFileName, { type: fileToUpload.type });
        
        // Mettre à jour toutes les instances de l'image dans le DOM pour une prévisualisation immédiate
        // On utilise un timeout pour s'assurer que cette mise à jour se produit après la fermeture de la modal
        const timestamp = new Date().getTime();
        const updateImages = () => {
          // Sélectionner l'élément par ID
          const fileElement = document.getElementById(props.currentFileId || '');
          if (fileElement) {
            // Mettre à jour toutes les images à l'intérieur de cet élément
            const imgElements = fileElement.querySelectorAll('img');
            imgElements.forEach(img => {
              // Créer une URL unique avec le nom de fichier aléatoire
              const randomPreviewUrl = createImagePreview(randomFile);
              
              // Ajouter un timestamp pour forcer le rechargement et éviter le cache
              img.setAttribute('src', `${randomPreviewUrl}?t=${timestamp}`);
              
              // Forcer le navigateur à recharger l'image
              img.onload = null;
              img.onerror = null;
              
              // Créer une nouvelle image pour précharger
              const newImg = new Image();
              newImg.onload = function() {
                // Une fois chargée, remplacer l'ancienne image
                img.src = newImg.src;
              };
              newImg.src = `${randomPreviewUrl}?t=${timestamp}`;
            });
          }
        };
        
        // Exécuter immédiatement et après un court délai pour s'assurer que le DOM est mis à jour
        updateImages();
        setTimeout(updateImages, 100);
        
        // Utiliser le fichier original pour l'upload à l'API
        fileToUpload = fileToUpload;
      }
      
      // Envoyer le fichier converti à l'API
      await filesStore.replaceFile(props.currentFileId || '', fileToUpload).then(() => {
        filesStore.fetchFiles(filesStore.pagination.currentPage);
        emit('close');
      });
    } catch (error) {
      console.error('Erreur lors du remplacement du fichier:', error);
      errorMessage.value = t('modals.uploadFile.errors.conversionNotPossible');
    }
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