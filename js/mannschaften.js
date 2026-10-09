document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-mannschaft-neu");
  const inputNeu = document.getElementById("mannschaft-name-neu");
  const liste = document.getElementById("mannschaften-liste");
  const countEl = document.getElementById("mannschaften-anzahl");
  const emptyEl = document.getElementById("mannschaften-empty");
  const messageEl = document.getElementById("mannschaften-message");
  const btnDemo = document.getElementById("btn-demo-laden");
  const btnAlleLoeschen = document.getElementById("btn-alle-loeschen");

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

  function render() {
    const teams = TurnierStore.getMannschaften();
    countEl.textContent = String(teams.length);

    if (teams.length === 0) {
      liste.hidden = true;
      emptyEl.hidden = false;
      return;
    }

    liste.hidden = false;
    emptyEl.hidden = true;
    liste.replaceChildren();

    teams.forEach((team, index) => {
      const li = document.createElement("li");

      const nr = document.createElement("span");
      nr.className = "mannschaften-nr";
      nr.textContent = String(index + 1);

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "mannschaften-name-input";
      nameInput.value = team.name;
      nameInput.setAttribute("aria-label", "Name Mannschaft " + (index + 1));
      nameInput.addEventListener("change", () => {
        const result = TurnierStore.updateMannschaftName(team.id, nameInput.value);
        if (!result.ok) {
          showMessage(result.error, "error");
          nameInput.value = team.name;
          return;
        }
        showMessage("Name gespeichert.", "ok");
        render();
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-icon-delete";
      delBtn.textContent = "Entfernen";
      delBtn.addEventListener("click", () => {
        if (!confirm(`„${team.name}“ wirklich entfernen?`)) return;
        TurnierStore.removeMannschaft(team.id);
        render();
      });

      li.append(nr, nameInput, delBtn);
      liste.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const result = TurnierStore.addMannschaft(inputNeu.value);
    if (!result.ok) {
      showMessage(result.error, "error");
      inputNeu.focus();
      return;
    }
    inputNeu.value = "";
    showMessage("Mannschaft hinzugefügt.", "ok");
    render();
    inputNeu.focus();
  });

  btnDemo.addEventListener("click", () => {
    if (
      TurnierStore.getMannschaften().length > 0 &&
      !confirm("Vorhandene Mannschaften durch Demo-Daten ersetzen?")
    ) {
      return;
    }
    TurnierStore.ladeDemoMannschaften();
    showMessage("Demo-Mannschaften geladen.", "ok");
    render();
  });

  btnAlleLoeschen.addEventListener("click", () => {
    if (TurnierStore.getMannschaften().length === 0) return;
    if (!confirm("Alle Mannschaften wirklich löschen?")) return;
    TurnierStore.setMannschaften([]);
    render();
  });

  window.addEventListener("turnier:geaendert", render);
  window.addEventListener("storage", (e) => {
    if (e.key === "ftv-turnier-v1") render();
  });

  render();
});
