/*De functie zoekt een HTML-element met de id "random-photos-grid" en stopt meteen als dat element niet bestaat.*/
async function loadRandomPhotos() {
	const randomPhotosGrid = document.getElementById("random-photos-grid");
	if (!randomPhotosGrid) {
		return;
	}

	/*Deze code probeert een JSON-bestand op te halen via fetch, en geeft een foutmelding als het laden mislukt.*/
	try {
		const response = await fetch("../JSON/datafotos.json");
		if (!response.ok) {
			throw new Error("Kon datafotos.json niet laden");
		}

		/*Deze code zet de opgehaalde data om naar JSON en controleert of het een niet-lege array is, 
    anders toont ze een melding dat er geen foto’s beschikbaar zijn en stopt de functie.*/
		const photos = await response.json();
		if (!Array.isArray(photos) || photos.length === 0) {
			randomPhotosGrid.innerHTML =
				'<p class="no-photos">Er zijn geen foto\'s beschikbaar.</p>';
			return;
		}

		/*Deze code maakt een kopie van de foto’s en zet ze in een willekeurige volgorde (shuffle).*/
		const shuffled = photos.slice().sort(() => Math.random() - 0.5);

		/*Deze code neemt de eerste 6 willekeurige foto’s 
    en zet ze als HTML-kaarten in de pagina met een afbeelding en link naar de fotodetailpagina.*/
		const selected = shuffled.slice(0, 6);
		randomPhotosGrid.innerHTML = selected
			.map((photo) => {
				return `
          <article class="random-photo-card">
            <a href="../html/foto-detail.html" class="random-photo-link">
              <img src="${photo.path}" alt="${photo.alt}" />
            </a>
          </article>
        `;
			})

			/*Als er een fout optreedt bij het laden van de foto’s, toont deze code een foutmelding op de pagina met de reden van de fout.*/
			.join("");
	} catch (error) {
		randomPhotosGrid.innerHTML = `<p class="no-photos">Fout bij laden van foto\'s: ${error.message}</p>`;
	}
}

/*Deze functie zorgt ervoor dat wanneer je op de knop klikt, de functie loadRandomPhotos wordt uitgevoerd om willekeurige foto’s te laden.*/
function initRandomPhotos() {
	const randomPhotosButton = document.getElementById("load-random-photos");
	if (randomPhotosButton) {
		randomPhotosButton.addEventListener("click", loadRandomPhotos);
	}
}

/*Deze code zorgt ervoor dat initRandomPhotos automatisch wordt uitgevoerd zodra de HTML-pagina volledig geladen is.*/
document.addEventListener("DOMContentLoaded", initRandomPhotos);

/*Laad foto's per gemeente & jaar*/
document.addEventListener("DOMContentLoaded", () => {
	const pathname = window.location.pathname.toLowerCase();
	const breadcrumbCurrent = document.querySelector(
		'.breadcrumb [aria-current="page"]',
	);
	const currentPageName = breadcrumbCurrent
		? breadcrumbCurrent.textContent.trim().toLowerCase()
		: "";
	const isSintGillisPage =
		pathname.includes("sint_gillis.html") ||
		pathname.includes("sint-gillis.html") ||
		currentPageName === "sint-gillis" ||
		currentPageName === "sint gillis";

	if (isSintGillisPage) {
		initGemeenteGallery("Sint-Gillis");
	}
});

