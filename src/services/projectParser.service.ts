import type { ProjectFile, ProjectMetadata } from './projectStorage.service'

const ALLOWED_EXTENSIONS = ['.vue', '.ts', '.js', '.jsx', '.tsx', '.json', '.css', '.scss', '.md', '.txt', '.html']

const IGNORED_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
  'out',
  '.output'
]

const IGNORED_FILES = [
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
]

const MAX_FILE_SIZE = 500 * 1024 // 500KB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 500

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

export class ProjectParserService {
  private fileCount = 0
  private totalSize = 0

  async parseDirectory(dirHandle: FileSystemDirectoryHandle): Promise<{
    files: ProjectFile[]
    structure: string
    metadata: ProjectMetadata
  }> {
    this.fileCount = 0
    this.totalSize = 0

    const files: ProjectFile[] = []
    const tree = await this.buildFileTree(dirHandle, '')

    // Рекурсивно собираем файлы
    await this.collectFiles(dirHandle, '', files)

    // Генерируем Markdown структуру
    const structure = this.generateMarkdownStructure(tree, dirHandle.name)

    const metadata: ProjectMetadata = {
      name: dirHandle.name,
      totalFiles: files.length,
      totalSize: this.totalSize,
      uploadedAt: Date.now(),
      structure
    }

    return { files, structure, metadata }
  }

  private async buildFileTree(
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string
  ): Promise<FileNode> {
    const node: FileNode = {
      name: dirHandle.name,
      path: parentPath,
      type: 'directory',
      children: []
    }

    for await (const entry of (dirHandle as any).values()) {
      // Игнорируем
      if (IGNORED_DIRS.includes(entry.name) || IGNORED_FILES.includes(entry.name)) {
        continue
      }

      const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name

      if (entry.kind === 'directory') {
        const childNode = await this.buildFileTree(entry as FileSystemDirectoryHandle, entryPath)
        if (childNode.children && childNode.children.length > 0) {
          node.children!.push(childNode)
        }
      } else if (entry.kind === 'file') {
        const ext = this.getExtension(entry.name)
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          node.children!.push({
            name: entry.name,
            path: entryPath,
            type: 'file'
          })
        }
      }
    }

    // Сортируем: папки первыми, потом файлы
    node.children?.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return node
  }

  private async collectFiles(
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string,
    files: ProjectFile[]
  ): Promise<void> {
    for await (const entry of (dirHandle as any).values()) {
      // Проверка лимитов
      if (this.fileCount >= MAX_FILES) {
        throw new Error(`Maximum file limit reached (${MAX_FILES} files)`)
      }

      if (this.totalSize >= MAX_TOTAL_SIZE) {
        throw new Error(`Maximum size limit reached (${MAX_TOTAL_SIZE / (1024 * 1024)}MB)`)
      }

      // Игнорируем
      if (IGNORED_DIRS.includes(entry.name) || IGNORED_FILES.includes(entry.name)) {
        continue
      }

      const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name

      if (entry.kind === 'directory') {
        await this.collectFiles(entry as FileSystemDirectoryHandle, entryPath, files)
      } else if (entry.kind === 'file') {
        const ext = this.getExtension(entry.name)
        if (!ALLOWED_EXTENSIONS.includes(ext)) continue

        const fileHandle = entry as FileSystemFileHandle
        const file = await fileHandle.getFile()

        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping ${entryPath}: file too large (${file.size} bytes)`)
          continue
        }

        const content = await file.text()

        files.push({
          id: crypto.randomUUID(),
          path: entryPath,
          name: entry.name,
          content,
          size: file.size,
          type: ext.slice(1),
          lastModified: file.lastModified
        })

        this.fileCount++
        this.totalSize += file.size
      }
    }
  }

  private generateMarkdownStructure(tree: FileNode, projectName: string): string {
    let md = `# Project: ${projectName}\n\n`
    md += `## Structure\n\n`
    md += this.nodeToMarkdown(tree, 0)
    return md
  }

  private nodeToMarkdown(node: FileNode, depth: number): string {
    const indent = '  '.repeat(depth)
    let md = ''

    if (node.type === 'directory' && depth > 0) {
      md += `${indent}- 📁 **${node.name}/**\n`
    }

    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'file') {
          const icon = this.getFileIcon(child.name)
          md += `${indent}  - ${icon} \`${child.name}\`\n`
        } else {
          md += this.nodeToMarkdown(child, depth + 1)
        }
      }
    }

    return md
  }

  private getFileIcon(filename: string): string {
    const ext = this.getExtension(filename)
    const iconMap: Record<string, string> = {
      '.vue': '🔷',
      '.ts': '📘',
      '.js': '📙',
      '.jsx': '⚛️',
      '.tsx': '⚛️',
      '.json': '📋',
      '.css': '🎨',
      '.scss': '🎨',
      '.md': '📝',
      '.html': '🌐'
    }
    return iconMap[ext] || '📄'
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : ''
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

export const projectParser = new ProjectParserService()