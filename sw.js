importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);
    workbox.setConfig({ debug: true });
    // Cache static files
    workbox.precaching.precacheAndRoute([
        'index.html',
        'restaurant.html'
    ]);

    // Cache google font
    workbox.routing.registerRoute(
        new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
        workbox.strategies.cacheFirst({
            cacheName: 'google-font-cache',
            plugins: [
                new workbox.expiration.Plugin({
                    maxEntries: 30,
                }),
            ],
        }),
    );

    // Cache js, css files
    workbox.routing.registerRoute(
        /\.(?:js|css)$/,
        workbox.strategies.staleWhileRevalidate({
            cacheName: 'static-resources-cache',
        }),
    );

    // Cache image files
    workbox.routing.registerRoute(
        /.*\.(?:png|jpg|jpeg|svg|gif)/,
        // Use the cache if it's available
        workbox.strategies.cacheFirst({
            // Use a custom cache name
            cacheName: 'image-cache',
            plugins: [
                new workbox.expiration.Plugin({
                    // Cache only 20 images
                    maxEntries: 20,
                    // Cache for a maximum of a week
                    maxAgeSeconds: 7 * 24 * 60 * 60,
                })
            ],
        })
    );

    // Cache google map
    workbox.routing.registerRoute(
        /.*(?:googleapis)\.com.*$/,
        workbox.strategies.staleWhileRevalidate({
            cacheName: 'googleapis-cache',
        }),
    );

    // Cache restaurant pages
    workbox.routing.registerRoute(
        new RegExp('restaurant.html(.*)'),
        workbox.strategies.networkFirst({
            cacheName: 'restaurant-pages-cache'
        })
    );
} else {
    console.log(`Boo! Workbox didn't load 😬`);
}