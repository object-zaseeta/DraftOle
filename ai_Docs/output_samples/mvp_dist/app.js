// Minimal "jQuery-level" helper for offline demo (no CDN, no build tools).
function $(selectorOrEl) {
  const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
  if (!el) {
    return {
      el: null,
      css() { return this; },
      height() { return this; },
      on() { return this; },
      text() { return ""; },
      addClass() { return this; },
      removeClass() { return this; },
      toggleClass() { return this; }
    };
  }
  return {
    el,
    css(obj) {
      for (const [k, v] of Object.entries(obj || {})) {
        el.style.setProperty(k, String(v));
      }
      return this;
    },
    height(value) {
      el.style.height = typeof value === "number" ? `${value}px` : String(value);
      return this;
    },
    on(eventName, handler) {
      el.addEventListener(eventName, handler);
      return this;
    },
    text(value) {
      if (value === undefined) return el.textContent || "";
      el.textContent = String(value);
      return this;
    },
    addClass(name) {
      el.classList.add(name);
      return this;
    },
    removeClass(name) {
      el.classList.remove(name);
      return this;
    },
    toggleClass(name) {
      el.classList.toggle(name);
      return this;
    }
  };
}

function createTodoItem(text) {
  const li = document.createElement("li");
  li.className = "item";

  const span = document.createElement("span");
  span.className = "text";
  span.textContent = text;

  const pill = document.createElement("span");
  pill.className = "pill ng";
  pill.textContent = "active";

  const btn = document.createElement("button");
  btn.className = "btn";
  btn.type = "button";
  btn.textContent = "toggle";

  btn.addEventListener("click", () => {
    li.classList.toggle("done");
    const done = li.classList.contains("done");
    pill.textContent = done ? "done" : "active";
    pill.classList.toggle("ok", done);
    pill.classList.toggle("ng", !done);
    updateCount();
  });

  li.appendChild(span);
  li.appendChild(pill);
  li.appendChild(btn);
  return li;
}

function updateCount() {
  const items = document.querySelectorAll("#todo-list .item");
  const active = Array.from(items).filter((x) => !x.classList.contains("done")).length;
  $("#count").text(`${active} items`);
}

function clearDone() {
  document.querySelectorAll("#todo-list .item.done").forEach((el) => el.remove());
  updateCount();
}

function addTodo() {
  const input = document.querySelector("#todo-input");
  const raw = input.value || "";
  const text = raw.trim();
  if (!text) {
    $("#todo-input").css({ "border-color": "rgba(239, 68, 68, 0.65)" });
    return;
  }
  $("#todo-input").css({ "border-color": "rgba(255, 255, 255, 0.12)" });
  const li = createTodoItem(text);
  document.querySelector("#todo-list").appendChild(li);
  input.value = "";
  updateCount();
}

document.addEventListener("DOMContentLoaded", () => {
  // This section is what DraftOle's JS generator should be able to produce.
  $("#add-btn").on("click", addTodo);
  $("#clear-btn").on("click", clearDone);
  $("#todo-input").on("keydown", (e) => {
    if (e.key === "Enter") addTodo();
  });

  // Initial demo styling via "jQuery-like" API.
  $("#app").css({ "min-height": "100vh" });
  $("#todo-list").height(0);
  updateCount();
});
