import type { CodeReviewResult, CodeIssue } from '@/types/codeReview'

export class XMLParser {
  static parseCodeReview(xmlString: string): CodeReviewResult {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    // Проверка на ошибки парсинга
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Failed to parse XML response')
    }

    const analysis = xmlDoc.querySelector('analysis')
    if (!analysis) {
      throw new Error('Invalid XML structure: missing analysis tag')
    }

    // Парсинг summary
    const summary = analysis.querySelector('summary')?.textContent?.trim() || ''

    // Парсинг issues
    const issuesElements = analysis.querySelectorAll('issues > issue')
    const issues: CodeIssue[] = Array.from(issuesElements).map(issue => {
      const severity = issue.querySelector('severity')?.textContent?.trim() as CodeIssue['severity']
      const lineText = issue.querySelector('line')?.textContent?.trim()
      const description = issue.querySelector('description')?.textContent?.trim() || ''
      const suggestion = issue.querySelector('suggestion')?.textContent?.trim() || ''

      return {
        severity: severity || 'medium',
        line: lineText ? parseInt(lineText) : undefined,
        description,
        suggestion
      }
    })

    // Парсинг positives
    const positivesElements = analysis.querySelectorAll('positives > point')
    const positives = Array.from(positivesElements)
      .map(point => point.textContent?.trim() || '')
      .filter(Boolean)

    return {
      issues,
      positives,
      summary
    }
  }
}