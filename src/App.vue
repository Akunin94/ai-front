<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isActive = (name: string) => route.name === name
</script>

<template>
  <div id="app">
    <nav class="nav-tabs">
      <button 
        :class="['tab', { active: isActive('chat') }]"
        @click="router.push('/')"
      >
        💬 Chat
      </button>
      <button 
        :class="['tab', { active: isActive('code-review') }]"
        @click="router.push('/code-review')"
      >
        🔍 Code Review
      </button>
      <button 
        :class="['tab', { active: isActive('architecture') }]"
        @click="router.push('/architecture')"
      >
        🏗️ Architecture
      </button>
      <button 
        :class="['tab', { active: isActive('documents') }]"
        @click="router.push('/documents')"
      >
        📚 Documents Q&A
      </button>
    </nav>

    <div class="tab-content">
      <RouterView />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background: #f9fafb;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

.nav-tabs {
  display: flex;
  background: #ffffff;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.tab {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  margin-bottom: -2px;
  white-space: nowrap;
}

.tab:hover {
  color: #3b82f6;
  background: #f9fafb;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  background: #f9fafb;
}
</style>