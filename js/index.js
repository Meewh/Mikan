document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================================================
     CARRUSEL
  ===================================================================================== */
  let currentSlide = 0;
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const totalSlides = slides.length;

  function mostrarSlide(index) {
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    currentSlide = index;
  }

  function siguienteSlide() { mostrarSlide((currentSlide + 1) % totalSlides); }
  function anteriorSlide() { mostrarSlide((currentSlide - 1 + totalSlides) % totalSlides); }

  if (totalSlides > 0) {
    document.getElementById('next-slide')?.addEventListener('click', siguienteSlide);
    document.getElementById('prev-slide')?.addEventListener('click', anteriorSlide);
    dots.forEach((dot, i) => dot.addEventListener('click', () => mostrarSlide(i)));
    setInterval(siguienteSlide, 5000);
  }

  /* =====================================================================================
     BÚSQUEDA
  ===================================================================================== */
  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.getElementById('search-container');
  const searchInput = document.getElementById('search-input');

  if (searchToggle && searchContainer && searchInput) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = searchContainer.classList.contains('expanded');

      if (!expanded) {
        searchContainer.classList.add('expanded');
        setTimeout(() => searchInput.focus(), 400);
      } else if (searchInput.value === "") {
        searchContainer.classList.remove('expanded');
      }
    });

    searchInput.addEventListener('blur', () => {
      if (searchInput.value === "") {
        setTimeout(() => searchContainer.classList.remove('expanded'), 200);
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target) && searchInput.value === "") {
        searchContainer.classList.remove('expanded');
      }
    });
  }

  /* =====================================================================================
     MODO OSCURO
  ===================================================================================== */
  const darkModeBtn = document.getElementById('dark-mode-btn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const icon = darkModeBtn.querySelector('.material-symbols-outlined');
      icon.textContent = document.body.classList.contains('dark') ? "light_mode" : "dark_mode";
    });
  }

  /* =====================================================================================
     FAVORITOS (HEADER)
  ===================================================================================== */
  const favBtn = document.getElementById('fav-btn');
  const favIcon = document.getElementById('fav-icon');
  if (favBtn && favIcon) {
    let favActive = false;
    favBtn.addEventListener('click', () => {
      favActive = !favActive;
      favIcon.textContent = favActive ? "favorite" : "favorite_border";
    });
  }

  /* =====================================================================================
     PERFIL (HEADER)
  ===================================================================================== */
  const profileBtn = document.getElementById('profile-btn');
  const profileMenu = document.getElementById('profile-menu');

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => profileMenu.classList.remove('active'));
  }

  /* =====================================================================================
     API HELPERS
  ===================================================================================== */
  async function obtenerCategorias() {
    const res = await fetch("https://japceibal.github.io/emercado-api/cats/cat.json");
    return res.json();
  }

  async function obtenerProductosDeCategoria(catID) {
    const res = await fetch(`https://japceibal.github.io/emercado-api/cats_products/${catID}.json`);
    return (await res.json()).products;
  }

  async function obtenerComentarios(id) {
    const res = await fetch(`https://japceibal.github.io/emercado-api/products_comments/${id}.json`);
    return res.json();
  }

  function obtenerCalificacion(comentarios) {
    if (!comentarios.length) return 0;
    return Math.round(comentarios.reduce((acc, c) => acc + c.score, 0) / comentarios.length);
  }

  function generarEstrellas(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  /* =====================================================================================
     CARGAR CATEGORÍAS DESTACADAS (4)
  ===================================================================================== */
  async function cargarCategorias() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  try {
    const categorias = await obtenerCategorias();

    if (!categorias || !categorias.length) {
      container.innerHTML = `<p class="text-gray-500">No hay categorías disponibles.</p>`;
      return;
    }

    const top6 = categorias.slice(0, 6);

    container.innerHTML = top6.map(cat => `
  <div class="bg-white rounded-xl shadow hover:shadow-lg hover:-translate-y-1 transition-all
    w-full max-w-[400px] mx-auto">

    <a href="products.html?cat=${cat.id}">

      <div class="w-full h-[240px] rounded-t-xl overflow-hidden">
        <img 
          src="img/cat${cat.id}_1.jpg"
          alt="${cat.name}"
          class="w-full h-full object-cover"
          onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
      </div>

      <div class="p-3">
        <h3 class="text-base font-bold text-gray-800 mb-1 text-center">${cat.name}</h3>
        <p class="text-xs text-gray-600 line-clamp-2 text-center">${cat.description}</p>
      </div>

    </a>
  </div>
`).join("");


  } catch (error) {
    console.error("Error cargando categorías:", error);
    container.innerHTML = `<p class="text-red-500">Error cargando categorías.</p>`;
  }
}

