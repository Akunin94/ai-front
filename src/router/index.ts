import { createRouter, createWebHistory } from 'vue-router'
import ChatInterface from '@/components/ChatInterface.vue'
import CodeReviewer from '@/components/CodeReviewer.vue'
import ArchitectureAdvisor from '@/components/ArchitectureAdvisor.vue'
import DocumentQA from '@/components/DocumentQA.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatInterface
    },
    {
      path: '/code-review',
      name: 'code-review',
      component: CodeReviewer
    },
    {
      path: '/architecture',
      name: 'architecture',
      component: ArchitectureAdvisor
    },
    {
      path: '/documents',
      name: 'documents',
      component: DocumentQA
    }
  ]
})

export default router