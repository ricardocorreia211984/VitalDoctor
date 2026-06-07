// =============================================================
//  VitalDoctor — Base de Conhecimento (significados editáveis)
// -------------------------------------------------------------
//  Este ficheiro é a "semente" do conhecimento estruturado.
//  Cada item tem um ID estável para, mais tarde, ser carregado
//  e EDITADO a partir do Supabase (tabela base_conhecimento)
//  pelo superadmin, sem mexer no código.
//
//  REGRA: nomes neutros em todo o conteúdo visível ao utilizador.
//  Nada de marcas, autores ou designações reservadas.
// =============================================================

// -------------------------------------------------------------
// 1) ESCUDOS EMOCIONAIS  (o coração da devolutiva)
//    O escudo com maior pontuação no questionário é o "dominante".
// -------------------------------------------------------------
export const ESCUDOS = [
  {
    id: "desvalorizacao",
    nome: "Desvalorização",
    foco: "vergonha, culpa, baixa autoestima, autossabotagem",
    emocoes: "vergonha, culpa, sentimento de inutilidade, baixa autoestima",
    sentenca: "Não sou suficiente.",
    origem:
      "Forma-se em ambientes de crítica, comparação ou desqualificação. " +
      "A pessoa sente que precisa provar valor o tempo todo.",
    corpo: "ossos, articulações, músculos, sistema cardiovascular, coluna/postura.",
    expressoes: ["Não sou bom o suficiente", "Tenho de provar o meu valor"],
    devolutiva:
      "O padrão indica uma exigência interna constante de provar valor. " +
      "O caminho é resgatar a autoestima e reconhecer conquistas já existentes.",
  },
  {
    id: "desprotecao",
    nome: "Desproteção",
    foco: "vulnerabilidade, insegurança, sensação de estar exposto",
    emocoes: "vulnerabilidade, insegurança, sensação de perigo constante",
    sentenca: "Estou por minha conta.",
    origem:
      "Aparece quando faltou acolhimento, apoio ou cuidado. " +
      "Permanece a sensação de que o mundo é um lugar perigoso.",
    corpo: "sistema imunitário, pele (derme), gânglios, baço, tecido adiposo.",
    expressoes: ["Tenho de me defender sempre", "Não posso confiar em ninguém"],
    devolutiva:
      "O corpo mostra que precisou de se proteger. " +
      "O trabalho é construir segurança interna e permitir-se confiar gradualmente.",
  },
  {
    id: "sobrevivencia",
    nome: "Sobrevivência",
    foco: "escassez, medo de perder tudo, necessidade de controlo",
    emocoes: "medo extremo, urgência, sensação de escassez",
    sentenca: "Não posso relaxar, preciso de sobreviver.",
    origem:
      "Ativa-se em estados de alerta constante (instabilidade material/emocional). " +
      "Mesmo após a ameaça passar, mantém-se o modo de sobrevivência.",
    corpo: "fígado, pâncreas, pulmões, sistema digestivo, tiroide.",
    expressoes: ["Tenho medo de perder tudo", "Preciso de estar no controlo"],
    devolutiva:
      "O sistema permanece em alerta. " +
      "O foco é devolver a sensação de segurança e a possibilidade de descansar.",
  },
  {
    id: "impotencia",
    nome: "Impotência",
    foco: "bloqueio, paralisia, sensação de que nada pode ser feito",
    emocoes: "frustração, paralisia, falta de força perante a vida",
    sentenca: "Não consigo fazer nada.",
    origem:
      "Forma-se quando a pessoa foi impedida de agir, dominada ou humilhada. " +
      "A energia vital retrai-se e perde-se o impulso de transformar.",
    corpo: "músculos, articulações, função reprodutiva, motilidade digestiva.",
    expressoes: ["Não adianta tentar", "Sinto-me travado(a)"],
    devolutiva:
      "Há uma sensação de bloqueio da ação. " +
      "O caminho é recuperar pequenos passos de iniciativa e poder pessoal.",
  },
  {
    id: "perda",
    nome: "Perda / Rejeição",
    foco: "luto, vazio, abandono, rompimentos afetivos",
    emocoes: "tristeza profunda, vazio, abandono, carência afetiva",
    sentenca: "Fui deixado(a)... estou sozinho(a).",
    origem:
      "Forma-se em rompimentos de vínculo (luto, separações, exclusão). " +
      "A pessoa evita vínculos — ou apega-se em excesso por medo de perder.",
    corpo: "pele, sistema nervoso, órgãos dos sentidos, glândulas mamárias.",
    expressoes: ["Perdi uma parte de mim", "Não consigo seguir em frente"],
    devolutiva:
      "Há uma dor de vínculo a ser acolhida. " +
      "O foco é elaborar a perda e reabrir, com segurança, a capacidade de se ligar.",
  },
];

