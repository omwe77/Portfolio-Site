export function getPublicOrigin() {
  const configured = process.env.PUBLIC_ORIGIN?.trim();
  if (!configured) {
    throw new Error('PUBLIC_ORIGIN is required; set it to the confirmed site origin.');
  }

  let parsed;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error('PUBLIC_ORIGIN must be a valid absolute URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)
    || parsed.username
    || parsed.password
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash) {
    throw new Error('PUBLIC_ORIGIN must contain only an http(s) scheme and host, without a path, credentials, query, or fragment.');
  }

  return parsed.origin;
}

export function isPreviewBuild() {
  const runningInBuild = process.env.CI === '1' || process.env.VERCEL === '1';
  if (runningInBuild && !process.env.VERCEL_ENV) {
    throw new Error('VERCEL_ENV is required in CI/Vercel builds so preview output can be marked noindex.');
  }
  return process.env.VERCEL_ENV === 'preview';
}

export function renderOrigin(content, origin) {
  return content.replaceAll('{{PUBLIC_ORIGIN}}', origin);
}

export function applyPreviewNoindex(content, isPreview) {
  if (!isPreview) return content;
  return content.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
}
