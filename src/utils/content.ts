import type { CollectionEntry } from 'astro:content';
import { SECTIONS, type SectionKey } from '../data/site';

export type LibraryEntry = CollectionEntry<'library'>;

export const isPublished = (entry: LibraryEntry) => !entry.data.draft;

export const byNewest = (a: LibraryEntry, b: LibraryEntry) =>
  b.data.date.getTime() - a.data.date.getTime() || a.data.order - b.data.order;

export const byOrder = (a: LibraryEntry, b: LibraryEntry) =>
  a.data.order - b.data.order || b.data.date.getTime() - a.data.date.getTime();

export const entryHref = (entry: LibraryEntry) =>
  `/${entry.data.section}/${entry.data.collection.slug}/${entry.data.slug}/`;

export const sectionInfo = (key: string) => SECTIONS[key as SectionKey];

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);

export const unique = <T>(items: T[]) => [...new Set(items)];
