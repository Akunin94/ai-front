<script setup lang="ts">
import { ref } from 'vue'
import { useCodeReview } from '@/composables/useCodeReview'

const { isAnalyzing, error, result, analyzeCode } = useCodeReview()

const code = ref(`import { ref, computed } from 'vue'

export function useCounter() {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, doubleCount, increment }
}`)

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

const getSeverityLabel = (severity: string) => {
  return severity.toUpperCase()
}
</script>

<template>
  <div class="code-reviewer">
    <div class="page-header">
      <h1 class="page-title">Code Review</h1>
      <p class="page-description">
        Get detailed analysis and suggestions for your code
      </p>
    </div>

    <div class="reviewer-layout">
      <div class="code-input-section">
        <div class="section-header">
          <h3 class="section-title">Your Code</h3>
          <select v-model="language" class="language-select">
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <textarea
          v-model="code"
          placeholder="Paste your code here..."
          class="code-textarea"
          :disabled="isAnalyzing"
        />

        <button
          @click="handleAnalyze"
          :disabled="isAnalyzing || !code.trim()"
          class="analyze-button"
        >
          {{ isAnalyzing ? 'Analyzing...' : 'Analyze Code' }}
        </button>
      </div>

      <div v-if="error" class="error-banner">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div v-if="result" class="results-section">
        <div class="summary-card">
          <h3 class="card-title">📊 Summary</h3>
          <p class="summary-text">{{ result.summary }}</p>
        </div>

        <div v-if="result.issues.length > 0" class="issues-section">
          <h3 class="section-title">
            ⚠️ Issues Found ({{ result.issues.length }})
          </h3>
          
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
                {{ getSeverityLabel(issue.severity) }}
              </span>
              <span v-if="issue.line" class="line-number">
                Line {{ issue.line }}
              </span>
            </div>
            
            <div class="issue-content">
              <div class="issue-description">
                <strong>Problem:</strong>
                <p>{{ issue.description }}</p>
              </div>
              
              <div class="issue-suggestion">
                <strong>💡 Suggestion:</strong>
                <p>{{ issue.suggestion }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="result.positives.length > 0" class="positives-section">
          <h3 class="section-title">✅ What's Good</h3>
          <ul class="positives-list">
            <li v-for="(positive, index) in result.positives" :key="index">
              {{ positive }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-reviewer {
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

.reviewer-layout {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.code-input-section {
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

.language-select {
  padding: 6px 12px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
}

.language-select:focus {
  outline: none;
  border-color: var(--color-brand);
}

.code-textarea {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  font-family: var(--font-family-mono);
  font-size: 14px;
  line-height: 1.6;
  background: var(--color-code-bg);
  color: var(--color-code-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  resize: vertical;
  margin-bottom: 16px;
  transition: all 0.25s;
}

.code-textarea:focus {
  outline: none;
  border-color: var(--color-brand);
}

.code-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.code-textarea::placeholder {
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

@media (prefers-color-scheme: dark) {
  .error-banner {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fecaca;
  }
}

.error-icon {
  font-size: 16px;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-card {
  padding: 24px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-brand);
  border-radius: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--color-heading);
}

.summary-text {
  margin: 0;
  color: var(--color-text);
  line-height: 1.6;
}

.issues-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-card {
  padding: 20px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.25s;
}

.issue-card:hover {
  box-shadow: var(--shadow-2);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.severity-badge {
  padding: 4px 12px;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.line-number {
  padding: 4px 10px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--font-family-mono);
  color: var(--color-text-light);
}

.issue-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-description,
.issue-suggestion {
  line-height: 1.6;
}

.issue-description strong,
.issue-suggestion strong {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-heading);
}

.issue-description p,
.issue-suggestion p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
}

.issue-suggestion {
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.positives-section {
  padding: 24px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-brand);
  border-radius: 8px;
}

.positives-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
}

.positives-list li {
  padding: 10px 0;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.6;
  border-bottom: 1px solid var(--color-border);
}

.positives-list li:last-child {
  border-bottom: none;
}

.positives-list li::before {
  content: '✓ ';
  color: var(--color-brand);
  font-weight: bold;
  font-size: 16px;
  margin-right: 8px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 28px;
  }
  
  .page-description {
    font-size: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>