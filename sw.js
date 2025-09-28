const CACHE_NAME = 'p2trance-cache-v1.1';

// キャッシュするファイル一覧
const urlsToCache = [
    '/',
    '/index.html',
    '/firebase-config.js',
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js',
    'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.4.7/peerjs.min.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable.png'
];

// インストールイベント
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('[Service Worker] Failed to cache:', err);
            })
    );
    self.skipWaiting();
});

// フェッチイベント - PWAの必須要件
self.addEventListener('fetch', (event) => {
    // Firebase関連のリクエストはキャッシュしない
    if (event.request.url.includes('firebaseio.com') || 
        event.request.url.includes('googleapis.com') ||
        event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュにあればそれを返す
                if (response) {
                    return response;
                }
                
                // ネットワークから取得
                return fetch(event.request).then(
                    (response) => {
                        // 有効なレスポンスでない場合はキャッシュしない
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // レスポンスを複製してキャッシュに保存
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                ).catch(() => {
                    // オフライン時の場合、基本的なHTMLを返す
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// アクティベートイベント
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    return self.clients.claim();
});

// PWAインストール促進のための追加イベント
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
