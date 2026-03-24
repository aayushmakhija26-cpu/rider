import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const routes = ['/', '/pricing', '/sign-in', '/sign-up', '/unauthorized']

for (const route of routes) {
  test(`${route} has no WCAG A/AA accessibility violations`, async ({
    page,
  }) => {
    const response = await page.goto(route)

    expect(response?.ok(), `Expected ${route} to load successfully`).toBe(true)
    await page.locator('body').waitFor()

    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

    expect(results.violations, `${route} should be free of WCAG A/AA issues`)
      .toEqual([])
  })
}
