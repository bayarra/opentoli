import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('shows the OpenToli homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/OpenToli/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Clear language for modern ideas.',
    )
    await expect(page.getByRole('search')).toBeVisible()
  })
})
