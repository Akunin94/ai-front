export interface CodeIssue {
    severity: 'high' | 'medium' | 'low'
    description: string
    suggestion: string
    line?: number
  }
  
  export interface CodeReviewResult {
    issues: CodeIssue[]
    positives: string[]
    summary: string
  }