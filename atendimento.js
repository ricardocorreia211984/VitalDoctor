// =============================================================
//  VitalDoctor — Fluxo de Atendimento (guia passo-a-passo)
// -------------------------------------------------------------
//  Conhecimento fiel do método, organizado para um assistente
//  simples e intuitivo: escolhe-se o TIPO de atendimento e a app
//  conduz, passo a passo, mesmo quem tem pouca experiência.
//  Tudo editável pelo admin. Nomes neutros.
// =============================================================

import { PERGUNTAS_ABERTURA, CAMINHOS, PROTOCOLO } from "./baseConhecimento.js";

// -------------------------------------------------------------
//  Passos universais de qualquer consulta
//  tipo = identifica o ecrã/componente a mostrar no assistente
// -------------------------------------------------------------
export const PASSOS_CONSULTA = [
  { id: "acolhimento",   tipo: "texto",        titulo: "Acolhimento",
    descricao: "Observe como o paciente chega (corpo, respiração, energia). Se houver tensão, faça respiração guiada. \"Está seguro aqui. Vamos olhar juntos para o que precisa de ser ouvido.\"" },
  { id: "dados",         tipo: "ficha",        titulo: "Dados e ficha",
    descricao: "Nome, idade, data de nascimento, cidade, profissão, quadro clínico e medicação." },
  { id: "perguntas",     tipo: "perguntas",    titulo: "Perguntas de abertura",
    descricao: "As perguntas que abrem o campo emocional.", dados: PERGUNTAS_ABERTURA },
  { id: "caminho",       tipo: "escolha",      titulo: "Escolher o caminho",
    descricao: "Escolha o caminho terapêutico da sessão.", dados: CAMINHOS },
  { id: "mapeamento",    tipo: "mapeamento",   titulo: "Mapeamento energético",
    descricao: "Mapear ponto a ponto: energia vital → zona de impacto → superfície → sistemas → escudo → tempo. Registar o lado e a face de cada ponto." },
  { id: "monitorizacao", tipo: "monitorizacao",titulo: "Monitorização",
    descricao: "Pergunte sempre: como se tem sentido desde o último encontro? Quantas crises esta semana? O que mudou nos sintomas?" },
  { id: "devolutiva",    tipo: "devolutiva",   titulo: "Devolutiva (trazer consciência)",
    descricao: "Entregue com presença: o que o corpo revelou, onde está a ser carregado, que emoção foi contida, quando aconteceu e que padrão se repete." },
  { id: "protocolo",     tipo: "protocolo",    titulo: "Protocolo",
    descricao: "Gerar o protocolo de cura e o plano (7/15 dias).", dados: PROTOCOLO },
];

// -------------------------------------------------------------
//  Tipos de atendimento (as opções que a autora aconselha)
//  passos = ids de PASSOS_CONSULTA, pela ordem
// -------------------------------------------------------------
export const TIPOS_ATENDIMENTO = [
  {
    id: "consulta_unica",
    nome: "Consulta Única",
    indicado: "Quando há só um encontro. Priorizar clareza, resultado e acolhimento.",
    nota: "Paciente ansioso → caminhos rápidos e práticos. Paciente em baixa → acolhimento, micro-metas e leveza.",
    passos: ["acolhimento", "dados", "perguntas", "caminho", "monitorizacao", "devolutiva", "protocolo"],
  },
  {
    id: "mapeamento",
    nome: "Mapeamento Energético",
    indicado: "Aceder à raiz profunda do sintoma (Caminho 2). Pode ser frente, costas ou ambos.",
    passos: ["acolhimento", "dados", "perguntas", "mapeamento", "devolutiva", "protocolo"],
  },
  {
    id: "tratamento_3",
    nome: "Tratamento (3 consultas)",
    indicado: "Estrutura profunda em 3 sessões.",
    subconsultas: [
      { id: "c1", nome: "Consulta 1 — Mente Consciente",
        passos: ["acolhimento", "dados", "perguntas", "caminho", "devolutiva", "protocolo"],
        nota: "Escuta + perguntas + pontuação dos escudos + protocolo de 7 dias (modulação, alimentação, respiração)." },
      { id: "c2", nome: "Consulta 2 — Mapeamento",
        passos: ["acolhimento", "monitorizacao", "mapeamento", "devolutiva", "protocolo"],
        nota: "Rever evolução + mapeamento completo + indicar pontos para 7 ou 15 dias." },
      { id: "c3", nome: "Consulta 3 — Consolidação",
        passos: ["acolhimento", "monitorizacao", "devolutiva"],
        nota: "Checklists para a queixa principal, plano de autocuidado diário e 7 meditações de encerramento." },
    ],
  },
  {
    id: "manutencao",
    nome: "Manutenção (Estressores ativos)",
    indicado: "Tratamento contínuo, sessões de manutenção, sintomas que se repetem (Caminho 3).",
    passos: ["acolhimento", "monitorizacao", "caminho", "devolutiva", "protocolo"],
  },
];

