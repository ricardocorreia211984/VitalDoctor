// =============================================================
//  VitalDoctor — Protocolo de Cura (gerado por REGRAS)
// -------------------------------------------------------------
//  Junta automaticamente, conforme o ESCUDO ativo:
//    • pontos detetados (nome do órgão + lado + face) -> sequência de massagem
//    • passo-a-passo correto da cura
//    • afirmações de libertação + selamento do escudo
//    • áudio de modulação (para dormir) + meditação de 21 dias
//    • modulações adicionais ("medos"), só se necessário
//
//  É o conhecimento estruturado do admin a sair organizado.
//  Tudo editável (tabela base_conhecimento). Nomes 100% neutros.
// =============================================================

import { getEscudo } from "./baseConhecimento.js";
import { sistemaDoPonto, nomePonto, localizacaoMassagem } from "./mapaCorporal.js";

// -------------------------------------------------------------
//  1) Foco / comandos / recomendações por escudo (resumo)
// -------------------------------------------------------------
export const PROTOCOLOS_CURA = {
  impotencia:    { foco: "Recuperar o poder de ação e a iniciativa." },
  desvalorizacao:{ foco: "Resgatar a autoestima e o reconhecimento do valor." },
  desprotecao:   { foco: "Construir segurança interna e a capacidade de confiar." },
  sobrevivencia: { foco: "Sair do estado de alerta e permitir o descanso." },
  perda:         { foco: "Acolher a perda e reabrir, com segurança, a ligação." },
};

// -------------------------------------------------------------
//  2) Afirmações + selamento por escudo (o que MUDA na cura)
//     A estrutura é igual; mudam as emoções nomeadas e o selamento.
//     Texto-semente, totalmente editável pelo admin.
// -------------------------------------------------------------
const GESTO = "(bater no peito esquerdo com a mão 3 vezes e repetir)";
const SELAMENTO = "Está feito, está feito, está feito. Está selado.";

export const AFIRMACOES_ESCUDO = {
  desprotecao: {
    afirmacao:
      "Eu liberto todo o sentimento de DESPROTEÇÃO, injustiça, insegurança, " +
      "acusação e dúvida que estejam bloqueados no meu corpo. Eu liberto todos os " +
      "sentimentos negativos que não me ajudam a evoluir; fica em mim apenas o " +
      "necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!",
    liberacao:
      "Eu comando que toda a sensação de desproteção e vulnerabilidade seja " +
      "libertada gentilmente agora. Eu comando que o meu ser seja preenchido com " +
      "segurança, proteção e confiança. Que assim seja.",
    cura:
      "Eu comando que todas as experiências de desproteção sejam transformadas em " +
      "força interior e segurança. Eu comando que a minha sensação de proteção e " +
      "bem-estar sejam restauradas e reforçadas. Que assim seja.",
  },
  impotencia: {
    afirmacao:
      "Eu liberto todo o sentimento de IMPOTÊNCIA, frustração, paralisia, bloqueio " +
      "e submissão que estejam bloqueados no meu corpo. Fica em mim apenas o " +
      "necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!",
    liberacao:
      "Eu comando que toda a sensação de impotência seja libertada agora. Eu comando " +
      "que o meu ser seja preenchido com força e capacidade de agir. Que assim seja.",
    cura:
      "Eu comando que todas as experiências de bloqueio sejam transformadas em " +
      "iniciativa e poder pessoal. Que assim seja.",
  },
  desvalorizacao: {
    afirmacao:
      "Eu liberto todo o sentimento de DESVALORIZAÇÃO, vergonha, culpa, inutilidade " +
      "e baixa autoestima que estejam bloqueados no meu corpo. Fica em mim apenas o " +
      "necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!",
    liberacao:
      "Eu comando que toda a sensação de desvalorização seja libertada agora. Eu " +
      "comando que o meu ser seja preenchido com valor próprio e respeito. Que assim seja.",
    cura:
      "Eu comando que todas as experiências de desvalorização sejam transformadas em " +
      "autoestima e reconhecimento. Que assim seja.",
  },
  sobrevivencia: {
    afirmacao:
      "Eu liberto todo o sentimento de medo, alerta constante, escassez e ameaça que " +
      "estejam bloqueados no meu corpo. Fica em mim apenas o necessário para o meu " +
      "aprendizado, o resto eu liberto e solto em gratidão!",
    liberacao:
      "Eu comando que todo o estado de alerta seja libertado agora. Eu comando que o " +
      "meu ser seja preenchido com segurança e tranquilidade. Que assim seja.",
    cura:
      "Eu comando que todas as experiências de ameaça sejam transformadas em " +
      "segurança e descanso. Que assim seja.",
  },
  perda: {
    afirmacao:
      "Eu liberto todo o sentimento de PERDA, vazio, abandono, rejeição e tristeza " +
      "que estejam bloqueados no meu corpo. Fica em mim apenas o necessário para o " +
      "meu aprendizado, o resto eu liberto e solto em gratidão!",
    liberacao:
      "Eu comando que toda a dor da perda seja acolhida e libertada gentilmente agora. " +
      "Eu comando que o meu ser seja preenchido com presença e ligação. Que assim seja.",
    cura:
      "Eu comando que todas as experiências de perda sejam transformadas em memória " +
      "serena e abertura ao novo. Que assim seja.",
  },
};

