// Visual checks against `shopify theme dev` (http://127.0.0.1:9292).
// Usage: node shoot.mjs <scenario> [query] [outDir]
// Scenarios: home | search-empty | search <query> | menu <n> | mobile-menu [n] | utility | cart-drawer | cart | collection
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:9292';
const [scenario = 'home', query = '', outDir = 'shots'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

const browser = await chromium.launch();
for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage({ viewport, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch, deviceScaleFactor: viewport.deviceScaleFactor || 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  const path = scenario === 'collection' ? '/collections/all' : scenario === 'cart' ? '/cart' : '/';
  // theme dev keeps a live-reload connection open, so 'networkidle' never fires
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  // theme dev can serve modules slowly: wait until the header's custom elements are defined
  await page.waitForFunction(() => customElements.get('site-header') && customElements.get('drill-menu'), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);

  if (scenario.startsWith('search')) {
    await page.click('[data-dialog-open="SearchPanel"]');
    await page.waitForSelector('#SearchPanel[open]');
    if (query) {
      await page.fill('#SearchPanel-input', query);
      await page.waitForFunction(() => document.querySelector('#SearchPanel predictive-search[data-has-results]') || document.querySelector('#SearchPanel-results')?.textContent.trim(), null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(500);
  }
  if (scenario === 'menu' && name === 'desktop') {
    const index = Math.max(Number(query) || 1, 1) - 1;
    const item = page.locator('.site-nav [data-menu-item] > .site-nav__link').nth(index);
    if (await item.count()) {
      await item.hover();
      // lazy images inside the menu start loading only once it is open
      await page.waitForTimeout(2500);
    }
  }
  if (scenario === 'mobile-menu' && name === 'mobile') {
    await page.click('[popovertarget="MenuPanel"]');
    await page.waitForTimeout(600);
    // optional n: open the n-th sub-panel
    if (query) {
      await page.locator('#MenuPanel [data-panel="root"] [data-panel-open]').nth(Number(query) - 1).click();
      await page.waitForTimeout(500);
    }
  }
  if (scenario === 'utility') {
    await page.locator('.utility-panel__trigger:visible').first().click();
    await page.waitForTimeout(700);
  }
  if (scenario === 'cart-drawer') {
    await page.locator('[data-dialog-open="CartDrawer"]:visible').first().click();
    await page.waitForTimeout(700);
  }

  const file = join(outDir, `${scenario}${query ? '-' + query : ''}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(file, errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no console errors');
  await page.close();
}
await browser.close();
