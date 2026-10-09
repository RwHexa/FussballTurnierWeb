/**
 * Turnierdaten: Mannschaften, Spiele/Ergebnisse, Tabellenstatistik (localStorage)
 */
(function (global) {
  const STORAGE_KEY = "ftv-turnier-v1";

  /** @typedef {{
   *   id: string;
   *   name: string;
   *   spiele: number;
   *   siege: number;
   *   unentschieden: number;
   *   niederlagen: number;
   *   toreErzielt: number;
   *   toreErhalten: number;
   *   punkte: number;
   * }} Mannschaft */

  /** @typedef {{
   *   id: string;
   *   heimId: string;
   *   gastId: string;
   *   toreHeim: number;
   *   toreGast: number;
   *   erstelltAm: string;
   * }} Spiel */

  /** @typedef {{ version: number, meta?: object, teams: Mannschaft[], spiele: Spiel[] }} TurnierState */

  function neueId() {
    if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  /** @returns {TurnierState} */
  function leseSpeicher() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 2, meta: {}, teams: [], spiele: [] };
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.teams)) return { version: 2, meta: {}, teams: [], spiele: [] };
      const spiele = Array.isArray(data.spiele) ? data.spiele : [];
      let teams = data.teams;
      const bereinigt = bereinigeSpiele(teams, spiele);
      teams = aktualisiereStatistikAusSpielen(teams, bereinigt);
      const meta = data.meta && typeof data.meta === "object" ? data.meta : {};
      return { version: 2, meta, teams, spiele: bereinigt };
    } catch {
      return { version: 2, meta: {}, teams: [], spiele: [] };
    }
  }

  /** @param {TurnierState} state */
  function schreibeSpeicher(state) {
    const spiele = bereinigeSpiele(state.teams, state.spiele);
    const teams = aktualisiereStatistikAusSpielen(state.teams, spiele);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, meta: state.meta || {}, teams, spiele })
    );
  }

  /** @param {Mannschaft[]} teams @param {Spiel[]} spiele */
  function bereinigeSpiele(teams, spiele) {
    const ids = new Set(teams.map((t) => t.id));
    return spiele.filter(
      (s) =>
        ids.has(s.heimId) &&
        ids.has(s.gastId) &&
        s.heimId !== s.gastId &&
        Number.isFinite(s.toreHeim) &&
        Number.isFinite(s.toreGast)
    );
  }

  /** @param {Mannschaft[]} teams @param {Spiel[]} spiele */
  function aktualisiereStatistikAusSpielen(teams, spiele) {
    /** @type {Map<string, Mannschaft>} */
    const byId = new Map(
      teams.map((t) => [
        t.id,
        {
          ...t,
          spiele: 0,
          siege: 0,
          unentschieden: 0,
          niederlagen: 0,
          toreErzielt: 0,
          toreErhalten: 0,
          punkte: 0,
        },
      ])
    );

    for (const s of spiele) {
      const heim = byId.get(s.heimId);
      const gast = byId.get(s.gastId);
      if (!heim || !gast) continue;

      const th = s.toreHeim;
      const tg = s.toreGast;

      heim.spiele += 1;
      gast.spiele += 1;
      heim.toreErzielt += th;
      heim.toreErhalten += tg;
      gast.toreErzielt += tg;
      gast.toreErhalten += th;

      if (th > tg) {
        heim.siege += 1;
        heim.punkte += 3;
        gast.niederlagen += 1;
      } else if (th < tg) {
        gast.siege += 1;
        gast.punkte += 3;
        heim.niederlagen += 1;
      } else {
        heim.unentschieden += 1;
        gast.unentschieden += 1;
        heim.punkte += 1;
        gast.punkte += 1;
      }
    }

    return teams.map((t) => byId.get(t.id) || t);
  }

  /** @returns {Mannschaft[]} */
  function getMannschaften() {
    return leseSpeicher().teams;
  }

  /** @returns {Spiel[]} */
  function getSpiele() {
    return leseSpeicher().spiele;
  }

  /** @param {Mannschaft[]} teams */
  function setMannschaften(teams) {
    const state = leseSpeicher();
    state.teams = teams;
    if (teams.length === 0) state.spiele = [];
    schreibeSpeicher(state);
  }

  /** @param {string} name */
  function createMannschaft(name) {
    return {
      id: neueId(),
      name: name.trim(),
      spiele: 0,
      siege: 0,
      unentschieden: 0,
      niederlagen: 0,
      toreErzielt: 0,
      toreErhalten: 0,
      punkte: 0,
    };
  }

  /** @param {string} name */
  function addMannschaft(name) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Bitte einen Mannschaftsnamen eingeben." };
    const state = leseSpeicher();
    if (state.teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: "Diese Mannschaft existiert bereits." };
    }
    state.teams.push(createMannschaft(trimmed));
    schreibeSpeicher(state);
    return { ok: true, teams: getMannschaften() };
  }

  /** @param {string} id @param {string} name */
  function updateMannschaftName(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Der Name darf nicht leer sein." };
    const state = leseSpeicher();
    const idx = state.teams.findIndex((t) => t.id === id);
    if (idx === -1) return { ok: false, error: "Mannschaft nicht gefunden." };
    if (
      state.teams.some((t, i) => i !== idx && t.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return { ok: false, error: "Dieser Name ist bereits vergeben." };
    }
    state.teams[idx] = { ...state.teams[idx], name: trimmed };
    schreibeSpeicher(state);
    return { ok: true, teams: getMannschaften() };
  }

  /** @param {string} id */
  function removeMannschaft(id) {
    const state = leseSpeicher();
    state.teams = state.teams.filter((t) => t.id !== id);
    state.spiele = state.spiele.filter((s) => s.heimId !== id && s.gastId !== id);
    schreibeSpeicher(state);
    return getMannschaften();
  }

  function parseTore(value) {
    if (value === "" || value === null || value === undefined) {
      return { ok: false, error: "Bitte Tore für beide Mannschaften eingeben." };
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 99) {
      return { ok: false, error: "Tore müssen ganze Zahlen von 0 bis 99 sein." };
    }
    return { ok: true, value: n };
  }

  /** @param {{ heimId: string, gastId: string, toreHeim: number, toreGast: number }} input */
  function validateSpielInput(input) {
    if (!input.heimId || !input.gastId) {
      return { ok: false, error: "Bitte Heim- und Gastmannschaft wählen." };
    }
    if (input.heimId === input.gastId) {
      return { ok: false, error: "Heim- und Gastmannschaft müssen unterschiedlich sein." };
    }
    const state = leseSpeicher();
    const ids = new Set(state.teams.map((t) => t.id));
    if (!ids.has(input.heimId) || !ids.has(input.gastId)) {
      return { ok: false, error: "Gewählte Mannschaft existiert nicht mehr." };
    }
    const th = parseTore(input.toreHeim);
    if (!th.ok) return th;
    const tg = parseTore(input.toreGast);
    if (!tg.ok) return tg;
    return { ok: true, toreHeim: th.value, toreGast: tg.value };
  }

  /** @param {{ heimId: string, gastId: string, toreHeim: number, toreGast: number }} input */
  function addSpiel(input) {
    const v = validateSpielInput(input);
    if (!v.ok) return v;
    const state = leseSpeicher();
    state.spiele.push({
      id: neueId(),
      heimId: input.heimId,
      gastId: input.gastId,
      toreHeim: v.toreHeim,
      toreGast: v.toreGast,
      erstelltAm: new Date().toISOString(),
    });
    schreibeSpeicher(state);
    return { ok: true, spiele: getSpiele() };
  }

  /** @param {string} id @param {{ heimId: string, gastId: string, toreHeim: number, toreGast: number }} input */
  function updateSpiel(id, input) {
    const v = validateSpielInput(input);
    if (!v.ok) return v;
    const state = leseSpeicher();
    const idx = state.spiele.findIndex((s) => s.id === id);
    if (idx === -1) return { ok: false, error: "Spiel nicht gefunden." };
    state.spiele[idx] = {
      ...state.spiele[idx],
      heimId: input.heimId,
      gastId: input.gastId,
      toreHeim: v.toreHeim,
      toreGast: v.toreGast,
    };
    schreibeSpeicher(state);
    return { ok: true, spiele: getSpiele() };
  }

  /** @param {string} id */
  function removeSpiel(id) {
    const state = leseSpeicher();
    state.spiele = state.spiele.filter((s) => s.id !== id);
    schreibeSpeicher(state);
    return getSpiele();
  }

  function getSpieleMitNamen() {
    const state = leseSpeicher();
    const namen = new Map(state.teams.map((t) => [t.id, t.name]));
    return state.spiele.map((s) => ({
      ...s,
      heimName: namen.get(s.heimId) || "–",
      gastName: namen.get(s.gastId) || "–",
    }));
  }

  /** Demo: nur Mannschaftsnamen, keine vorgefertigten Ergebnisse */
  function ladeDemoMannschaften() {
    const namen = [
      "FC Champions",
      "SV Blau-Weiß",
      "TSV Nord",
      "SC Ried",
      "VfB Altenburg",
      "SG Hoffenheim",
      "FC Linden",
      "SV Eintracht",
      "TuS Germania",
      "FC Waldgrund",
    ];
    const state = leseSpeicher();
    state.teams = namen.map((name) => createMannschaft(name));
    state.spiele = [];
    schreibeSpeicher(state);
    return getMannschaften();
  }

  /* ---------- Tabellenberechnung ---------- */

  /** Sortierte Ligatabelle: Punkte, dann Tordifferenz, dann erzielte Tore, dann Name. */
  function getTabelle() {
    const teams = getMannschaften().map((m) => ({ ...m, tordifferenz: m.toreErzielt - m.toreErhalten }));
    teams.sort((links, rechts) => {
      if (links.punkte !== rechts.punkte) return rechts.punkte - links.punkte;
      if (links.tordifferenz !== rechts.tordifferenz) return rechts.tordifferenz - links.tordifferenz;
      if (links.toreErzielt !== rechts.toreErzielt) return rechts.toreErzielt - links.toreErzielt;
      return links.name.localeCompare(rechts.name, "de");
    });
    return teams.map((m, i) => ({ ...m, platz: i + 1 }));
  }

  /* ---------- Turnier-Metadaten (Name, Datum, Ort) ---------- */

  const META_DEFAULT = { turnierName: "Fußball-Turnier", datum: "", ort: "" };

  /** @returns {{turnierName: string, datum: string, ort: string}} */
  function getMeta() {
    return { ...META_DEFAULT, ...leseSpeicher().meta };
  }

  /** @param {Partial<{turnierName: string, datum: string, ort: string}>} patch */
  function setMeta(patch) {
    const state = leseSpeicher();
    state.meta = { ...getMeta(), ...patch };
    schreibeSpeicher(state);
    return getMeta();
  }

  /* ---------- Export / Import ---------- */

  const EXPORT_APP = "ftv-turnier";

  /** Vollständiger Turnierstand als einfaches Objekt (für JSON-Datei). */
  function exportState() {
    const state = leseSpeicher();
    return {
      app: EXPORT_APP,
      version: 2,
      exportiertAm: new Date().toISOString(),
      meta: { ...META_DEFAULT, ...state.meta },
      teams: state.teams.map((t) => ({ id: t.id, name: t.name })),
      spiele: state.spiele.map((s) => ({
        id: s.id,
        heimId: s.heimId,
        gastId: s.gastId,
        toreHeim: s.toreHeim,
        toreGast: s.toreGast,
        erstelltAm: s.erstelltAm,
      })),
    };
  }

  /** Dateiname-Vorschlag, z. B. "turnier-fussball-turnier-2026-10-09.json" */
  function exportDateiname() {
    const name = getMeta().turnierName || "turnier";
    const slug =
      name
        .toLowerCase()
        .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "turnier";
    const d = new Date();
    const datum =
      d.getFullYear() +
      "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
    return `turnier-${slug}-${datum}.json`;
  }

  /**
   * Prüft und übernimmt einen exportierten Turnierstand.
   * @param {unknown} data Bereits geparstes JSON
   * @returns {{ok: true, teams: Mannschaft[], spiele: Spiel[]} | {ok: false, error: string}}
   */
  function importState(data) {
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Die Datei enthält keine Turnierdaten." };
    }
    if (data.app && data.app !== EXPORT_APP) {
      return { ok: false, error: "Diese Datei stammt nicht aus „Fussball Turnier“." };
    }
    if (!Array.isArray(data.teams)) {
      return { ok: false, error: "In der Datei fehlt die Liste der Mannschaften." };
    }

    /** @type {Mannschaft[]} */
    const teams = [];
    const gesehen = new Set();
    for (const roh of data.teams) {
      if (!roh || typeof roh.name !== "string") continue;
      const name = roh.name.trim();
      if (!name) continue;
      const schluessel = name.toLowerCase();
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      const team = createMannschaft(name);
      if (typeof roh.id === "string" && roh.id) team.id = roh.id;
      teams.push(team);
    }
    if (teams.length === 0) {
      return { ok: false, error: "Die Datei enthält keine gültigen Mannschaften." };
    }

    const idsDoppelt = new Set();
    for (const t of teams) {
      if (idsDoppelt.has(t.id)) t.id = neueId();
      idsDoppelt.add(t.id);
    }

    /** @type {Spiel[]} */
    const spiele = [];
    const rohSpiele = Array.isArray(data.spiele) ? data.spiele : [];
    for (const roh of rohSpiele) {
      if (!roh || typeof roh !== "object") continue;
      const th = Number(roh.toreHeim);
      const tg = Number(roh.toreGast);
      if (!Number.isInteger(th) || !Number.isInteger(tg)) continue;
      if (th < 0 || tg < 0 || th > 99 || tg > 99) continue;
      spiele.push({
        id: typeof roh.id === "string" && roh.id ? roh.id : neueId(),
        heimId: String(roh.heimId),
        gastId: String(roh.gastId),
        toreHeim: th,
        toreGast: tg,
        erstelltAm:
          typeof roh.erstelltAm === "string" ? roh.erstelltAm : new Date().toISOString(),
      });
    }

    const meta = { ...META_DEFAULT };
    if (data.meta && typeof data.meta === "object") {
      for (const key of Object.keys(META_DEFAULT)) {
        if (typeof data.meta[key] === "string") meta[key] = data.meta[key];
      }
    }

    // bereinigeSpiele() in schreibeSpeicher() wirft Spiele ohne gültige Teams raus.
    schreibeSpeicher({ version: 2, meta, teams, spiele });
    return { ok: true, teams: getMannschaften(), spiele: getSpiele() };
  }

  /** Liest eine vom Benutzer gewählte Datei und importiert sie. */
  function importStateAusDatei(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () =>
        resolve({ ok: false, error: "Die Datei konnte nicht gelesen werden." });
      reader.onload = () => {
        let data;
        try {
          data = JSON.parse(String(reader.result));
        } catch {
          return resolve({ ok: false, error: "Die Datei ist kein gültiges JSON." });
        }
        resolve(importState(data));
      };
      reader.readAsText(file, "utf-8");
    });
  }

  global.TurnierStore = {
    getMannschaften,
    getSpiele,
    getSpieleMitNamen,
    setMannschaften,
    addMannschaft,
    updateMannschaftName,
    removeMannschaft,
    addSpiel,
    updateSpiel,
    removeSpiel,
    ladeDemoMannschaften,
    createMannschaft,
    getTabelle,
    getMeta,
    setMeta,
    exportState,
    exportDateiname,
    importState,
    importStateAusDatei,
  };
})(window);
