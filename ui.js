function renderSimpleChart(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!data || !data.length) return;

  const maxValue = Math.max(...data.map((d) => d.value));

  data.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const value = document.createElement("div");
    value.className = "bar-label";
    value.style.fontWeight = "700";
    value.textContent = item.value;

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${(item.value / maxValue) * 140 + 20}px`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = item.label;

    wrap.appendChild(value);
    wrap.appendChild(bar);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

function showScreen(screenNumber) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  document.getElementById(`screen-${screenNumber}`).classList.add("active");

  document.querySelectorAll(".step").forEach((step) => step.classList.remove("active"));
  document.querySelector(`.step[data-step="${screenNumber}"]`)?.classList.add("active");
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add("active");
  document.getElementById(`tab-${tabName}`)?.classList.add("active");
}

function openModal() {
  document.getElementById("ai-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("ai-modal").classList.add("hidden");
}