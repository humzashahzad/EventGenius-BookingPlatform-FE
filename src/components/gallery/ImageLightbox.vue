<template>
  <!-- Lightbox overlay -->
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="isOpen" @click="close" class="lightbox-overlay">
        <div class="lightbox-container" @click.stop>
          <!-- Close button -->
          <button @click="close" class="lightbox-close" title="Close (Esc)">
            <AppIcon icon="x" class="w-6 h-6" />
          </button>

          <!-- Previous button -->
          <button
            v-if="images.length > 1"
            @click="previous"
            class="lightbox-nav lightbox-nav-prev"
            title="Previous"
          >
            <AppIcon icon="chevron-left" class="w-8 h-8" />
          </button>

          <!-- Main image -->
          <div class="lightbox-image-wrapper">
            <img
              :src="currentImage.url"
              :alt="currentImage.alt || 'Image'"
              class="lightbox-image"
              @load="onImageLoad"
            />
            <div v-if="loading" class="lightbox-loading">
              <div class="spinner"></div>
            </div>
          </div>

          <!-- Next button -->
          <button
            v-if="images.length > 1"
            @click="next"
            class="lightbox-nav lightbox-nav-next"
            title="Next"
          >
            <AppIcon icon="chevron-right" class="w-8 h-8" />
          </button>

          <!-- Image counter -->
          <div v-if="images.length > 1" class="lightbox-counter">
            {{ currentIndex + 1 }} / {{ images.length }}
          </div>

          <!-- Caption -->
          <div v-if="currentImage.caption" class="lightbox-caption">
            {{ currentImage.caption }}
          </div>

          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="lightbox-thumbnails">
            <button
              v-for="(image, index) in images"
              :key="index"
              @click="goToImage(index)"
              :class="{ 'thumbnail-active': index === currentIndex }"
              class="lightbox-thumbnail"
            >
              <img :src="image.thumbnail || image.url" :alt="image.alt || `Thumbnail ${index + 1}`" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

export interface LightboxImage {
  url: string
  thumbnail?: string
  alt?: string
  caption?: string
}

const props = defineProps<{
  images: LightboxImage[]
  initialIndex?: number
}>()

const emit = defineEmits<{
  'close': []
  'change': [index: number]
}>()

const isOpen = ref(false)
const currentIndex = ref(props.initialIndex || 0)
const loading = ref(false)

const currentImage = computed(() => props.images[currentIndex.value] || props.images[0])

function open(index: number = 0) {
  currentIndex.value = index
  isOpen.value = true
  document.body.style.overflow = 'hidden'
}

function close() {
  isOpen.value = false
  document.body.style.overflow = ''
  emit('close')
}

function previous() {
  loading.value = true
  currentIndex.value = currentIndex.value === 0 ? props.images.length - 1 : currentIndex.value - 1
}

function next() {
  loading.value = true
  currentIndex.value = currentIndex.value === props.images.length - 1 ? 0 : currentIndex.value + 1
}

function goToImage(index: number) {
  loading.value = true
  currentIndex.value = index
}

function onImageLoad() {
  loading.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return

  switch (e.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      previous()
      break
    case 'ArrowRight':
      next()
      break
  }
}

// Touch/swipe support
let touchStartX = 0
let touchEndX = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0].screenX
}

function handleTouchEnd(e: TouchEvent) {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
}

function handleSwipe() {
  const swipeThreshold = 50
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      next() // Swiped left - go to next
    } else {
      previous() // Swiped right - go to previous
    }
  }
}

watch(currentIndex, (newIndex) => {
  emit('change', newIndex)
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('touchstart', handleTouchStart)
  document.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchend', handleTouchEnd)
  document.body.style.overflow = ''
})

defineExpose({
  open,
  close,
})
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 14, 13, 0.92);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-container {
  position: relative;
  width: 100%;
  max-width: 1400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 1rem;
  background: rgba(250, 250, 249, 0.1);
  backdrop-filter: blur(10px);
  color: #FAFAF9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.lightbox-close:hover {
  background: rgba(250, 250, 249, 0.2);
  transform: scale(1.05);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  background: rgba(250, 250, 249, 0.1);
  backdrop-filter: blur(10px);
  color: #FAFAF9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.lightbox-nav:hover {
  background: rgba(250, 250, 249, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.lightbox-nav-prev {
  left: 20px;
}

.lightbox-nav-next {
  right: 20px;
}

.lightbox-image-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: calc(100vh - 200px);
  width: 100%;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 1rem;
  box-shadow: 0 10px 50px rgba(15, 14, 13, 0.5);
}

.lightbox-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 14, 13, 0.3);
  border-radius: 1rem;
}

.lightbox-counter {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(250, 250, 249, 0.1);
  backdrop-filter: blur(10px);
  color: #FAFAF9;
  font-size: 14px;
  font-weight: 600;
  border-radius: 0.75rem;
}

.lightbox-caption {
  margin-top: 20px;
  padding: 12px 20px;
  background: rgba(250, 250, 249, 0.1);
  backdrop-filter: blur(10px);
  color: #FAFAF9;
  font-size: 14px;
  text-align: center;
  border-radius: 0.75rem;
  max-width: 600px;
}

.lightbox-thumbnails {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: rgba(250, 250, 249, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  overflow-x: auto;
  max-width: 100%;
}

.lightbox-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  background: rgba(15, 14, 13, 0.3);
}

.lightbox-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lightbox-thumbnail:hover {
  border-color: rgba(250, 250, 249, 0.5);
  transform: scale(1.05);
}

.thumbnail-active {
  border-color: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(250, 250, 249, 0.2);
  border-top-color: #10B981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transition animations */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .lightbox-overlay {
    padding: 10px;
  }

  .lightbox-close {
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
  }

  .lightbox-nav {
    width: 48px;
    height: 48px;
  }

  .lightbox-nav-prev {
    left: 10px;
  }

  .lightbox-nav-next {
    right: 10px;
  }

  .lightbox-image-wrapper {
    max-height: calc(100vh - 160px);
  }

  .lightbox-thumbnails {
    padding: 12px;
    gap: 8px;
  }

  .lightbox-thumbnail {
    width: 60px;
    height: 60px;
  }
}
</style>
