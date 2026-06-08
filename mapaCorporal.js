// =============================================================
//  VitalDoctor — Mapa Corporal (pontos por ÓRGÃO / GLÂNDULA)
// -------------------------------------------------------------
//  Mapa NOVO: cada ponto é identificado pelo nome do órgão ou
//  glândula (não por códigos S/C/M, que eram do mapa antigo).
//  Sistema Superior (9), Central (12), Inferior (6).
//  Cada ponto detetado guarda: id (interno) + lado + face.
//  Tudo editável pelo admin (base_conhecimento, tipo "ponto").
//  Nomes neutros.
// =============================================================

export const LADOS = ["direito", "esquerdo"];
export const FACES = ["frente", "costas"];

// id  = identificador interno (não aparece ao utilizador)
// nome = o que se mostra e se diz na massagem
// escudos = escudo(s) emocional(is) associado(s)
export const PONTOS = [
  // ---------------- SISTEMA SUPERIOR (9) ----------------
  { id: "epifise", codigo: "S1", sistema: "Superior", nome: "Epífise (Pineal)",
    funcao: "Melatonina; ciclo do sono.",
    aspectos: "Perda de sentido existencial, vazio espiritual, descrença no futuro.",
    sintomas: "Insónia, distúrbios do sono, memória e concentração.",
    frase: "Sente que perdeu a conexão com algo maior?",
    escudos: ["perda"] },
  { id: "hipotalamo", codigo: "S2", sistema: "Superior", nome: "Hipotálamo",
    funcao: "Coordena o sistema endócrino e emoções básicas.",
    aspectos: "Ameaça constante, medo do desconhecido, sensação de não dar conta.",
    sintomas: "Fobias, oscilação de humor, ansiedade, psoríase.",
    frase: "Sente que precisa de controlar tudo para se sentir seguro?",
    escudos: ["sobrevivencia", "desprotecao"] },
  { id: "hipofise", codigo: "S3", sistema: "Superior", nome: "Hipófise (Pituitária)",
    funcao: "Regula todas as glândulas endócrinas.",
    aspectos: "Autoimagem distorcida, inferioridade, fuga do protagonismo.",
    sintomas: "Desequilíbrios hormonais, enxaquecas, rinite.",
    frase: "Sente-se capaz de conduzir a sua própria vida?",
    escudos: ["desvalorizacao"] },
  { id: "amigdalas", codigo: "S4", sistema: "Superior", nome: "Amígdalas",
    funcao: "Defesa imunitária; memórias emocionais.",
    aspectos: "Medos antigos mal resolvidos, impotência diante da vida.",
    sintomas: "Dor de garganta, rouquidão, infeções recorrentes.",
    frase: "Há algo que ainda não conseguiu engolir ou expressar?",
    escudos: ["impotencia", "desprotecao"] },
  { id: "paratiroide", codigo: "S5", sistema: "Superior", nome: "Paratiroide",
    funcao: "Regulação do cálcio e equilíbrio mineral.",
    aspectos: "Impotência e urgência diante da vida.",
    sintomas: "Ansiedade com espasmos, fadiga, fibromialgia.",
    frase: "Sente que está a lutar contra o tempo?",
    escudos: ["impotencia"] },
  { id: "timo", codigo: "S6", sistema: "Superior", nome: "Timo",
    funcao: "Maturação do sistema imunitário.",
    aspectos: "Carência de reconhecimento, orgulho ferido, mágoa não curada.",
    sintomas: "Ansiedade, problemas musculares, fadiga.",
    frase: "Está a tentar proteger-se de ser ferido de novo?",
    escudos: ["desvalorizacao", "desprotecao"] },
  { id: "salivares", codigo: "S7", sistema: "Superior", nome: "Glândulas Salivares e Lacrimais",
    funcao: "Lubrificação e expressão emocional.",
    aspectos: "Desgosto pela vida, dificuldade de chorar, sentimentos reprimidos.",
    sintomas: "Olhos secos, boca seca.",
    frase: "Sente que precisa de ser forte e não pode emocionar-se?",
    escudos: ["perda", "desvalorizacao"] },
  { id: "tiroide", codigo: "S8", sistema: "Superior", nome: "Tiroide",
    funcao: "Metabolismo, ação e comunicação.",
    aspectos: "Impotência, dificuldade de se expressar, sensação de pressa.",
    sintomas: "Hipo/hipertiroidismo, variações de peso, cansaço.",
    frase: "Sente que precisa de correr, mas não sabe para onde?",
    escudos: ["impotencia"] },
  { id: "esofago", codigo: "S9", sistema: "Superior", nome: "Esófago",
    funcao: "Canal de passagem do que é ingerido.",
    aspectos: "Situações não digeridas, mágoas entaladas.",
    sintomas: "Refluxo, angústia.",
    frase: "Sente que engole muito para manter a paz?",
    escudos: ["impotencia", "perda"] },

  // ---------------- SISTEMA CENTRAL (12) ----------------
  { id: "vasos", codigo: "C1", sistema: "Central", nome: "Vasos Linfáticos, Artérias e Veias",
    funcao: "Transportam nutrientes, oxigénio e resíduos.",
    aspectos: "Não pertencer, conflitos familiares antigos, mágoas por digerir.",
    sintomas: "Varizes, má circulação, linfedema, infeções recorrentes.",
    frase: "Que pesos tem carregado sozinho(a)?",
    escudos: ["desvalorizacao", "perda"] },
  { id: "intestgrosso", codigo: "C2", sistema: "Central", nome: "Intestino Grosso",
    funcao: "Absorção de água e eliminação de resíduos.",
    aspectos: "Apego ao que já devia ter sido solto, dificuldade em perdoar.",
    sintomas: "Obstipação, diarreia, colite.",
    frase: "Que história já devia ter deixado ir?",
    escudos: ["perda", "impotencia"] },
  { id: "coracao", codigo: "C3", sistema: "Central", nome: "Coração",
    funcao: "Bombeamento sanguíneo.",
    aspectos: "Dificuldade em amar-se, rejeição de si, negação dos sentimentos.",
    sintomas: "Arritmias, taquicardia, palpitações.",
    frase: "Tem-se abandonado para ser amado(a)?",
    escudos: ["desvalorizacao", "perda"] },
  { id: "bronquios", codigo: "C4", sistema: "Central", nome: "Brônquios",
    funcao: "Conduzem o ar até aos pulmões.",
    aspectos: "Conflito de território, ambiente tóxico, medo de pôr limites.",
    sintomas: "Asma, bronquite, sufocamento emocional.",
    frase: "Sente que não tem espaço para ser quem é?",
    escudos: ["desprotecao", "sobrevivencia"] },
  { id: "alveolos", codigo: "C5", sistema: "Central", nome: "Alvéolos Pulmonares",
    funcao: "Troca gasosa — a vida entra e sai.",
    aspectos: "Medo de morrer (real ou simbólico), sensação de vida tirada.",
    sintomas: "Enfisema, angústia intensa.",
    frase: "Viveu algo que o fez sentir que tudo acabou?",
    escudos: ["sobrevivencia", "perda"] },
  { id: "intestdelgado", codigo: "C6", sistema: "Central", nome: "Intestino Delgado",
    funcao: "Absorção de nutrientes essenciais.",
    aspectos: "Dificuldade em absorver o bom, sensação de que nada é suficiente.",
    sintomas: "Má absorção, diarreia crónica, intolerâncias.",
    frase: "O que vive como se nunca fosse o bastante?",
    escudos: ["desvalorizacao", "sobrevivencia"] },
  { id: "baco", codigo: "C7", sistema: "Central", nome: "Baço",
    funcao: "Filtra o sangue, participa na defesa.",
    aspectos: "Cansaço ligado a vínculos familiares, desistência emocional.",
    sintomas: "Aftas, herpes, fadiga, baixa imunidade.",
    frase: "Sente que não tem mais forças para o que esperam de si?",
    escudos: ["impotencia", "desvalorizacao"] },
  { id: "figado", codigo: "C8", sistema: "Central", nome: "Fígado",
    funcao: "Metabolismo e reserva de energia.",
    aspectos: "Raiva, ressentimento, injustiça, traição, preocupação material.",
    sintomas: "Dores abdominais, calor interno, icterícia.",
    frase: "O que sente que lhe roubaram e ainda não superou?",
    escudos: ["sobrevivencia", "impotencia", "perda"] },
  { id: "estomago", codigo: "C9", sistema: "Central", nome: "Estômago",
    funcao: "Início da digestão de alimentos e emoções.",
    aspectos: "Preocupação em excesso, dificuldade em aceitar, sentir-se injustiçado.",
    sintomas: "Gastrite, úlcera, refluxo, náuseas.",
    frase: "O que está a tentar digerir e continua entalado?",
    escudos: ["impotencia", "sobrevivencia"] },
  { id: "duodeno", codigo: "C10", sistema: "Central", nome: "Duodeno",
    funcao: "Continuação da digestão.",
    aspectos: "Frustrações acumuladas, perda de poder pessoal, choques.",
    sintomas: "Fraqueza, hipoglicemia, irritabilidade pós-refeição.",
    frase: "Sente que lhe tiraram algo, sem aviso?",
    escudos: ["impotencia", "perda"] },
  { id: "vesicula", codigo: "C11", sistema: "Central", nome: "Vesícula Biliar",
    funcao: "Armazena bile; digestão de gorduras.",
    aspectos: "Dificuldade em decidir, amargura, aceitar sem questionar.",
    sintomas: "Cólicas biliares, dor lombar alta, gosto amargo.",
    frase: "Que escolha sabe que precisa de fazer, mas adia?",
    escudos: ["impotencia", "desvalorizacao"] },
  { id: "pancreas", codigo: "C12", sistema: "Central", nome: "Pâncreas",
    funcao: "Insulina e enzimas digestivas.",
    aspectos: "Algo essencial tirado, mágoas não ditas, conflito com a doçura da vida.",
    sintomas: "Diabetes, hipoglicemia, lombalgia emocional.",
    frase: "O que o fez perder o gosto pela vida?",
    escudos: ["impotencia", "desvalorizacao", "perda"] },

  // ---------------- SISTEMA INFERIOR (6) ----------------
  { id: "mamarias", codigo: "M1", sistema: "Inferior", nome: "Glândulas Mamárias",
    funcao: "Nutrir e acolher — cuidado materno.",
    aspectos: "Perda de vínculo, sensação de não ser suficiente como cuidador(a).",
    sintomas: "Nódulos, dores no peito, pescoço e ombros.",
    frase: "Sente que perdeu o seu lugar de afeto numa relação?",
    escudos: ["perda", "desvalorizacao"] },
  { id: "uteroprostata", codigo: "M2", sistema: "Inferior", nome: "Útero / Próstata",
    funcao: "Reprodução, identidade sexual, acolhimento da vida.",
    aspectos: "Rejeição afetiva/sexual, conflitos com filhos e lar, perder o território íntimo.",
    sintomas: "Fibromas, infertilidade, prostatite.",
    frase: "Em que momento sentiu que a sua casa interior desmoronou?",
    escudos: ["perda", "desprotecao"] },
  { id: "suprarrenais", codigo: "M3", sistema: "Inferior", nome: "Suprarrenais",
    funcao: "Hormonas do stress e resposta de alerta.",
    aspectos: "Alerta constante, medo de falhar, lutar o tempo todo, exaustão.",
    sintomas: "Cansaço crónico, compulsões, ombro congelado.",
    frase: "Sente que não pode parar, porque tudo depende de si?",
    escudos: ["sobrevivencia", "desprotecao"] },
  { id: "gonadas", codigo: "M4", sistema: "Inferior", nome: "Testículos / Ovários",
    funcao: "Fertilidade e criação.",
    aspectos: "Perdas significativas (filhos, parceiros), sensação de que tudo desmoronou.",
    sintomas: "Dores nas pernas, lombar e ciático, desequilíbrio hormonal.",
    frase: "Perdeu algo ou alguém e sente que não recuperou?",
    escudos: ["perda"] },
  { id: "rins", codigo: "M5", sistema: "Inferior", nome: "Rins",
    funcao: "Filtram líquidos e regulam a pressão.",
    aspectos: "Injustiça, perdas financeiras, impotência, medo de não sustentar a família.",
    sintomas: "Hipertensão, infeções renais, lombalgias, dores nos joelhos.",
    frase: "Qual foi a maior injustiça que ainda carrega?",
    escudos: ["impotencia", "sobrevivencia"] },
  { id: "bexiga", codigo: "M6", sistema: "Inferior", nome: "Bexiga",
    funcao: "Armazena e elimina; liberta o impuro.",
    aspectos: "Perdeu o rumo, conflitos de território e identidade, falta de proteção.",
    sintomas: "Cistites, incontinência, entorses, desequilíbrio de tornozelo.",
    frase: "Sente que perdeu o controlo da sua própria história?",
    escudos: ["desprotecao", "impotencia"] },
];

