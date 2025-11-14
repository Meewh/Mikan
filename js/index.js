document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================================================
     HELPERS API
  ===================================================================================== */

    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    const totalSlides = slides.length;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      currentSlide = index;
    }

    function nextSlide() {
      showSlide((currentSlide + 1) % totalSlides);
    }

    function prevSlide() {
      showSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }

    document.getElementById('next-slide').addEventListener('click', nextSlide);
    document.getElementById('prev-slide').addEventListener('click', prevSlide);

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => showSlide(index));
    });

    // Auto-play
    setInterval(nextSlide, 5000);

    // BÚSQUEDA
    const searchToggle = document.getElementById('search-toggle');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = searchContainer.classList.contains('expanded');
      
      if (!isExpanded) {
        searchContainer.classList.add('expanded');
        setTimeout(() => searchInput.focus(), 400);
      } else if (searchInput.value === '') {
        searchContainer.classList.remove('expanded');
      }
    });

    searchInput.addEventListener('blur', () => {
      if (searchInput.value === '') {
        setTimeout(() => {
          searchContainer.classList.remove('expanded');
        }, 200);
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target) && searchInput.value === '') {
        searchContainer.classList.remove('expanded');
      }
    });

    // MODO OSCURO
    const darkModeBtn = document.getElementById('dark-mode-btn');
    darkModeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const icon = darkModeBtn.querySelector('.material-symbols-outlined');
      icon.textContent = document.body.classList.contains('dark') ? 'light_mode' : 'dark_mode';
    });

    // FAVORITOS
    const favBtn = document.getElementById('fav-btn');
    const favIcon = document.getElementById('fav-icon');
    let favActive = false;
    
    favBtn.addEventListener('click', () => {
      favActive = !favActive;
      favIcon.textContent = favActive ? 'favorite' : 'favorite_border';
    });

    // MENÚ PERFIL
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      profileMenu.classList.remove('active');
    });

    // CARGAR CATEGORÍAS
    async function loadCategories() {
      const res = await fetch('https://japceibal.github.io/emercado-api/cats/cat.json');
      const categories = await res.json();
      const container = document.getElementById('categories-container');
      container.innerHTML = "";
      
      categories.forEach(cat => {
        container.innerHTML += `
          <div class="category-card">
            <img src="img/cat${cat.id}_1.jpg" alt="${cat.name}">
            <h3>${cat.name}</h3>
          </div>
        `;
      });
    }

    // HELPERS API
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

    function obtenerCalificacion(comments) {
      if (comments.length === 0) return 0;
      let sum = 0;
      comments.forEach(c => sum += c.score);
      return Math.round(sum / comments.length);
    }

    function generarEstrellas(score) {
      return "★".repeat(score) + "☆".repeat(5 - score);
    }

    // CALCULAR MÁS VENDIDOS - SOLO TOP 4
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

    // CARGAR PRODUCTOS DESTACADOS CON ESTILO STITCH
// CARGAR PRODUCTOS DESTACADOS — ESTILO STITCH
async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  container.innerHTML = "";

  const top4 = await calcularMasVendidos();

  for (const p of top4) {
    const comentarios = await obtenerComentarios(p.id);
    const rating = obtenerCalificacion(comentarios);
    const estrellas = generarEstrellas(rating);

    container.innerHTML += `
      <div class="product-card">
        <div class="product-image-wrapper">
          <img class="product-image" src="${p.image}" alt="${p.name}">
        </div>

        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          <p class="product-description">${p.description}</p>

          <p class="product-price">${p.currency} ${p.cost}</p>

          <p class="product-stats">Vendidos: ${p.soldCount}</p>

          <div class="product-rating">
            ${estrellas} 
            <span class="product-rating-info">(${rating}/5)</span>
          </div>
        </div>
      </div>
    `;
  }
}

    // CARGAR AL INICIO
    loadCategories();
    loadFeaturedProducts();

    // CART COUNT
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    document.getElementById('cart-count').textContent = cart.length;
});
