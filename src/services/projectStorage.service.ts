export interface ProjectFile {
    id: string
    path: string
    name: string
    content: string
    size: number
    type: string
    lastModified: number
  }
  
  export interface ProjectMetadata {
    name: string
    totalFiles: number
    totalSize: number
    uploadedAt: number
    structure: string // Markdown структура
  }
  
  const DB_NAME = 'ProjectStorage'
  const DB_VERSION = 1
  const FILES_STORE = 'files'
  const METADATA_STORE = 'metadata'
  
  class ProjectStorageService {
    private db: IDBDatabase | null = null
  
    async init(): Promise<void> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
  
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          this.db = request.result
          resolve()
        }
  
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
  
          // Store для файлов
          if (!db.objectStoreNames.contains(FILES_STORE)) {
            const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' })
            filesStore.createIndex('path', 'path', { unique: true })
          }
  
          // Store для метаданных
          if (!db.objectStoreNames.contains(METADATA_STORE)) {
            db.createObjectStore(METADATA_STORE, { keyPath: 'name' })
          }
        }
      })
    }
  
    async saveFile(file: ProjectFile): Promise<void> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([FILES_STORE], 'readwrite')
        const store = transaction.objectStore(FILES_STORE)
        const request = store.put(file)
  
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  
    async saveFiles(files: ProjectFile[]): Promise<void> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([FILES_STORE], 'readwrite')
        const store = transaction.objectStore(FILES_STORE)
  
        let completed = 0
        const total = files.length
  
        files.forEach(file => {
          const request = store.put(file)
          request.onsuccess = () => {
            completed++
            if (completed === total) resolve()
          }
          request.onerror = () => reject(request.error)
        })
  
        if (total === 0) resolve()
      })
    }
  
    async getFile(id: string): Promise<ProjectFile | null> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([FILES_STORE], 'readonly')
        const store = transaction.objectStore(FILES_STORE)
        const request = store.get(id)
  
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    }
  
    async getAllFiles(): Promise<ProjectFile[]> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([FILES_STORE], 'readonly')
        const store = transaction.objectStore(FILES_STORE)
        const request = store.getAll()
  
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
  
    async saveMetadata(metadata: ProjectMetadata): Promise<void> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([METADATA_STORE], 'readwrite')
        const store = transaction.objectStore(METADATA_STORE)
        const request = store.put(metadata)
  
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  
    async getMetadata(): Promise<ProjectMetadata | null> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([METADATA_STORE], 'readonly')
        const store = transaction.objectStore(METADATA_STORE)
        const request = store.getAll()
  
        request.onsuccess = () => {
          const results = request.result
          resolve(results.length > 0 ? results[0] : null)
        }
        request.onerror = () => reject(request.error)
      })
    }
  
    async clearAll(): Promise<void> {
      if (!this.db) await this.init()
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([FILES_STORE, METADATA_STORE], 'readwrite')
        
        const filesStore = transaction.objectStore(FILES_STORE)
        const metadataStore = transaction.objectStore(METADATA_STORE)
        
        const clearFiles = filesStore.clear()
        const clearMetadata = metadataStore.clear()
  
        let completed = 0
        const checkComplete = () => {
          completed++
          if (completed === 2) resolve()
        }
  
        clearFiles.onsuccess = checkComplete
        clearMetadata.onsuccess = checkComplete
        
        transaction.onerror = () => reject(transaction.error)
      })
    }
  
    async getStorageSize(): Promise<number> {
      const files = await this.getAllFiles()
      return files.reduce((total, file) => total + file.size, 0)
    }
  }
  
  export const projectStorage = new ProjectStorageService()