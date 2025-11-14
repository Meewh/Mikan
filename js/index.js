document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================================================
     CARRUSEL
  ===================================================================================== */

  let currentSlide = 0;
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const totalSlides = slides.length;

  function mostrarSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function siguienteSlide() {
    mostrarSlide((currentSlide + 1) % totalSlides);
  }

  function anteriorSlide() {
    mostrarSlide((currentSlide - 1 + totalSlides) % totalSlides);
  }

  document.getElementById('next-slide').addEventListener('click', siguienteSlide);
  document.getElementById('prev-slide').addEventListener('click', anteriorSlide);

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => mostrarSlide(index));
  });

  setInterval(siguienteSlide, 5000);


  /* =====================================================================================
     BÚSQUEDA
  ===================================================================================== */

  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.getElementById('search-container');
  const searchInput = document.getElementById('search-input');

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


  /* =====================================================================================
     MODO OSCURO
  ===================================================================================== */

  const darkModeBtn = document.getElementById('dark-mode-btn');

  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const icon = darkModeBtn.querySelector('.material-symbols-outlined');
    icon.textContent = document.body.classList.contains('dark')
      ? "light_mode"
      : "dark_mode";
  });


  /* =====================================================================================
     FAVORITOS
  ===================================================================================== */

  const favBtn = document.getElementById('fav-btn');
  const favIcon = document.getElementById('fav-icon');
  let favActive = false;

  favBtn.addEventListener('click', () => {
    favActive = !favActive;
    favIcon.textContent = favActive ? "favorite" : "favorite_border";
  });


  /* =====================================================================================
     MENÚ PERFIL
  ===================================================================================== */

  const profileBtn = document.getElementById('profile-btn');
  const profileMenu = document.getElementById('profile-menu');

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    profileMenu.classList.remove('active');
  });


  /* =====================================================================================
     HELPERS API
  ===================================================================================== */

  async function obtenerCategorias() {
    const res = await fetch("https://japceibal.github.io/emercado-api/cats/cat.json");
    return await res.json();
  }

  async function obtenerProductosDeCategoria(catID) {
    const res = await fetch(`https://japceibal.github.io/emercado-api/cats_products/${catID}.json`);
    const data = await res.json();
    return data.products;
  }

  async function obtenerComentarios(id) {
    const res = await fetch(`https://japceibal.github.io/emercado-api/products_comments/${id}.json`);
    return await res.json();
  }

  function obtenerCalificacion(comentarios) {
    if (comentarios.length === 0) return 0;
    let total = comentarios.reduce((acc, c) => acc + c.score, 0);
    return Math.round(total / comentarios.length);
  }

  function generarEstrellas(score) {
    return "★".repeat(score) + "☆".repeat(5 - score);
  }


  /* =====================================================================================
     CALCULAR LOS 4 MÁS VENDIDOS
  ===================================================================================== */

  async function calcularMasVendidos() {
    const categorias = await obtenerCategorias();
    const top3 = categorias.slice(0, 3);

    let productos = [];

    for (const cat of top3) {
      const prods = await obtenerProductosDeCategoria(cat.id);
      productos = productos.concat(prods);
    }

    productos.sort((a, b) => b.soldCount - a.soldCount);

    return productos.slice(0, 4);
  }


  /* =====================================================================================
     PRODUCTOS DESTACADOS CON CACHÉ 24H
  ===================================================================================== */

  async function cargarProductosDestacados() {
    const contenedor = document.getElementById("featured-products");
    contenedor.innerHTML = "";

    const imagenesFondo = [
      "../img/productD1.jpg",
      "../img/productD2.jpg",
      "../img/productD3.jpg",
      "../img/productD4.jpg"
    ];

    const CACHE_KEY = "destacados_cache_24h";

    let productosTop4 = null;
    const cache = localStorage.getItem(CACHE_KEY);

    if (cache) {
      const datos = JSON.parse(cache);
      const tiempo = Date.now() - datos.timestamp;

      if (tiempo < 24 * 60 * 60 * 1000) {
        productosTop4 = datos.items;
        const horas = Math.round(tiempo / 3600000);
        document.getElementById("featured-cache-info").textContent =
          `Calculado hace ${horas}h`;
      }
    }

    async function recalcular() {
      const nuevos = await calcularMasVendidos();

      for (const p of nuevos) {
        const comentarios = await obtenerComentarios(p.id).catch(() => []);
        p._comentarios = comentarios;
        p._puntuacion = obtenerCalificacion(comentarios);
      }

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          items: nuevos
        })
      );

      document.getElementById("featured-cache-info").textContent =
        "Actualizado ahora";

      return nuevos;
    }

    if (!productosTop4) {
      productosTop4 = await recalcular();
    }

    // BOTÓN RE-CALCULAR
    const btn = document.getElementById("recalc-featured");
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = "Recalculando...";
      const nuevos = await recalcular();
      await renderizar(nuevos);
      btn.disabled = false;
      btn.textContent = "Recalcular ahora";
    };


    /* ------ RENDER ------ */

    async function renderizar(lista) {
      contenedor.innerHTML = "";

      while (lista.length < 4) {
        lista.push({
          id: "placeholder",
          name: "Próximamente",
          description: "",
          cost: "--",
          soldCount: 0,
          image: imagenesFondo[lista.length],
          _comentarios: [],
          _puntuacion: 0
        });
      }

      for (let i = 0; i < 4; i++) {
        const p = lista[i];
        const fondo = imagenesFondo[i];
        const estrellas = generarEstrellas(p._puntuacion);
        const comentariosCortos = p._comentarios.slice(0, 2);

        const panel = document.createElement("section");
        panel.className = "featured-panel";
        panel.style.backgroundImage =
          `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.6)), url("${fondo}")`;

        panel.innerHTML = `
          <div class="panel-inner">

            <div class="panel-left">
              <h3 class="title">${p.name}</h3>
              <div class="subtitle">${p.currency || ""} ${p.cost} • Vendidos: ${p.soldCount}</div>
              <div class="desc">${p.description?.slice(0, 240) || ""}</div>

              <div class="meta-row">
                <div class="rating-stars">${estrellas}</div>
                <div class="rating-info">(${p._puntuacion}/5)</div>
                <div class="tag">Popular</div>
                <div class="tag">Envío rápido</div>
              </div>

              <div class="comments">
                ${
                  comentariosCortos.length === 0
                    ? `<div class="comment muted">Sin comentarios aún.</div>`
                    : comentariosCortos.map(
                        c => `
                  <div class="comment">
                    <strong>${c.user}</strong>: 
                    ${c.description.slice(0, 140)}${c.description.length > 140 ? "…" : ""}
                  </div>
                `
                      ).join("")
                }
              </div>
            </div>

            <div class="panel-right">
              <div class="secondary-img"
                   style="background-image:url('${p.image || fondo}')"></div>

              <button class="btn-primary" data-id="${p.id}">
                Ver producto
              </button>
            </div>

          </div>
        `;

        panel.querySelector(".btn-primary").onclick = () => {
          localStorage.setItem("productId", p.id);
          window.location.href = "product-info.html";
        };

        contenedor.appendChild(panel);
      }
    }

    await renderizar(productosTop4);
  }

  cargarProductosDestacados();

});
