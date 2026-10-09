/** Markiert den aktiven Menüpunkt anhand data-page am body */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (!page) return;
  const link = document.querySelector(`.main-nav a[data-nav="${page}"]`);
  if (link) link.classList.add("is-active");
});
