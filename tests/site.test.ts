import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NAV, SECTIONS } from '../src/data/site';

const contentDir = join(process.cwd(), 'src', 'content', 'library');
const files = readdirSync(contentDir).filter((name) => name.endsWith('.md'));

function frontmatter(name: string) {
  const raw = readFileSync(join(contentDir, name), 'utf8');
  const block = raw.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] ?? '';
  const value = (key: string) => block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  const collectionSlug = value('collection').match(/slug:\s*([a-z0-9-]+)/)?.[1] ?? '';
  return {
    raw,
    title: value('title'),
    slug: value('slug'),
    section: value('section'),
    collectionSlug,
    date: value('date'),
    summary: value('summary'),
  };
}

describe('静室信息架构', () => {
  it('一级导航覆盖全部八个内容栏目', () => {
    const hrefs = new Set(NAV.map((item) => item.href));
    for (const section of Object.values(SECTIONS)) expect(hrefs.has(section.href)).toBe(true);
  });

  it('每个栏目至少定义三个清晰类目，且类目 slug 不重复', () => {
    for (const section of Object.values(SECTIONS)) {
      expect(section.groups.length).toBeGreaterThanOrEqual(3);
      const slugs = section.groups.map((group) => group.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe('Markdown 内容完整性', () => {
  it('包含跨栏目可验收的样例内容', () => {
    expect(files.length).toBeGreaterThanOrEqual(16);
    const represented = new Set(files.map((file) => frontmatter(file).section));
    expect([...Object.keys(SECTIONS)].every((key) => represented.has(key))).toBe(true);
  });

  it('所有正文都有必需字段，且类目属于对应栏目', () => {
    for (const file of files) {
      const meta = frontmatter(file);
      expect(meta.title, file).not.toBe('');
      expect(meta.slug, file).toMatch(/^[a-z0-9-]+$/);
      expect(meta.date, file).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(meta.summary, file).not.toBe('');
      expect(meta.raw.split('\n---\n')[1]?.trim().length, file).toBeGreaterThan(40);

      const section = SECTIONS[meta.section as keyof typeof SECTIONS];
      expect(section, `${file}: unknown section`).toBeTruthy();
      expect(section.groups.some((group) => group.slug === meta.collectionSlug), `${file}: unknown collection`).toBe(true);
    }
  });

  it('完整文章路径唯一', () => {
    const routes = files.map((file) => {
      const meta = frontmatter(file);
      return `${meta.section}/${meta.collectionSlug}/${meta.slug}`;
    });
    expect(new Set(routes).size).toBe(routes.length);
  });
});
