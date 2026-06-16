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

/* Beeldenbank: laad en filter foto's per gemeente + jaarrange */
document.addEventListener("DOMContentLoaded", () => {
  const isSintGillisPage = !!document.querySelector(".inleiding.sint-gillis");
  if (isSintGillisPage) {
    initGemeenteGallery("Sint-Gillis");
  }
});

async function initGemeenteGallery(gemeenteName) {
  const gallery = document.querySelector(".anderlecht-gallery");
  const yearItems = Array.from(document.querySelectorAll(".year-item"));
  if (!gallery) return;

  let allPhotos = [];
  try {
    const res = await fetch("/Website_Bruksel1/JSON/datafotos.json");
    if (!res.ok) throw new Error("Kon datafotos.json niet laden");
    const photos = await res.json();
    allPhotos = Array.isArray(photos) ? photos : [];
  } catch (err) {
    gallery.innerHTML = `<p class="no-photos">Fout bij laden: ${err.message}</p>`;
    return;
  }

  // filter enkel foto's van de gemeente
  const gemeentePhotos = allPhotos.filter(
    (p) => (p.location || "").toLowerCase() === gemeenteName.toLowerCase(),
  );

  // pagination state
  const pageSize = 9;
  let currentPage = 0;
  let currentFiltered = gemeentePhotos.slice();

  // create or reuse controls container
  let controlsContainer = document.querySelector(".gallery-controls");
  if (!controlsContainer) {
    controlsContainer = document.createElement("div");
    controlsContainer.className = "gallery-controls";
    controlsContainer.style.display = "flex";
    controlsContainer.style.gap = "1rem";
    controlsContainer.style.alignItems = "center";
    controlsContainer.style.justifyContent = "center";
    controlsContainer.innerHTML = `
      <button class="gallery-prev" aria-label="Vorige">←</button>
      <span class="gallery-pageinfo"></span>
      <button class="gallery-next" aria-label="Volgende">→</button>
    `;
    // insert controls after the whole gallery section when possible so they span the page
    const gallerySection = gallery.closest(".anderlecht-gallery-section");
    if (gallerySection && gallerySection.parentNode) {
      gallerySection.parentNode.insertBefore(
        controlsContainer,
        gallerySection.nextSibling,
      );
    } else {
      gallery.parentNode.insertBefore(controlsContainer, gallery.nextSibling);
    }
  }

  const btnPrev = controlsContainer.querySelector(".gallery-prev");
  const btnNext = controlsContainer.querySelector(".gallery-next");
  const pageInfo = controlsContainer.querySelector(".gallery-pageinfo");

  function render(list) {
    if (!list || list.length === 0) {
      gallery.innerHTML =
        '<p class="no-photos">Er zijn geen foto\'s voor deze selectie.</p>';
      pageInfo.textContent = "";
      controlsContainer.style.display = "none";
      return;
    }

    const total = list.length;
    const totalPages = Math.ceil(total / pageSize);
    if (currentPage < 0) currentPage = 0;
    if (currentPage > totalPages - 1) currentPage = totalPages - 1;
    const start = currentPage * pageSize;
    const pageSlice = list.slice(start, start + pageSize);

    gallery.innerHTML = pageSlice
      .map(
        (photo) => `
      <a href="/Website_Bruksel1/html/foto-detail.html" target="_blank" rel="noopener">
        <img src="${photo.path}" alt="${photo.alt}" />
      </a>
    `,
      )
      .join("");

    if (totalPages > 1) {
      controlsContainer.style.display = "flex";
      pageInfo.textContent = `${start + 1} - ${Math.min(start + pageSize, total)} van ${total}`;
      btnPrev.disabled = currentPage === 0;
      btnNext.disabled = currentPage >= totalPages - 1;
    } else {
      controlsContainer.style.display = "none";
      pageInfo.textContent = "";
    }
  }

  // parse text like "2011-2020", "2021 - ...", "... - 1960", or "Alle jaren"
  function parseRange(text) {
    const t = (text || "").trim();
    if (/alle jaren/i.test(t)) return null;
    // formats: "YYYY - ..." or "... - YYYY" or "YYYY-YYYY"
    const parts = t.split("-").map((s) => s.trim());
    if (parts.length === 2) {
      const a = parts[0].replace(/[^0-9]/g, "");
      const b = parts[1].replace(/[^0-9]/g, "");
      const start = a ? parseInt(a, 10) : null;
      const end = b ? parseInt(b, 10) : null;
      return { start, end };
    }
    // single year
    const year = parseInt(t.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(year)) return { start: year, end: year };
    return null;
  }

  function inRange(photo, range) {
    if (!range) return true; // Alle jaren
    const year = parseInt(
      (photo.date || "").toString().replace(/[^0-9]/g, ""),
      10,
    );
    if (isNaN(year)) return false;
    if (range.start && range.end)
      return year >= range.start && year <= range.end;
    if (range.start && !range.end) return year >= range.start;
    if (!range.start && range.end) return year <= range.end;
    return true;
  }

  // attach handlers to filter items
  yearItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      yearItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const range = parseRange(item.textContent || item.innerText || "");
      currentFiltered = gemeentePhotos.filter((p) => inRange(p, range));
      currentPage = 0;
      render(currentFiltered);
    });
  });

  // attach prev/next handlers
  btnPrev.addEventListener("click", (e) => {
    e.preventDefault();
    currentPage = Math.max(0, currentPage - 1);
    render(currentFiltered);
  });
  btnNext.addEventListener("click", (e) => {
    e.preventDefault();
    currentPage = currentPage + 1;
    render(currentFiltered);
  });

  // initial render: Alle jaren
  render(currentFiltered);
}
