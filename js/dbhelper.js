/*jshint esversion: 6 */
/**
 * Common database helper functions.
 */

let dbPromise;
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
        case 1:
          const restaurantStore = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
          restaurantStore.createIndex('photographs', 'photograph');
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
      // let xhr = new XMLHttpRequest();
      // xhr.open('GET', DBHelper.DATABASE_URL);
      // xhr.onload = () => {
      //   if (xhr.status === 200) { // Got a success response from server!
      //     const json = JSON.parse(xhr.responseText);
      //     const restaurants = json;
      //     this.saveDataLocally(restaurants);
      //     callback(null, restaurants);
      //   } else { // Oops!. Got an error from server.
      //     const error = (`Request failed. Returned status of ${xhr.status}`);
      //     const restaurants = this.getDataLocally();
      //     console.log(restaurants);
      //     callback(null, restaurants);
      //   }
      // };
      // xhr.send();
    } catch (error) {
      console.log(error);
      this.getDataLocally().then(data => {
        const restaurants = data;
        console.log(restaurants);
        callback(null, restaurants);
      });
    }

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
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    if (!dbPromise) {
      dbPromise = DBHelper.openDatabase();
    }
    const url = `${DBHelper.DATABASE_URL}/${id}`;

    fetch(url).then(response => {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          throw new TypeError("Oops, we haven't got JSON!");
        }
      })
      .then(json => {
        console.log("Get data from server");
        const restaurant = json;
        callback(null, restaurant);
      })
      .catch(error => {
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