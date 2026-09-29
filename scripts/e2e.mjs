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
  ['counseling', '圣辅课程'],
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
  const cover = page.locator('.cover-photo');
  assert(await cover.count() === 1, '封面照片元素缺失');
  const coverSize = await cover.evaluate((img) => [img.naturalWidth, img.naturalHeight]);
  assert(coverSize[0] >= 1920 && coverSize[1] >= 1080, `封面分辨率不足 ${coverSize.join('×')}`);
  assert(await cover.evaluate((img) => getComputedStyle(img).objectFit === 'contain'), '封面照片没有完整显示');
  await page.getByRole('link', { name: /进入静室/ }).click();
  await page.waitForURL('**/study/');
  assert((await page.locator('.home-hero h1').textContent())?.includes('静室'), '首页长图未加载');
  await page.screenshot({ path: join(outDir, 'home-desktop.png'), fullPage: true });
});

await check('首页按参考图完成十宫格与信息面板', async () => {
  await page.goto(`${baseURL}/study/`, { waitUntil: 'networkidle' });
  assert((await page.locator('.home-hero p').textContent())?.includes('在这里安静读经、学习、记录'), '首页长图说明文案不正确');
  assert(await page.locator('.home-category-card').count() === 10, '首页应有十个栏目入口');
  const cards = page.locator('.home-category-card');
  const first = await cards.nth(0).boundingBox();
  const fifth = await cards.nth(4).boundingBox();
  const sixth = await cards.nth(5).boundingBox();
  assert(first && fifth && sixth && Math.abs(first.y - fifth.y) < 3 && sixth.y > first.y + first.height, '桌面栏目没有按 5×2 排列');
  assert(await page.locator('.home-update-row').count() === 4, '最近更新应显示四行');
  assert((await page.locator('.home-verse-card').textContent())?.includes('箴言 3:5-6'), '今日经文内容不正确');
  assert(await page.locator('.home-music-card .music-player-inline').count() === 1, '首页音乐面板缺失');
});

await check('八个栏目全部可达并展示分类入口', async () => {
  for (const [slug, title] of expectedSections) {
    const response = await page.goto(`${baseURL}/${slug}/`, { waitUntil: 'networkidle' });
    assert(response?.ok(), `${slug} HTTP ${response?.status()}`);
    assert((await page.locator('h1.page-title').textContent())?.trim() === title, `${slug} 标题错误`);
    const expectedCount = slug === 'counseling' ? 4 : 3;
    assert(await page.locator('.collection-card').count() === expectedCount, `${slug} 分类入口数量错误`);
  }
});

await check('圣辅课程按学习大纲下钻', async () => {
  await page.goto(`${baseURL}/counseling/`, { waitUntil: 'networkidle' });
  assert(await page.locator('.collection-card').count() === 4, '圣辅课程应有四个学习大纲');
  await page.goto(`${baseURL}/counseling/biblical-foundations/`, { waitUntil: 'networkidle' });
  assert(await page.locator('.outline-item').count() >= 1, '圣辅基础类目缺少内容大纲');
  assert(await page.locator('.content-card').count() >= 1, '圣辅基础类目缺少正文入口');
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
  const firstTitle = await page.locator('[data-music-title]').textContent();
  await page.locator('[data-music-next]').click();
  const secondTitle = await page.locator('[data-music-title]').textContent();
  assert(firstTitle !== secondTitle, '下一首没有切换曲目');
  await page.locator('[data-music-audio]').evaluate((audio) => audio.dispatchEvent(new Event('ended')));
  const thirdTitle = await page.locator('[data-music-title]').textContent();
  assert(secondTitle !== thirdTitle, '曲目结束后没有继续循环播放下一首');
  await page.locator('[data-music-audio]').evaluate((audio) => audio.dispatchEvent(new Event('ended')));
  const loopTitle = await page.locator('[data-music-title]').textContent();
  assert(loopTitle === firstTitle, '第三首结束后没有循环回第一首');
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

await check('核心页面桌面与移动端均无横向溢出', async () => {
  const routes = ['/', '/study/', ...expectedSections.map(([slug]) => `/${slug}/`), '/index/', '/about/', '/admin/', '/counseling/biblical-foundations/', '/counseling/biblical-foundations/counseling-begins-with-scripture/', '/sermons/year/2026/'];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `${viewport.width}px ${route} 横向溢出 ${overflow}px`);
    }
  }
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
