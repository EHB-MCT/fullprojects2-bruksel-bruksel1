async function loadRandomPhotos() {
  const randomPhotosGrid = document.getElementById("random-photos-grid");
  if (!randomPhotosGrid) {
    return;
  }

  try {
    const response = await fetch("/Website_Bruksel1/JSON/datafotos.json");
    if (!response.ok) {
      throw new Error("Kon datafotos.json niet laden");
    }

    const photos = await response.json();
    if (!Array.isArray(photos) || photos.length === 0) {
      randomPhotosGrid.innerHTML =
        '<p class="no-photos">Er zijn geen foto\'s beschikbaar.</p>';
      return;
    }

    const shuffled = photos.slice().sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);
    randomPhotosGrid.innerHTML = selected
      .map((photo) => {
        return `
          <article class="random-photo-card">
            <a href="/Website_Bruksel1/html/foto-detail.html" class="random-photo-link">
              <img src="${photo.path}" alt="${photo.alt}" />
            </a>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    randomPhotosGrid.innerHTML = `<p class="no-photos">Fout bij laden van foto\'s: ${error.message}</p>`;
  }
}

function initRandomPhotos() {
  const randomPhotosButton = document.getElementById("load-random-photos");
  if (randomPhotosButton) {
    randomPhotosButton.addEventListener("click", loadRandomPhotos);
  }
}

document.addEventListener("DOMContentLoaded", initRandomPhotos);
