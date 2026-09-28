import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const library = defineCollection({
  loader: glob({ base: './src/content/library', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    section: z.enum(['confession', 'sermons', 'devotions', 'theology', 'counseling', 'reading', 'notes', 'life']),
    collection: z.object({ title: z.string(), slug: z.string().regex(/^[a-z0-9-]+$/) }),
    unit: z.object({ title: z.string(), slug: z.string().regex(/^[a-z0-9-]+$/) }).optional(),
    date: z.coerce.date(),
    summary: z.string().min(1),
    scripture: z.array(z.string()).default([]),
    confession: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    order: z.number().int().nonnegative().default(0),
  }),
});

export const collections = { library };
