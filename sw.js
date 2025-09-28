const CACHE_NAME = 'p2trance-cache-v2';
const DATA_CACHE_NAME = 'p2trance-data-cache-v1';

// キャッシュするファイル一覧
const urlsToCache = [
    './',
    './index.html',
    './firebase-config.js',
    './manifest.json',
    // Firebase SDKは動的にロードされるのでキャッシュしない
    'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.4.7/peerjs.min.js',
    // フォールバック用のオフラインページ（オプション）
    './offline.html'
];

// インストールイベント
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache.map(url => {
                    return new Request(url, { cache: 'reload' });
                }));
            })
            .catch(err => {
                console.error('[Service Worker] Failed to cache:', err);
            })
    );
    self.skipWaiting();
});

// アクティベートイベント
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating & cleaning up old caches');
    const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
    
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
    
    // すぐに制御を開始
    return self.clients.claim();
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Firebase関連のリクエストは特別処理
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(request).then((response) => {
                    // 認証関連以外はキャッシュ
                    if (response.status === 200 && !url.pathname.includes('auth')) {
                        cache.put(request.url, response.clone());
                    }
                    return response;
                }).catch(() => {
                    // オフライン時はキャッシュから返す
                    return cache.match(request);
                });
            })
        );
        return;
    }
    
    // WebSocket接続やPOSTリクエストはキャッシュしない
    if (request.method !== 'GET' || url.protocol === 'ws:' || url.protocol === 'wss:') {
        event.respondWith(fetch(request));
        return;
    }
    
    // 通常のリソース
    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                return response;
            }
            
            return fetch(request).then((response) => {
                // 無効なレスポンスはキャッシュしない
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                
                // レスポンスを複製してキャッシュ
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });
                
                return response;
            }).catch(() => {
                // オフライン時のフォールバック
                if (request.destination === 'document') {
                    return caches.match('./offline.html');
                }
            });
        })
    );
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[Service Worker] Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // 必要に応じてバックグラウンド処理を実装
    console.log('[Service Worker] Performing background sync');
}

// プッシュ通知（オプション）
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: './icons/icon-192.png',
            badge: './icons/icon-72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});

// エラーハンドリング
self.addEventListener('error', (event) => {
    console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] Unhandled rejection:', event.reason);
});
