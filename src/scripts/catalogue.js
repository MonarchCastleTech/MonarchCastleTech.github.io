const search = document.getElementById("catalogue-search"), family = document.getElementById("catalogue-family");
function filter() {
  let visible = 0;
  for (const card of document.querySelectorAll("[data-product-id]")) {
    const match = (card.dataset.search ?? card.textContent).toLowerCase().includes(search?.value.trim().toLowerCase() ?? "") && (!family?.value || card.dataset.family === family.value);
    card.hidden = !match; if (match) visible += 1;
  }
  const count = document.getElementById("catalogue-count"); if (count) count.textContent = visible + " instruments";
}
search?.addEventListener("input", filter); family?.addEventListener("change", filter); if (search || family) filter();
