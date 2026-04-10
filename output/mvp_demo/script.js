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
  const active = Array.from(items).filter(x => !x.classList.contains("done")).length;
  document.querySelector("#count").textContent = active + " items";
}
function clearDone() {
  document.querySelectorAll("#todo-list .item.done").forEach(el => el.remove());
  updateCount();
}
function addTodo() {
  const input = document.querySelector("#todo-input");
  const text = (input.value || "").trim();
  if (!text) { input.style.borderColor = "rgba(239, 68, 68, 0.65)"; return; }
  input.style.borderColor = "rgba(255, 255, 255, 0.12)";
  document.querySelector("#todo-list").appendChild(createTodoItem(text));
  input.value = "";
  updateCount();
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#add-btn").addEventListener("click", addTodo);
  document.querySelector("#clear-btn").addEventListener("click", clearDone);
  document.querySelector("#todo-input").addEventListener("keydown", e => {
    if (e.key === "Enter") addTodo();
  });
  updateCount();
});