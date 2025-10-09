<script setup lang="ts">
import { ref } from 'vue'
import { useArchitectureAdvice } from '@/composables/useArchitectureAdvice'
import { marked } from 'marked'

const { isThinking, advice, error, getAdvice } = useArchitectureAdvice()

const description = ref(`Нужно построить real-time чат приложение на Vue 3 с следующими функциями:
- Отправка текстовых сообщений
- Отправка файлов и изображений
- Онлайн статус пользователей
- Typing indicator
- История сообщений
- Push уведомления

Ожидаемая нагрузка: до 1000 одновременных пользователей.`)

const handleAnalyze = () => {
  if (description.value.trim()) {
    getAdvice(description.value)
  }
}

const clearAdvice = () => {
  description.value = ''
  advice.value = ''
  error.value = null
}

const formatAdvice = (content: string): string => {
  return marked(content) as string
}
</script>

<template>
  <div class="architecture-advisor">
    <div class="page-header">
      <h1 class="page-title">Architecture Advisor</h1>
      <p class="page-description">
        Describe your project and get architectural recommendations from Claude
      </p>
    </div>

    <div class="advisor-layout">
      <div class="input-section">
        <div class="section-header">
          <h3 class="section-title">Project Description</h3>
          <div class="header-actions">
            <button 
              v-if="advice"
              @click="clearAdvice"
              class="secondary-button"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          v-model="description"
          placeholder="Describe your project in detail:
- What problem does it solve?
- Main features?
- Expected load?
- Special requirements?"
          class="description-textarea"
          :disabled="isThinking"
        />

        <button
          @click="handleAnalyze"
          :disabled="isThinking || !description.trim()"
          class="analyze-button"
        >
          {{ isThinking ? '🤔 Thinking...' : '🚀 Get Recommendations' }}
        </button>
      </div>

      <div v-if="error" class="error-banner">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div v-if="isThinking && !advice" class="thinking-indicator">
        <div class="spinner"></div>
        <p>Claude is analyzing your architecture...</p>
      </div>

      <div v-if="advice" class="advice-section">
        <div class="advice-header">
          <h3 class="advice-title">💡 Recommendations</h3>
          <div v-if="isThinking" class="streaming-badge">
            <span class="pulse"></span>
            Generating...
          </div>
        </div>
        
        <div 
          class="advice-content markdown-content"
          v-html="formatAdvice(advice)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.architecture-advisor {
  width: 100%;
}

.page-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--color-heading);
}

.page-description {
  font-size: 18px;
  color: var(--color-text-light);
  margin: 0;
}

.advisor-layout {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.input-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.secondary-button {
  padding: 6px 16px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.25s;
}

.secondary-button:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background);
}

.description-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  resize: vertical;
  margin-bottom: 16px;
  transition: all 0.25s;
}

.description-textarea:focus {
  outline: none;
  border-color: var(--color-brand);
}

.description-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background-soft);
}

.description-textarea::placeholder {
  color: var(--color-text-light);
}

.analyze-button {
  width: 100%;
  padding: 12px 24px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.analyze-button:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.analyze-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.thinking-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
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

.thinking-indicator p {
  margin: 0;
  color: var(--color-text-light);
  font-size: 16px;
}

.advice-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.advice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.advice-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-heading);
}

.streaming-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-brand);
  font-size: 13px;
  font-weight: 500;
}

.pulse {
  width: 8px;
  height: 8px;
  background: var(--color-brand);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.advice-content {
  padding: 32px 24px;
  line-height: 1.8;
  color: var(--color-text);
}

.markdown-content :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  margin: 32px 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-border);
  color: var(--color-heading);
}

.markdown-content :deep(h1:first-child) {
  margin-top: 0;
}

.markdown-content :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  margin: 28px 0 14px 0;
  color: var(--color-heading);
}

.markdown-content :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 12px 0;
  color: var(--color-heading);
}

.markdown-content :deep(p) {
  margin: 0 0 16px 0;
  font-size: 15px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 16px 0;
  padding-left: 28px;
}

.markdown-content :deep(li) {
  margin: 8px 0;
  font-size: 15px;
}

.markdown-content :deep(code) {
  padding: 2px 6px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
  font-family: var(--font-family-mono);
  color: var(--color-brand-dark);
}

.markdown-content :deep(pre) {
  background: var(--vt-c-black-soft);
  color: #e5e7eb;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.markdown-content :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-size: 14px;
}

.markdown-content :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  background: var(--color-background-soft);
  border-left: 4px solid var(--color-brand);
  border-radius: 6px;
  color: var(--color-text-light);
  font-style: italic;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--color-heading);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 32px 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 14px;
}

.markdown-content :deep(th) {
  padding: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  font-weight: 600;
  text-align: left;
  color: var(--color-heading);
}

.markdown-content :deep(td) {
  padding: 12px;
  border: 1px solid var(--color-border);
}

.markdown-content :deep(tr:hover) {
  background: var(--color-background-soft);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 28px;
  }
  
  .page-description {
    font-size: 16px;
  }
  
  .advice-content {
    padding: 24px 16px;
  }
  
  .markdown-content :deep(h1) {
    font-size: 24px;
  }
  
  .markdown-content :deep(h2) {
    font-size: 20px;
  }
  
  .markdown-content :deep(h3) {
    font-size: 18px;
  }
}
</style>
          