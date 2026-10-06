/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY - Unauthorized use prohibited. DMCA protected.
 */
// Service Worker for Putting Improver PWA - Aggressive Update Strategy
const CACHE_VERSION = 'putting-improver-v10.5.56'; // INCREMENT THIS FOR EVERY DEPLOYMENT
const CACHE_NAME = `putting-improver-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-v${CACHE_VERSION}`;

// Core files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/css/enhancements.css',
  '/js/app.js',
  '/background.webp',
  '/logo.jpg',
  '/favicon.ico',
  '/favicon-16.png',
  '/favicon-32.png',
  '/manifest.json'
];

// Install event - cache core assets and force immediate activation
self.addEventListener('install', (event) => {
  console.log(`[ServiceWorker] Installing version ${CACHE_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting - activating immediately');
        return self.skipWaiting(); // Force immediate activation
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log(`[ServiceWorker] Activating version ${CACHE_VERSION}...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch event - Network First strategy for HTML, Cache First for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (Firebase, CDNs, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Network First for HTML files (always get fresh version)
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Network First for JavaScript and CSS (always get fresh version)
  if (request.destination === 'script' || request.destination === 'style' ||
      url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First for images and other static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache GET requests only
            if (request.method === 'GET') {
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        // Notify client that cache is cleared
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Putting Improver', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background Sync - Retry failed requests
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-practice-sessions') {
    event.waitUntil(syncPracticeSessions());
  } else if (event.tag === 'sync-achievements') {
    event.waitUntil(syncAchievements());
  } else if (event.tag === 'sync-leaderboard') {
    event.waitUntil(syncLeaderboard());
  }
});

async function syncPracticeSessions() {
  try {
    console.log('[ServiceWorker] Syncing practice sessions...');

    // Get pending sessions from IndexedDB
    const db = await openDB();
    const pendingSessions = await db.getAll('pendingSessions');

    if (pendingSessions.length === 0) {
      console.log('[ServiceWorker] No pending sessions to sync');
      return;
    }

    // Sync each pending session
    for (const session of pendingSessions) {
      try {
        // Send to Firebase
        const response = await fetch('/api/sync-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session)
        });

        if (response.ok) {
          // Remove from pending queue
          await db.delete('pendingSessions', session.id);
          console.log('[ServiceWorker] Session synced:', session.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync session:', error);
        // Will retry on next sync
      }
    }

    // Notify user of successful sync
    await self.registration.showNotification('Practice Sessions Synced', {
      body: `${pendingSessions.length} session(s) synced successfully!`,
      icon: '/icons/icon-192x192.png',
      tag: 'sync-complete'
    });

  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
    throw error; // Retry later
  }
}

async function syncAchievements() {
  console.log('[ServiceWorker] Syncing achievements...');
  // Similar implementation for achievements
}

async function syncLeaderboard() {
  console.log('[ServiceWorker] Syncing leaderboard data...');
  // Similar implementation for leaderboard
}

// Periodic Background Sync - Update data regularly
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic sync:', event.tag);

  if (event.tag === 'update-stats') {
    event.waitUntil(updateStats());
  } else if (event.tag === 'update-leaderboard') {
    event.waitUntil(updateLeaderboard());
  } else if (event.tag === 'fetch-challenges') {
    event.waitUntil(fetchDailyChallenges());
  }
});

async function updateStats() {
  try {
    console.log('[ServiceWorker] Updating stats in background...');

    // Fetch latest stats from server
    const response = await fetch('/api/stats');
    const stats = await response.json();

    // Cache the updated stats
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put('/api/stats', new Response(JSON.stringify(stats)));

    console.log('[ServiceWorker] Stats updated successfully');
  } catch (error) {
    console.error('[ServiceWorker] Failed to update stats:', error);
  }
}

async function updateLeaderboard() {
  try {
    console.log('[ServiceWorker] Updating leaderboard in background...');

    const response = await fetch('/api/leaderboard');
    const leaderboard = await response.json();

    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put('/api/leaderboard', new Response(JSON.stringify(leaderboard)));

    console.log('[ServiceWorker] Leaderboard updated successfully');
  } catch (error) {
    console.error('[ServiceWorker] Failed to update leaderboard:', error);
  }
}

async function fetchDailyChallenges() {
  try {
    console.log('[ServiceWorker] Fetching daily challenges...');

    const response = await fetch('/api/challenges/daily');
    const challenges = await response.json();

    // Show notification if new challenge available
    if (challenges.new) {
      await self.registration.showNotification('New Daily Challenge!', {
        body: challenges.description,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'daily-challenge',
        actions: [
          { action: 'start', title: 'Start Challenge' },
          { action: 'later', title: 'Remind Me Later' }
        ]
      });
    }

    console.log('[ServiceWorker] Daily challenges fetched');
  } catch (error) {
    console.error('[ServiceWorker] Failed to fetch challenges:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PuttingImproverDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pendingSessions')) {
        db.createObjectStore('pendingSessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingAchievements')) {
        db.createObjectStore('pendingAchievements', { keyPath: 'id' });
      }
    };
  });
}
