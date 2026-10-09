document.addEventListener("DOMContentLoaded", () => {
  const body = document.getElementById("ergebnisse-body");
  const empty = document.getElementById("ergebnisse-empty");
  const count = document.getElementById("ergebnisse-anzahl");
  const noTeams = document.getElementById("ergebnisse-keine-mannschaften");
  const tableWrap = document.getElementById("ergebnisse-table-wrap");

  function render() {
    const teams = TurnierStore.getMannschaften();
    const rows = TurnierStore.getSpieleMitNamen();

    noTeams.hidden = teams.length > 0;
    tableWrap.hidden = teams.length === 0;

    if (teams.length === 0) return;

    count.textContent = String(rows.length);
    body.replaceChildren();

    if (rows.length === 0) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    rows.forEach((s, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td class="spiel-teams">${escapeHtml(s.heimName)}</td>
        <td class="spiel-ergebnis">${s.toreHeim} : ${s.toreGast}</td>
        <td class="spiel-teams">${escapeHtml(s.gastName)}</td>
      `;
      body.appendChild(tr);
    });
  }

  render();
  window.addEventListener("turnier:geaendert", render);
  window.addEventListener("storage", (e) => {
    if (e.key === "ftv-turnier-v1") render();
  });
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