// -------------------------------------------------------------
//  3) Passo-a-passo da cura (ordem CORRIGIDA)
// -------------------------------------------------------------
export const PASSOS_CURA = {
  preparacao: [
    "Beber água, colocar o áudio indicado e iniciar a sequência.",
    "Marcar (fazer um X) sobre cada ponto encontrado.",
  ],
  // Aplicar em CADA ponto, por esta ordem:
  porPonto: [
    "Massajar o ponto com os dedos em formato de pinça (indicador, médio e polegar " +
      "juntos), mentalizando ou dizendo o nome do ponto/órgão/glândula associado e " +
      "massajando em círculo, enquanto faz 3 respirações profundas.",
    "Empurrar os dedos para baixo (desbloquear o sentimento).",
    "Bater duas vezes sobre o ponto.",
  ],
  // Só DEPOIS de todos os pontos:
  final: [
    "Fazer um auto-abraço e respirar fundo.",
    "Repetir a afirmação de libertação do escudo.",
    "Bater no peito 3 vezes e repetir o selamento.",
  ],
};

// Técnica e frequência (genéricas, editáveis)
export const TECNICA_MASSAGEM =
  "Dedos em formato de pinça; movimentos firmes mas não dolorosos, com a intenção " +
  "de desfazer o nó energético, dizendo o nome do ponto e repetindo as afirmações.";

export const FREQUENCIA = {
  7:  "Uma vez por dia, durante 7 dias.",
  15: "Uma vez por dia, durante 15 dias (ao 8.º dia, reforçar com o áudio de modulação).",
};

// -------------------------------------------------------------
//  Programa de MEDITAÇÃO de 21 dias (um áudio por dia), por sexo.
//  Áudios = conteúdo protegido, geridos pelo admin (tabela "audios").
// -------------------------------------------------------------
export const MEDITACAO_21_DIAS = {
  feminino:  { nome: "Programa de meditação · 21 dias (versão feminina)",  dias: 21 },
  masculino: { nome: "Programa de meditação · 21 dias (versão masculina)", dias: 21 },
};

export const CATEGORIAS_MODULACAO = [{ id: "medos", nome: "Modulação dos medos" }];

export const AVISO_ETICO =
  "Esta leitura revela hipóteses emocionais e padrões corporais. " +
  "Não substitui avaliação médica nem fecha diagnóstico clínico.";

// -------------------------------------------------------------
//  Normalizar pontos: aceita
//    "figado"                               (id do ponto)
//    { id:"figado", lado:"direito", face:"frente" }
// -------------------------------------------------------------
function normalizarPontos(mapeamento = []) {
  return mapeamento
    .map((m) => (typeof m === "string" ? { id: m } : { ...m }))
    .map((m) => ({
      id: m.id,
      nome: nomePonto(m.id),
      sistema: m.sistema || sistemaDoPonto(m.id),
      lado: m.lado || "",
      face: m.face || "frente",
    }))
    .filter((m) => m.sistema);
}

