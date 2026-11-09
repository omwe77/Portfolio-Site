import path from 'node:path';
process.env.PUBLIC_DIR = path.resolve('dist');
await import('../server.mjs');
