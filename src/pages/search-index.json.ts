import { getCollection } from 'astro:content';
import { SECTIONS } from '../data/site';
import { byNewest, entryHref, isPublished } from '../utils/content';

export async function GET() {
  const entries = (await getCollection('library')).filter(isPublished).sort(byNewest);
  const data = entries.map((entry) => {
    const body = 'body' in entry ? String(entry.body ?? '') : '';
    const sectionTitle = SECTIONS[entry.data.section].title;
    return {
      title: entry.data.title,
      summary: entry.data.summary,
      sectionTitle,
      href: entryHref(entry),
      timestamp: entry.data.date.getTime(),
      searchText: [entry.data.title, entry.data.summary, sectionTitle, entry.data.collection.title, entry.data.unit?.title, ...entry.data.scripture, ...entry.data.confession, ...entry.data.tags, body].filter(Boolean).join(' ').toLocaleLowerCase('zh-CN'),
    };
  });
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
