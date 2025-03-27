<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import SearchInput from "@/components/commons/SearchInput.vue";
import ActionButton from "@/components/commons/ActionButton.vue";
import CustomPagination from "@/components/table/CustomPagination.vue";
import Modal from "@/components/modals/Modal.vue";
import { useFilesStore } from "@/stores/files";
import FileUploadForm from "@/components/form/FileUploadForm.vue";
import Loading from "@/components/icons/Loading.vue";
import { faEye } from '@fortawesome/free-solid-svg-icons';

const filesStore = useFilesStore();

const files = computed(() => filesStore.files || []);

const search = ref<string>('');
const copiedFile = ref<string | null>(null);

const currentPage = computed(() => filesStore.pagination.currentPage);
const total = computed(() => filesStore.pagination.total);
const perPage = computed(() => filesStore.pagination.perPage);

const currentFileId = ref<string | null>(null);
const currentFileExtension = ref<string | null>(null);

const isFileUploadModalOpen = ref(false);
const isFileReplaceModalOpen = ref(false);

const handlePrev = async () => {
  if (currentPage.value > 1) {
    await filesStore.fetchFiles(currentPage.value - 1);
  }
};

const handleNext = async () => {
  if (currentPage.value < filesStore.pagination.totalPages) {
    await filesStore.fetchFiles(currentPage.value + 1);
  }
}

const copyLink = async (fileId: string) => {
  try {
    const file = files.value.find(f => f.id === fileId);
    if (file) {
      const fullUrl = new URL(file.url, window.location.origin).toString();
      await navigator.clipboard.writeText(fullUrl);
      copiedFile.value = fileId;
      setTimeout(() => {
        copiedFile.value = null;
      }, 2000);
    }
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const isImage = (url: string) => {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
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

const handleDelete = async (fileId: string) => {
  await filesStore.deleteFile(fileId).then(() => {
    filesStore.fetchFiles(currentPage.value);
  });
};

const openFile = (e: MouseEvent, url: string, eyedButton: boolean = false) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    if (isMobile() && eyedButton) {
      window.open(url, '_blank');
      return;
    }
    return;
  }

  if(!isMobile()) {
    window.open(url, '_blank');
  }
};

const replaceFile = (e: MouseEvent, id: string, extension: string) => {
  e.stopPropagation();
  currentFileId.value = id;
  currentFileExtension.value = extension;
  openFileReplaceModal();
};

const isMobile = () => {
  return window.innerWidth <= 1024;
};

const formatFileSize = (size: number) => {
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const closeFileUploadModal = () => {
  isFileUploadModalOpen.value = false;
};

const openFileUploadModal = () => {
  isFileUploadModalOpen.value = true;
};

const openFileReplaceModal = () => {
  isFileReplaceModalOpen.value = true;
};

const closeFileReplaceModal = () => {
  isFileReplaceModalOpen.value = false;
  
  // La mise à jour de l'aperçu est maintenant gérée dans le composant FileUploadForm
  // pour une meilleure réactivité et une mise à jour en temps réel
};

onMounted(async () => {
  await filesStore.fetchFiles(1);
});

watch(search, (value) => {
  // Logic to watch search changes
});

</script>

<template>
  <div class="flex flex-col justify-between gap-8 min-h-[calc(100vh-128px)]">
    <div class="flex flex-col gap-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-3xl font-semibold">{{ $t('pages.files.title') }}</h1>
        <div class="flex flex-wrap gap-4">
          <SearchInput v-model="search" :placeholder="$t('common.actions.search')" />
          <ActionButton @action="openFileUploadModal" :label="$t('common.actions.add')" />
        </div>
      </div>

      <div class="flex flex-col rounded-lg bg-base-100 shadow-sm">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <h2 class="text-md font-medium">Tous les fichiers</h2>
          <p class="text-md font-semibold text-gray-400">{{ total }}</p>
        </div>
        <div v-if="filesStore.loading" class="flex items-center justify-center h-52">
          <Loading />
        </div>
        <div v-else-if="total === 0" class="flex items-center justify-center h-52">
          <p class="text-gray-400">Aucun fichier trouvé</p>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 p-4">
          <div
              v-for="file in files"
              :key="file.id"
              :id="file.id"
              @click="openFile($event, file.url)"
              class="relative flex items-center justify-center w-full h-52 border rounded-lg overflow-hidden group"
          >
            <img
                v-if="isImage(file.url)"
                :src="file.url"
                :alt="file.name"
                class="absolute inset-0 w-full h-full object-cover"
                @error="file.url = 'image'"
            />
            <font-awesome-icon
                v-else
                :icon="['fas', getFileIcon(file.url.split('.').pop() || '').icon]"
                :class="getFileIcon(file.url.split('.').pop() || '').color"
                class="absolute inset-0 w-1/2 h-1/2 m-auto"
            />
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p class="text-white text-center px-2">{{ file.name }}</p>
              <p class="absolute bottom-2 left-2 text-white text-xs">{{ formatFileSize(file.size) }}</p>
              <div class="absolute top-2 right-2 flex items-center gap-2">
                <button
                    v-if="!file.is_protected"
                    class="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-200 rounded-lg shadow-md transition-colors"
                    @click.prevent="handleDelete(file.id)"
                >
                  <font-awesome-icon
                      :icon="['fas', 'trash']"
                      class="text-gray-600"
                  />
                </button>
                <button
                    class="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-200 rounded-lg shadow-md transition-colors"
                    @click="replaceFile($event, file.id, file.extension)"
                >
                  <font-awesome-icon :icon="['fas', 'repeat']" class="text-gray-600" />
                </button>
                <button
                    class="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-200 rounded-lg shadow-md transition-colors"
                    @click.prevent="copyLink(file.id)"
                >
                  <font-awesome-icon
                      v-if="copiedFile === file.id"
                      :icon="['fas', 'check']"
                      class="text-green-500 animate-check"
                  />
                  <font-awesome-icon
                      v-else
                      :icon="['fas', 'link']"
                      class="text-gray-600"
                  />
                </button>
                <button
                    class="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-200 rounded-lg shadow-md transition-colors md:hidden"
                    @click="openFile($event, file.id, true)"
                >
                  <font-awesome-icon
                      :icon="['fas', 'eye']"
                      class="text-gray-600"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CustomPagination
        :current-page="currentPage"
        :total="total"
        :per-page="perPage"
        @prev="handlePrev"
        @next="handleNext"
    />
  </div>

  <Modal v-bind:visible="isFileUploadModalOpen" v-on:close="closeFileUploadModal" :title="$t('modals.uploadFile.title')">
    <FileUploadForm @close="closeFileUploadModal" />
  </Modal>

  <Modal v-bind:visible="isFileReplaceModalOpen" v-on:close="closeFileReplaceModal" :title="$t('modals.replaceFile.title')">
    <FileUploadForm @close="closeFileReplaceModal" :replace="true" :currentFileId="currentFileId as string" :currentFileExtension="currentFileExtension as string" />
  </Modal>
</template>