// =============================================================
//  VitalDoctor — Responsabilidade & Avisos
// -------------------------------------------------------------
//  Deixa explícito que a app APOIA e FACILITA o trabalho do
//  profissional e a gestão do negócio/atendimento, mas NÃO
//  substitui conhecimento, formação nem julgamento clínico.
//  A responsabilidade pelo que é indicado é de quem atende.
//
//  Inclui um aviso reforçado para o módulo de Ansiedade e
//  Depressão / Farmácia Natural, com aceitação obrigatória.
//  Nomes neutros.
// =============================================================

// Aviso geral (mostrar no login e junto ao perfil)
export const AVISO_GERAL =
  "O VitalDoctor é uma ferramenta de apoio à gestão do negócio e ao atendimento. " +
  "Não substitui o conhecimento, a formação nem o julgamento clínico do profissional. " +
  "A responsabilidade pelo que é indicado a cada paciente é sempre de quem atende.";

// Aviso reforçado (módulos sensíveis: Ansiedade/Depressão, Farmácia Natural)
export const AVISO_SAUDE = {
  titulo: "Antes de usar este módulo",
  pontos: [
    "Este módulo é um apoio. Não substitui avaliação médica nem acompanhamento adequado.",
    "Confirmo que tenho conhecimento e competência para o que vou indicar.",
    "Comprometo-me a estudar o quadro clínico do paciente e a verificar a compatibilidade e as interações com a medicação em uso.",
    "Assumo total responsabilidade pelo que indico; a app e os seus autores não são responsáveis pelas indicações que eu fizer.",
    "Em caso de sinais de risco, encaminho o paciente para acompanhamento médico/profissional adequado.",
  ],
  rodape:
    "Ao continuar, declaro que li e aceito estas condições e que sou o(a) responsável " +
    "pelas indicações que faço aos meus pacientes.",
};

// ----- Registo de aceitação (por utilizador, persiste) -----
const chave = (uid, mod) => `vd:aceite:${uid || "anon"}:${mod}`;

export function jaAceitou(uid, mod = "saude") {
  try { return localStorage.getItem(chave(uid, mod)) ? true : false; } catch { return false; }
}

export function registarAceite(uid, mod = "saude") {
  try { localStorage.setItem(chave(uid, mod), new Date().toISOString()); } catch {}
  return true;
}

// Opcional: guardar também no Supabase (acompanha o utilizador entre aparelhos)
//   await registarAceiteRemoto(supabase, uid, "saude");
export async function registarAceiteRemoto(supabase, uid, mod = "saude") {
  registarAceite(uid, mod);
  if (!supabase || !uid) return;
  try {
    const { data } = await supabase.from("profiles").select("aceites").eq("id", uid).single();
    const aceites = { ...(data?.aceites || {}), [mod]: new Date().toISOString() };
    await supabase.from("profiles").update({ aceites }).eq("id", uid);
  } catch { /* fica guardado localmente */ }
}
