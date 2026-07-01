const weights = {
  country: { political: 0.3, security: 0.35, economic: 0.2, confidence: 0.15 },
  esg: { scale: 0.28, reversibility: 0.28, stakeholder: 0.24, recurrence: 0.2 },
  source: { proximity: 0.3, corroboration: 0.3, timeliness: 0.18, corrections: 0.22 }
};

function value(selector) {
  const el = document.querySelector(selector);
  return el ? Number(el.value) : 0;
}

function scoreWeighted(tool) {
  return Math.round(Object.entries(weights[tool]).reduce((sum, [key, weight]) => {
    return sum + value(`[data-tool="${tool}"][data-key="${key}"]`) * 10 * weight;
  }, 0));
}

function band(score, labels) {
  if (score < 30) return labels[0];
  if (score < 60) return labels[1];
  if (score < 80) return labels[2];
  return labels[3];
}

function renderCountry() {
  const score = scoreWeighted("country");
  document.getElementById("country-output").textContent =
    `Score: ${score} / 100 - ${band(score, ["low", "moderate", "high", "severe"])}`;
}

function renderSupply() {
  const suppliers = Math.min(value('[data-tool="supply"][data-key="suppliers"]'), 50);
  const dependency = value('[data-tool="supply"][data-key="dependency"]');
  const routes = value('[data-tool="supply"][data-key="routes"]') * 10;
  const buffer = Math.min(value('[data-tool="supply"][data-key="buffer"]'), 180);
  const concentration = Math.max(0, 100 - suppliers * 4);
  const bufferOffset = Math.min(35, buffer / 3);
  const score = Math.max(0, Math.round(concentration * 0.25 + dependency * 0.3 + routes * 0.3 - bufferOffset + 20));
  document.getElementById("supply-output").textContent =
    `Exposure: ${band(score, ["low", "moderate", "high", "critical"])} (${score} / 100)`;
}

function renderEsg() {
  const score = scoreWeighted("esg");
  document.getElementById("esg-output").textContent =
    `Severity: ${score} / 100 - ${band(score, ["minor", "material", "major", "critical"])}`;
}

function renderMarket() {
  const checked = [...document.querySelectorAll('[data-tool="market"]')].filter(input => input.checked).length;
  const labels = ["clear", "watch", "cloudy", "storm risk"];
  const state = checked <= 1 ? labels[0] : checked <= 2 ? labels[1] : checked <= 4 ? labels[2] : labels[3];
  document.getElementById("market-output").textContent = `Weather: ${state} (${checked}/5 signals)`;
}

function renderSource() {
  const score = scoreWeighted("source");
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E";
  document.getElementById("source-output").textContent = `Reliability: ${grade} (${score} / 100)`;
}

function renderAll() {
  renderCountry();
  renderSupply();
  renderEsg();
  renderMarket();
  renderSource();
}

document.addEventListener("input", renderAll);
document.addEventListener("change", renderAll);
renderAll();
