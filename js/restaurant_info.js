/*jshint esversion: 6 */
let restaurant;
let offlineReviews = [];
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});
/**
 * Initialize Google map, called from HTML.
 */
initMapForRestaurant = () => {
  if (google) {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: self.restaurant.latlng,
      scrollwheel: false
    });
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  console.log(restaurant);
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  const imageAlt = `Restaurant: ${restaurant.name} at ${restaurant.address} with cussine type: ${restaurant.cuisine_type}`;
  image.setAttribute('alt', restaurant.name);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
  fillRestaurantMap(restaurant);
};

fillRestaurantMap = (restaurant) => {
  const url = `/img/maps/restaurant${restaurant.id}.webp`;
  const restaurantMap = document.getElementById('restaurant-map');
  restaurantMap.style.cssText = `background-image: url(${url})`;
  restaurantMap.setAttribute('aria-label', `Map of ${restaurant.name}`);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  DBHelper.getReviewsById(self.restaurant.id, (error, reviews) => {
    console.log(error);
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = 'review-name';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const temp = new Date(review.createdAt);
  const day = temp.getDate();
  const month = temp.getMonth() + 1;
  const year = temp.getFullYear();
  date.innerHTML = `${day}/${month}/${year}`;
  date.className = 'review-date';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-comments';
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const form = document.forms.namedItem("review-form");
form.addEventListener('submit', (ev) => {
  const formData = new FormData(ev.target);
  const name = formData.get('name');
  const rating = formData.get('rating');
  const comments = formData.get('comments');
  const restaurant_id = self.restaurant.id;
  const review = {
    restaurant_id,
    name,
    rating,
    comments
  };
  if (navigator.onLine) {
    sendReviewOnline(review);
  } else {
    saveReviewOffline(review);
  }
  ev.preventDefault();
}, false);

sendReviewOnline = (review) => {
  DBHelper.sendReview(review, (error, review) => {
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(review));
    document.getElementById('form').reset();
    DBHelper.saveReviewLocally(review);
  });
};

saveReviewOffline = (review) => {
  offlineReviews = JSON.parse(localStorage.getItem('offlineReviews')) ? JSON.parse(localStorage.getItem('offlineReviews')) : [];
  offlineReviews.push(review);
  localStorage.setItem('offlineReviews', JSON.stringify(offlineReviews));
};

window.addEventListener('online', () => {
  offlineReviews = JSON.parse(localStorage.getItem('offlineReviews'));
  if (offlineReviews.length > 0) {
    offlineReviews.forEach(review => {
      sendReviewOnline(review);
    });
  }
  offlineReviews = [];
  localStorage.setItem('offlineReviews', JSON.stringify(offlineReviews));
});