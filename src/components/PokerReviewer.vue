<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClaude } from '@/composables/useClaude'

const code = ref('')
const reviewResult = ref('')
const uploadedImage = ref<string | null>(null)
const imageFile = ref<File | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const { isLoading, error, sendMessage } = useClaude()

const POKER_PROMPT = `Проанализируй эту покерную раздачу подробно.

ФОРМАТ РАЗДАЧИ:
[вставь скриншот или опиши раздачу в формате:]

Игра: [лимиты, формат]
Позиции и стеки:
- [позиция] [ник] [стек в bb] [VPIP/PFR]
- Hero: [позиция] [стек] [VPIP/PFR]

Карты Hero: [твои карты]

PREFLOP: [действия всех игроков]
FLOP [карты]: [действия]
TURN [карта]: [действия]
RIVER [карта]: [действия]

ТРЕБОВАНИЯ К АНАЛИЗУ:

1. Учитывай статистику оппонентов (VPIP/PFR) - это критически важно для оценки их диапазонов

2. Для каждой улицы дай:
   - Оценку решения (✅ правильно / ⚠️ спорно / ❌ ошибка)
   - Объяснение почему
   - Диапазоны оппонентов с учётом их статистики
   - Альтернативные линии розыгрыша
   - Математику где нужно (pot odds, эквити)

3. В конце дай:
   - Главные ошибки (если были)
   - Что сыграно хорошо
   - Итоговые рекомендации

4. Объясняй понятно, используй эмодзи для наглядности

5. Если статистика показывает лузового/тайтового игрока - обязательно учитывай это в анализе

ФОРМАТ ОТВЕТА:
- Структурированный по улицам
- С чёткими оценками
- С практическими выводами
- На русском языке`

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      if (file) {
        await processImage(file)
      }
      break
    }
  }
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await processImage(file)
  }
}

const compressImage = (file: File, maxSize = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const processImage = async (file: File) => {
  imageFile.value = file
  uploadedImage.value = await compressImage(file)
}

const removeImage = () => {
  uploadedImage.value = null
  imageFile.value = null
}

const handleAnalyze = async () => {
  if (!code.value.trim() && !uploadedImage.value) {
    return
  }

  reviewResult.value = ''

  try {
    if (uploadedImage.value) {
      const base64Image = uploadedImage.value.split(',')[1]
      const imageMediaType = 'image/jpeg'

      const messageContent: any[] = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageMediaType,
            data: base64Image
          }
        }
      ]

      if (code.value.trim()) {
        messageContent.push({
          type: 'text',
          text: code.value
        })
      }

      const response = await sendMessage([
        {
          role: 'user',
          content: messageContent
        } as any
      ])

      reviewResult.value = response
    } else {
      // Только текст (если вручную описывают раздачу)
      const response = await sendMessage([
        { role: 'user', content: code.value } as any
      ])

      reviewResult.value = response
    }
  } catch (err) {
    console.error('Analysis error:', err)
  }
}

const clearAll = () => {
  code.value = POKER_PROMPT
  reviewResult.value = ''
  removeImage()
  textareaRef.value?.focus()
}

onMounted(() => {
  code.value = POKER_PROMPT
  // Автофокус на textarea
  textareaRef.value?.focus()
})
</script>

