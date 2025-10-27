import { createRouter, createWebHistory } from 'vue-router'
import ChatInterface from '@/components/ChatInterface.vue'
import CodeReviewer from '@/components/CodeReviewer.vue'
import ArchitectureAdvisor from '@/components/ArchitectureAdvisor.vue'
import DocumentQA from '@/components/DocumentQA.vue'
import ProjectManager from '@/components/ProjectManager.vue'

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
    },
    {
      path: '/project',
      name: 'project',
      component: ProjectManager
    }
  ]
})

export default router