import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'quiet-room';
const isPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://lightinfield.github.io',
  base: isPages ? `/${repository}` : '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
