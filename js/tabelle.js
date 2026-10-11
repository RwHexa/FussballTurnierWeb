/** Fußball-Tabelle – Daten aus TurnierStore (Mannschaften) */

/** @type {string | null} */
let selectedId = null;

function formatTorverhaeltnis(tordifferenz) {
  return tordifferenz > 0 ? `+${tordifferenz}` : String(tordifferenz);
}

function rankRowClass(platz, total) {
  if (total === 0) return "";
  if (platz === 1) return "rank-1";
  if (platz === 2) return "rank-2";
  if (platz === 3 || platz === 4) return `rank-${platz}`;
  if (platz >= 6) return platz % 2 === 0 ? "rank-zebra-even" : "rank-zebra-odd";
  return "rank-5";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function aktualisiereGridInhalt() {
  const tbody = document.getElementById("tabelle-body");
  if (!tbody) return;

  const zeilen = TurnierStore.getTabelle();
  if (selectedId && !zeilen.some((t) => t.id === selectedId)) selectedId = null;

  tbody.replaceChildren();

  const total = zeilen.length;
  if (total === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" class="tabelle-leer">Keine Mannschaften – bitte unter „Mannschaften“ Teams anlegen.</td>`;
    tbody.appendChild(tr);
    return;
  }

  zeilen.forEach((m) => {
    const tr = document.createElement("tr");
    const classes = [rankRowClass(m.platz, total)];
    if (m.id === selectedId) classes.push("selected");
    tr.className = classes.filter(Boolean).join(" ");

    tr.innerHTML = `
      <td class="col-platz">${m.platz}</td>
      <td class="col-mannschaft">${escapeHtml(m.name)}</td>
      <td>${m.spiele}</td>
      <td>${m.siege}</td>
      <td>${m.unentschieden}</td>
      <td>${m.niederlagen}</td>
      <td>${m.toreErzielt} : ${m.toreErhalten}</td>
      <td>${formatTorverhaeltnis(m.tordifferenz)}</td>
      <td class="col-punkte">${m.punkte}</td>
    `;

    tr.addEventListener("click", () => {
      selectedId = m.id;
      aktualisiereGridInhalt();
    });

    tbody.appendChild(tr);
  });
}

function initTabelle() {
  aktualisiereGridInhalt();

  window.addEventListener("turnier:geaendert", aktualisiereGridInhalt);
  window.addEventListener("storage", (e) => {
    if (e.key === "ftv-turnier-v1") aktualisiereGridInhalt();
  });
  // Zurueck-Knopf: holt der Browser die Seite aus seinem Rueckwaerts-Cache,
  // laufen die Skripte nicht neu an - dann stuende hier die Tabelle von vorhin.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) aktualisiereGridInhalt();
  });
}

document.addEventListener("DOMContentLoaded", initTabelle);