// -------------------------------------------------------------
// 2) QUESTIONÁRIO DOS ESCUDOS (5 blocos x 10 afirmações)
//    Escala por afirmação: 1 = pouco · 2 = às vezes · 3 = muito
//    Soma por bloco -> bloco com maior soma = escudo dominante.
// -------------------------------------------------------------
export const ESCALA_QUESTIONARIO = [
  { valor: 1, rotulo: "Pouco / quase nunca" },
  { valor: 2, rotulo: "Às vezes" },
  { valor: 3, rotulo: "Muito / quase sempre" },
];

export const QUESTIONARIO_ESCUDOS = [
  {
    blocoId: "desvalorizacao",
    titulo: "Bloco 1 — Desvalorização",
    afirmacoes: [
      "Sinto que não sou suficiente.",
      "Critico-me com frequência.",
      "Tenho dificuldade em reconhecer as minhas conquistas.",
      "Comparo-me muito com os outros.",
      "Sinto vergonha de quem sou.",
      "Acho que preciso de provar o meu valor o tempo todo.",
      "Tenho medo de errar e ser julgado(a).",
      "Sinto-me culpado(a) com facilidade.",
      "Desisto por achar que não vou conseguir.",
      "Tenho uma autoimagem negativa.",
    ],
  },
  {
    blocoId: "desprotecao",
    titulo: "Bloco 2 — Desproteção",
    afirmacoes: [
      "Sinto-me vulnerável ou exposto(a).",
      "Tenho necessidade de controlar tudo para me sentir seguro(a).",
      "Não me sinto seguro(a) nem com pessoas próximas.",
      "Tenho dificuldade em confiar plenamente em alguém.",
      "Já me senti completamente desamparado(a).",
      "Evito abrir-me para não ser magoado(a).",
      "Sinto que estou sozinho(a) no mundo.",
      "Sinto que ninguém me entende de verdade.",
      "Já tive de me defender sozinho(a).",
      "Tenho medo de demonstrar fraqueza.",
    ],
  },
  {
    blocoId: "sobrevivencia",
    titulo: "Bloco 3 — Sobrevivência",
    afirmacoes: [
      "Tenho medo constante de perder o que conquistei.",
      "Preocupo-me em excesso com dinheiro ou segurança.",
      "Sinto-me em 'modo de alerta' o tempo todo.",
      "Tenho dificuldade em relaxar, mesmo quando está tudo bem.",
      "Sinto que preciso de estar sempre no controlo.",
      "Já senti que a minha sobrevivência esteve em risco.",
      "Sinto que não posso contar com ninguém.",
      "Sinto-me ameaçado(a) com facilidade.",
      "Tenho crises de ansiedade em momentos de incerteza.",
      "Vivo em piloto automático para dar conta de tudo.",
    ],
  },
  {
    blocoId: "impotencia",
    titulo: "Bloco 4 — Impotência",
    afirmacoes: [
      "Sinto que não tenho poder para mudar a minha vida.",
      "Já me senti preso(a) em situações sem saída.",
      "Quando algo corre mal, fico sem ação.",
      "Sinto que, por mais que tente, nada muda.",
      "Tenho dificuldade em tomar decisões importantes.",
      "Já me senti completamente impotente.",
      "Sinto que as pessoas controlam demasiado a minha vida.",
      "Já desisti de sonhos por achar que não conseguiria.",
      "Sinto-me paralisado(a) pelo medo.",
      "Penso no que poderia ter feito, mas não consigo agir.",
    ],
  },
  {
    blocoId: "perda",
    titulo: "Bloco 5 — Perda / Rejeição",
    afirmacoes: [
      "Carrego dores profundas por pessoas ou situações que perdi.",
      "Sinto um vazio que parece não ter fim.",
      "Tenho dificuldade em desapegar-me do passado.",
      "Não lido bem com despedidas.",
      "Evito apegar-me para não sofrer perdas futuras.",
      "Já perdi alguém ou algo essencial para mim.",
      "Revivo lembranças de pessoas ou momentos que se foram.",
      "Tenho medo de perder quem amo.",
      "Sinto-me rejeitado(a) com facilidade.",
      "Tive experiências marcantes de abandono.",
    ],
  },
];

