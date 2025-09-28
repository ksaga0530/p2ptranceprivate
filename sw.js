const CACHE_NAME = 'p2trance-cache-v1';

// キャッシュするファイル一覧 (index.html からインポートされているもの)
const urlsToCache = [
    '/', // PWAのルート (index.html)
    '/index.html',
    '/firebase-config.js', // 設定ファイル
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js',
    'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.4.7/peerjs.min.js',
    // PWA関連ファイル
    '/manifest.json',
    // (必要に応じてアイコンファイルも追加: 例: '/icons/icon-192.png')
];

// インストールイベント: キャッシュを開き、すべての静的アセットを追加
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
    self.skipWaiting(); // 新しい Service Worker をすぐに有効化
});

// フェッチイベント: キャッシュから提供できるものは提供し、それ以外はネットワークにフォールバック
self.addEventListener('fetch', (event) => {
    // Firebase Realtime Database の接続（WebSocketなど）はキャッシュしない
    if (event.request.url.includes('firebaseio.com') || event.request.method !== 'GET') {
        return fetch(event.request);
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュに見つかったらそれを返す
                if (response) {
                    return response;
                }
                // キャッシュになければ、ネットワークから取得し、キャッシュに追加する
                return fetch(event.request).then(
                    (response) => {
                        // 無効なレスポンスはキャッシュしない (例: 404, Opaque responses)
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // レスポンスを複製してキャッシュに入れる
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});

// アクティベートイベント: 古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating & cleaning up old caches');
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
    return self.clients.claim(); // Service Worker の制御をすぐに開始
});