/*Deze functie probeert foto’s op te halen uit een JSON-bestand en zet ze klaar voor een galerij, 
maar toont een foutmelding en stopt als het laden mislukt of als de galerij niet bestaat.*/
async function initGemeenteGallery(gemeenteName) {
	const gallery = document.querySelector(".anderlecht-gallery");
	const yearItems = Array.from(document.querySelectorAll(".year-item"));
	if (!gallery) return;

	let allPhotos = [];
	try {
		const res = await fetch("../JSON/datafotos.json");
		if (!res.ok) throw new Error("Kon datafotos.json niet laden");
		const photos = await res.json();
		allPhotos = Array.isArray(photos) ? photos : [];
	} catch (err) {
		gallery.innerHTML = `<p class="no-photos">Fout bij laden: ${err.message}</p>`;
		return;
	}

	/*Filter enkel fotos van de gemeente*/
	const gemeentePhotos = allPhotos.filter(
		(p) => (p.location || "").toLowerCase() === gemeenteName.toLowerCase(),
	);

	//9 fotos per pagina
	const pageSize = 9;
	let currentPage = 0;
	let currentFiltered = gemeentePhotos.slice();

	/*Deze code zoekt een bestaande controlebalk voor de galerij 
  en maakt er één aan met vorige/volgende knoppen en paginainfo als die nog niet bestaat.*/
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

		/*Deze code plaatst de galerij-navigatie (knoppen en info) in de pagina, 
    ofwel direct na de galerijsectie of anders direct na de galerij zelf als die sectie niet bestaat.*/
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

	/*Deze code haalt de vorige-knop, volgende-knop en de paginainfo-elementen 
  op uit de galerijbedieningen zodat ze later gebruikt kunnen worden.*/
	const btnPrev = controlsContainer.querySelector(".gallery-prev");
	const btnNext = controlsContainer.querySelector(".gallery-next");
	const pageInfo = controlsContainer.querySelector(".gallery-pageinfo");

	/*Deze functie zorgt ervoor dat de galerij wordt weergegeven met de opgegeven foto's, 
  en toont een foutmelding als er geen foto's beschikbaar zijn.*/
	function render(list) {
		if (!list || list.length === 0) {
			gallery.innerHTML =
				'<p class="no-photos">Er zijn geen foto\'s voor deze selectie.</p>';
			pageInfo.textContent = "";
			controlsContainer.style.display = "none";
			return;
		}

		/*Deze code berekent hoeveel pagina’s er zijn, zorgt dat de huidige pagina binnen de grenzen blijft 
    en selecteert vervolgens de juiste subset van items voor die pagina.*/
		const total = list.length;
		const totalPages = Math.ceil(total / pageSize);
		if (currentPage < 0) currentPage = 0;
		if (currentPage > totalPages - 1) currentPage = totalPages - 1;
		const start = currentPage * pageSize;
		const pageSlice = list.slice(start, start + pageSize);

		/*Deze code toont de huidige pagina met foto’s in de galerij, en past de navigatie 
    (knoppen en paginanummering) aan of verbergt die als er maar één pagina is.*/
		gallery.innerHTML = pageSlice
			.map(
				(photo) => `
      <a href="../html/foto-detail.html" target="_blank" rel="noopener">
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

	/*Deze code zorgt voor het parseren van een jaartalbereik uit een tekst, 
  en retourneert een object met start- en eindjaar of null als het niet kan worden geïnterpreteerd.*/
	function parseRange(text) {
		const t = (text || "").trim();
		if (/alle jaren/i.test(t)) return null;

		const parts = t.split("-").map((s) => s.trim());
		if (parts.length === 2) {
			const a = parts[0].replace(/[^0-9]/g, "");
			const b = parts[1].replace(/[^0-9]/g, "");
			const start = a ? parseInt(a, 10) : null;
			const end = b ? parseInt(b, 10) : null;
			return { start, end };
		}
		// enkel jaartal
		const year = parseInt(t.replace(/[^0-9]/g, ""), 10);
		if (!isNaN(year)) return { start: year, end: year };
		return null;
	}

	/*Deze functie controleert of het jaar van een foto binnen een opgegeven tijdsperiode valt en 
  geeft true of false terug afhankelijk van die match.*/
	function inRange(photo, range) {
		if (!range) return true;
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

	/*Deze code koppelt klikhandlers aan de filteritems zodat ze kunnen worden gebruikt
   om de foto's te filteren op basis van het geselecteerde jaartalbereik.*/
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
