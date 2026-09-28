import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const baseURL = process.env.QUIET_ROOM_BASE_URL ?? 'http://127.0.0.1:4321';
const chrome = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(chrome)) throw new Error(`Chrome not found: ${chrome}`);

const outDir = join(process.cwd(), 'runs', 'e2e');
mkdirSync(outDir, { recursive: true });

const expectedSections = [
  ['confession', '信仰告白'],
  ['sermons', '主日证道'],
  ['devotions', '灵修笔记'],
  ['theology', '神学课堂'],
  ['reading', '读书笔记'],
  ['notes', '要点思考'],
  ['life', '信仰与生活'],
];

const results = [];
const runtimeErrors = [];
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
});

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.error(`FAIL  ${name}: ${error.message}`);
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

await check('封面进入静室', async () => {
  const response = await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  assert(response?.ok(), `HTTP ${response?.status()}`);
  assert((await page.locator('.cover-copy h1').textContent())?.includes('静室'), '封面站名不正确');
  assert(await page.locator('.cover-page').evaluate((el) => getComputedStyle(el).backgroundImage.includes('jingshi-cover.webp')), '封面真实照片未加载');
  await page.getByRole('link', { name: /进入静室/ }).click();
  await page.waitForURL('**/study/');
  assert((await page.locator('.home-intro h1').textContent())?.includes('静室'), '首页未加载');
  assert(await page.locator('.home-intro img').count() === 0, '首页不应再使用大图');
  await page.screenshot({ path: join(outDir, 'home-desktop.png'), fullPage: true });
});

await check('七个栏目全部可达并展示三类入口', async () => {
  for (const [slug, title] of expectedSections) {
    const response = await page.goto(`${baseURL}/${slug}/`, { waitUntil: 'networkidle' });
    assert(response?.ok(), `${slug} HTTP ${response?.status()}`);
    assert((await page.locator('h1.page-title').textContent())?.trim() === title, `${slug} 标题错误`);
    assert(await page.locator('.collection-card').count() === 3, `${slug} 分类入口不是 3 个`);
  }
});

await check('类目→大纲→正文下钻与深链', async () => {
  await page.goto(`${baseURL}/sermons/romans/`, { waitUntil: 'networkidle' });
  assert(await page.locator('.outline-item').count() >= 1, '罗马书类目没有大纲');
  const outline = page.locator('details.outline-item').first();
  await outline.locator('summary').click();
  assert(await outline.getAttribute('open') !== null, '大纲点击后没有展开');
  assert(await outline.locator('.outline-entries a').count() >= 1, '展开后没有正文入口');
  const articleLink = page.locator('.content-card h3 a').first();
  const href = await articleLink.getAttribute('href');
  assert(Boolean(href), '正文链接缺失');
  await page.goto(new URL(href, baseURL).toString(), { waitUntil: 'networkidle' });
  assert((await page.locator('h1.article-title').textContent())?.includes('神的义'), '正文标题不正确');
  assert(await page.locator('.prose h2').count() >= 2, '正文层级缺失');
  assert(await page.locator('.breadcrumb a').count() >= 3, '面包屑不完整');
});

await check('主日证道按年份归档可达', async () => {
  await page.goto(`${baseURL}/sermons/`, { waitUntil: 'networkidle' });
  const yearLink = page.locator('.year-archive a').first();
  assert(await yearLink.count() === 1, '主日证道缺少年份入口');
  const href = await yearLink.getAttribute('href');
  await page.goto(new URL(href, baseURL).toString(), { waitUntil: 'networkidle' });
  assert((await page.locator('h1.page-title').textContent())?.includes('2026 年主日证道'), '年份归档标题错误');
  assert(await page.locator('.content-card').count() >= 1, '年份归档没有证道内容');
});

await check('空类目有明确状态', async () => {
  await page.goto(`${baseURL}/confession/historic-creeds/`, { waitUntil: 'networkidle' });
  assert((await page.locator('.empty-state').textContent())?.includes('尚未录入正文'), '空状态缺失');
});

