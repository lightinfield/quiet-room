import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd(), 'src', 'content', 'library');
const files = readdirSync(root).filter((name) => name.endsWith('.md'));

describe('内容库基础约束', () => {
  it('覆盖所有七个栏目并提供足够的验收样例', () => {
    expect(files.length).toBeGreaterThanOrEqual(12);
    const text = files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
    for (const section of ['confession', 'sermons', 'devotions', 'theology', 'reading', 'notes', 'life']) {
      expect(text).toContain(`section: ${section}`);
    }
  });

  it('每篇样例都含核心 frontmatter 字段与正文标题', () => {
    for (const file of files) {
      const text = readFileSync(join(root, file), 'utf8');
      expect(text.startsWith('---\n')).toBe(true);
      expect(text).toMatch(/\ntitle:\s+.+/);
      expect(text).toMatch(/\nslug:\s+[a-z0-9-]+/);
      expect(text).toMatch(/\nsection:\s+\w+/);
      expect(text).toMatch(/\ndate:\s+\d{4}-\d{2}-\d{2}/);
      expect(text).toMatch(/\nsummary:\s+.+/);
      expect(text).toMatch(/\n##\s+.+/);
    }
  });
});
