document.addEventListener("DOMContentLoaded", () => {

  /* =============================================================
     API HELPERS
  ============================================================= */

  async function obtenerCategorias() {
    const res = await fetch("https://japceibal.github.io/emercado-api/cats/cat.json");
    return await res.json();
  }

  async function obtenerProductosDeCategoria(catID) {
    const res = await fetch(`https://japceibal.github.io/emercado-api/cats_products/${catID}.json`);
    const data = await res.json();
    return data.products;
  }

  /* =============================================================
     MÁS VENDIDOS (con CACHE 24H)
  ============================================================= */

  async function calcularMasVendidos() {
    const categorias = await obtenerCategorias();
    const top3 = categorias.slice(0, 3); // top 3 primeras categorías

    let productos = [];

    for (const cat of top3) {
      const prods = await obtenerProductosDeCategoria(cat.id);
      productos = productos.concat(prods);
    }

    productos.sort((a, b) => b.soldCount - a.soldCount);

    return productos.slice(0, 10); // quedate con los 10 más vendidos
  }

  function cacheVigente(timestamp) {
    const MS_24H = 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < MS_24H;
  }

  async function obtenerMasVendidosConCache(force = false) {
    const cache = JSON.parse(localStorage.getItem("masVendidosCache") || "null");

    if (!force && cache && cacheVigente(cache.timestamp)) {
      return cache.data;
    }

    const nuevos = await calcularMasVendidos();

    localStorage.setItem("masVendidosCache", JSON.stringify({
      timestamp: Date.now(),
      data: nuevos
    }));

    return nuevos;
  }

  /* =============================================================
     RECOMENDADOS
  ============================================================= */

  async function obtenerRecomendados(masVendidos) {
    const favs = JSON.parse(localStorage.getItem("favoritos") || "[]");

    if (favs.length > 0) {
      return masVendidos.filter(p => favs.includes(p.id)).slice(0, 6);
    }

    return masVendidos.slice(0, 2); // fallback
  }

  /* =============================================================
     RENDERIZADO DE CARDS
  ============================================================= */

  function cardHorizontal(p) {
    return `
      <div class="product-card">
        <div class="media" style="background-image:url('${p.image}');"></div>
        <div class="title">${p.name}</div>
        <div class="price">${p.currency} ${p.cost}</div>
        <div class="sold">Vendidos: ${p.soldCount}</div>
      </div>
    `;
  }

  function renderListaHorizontal(id, items) {
    const cont = document.getElementById(id);
    cont.innerHTML = items.map(cardHorizontal).join("");
  }

  /* =============================================================
     BOTÓN "RECALCULAR"
  ============================================================= */

  const recalcularBtn = document.createElement("button");
  recalcularBtn.textContent = "Recalcular ahora";
  recalcularBtn.className = "btn-secondary";
  recalcularBtn.style.marginBottom = "12px";

  document.querySelector(".section h2").appendChild(recalcularBtn);

  recalcularBtn.addEventListener("click", async () => {
    recalcularBtn.textContent = "Recalculando...";
    recalcularBtn.disabled = true;

    const mv = await obtenerMasVendidosConCache(true);
    renderListaHorizontal("destacados-container", mv);

    recalcularBtn.textContent = "Recalcular ahora";
    recalcularBtn.disabled = false;
  });

  /* =============================================================
     INIT
  ============================================================= */

  async function init() {
    const masVendidos = await obtenerMasVendidosConCache();
    renderListaHorizontal("destacados-container", masVendidos);

    const recomendados = await obtenerRecomendados(masVendidos);
    renderListaHorizontal("recomendados-container", recomendados);

    // Novedades y ofertas pueden eliminarse si ya no las usas
  }

  init();

  /* =============================================================
     CATEGORÍAS
  ============================================================= */

  fetch("https://japceibal.github.io/emercado-api/cats/cat.json")
    .then(r => r.json())
    .then(categories => {
      const cont = document.getElementById("categories-container");
      cont.innerHTML = "";
      categories.forEach(cat => {
        cont.innerHTML += `
          <div class="category-card">
            <img src="img/cat${cat.id}_1.jpg">
            <h3>${cat.name}</h3>
          </div>`;
      });
    });
});