// -------------------------------------------------------------
//  SEQUÊNCIA DE MASSAGEM
//  modo: "criadora"  -> junta lados no Superior/Central (repetidos
//                       1x), mão na fonte/nuca do lado dominante;
//                       Inferior por perna (troca a mão).
//        "separados" -> trata cada lado em separado.
// -------------------------------------------------------------
export function gerarSequenciaMassagem(pontos = [], modo = "criadora") {
  const blocos = [];
  const apoio = (lado, face) =>
    `Mão na ${face === "costas" ? "nuca" : "fonte"} do lado ${lado}`;

  // Agrupar por face (uma sessão pode ser frente, costas ou ambas)
  const faces = [...new Set(pontos.map((p) => p.face))];

  faces.forEach((face) => {
    const daFace = pontos.filter((p) => p.face === face);
    const sup = daFace.filter((p) => p.sistema === "Superior");
    const cen = daFace.filter((p) => p.sistema === "Central");
    const inf = daFace.filter((p) => p.sistema === "Inferior");

    if (modo === "separados") {
      // Cada lado tratado separadamente: S -> C -> M desse lado
      ["direito", "esquerdo"].forEach((lado) => {
        const desteLado = daFace.filter((p) => p.lado === lado);
        if (!desteLado.length) return;
        const ordem = { Superior: 0, Central: 1, Inferior: 2 };
        blocos.push({
          face, lado,
          maoApoio: apoio(lado, face),
          pontos: desteLado
            .sort((a, b) => ordem[a.sistema] - ordem[b.sistema])
            .map((p) => ({ id: p.id, nome: p.nome, local: localizacaoMassagem(p.sistema, face) })),
        });
      });
    } else {
      // MODO CRIADORA
      // Superior + Central: juntar lados, repetidos 1x (por código)
      const sc = [...sup, ...cen];
      if (sc.length) {
        const contaDireita = sc.filter((p) => p.lado === "direito").length;
        const contaEsquerda = sc.filter((p) => p.lado === "esquerdo").length;
        const dominante = contaDireita >= contaEsquerda ? "direito" : "esquerdo";
        const vistos = new Set();
        const unicos = sc.filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id)));
        blocos.push({
          face, lado: dominante,
          maoApoio: apoio(dominante, face),
          nota: "Superior + Central juntos; pontos repetidos massajados uma só vez.",
          pontos: unicos.map((p) => ({ id: p.id, nome: p.nome, local: localizacaoMassagem(p.sistema, face) })),
        });
      }
      // Inferior: por perna, trocando a mão de apoio
      ["direito", "esquerdo"].forEach((lado) => {
        const perna = inf.filter((p) => p.lado === lado);
        if (!perna.length) return;
        blocos.push({
          face, lado,
          maoApoio: apoio(lado, face),
          nota: "Trocar a mão de apoio ao mudar de lado.",
          pontos: perna.map((p) => ({ id: p.id, nome: p.nome, local: localizacaoMassagem("Inferior", face) })),
        });
      });
    }
  });

  return blocos;
}

// -------------------------------------------------------------
//  MAPA DIÁRIO de 21 dias
// -------------------------------------------------------------
export function gerarMapaDiario({ sexo = "feminino", meditacoes = [], dias = 21 } = {}) {
  const programa = MEDITACAO_21_DIAS[sexo] || MEDITACAO_21_DIAS.feminino;
  const mapa = [];
  for (let d = 1; d <= dias; d++) {
    const audio = meditacoes.find((m) => Number(m.dia) === d) || meditacoes[d - 1] || null;
    mapa.push({
      dia: d,
      meditacao: audio
        ? { titulo: audio.titulo || `Meditação ${d}`, url: audio.url || "" }
        : { titulo: `Meditação do dia ${d} — a definir pelo administrador`, url: "" },
      massagem: "Massajar os pontos do protocolo.",
    });
  }
  return { programa: programa.nome, sexo, dias, mapa };
}

