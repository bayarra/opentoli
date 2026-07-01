import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('recognizes the logged-in user on the contribution page', async () => {
    await page.goto('http://localhost:3000/contribute')

    await expect(page.getByText(`Signed in as ${testUser.name}.`)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create account' })).toHaveCount(0)
  })

  test('shows the web profile and logs out', async ({ browser }) => {
    const context = await browser.newContext()
    const profilePage = await context.newPage()

    try {
      await login({ page: profilePage, user: testUser })
      await profilePage.goto('http://localhost:3000/profile')

      const profileSummary = profilePage.locator('.profile-summary')
      const profileNext = profilePage.locator('.profile-next')
      const primaryNav = profilePage.getByRole('navigation', { name: 'Primary navigation' })
      await expect(profilePage.getByRole('heading', { name: testUser.name })).toBeVisible()
      await expect(profilePage.getByText(testUser.email)).toBeVisible()
      await expect(profilePage.getByText('Admin', { exact: true })).toBeVisible()
      await expect(profileSummary.getByRole('link', { name: 'Workspace' })).toBeVisible()
      await expect(profileSummary.getByRole('link', { name: 'My contributions' })).toBeVisible()
      await expect(primaryNav.getByRole('button', { name: 'Log out' })).toHaveCount(0)

      await profileSummary.getByRole('link', { name: 'My contributions' }).click()
      await expect(profilePage).toHaveURL('http://localhost:3000/contributions')
      await expect(
        profilePage.getByRole('heading', {
          name: /Track your comments and terminology proposals/,
        }),
      ).toBeVisible()
      await profilePage.goto('http://localhost:3000/profile')

      await profileNext.getByRole('button', { name: 'Log out' }).click()

      await expect(profilePage).toHaveURL('http://localhost:3000/')
      await profilePage.goto('http://localhost:3000/profile')
      await expect(profilePage).toHaveURL(/\/login\?next=%2Fprofile$/)
    } finally {
      await context.close()
    }
  })

  test('opens the private Review Queue', async () => {
    await page.goto('http://localhost:3000/workspace/drafts')

    await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible()
  })

  test('redirects the old Draft Inbox route into the Review Queue', async () => {
    await page.goto('http://localhost:3000/review/ai-drafts')

    await expect(page).toHaveURL('http://localhost:3000/workspace/drafts')
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible()
  })

  test('opens the web Workspace for terminology and agent work', async () => {
    await page.goto('http://localhost:3000/workspace')

    const workspaceNav = page.getByRole('navigation', { name: 'Workspace navigation' })
    const workspaceActions = page.getByRole('region', { name: 'Workspace actions' })
    await expect(page.getByRole('heading', { name: /Review, publish, and maintain/ })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'Review Queue' })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'Published Terms' })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'Community', exact: true })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'System Activity' })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'Imports' })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'AI Quality' })).toBeVisible()
    await expect(workspaceNav.getByRole('link', { name: 'Community Review' })).toBeVisible()
    await expect(workspaceActions.getByRole('link', { name: 'Open Review Queue' })).toBeVisible()
    await expect(workspaceActions.getByRole('link', { name: 'Edit published terms' })).toBeVisible()
    await expect(workspaceActions.getByRole('link', { name: 'Community activity' })).toBeVisible()
    await expect(workspaceActions.getByRole('link', { name: 'System activity' })).toBeVisible()
    await expect(workspaceActions.getByRole('link', { name: 'Prepare imports' })).toBeVisible()
    await expect(workspaceActions.getByRole('link', { name: 'View AI quality' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent generation jobs' })).toBeVisible()
  })

  test('opens published-term editing from Workspace', async () => {
    await page.goto('http://localhost:3000/workspace/terms')
    await expect(page.getByRole('heading', { name: /Edit published terms/ })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('link', { name: 'Published Terms' })).toHaveAttribute('aria-current', 'page')
  })

  test('opens import preparation from Workspace', async () => {
    await page.goto('http://localhost:3000/workspace/imports')
    await expect(page.getByRole('heading', { name: /Review terms before they enter the AI queue/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prepare for review' })).toBeVisible()
  })

  test('opens Community Activity from the web Workspace', async () => {
    await page.goto('http://localhost:3000/workspace')
    await page.getByRole('link', { name: 'Community activity' }).click()

    await expect(page).toHaveURL('http://localhost:3000/workspace/feedback', { timeout: 20_000 })
    await expect(
      page.getByRole('heading', { name: /Watch public contributions/ }),
    ).toBeVisible()
  })

  test('opens System Activity and the read-only AI Quality report', async () => {
    await page.goto('http://localhost:3000/workspace')

    const workspaceNav = page.getByRole('navigation', { name: 'Workspace navigation' })
    await workspaceNav.getByRole('link', { name: 'System Activity' }).click()
    await expect(page).toHaveURL('http://localhost:3000/workspace/jobs', { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: /Track AI preparation/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Grouped by import batch' })).toBeVisible()
    await expect(page.getByLabel('Headword')).toBeVisible()
    await expect(page.getByLabel('Status')).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Import batch' })).toBeVisible()

    await workspaceNav.getByRole('link', { name: 'AI Quality' }).click()
    await expect(page).toHaveURL('http://localhost:3000/workspace/calibration', {
      timeout: 20_000,
    })
    await expect(page.getByRole('heading', { name: /Measure AI quality/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI quality metrics' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'M5 go/no-go summary' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recorded AI quality evidence' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Record outcome|Update outcome/ })).toHaveCount(0)
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users(?:\?.*)?$/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