<template>
  <div class="poker-analyzer">
    <div class="header">
      <div>
        <h1>Poker Hand Analysis</h1>
        <p class="subtitle">Detailed analysis of your poker hands with GTO recommendations</p>
      </div>
      <div class="header-actions">
        <button 
          @click="clearAll" 
          class="secondary-btn" 
          :disabled="code === POKER_PROMPT && !reviewResult && !uploadedImage"
        >
          Clear All
        </button>
      </div>
    </div>

    <div class="content">
      <!-- Input Section -->
      <div class="input-section">
        <div class="section-header">
          <h2>Hand Details</h2>
        </div>

        <!-- Image Upload Area -->
        <div v-if="!uploadedImage" class="image-upload-zone">
          <p class="upload-hint">
            📸 Paste hand screenshot (Ctrl/Cmd+V) or 
            <label class="file-label">
              upload image
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                style="display: none"
              />
            </label>
          </p>
        </div>

        <!-- Uploaded Image Preview -->
        <div v-if="uploadedImage" class="image-preview">
          <button @click="removeImage" class="remove-image-btn" title="Remove image">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img :src="uploadedImage" alt="Hand screenshot" />
        </div>

        <textarea
          ref="textareaRef"
          v-model="code"
          @paste="handlePaste"
          placeholder="Add your hero name and any additional context..."
          class="hand-textarea"
          spellcheck="false"
        />

        <button
          @click="handleAnalyze"
          class="analyze-btn"
          :disabled="(!code.trim() && !uploadedImage) || isLoading"
        >
          <span v-if="!isLoading">🎯 Analyze Hand</span>
          <span v-else>
            <span class="spinner-small"></span>
            Analyzing...
          </span>
        </button>
      </div>

      <!-- Analysis Result -->
      <div class="result-section">
        <div class="section-header">
          <h2>Hand Analysis</h2>
        </div>

        <div v-if="error" class="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <div v-if="!reviewResult && !isLoading && !error" class="empty-state">
          <div class="empty-icon">🃏</div>
          <p>Hand analysis will appear here</p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Analyzing hand history...</p>
        </div>

        <div v-if="reviewResult" class="result-content">
          <pre class="result-text">{{ reviewResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poker-analyzer {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: calc(100vh - 55px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 24px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: var(--color-text-light);
  line-height: 1.6;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
}

.secondary-btn {
  padding: 10px 20px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover:not(:disabled) {
  background: var(--color-background-mute);
  border-color: var(--color-brand);
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.input-section,
.result-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.image-upload-zone {
  padding: 20px;
  background: var(--color-background);
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  text-align: center;
  margin-bottom: 16px;
}

.upload-hint {
  margin: 0;
  color: var(--color-text-light);
  font-size: 14px;
}

.file-label {
  color: var(--color-brand);
  cursor: pointer;
  text-decoration: underline;
}

.file-label:hover {
  color: var(--color-brand-dark);
}

.image-preview {
  position: relative;
  margin-bottom: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background);
}

.image-preview img {
  width: 100%;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.2s;
  z-index: 10;
}

.remove-image-btn:hover {
  background: rgba(220, 38, 38, 0.9);
}

.hand-textarea {
  flex: 1;
  width: 100%;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  transition: border-color 0.2s;
  min-height: 200px;
}

.hand-textarea:focus {
  outline: none;
  border-color: var(--color-brand);
}

.hand-textarea::placeholder {
  color: var(--color-text-light);
}

.analyze-btn {
  margin-top: 16px;
  padding: 12px 24px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.analyze-btn:hover:not(:disabled) {
  background: var(--color-brand-dark);
  transform: translateY(-1px);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 8px;
  margin-bottom: 16px;
}

@media (prefers-color-scheme: dark) {
  .error-banner {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fecaca;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-background-mute);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  color: var(--color-text);
  font-weight: 500;
}

.result-content {
  flex: 1;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
}

.result-text {
  margin: 0;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Mobile optimizations */
@media (max-width: 1024px) {
  .poker-analyzer {
    padding: 24px 16px;
  }

  .content {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .secondary-btn {
    width: 100%;
  }

  /* На мобильных устройствах тоже работает paste через долгое нажатие */
  .image-upload-zone {
    padding: 24px 16px;
  }

  .upload-hint {
    font-size: 13px;
    line-height: 1.5;
  }
}

/* Улучшение для touch devices */
@media (hover: none) and (pointer: coarse) {
  .hand-textarea {
    font-size: 16px; /* Предотвращает zoom на iOS */
    -webkit-tap-highlight-color: transparent;
  }
  
  .analyze-btn {
    min-height: 48px; /* Touch-friendly размер */
  }
}
</style>