// Derivados / helpers
export const PONTOS_POR_SISTEMA = {
  Superior: PONTOS.filter((p) => p.sistema === "Superior"),
  Central:  PONTOS.filter((p) => p.sistema === "Central"),
  Inferior: PONTOS.filter((p) => p.sistema === "Inferior"),
};

export const getPonto = (id) => PONTOS.find((p) => p.id === id) || null;
export const nomePonto = (id) => getPonto(id)?.nome || id;
export const codigoPonto = (id) => getPonto(id)?.codigo || "";  // referência interna (não mostrar)
export const temaPonto = (id) => getPonto(id)?.aspectos || "";
export const sistemaDoPonto = (id) => getPonto(id)?.sistema || null;

// Localização da massagem conforme face + sistema
export function localizacaoMassagem(sistema, face) {
  if (face === "costas") {
    if (sistema === "Superior") return "no osso mais saliente da nuca";
    if (sistema === "Central")  return "no osso mais saliente do pescoço";
    return "no local exato (igual à frente)"; // Inferior
  }
  return "no local exato do ponto";
}

// Leitura de lados/face (apoio à devolutiva)
export const LEITURA_LADOS = {
  esquerdo: "Trauma racionalizado (lógica, autocontrolo); tende a ansiedade, insónia, burnout.",
  direito:  "Trauma emocionalizado (sensível, profundo); tende a tristeza, luto, desânimo.",
  frente:   "Como o trauma foi recebido — o impacto sentido na hora.",
  costas:   "Como o trauma foi carregado — o que ficou reprimido depois.",
};

