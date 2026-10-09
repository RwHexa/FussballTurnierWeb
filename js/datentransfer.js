/**
 * Turnierstand sichern und laden.
 * Bindet sich an Markup mit data-aktion="export" / data-aktion="import"
 * und ein <input type="file" data-rolle="import-datei">.
 * Nach erfolgreichem Import feuert window das Ereignis "turnier:geaendert".
 */
(function () {
  function zeigeMeldung(text, typ) {
    const ziel = document.querySelector('[data-rolle="transfer-message"]');
    if (!ziel) {
      if (typ === "error") alert(text);
      return;
    }
    ziel.textContent = text;
    ziel.className = "form-message " + (typ === "error" ? "is-error" : "is-ok");
    if (typ === "ok") {
      setTimeout(() => {
        ziel.className = "form-message";
        ziel.textContent = "";
      }, 4000);
    }
  }

  function exportiere() {
    const daten = TurnierStore.exportState();
    if (daten.teams.length === 0) {
      zeigeMeldung("Es gibt noch nichts zu sichern – bitte zuerst Mannschaften anlegen.", "error");
      return;
    }
    const blob = new Blob([JSON.stringify(daten, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = TurnierStore.exportDateiname();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    zeigeMeldung(
      `Turnier gesichert: ${daten.teams.length} Mannschaften, ${daten.spiele.length} Spiele.`,
      "ok"
    );
  }

  async function importiere(file) {
    if (!file) return;
    const vorhanden = TurnierStore.getMannschaften().length;
    if (
      vorhanden > 0 &&
      !confirm(
        `Der aktuelle Stand (${vorhanden} Mannschaften) wird durch die Datei ersetzt. Fortfahren?`
      )
    ) {
      return;
    }
    const ergebnis = await TurnierStore.importStateAusDatei(file);
    if (!ergebnis.ok) {
      zeigeMeldung(ergebnis.error, "error");
      return;
    }
    zeigeMeldung(
      `Turnier geladen: ${ergebnis.teams.length} Mannschaften, ${ergebnis.spiele.length} Spiele.`,
      "ok"
    );
    window.dispatchEvent(new CustomEvent("turnier:geaendert"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btnExport = document.querySelector('[data-aktion="export"]');
    const btnImport = document.querySelector('[data-aktion="import"]');
    const dateiFeld = document.querySelector('[data-rolle="import-datei"]');

    if (btnExport) btnExport.addEventListener("click", exportiere);

    if (btnImport && dateiFeld) {
      btnImport.addEventListener("click", () => dateiFeld.click());
      dateiFeld.addEventListener("change", () => {
        importiere(dateiFeld.files && dateiFeld.files[0]);
        dateiFeld.value = "";
      });
    }
  });
})();
