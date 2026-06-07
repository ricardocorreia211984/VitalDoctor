// =============================================================
//  VitalDoctor — Armazenamento local-first (offline + autosave)
// -------------------------------------------------------------
//  Objetivo: a app funciona online E offline, guarda sozinha, e
//  nada se perde — em qualquer aparelho os dados aparecem porque
//  a fonte de verdade é o Supabase (na nuvem), e o cache local
//  garante o offline + uma fila de envios pendentes que sincroniza
//  assim que volta a haver ligação.
//
//  Uso:
//    import { criarArmazenamento } from "./armazenamento.js";
//    import { supabase } from "./supabaseClient.js"; // o teu cliente
//    const store = criarArmazenamento(supabase);
//    await store.guardar("pacientes", registo);   // upsert + cache + fila
//    const lista = await store.carregar("pacientes", { terapeuta_id });
//    store.iniciarSincronizacao();                // sincroniza ao voltar online
// =============================================================

const PREFIXO = "vd:";                  // namespace no localStorage
const FILA = PREFIXO + "fila";          // fila de envios pendentes
const cacheKey = (tabela) => `${PREFIXO}cache:${tabela}`;

const online = () => (typeof navigator === "undefined" ? true : navigator.onLine);

function lerJSON(chave, fallback) {
  try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function escreverJSON(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { console.warn("storage cheio?", e); }
}

export function criarArmazenamento(supabase) {
  // ---- cache local por tabela (lista de registos) ----
  function cacheLer(tabela) { return lerJSON(cacheKey(tabela), []); }
  function cacheGuardar(tabela, registo) {
    const lista = cacheLer(tabela);
    const i = lista.findIndex((r) => r.id && registo.id && r.id === registo.id);
    if (i >= 0) lista[i] = { ...lista[i], ...registo };
    else lista.push(registo);
    escreverJSON(cacheKey(tabela), lista);
  }

  // ---- fila de envios pendentes (quando offline ou erro) ----
  function filaLer() { return lerJSON(FILA, []); }
  function filaAdicionar(item) { const f = filaLer(); f.push({ ...item, ts: Date.now() }); escreverJSON(FILA, f); }
  function filaGravar(f) { escreverJSON(FILA, f); }

  // ---- GUARDAR (upsert) — otimista, nunca perde ----
  async function guardar(tabela, registo) {
    if (!registo.id) registo.id = (crypto?.randomUUID?.() || `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    cacheGuardar(tabela, registo);                 // 1) guarda já localmente
    if (online() && supabase) {
      try {
        const { error } = await supabase.from(tabela).upsert(registo);
        if (error) throw error;
        return { ok: true, sincronizado: true, registo };
      } catch (e) {
        filaAdicionar({ tabela, registo });         // 2) falhou -> fila
        return { ok: true, sincronizado: false, registo };
      }
    }
    filaAdicionar({ tabela, registo });             // offline -> fila
    return { ok: true, sincronizado: false, registo };
  }

  // ---- CARREGAR — online: BD + atualiza cache; offline: cache ----
  async function carregar(tabela, filtro = {}) {
    if (online() && supabase) {
      try {
        let q = supabase.from(tabela).select("*");
        Object.entries(filtro).forEach(([k, v]) => { q = q.eq(k, v); });
        const { data, error } = await q;
        if (error) throw error;
        escreverJSON(cacheKey(tabela), data || []);
        return data || [];
      } catch (e) { /* cai para o cache */ }
    }
    const lista = cacheLer(tabela);
    return lista.filter((r) => Object.entries(filtro).every(([k, v]) => r[k] === v));
  }

  // ---- SINCRONIZAR a fila pendente ----
  async function sincronizar() {
    if (!online() || !supabase) return { enviados: 0, pendentes: filaLer().length };
    const f = filaLer();
    const restantes = [];
    let enviados = 0;
    for (const item of f) {
      try {
        const { error } = await supabase.from(item.tabela).upsert(item.registo);
        if (error) throw error;
        enviados++;
      } catch (e) { restantes.push(item); }
    }
    filaGravar(restantes);
    return { enviados, pendentes: restantes.length };
  }

  // ---- liga sincronização automática (voltar online + arranque) ----
  function iniciarSincronizacao() {
    if (typeof window === "undefined") return;
    window.addEventListener("online", sincronizar);
    sincronizar();
  }

  return { guardar, carregar, sincronizar, iniciarSincronizacao, _filaLer: filaLer };
}

// -------------------------------------------------------------
//  AUTOSAVE: guarda sozinho enquanto se preenche (com atraso)
//    const autosave = criarAutosave((dados) => store.guardar("consultas", dados), 800);
//    autosave(consultaAtual);  // chamar a cada alteração
// -------------------------------------------------------------
export function criarAutosave(fnGuardar, atrasoMs = 800) {
  let t = null;
  return function (dados) {
    clearTimeout(t);
    t = setTimeout(() => fnGuardar(dados), atrasoMs);
  };
}
