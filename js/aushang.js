/** Aushang: Turnier-Angaben pflegen und druckfertige Übersicht aufbauen. */
document.addEventListener("DOMContentLoaded", () => {
  const feldName = document.getElementById("feld-turniername");
  const feldOrt = document.getElementById("feld-ort");
  const feldDatum = document.getElementById("feld-datum");
  const btnDrucken = document.getElementById("btn-drucken");

  const titelEl = document.getElementById("aushang-titel");
  const untertitelEl = document.getElementById("aushang-untertitel");
  const tabelleBody = document.getElementById("aushang-tabelle-body");
  const tabelleLeer = document.getElementById("aushang-tabelle-leer");
  const ergebnisseEl = document.getElementById("aushang-ergebnisse");
  const ergebnisseLeer = document.getElementById("aushang-ergebnisse-leer");
  const standEl = document.getElementById("aushang-stand");

  const datumFormat = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /** "2026-07-18" → "Samstag, 18. Juli 2026"; leer/ungültig → "" */
  function formatiereDatum(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "";
    return datumFormat.format(d);
  }

  function zelle(text, klasse) {
    const td = document.createElement("td");
    td.textContent = text;
    if (klasse) td.className = klasse;
    return td;
  }

  function renderKopf() {
    const meta = TurnierStore.getMeta();
    titelEl.textContent = meta.turnierName || "Fußball-Turnier";
    const teile = [meta.ort, formatiereDatum(meta.datum)].filter(Boolean);
    untertitelEl.textContent = teile.join(" · ");
    untertitelEl.hidden = teile.length === 0;
  }

  function renderTabelle() {
    const zeilen = TurnierStore.getTabelle();
    tabelleBody.replaceChildren();
    tabelleLeer.hidden = zeilen.length > 0;

    for (const m of zeilen) {
      const tr = document.createElement("tr");
      if (m.platz <= 3) tr.className = "ist-podest";
      const diff = m.tordifferenz;
      tr.append(
        zelle(String(m.platz), "spalte-platz"),
        zelle(m.name, "spalte-team"),
        zelle(String(m.spiele)),
        zelle(String(m.siege)),
        zelle(String(m.unentschieden)),
        zelle(String(m.niederlagen)),
        zelle(`${m.toreErzielt} : ${m.toreErhalten}`),
        zelle(diff > 0 ? `+${diff}` : String(diff)),
        zelle(String(m.punkte), "spalte-punkte")
      );
      tabelleBody.appendChild(tr);
    }
  }

  function renderErgebnisse() {
    const spiele = TurnierStore.getSpieleMitNamen();
    ergebnisseEl.replaceChildren();
    ergebnisseLeer.hidden = spiele.length > 0;
    ergebnisseEl.hidden = spiele.length === 0;

    for (const s of spiele) {
      const li = document.createElement("li");

      const heim = document.createElement("span");
      heim.className = "ergebnis-heim";
      heim.textContent = s.heimName;

      const tore = document.createElement("span");
      tore.className = "ergebnis-tore";
      tore.textContent = `${s.toreHeim} : ${s.toreGast}`;

      const gast = document.createElement("span");
      gast.className = "ergebnis-gast";
      gast.textContent = s.gastName;

      li.append(heim, tore, gast);
      ergebnisseEl.appendChild(li);
    }
  }

  function renderStand() {
    const jetzt = new Date();
    standEl.textContent =
      "Stand: " +
      jetzt.toLocaleDateString("de-DE") +
      ", " +
      jetzt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
      " Uhr";
  }

  function render() {
    renderKopf();
    renderTabelle();
    renderErgebnisse();
    renderStand();
  }

  function uebernehmeFelder() {
    const meta = TurnierStore.getMeta();
    feldName.value = meta.turnierName;
    feldOrt.value = meta.ort;
    feldDatum.value = meta.datum;
  }

  feldName.addEventListener("input", () => {
    TurnierStore.setMeta({ turnierName: feldName.value });
    renderKopf();
  });
  feldOrt.addEventListener("input", () => {
    TurnierStore.setMeta({ ort: feldOrt.value });
    renderKopf();
  });
  feldDatum.addEventListener("change", () => {
    TurnierStore.setMeta({ datum: feldDatum.value });
    renderKopf();
  });

  btnDrucken.addEventListener("click", () => {
    renderStand();
    window.print();
  });

  window.addEventListener("turnier:geaendert", () => {
    uebernehmeFelder();
    render();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "ftv-turnier-v1") {
      uebernehmeFelder();
      render();
    }
  });

  uebernehmeFelder();
  render();
});