// -------------------------------------------------------------
//  CENTROS VITAIS (Mapa 1) — 7 pontos da linha central.
//  Com a mão na orelha (do lado a investigar), apalpar até sentir
//  a vibração subtil diferente (o ponto que "trava").
// -------------------------------------------------------------
export const CENTROS_VITAIS = [
  { id: "testa",            nome: "Testa",               associada: "conexão, propósito, sentido de vida." },
  { id: "pescoco",          nome: "Pescoço",             associada: "comunicação e expressão." },
  { id: "acima_peito",      nome: "Acima do peito",      associada: "expressão e vínculo afetivo." },
  { id: "peito",            nome: "Peito",               associada: "amor, afeto, perdão." },
  { id: "boca_estomago",    nome: "Boca do estômago",    associada: "autoestima, identidade, poder pessoal." },
  { id: "umbigo",           nome: "Umbigo",              associada: "emoções, vínculos, controlo." },
  { id: "acima_genitalia",  nome: "Acima da genitália",  associada: "segurança, sobrevivência, criatividade." },
];

// -------------------------------------------------------------
//  PONTOS DE ENTRADA (Mapa 2) — 13 (zonas bilaterais contam 2).
//  A partir do centro vital que travou, percorrer estes pontos
//  até voltar a travar. Registar a zona e o lado.
// -------------------------------------------------------------
export const PONTOS_ENTRADA = [
  { id:"topo",    nome:"Topo da cabeça",     bilateral:false, localizacao:"Topo da cabeça, linha central",                   significado:"Conflito existencial / perda de sentido." },
  { id:"ombros",  nome:"Ombros",             bilateral:true,  localizacao:"Ombro — parte superior junto ao pescoço",          significado:"Peso, responsabilidade e culpa. Direito: obrigações externas; esquerdo: emocional." },
  { id:"tronco",  nome:"Laterais do tronco", bilateral:true,  localizacao:"Lateral do tronco ao nível das costelas flutuantes", significado:"Autoproteção e medo de exposição emocional." },
  { id:"maos",    nome:"Mãos",               bilateral:true,  localizacao:"Dorso ou palma da mão",                            significado:"Ação, dar e receber; não conseguir impedir ou segurar." },
  { id:"ancas",   nome:"Ancas / coxas",      bilateral:true,  localizacao:"Parte exterior da anca/coxa, a meia altura",       significado:"Vínculos e movimento; perder o chão nas relações." },
  { id:"joelhos", nome:"Joelhos",            bilateral:true,  localizacao:"Rótula ou parte posterior do joelho",              significado:"Humildade, rendição; orgulho ferido." },
  { id:"pes",     nome:"Pés",                bilateral:true,  localizacao:"Topo do pé ou planta",                             significado:"Caminho, direção, raízes; medo de avançar ou ser tirado do lugar." },
];
// (1 + 2 + 2 + 2 + 2 + 2 + 2 = 13 pontos de entrada)
