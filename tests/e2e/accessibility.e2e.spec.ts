import { expect, test } from '@playwright/test'

import { expectNoSeriousAccessibilityViolations, focusByTab } from '../helpers/accessibility'
import { login } from '../helpers/login'
import {
  cleanupAccessibilityDraft,
  seedAccessibilityDraft,
  type AccessibilityDraftFixture,
} from '../helpers/seedAccessibilityDraft'

const serverURL = 'http://localhost:3000'

test.describe('M4 accessibility', () => {
  let fixture: AccessibilityDraftFixture

  test.beforeAll(async () => {
    fixture = await seedAccessibilityDraft()
  })

  test.afterAll(async () => {
    await cleanupAccessibilityDraft(fixture)
  })

  test('keeps the public draft and sign-in path accessible without a mouse', async ({ page }) => {
    await page.goto(`${serverURL}/drafts/${fixture.draftId}`)
    await expect(page.getByText('Sign in to contribute')).toBeVisible({ timeout: 15_000 })
    await expectNoSeriousAccessibilityViolations(page)

    const signIn = page.getByRole('link', { name: 'Sign in' })
    await focusByTab(page, signIn)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(
      `${serverURL}/login?next=${encodeURIComponent(`/drafts/${fixture.draftId}`)}`,
    )
    await expectNoSeriousAccessibilityViolations(page)
  })

  test('supports keyboard sign-in and moderated feedback submission', async ({ page }) => {
    await page.goto(`${serverURL}/login?next=${encodeURIComponent(`/drafts/${fixture.draftId}`)}`)
    const email = page.getByLabel('Email')
    await focusByTab(page, email)
    await page.keyboard.type(fixture.user.email)
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Password')).toBeFocused()
    await page.keyboard.type(fixture.user.password)
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(`${serverURL}/drafts/${fixture.draftId}`)
    await expect(page.getByText(`Contributing as ${fixture.user.name}`)).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page)

    const feedbackType = page.getByLabel('Feedback type')
    await focusByTab(page, feedbackType)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/Suggested Mongolian wording/)).toBeFocused()
    await page.keyboard.type('keyboard translation suggestion')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('textbox', { name: 'Comment', exact: true })).toBeFocused()
    await page.keyboard.type('This suggestion was submitted with the keyboard.')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Submit for moderation' })).toBeFocused()
    const submitted = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/comments') && response.request().method() === 'POST',
    )
    await page.keyboard.press('Space')
    expect((await submitted).ok()).toBe(true)
    await expect(
      page.getByText('Thanks. Your feedback is pending moderation.', { exact: true }),
    ).toBeVisible()
  })

  test('supports keyboard editing and secondary Editor actions', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await login({ page, user: fixture.user })
    await page.goto(`${serverURL}/workspace/drafts/${fixture.draftId}`)

    await expect(page.getByRole('heading', { name: /keyboard workflow/i })).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page)

    const headword = page.getByLabel('English headword')
    await focusByTab(page, headword)
    await page.keyboard.press('End')
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/editor/ai-drafts/${fixture.draftId}`) &&
        response.request().method() === 'PATCH',
    )
    await page.keyboard.type(' revised')
    expect((await saved).ok()).toBe(true)
    await expect(page.getByRole('status')).toHaveText('Changes saved')

    const more = page.locator('summary', { hasText: 'More' })
    await more.focus()
    await expect(more).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Hide draft' })).toBeVisible()
    await expectNoSeriousAccessibilityViolations(page)
    await context.close()
  })

  test('keeps optional references available without making them primary', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await login({ page, user: fixture.user })
    await page.goto(`${serverURL}/workspace/drafts/${fixture.draftId}`)

    const references = page.locator('summary', { hasText: 'References (optional)' })
    await expect(references).toBeVisible()
    await references.click()

    await expect(page.getByRole('link', { name: 'Keyboard workflow reference' })).toBeVisible()
    await expect(page.getByRole('button', { name: /verify/i })).toHaveCount(0)
    await context.close()
  })

  test('opens safe generation job detail from OpenToli web', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await login({ page, user: fixture.user })
    await page.goto(`${serverURL}/workspace/jobs/${fixture.jobId}`)

    await expect(page.getByRole('heading', { name: /keyboard workflow/i })).toBeVisible()
    await expect(page.getByText('Safe operational detail only.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry now' })).toBeDisabled()
    await expect(page.getByText('Completed jobs are not retried.')).toBeVisible()
    await expect(page.getByText('researchRawOutput')).toHaveCount(0)
    await expectNoSeriousAccessibilityViolations(page)
    await context.close()
  })
})
