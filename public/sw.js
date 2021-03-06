/* eslint-disable no-restricted-globals */
/* global workbox */

// eslint-disable-next-line no-undef
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.2/workbox-sw.js');

workbox.core.setCacheNameDetails({
  prefix: 'cra',
  suffix: 'v1',
});

workbox.routing.registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new workbox.strategies.CacheFirst({
    // Use a custom cache name.
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Cache only 20 images.
        maxEntries: 20,
        // Cache for a maximum of a week.
        maxAgeSeconds: 7 * 24 * 60 * 60,
      })
    ],
  })
)

workbox.routing.registerRoute(
  /.*\.css$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'css-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      })
    ]
  })
)
workbox.routing.registerRoute(
  /(?:static\/.*\.js|\/manifest\.json)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'js-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      })
    ]
  })
)

const OFFLINE_CACHE_NAME = 'offline-html';
const OFFLINE_HTML_URL = '/offline.html';

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_HTML_URL))
  );
});

workbox.navigationPreload.enable();

const networkOnly = new workbox.strategies.NetworkOnly();
const navigationHandler = async (params) => {
  try {
    // Attempt a network request.
    return await networkOnly.handle(params);
  } catch (error) {
    // If it fails, return the cached HTML.
    return caches.match(OFFLINE_HTML_URL, {
      cacheName: OFFLINE_CACHE_NAME,
    });
  }
};

// Register this strategy to handle all navigations.
workbox.routing.registerRoute(
  new workbox.routing.NavigationRoute(navigationHandler)
);

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Push notification';
  const options = {
    body: 'Hey, how are you doing?',
    icon: 'images/logo512.png',
    badge: 'images/logo192.png',
    vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500],
    requireInteraction: true,
    silent: false,
    actions: [
      {
        action: 'action-1',
        title: 'Action 1',
      },
      {
        action: 'action-2',
        title: 'Action 2',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', e => {
  if (!e.action) {
    self.clients.matchAll().then(clientList => {
      console.log(clientList)

      if (clientList.length > 0) {
        return clientList[0].focus();
      }
    })
    return;
  }

  switch (e.action) {
    case 'action-1':
      console.log('Action 1 clicked')
      self.clients.openWindow('https://www.google.com/')
      break;

    default:
      console.log('Unknown action')
      self.clients.openWindow('https://www.espncricinfo.com/')
      break;
  }
})
