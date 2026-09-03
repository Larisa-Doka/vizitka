(function () {
  "use strict";

  // Загружаем правки из браузера, если были сохранены ранее
  function _deepMerge(saved, fresh) {
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
        window.CONTENT = _deepMerge(_parsed, window.CONTENT);
      }
    }
  } catch (e) { /* ignore */ }

  var C = window.CONTENT;
  var status = document.getElementById("status");

  function saveLocal() {
    try { localStorage.setItem("site_content_v1", JSON.stringify(C)); } catch (e) {}
  }
  function clearLocal() {
    try { localStorage.removeItem("site_content_v1"); } catch (e) {}
  }

  function setStatus(msg, cls) {
    status.textContent = msg;
    status.className = "savebar__status " + (cls || "");
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function move(arr, from, to) {
    if (to < 0 || to >= arr.length || to === from) return;
    var item = arr.splice(from, 1)[0];
    arr.splice(to, 0, item);
    saveLocal();
  }

  function mkMoveBtn(label, delta, arr, idx, render) {
    var btn = el("button", "move", label);
    btn.addEventListener("click", function () {
      move(arr, idx, idx + delta);
      render();
    });
    return btn;
  }

  function mkDel(fn) {
    var btn = el("button", "del", "Удалить");
    btn.addEventListener("click", fn);
    return btn;
  }

  function mkInput(val, placeholder) {
    var wrap = el("div", "field");
    var label = el("label");
    var input = el("input");
    input.value = val || "";
    input.placeholder = placeholder || "";
    label.appendChild(input);
    wrap.appendChild(label);
    return wrap;
  }

  function mkField(labelText, control) {
    var wrap = el("div", "field");
    wrap.appendChild(el("label", null, labelText));
    wrap.appendChild(control);
    return wrap;
  }

  /* ---- tabs ---- */
  document.getElementById("anav").addEventListener("click", function (e) {
    var btn = e.target.closest(".anav__tab");
    if (!btn) return;
    document.querySelectorAll(".anav__tab").forEach(function (t) { t.classList.remove("is-active"); });
    btn.classList.add("is-active");
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("is-active"); });
    document.getElementById("panel-" + btn.dataset.panel).classList.add("is-active");
  });

  /* ---- text & check fields ---- */
  document.querySelectorAll("[data-path]").forEach(function (elInput) {
    var val = getPath(C, elInput.dataset.path);
    elInput.value = val == null ? "" : val;
  });
  document.querySelectorAll("[data-check]").forEach(function (elCheck) {
    elCheck.checked = !!getPath(C, elCheck.dataset.check);
  });

  document.addEventListener("input", function (e) {
    if (e.target.dataset.path) { setPath(C, e.target.dataset.path, e.target.value); saveLocal(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.dataset.check) { setPath(C, e.target.dataset.check, e.target.checked); saveLocal(); }
  });

  /* ---- logo preset ---- */
  var logoField = document.getElementById("f-logo");
  var logoPreset = document.getElementById("logoPreset");
  logoPreset.value = logoField.value || "";
  logoPreset.addEventListener("change", function () {
    if (!logoPreset.value) return;
    logoField.value = logoPreset.value;
    setPath(C, "profile.logo", logoPreset.value);
    saveLocal();
  });

  /* ---- contacts editor ---- */
  var contactsHost = document.getElementById("contactsEditor");

  function renderContacts() {
    contactsHost.innerHTML = "";
    C.contacts.items.forEach(function (item, i) {
      var div = el("div", "contact-item");
      div.appendChild(el("h3", null, "Контакт " + (i + 1)));

      var icon = document.createElement("select");
      ["", "email", "phone", "telegram"].forEach(function (k) {
        var o = document.createElement("option");
        o.value = k;
        o.textContent = k === "" ? "Без иконки" : k;
        if (item.icon === k) o.selected = true;
        icon.appendChild(o);
      });
      div.appendChild(mkField("Иконка", icon));

      var label = el("input");
      label.value = item.label || "";
      label.placeholder = "Подпись (подсказка при наведении)";
      div.appendChild(mkField("Подпись", label));

      var value = el("input");
      value.value = item.value || "";
      value.placeholder = "Текст (адрес/номер)";
      div.appendChild(mkField("Текст", value));

      var href = el("input");
      href.value = item.href || "";
      href.placeholder = "Ссылка: mailto:, tel:, https://";
      div.appendChild(mkField("Ссылка", href));

      var externalLab = el("label", "inline");
      var external = document.createElement("input");
      external.type = "checkbox";
      external.checked = !!item.external;
      externalLab.appendChild(external);
      externalLab.appendChild(document.createTextNode(" Открывать в новой вкладке"));
      div.appendChild(externalLab);

      var actions = el("div", "row-actions");
      actions.appendChild(mkMoveBtn("↑", -1, C.contacts.items, i, renderContacts));
      actions.appendChild(mkMoveBtn("↓", 1, C.contacts.items, i, renderContacts));
      actions.appendChild(mkDel(function () {
        C.contacts.items.splice(i, 1);
        saveLocal();
        renderContacts();
      }));
      div.appendChild(actions);

      contactsHost.appendChild(div);

      icon.addEventListener("change", function () { item.icon = icon.value; saveLocal(); });
      label.addEventListener("input", function () { item.label = label.value; saveLocal(); });
      value.addEventListener("input", function () { item.value = value.value; saveLocal(); });
      href.addEventListener("input", function () { item.href = href.value; saveLocal(); });
      external.addEventListener("change", function () { item.external = external.checked; saveLocal(); });
    });
  }

  document.getElementById("addContact").addEventListener("click", function () {
    C.contacts.items.push({ icon: "email", label: "Новый канал", value: "", href: "" });
    saveLocal();
    renderContacts();
  });

  /* ---- portfolio editor ---- */
  var portHost = document.getElementById("portfolioEditor");

  function renderPortfolio() {
    portHost.innerHTML = "";
    Object.keys(C.portfolio).forEach(function (catKey) {
      var cat = C.portfolio[catKey];
      var wrap = el("div", "group");
      wrap.appendChild(el("h3", null, "Категория: " + cat.label + " (" + catKey + ")"));

      cat.projects.forEach(function (proj, pIdx) {
        var item = el("div", "project-item");
        item.appendChild(el("h3", null, "Проект " + (pIdx + 1)));

        var title = el("input");
        title.value = proj.title || "";
        title.placeholder = "Название проекта";
        var nameRow = el("div", "mini-row");
        nameRow.appendChild(title);
        item.appendChild(nameRow);

        var desc = el("textarea");
        desc.rows = 2;
        desc.value = proj.description || "";
        desc.placeholder = "Короткое описание для карточки и галереи";
        item.appendChild(mkField("Описание проекта", desc));

        proj.images.forEach(function (img, imgIdx) {
          var row = el("div", "img-row");
          row.appendChild(mkMoveBtn("↑", -1, proj.images, imgIdx, renderPortfolio));
          row.appendChild(mkMoveBtn("↓", 1, proj.images, imgIdx, renderPortfolio));
          var inp = el("input");
          inp.value = img || "";
          inp.placeholder = "Путь к фото, например img/interior/…/file.jpg";
          row.appendChild(inp);
          row.appendChild(mkDel(function () {
            proj.images.splice(imgIdx, 1);
            saveLocal();
            renderPortfolio();
          }));
          item.appendChild(row);
          inp.addEventListener("input", function () { proj.images[imgIdx] = inp.value; saveLocal(); });
        });

        var actions = el("div", "row-actions");
        var addImg = el("button", "btn btn--ghost", "+ Фото");
        addImg.addEventListener("click", function () {
          proj.images.push("");
          saveLocal();
          renderPortfolio();
        });
        actions.appendChild(addImg);
        actions.appendChild(mkMoveBtn("↑ вверх", -1, cat.projects, pIdx, renderPortfolio));
        actions.appendChild(mkMoveBtn("↓ вниз", 1, cat.projects, pIdx, renderPortfolio));
        var delProj = el("button", "del", "Удалить проект");
        delProj.addEventListener("click", function () {
          cat.projects.splice(pIdx, 1);
          saveLocal();
          renderPortfolio();
        });
        actions.appendChild(delProj);
        item.appendChild(actions);

        title.addEventListener("input", function () { proj.title = title.value; saveLocal(); });
        desc.addEventListener("input", function () { proj.description = desc.value; saveLocal(); });

        wrap.appendChild(item);
      });

      var addBtn = el("button", "btn btn--ghost", "+ Добавить проект");
      addBtn.style.marginTop = "6px";
      addBtn.addEventListener("click", function () {
        cat.projects.push({ title: "Новый проект", description: "", images: [] });
        saveLocal();
        renderPortfolio();
      });
      wrap.appendChild(addBtn);

      portHost.appendChild(wrap);
    });
  }

  /* ---- process (схема работы) editor ---- */
  var processHost = document.getElementById("processEditor");

  function renderProcess() {
    // гарантируем наличие структуры
    if (!C.process) C.process = { title: "Как я работаю", lead: "", steps: [] };
    if (!Array.isArray(C.process.steps)) C.process.steps = [];

    processHost.innerHTML = "";
    C.process.steps.forEach(function (step, i) {
      var item = el("div", "project-item");
      item.appendChild(el("h3", null, "Этап " + (i + 1)));

      var numW = el("div", "mini-row");
      var num = el("input");
      num.value = step.num || "";
      num.placeholder = "Номер (например 01)";
      numW.appendChild(num);
      item.appendChild(numW);

      var title = el("input");
      title.value = step.title || "";
      title.placeholder = "Название этапа";
      item.appendChild(mkField("Название", title));

      var text = document.createElement("textarea");
      text.rows = 2;
      text.value = step.text || "";
      text.placeholder = "Описание этапа";
      item.appendChild(mkField("Описание", text));

      var actions = el("div", "row-actions");
      actions.appendChild(mkMoveBtn("↑ вверх", -1, C.process.steps, i, renderProcess));
      actions.appendChild(mkMoveBtn("↓ вниз", 1, C.process.steps, i, renderProcess));
      actions.appendChild(mkDel(function () {
        C.process.steps.splice(i, 1);
        saveLocal();
        renderProcess();
      }));
      item.appendChild(actions);

      processHost.appendChild(item);

      num.addEventListener("input", function () { step.num = num.value; saveLocal(); });
      title.addEventListener("input", function () { step.title = title.value; saveLocal(); });
      text.addEventListener("input", function () { step.text = text.value; saveLocal(); });
    });
  }

  document.getElementById("addStep").addEventListener("click", function () {
    if (!C.process) C.process = { title: "Как я работаю", lead: "", steps: [] };
    if (!Array.isArray(C.process.steps)) C.process.steps = [];
    var n = String(C.process.steps.length + 1).padStart(2, "0");
    C.process.steps.push({ num: n, title: "Новый этап", text: "" });
    saveLocal();
    renderProcess();
  });

  /* ---- serialize & save ---- */
  function serialize() {
    return "window.CONTENT = " + JSON.stringify(C, null, 2) + ";";
  }

  function download() {
    var blob = new Blob([serialize()], { type: "text/javascript;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content.js";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  document.getElementById("download").addEventListener("click", function () {
    download();
    setStatus("Файл content.js скачан", "ok");
  });

  document.getElementById("save").addEventListener("click", async function () {
    var text = serialize();
    // Всегда сохраняем в браузер — это мгновенно отражается на сайте
    saveLocal();
    try {
      var resp = await fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "text/javascript;charset=utf-8" },
        body: text
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      setStatus("Сохранено: в браузере и на сервере (content.js). Обновите сайт (F5).", "ok");
      return;
    } catch (serverErr) {
      // Сервер недоступен (открыли file://) — пробуем File System Access API
      try {
        if (window.showSaveFilePicker) {
          var handle = await window.showSaveFilePicker({
            suggestedName: "content.js",
            types: [{ description: "JavaScript", accept: { "text/javascript": [".js"] } }]
          });
          var writable = await handle.createWritable();
          await writable.write(text);
          await writable.close();
          setStatus("Сохранено в браузере и в файл content.js. Обновите сайт (F5).", "ok");
          return;
        }
      } catch (pickerErr) {
        if (pickerErr.name === "AbortError") {
          setStatus("Сохранено в браузере (но файл не выбран). Нажмите «Скачать content.js», если нужно сохранить файл.", "ok");
          return;
        }
        download();
        setStatus("Сохранено в браузере. Файл content.js скачан — замените им файл в папке site для постоянного хранения.", "ok");
        return;
      }
      // Fallback: скачивание
      download();
      setStatus("Сохранено в браузере. Файл content.js скачан — переместите его в папку site (замените старый).", "ok");
    }
  });

  // Кнопка сброса — удалить правки из браузера
  var resetBtn = document.getElementById("resetLocal");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Удалить все правки из браузера и вернуть исходный content.js?")) {
        clearLocal();
        location.reload();
      }
    });
  }

  renderContacts();
  renderPortfolio();
  renderProcess();
})();