const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal content progressively without hiding anything for visitors who prefer less motion.
(() => {
  const info = document.getElementById("info");
  if (!info) return;
  const items = [...info.querySelectorAll(".reveal")];
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    });
  }, { root: info, threshold: 0.15 });
  items.forEach((item) => observer.observe(item));
})();

// Experience switcher: click and keyboard accessible.
(() => {
  const wrap = document.getElementById("xp");
  if (!wrap) return;
  const buttons = [...wrap.querySelectorAll(".xp-co")];
  const details = [...wrap.querySelectorAll(".xp-detail")];
  const activate = (button) => {
    const id = button.dataset.co;
    buttons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    details.forEach((item) => item.classList.toggle("is-active", item.dataset.co === id));
  };
  buttons.forEach((button, index) => {
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(button.classList.contains("is-active")));
    button.tabIndex = button.classList.contains("is-active") ? 0 : -1;
    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", (event) => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else next = (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      activate(buttons[next]);
    });
  });
})();

// A lightweight, static-friendly interaction. It never waits for a custom API or a large name lookup.
(() => {
  const stage = document.getElementById("pfootStage");
  const button = document.getElementById("pfootBtn");
  const count = document.getElementById("pfootCount");
  if (!stage || !button || !count) return;

  const characters = [
    [25, "Pikachu"], [4, "Charmander"], [1, "Bulbasaur"], [7, "Squirtle"],
    [133, "Eevee"], [94, "Gengar"], [143, "Snorlax"], [149, "Dragonite"],
  ];
  const art = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  const key = "portfolio-character-drop";
  const hasDropped = () => { try { return localStorage.getItem(key) === "1"; } catch { return false; } };
  const markDropped = () => { try { localStorage.setItem(key, "1"); } catch {} };
  const track = document.createElement("div");
  track.className = "pfoot-track";
  stage.appendChild(track);

  const fit = () => {
    const width = track.scrollWidth;
    const scale = width > stage.clientWidth && stage.clientWidth ? stage.clientWidth / width : 1;
    track.style.transform = `scale(${scale})`;
    track.style.setProperty("--inv", (1 / scale).toFixed(3));
  };
  const updateCount = () => { count.textContent = `${track.children.length} portfolio companion${track.children.length === 1 ? "" : "s"}`; };
  const add = ([id, name], animate = false) => {
    const card = document.createElement("div");
    card.className = "pfoot-mon";
    card.style.width = card.style.height = `${72 + Math.floor(Math.random() * 20)}px`;
    card.style.setProperty("--rot", `${(Math.random() * 8 - 4).toFixed(1)}deg`);
    if (!animate || reduceMotion) card.style.animation = "none";
    const image = new Image();
    image.className = "pfoot-sprite";
    image.alt = name;
    image.loading = "lazy";
    image.src = art(id);
    image.onerror = () => card.remove();
    const label = document.createElement("span");
    label.className = "pfoot-name";
    label.textContent = name;
    card.append(image, label);
    track.appendChild(card);
  };

  characters.slice(0, 5).forEach((character) => add(character));
  fit();
  updateCount();
  window.addEventListener("resize", fit, { passive: true });
  if (hasDropped()) {
    button.disabled = true;
    button.textContent = "Companion added";
  }
  button.addEventListener("click", () => {
    if (hasDropped()) return;
    add(characters[Math.floor(Math.random() * characters.length)], true);
    markDropped();
    button.disabled = true;
    button.textContent = "Companion added";
    fit();
    updateCount();
  });
})();
