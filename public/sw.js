// @ts-nocheck
const CACHE_NAME = 'gestion-notes-v1';
   const urlsToCache = [
       '/',
       'index.html',
       '/html/admin.html',
       '/html/etudiant.html',
       '/css/styles.css',
       '/js/auth.js',
       '/js/config-firebase.js',
       '/js/admin.js',
       '/js/etudiant.js',
       '/icons/icon-192.png',
       '/icons/icon-512.png',
       '/manifest.json'
   ];

   self.addEventListener('install', (event) => {
       event.waitUntil(
           caches.open(CACHE_NAME)
               .then((cache) => {
                   console.log('Cache ouvert');
                   return cache.addAll(urlsToCache);
               })
       );
   });

   self.addEventListener('fetch', (event) => {
       event.respondWith(
           caches.match(event.request)
               .then((response) => {
                   return response || fetch(event.request);
               })
       );
   });

   self.addEventListener('activate', (event) => {
       const cacheWhitelist = [CACHE_NAME];
       event.waitUntil(
           caches.keys().then((cacheNames) => {
               return Promise.all(
                   cacheNames.map((cacheName) => {
                       if (!cacheWhitelist.includes(cacheName)) {
                           return caches.delete(cacheName);
                       }
                   })
               );
           })
       );
   });