cargarCategorias();



  /* =====================================================================================
     TOP 4 MÁS VENDIDOS
  ===================================================================================== */
  async function calcularMasVendidos() {
    const categorias = await obtenerCategorias();
    const primeras3 = categorias.slice(0, 3);

    let productos = [];
    for (const c of primeras3) {
      const prods = await obtenerProductosDeCategoria(c.id);
      productos = productos.concat(prods);
    }

    productos.sort((a, b) => b.soldCount - a.soldCount);
    return productos.slice(0, 4);
  }

  /* =====================================================================================
     PRODUCTOS DESTACADOS
  ===================================================================================== */
  async function cargarProductosDestacados() {
    const contenedor = document.getElementById("featured-products");
    if (!contenedor) return;

    const CACHE_KEY = "destacados_cache_24h";
    let items = null;

    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      const data = JSON.parse(cache);
      if (Date.now() - data.timestamp < 86400000) {
        items = data.items;
        const info = document.getElementById("featured-cache-info");
        if (info) info.textContent = `Calculado hace ${(Date.now() - data.timestamp) / 3600000 | 0}h`;
      }
    }

    async function recalcular() {
      const productos = await calcularMasVendidos();

      for (const p of productos) {
        const comentarios = await obtenerComentarios(p.id).catch(() => []);
        p._comentarios = comentarios;
        p._puntuacion = obtenerCalificacion(comentarios);
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        items: productos
      }));

      return productos;
    }

    if (!items) items = await recalcular();
    renderizarDestacados(items);

    const btn = document.getElementById("recalc-featured");
    if (btn) {
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = "Recalculando...";
        const nuevos = await recalcular();
        renderizarDestacados(nuevos);
        btn.disabled = false;
        btn.textContent = "Recalcular ahora";
      };
    }
  }

  /* =====================================================================================
   RENDER DESTACADOS
===================================================================================== */
function renderizarDestacados(lista) {
  const contenedor = document.getElementById("featured-products");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  contenedor.className = "grid grid-cols-2 md:grid-cols-3 gap-4"; // ★ 2 columnas

  lista.forEach(producto => {
    const card = document.createElement("div");
    card.className =
      "bg-white rounded-xl shadow hover:shadow-lg overflow-hidden flex cursor-pointer transition";
    card.onclick = () => {
      location.href = `product-info.html?id=${producto.id}`;
    };

    card.innerHTML = `
      <div class="w-1/3">
        <img
          src="${producto.image || producto.images?.[0] || 'img/default.png'}"
          class="object-cover w-full h-full"
          alt="${producto.name}">
      </div>

      <div class="w-2/3 p-3 flex flex-col justify-between">

        <div>
          <h3 class="text-lg font-bold mb-1 line-clamp-1">${producto.name}</h3>
          
          <div class="text-yellow-500 text-sm mb-2">
            ${generarEstrellas(producto._puntuacion)} 
            <span class="text-gray-500">(${producto._puntuacion})</span>
          </div>

          <p class="text-sm text-gray-600 mb-2 line-clamp-2">
            ${producto.description || "Sin descripción disponible"}
          </p>
        </div>

        <div class="flex items-center justify-between mt-3">
          <span class="font-bold text-lg text-purple-600">
            ${producto.currency} ${producto.cost}
          </span>

          <div class="flex gap-2">
            <button class="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <span class="material-symbols-outlined text-purple-500">favorite</span>
            </button>
            <button class="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <span class="material-symbols-outlined text-purple-500">shopping_cart</span>
            </button>
          </div>
        </div>

      </div>
    `;

    contenedor.appendChild(card);
  });
}

/* =====================================================================================
   EJECUTAR
===================================================================================== */
cargarProductosDestacados();
});