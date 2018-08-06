/*jshint esversion: 6 */
/**
 * Common database helper functions.
 */

let dbPromise;
const port = 1337;
const serverLink = `http://localhost:${port}`;
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static openDatabase() {
    return idb.open('restaurants', 1, (upgradeDb) => {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
      }
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    dbPromise = DBHelper.openDatabase();

    try {
      fetch(DBHelper.DATABASE_URL).then(response => {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            throw new TypeError("Oops, we haven't got JSON!");
          }
        })
        .then(json => {
          console.log("Get data from server");
          const restaurants = json;
          this.saveDataLocally(restaurants);
          callback(null, restaurants);
        })
        .catch(error => {
          console.log("Get local data");
          this.getDataLocally().then(data => {
            const restaurants = data;
            console.log(restaurants);
            callback(null, restaurants);
          });
        });
    } catch (error) {
      console.log(error);
      this.getDataLocally().then(data => {
        const restaurants = data;
        console.log(restaurants);
        callback(null, restaurants);
      });
    }

  }

  static updateFavoriteRestaurant(restaurant) {
    if (!('indexedDB' in window)) {
      return null;
    }
    const url = `http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;
    return fetch(url, { method: 'PUT'} )
            .then(() => {
              dbPromise.then(idb => {
                const tx = idb.transaction('restaurants', 'readwrite');
                const restaurantsStore = tx.objectStore('restaurants');
                restaurantsStore.get(restaurant.id).then(r => {
                  r.is_favorite = restaurant.is_favorite;
                  restaurantsStore.put(r);
                });
             });
            });
  }

  // Save data locally
  static saveDataLocally(restaurants) {
    if (!('indexedDB' in window)) {
      return null;
    }
    return dbPromise.then(idb => {
      const tx = idb.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      return Promise.all(restaurants.map(restaurant => store.put(restaurant)))
        .catch(() => {
          tx.abort();
          throw Error('Restaurants were not added to the store');
        });
    });
  }

  // Get data locally
  static getDataLocally() {
    if (!('indexedDB' in window)) {
      return null;
    }
    return dbPromise.then(idb => {
      const tx = idb.transaction('restaurants', 'readonly');
      const store = tx.objectStore('restaurants');
      return store.getAll();
    });
  }

  // Get data locally
  static getReviewsDataLocally() {
    if (!('indexedDB' in window)) {
      return null;
    }
    return dbPromise.then(idb => {
      const tx = idb.transaction('restaurants', 'readonly');
      const store = tx.objectStore('reviews');
      return store.getAll();
    });
  }

  static handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    if (!dbPromise) {
      dbPromise = DBHelper.openDatabase();
    }
    const url = `${DBHelper.DATABASE_URL}/${id}`;

    fetch(url)
      .then(DBHelper.handleErrors)
      .then(response => {
        console.log("Get data from server");
        const restaurant = response.json();
        callback(null, restaurant);
      })
      .catch(error => {
        console.log(error);
        console.log("Get local data");
        this.getDataLocally().then(data => {
          const restaurants = data;
          const restaurant = restaurants.find(r => r.id == id);
          if (restaurant) {
            console.log(restaurant);
            callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        });
      });
  }

  /**
   * Fetch a restaurant reviews by its ID.
   */
  static getReviewsById(id, callback) {
    // fetch all restaurants with proper error handling.
    if (!dbPromise) {
      dbPromise = DBHelper.openDatabase();
    }
    const url = `${serverLink}/reviews/?restaurant_id=${id}`;

    fetch(url)
      .then(DBHelper.handleErrors)
      .then(response => {
        console.log("Get data from server");
        console.log(response);
        const reviews = response.json();
        callback(null, reviews);
      })
      .catch(error => {
        console.log(error);
        console.log("Get local data");
        this.getReviewsDataLocally().then(data => {
          const reviews = data;
          const restaurant = restaurants.find(r => r.id == id);
          if (restaurant) {
            console.log(restaurant);
            callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        });
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/dest/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  // Add indexedDB
  static createIndexedDB() {
    if (!('indexedDB' in window)) {
      return null;
    }
    return idb.open('restaurants', 1, (upgradeDb) => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        const restaurants = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      }
    });
  }
}