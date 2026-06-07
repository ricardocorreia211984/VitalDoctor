// =============================================================
//  VitalDoctor — Módulos & Permissões
// -------------------------------------------------------------
//  O superadmin liga/desliga cada módulo por terapeuta.
//  As permissões ficam em profiles.modulos (JSONB no Supabase):
//      { "atendimento": true, "relatorios": true, "modulacao": false }
//
//  Quem não tem o módulo vê a mensagem de subscrição.
//  Nomes 100% neutros.
// =============================================================

export const MODULOS = [
  { id: "pacientes",    nome: "Pacientes",            icone: "👤", descricao: "Fichas e histórico dos pacientes." },
  { id: "agenda",       nome: "Agenda",               icone: "📅", descricao: "Marcações e calendário." },
  { id: "atendimento",  nome: "Atendimento",          icone: "🩺", descricao: "Consulta passo a passo (com ou sem mapeamento)." },
  { id: "questionarios",nome: "Questionários",        icone: "📝", descricao: "Pré, durante e pós-consulta." },
  { id: "relatorios",   nome: "Relatórios",           icone: "📄", descricao: "Geração automática por regras." },
  { id: "mapeamento",   nome: "Mapeamento Energético",icone: "🧭", descricao: "Investigação por sistemas e escudos." },
  // ---- Módulo avançado: atribuído MANUALMENTE pelo superadmin ----
  { id: "modulacao",    nome: "Modulação",            icone: "🎧", descricao: "Conteúdo avançado (áudios).", restrito: true },
];

// Lista visível ao terapeuta (esconde os restritos que ele não tem)
export function modulosVisiveis(profile) {
  return MODULOS.filter((m) => !m.restrito || temModulo(profile, m.id));
}

// O terapeuta tem este módulo ligado?  (superadmin tem sempre tudo)
export function temModulo(profile, moduloId) {
  if (!profile) return false;
  if (profile.role === "superadmin") return true;
  const m = profile.modulos || {};
  return m[moduloId] === true;
}

// O utilizador é admin?
export function ehAdmin(profile) {
  return profile?.role === "superadmin";
}

// Mensagem de subscrição (mostrada quando o módulo está desligado)
export const MSG_SUBSCRICAO =
  "Este módulo não está incluído na sua subscrição. " +
  "Contacte o administrador para ativar o acesso.";
