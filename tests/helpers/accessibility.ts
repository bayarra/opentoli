import { expect, type Locator, type Page } from '@playwright/test'
import { createRequire } from 'node:module'

type AxeViolation = {
  help: string
  id: string
  impact: string | null
  nodes: Array<{ failureSummary?: string; target: string[] }>
}

type AxeRunner = {
  run: (
    context: Document,
    options: Record<string, unknown>,
  ) => Promise<{ violations: AxeViolation[] }>
}

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

export async function expectNoSeriousAccessibilityViolations(page: Page) {
  await page.addScriptTag({ path: axePath })
  const violations = await page.evaluate(async () => {
    const axe = (window as typeof window & { axe: AxeRunner }).axe
    const results = await axe.run(document, {
      resultTypes: ['violations'],
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
      },
    })
    return results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    )
  })

  const summary = violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(' ')}: ${node.failureSummary || 'failed'}`)
          .join('\n')}`,
    )
    .join('\n')

  expect(violations, summary || 'No serious accessibility violations').toEqual([])
}

export async function focusByTab(page: Page, target: Locator, maximumTabs = 30) {
  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((element) => element === document.activeElement)) return
  }
  throw new Error(`Could not reach ${await target.getAttribute('name')} with the Tab key.`)
}
