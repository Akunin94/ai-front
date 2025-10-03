<script setup lang="ts">
import { ref } from 'vue'
import { useCodeReview } from '@/composables/useCodeReview'

const { isAnalyzing, error, result, analyzeCode } = useCodeReview()

const code = ref(`
import { ref, computed } from 'vue'

export function useCounter() {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, doubleCount, increment }
}
`)

const language = ref('typescript')

const handleAnalyze = () => {
  analyzeCode(code.value, language.value)
}

const getSeverityColor = (severity: string) => {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6'
  }
  return colors[severity as keyof typeof colors] || colors.medium
}
</script>

<template>
  <div class="code-reviewer">
    <div class="header">
      <h2>🔍 AI Code Reviewer</h2>
      <p>Загрузи код для детального анализа от Claude</p>
    </div>

    <div class="input-section">
      <div class="controls">
        <select v-model="language" class="language-select">
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="vue">Vue SFC</option>
        </select>
        
        <button 
          @click="handleAnalyze" 
          :disabled="isAnalyzing || !code.trim()"
          class="analyze-btn"
        >
          {{ isAnalyzing ? 'Анализирую...' : 'Проанализировать' }}
        </button>
      </div>

      <textarea
        v-model="code"
        placeholder="Вставь свой код здесь..."
        class="code-input"
        :disabled="isAnalyzing"
      />
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="result" class="results">
      <div class="summary-card">
        <h3>📊 Резюме</h3>
        <p>{{ result.summary }}</p>
      </div>

      <div v-if="result.issues.length > 0" class="issues-section">
        <h3>⚠️ Найденные проблемы ({{ result.issues.length }})</h3>
        
        <div 
          v-for="(issue, index) in result.issues" 
          :key="index"
          class="issue-card"
        >
          <div class="issue-header">
            <span 
              class="severity-badge"
              :style="{ backgroundColor: getSeverityColor(issue.severity) }"
            >
              {{ issue.severity.toUpperCase() }}
            </span>
            <span v-if="issue.line" class="line-number">
              Строка {{ issue.line }}
            </span>
          </div>
          
          <div class="issue-content">
            <div class="issue-description">
              <strong>Проблема:</strong>
              <p>{{ issue.description }}</p>
            </div>
            
            <div class="issue-suggestion">
              <strong>💡 Предложение:</strong>
              <p>{{ issue.suggestion }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="result.positives.length > 0" class="positives-section">
        <h3>✅ Что хорошо</h3>
        <ul>
          <li v-for="(positive, index) in result.positives" :key="index">
            {{ positive }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-reviewer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
}

.input-section {
  margin-bottom: 2rem;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.language-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
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
}

.analyze-btn:hover:not(:disabled) {
  background: #2563eb;
}

.analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-input {
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
}

.code-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-card {
  padding: 1.5rem;
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
}

.summary-card h3 {
  margin-bottom: 0.75rem;
  color: #1e40af;
}

.summary-card p {
  color: #1f2937;
  line-height: 1.6;
}

.issues-section h3,
.positives-section h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.issue-card {
  padding: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.severity-badge {
  padding: 0.25rem 0.75rem;
  color: white;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.line-number {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-family: monospace;
}

.issue-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.issue-description,
.issue-suggestion {
  line-height: 1.6;
}

.issue-description strong,
.issue-suggestion strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
}

.issue-description p,
.issue-suggestion p {
  color: #6b7280;
  margin: 0;
}

.issue-suggestion {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.positives-section {
  padding: 1.5rem;
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  border-radius: 0.5rem;
}

.positives-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.positives-section li {
  padding: 0.5rem 0;
  color: #1f2937;
  line-height: 1.6;
}

.positives-section li::before {
  content: '✓ ';
  color: #10b981;
  font-weight: bold;
  margin-right: 0.5rem;
}
</style>