await check('搜索可检索中文内容', async () => {
  await page.goto(`${baseURL}/study/`, { waitUntil: 'networkidle' });
  await page.locator('[data-search-open]').click();
  await page.locator('#site-search').fill('称义');
  await page.waitForTimeout(120);
  assert(await page.locator('.search-result').count() >= 1, '搜索“称义”无结果');
  const text = await page.locator('.search-results').textContent();
  assert(text?.includes('称义'), '搜索结果不相关');
  await page.keyboard.press('Escape');
});

await check('索引可按经文主题与年份下钻', async () => {
  await page.goto(`${baseURL}/index/`, { waitUntil: 'networkidle' });
  const filter = page.locator('[data-index-kind]').first();
  assert(await filter.count() === 1, '索引缺少可点击筛选项');
  await filter.click();
  assert(await page.locator('[data-index-results-panel]').isVisible(), '索引结果面板未出现');
  assert(await page.locator('[data-index-results] a').count() >= 1, '索引筛选没有返回正文');
});

await check('主题切换并跨刷新保持', async () => {
  await page.goto(`${baseURL}/study/`, { waitUntil: 'networkidle' });
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('[data-theme-toggle]').click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  assert(before !== after, '主题未切换');
  await page.reload({ waitUntil: 'networkidle' });
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
  assert(persisted === after, '主题未持久化');
});

await check('可选轻音乐默认关闭且点击可开启', async () => {
  await page.goto(`${baseURL}/study/`, { waitUntil: 'networkidle' });
  const button = page.locator('[data-music-toggle]');
  assert(await button.getAttribute('aria-pressed') === 'false', '音乐不应默认自动播放');
  await button.click();
  assert(await button.getAttribute('aria-pressed') === 'true', '音乐点击后未进入播放状态');
  assert((await page.locator('[data-music-status]').textContent())?.includes('正在播放'), '播放状态文案未更新');
  await button.click();
});

await check('安静阅读模式可开关', async () => {
  await page.goto(`${baseURL}/devotions/psalms-devotion/planted-by-streams/`, { waitUntil: 'networkidle' });
  const button = page.locator('[data-reading-toggle]');
  await button.click();
  assert(await page.locator('body').evaluate((el) => el.classList.contains('reading-mode')), '阅读模式未开启');
  await button.click();
  assert(!(await page.locator('body').evaluate((el) => el.classList.contains('reading-mode'))), '阅读模式未关闭');
});

await check('内容工作台生成标准 Markdown', async () => {
  await page.goto(`${baseURL}/admin/`, { waitUntil: 'networkidle' });
  await page.locator('#editor-title').fill('测试文章');
  await page.locator('#editor-slug').fill('test-entry');
  await page.locator('#editor-collection').fill('psalms-devotion');
  await page.locator('#editor-summary').fill('用于验收内容工作台');
  await page.locator('#editor-body').fill('## 测试正文\n\n这是正文。');
  const preview = await page.locator('[data-editor-preview]').textContent();
  assert(preview?.includes('title: "测试文章"'), '预览缺标题');
  assert(preview?.includes('slug: test-entry'), '预览缺 slug');
  assert(preview?.includes('## 测试正文'), '预览缺正文');
});

await check('移动端导航与布局无横向溢出', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  assert(await page.locator('.cover-copy').isVisible(), '移动端封面文字不可见');
  await page.screenshot({ path: join(outDir, 'cover-mobile.png'), fullPage: true });
  await page.goto(`${baseURL}/study/`, { waitUntil: 'networkidle' });
  const menu = page.locator('[data-menu-toggle]');
  assert(await menu.isVisible(), '移动菜单按钮不可见');
  await menu.click();
  assert(await page.locator('[data-mobile-nav]').isVisible(), '移动导航未展开');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `页面横向溢出 ${overflow}px`);
  await page.screenshot({ path: join(outDir, 'home-mobile.png'), fullPage: true });
});

await check('正常页面无未捕获浏览器错误', async () => {
  assert(runtimeErrors.length === 0, runtimeErrors.join(' | '));
});

runtimeErrors.length = 0;

await check('404 页面可用', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const response = await page.goto(`${baseURL}/404.html`, { waitUntil: 'networkidle' });
  assert(response?.status() === 404 || response?.ok(), `404.html HTTP ${response?.status()}`);
  assert((await page.locator('.not-found h1').textContent())?.includes('404'), '404 页面内容缺失');
});

await browser.close();

const failed = results.filter((item) => !item.ok);
console.log(`\nE2E: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
