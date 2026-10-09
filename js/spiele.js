document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-spiel");
  const selectHeim = document.getElementById("spiel-heim");
  const selectGast = document.getElementById("spiel-gast");
  const inputHeimTore = document.getElementById("spiel-tore-heim");
  const inputGastTore = document.getElementById("spiel-tore-gast");
  const btnSubmit = document.getElementById("btn-spiel-speichern");
  const btnAbbrechen = document.getElementById("btn-spiel-abbrechen");
  const messageEl = document.getElementById("spiele-message");
  const editingHint = document.getElementById("spiel-editing-hint");
  const listeBody = document.getElementById("spiele-liste-body");
  const emptyEl = document.getElementById("spiele-empty");
  const countEl = document.getElementById("spiele-anzahl");
  const noTeamsEl = document.getElementById("spiele-keine-mannschaften");
  const formPanel = document.getElementById("spiele-form-panel");

  /** @type {string | null} */
  let editingId = null;

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "form-message " + (type === "error" ? "is-error" : "is-ok");
    if (type === "ok") {
      setTimeout(() => {
        messageEl.className = "form-message";
        messageEl.textContent = "";
      }, 2500);
    }
  }

  function fuelleMannschaftsSelects() {
    const teams = TurnierStore.getMannschaften();
    const opts =
      '<option value="">— Mannschaft wählen —</option>' +
      teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("");

    selectHeim.innerHTML = opts;
    selectGast.innerHTML = opts;
  }

  function setEditMode(id) {
    editingId = id;
    if (id) {
      const spiel = TurnierStore.getSpiele().find((s) => s.id === id);
      if (!spiel) {
        setEditMode(null);
        return;
      }
      selectHeim.value = spiel.heimId;
      selectGast.value = spiel.gastId;
      inputHeimTore.value = String(spiel.toreHeim);
      inputGastTore.value = String(spiel.toreGast);
      btnSubmit.textContent = "Ergebnis speichern";
      editingHint.classList.add("is-visible");
      editingHint.textContent = "Bearbeitung: Änderungen am ausgewählten Spiel.";
      btnAbbrechen.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      form.reset();
      btnSubmit.textContent = "Spiel / Ergebnis hinzufügen";
      editingHint.classList.remove("is-visible");
      btnAbbrechen.hidden = true;
    }
  }

  function renderListe() {
    const rows = TurnierStore.getSpieleMitNamen();
    countEl.textContent = String(rows.length);

    if (rows.length === 0) {
      listeBody.replaceChildren();
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;
    listeBody.replaceChildren();

    rows.forEach((s, index) => {
      const tr = document.createElement("tr");

      const tdNr = document.createElement("td");
      tdNr.textContent = String(index + 1);

      const tdTeams = document.createElement("td");
      tdTeams.className = "spiel-teams";
      tdTeams.textContent = `${s.heimName}  vs.  ${s.gastName}`;

      const tdErgebnis = document.createElement("td");
      tdErgebnis.className = "spiel-ergebnis";
      tdErgebnis.textContent = `${s.toreHeim} : ${s.toreGast}`;

      const tdActions = document.createElement("td");
      tdActions.className = "spiel-actions";

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn-small";
      btnEdit.textContent = "Bearbeiten";
      btnEdit.addEventListener("click", () => setEditMode(s.id));

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn-small btn-small--danger";
      btnDel.textContent = "Löschen";
      btnDel.addEventListener("click", () => {
        if (!confirm("Dieses Spiel wirklich löschen?")) return;
        TurnierStore.removeSpiel(s.id);
        if (editingId === s.id) setEditMode(null);
        showMessage("Spiel gelöscht. Tabelle wurde aktualisiert.", "ok");
        render();
      });

      tdActions.append(btnEdit, btnDel);
      tr.append(tdNr, tdTeams, tdErgebnis, tdActions);
      listeBody.appendChild(tr);
    });
  }

  function render() {
    const teams = TurnierStore.getMannschaften();
    const hasTeams = teams.length >= 2;

    noTeamsEl.hidden = hasTeams;
    formPanel.hidden = !hasTeams;

    if (!hasTeams) {
      fuelleMannschaftsSelects();
      renderListe();
      return;
    }

    fuelleMannschaftsSelects();
    if (editingId) {
      const spiel = TurnierStore.getSpiele().find((s) => s.id === editingId);
      if (spiel) {
        selectHeim.value = spiel.heimId;
        selectGast.value = spiel.gastId;
      } else {
        setEditMode(null);
      }
    }
    renderListe();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      heimId: selectHeim.value,
      gastId: selectGast.value,
      toreHeim: inputHeimTore.value,
      toreGast: inputGastTore.value,
    };

    const result = editingId
      ? TurnierStore.updateSpiel(editingId, payload)
      : TurnierStore.addSpiel(payload);

    if (!result.ok) {
      showMessage(result.error, "error");
      return;
    }

    showMessage(
      editingId ? "Ergebnis gespeichert." : "Spiel hinzugefügt. Tabelle wurde aktualisiert.",
      "ok"
    );
    setEditMode(null);
    render();
  });

  btnAbbrechen.addEventListener("click", () => setEditMode(null));

  render();
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
