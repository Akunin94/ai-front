<script setup lang="ts">
import { ref } from 'vue'
import { useArchitectureAdvice } from '@/composables/useArchitectureAdvice'
import { marked } from 'marked'

const { isThinking, advice, error, getAdvice } = useArchitectureAdvice()

const description = ref(`Мне нужно построить SaaS платформу для управления задачами команды с:
- Kanban доски
- Gantt диаграммы
- Time tracking
- Интеграция с GitHub
- Real-time collaboration
- До 1000 одновременных пользователей
`.trim())

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
    <div class="header">
      <h2>🏗️ Architecture Advisor</h2>
      <p>Опиши свой проект и получи архитектурные рекомендации от Claude</p>
    </div>

    <div class="input-section">
      <div class="controls">
        <button 
          @click="handleAnalyze" 
          :disabled="isThinking || !description.trim()"
          class="analyze-btn"
        >
          {{ isThinking ? '🤔 Анализирую...' : '🚀 Получить рекомендации' }}
        </button>
        
        <button 
          v-if="advice"
          @click="clearAdvice"
          class="clear-btn"
        >
          Очистить
        </button>
      </div>

      <textarea
        v-model="description"
        placeholder="Мне нужно построить SaaS платформу для управления задачами команды с:
- Kanban доски
- Gantt диаграммы
- Time tracking
- Интеграция с GitHub
- Real-time collaboration
- До 1000 одновременных пользователей"
        class="description-input"
        :disabled="isThinking"
      />
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="isThinking && !advice" class="thinking-indicator">
      <div class="spinner"></div>
      <p>Claude думает над архитектурой...</p>
    </div>

    <div v-if="advice" class="advice-section">
      <div class="advice-header">
        <h3>💡 Рекомендации</h3>
        <div v-if="isThinking" class="streaming-indicator">
          <span class="pulse"></span>
          Генерирую...
        </div>
      </div>
      
      <div 
        class="advice-content markdown-body"
        v-html="formatAdvice(advice)"
      />
    </div>
  </div>
</template>

<style scoped>
.architecture-advisor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.header p {
  color: #6b7280;
  font-size: 1rem;
}

.input-section {
  margin-bottom: 2rem;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.analyze-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
}

.analyze-btn:hover:not(:disabled) {
  background: #2563eb;
}

.analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #dc2626;
}

.description-input {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s;
}

.description-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.description-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.thinking-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.thinking-indicator p {
  color: #6b7280;
  font-size: 1.125rem;
}

.advice-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

.advice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.advice-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #3b82f6;
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
  padding: 2rem;
  line-height: 1.8;
  color: #1f2937;
}

/* Markdown стили */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #111827;
}

.markdown-body :deep(h1) {
  font-size: 1.875rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.markdown-body :deep(h2) {
  font-size: 1.5rem;
}

.markdown-body :deep(h3) {
  font-size: 1.25rem;
}

.markdown-body :deep(p) {
  margin-bottom: 1rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.markdown-body :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-body :deep(code) {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  color: #ef4444;
}

.markdown-body :deep(pre) {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-body :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 0.875rem;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.markdown-body :deep(em) {
  font-style: italic;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}
</style>