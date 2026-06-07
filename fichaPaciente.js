// =============================================================
//  VitalDoctor — Ficha do Paciente (anamnese + seguimento)
// -------------------------------------------------------------
//  Perguntas a recolher na ficha / início de qualquer consulta,
//  e cruzamento entre consultas (evolução). Tudo guardado para
//  comparar ao longo do tempo. Nomes neutros.
// =============================================================

// Campos da anamnese inicial (ficha do paciente)
export const ANAMNESE = [
  { id: "foto",        tipo: "foto",  label: "Foto do paciente" },
  {
    id: "medicacao",
    tipo: "lista",
    label: "Medicação atual",
    campos: [
      { id: "nome",     label: "Medicamento" },
      { id: "dose",     label: "Dose" },
      { id: "vezesDia", label: "Vezes por dia" },
    ],
  },
  {
    id: "diagnostico",
    tipo: "lista",
    label: "Diagnósticos / condições",
    campos: [
      { id: "condicao",    label: "Patologia / ansiedade / depressão" },
      { id: "desdeQuando", label: "Desde quando" },
    ],
  },
  { id: "queixaPrincipal", tipo: "texto", label: "Queixa principal" },
  { id: "alergias",        tipo: "texto", label: "Alergias / observações" },
];

// Perguntas de seguimento (2.ª consulta em diante) -> cruzamento
export const PERGUNTAS_SEGUIMENTO = [
  "Está a tomar alguma medicação nova?",
  "Aumentou a dose ou mudou de medicação?",
  "Tem alguma queixa nova?",
  "O que melhorou desde a última consulta?",
  "O que permanece igual?",
];

// -------------------------------------------------------------
//  Cruzamento entre consultas: compara medicação e sinaliza
//  alterações (nova, removida, dose diferente). Útil na evolução.
//  anterior / atual = arrays [{nome,dose,vezesDia}]
// -------------------------------------------------------------
export function compararMedicacao(anterior = [], atual = []) {
  const chave = (m) => (m.nome || "").trim().toLowerCase();
  const mapAnt = new Map(anterior.map((m) => [chave(m), m]));
  const mapAtu = new Map(atual.map((m) => [chave(m), m]));
  const alteracoes = [];

  atual.forEach((m) => {
    const ant = mapAnt.get(chave(m));
    if (!ant) alteracoes.push({ tipo: "nova", medicamento: m.nome });
    else if ((ant.dose || "") !== (m.dose || "") || (ant.vezesDia || "") !== (m.vezesDia || ""))
      alteracoes.push({ tipo: "alterada", medicamento: m.nome, de: `${ant.dose}/${ant.vezesDia}`, para: `${m.dose}/${m.vezesDia}` });
  });
  anterior.forEach((m) => {
    if (!mapAtu.get(chave(m))) alteracoes.push({ tipo: "removida", medicamento: m.nome });
  });
  return alteracoes;
}

// Resumo curto da evolução entre duas consultas (texto)
export function resumoEvolucao(consultaAnterior = {}, consultaAtual = {}) {
  const alt = compararMedicacao(consultaAnterior.medicacao, consultaAtual.medicacao);
  const linhas = [];
  if (alt.length) {
    linhas.push("Alterações de medicação:");
    alt.forEach((a) => {
      if (a.tipo === "nova") linhas.push(`• Nova: ${a.medicamento}`);
      else if (a.tipo === "removida") linhas.push(`• Suspensa: ${a.medicamento}`);
      else linhas.push(`• ${a.medicamento}: ${a.de} → ${a.para}`);
    });
  } else {
    linhas.push("Sem alterações de medicação registadas.");
  }
  if (consultaAtual.queixaNova) linhas.push(`Nova queixa: ${consultaAtual.queixaNova}`);
  return linhas.join("\n");
}
