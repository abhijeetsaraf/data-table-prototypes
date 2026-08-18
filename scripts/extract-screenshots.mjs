// ---------------------------------------------------------------------------
// Scenario screenshot extractor
//
// Boots a dedicated Vite dev server, drives each requested scenario into a
// representative state with Playwright, and writes a PNG per scenario into
// public/screenshots/. Used to feed the case-study carousel.
//
// Usage:
//   node scripts/extract-screenshots.mjs                 # curated default set
//   node scripts/extract-screenshots.mjs all             # every registered scenario
//   node scripts/extract-screenshots.mjs <path> [<path>] # only the named routes
//
// Route names are the scenario `path` values from src/scenarios.jsx
// (e.g. row-grouping-command-nested).
// ---------------------------------------------------------------------------

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_DIR = resolve(ROOT, 'public/screenshots')

const PORT = 5199
const BASE = '/data-table-prototypes/'
const ORIGIN = `http://localhost:${PORT}`
const VIEWPORT = { width: 1600, height: 1000 }

// --- Capture recipes --------------------------------------------------------
// Each recipe puts a scenario into the state worth showcasing, then the runner
// screenshots the whole `.dt-layout` (left control panel + table). Helpers are
// resilient: they scope text lookups to the group-by builder so dimension
// names ("Team", "Role", …) never collide with table content.
async function settle(page, ms = 500) {
  await page.waitForTimeout(ms)
}

async function createFromCommandPalette(page, names) {
  const tree = page.locator('.dt-gb-tree')
  for (const name of names) {
    await tree.getByText(name, { exact: true }).first().click()
  }
  await page.getByRole('button', { name: 'Create groups' }).click()
  await page.locator('.dt-group-row').first().waitFor({ state: 'visible' })
  await settle(page)
}

async function createFromDimensionList(page, names) {
  const list = page.locator('.dt-gb-list')
  for (const name of names) {
    await list.getByText(name, { exact: true }).first().click()
  }
  await page.getByRole('button', { name: 'Create groups' }).click()
  await page.locator('.dt-group-row').first().waitFor({ state: 'visible' })
  await settle(page)
}

const RECIPES = {
  'row-grouping-command-nested': async (page) => {
    await createFromCommandPalette(page, ['Region', 'Business unit', 'Team'])
  },
  'row-grouping-command-nested-stacked': async (page) => {
    await createFromCommandPalette(page, ['Region', 'Business unit', 'Team', 'Role'])
    // Scroll the inner table body so the sticky ancestor pill trail engages.
    await page.locator('.dt-columns').evaluate((el) => {
      el.scrollTop = 640
    })
    await settle(page)
  },
  'row-grouping-accordion-drilldown-custom': async (page) => {
    await createFromDimensionList(page, ['Region', 'Business unit', 'Team'])
  },
  'row-grouping-accordion-drilldown': async (page) => {
    // Pre-grouped. Expand the first top group, then drill in one level so the
    // embedded split-button breadcrumb + level pager are visible.
    await page.locator('.dt-group-toggle').first().click()
    await settle(page, 300)
    const drillRow = page.locator('.dt-drill-row').first()
    if (await drillRow.count()) {
      await drillRow.click()
      await settle(page, 300)
    }
  },
}

// Curated default set: the later, most complex scenarios.
const DEFAULT_SET = [
  'row-grouping-accordion-drilldown',
  'row-grouping-accordion-drilldown-custom',
  'row-grouping-command-nested',
  'row-grouping-command-nested-stacked',
]

const ALL = Object.keys(RECIPES)

function pickScenarios(argv) {
  const args = argv.slice(2)
  if (args.length === 0) return DEFAULT_SET
  if (args.length === 1 && args[0] === 'all') return ALL
  const unknown = args.filter((a) => !RECIPES[a])
  if (unknown.length) {
    console.error(`Unknown scenario(s): ${unknown.join(', ')}`)
    console.error(`Available: ${ALL.join(', ')}`)
    process.exit(1)
  }
  return args
}

// --- Dev server -------------------------------------------------------------
async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Dev server did not become ready at ${url}`)
}

function startDevServer() {
  const child = spawn(
    'npx',
    ['vite', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'inherit' },
  )
  return child
}

// --- Main -------------------------------------------------------------------
async function main() {
  const scenarios = pickScenarios(process.argv)
  await mkdir(OUT_DIR, { recursive: true })

  const server = startDevServer()
  let browser
  try {
    await waitForServer(`${ORIGIN}${BASE}`)
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 })

    for (const path of scenarios) {
      const url = `${ORIGIN}${BASE}#/${path}`
      process.stdout.write(`• ${path} … `)
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.locator('.dt-layout').waitFor({ state: 'visible' })
      await settle(page, 400)

      const recipe = RECIPES[path]
      if (recipe) await recipe(page)

      const file = resolve(OUT_DIR, `${path}.png`)
      await page.locator('.dt-layout').screenshot({ path: file })
      console.log('captured')
    }

    await browser.close()
    console.log(`\nDone. ${scenarios.length} screenshot(s) in public/screenshots/`)
  } finally {
    if (browser) await browser.close().catch(() => {})
    server.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
