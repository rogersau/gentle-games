const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const pwaAssetsDir = path.join(projectRoot, 'assets', 'pwa');
const iconsOutDir = path.join(distDir, 'icons');
const indexPath = path.join(distDir, 'index.html');
const manifestPath = path.join(distDir, 'manifest.webmanifest');
const swPath = path.join(distDir, 'sw.js');
const buildVersion = process.env.GITHUB_SHA || Date.now().toString();

const requiredPwaFiles = [
  'icon-32x32.png',
  'icon-180x180.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'icon-192x192-maskable.png',
  'icon-512x512-maskable.png',
];

const manifestIcons = [
  { src: './icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: './icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
  { src: './icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
  {
    src: './icons/icon-192x192-maskable.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable',
  },
  {
    src: './icons/icon-512x512-maskable.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
];

const ensureExists = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
};

const getCacheName = () => `gentle-games-${buildVersion}`;
const getManifestTag = () => `./manifest.webmanifest?v=${buildVersion}`;
const getServiceWorkerTag = () => `./sw.js?v=${buildVersion}`;

const writeManifest = () => {
  const manifest = {
    name: 'Gentle Games',
    short_name: 'Gentle Games',
    description: 'Calm, sensory-friendly games for kids.',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#FFFEF7',
    theme_color: '#FFFEF7',
    icons: manifestIcons,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
};

const writeServiceWorker = () => {
  const cacheEntries = [
    './index.html',
    './manifest.webmanifest',
    './icons/icon-32x32.png',
    './icons/icon-180x180.png',
    ...manifestIcons.map((icon) => icon.src),
  ];

  const serviceWorker = `const CACHE_NAME = '${getCacheName()}';
const NAVIGATION_FALLBACK = './index.html';
const APP_SHELL = ${JSON.stringify(cacheEntries, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isNavigationRequest = event.request.mode === 'navigate';
  const isIndexRequest = requestUrl.pathname.endsWith('/index.html');

  if (isNavigationRequest || isIndexRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          return caches
            .open(CACHE_NAME)
            .then((cache) => cache.put('./index.html', copy))
            .then(() => response);
        })
        .catch(() => caches.match(NAVIGATION_FALLBACK))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request));
    })
  );
});
`;

  fs.writeFileSync(swPath, serviceWorker);
};

const patchIndexHtml = () => {
  let html = fs.readFileSync(indexPath, 'utf8');

  if (html.includes('manifest.webmanifest')) {
    html = html.replace(
      /href="[^"]*manifest\.webmanifest[^"]*"/,
      `href="${getManifestTag()}"`
    );
  } else {
    html = html.replace(
      '</head>',
      `  <link rel="manifest" href="${getManifestTag()}" />\n  <link rel="apple-touch-icon" href="./icons/icon-180x180.png" />\n  <link rel="icon" type="image/png" sizes="32x32" href="./icons/icon-32x32.png" />\n</head>`
    );
  }

  if (html.includes('serviceWorker.register(')) {
    html = html.replace(
      /serviceWorker\.register\([^)]*\)/,
      `serviceWorker.register('${getServiceWorkerTag()}')`
    );
  } else {
    html = html.replace(
      '</body>',
      `  <script>\n    if ('serviceWorker' in navigator) {\n      window.addEventListener('load', function () {\n        navigator.serviceWorker.register('${getServiceWorkerTag()}');\n      });\n    }\n  </script>\n</body>`
    );
  }

  fs.writeFileSync(indexPath, html);
};

const run = () => {
  ensureExists(distDir, 'dist directory');
  ensureExists(indexPath, 'dist index.html');
  ensureExists(pwaAssetsDir, 'PWA assets directory');

  fs.mkdirSync(iconsOutDir, { recursive: true });

  for (const requiredFile of requiredPwaFiles) {
    ensureExists(path.join(pwaAssetsDir, requiredFile), 'PWA asset');
  }

  const pwaFiles = fs
    .readdirSync(pwaAssetsDir)
    .filter((fileName) => fileName.toLowerCase().endsWith('.png'));

  for (const fileName of pwaFiles) {
    const source = path.join(pwaAssetsDir, fileName);
    const destination = path.join(iconsOutDir, fileName);
    fs.copyFileSync(source, destination);
  }

  writeManifest();
  writeServiceWorker();
  patchIndexHtml();

  console.log('PWA assets prepared in dist/');
};

if (require.main === module) {
  run();
}

module.exports = {
  getCacheName,
  getManifestTag,
  getServiceWorkerTag,
  writeServiceWorker,
  patchIndexHtml,
};
