import { expect, test } from '@playwright/test'

import { expectNoSeriousAccessibilityViolations, focusByTab } from '../helpers/accessibility'

test.describe('Frontend', () => {
  test('shows the OpenToli homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/OpenToli/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Clear language for modern ideas.',
    )
    await expect(page.getByRole('search')).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page)

    const search = page.getByRole('searchbox')
    await focusByTab(page, search)
    await page.keyboard.type('authentication')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('http://localhost:3000/search?q=authentication')
  })
})
