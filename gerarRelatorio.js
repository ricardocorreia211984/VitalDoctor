// =============================================================
//  VitalDoctor — Motor de Relatórios por REGRAS
// -------------------------------------------------------------
//  NÃO é IA a inventar. É o conhecimento estruturado do admin
//  (baseConhecimento.js) a sair organizado.
//
//  Entra: as respostas guardadas na ficha do paciente.
//  Sai:   um relatório em secções (objeto) + versão em texto.
// =============================================================

import {
  ESCUDOS,
  QUESTIONARIO_ESCUDOS,
  PONTOS_MAPEAMENTO,
  PROTOCOLO,
  getEscudo,
} from "./baseConhecimento.js";

// -------------------------------------------------------------
//  1) Pontuar o questionário -> escudo(s) dominante(s)
//     respostas.questionario = { desvalorizacao:[1,3,2,...], ... }
//     (um array de valores 1-3 por bloco)
// -------------------------------------------------------------
export function pontuarEscudos(questionario = {}) {
  const totais = QUESTIONARIO_ESCUDOS.map((bloco) => {
    const valores = questionario[bloco.blocoId] || [];
    const total = valores.reduce((s, v) => s + (Number(v) || 0), 0);
    return { escudoId: bloco.blocoId, total };
  });
  const ordenado = [...totais].sort((a, b) => b.total - a.total);
  const dominante = ordenado[0] && ordenado[0].total > 0 ? ordenado[0].escudoId : null;
  return { totais, ordenado, dominante };
}

// -------------------------------------------------------------
//  2) Agrupar pontos de mapeamento selecionados por sistema
//     respostas.mapeamento = ["figado", ...] ou [{id,lado,face}, ...]
// -------------------------------------------------------------
function agruparMapeamento(selecionados = []) {
  const ids = selecionados.map((m) => (typeof m === "string" ? m : m.id));
  const pontos = PONTOS_MAPEAMENTO.filter((p) => ids.includes(p.id));
  const porSistema = { Superior: [], Central: [], Inferior: [] };
  pontos.forEach((p) => porSistema[p.sistema]?.push(p));
  // escudo mais frequente entre os pontos mapeados
  const contagem = {};
  pontos.forEach((p) => (p.escudos || []).forEach((e) => (contagem[e] = (contagem[e] || 0) + 1)));
  const escudoMapeamento =
    Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { pontos, porSistema, escudoMapeamento };
}

// -------------------------------------------------------------
//  3) Gerar o relatório completo (por regras)
//
//  respostas = {
//    paciente:     { nome, idade },
//    pre:          { foco, sintomas, crisesSemana },   // questionário pré
//    abertura:     ["resposta1", ...],                  // 6 perguntas
//    caminho:      "consciente" | "subconsciente" | "estressores",
//    questionario: { desvalorizacao:[...], ... },       // escudos
//    mapeamento:   ["figado","coracao"],                // ids dos pontos
//    pos:          { evolucao, observacoes },           // questionário pós
//    protocoloDias:7 | 15,
//  }
// -------------------------------------------------------------
export function gerarRelatorio(respostas = {}) {
  const seccoes = [];
  const nome = respostas?.paciente?.nome || "o(a) paciente";

  // --- Abertura ---
  let abertura = `Relatório de acompanhamento de ${nome}.`;
  if (respostas?.pre?.foco) abertura += ` Foco trazido: ${respostas.pre.foco}.`;
  if (respostas?.pre?.sintomas) abertura += ` Sintomas relatados: ${respostas.pre.sintomas}.`;
  seccoes.push({ titulo: "Abertura", texto: abertura });

  // --- Escudo predominante (questionário) ---
  const { dominante, ordenado } = pontuarEscudos(respostas.questionario);
  if (dominante) {
    const esc = getEscudo(dominante);
    seccoes.push({
      titulo: `Escudo predominante: ${esc.nome}`,
      texto:
        `${esc.devolutiva} ` +
        `Sentença emocional associada: "${esc.sentenca}" ` +
        `Áreas do corpo frequentemente envolvidas: ${esc.corpo}`,
    });
  }

  // --- Mapeamento (Caminho 2) ---
  if (respostas?.mapeamento?.length) {
    const { porSistema, escudoMapeamento } = agruparMapeamento(respostas.mapeamento);
    let texto = "O que o corpo revelou no mapeamento: ";
    ["Superior", "Central", "Inferior"].forEach((sis) => {
      const pts = porSistema[sis];
      if (pts.length) {
        texto += `\n• Sistema ${sis}: ` + pts.map((p) => `${p.nome} — ${p.aspectos}`).join(" ");
      }
    });
    if (escudoMapeamento) {
      const esc = getEscudo(escudoMapeamento);
      texto += `\nPadrão emocional predominante no mapeamento: ${esc.nome}.`;
    }
    seccoes.push({ titulo: "Leitura do mapeamento", texto });
  }

  // --- Estressores (Caminho 3) ---
  if (respostas?.caminho === "estressores" && respostas?.abertura?.length) {
    seccoes.push({
      titulo: "Estressores ativos",
      texto:
        "Foram identificados padrões de repetição em vínculos e situações atuais. " +
        "Reconhecer o padrão permite ajustar a rotina emocional: repetir as mesmas " +
        "atitudes tende a trazer os mesmos resultados.",
    });
  }

  // --- Evolução (questionário pós) ---
  if (respostas?.pos?.evolucao) {
    seccoes.push({ titulo: "Evolução desde o último encontro", texto: respostas.pos.evolucao });
  }

  // --- Protocolo recomendado ---
  const dias = respostas?.protocoloDias || PROTOCOLO.duracoes[0];
  seccoes.push({
    titulo: `Protocolo recomendado (${dias} dias)`,
    texto: PROTOCOLO.componentes.map((c) => `• ${c}`).join("\n"),
  });

  // --- Encerramento ---
  seccoes.push({
    titulo: "Encerramento",
    texto:
      "Este relatório reúne, de forma organizada, o que foi observado durante o " +
      "acompanhamento. Serve de base para a evolução e o cruzamento entre consultas.",
  });

  const texto = seccoes.map((s) => `## ${s.titulo}\n${s.texto}`).join("\n\n");
  return { titulo: `Relatório — ${nome}`, seccoes, texto, escudoDominante: dominante, ranking: ordenado };
}
