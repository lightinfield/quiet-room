export function GET({ site }: { site?: URL }) {
  const origin = site?.origin ?? 'https://lightinfield.github.io';
  const base = import.meta.env.BASE_URL;
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
