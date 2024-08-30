import * as Carousel from "./Carousel.js";

document.addEventListener("DOMContentLoaded", () => {
  // The breed selection input element.
  const breedSelect = document.getElementById("breedSelect");
  // The information section div element.
  const infoDump = document.getElementById("infoDump");
  // The progress bar div element.
  const progressBar = document.getElementById("progressBar");
  // The get favourites button element.
  const getFavouritesBtn = document.getElementById("getFavouritesBtn");

  if (getFavouritesBtn) {
    getFavouritesBtn.addEventListener("click", getFavourites);
  }

  // Step 0: Store your API key here for reference and easy access.
  const API_KEY = "live_mKIEpaqCSlPbkK3VO3bZSMa3D91BuQZ7AvMQ7NMAi1Wx5RsrZjamUiLiqgvSayKA";
  const BASE_URL = "https://api.thecatapi.com/v1";


  async function fetchData(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        'x-api-key': API_KEY,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async function initialLoad() {
    const breeds = await fetchData(`${BASE_URL}/breeds`);

    breeds.forEach((breed) => {
      const opt = document.createElement("option");
      opt.value = breed.id;
      opt.textContent = breed.name;

      breedSelect.appendChild(opt);
    });

    loadCarousel();
  }

  async function loadCarousel() {
    const val = breedSelect.value;
    const url = `${BASE_URL}/images/search?limit=25&breed_ids=${val}`;

    const data = await fetchData(url, {
      method: 'GET',
      onDownloadProgress: updateProgress,
    });

    buildCarousel(data);
  }

  function buildCarousel(data, favourites) {
    Carousel.clear();
    infoDump.innerHTML = "";

    data.forEach((ele) => {
      const item = Carousel.createCarouselItem(
        ele.url,
        breedSelect.value,
        ele.id
      );
      Carousel.appendCarousel(item);
    });

    if (favourites) {
      infoDump.innerHTML = "Here are your saved favourites!";
    } else if (data[0]) {
      const info = data[0].breeds || null;
      if (info && info[0].description) infoDump.innerHTML = info[0].description;
    } else {
      infoDump.innerHTML =
        "<div class='text-center'>No information on this breed, sorry!</div>";
    }

    Carousel.start();
  }

  async function toggleFavoriteImage(imageId) {
    const favorites = await fetchData(`${BASE_URL}/favourites?image_id=${imageId}`);
    const favorite = favorites[0];

    if (favorite) {
      await fetchData(`${BASE_URL}/favourites/${favorite.id}`, {
        method: 'DELETE',
      });
    } else {
      await fetchData(`${BASE_URL}/favourites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId }),
      });
    }
  }

  async function getFavourites() {
    const favourites = await fetchData(`${BASE_URL}/favourites`);
    const imageUrls = favourites.map(favourite => favourite.image);

    buildCarousel(imageUrls);
  }

 
  function updateProgress(progressEvent) {
    const total = progressEvent.total;
    const current = progressEvent.loaded;
    const percentage = Math.round((current / total) * 100);

    progressBar.style.transition = "width ease 1s";
    progressBar.style.width = percentage + "%";
  }

  breedSelect.addEventListener("change", loadCarousel);

  initialLoad();
});
