import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { caseStudies, renderCaseStudy } from '../case-studies.js';
import { applyPreviewNoindex, getPublicOrigin, isPreviewBuild, renderOrigin } from '../site-config.js';

const output = path.resolve('dist');
const publicRoot = path.resolve('public');
const templateRoot = path.resolve('templates');
const publicOrigin = getPublicOrigin();
const previewBuild = isPreviewBuild();
await rm(output, { recursive: true, force: true });
await cp(publicRoot, output, { recursive: true });

const homePath = path.join(output, 'index.html');
const home = applyPreviewNoindex(renderOrigin(await readFile(homePath, 'utf8'), publicOrigin), previewBuild);
await writeFile(homePath, home);

const sitemapPath = path.join(output, 'sitemap.xml');
await writeFile(sitemapPath, renderOrigin(await readFile(sitemapPath, 'utf8'), publicOrigin));

const robotsPath = path.join(output, 'robots.txt');
const robots = previewBuild
  ? 'User-agent: *\nAllow: /\n'
  : renderOrigin(await readFile(robotsPath, 'utf8'), publicOrigin);
await writeFile(robotsPath, robots);

const template = await readFile(path.join(templateRoot, 'case-study.html'), 'utf8');
for (const slug of Object.keys(caseStudies)) {
  const folder = path.join(output, 'projects', slug);
  await mkdir(folder, { recursive: true });
  const page = applyPreviewNoindex(renderCaseStudy(template, slug, publicOrigin), previewBuild);
  await writeFile(path.join(folder, 'index.html'), page);
}

await writeFile(path.join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found | Om Dangol</title><body><main><h1>Page not found</h1><a href="/">Return to the portfolio</a></main></body></html>');
console.log(`Built static portfolio with ${Object.keys(caseStudies).length} case-study routes in ${output}`);
