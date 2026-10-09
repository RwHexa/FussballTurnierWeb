/**
 * Aktuelles Spiel – große Anzeige für Zuschauer.
 * Der Spielstand lebt nur im Arbeitsspeicher und wird bewusst NICHT gespeichert.
 * Erst „Als Ergebnis übernehmen“ schreibt ihn in das Turnier.
 */
document.addEventListener("DOMContentLoaded", () => {
  const selectHeim = document.getElementById("live-heim");
  const selectGast = document.getElementById("live-gast");
  const nameHeim = document.getElementById("live-name-heim");
  const nameGast = document.getElementById("live-name-gast");
  const toreHeimEl = document.getElementById("live-tore-heim");
  const toreGastEl = document.getElementById("live-tore-gast");
  const standEl = document.querySelector(".live-stand");
  const messageEl = document.getElementById("live-message");
  const steuerung = document.getElementById("live-steuerung");
  const hinweisEl = document.getElementById("live-keine-mannschaften");
  const btnVerbergen = document.getElementById("btn-verbergen");
  const btnEinblenden = document.getElementById("btn-einblenden");
  const btnVollbild = document.getElementById("btn-vollbild");
  const btnTauschen = document.getElementById("btn-tauschen");
  const btnZuruecksetzen = document.getElementById("btn-zuruecksetzen");
  const btnUebernehmen = document.getElementById("btn-uebernehmen");
  const uhrEl = document.getElementById("live-uhr");
  const selectNextHeim = document.getElementById("live-next-heim");
  const selectNextGast = document.getElementById("live-next-gast");
  const naechstesEl = document.getElementById("live-naechstes");
  const naechstesTextEl = document.getElementById("live-naechstes-text");
  const btnNextUebernehmen = document.getElementById("btn-next-uebernehmen");
  const btnNextLeeren = document.getElementById("btn-next-leeren");

  /** Flüchtiger Spielstand – absichtlich ohne localStorage. */
  const stand = { heim: 0, gast: 0 };

  let meldungTimer = null;

  function zeigeMeldung(text, typ) {
    messageEl.textContent = text;
    messageEl.className = "live-message " + (typ === "error" ? "is-error" : "is-ok");
    clearTimeout(meldungTimer);
    if (typ === "ok") {
      meldungTimer = setTimeout(() => {
        messageEl.className = "live-message";
        messageEl.textContent = "";
      }, 3000);
    }
  }

  function fuelleAuswahl() {
    const teams = TurnierStore.getMannschaften();
    const genugTeams = teams.length >= 2;

    hinweisEl.hidden = genugTeams;
    steuerung.hidden = !genugTeams;

    const vorherHeim = selectHeim.value;
    const vorherGast = selectGast.value;
    const vorherNextHeim = selectNextHeim.value;
    const vorherNextGast = selectNextGast.value;

    for (const select of [selectHeim, selectGast, selectNextHeim, selectNextGast]) {
      select.replaceChildren();
      // Das naechste Spiel darf offen bleiben, das laufende nicht
      if (select === selectNextHeim || select === selectNextGast) {
        const leer = document.createElement("option");
        leer.value = "";
        leer.textContent = "— offen —";
        select.appendChild(leer);
      }
      for (const t of teams) {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.name;
        select.appendChild(option);
      }
    }

    if (!genugTeams) return;

    // Vorauswahl beibehalten, sonst die ersten beiden Mannschaften
    const ids = teams.map((t) => t.id);
    selectHeim.value = ids.includes(vorherHeim) ? vorherHeim : ids[0];
    selectGast.value = ids.includes(vorherGast) && vorherGast !== selectHeim.value
      ? vorherGast
      : ids.find((id) => id !== selectHeim.value);

    // Beim naechsten Spiel bleibt "offen" stehen, wenn nichts gewaehlt war
    selectNextHeim.value = ids.includes(vorherNextHeim) ? vorherNextHeim : "";
    selectNextGast.value = ids.includes(vorherNextGast) ? vorherNextGast : "";
  }

  function nameVon(select) {
    const option = select.selectedOptions[0];
    return option ? option.textContent : "–";
  }

  function renderNamen() {
    nameHeim.textContent = nameVon(selectHeim);
    nameGast.textContent = nameVon(selectGast);
  }

  /* ---------- Uhr ---------- */

  function renderUhr() {
    const text = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    // nur schreiben, wenn sich die Minute wirklich geaendert hat
    if (uhrEl.textContent !== text) uhrEl.textContent = text;
  }

  /* ---------- Nächstes Spiel ---------- */

  function renderNaechstes() {
    const heim = selectNextHeim.value;
    const gast = selectNextGast.value;
    const vollstaendig = heim && gast && heim !== gast;

    naechstesEl.hidden = !vollstaendig;
    if (!vollstaendig) return;

    naechstesTextEl.textContent = `${nameVon(selectNextHeim)} – ${nameVon(selectNextGast)}`;
  }

  function renderStand(mitPuls) {
    toreHeimEl.textContent = String(stand.heim);
    toreGastEl.textContent = String(stand.gast);
    if (!mitPuls) return;
    standEl.classList.remove("ist-neu");
    void standEl.offsetWidth; // Animation neu starten
    standEl.classList.add("ist-neu");
  }

  function aendereTore(seite, delta) {
    const neu = stand[seite] + delta;
    if (neu < 0 || neu > 99) return;
    stand[seite] = neu;
    renderStand(delta > 0);
  }

  /* ---------- Steuerung ein- und ausblenden ---------- */

  function setSteuerungSichtbar(sichtbar) {
    document.body.classList.toggle("live-ohne-steuerung", !sichtbar);
    btnEinblenden.hidden = sichtbar;
    if (sichtbar) btnVerbergen.focus();
  }

  btnVerbergen.addEventListener("click", () => setSteuerungSichtbar(false));
  btnEinblenden.addEventListener("click", () => setSteuerungSichtbar(true));

  btnVollbild.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      zeigeMeldung("Vollbild hat der Browser abgelehnt – F11 geht immer.", "error");
    }
  });

  /* ---------- Auswahl ---------- */

  selectHeim.addEventListener("change", () => {
    if (selectHeim.value === selectGast.value) {
      const andere = [...selectGast.options].find((o) => o.value !== selectHeim.value);
      if (andere) selectGast.value = andere.value;
    }
    renderNamen();
  });

  selectGast.addEventListener("change", () => {
    if (selectGast.value === selectHeim.value) {
      const andere = [...selectHeim.options].find((o) => o.value !== selectGast.value);
      if (andere) selectHeim.value = andere.value;
    }
    renderNamen();
  });

  // Beim naechsten Spiel darf dieselbe Mannschaft nicht zweimal stehen
  selectNextHeim.addEventListener("change", () => {
    if (selectNextHeim.value && selectNextHeim.value === selectNextGast.value) {
      selectNextGast.value = "";
    }
    renderNaechstes();
  });

  selectNextGast.addEventListener("change", () => {
    if (selectNextGast.value && selectNextGast.value === selectNextHeim.value) {
      selectNextHeim.value = "";
    }
    renderNaechstes();
  });

  function naechstesLeeren() {
    selectNextHeim.value = "";
    selectNextGast.value = "";
    renderNaechstes();
  }

  /** Holt die Paarung von „nächstes Spiel“ nach oben und setzt den Stand auf 0:0. */
  function naechstesHochholen() {
    const heim = selectNextHeim.value;
    const gast = selectNextGast.value;
    if (!heim || !gast || heim === gast) {
      zeigeMeldung("Für das nächste Spiel sind noch keine zwei Mannschaften gewählt.", "error");
      return;
    }
    selectHeim.value = heim;
    selectGast.value = gast;
    stand.heim = 0;
    stand.gast = 0;
    naechstesLeeren();
    renderNamen();
    renderStand(false);
    zeigeMeldung("Nächstes Spiel ist jetzt das laufende Spiel.", "ok");
  }

  btnNextUebernehmen.addEventListener("click", naechstesHochholen);
  btnNextLeeren.addEventListener("click", naechstesLeeren);

  btnTauschen.addEventListener("click", () => {
    const merk = selectHeim.value;
    selectHeim.value = selectGast.value;
    selectGast.value = merk;
    const merkTore = stand.heim;
    stand.heim = stand.gast;
    stand.gast = merkTore;
    renderNamen();
    renderStand(false);
  });

  btnZuruecksetzen.addEventListener("click", () => {
    stand.heim = 0;
    stand.gast = 0;
    renderStand(false);
    zeigeMeldung("Spielstand auf 0 : 0 gesetzt.", "ok");
  });

  btnUebernehmen.addEventListener("click", () => {
    const ergebnis = TurnierStore.addSpiel({
      heimId: selectHeim.value,
      gastId: selectGast.value,
      toreHeim: stand.heim,
      toreGast: stand.gast,
    });
    if (!ergebnis.ok) {
      zeigeMeldung(ergebnis.error, "error");
      return;
    }
    zeigeMeldung(
      `${nameVon(selectHeim)} ${stand.heim} : ${stand.gast} ${nameVon(selectGast)} ist eingetragen – Tabelle aktualisiert.`,
      "ok"
    );
    stand.heim = 0;
    stand.gast = 0;
    renderStand(false);
  });

  /* ---------- Tor-Knöpfe ---------- */

  for (const btn of document.querySelectorAll("[data-tor]")) {
    btn.addEventListener("click", () => aendereTore(btn.dataset.tor, 1));
  }
  for (const btn of document.querySelectorAll("[data-zurueck]")) {
    btn.addEventListener("click", () => aendereTore(btn.dataset.zurueck, -1));
  }

  /* ---------- Tastatur ---------- */

  document.addEventListener("keydown", (e) => {
    const ziel = e.target;
    if (ziel instanceof HTMLSelectElement || ziel instanceof HTMLInputElement) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // e.code statt e.key: unabhängig von Tastaturlayout und Shift-Zeichen
    // (Shift+1 ist "!" auf US-, "!" auf DE-Layout, bei manchen Eingaben aber weiterhin "1").
    const delta = e.shiftKey ? -1 : 1;

    switch (e.code) {
      case "Digit1":
      case "Numpad1":
        aendereTore("heim", delta);
        break;
      case "Digit2":
      case "Numpad2":
        aendereTore("gast", delta);
        break;
      case "KeyH":
        setSteuerungSichtbar(document.body.classList.contains("live-ohne-steuerung"));
        break;
      case "KeyF":
        btnVollbild.click();
        break;
      case "KeyN":
        naechstesHochholen();
        break;
      case "Escape":
        if (document.body.classList.contains("live-ohne-steuerung")) setSteuerungSichtbar(true);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  /* ---------- Start ---------- */

  function neuAufbauen() {
    fuelleAuswahl();
    renderNamen();
    renderNaechstes();
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "ftv-turnier-v1") neuAufbauen();
  });

  neuAufbauen();
  renderStand(false);

  renderUhr();
  setInterval(renderUhr, 1000);
});
