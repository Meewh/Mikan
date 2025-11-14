document.addEventListener("DOMContentLoaded", () => {
  // CART COUNTER
  const productos = JSON.parse(localStorage.getItem("cart") || "[]");
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = productos.length;

  // PROFILE MENU & NAME
  const userMenuBtn = document.getElementById("btn-profile");
  const userMenu = document.getElementById("menu-profile");
  const nombreSpan = document.getElementById("nombre-usuario");
  const profileWrap = document.querySelector(".profile-wrap");

  const usuario = localStorage.getItem("usuario");
  const logueado = localStorage.getItem("logueado");

  // Fill menu items depending on login state
  function renderProfileMenu() {
    if (!userMenu) return;
    if (logueado !== "true" || !usuario) {
      userMenu.innerHTML = `
        <li><a href="login.html">Iniciar sesión</a></li>
        <li><a href="registro.html">Crear cuenta</a></li>
      `;
    } else {
      userMenu.innerHTML = `
        <li><a href="my-profile.html">Mi Perfil</a></li>
        <li><a href="config.html">Configuración</a></li>
        <li><button id="logoutBtn" class="logout-btn">Cerrar sesión</button></li>
      `;
      if (nombreSpan) nombreSpan.textContent = usuario;
      const fotoPerfil = localStorage.getItem("fotoPerfil");
      if (fotoPerfil && userMenuBtn) {
        userMenuBtn.innerHTML = `<img src="${fotoPerfil}" alt="Foto perfil" class="profile-photo" />`;
      }
    }
  }
  renderProfileMenu();

  // toggle menu
  let open = false;
  if (userMenuBtn) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      open = !open;
      userMenu.style.display = open ? "block" : "none";
      userMenu.setAttribute("aria-hidden", (!open).toString());
      userMenuBtn.setAttribute("aria-expanded", open.toString());
    });
  }

  // click outside closes
  document.addEventListener("click", () => {
    if (open) {
      open = false;
      if (userMenu) userMenu.style.display = "none";
    }
  });

  // logout handler
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "logoutBtn") {
      localStorage.clear();
      window.location.reload();
    }
  });

  // favorites toggling (visual only)
  const favBtn = document.getElementById("btn-fav");
  const favIcon = document.getElementById("fav-icon");
  if (favBtn && favIcon) {
    let favOn = false;
    favBtn.addEventListener("click", () => {
      favOn = !favOn;
      favIcon.textContent = favOn ? "favorite" : "favorite_border";
      // optionally save to localStorage user favorites filter state
    });
  }

  // Search: focus behavior (visual)
  const searchInput = document.getElementById("search-input");
  const searchWrap = document.querySelector(".search-wrap");
  if (searchInput && searchWrap) {
    searchInput.addEventListener("focus", () => searchWrap.style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)");
    searchInput.addEventListener("blur", () => searchWrap.style.boxShadow = "var(--shadow)");
  }

  // Mikan bot handlers
  const mikanBtn = document.getElementById("chatbot-btn");
  const chatbotBox = document.getElementById("chatbot-box");
  if (mikanBtn && chatbotBox) {
    mikanBtn.addEventListener("click", () => {
      chatbotBox.classList.toggle("open");
      chatbotBox.setAttribute("aria-hidden", (!chatbotBox.classList.contains("open")).toString());
    });
  }

});
