<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchHealth } from '@/services/graphql.service'

const router = useRouter()
const route = useRoute()

const serverStatus = ref<'loading' | 'ok' | 'error'>('loading')

const checkHealth = async () => {
  try {
    const status = await fetchHealth()
    serverStatus.value = status === 'ok' ? 'ok' : 'error'
  } catch {
    serverStatus.value = 'error'
  }
}

onMounted(() => {
  checkHealth()
  setInterval(checkHealth, 30000)
})

const isActive = (name: string) => route.name === name

const navItems = [
  { name: 'chat', label: 'Chat', icon: '💬' },
  { name: 'code-review', label: 'Code Review', icon: '🔍' },
  { name: 'poker-review', label: 'Poker Review', icon: '🎰' },
  { name: 'architecture', label: 'Architecture', icon: '🏗️' },
  { name: 'documents', label: 'Documents', icon: '📚' },
  { name: 'project', label: 'Project', icon: '📦' }
]
</script>

<template>
  <div id="app">
    <header class="nav-bar">
      <div class="nav-bar-container">
        <div class="nav-bar-title">
          <h1>AI Assistant</h1>
          <span class="nav-bar-subtitle">Powered by Claude</span>
          <span class="server-status-wrapper" :title="`Server: ${serverStatus}`">
            <span class="server-status-dot" :class="serverStatus" />
            <span class="server-status-label">{{ serverStatus === 'ok' ? 'Online' : serverStatus === 'error' ? 'Offline' : '...' }}</span>
          </span>
        </div>
        
        <nav class="nav-bar-menu">
          <button
            v-for="item in navItems"
            :key="item.name"
            :class="['nav-item', { active: isActive(item.name) }]"
            @click="router.push({ name: item.name })"
          >
            <span class="nav-item-icon">{{ item.icon }}</span>
            <span class="nav-item-label">{{ item.label }}</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="content-container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style>
@import './styles/main.css';

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation Bar */
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--header-height);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.nav-bar-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-bar-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-bar-title h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-heading);
}

.nav-bar-subtitle {
  font-size: 13px;
  color: var(--color-text-light);
}

.server-status-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  cursor: default;
}

.server-status-dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  flex-shrink: 0;
}

.server-status-dot.ok {
  background: #22c55e;
}

.server-status-dot.ok::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: #22c55e;
  opacity: 0;
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.server-status-dot.error {
  background: #ef4444;
  animation: blink 1s step-end infinite;
}

.server-status-dot.loading {
  animation: pulse-status 1.5s infinite;
}

.server-status-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-light);
  line-height: 1;
}

@keyframes ping {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes pulse-status {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.nav-bar-menu {
  display: flex;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.25s;
}

.nav-item-icon {
  font-size: 16px;
}

.nav-item:hover {
  color: var(--color-brand);
  background-color: var(--color-background-soft);
}

.nav-item.active {
  color: var(--color-brand);
  background-color: var(--color-background-mute);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 32px 0;
}

.content-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-bar-subtitle {
    display: none;
  }
  
  .nav-item-label {
    display: none;
  }
  
  .content-container {
    padding: 0 16px;
  }
}
</style>