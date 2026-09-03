(function () {
  "use strict";

  // Если есть сохранённые правки из админки (localStorage), используем их
  function _deepMerge(saved, fresh) {
    // Возвращает объект: приоритет у saved, недостающие вложенные поля/объекты берём из fresh.
    // Массивы и скаляры берём целиком из saved (чтобы не ломать правки пользователя).
    var out = saved;
    if (saved !== null && typeof saved === "object" &&
        fresh !== null && typeof fresh === "object" &&
        !Array.isArray(saved) && !Array.isArray(fresh)) {
      Object.keys(fresh).forEach(function (k) {
        if (saved[k] === undefined) {
          out[k] = fresh[k];
        } else if (typeof saved[k] === "object" && saved[k] !== null &&
                   typeof fresh[k] === "object" && fresh[k] !== null &&
                   !Array.isArray(saved[k]) && !Array.isArray(fresh[k])) {
          out[k] = _deepMerge(saved[k], fresh[k]);
        }
      });
    }
    return out;
  }

  try {
    var _stored = localStorage.getItem("site_content_v1");
    if (_stored) {
      var _parsed = JSON.parse(_stored);
      if (_parsed && _parsed.profile && _parsed.portfolio) {
        // Глубоко объединяем: сохраняем правки пользователя (saved),
        // но подтягиваем новые поля из актуального файла (fresh)
        window.CONTENT = _deepMerge(_parsed, window.CONTENT);
      }
    }
  } catch (e) { /* ignore */ }

  var C = window.CONTENT;

  var grid = document.getElementById("grid");
  var tabs = document.getElementById("tabs");

  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var lbCounter = document.getElementById("lbCounter");
  var lbDesc = document.getElementById("lbDesc");

  var openTitle = "";
  var openImages = [];
  var openIndex = 0;
  var currentCat = Object.keys(C.portfolio)[0];

  var ICONS = {
    email: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M3 6.5l9 7 9-7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v2.6a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4a2 2 0 0 1 2-2.2h2.6a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M21.9 4.6 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.8 12 2 10.5c-1-.3-1-1 .2-1.4L20.5 3.4c.8-.3 1.6.2 1.4 1.2z"/></svg>'
  };

  function fillTexts() {
    var p = C.profile;
    var h = C.hero;
    document.title = p.fullName + " — " + p.role;
    document.getElementById("eyebrow").textContent = h.eyebrow;
    document.getElementById("heroTitle").textContent = h.title;
    document.getElementById("heroSubtitle").textContent = h.subtitle;
    document.getElementById("heroDesc").textContent = h.description;
    document.getElementById("heroPrimary").textContent = h.primaryBtn;
    document.getElementById("heroSecondary").textContent = h.secondaryBtn;
    document.getElementById("heroPhoto").src = p.photo;
    document.getElementById("heroPhoto").alt = p.photoAlt;
    if (p.photoMirror) document.getElementById("heroPhoto").classList.add("is-mirrored");

    if (p.logo) {
      document.getElementById("logoImg").src = p.logo;
      document.getElementById("logoImg").hidden = false;
      document.getElementById("logoMonogram").style.display = "none";
    }

    document.getElementById("aboutTitle").textContent = C.about.title;
    document.getElementById("aboutText").textContent = C.about.text;

    document.getElementById("worksTitle").textContent = C.works.title;
    document.getElementById("worksHint").textContent = C.works.hint;

    document.getElementById("contactsTitle").textContent = C.contacts.title;
    document.getElementById("contactsLead").textContent = C.contacts.lead;
    var foot = document.getElementById("contactsFootnote");
    if (foot) foot.textContent = C.contacts.footnote || "";
    if (C.process) {
      document.getElementById("processTitle").textContent = C.process.title;
      document.getElementById("processLead").textContent = C.process.lead;
    }
  }

  function renderProcess() {
    var host = document.getElementById("steps");
    if (!host || !C.process) return;
    host.innerHTML = "";
    C.process.steps.forEach(function (step, i) {
      var item = document.createElement("div");
      item.className = "step";
      item.style.animationDelay = (i * 0.06) + "s";

      var num = document.createElement("span");
      num.className = "step__num";
      num.textContent = step.num;

      var body = document.createElement("div");
      body.className = "step__body";

      var title = document.createElement("h3");
      title.className = "step__title";
      title.textContent = step.title;

      var text = document.createElement("p");
      text.className = "step__text";
      text.textContent = step.text;

      body.appendChild(title);
      body.appendChild(text);

      item.appendChild(num);
      item.appendChild(body);
      host.appendChild(item);
    });
  }

  function renderTabs() {
    tabs.innerHTML = "";
    Object.keys(C.portfolio).forEach(function (key, i) {
      var btn = document.createElement("button");
      btn.className = "tab" + (i === 0 ? " is-active" : "");
      btn.dataset.cat = key;
      btn.setAttribute("role", "tab");
      btn.textContent = C.portfolio[key].label;
      tabs.appendChild(btn);
    });
  }

  function renderContacts() {
    var host = document.getElementById("contactsGrid");
    host.innerHTML = "";
    C.contacts.items.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "contact";
      a.href = item.href;
      if (item.external) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.title = item.label;

      var iconWrap = document.createElement("span");
      iconWrap.className = "contact__icon";
      iconWrap.innerHTML = ICONS[item.icon] || "";

      var value = document.createElement("span");
      value.className = "contact__value";
      value.textContent = item.value;

      a.appendChild(iconWrap);
      a.appendChild(value);
      host.appendChild(a);
    });
  }

  function render(cat) {
    var projects = C.portfolio[cat].projects;
    grid.innerHTML = "";

    projects.forEach(function (proj, idx) {
      var card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", proj.title + (proj.description ? " — " + proj.description : ""));

      var thumb = document.createElement("div");
      thumb.className = "card__thumb";

      var img = document.createElement("img");
      img.src = proj.images[0];
      img.alt = proj.title;
      img.loading = "lazy";
      thumb.appendChild(img);

      var body = document.createElement("div");
      body.className = "card__body";

      var title = document.createElement("p");
      title.className = "card__title";
      title.textContent = proj.title;

      var count = document.createElement("span");
      count.className = "card__count";
      count.textContent = proj.images.length + (proj.images.length > 1 ? " фото" : " фото");

      body.appendChild(title);
      body.appendChild(count);
      card.appendChild(thumb);
      card.appendChild(body);

      card.addEventListener("click", function () { openLightbox(cat, idx); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(cat, idx);
        }
      });

      grid.appendChild(card);
    });
  }

  function openLightbox(cat, idx) {
    var proj = C.portfolio[cat].projects[idx];
    openTitle = proj.title;
    openImages = proj.images;
    openIndex = 0;
    showImage();
    lbDesc.textContent = proj.description || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function showImage() {
    lbImg.src = openImages[openIndex];
    lbImg.alt = openTitle;
    lbTitle.textContent = openTitle;
    lbCounter.textContent = openIndex + 1 + " / " + openImages.length;
  }

  function prev() {
    openIndex = (openIndex - 1 + openImages.length) % openImages.length;
    showImage();
  }

  function next() {
    openIndex = (openIndex + 1) % openImages.length;
    showImage();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  var zoom = document.getElementById("zoom");
  var zoomImg = document.getElementById("zoomImg");

  function openZoom() {
    zoomImg.src = lbImg.src;
    zoomImg.alt = openTitle;
    zoom.classList.add("is-open");
  }
  function closeZoom() {
    zoom.classList.remove("is-open");
    zoomImg.src = "";
  }

  document.getElementById("lbPrev").addEventListener("click", prev);
  document.getElementById("lbNext").addEventListener("click", next);
  document.getElementById("lbClose").addEventListener("click", closeLightbox);

  lbImg.addEventListener("click", openZoom);
  document.getElementById("zoomClose").addEventListener("click", closeZoom);
  zoom.addEventListener("click", function (e) {
    if (e.target === zoom) closeZoom();
  });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (zoom.classList.contains("is-open")) closeZoom();
      else if (lightbox.classList.contains("is-open")) closeLightbox();
      return;
    }
    if (zoom.classList.contains("is-open")) return;
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  tabs.addEventListener("click", function (e) {
    var btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("is-active"); });
    btn.classList.add("is-active");
    currentCat = btn.dataset.cat;
    render(currentCat);
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  fillTexts();
  renderTabs();
  renderContacts();
  renderProcess();
  render(currentCat);
})();