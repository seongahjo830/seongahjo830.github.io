const CACHE = 'dogsaju-202608070133';
const CORE = ['./', './index.html', './intro.html', './manifest.json',
  './assets/app_v10.css?v=202608070133', './assets/engine.js?v=202608070133', './assets/data_v10.js?v=202608070133',
  './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' — 브라우저 HTTP 캐시를 건너뛰고 서버에서 새로 받는다.
  // 이게 없으면 새 서비스워커가 옛 파일을 그대로 캐시에 담아버린다.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(u => fetch(u, { cache: 'reload' })
        .then(r => r.ok ? c.put(u, r) : null).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// ⚠️ 예전엔 전부 캐시 우선이라, 새로 배포해도 재실행 시 옛 index.html 이 그대로 떴다.
//    화면(HTML)은 네트워크 우선으로 바꿔 항상 최신을 받고, 오프라인일 때만 캐시로 떨어진다.
//    에셋은 URL에 빌드 스탬프가 붙으므로 캐시 우선이어도 안전하다.
function isHtml(req){
  return req.mode === 'navigate' ||
         (req.headers.get('accept') || '').includes('text/html');
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // 외부 요청은 건드리지 않는다

  if (isHtml(e.request)) {
    // 화면: 네트워크 먼저 → 실패하면 캐시 → 그것도 없으면 index
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // 그 외(에셋·아이콘): 캐시 먼저 → 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