// -------------------------------------------------------------
//  Passo-a-passo do MAPEAMENTO (Caminho 2) — os 4 mapas
//  1) centros vitais  2) pontos de entrada  3) lateralidade
//  4) sistemas (S1→M6)  5) escudo  6) tempo  7) consciência
// -------------------------------------------------------------
export const MAPEAMENTO_PASSOS = [
  { n: 1, titulo: "Mapa 1 — Centros vitais", texto: "Com a mão na orelha (do lado a investigar), apalpar os 7 centros vitais da linha central até sentir a vibração subtil diferente (o ponto que trava)." },
  { n: 2, titulo: "Mapa 2 — Pontos de entrada", texto: "Mover a mão da orelha para o ponto que travou e percorrer os 13 pontos de entrada até voltar a travar. Registar a zona e o lado (direito/esquerdo)." },
  { n: 3, titulo: "Mapa 3 — Lateralidade", texto: "Manter uma mão no ponto que travou e deslocar a outra lentamente à volta do tronco e das pernas (sem os braços) até travar. Escrever o local exato e o lado." },
  { n: 4, titulo: "Mapa 4 — Sistemas", texto: "Manter a mão no ponto da lateralidade e percorrer os sistemas da Epífise (primeiro) à Bexiga (último). Anotar TODOS os pontos encontrados, com lado e face." },
  { n: 5, titulo: "Escudo ativo", texto: "Identificar o escudo do conflito (Desproteção, Desvalorização, Impotência, Sobrevivência, Perda)." },
  { n: 6, titulo: "Tempo do impacto", texto: "Quando aconteceu: transgeracional, gestacional ou pós-parto. Depois afinar a data/geração." },
  { n: 7, titulo: "Consciência", texto: "Trazer ao paciente o que o corpo revelou e iniciar a cura." },
];

// Perguntas de monitorização / evolução (2.ª consulta em diante)
export const MONITORIZACAO = [
  "Desde a última consulta, há algo relevante a registar?",
  "Mudou a medicação? Aumentou, diminuiu ou começou alguma nova?",
  "Como esteve o sono?",
  "Como esteve a energia e a disposição?",
  "Quantas crises teve nesta semana?",
  "O que melhorou nos sintomas? O que permanece igual?",
];

// Helpers
export const getTipoAtendimento = (id) => TIPOS_ATENDIMENTO.find((t) => t.id === id) || null;
export function passosDoTipo(idTipo, idSub = null) {
  const t = getTipoAtendimento(idTipo);
  if (!t) return [];
  const ids = idSub
    ? (t.subconsultas?.find((s) => s.id === idSub)?.passos || [])
    : (t.passos || []);
  return ids.map((pid) => PASSOS_CONSULTA.find((p) => p.id === pid)).filter(Boolean);
}
