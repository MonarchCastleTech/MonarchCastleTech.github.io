function readIndexValue(data) {
  return data.composite_index ?? data.composite ?? data.mainIndex ?? data.index ?? data.score ?? null;
}

function readStatus(data) {
  return data.status ?? data.statusLabel ?? data.tier ?? data.classification ?? "LIVE";
}

async function hydratePanel(panel) {
  const url = panel.dataset.dataUrl;
  const valueNode = panel.querySelector("[data-value]");
  const statusNode = panel.querySelector("[data-status]");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const numericValue = Number(readIndexValue(data));
    const hasValue = Number.isFinite(numericValue);
    valueNode.textContent = hasValue ? `${numericValue.toFixed(1)} /10` : "Live";
    statusNode.textContent = readStatus(data);
  } catch {
    valueNode.textContent = "Open";
    statusNode.textContent = "Dashboard available";
  }
}

document.querySelectorAll("[data-live-panel]").forEach((panel) => {
  hydratePanel(panel);
});