// -------------------------------------------------------------
//  GERADOR PRINCIPAL
//  respostas = {
//    paciente: { nome },
//    sexo: "feminino" | "masculino",
//    escudo: "desprotecao",            // escudo ativo (ou usa o dominante)
//    protocoloDias: 7 | 15,
//    modo: "criadora" | "separados",
//    mapeamento: [{id:"figado",lado:"direito",face:"frente"}, ...],
//    meditacoes21: [{dia,titulo,url}], // tabela audios (categoria meditacao21 + sexo)
//    modulacaoEscudo: {titulo,url},    // áudio do escudo (para dormir)
//    modulacoesMedos: [{titulo,url}],  // só se necessário
//    incluirMeditacao: true,
//  }
// -------------------------------------------------------------
export function gerarProtocoloCura(respostas = {}, escudoDominante = null) {
  const escudoId = respostas.escudo || escudoDominante;
  const escudo = getEscudo(escudoId);
  const proto = PROTOCOLOS_CURA[escudoId];
  const afir = AFIRMACOES_ESCUDO[escudoId];
  const pontos = normalizarPontos(respostas.mapeamento);
  const dias = respostas.protocoloDias || 7;
  const modo = respostas.modo === "separados" ? "separados" : "criadora";
  const nome = respostas?.paciente?.nome || "o(a) paciente";

  const sexo = respostas.sexo || "feminino";
  const meditacoes = respostas.meditacoes21 || respostas?.audios?.meditacao21 || [];
  const incluirMeditacao = respostas.incluirMeditacao !== false;
  const modulacoesMedos = respostas.modulacoesMedos || [];
  const modulacaoEscudo = respostas.modulacaoEscudo || null;

  const sequencia = gerarSequenciaMassagem(pontos, modo);
  const mapaDiario = incluirMeditacao ? gerarMapaDiario({ sexo, meditacoes, dias: 21 }) : null;

  // ---- Montar texto (markdown simples) ----
  const L = [];
  L.push(`# Protocolo de cura — ${nome}`);
  if (escudo) L.push(`Escudo ativo: **${escudo.nome}**. ${proto?.foco || ""}`);
  L.push(`Modo: ${modo === "criadora" ? "Protocolo da criadora (lados juntos)" : "Lados em separado"}.`);

  L.push(`\n## Preparação`);
  PASSOS_CURA.preparacao.forEach((p) => L.push(`• ${p}`));

  L.push(`\n## Sequência de massagem`);
  sequencia.forEach((b) => {
    L.push(`\n**${b.maoApoio} — face ${b.face}:**`);
    if (b.nota) L.push(`_${b.nota}_`);
    b.pontos.forEach((p) => L.push(`• ${p.nome} — massajar ${p.local}.`));
  });

  L.push(`\n## Em cada ponto (por esta ordem)`);
  PASSOS_CURA.porPonto.forEach((p, i) => L.push(`${i + 1}. ${p}`));

  L.push(`\n## No final`);
  PASSOS_CURA.final.forEach((p) => L.push(`• ${p}`));
  if (afir) {
    L.push(`\n**Afirmação (${escudo?.nome}):** ${afir.afirmacao} ${GESTO}`);
    L.push(`**Selamento:** ${SELAMENTO}`);
    L.push(`\n_Comandos opcionais:_`);
    L.push(`• Libertação: ${afir.liberacao}`);
    L.push(`• Cura: ${afir.cura}`);
  }

  if (modulacaoEscudo) {
    L.push(`\n## Áudio de modulação (ao dormir)`);
    L.push(`• ${modulacaoEscudo.titulo || `Modulação — ${escudo?.nome || "escudo ativo"}`}`);
  }

  if (mapaDiario) {
    L.push(`\n## ${mapaDiario.programa}`);
    L.push("Ouvir, em estado desperto, uma meditação por dia ao longo de 21 dias.");
    L.push(`\n### Mapa diário`);
    mapaDiario.mapa.forEach((d) => L.push(`• Dia ${d.dia}: ${d.meditacao.titulo} + massagem dos pontos.`));
  }

  if (modulacoesMedos.length) {
    L.push(`\n## Modulações adicionais (conforme necessidade)`);
    modulacoesMedos.forEach((m) => L.push(`• ${m.titulo || "Modulação dos medos"}`));
  }

  L.push(`\n## Frequência`);
  L.push(FREQUENCIA[dias] || FREQUENCIA[7]);
  L.push(`\n_${AVISO_ETICO}_`);

  return {
    titulo: `Protocolo de cura — ${nome}`,
    escudo: escudo?.nome || null,
    foco: proto?.foco || null,
    modo,
    sequencia,
    passos: PASSOS_CURA,
    afirmacao: afir?.afirmacao || null,
    selamento: SELAMENTO,
    modulacaoEscudo,
    mapaDiario,
    modulacoesMedos,
    frequencia: FREQUENCIA[dias] || FREQUENCIA[7],
    avisoEtico: AVISO_ETICO,
    texto: L.join("\n"),
  };
}