// -------------------------------------------------------------
// 3) PERGUNTAS DE ABERTURA (recolhidas durante a consulta)
// -------------------------------------------------------------
export const PERGUNTAS_ABERTURA = [
  "Quem é você hoje?",
  "Já passou por isto antes?",
  "Quais foram os 3 momentos mais difíceis da sua vida?",
  "Quantas crises por semana costuma ter?",
  "Quais são os sintomas principais?",
  "O que gostaria que fosse o foco da consulta de hoje?",
];

// -------------------------------------------------------------
// 4) CAMINHOS TERAPÊUTICOS DA CONSULTA
// -------------------------------------------------------------
export const CAMINHOS = [
  {
    id: "consciente",
    nome: "Caminho 1 — Investigação consciente (Escudos)",
    semMapeamento: true,
    indicado: "1ª consulta · quem fala bastante · primeiro contacto com o método",
    passos: [
      "Apresentar os 5 escudos.",
      "Pedir pontuação de 0 a 10 em cada escudo (ou aplicar o questionário).",
      "Deixar a pessoa expressar-se sobre o que sente.",
    ],
  },
  {
    id: "subconsciente",
    nome: "Caminho 2 — Mapeamento Energético",
    semMapeamento: false,
    indicado: "2ª consulta · aceder à raiz profunda do sintoma",
    passos: [
      "Escolher quadrantes: frente / costas / ambos.",
      "Investigar energia vital → zona de impacto → superfície.",
      "Avaliar sistemas: superior → central → inferior.",
      "Identificar escudo ativo e o tempo (transgeracional / gestacional / pós-parto).",
    ],
  },
  {
    id: "estressores",
    nome: "Caminho 3 — Estressores ativos",
    semMapeamento: true,
    indicado: "tratamento contínuo · manutenção · sintomas que se repetem",
    passos: [
      "Quem do convívio atual mais o(a) desestabiliza?",
      "O que essa pessoa faz ou diz que mais o(a) afeta?",
      "Que situações o(a) tiram do foco?",
      "Já existiu alguém no passado com este mesmo papel?",
      "O que essas pessoas tinham em comum?",
    ],
  },
];

// -------------------------------------------------------------
// 5) PONTOS DE MAPEAMENTO
//    O catálogo de pontos vive agora em mapaCorporal.js (mapa novo,
//    por nome de órgão/glândula). Reexportado aqui por compatibilidade.
// -------------------------------------------------------------
export { PONTOS as PONTOS_MAPEAMENTO } from "./mapaCorporal.js";

// -------------------------------------------------------------
// 6) PROTOCOLO PÓS-CONSULTA (configurável)
// -------------------------------------------------------------
export const PROTOCOLO = {
  duracoes: [7, 15],
  componentes: [
    "Áudio de modulação (escudo ativo identificado)",
    "Alimentação consciente (incluir/retirar alimentos)",
    "Exercícios de respiração simples e regulares",
    "Mini plano de autocuidado diário",
  ],
};

// Helper rápido para procurar um escudo pelo id
export const getEscudo = (id) => ESCUDOS.find((e) => e.id === id) || null;
