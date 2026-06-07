// =============================================================
//  VitalDoctor — Cópias de Segurança (do subscritor)
// -------------------------------------------------------------
//  O subscritor pode:
//   • fazer backup MANUAL (descarregar para o dispositivo ou
//     partilhar para Drive / cartão de memória / etc.);
//   • receber um ALERTA quando está na hora de fazer backup;
//   • ativar backup AUTOMÁTICO e escolher de quanto em quanto
//     tempo (manual / sempre que houver algo novo / diário /
//     semanal / a cada N dias).
//
//  Nota honesta: um site não consegue gravar sozinho num
//  ficheiro externo (Drive/cartão) sem um toque do utilizador.
//  Por isso o automático guarda uma cópia LOCAL silenciosa e
//  AVISA para exportar/partilhar com 1 toque quando está na hora.
//  Os dados também estão sempre no Supabase (nuvem).
// =============================================================

const P = "vd:backup:";
const K_PREFS  = P + "prefs";
const K_ESTADO = P + "estado";     // { ultimoBackup, alteracoes }
const K_SNAP   = P + "snapshot";   // última cópia local automática

// Tabelas do subscritor incluídas no backup
export const TABELAS_BACKUP = [
  "pacientes", "consultas", "mapeamento", "relatorios", "respostas_consulta", "agenda",
];

// Opções de frequência (para o subscritor escolher)
export const FREQUENCIAS = [
  { id: "manual",        nome: "Só manual" },
  { id: "alteracao",     nome: "Sempre que houver algo novo" },
  { id: "diario",        nome: "Uma vez por dia",   dias: 1 },
  { id: "semanal",       nome: "Uma vez por semana", dias: 7 },
  { id: "personalizado", nome: "A cada N dias" },
];

const PREFS_DEFEITO = { frequencia: "semanal", dias: 7, lembrar: true, autoSnapshotLocal: true };

function ler(chave, fallback) {
  try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function escrever(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { console.warn(e); }
}

export const lerPrefs   = () => ({ ...PREFS_DEFEITO, ...ler(K_PREFS, {}) });
export const guardarPrefs = (p) => escrever(K_PREFS, { ...lerPrefs(), ...p });
const lerEstado   = () => ler(K_ESTADO, { ultimoBackup: 0, alteracoes: 0 });
const guardarEstado = (e) => escrever(K_ESTADO, e);

// Marcar que houve algo novo (chamar após cada guardar do subscritor)
export function marcarAlteracao() {
  const e = lerEstado(); e.alteracoes = (e.alteracoes || 0) + 1; guardarEstado(e);
}
export const contarAlteracoes = () => lerEstado().alteracoes || 0;

// Quantos dias entre backups, conforme a preferência
export function frequenciaParaDias(prefs = lerPrefs()) {
  if (prefs.frequencia === "personalizado") return Math.max(1, Number(prefs.dias) || 7);
  const f = FREQUENCIAS.find((x) => x.id === prefs.frequencia);
  return f?.dias || null; // null = manual/alteracao (sem contagem de dias)
}

// Está na hora de fazer backup? (para o alerta)
export function backupEmAtraso(prefs = lerPrefs(), estado = lerEstado()) {
  if (prefs.frequencia === "manual") return false;
  if (prefs.frequencia === "alteracao") return (estado.alteracoes || 0) > 0;
  const dias = frequenciaParaDias(prefs);
  if (!dias) return false;
  const passou = Date.now() - (estado.ultimoBackup || 0);
  return passou >= dias * 24 * 60 * 60 * 1000;
}

// Reunir todos os dados do subscritor num objeto
export async function gerarBackup(store, { tabelas = TABELAS_BACKUP, filtro = {} } = {}) {
  const dados = {};
  let total = 0;
  for (const t of tabelas) {
    try { const lista = await store.carregar(t, filtro); dados[t] = lista || []; total += dados[t].length; }
    catch { dados[t] = []; }
  }
  return {
    meta: { app: "VitalDoctor", versao: 1, criadoEm: new Date().toISOString(), registos: total },
    dados,
  };
}

const nomeFicheiro = () => `vitaldoctor-backup-${new Date().toISOString().slice(0, 10)}.json`;

// Descarregar para o dispositivo (browser)
export function descarregar(objeto, nome = nomeFicheiro()) {
  if (typeof document === "undefined") return false;
  const blob = new Blob([JSON.stringify(objeto, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

// Partilhar (Drive, cartão, etc.) via menu de partilha; senão descarrega
export async function partilhar(objeto, nome = nomeFicheiro()) {
  try {
    const ficheiro = new File([JSON.stringify(objeto, null, 2)], nome, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [ficheiro] })) {
      await navigator.share({ files: [ficheiro], title: "Cópia de segurança VitalDoctor" });
      return true;
    }
  } catch (e) { /* cai para descarregar */ }
  return descarregar(objeto, nome);
}

// Restaurar a partir de um ficheiro de backup
export async function importar(file, store) {
  const texto = typeof file === "string" ? file : await file.text();
  const obj = JSON.parse(texto);
  let restaurados = 0;
  for (const [tabela, lista] of Object.entries(obj.dados || {})) {
    for (const registo of lista) { await store.guardar(tabela, registo); restaurados++; }
  }
  return { restaurados, meta: obj.meta };
}

// Registar que um backup externo foi feito (zera o alerta)
export function registarBackupFeito() {
  guardarEstado({ ultimoBackup: Date.now(), alteracoes: 0 });
}

// Cópia LOCAL automática e silenciosa (sempre disponível para restaurar)
export function guardarSnapshotLocal(objeto) { escrever(K_SNAP, objeto); }
export const lerSnapshotLocal = () => ler(K_SNAP, null);

// Backup MANUAL (chamar no botão): gera + partilha + regista
export async function backupManual(store, filtro = {}) {
  const obj = await gerarBackup(store, { filtro });
  guardarSnapshotLocal(obj);
  await partilhar(obj);
  registarBackupFeito();
  return obj.meta;
}

// Iniciar verificação periódica do automático
//   onAtraso(meta) -> a UI mostra o alerta "faça backup" com 1 toque
export function iniciarAutoBackup(store, filtro = {}, { onAtraso, intervaloMin = 60 } = {}) {
  if (typeof window === "undefined") return () => {};
  async function verificar() {
    const prefs = lerPrefs();
    if (!backupEmAtraso(prefs)) return;
    if (prefs.autoSnapshotLocal) {
      const obj = await gerarBackup(store, { filtro });
      guardarSnapshotLocal(obj);                  // cópia local silenciosa
      if (prefs.lembrar && typeof onAtraso === "function") onAtraso(obj.meta);
    }
  }
  verificar();
  const id = setInterval(verificar, intervaloMin * 60 * 1000);
  return () => clearInterval(id); // função para parar
}
