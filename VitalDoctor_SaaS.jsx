import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── INLINED: mapaCorporal.js ───
const LADOS = ["direito", "esquerdo"];
const FACES = ["frente", "costas"];

const PONTOS = [
  { id: "epifise", codigo: "S1", sistema: "Superior", nome: "Epífise (Pineal)", funcao: "Melatonina; ciclo do sono.", aspectos: "Perda de sentido existencial, vazio espiritual, descrença no futuro.", sintomas: "Insónia, distúrbios do sono, memória e concentração.", frase: "Sente que perdeu a conexão com algo maior?", escudos: ["perda"] },
  { id: "hipotalamo", codigo: "S2", sistema: "Superior", nome: "Hipotálamo", funcao: "Coordena o sistema endócrino e emoções básicas.", aspectos: "Ameaça constante, medo do desconhecido, sensação de não dar conta.", sintomas: "Fobias, oscilação de humor, ansiedade, psoríase.", frase: "Sente que precisa de controlar tudo para se sentir seguro?", escudos: ["sobrevivencia", "desprotecao"] },
  { id: "hipofise", codigo: "S3", sistema: "Superior", nome: "Hipófise (Pituitária)", funcao: "Regula todas as glândulas endócrinas.", aspectos: "Autoimagem distorcida, inferioridade, fuga do protagonismo.", sintomas: "Desequilíbrios hormonais, enxaquecas, rinite.", frase: "Sente-se capaz de conduzir a sua própria vida?", escudos: ["desvalorizacao"] },
  { id: "amigdalas", codigo: "S4", sistema: "Superior", nome: "Amígdalas", funcao: "Defesa imunitária; memórias emocionais.", aspectos: "Medos antigos mal resolvidos, impotência diante da vida.", sintomas: "Dor de garganta, rouquidão, infeções recorrentes.", frase: "Há algo que ainda não conseguiu engolir ou expressar?", escudos: ["impotencia", "desprotecao"] },
  { id: "paratiroide", codigo: "S5", sistema: "Superior", nome: "Paratiroide", funcao: "Regulação do cálcio e equilíbrio mineral.", aspectos: "Impotência e urgência diante da vida.", sintomas: "Ansiedade com espasmos, fadiga, fibromialgia.", frase: "Sente que está a lutar contra o tempo?", escudos: ["impotencia"] },
  { id: "timo", codigo: "S6", sistema: "Superior", nome: "Timo", funcao: "Maturação do sistema imunitário.", aspectos: "Carência de reconhecimento, orgulho ferido, mágoa não curada.", sintomas: "Ansiedade, problemas musculares, fadiga.", frase: "Está a tentar proteger-se de ser ferido de novo?", escudos: ["desvalorizacao", "desprotecao"] },
  { id: "salivares", codigo: "S7", sistema: "Superior", nome: "Glândulas Salivares e Lacrimais", funcao: "Lubrificação e expressão emocional.", aspectos: "Desgosto pela vida, dificuldade de chorar, sentimentos reprimidos.", sintomas: "Olhos secos, boca seca.", frase: "Sente que precisa de ser forte e não pode emocionar-se?", escudos: ["perda", "desvalorizacao"] },
  { id: "tiroide", codigo: "S8", sistema: "Superior", nome: "Tiroide", funcao: "Metabolismo, ação e comunicação.", aspectos: "Impotência, dificuldade de se expressar, sensação de pressa.", sintomas: "Hipo/hipertiroidismo, variações de peso, cansaço.", frase: "Sente que precisa de correr, mas não sabe para onde?", escudos: ["impotencia"] },
  { id: "esofago", codigo: "S9", sistema: "Superior", nome: "Esófago", funcao: "Canal de passagem do que é ingerido.", aspectos: "Situações não digeridas, mágoas entaladas.", sintomas: "Refluxo, angústia.", frase: "Sente que engole muito para manter a paz?", escudos: ["impotencia", "perda"] },
  { id: "vasos", codigo: "C1", sistema: "Central", nome: "Vasos Linfáticos, Artérias e Veias", funcao: "Transportam nutrientes, oxigénio e resíduos.", aspectos: "Não pertencer, conflitos familiares antigos, mágoas por digerir.", sintomas: "Varizes, má circulação, linfedema, infeções recorrentes.", frase: "Que pesos tem carregado sozinho(a)?", escudos: ["desvalorizacao", "perda"] },
  { id: "intestgrosso", codigo: "C2", sistema: "Central", nome: "Intestino Grosso", funcao: "Absorção de água e eliminação de resíduos.", aspectos: "Apego ao que já devia ter sido solto, dificuldade em perdoar.", sintomas: "Obstipação, diarreia, colite.", frase: "Que história já devia ter deixado ir?", escudos: ["perda", "impotencia"] },
  { id: "coracao", codigo: "C3", sistema: "Central", nome: "Coração", funcao: "Bombeamento sanguíneo.", aspectos: "Dificuldade em amar-se, rejeição de si, negação dos sentimentos.", sintomas: "Arritmias, taquicardia, palpitações.", frase: "Tem-se abandonado para ser amado(a)?", escudos: ["desvalorizacao", "perda"] },
  { id: "bronquios", codigo: "C4", sistema: "Central", nome: "Brônquios", funcao: "Conduzem o ar até aos pulmões.", aspectos: "Conflito de território, ambiente tóxico, medo de pôr limites.", sintomas: "Asma, bronquite, sufocamento emocional.", frase: "Sente que não tem espaço para ser quem é?", escudos: ["desprotecao", "sobrevivencia"] },
  { id: "alveolos", codigo: "C5", sistema: "Central", nome: "Alvéolos Pulmonares", funcao: "Troca gasosa — a vida entra e sai.", aspectos: "Medo de morrer (real ou simbólico), sensação de vida tirada.", sintomas: "Enfisema, angústia intensa.", frase: "Viveu algo que o fez sentir que tudo acabou?", escudos: ["sobrevivencia", "perda"] },
  { id: "intestdelgado", codigo: "C6", sistema: "Central", nome: "Intestino Delgado", funcao: "Absorção de nutrientes essenciais.", aspectos: "Dificuldade em absorver o bom, sensação de que nada é suficiente.", sintomas: "Má absorção, diarreia crónica, intolerâncias.", frase: "O que vive como se nunca fosse o bastante?", escudos: ["desvalorizacao", "sobrevivencia"] },
  { id: "baco", codigo: "C7", sistema: "Central", nome: "Baço", funcao: "Filtra o sangue, participa na defesa.", aspectos: "Cansaço ligado a vínculos familiares, desistência emocional.", sintomas: "Aftas, herpes, fadiga, baixa imunidade.", frase: "Sente que não tem mais forças para o que esperam de si?", escudos: ["impotencia", "desvalorizacao"] },
  { id: "figado", codigo: "C8", sistema: "Central", nome: "Fígado", funcao: "Metabolismo e reserva de energia.", aspectos: "Raiva, ressentimento, injustiça, traição, preocupação material.", sintomas: "Dores abdominais, calor interno, icterícia.", frase: "O que sente que lhe roubaram e ainda não superou?", escudos: ["sobrevivencia", "impotencia", "perda"] },
  { id: "estomago", codigo: "C9", sistema: "Central", nome: "Estômago", funcao: "Início da digestão de alimentos e emoções.", aspectos: "Preocupação em excesso, dificuldade em aceitar, sentir-se injustiçado.", sintomas: "Gastrite, úlcera, refluxo, náuseas.", frase: "O que está a tentar digerir e continua entalado?", escudos: ["impotencia", "sobrevivencia"] },
  { id: "duodeno", codigo: "C10", sistema: "Central", nome: "Duodeno", funcao: "Continuação da digestão.", aspectos: "Frustrações acumuladas, perda de poder pessoal, choques.", sintomas: "Fraqueza, hipoglicemia, irritabilidade pós-refeição.", frase: "Sente que lhe tiraram algo, sem aviso?", escudos: ["impotencia", "perda"] },
  { id: "vesicula", codigo: "C11", sistema: "Central", nome: "Vesícula Biliar", funcao: "Armazena bile; digestão de gorduras.", aspectos: "Dificuldade em decidir, amargura, aceitar sem questionar.", sintomas: "Cólicas biliares, dor lombar alta, gosto amargo.", frase: "Que escolha sabe que precisa de fazer, mas adia?", escudos: ["impotencia", "desvalorizacao"] },
  { id: "pancreas", codigo: "C12", sistema: "Central", nome: "Pâncreas", funcao: "Insulina e enzimas digestivas.", aspectos: "Algo essencial tirado, mágoas não ditas, conflito com a doçura da vida.", sintomas: "Diabetes, hipoglicemia, lombalgia emocional.", frase: "O que o fez perder o gosto pela vida?", escudos: ["impotencia", "desvalorizacao", "perda"] },
  { id: "mamarias", codigo: "M1", sistema: "Inferior", nome: "Glândulas Mamárias", funcao: "Nutrir e acolher — cuidado materno.", aspectos: "Perda de vínculo, sensação de não ser suficiente como cuidador(a).", sintomas: "Nódulos, dores no peito, pescoço e ombros.", frase: "Sente que perdeu o seu lugar de afeto numa relação?", escudos: ["perda", "desvalorizacao"] },
  { id: "uteroprostata", codigo: "M2", sistema: "Inferior", nome: "Útero / Próstata", funcao: "Reprodução, identidade sexual, acolhimento da vida.", aspectos: "Rejeição afetiva/sexual, conflitos com filhos e lar, perder o território íntimo.", sintomas: "Fibromas, infertilidade, prostatite.", frase: "Em que momento sentiu que a sua casa interior desmoronou?", escudos: ["perda", "desprotecao"] },
  { id: "suprarrenais", codigo: "M3", sistema: "Inferior", nome: "Suprarrenais", funcao: "Hormonas do stress e resposta de alerta.", aspectos: "Alerta constante, medo de falhar, lutar o tempo todo, exaustão.", sintomas: "Cansaço crónico, compulsões, ombro congelado.", frase: "Sente que não pode parar, porque tudo depende de si?", escudos: ["sobrevivencia", "desprotecao"] },
  { id: "gonadas", codigo: "M4", sistema: "Inferior", nome: "Testículos / Ovários", funcao: "Fertilidade e criação.", aspectos: "Perdas significativas (filhos, parceiros), sensação de que tudo desmoronou.", sintomas: "Dores nas pernas, lombar e ciático, desequilíbrio hormonal.", frase: "Perdeu algo ou alguém e sente que não recuperou?", escudos: ["perda"] },
  { id: "rins", codigo: "M5", sistema: "Inferior", nome: "Rins", funcao: "Filtram líquidos e regulam a pressão.", aspectos: "Injustiça, perdas financeiras, impotência, medo de não sustentar a família.", sintomas: "Hipertensão, infeções renais, lombalgias, dores nos joelhos.", frase: "Qual foi a maior injustiça que ainda carrega?", escudos: ["impotencia", "sobrevivencia"] },
  { id: "bexiga", codigo: "M6", sistema: "Inferior", nome: "Bexiga", funcao: "Armazena e elimina; liberta o impuro.", aspectos: "Perdeu o rumo, conflitos de território e identidade, falta de proteção.", sintomas: "Cistites, incontinência, entorses, desequilíbrio de tornozelo.", frase: "Sente que perdeu o controlo da sua própria história?", escudos: ["desprotecao", "impotencia"] },
];

const PONTOS_POR_SISTEMA = {
  Superior: PONTOS.filter(p => p.sistema === "Superior"),
  Central: PONTOS.filter(p => p.sistema === "Central"),
  Inferior: PONTOS.filter(p => p.sistema === "Inferior"),
};
const getPonto = (id) => PONTOS.find(p => p.id === id) || null;
const nomePonto = (id) => getPonto(id)?.nome || id;
const sistemaDoPonto = (id) => getPonto(id)?.sistema || null;
function localizacaoMassagem(sistema, face) {
  if (face === "costas") {
    if (sistema === "Superior") return "no osso mais saliente da nuca";
    if (sistema === "Central") return "no osso mais saliente do pescoço";
    return "no local exato (igual à frente)";
  }
  return "no local exato do ponto";
}
const LEITURA_LADOS = {
  esquerdo: "Trauma racionalizado (lógica, autocontrolo); tende a ansiedade, insónia, burnout.",
  direito: "Trauma emocionalizado (sensível, profundo); tende a tristeza, luto, desânimo.",
  frente: "Como o trauma foi recebido — o impacto sentido na hora.",
  costas: "Como o trauma foi carregado — o que ficou reprimido depois.",
};
const CENTROS_VITAIS = [
  { id: "testa", nome: "Testa", associada: "conexão, propósito, sentido de vida." },
  { id: "pescoco", nome: "Pescoço", associada: "comunicação e expressão." },
  { id: "acima_peito", nome: "Acima do peito", associada: "expressão e vínculo afetivo." },
  { id: "peito", nome: "Peito", associada: "amor, afeto, perdão." },
  { id: "boca_estomago", nome: "Boca do estômago", associada: "autoestima, identidade, poder pessoal." },
  { id: "umbigo", nome: "Umbigo", associada: "emoções, vínculos, controlo." },
  { id: "acima_genitalia", nome: "Acima da genitália", associada: "segurança, sobrevivência, criatividade." },
];
const PONTOS_ENTRADA = [
  { id: "coroa",   nome: "Coroa (Topo da cabeça)", bilateral: false, lados: ["centro"], localizacao: "Topo da cabeça, linha central", significado: "Conflito existencial / perda de sentido de vida." },
  { id: "ombros",  nome: "Ombros",      bilateral: true, lados: ["direito","esquerdo"], localizacao: "Ombro — parte superior junto ao pescoço", significado: "Peso, responsabilidade e culpa. Direito: obrigações externas; esquerdo: emocional." },
  { id: "costelas",nome: "Costelas",    bilateral: true, lados: ["direita","esquerda"], localizacao: "Lateral do tronco ao nível das costelas flutuantes", significado: "Autoproteção e medo de exposição emocional." },
  { id: "maos",    nome: "Mãos",        bilateral: true, lados: ["direita","esquerda"], localizacao: "Dorso ou palma da mão", significado: "Ação, dar e receber; não conseguir impedir ou segurar." },
  { id: "coxas",   nome: "Coxa / Anca", bilateral: true, lados: ["direita","esquerda"], localizacao: "Parte exterior da anca/coxa, a meia altura", significado: "Vínculos e movimento; perder o chão nas relações." },
  { id: "joelhos", nome: "Joelhos",     bilateral: true, lados: ["direito","esquerdo"], localizacao: "Rótula ou parte posterior do joelho", significado: "Humildade, rendição; orgulho ferido." },
  { id: "pes",     nome: "Pés",         bilateral: true, lados: ["direito","esquerdo"], localizacao: "Topo do pé ou planta", significado: "Caminho, direção, raízes; medo de avançar ou ser tirado do lugar." },
];
// Expande PONTOS_ENTRADA para lista flat de 13 itens (como no formulário original)
const PONTOS_ENTRADA_FLAT = PONTOS_ENTRADA.flatMap(p =>
  p.bilateral
    ? p.lados.map(l => ({ id: p.id+"_"+l[0], nome: `${p.nome} (${l.charAt(0).toUpperCase()+l.slice(1)})`, base: p.id, lado: l, significado: p.significado, localizacao: p.localizacao }))
    : [{ id: p.id, nome: p.nome, base: p.id, lado: "centro", significado: p.significado, localizacao: p.localizacao }]
); // = 13 entradas: 1 + 2×6

// ─── INLINED: baseConhecimento.js ───
const ESCUDOS = [
  { id: "desvalorizacao", nome: "Desvalorização", foco: "vergonha, culpa, baixa autoestima, autossabotagem", emocoes: "vergonha, culpa, sentimento de inutilidade, baixa autoestima", sentenca: "Não sou suficiente.", origem: "Forma-se em ambientes de crítica, comparação ou desqualificação. A pessoa sente que precisa provar valor o tempo todo.", corpo: "ossos, articulações, músculos, sistema cardiovascular, coluna/postura.", expressoes: ["Não sou bom o suficiente", "Tenho de provar o meu valor"], devolutiva: "O padrão indica uma exigência interna constante de provar valor. O caminho é resgatar a autoestima e reconhecer conquistas já existentes." },
  { id: "desprotecao", nome: "Desproteção", foco: "vulnerabilidade, insegurança, sensação de estar exposto", emocoes: "vulnerabilidade, insegurança, sensação de perigo constante", sentenca: "Estou por minha conta.", origem: "Aparece quando faltou acolhimento, apoio ou cuidado. Permanece a sensação de que o mundo é um lugar perigoso.", corpo: "sistema imunitário, pele (derme), gânglios, baço, tecido adiposo.", expressoes: ["Tenho de me defender sempre", "Não posso confiar em ninguém"], devolutiva: "O corpo mostra que precisou de se proteger. O trabalho é construir segurança interna e permitir-se confiar gradualmente." },
  { id: "sobrevivencia", nome: "Sobrevivência", foco: "escassez, medo de perder tudo, necessidade de controlo", emocoes: "medo extremo, urgência, sensação de escassez", sentenca: "Não posso relaxar, preciso de sobreviver.", origem: "Ativa-se em estados de alerta constante (instabilidade material/emocional). Mesmo após a ameaça passar, mantém-se o modo de sobrevivência.", corpo: "fígado, pâncreas, pulmões, sistema digestivo, tiroide.", expressoes: ["Tenho medo de perder tudo", "Preciso de estar no controlo"], devolutiva: "O sistema permanece em alerta. O foco é devolver a sensação de segurança e a possibilidade de descansar." },
  { id: "impotencia", nome: "Impotência", foco: "bloqueio, paralisia, sensação de que nada pode ser feito", emocoes: "frustração, paralisia, falta de força perante a vida", sentenca: "Não consigo fazer nada.", origem: "Forma-se quando a pessoa foi impedida de agir, dominada ou humilhada. A energia vital retrai-se e perde-se o impulso de transformar.", corpo: "músculos, articulações, função reprodutiva, motilidade digestiva.", expressoes: ["Não adianta tentar", "Sinto-me travado(a)"], devolutiva: "Há uma sensação de bloqueio da ação. O caminho é recuperar pequenos passos de iniciativa e poder pessoal." },
  { id: "perda", nome: "Perda / Rejeição", foco: "luto, vazio, abandono, rompimentos afetivos", emocoes: "tristeza profunda, vazio, abandono, carência afetiva", sentenca: "Fui deixado(a)... estou sozinho(a).", origem: "Forma-se em rompimentos de vínculo (luto, separações, exclusão). A pessoa evita vínculos — ou apega-se em excesso por medo de perder.", corpo: "pele, sistema nervoso, órgãos dos sentidos, glândulas mamárias.", expressoes: ["Perdi uma parte de mim", "Não consigo seguir em frente"], devolutiva: "Há uma dor de vínculo a ser acolhida. O foco é elaborar a perda e reabrir, com segurança, a capacidade de se ligar." },
];
const getEscudo = (id) => ESCUDOS.find(e => e.id === id) || null;
const ESCALA_QUESTIONARIO = [
  { valor: 1, rotulo: "Pouco / quase nunca" },
  { valor: 2, rotulo: "Às vezes" },
  { valor: 3, rotulo: "Muito / quase sempre" },
];
const QUESTIONARIO_ESCUDOS = [
  { blocoId: "desvalorizacao", titulo: "Bloco 1 — Desvalorização", afirmacoes: ["Sinto que não sou suficiente.","Critico-me com frequência.","Tenho dificuldade em reconhecer as minhas conquistas.","Comparo-me muito com os outros.","Sinto vergonha de quem sou.","Acho que preciso de provar o meu valor o tempo todo.","Tenho medo de errar e ser julgado(a).","Sinto-me culpado(a) com facilidade.","Desisto por achar que não vou conseguir.","Tenho uma autoimagem negativa."] },
  { blocoId: "desprotecao", titulo: "Bloco 2 — Desproteção", afirmacoes: ["Sinto-me vulnerável ou exposto(a).","Tenho necessidade de controlar tudo para me sentir seguro(a).","Não me sinto seguro(a) nem com pessoas próximas.","Tenho dificuldade em confiar plenamente em alguém.","Já me senti completamente desamparado(a).","Evito abrir-me para não ser magoado(a).","Sinto que estou sozinho(a) no mundo.","Sinto que ninguém me entende de verdade.","Já tive de me defender sozinho(a).","Tenho medo de demonstrar fraqueza."] },
  { blocoId: "sobrevivencia", titulo: "Bloco 3 — Sobrevivência", afirmacoes: ["Tenho medo constante de perder o que conquistei.","Preocupo-me em excesso com dinheiro ou segurança.","Sinto-me em 'modo de alerta' o tempo todo.","Tenho dificuldade em relaxar, mesmo quando está tudo bem.","Sinto que preciso de estar sempre no controlo.","Já senti que a minha sobrevivência esteve em risco.","Sinto que não posso contar com ninguém.","Sinto-me ameaçado(a) com facilidade.","Tenho crises de ansiedade em momentos de incerteza.","Vivo em piloto automático para dar conta de tudo."] },
  { blocoId: "impotencia", titulo: "Bloco 4 — Impotência", afirmacoes: ["Sinto que não tenho poder para mudar a minha vida.","Já me senti preso(a) em situações sem saída.","Quando algo corre mal, fico sem ação.","Sinto que, por mais que tente, nada muda.","Tenho dificuldade em tomar decisões importantes.","Já me senti completamente impotente.","Sinto que as pessoas controlam demasiado a minha vida.","Já desisti de sonhos por achar que não conseguiria.","Sinto-me paralisado(a) pelo medo.","Penso no que poderia ter feito, mas não consigo agir."] },
  { blocoId: "perda", titulo: "Bloco 5 — Perda / Rejeição", afirmacoes: ["Carrego dores profundas por pessoas ou situações que perdi.","Sinto um vazio que parece não ter fim.","Tenho dificuldade em desapegar-me do passado.","Não lido bem com despedidas.","Evito apegar-me para não sofrer perdas futuras.","Já perdi alguém ou algo essencial para mim.","Revivo lembranças de pessoas ou momentos que se foram.","Tenho medo de perder quem amo.","Sinto-me rejeitado(a) com facilidade.","Tive experiências marcantes de abandono."] },
];
const PERGUNTAS_ABERTURA = ["Quem é você hoje?","Já passou por isto antes?","Quais foram os 3 momentos mais difíceis da sua vida?","Quantas crises por semana costuma ter?","Quais são os sintomas principais?","O que gostaria que fosse o foco da consulta de hoje?"];
const CAMINHOS = [
  { id: "consciente", nome: "Caminho 1 — Investigação consciente (Escudos)", semMapeamento: true, indicado: "1ª consulta · quem fala bastante · primeiro contacto com o método", passos: ["Apresentar os 5 escudos.","Pedir pontuação de 0 a 10 em cada escudo (ou aplicar o questionário).","Deixar a pessoa expressar-se sobre o que sente."] },
  { id: "subconsciente", nome: "Caminho 2 — Avaliação Energética", semMapeamento: false, indicado: "2ª consulta · aceder à raiz profunda do sintoma", passos: ["Escolher quadrantes: frente / costas / ambos.","Investigar energia vital → zona de impacto → superfície.","Avaliar sistemas: superior → central → inferior.","Identificar escudo ativo e o tempo (transgeracional / gestacional / pós-parto)."] },
  { id: "estressores", nome: "Caminho 3 — Estressores ativos", semMapeamento: true, indicado: "tratamento contínuo · manutenção · sintomas que se repetem", passos: ["Quem do convívio atual mais o(a) desestabiliza?","O que essa pessoa faz ou diz que mais o(a) afeta?","Que situações o(a) tiram do foco?","Já existiu alguém no passado com este mesmo papel?","O que essas pessoas tinham em comum?"] },
];
const PROTOCOLO = { duracoes: [7, 15], componentes: ["Áudio de modulação (escudo ativo identificado)","Alimentação consciente (incluir/retirar alimentos)","Exercícios de respiração simples e regulares","Mini plano de autocuidado diário"] };

// ─── INLINED: protocoloCura.js ───
const PROTOCOLOS_CURA = {
  impotencia: { foco: "Recuperar o poder de ação e a iniciativa." },
  desvalorizacao: { foco: "Resgatar a autoestima e o reconhecimento do valor." },
  desprotecao: { foco: "Construir segurança interna e a capacidade de confiar." },
  sobrevivencia: { foco: "Sair do estado de alerta e permitir o descanso." },
  perda: { foco: "Acolher a perda e reabrir, com segurança, a ligação." },
};
const _GESTO = "(bater no peito esquerdo com a mão 3 vezes e repetir)";
const _SELAMENTO = "Está feito, está feito, está feito. Está selado.";
const AFIRMACOES_ESCUDO = {
  desprotecao: { afirmacao: "Eu liberto todo o sentimento de DESPROTEÇÃO, injustiça, insegurança, acusação e dúvida que estejam bloqueados no meu corpo. Eu liberto todos os sentimentos negativos que não me ajudam a evoluir; fica em mim apenas o necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!", liberacao: "Eu comando que toda a sensação de desproteção e vulnerabilidade seja libertada gentilmente agora. Eu comando que o meu ser seja preenchido com segurança, proteção e confiança. Que assim seja.", cura: "Eu comando que todas as experiências de desproteção sejam transformadas em força interior e segurança. Eu comando que a minha sensação de proteção e bem-estar sejam restauradas e reforçadas. Que assim seja." },
  impotencia: { afirmacao: "Eu liberto todo o sentimento de IMPOTÊNCIA, frustração, paralisia, bloqueio e submissão que estejam bloqueados no meu corpo. Fica em mim apenas o necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!", liberacao: "Eu comando que toda a sensação de impotência seja libertada agora. Eu comando que o meu ser seja preenchido com força e capacidade de agir. Que assim seja.", cura: "Eu comando que todas as experiências de bloqueio sejam transformadas em iniciativa e poder pessoal. Que assim seja." },
  desvalorizacao: { afirmacao: "Eu liberto todo o sentimento de DESVALORIZAÇÃO, vergonha, culpa, inutilidade e baixa autoestima que estejam bloqueados no meu corpo. Fica em mim apenas o necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!", liberacao: "Eu comando que toda a sensação de desvalorização seja libertada agora. Eu comando que o meu ser seja preenchido com valor próprio e respeito. Que assim seja.", cura: "Eu comando que todas as experiências de desvalorização sejam transformadas em autoestima e reconhecimento. Que assim seja." },
  sobrevivencia: { afirmacao: "Eu liberto todo o sentimento de medo, alerta constante, escassez e ameaça que estejam bloqueados no meu corpo. Fica em mim apenas o necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!", liberacao: "Eu comando que todo o estado de alerta seja libertado agora. Eu comando que o meu ser seja preenchido com segurança e tranquilidade. Que assim seja.", cura: "Eu comando que todas as experiências de ameaça sejam transformadas em segurança e descanso. Que assim seja." },
  perda: { afirmacao: "Eu liberto todo o sentimento de PERDA, vazio, abandono, rejeição e tristeza que estejam bloqueados no meu corpo. Fica em mim apenas o necessário para o meu aprendizado, o resto eu liberto e solto em gratidão!", liberacao: "Eu comando que toda a dor da perda seja acolhida e libertada gentilmente agora. Eu comando que o meu ser seja preenchido com presença e ligação. Que assim seja.", cura: "Eu comando que todas as experiências de perda sejam transformadas em memória serena e abertura ao novo. Que assim seja." },
};
const _PASSOS_CURA = { preparacao: ["Beber água, colocar o áudio indicado e iniciar a sequência.","Marcar (fazer um X) sobre cada ponto encontrado."], porPonto: ["Massajar o ponto com os dedos em formato de pinça (indicador, médio e polegar juntos), mentalizando ou dizendo o nome do ponto/órgão/glândula associado e massajando em círculo, enquanto faz 3 respirações profundas.","Empurrar os dedos para baixo (desbloquear o sentimento).","Bater duas vezes sobre o ponto."], final: ["Fazer um auto-abraço e respirar fundo.","Repetir a afirmação de libertação do escudo.","Bater no peito 3 vezes e repetir o selamento."] };
const _FREQUENCIA = { 7: "Uma vez por dia, durante 7 dias.", 15: "Uma vez por dia, durante 15 dias (ao 8.º dia, reforçar com o áudio de modulação)." };
const _REACOES_CURA = ["Pode surgir mais cansaço ou vontade de dormir — é o corpo a reorganizar-se.","Emoções podem vir à tona (vontade de chorar, alívio, irritabilidade) — faz parte da libertação.","Pode haver sonhos mais intensos ou memórias antigas — sinal de processamento.","Beber água, descansar e respirar fundo ajuda em cada fase.","Estas reações costumam ser passageiras. Se algo preocupar ou agravar, procurar acompanhamento médico/profissional."];
function _normalizarPontos(mapeamento = []) {
  return mapeamento.map(m => typeof m === "string" ? { id: m } : { ...m }).map(m => ({ id: m.id, nome: nomePonto(m.id), sistema: m.sistema || sistemaDoPonto(m.id), lado: m.lado || "", face: m.face || "frente" })).filter(m => m.sistema);
}
function _gerarSequenciaMassagem(pontos = [], modo = "criadora") {
  const blocos = [];
  const apoio = (lado, face) => `Mão na ${face === "costas" ? "nuca" : "fonte"} do lado ${lado}`;
  const faces = [...new Set(pontos.map(p => p.face))];
  faces.forEach(face => {
    const daFace = pontos.filter(p => p.face === face);
    const sup = daFace.filter(p => p.sistema === "Superior");
    const cen = daFace.filter(p => p.sistema === "Central");
    const inf = daFace.filter(p => p.sistema === "Inferior");
    if (modo === "separados") {
      ["direito", "esquerdo"].forEach(lado => {
        const desteLado = daFace.filter(p => p.lado === lado);
        if (!desteLado.length) return;
        const ordem = { Superior: 0, Central: 1, Inferior: 2 };
        blocos.push({ face, lado, maoApoio: apoio(lado, face), pontos: desteLado.sort((a, b) => ordem[a.sistema] - ordem[b.sistema]).map(p => ({ id: p.id, nome: p.nome, local: localizacaoMassagem(p.sistema, face) })) });
      });
    } else {
      const sc = [...sup, ...cen];
      if (sc.length) {
        const contaDireita = sc.filter(p => p.lado === "direito").length;
        const contaEsquerda = sc.filter(p => p.lado === "esquerdo").length;
        const dominante = contaDireita >= contaEsquerda ? "direito" : "esquerdo";
        const vistos = new Set();
        const unicos = sc.filter(p => vistos.has(p.id) ? false : vistos.add(p.id));
        blocos.push({ face, lado: dominante, maoApoio: apoio(dominante, face), nota: "Superior + Central juntos; pontos repetidos massajados uma só vez.", pontos: unicos.map(p => ({ id: p.id, nome: p.nome, local: localizacaoMassagem(p.sistema, face) })) });
      }
      ["direito", "esquerdo"].forEach(lado => {
        const perna = inf.filter(p => p.lado === lado);
        if (!perna.length) return;
        blocos.push({ face, lado, maoApoio: apoio(lado, face), nota: "Trocar a mão de apoio ao mudar de lado.", pontos: perna.map(p => ({ id: p.id, nome: p.nome, local: localizacaoMassagem("Inferior", face) })) });
      });
    }
  });
  return blocos;
}
function gerarProtocoloCura(respostas = {}, escudoDominante = null) {
  const escudoId = respostas.escudo || escudoDominante;
  const escudo = getEscudo(escudoId);
  const proto = PROTOCOLOS_CURA[escudoId];
  const afir = AFIRMACOES_ESCUDO[escudoId];
  const pontos = _normalizarPontos(respostas.mapeamento);
  const dias = respostas.protocoloDias || 7;
  const modo = respostas.modo === "separados" ? "separados" : "criadora";
  const nome = respostas?.paciente?.nome || "o(a) paciente";
  const sequencia = _gerarSequenciaMassagem(pontos, modo);
  const L = [];
  L.push(`# Protocolo de cura — ${nome}`);
  if (escudo) L.push(`Escudo ativo: **${escudo.nome}**. ${proto?.foco || ""}`);
  L.push(`\n## Preparação`);
  _PASSOS_CURA.preparacao.forEach(p => L.push(`• ${p}`));
  L.push(`\n## Sequência de massagem`);
  sequencia.forEach(b => {
    L.push(`\n**${b.maoApoio} — face ${b.face}:**`);
    if (b.nota) L.push(`_${b.nota}_`);
    b.pontos.forEach(p => L.push(`• ${p.nome} — massajar ${p.local}.`));
  });
  L.push(`\n## Em cada ponto (por esta ordem)`);
  _PASSOS_CURA.porPonto.forEach((p, i) => L.push(`${i + 1}. ${p}`));
  L.push(`\n## No final`);
  _PASSOS_CURA.final.forEach(p => L.push(`• ${p}`));
  if (afir) { L.push(`\n**Afirmação (${escudo?.nome}):** ${afir.afirmacao} ${_GESTO}`); L.push(`**Selamento:** ${_SELAMENTO}`); }
  L.push(`\n## O que podes sentir durante a cura`);
  _REACOES_CURA.forEach(r => L.push(`• ${r}`));
  L.push(`\n## Frequência`);
  L.push(_FREQUENCIA[dias] || _FREQUENCIA[7]);
  return { titulo: `Protocolo de cura — ${nome}`, escudo: escudo?.nome || null, foco: proto?.foco || null, sequencia, afirmacao: afir?.afirmacao || null, selamento: _SELAMENTO, frequencia: _FREQUENCIA[dias] || _FREQUENCIA[7], texto: L.join("\n") };
}

// ─── INLINED: gerarRelatorio.js ───
function pontuarEscudos(questionario = {}) {
  const totais = QUESTIONARIO_ESCUDOS.map(bloco => {
    const valores = questionario[bloco.blocoId] || [];
    const total = valores.reduce((s, v) => s + (Number(v) || 0), 0);
    return { escudoId: bloco.blocoId, total };
  });
  const ordenado = [...totais].sort((a, b) => b.total - a.total);
  const dominante = ordenado[0] && ordenado[0].total > 0 ? ordenado[0].escudoId : null;
  return { totais, ordenado, dominante };
}

// ─── INLINED: responsabilidade.js ───
const AVISO_SAUDE = {
  titulo: "Antes de usar este módulo",
  pontos: ["Este módulo é um apoio. Não substitui avaliação médica nem acompanhamento adequado.","Confirmo que tenho conhecimento e competência para o que vou indicar.","Comprometo-me a estudar o quadro clínico do paciente e a verificar a compatibilidade e as interações com a medicação em uso.","Assumo total responsabilidade pelo que indico; a app e os seus autores não são responsáveis pelas indicações que eu fizer.","Em caso de sinais de risco, encaminho o paciente para acompanhamento médico/profissional adequado."],
  rodape: "Ao continuar, declaro que li e aceito estas condições e que sou o(a) responsável pelas indicações que faço aos meus pacientes.",
};
const _chave = (uid, mod) => `vd:aceite:${uid || "anon"}:${mod}`;
function jaAceitou(uid, mod = "saude") {
  try { return localStorage.getItem(_chave(uid, mod)) ? true : false; } catch { return false; }
}
function registarAceite(uid, mod = "saude") {
  try { localStorage.setItem(_chave(uid, mod), new Date().toISOString()); } catch {}
  return true;
}
// ─── SUPABASE ───
const SUPA_URL = "https://lrmylsywevawexzcgqzc.supabase.co";
const SUPA_KEY = "sb_publishable_pOcM1sN-hhJh9ID8pSt7gA_K2tSDDWL";
const sb = createClient(SUPA_URL, SUPA_KEY);

// ─── TERMOS E AVISO LEGAL DA APLICAÇÃO ───
const TERMOS_APP = {
  versao: "1.0",
  data: "2025",
  titulo: "Termos de Utilização — VitalDoctor",
  subtitulo: "Lê com atenção antes de utilizar a aplicação",
  seccoes: [
    {
      titulo: "1. Natureza da Aplicação",
      texto: "O VitalDoctor é uma ferramenta digital de apoio à gestão de consultas terapêuticas. Foi desenvolvida com o propósito de facilitar o registo, organização e acompanhamento de atendimentos. A aplicação NÃO é um dispositivo médico, NÃO realiza diagnósticos clínicos e NÃO emite prescrições médicas."
    },
    {
      titulo: "2. Limitações e Possibilidade de Erros",
      texto: "A aplicação pode conter erros, imprecisões ou informações desactualizadas. O VitalDoctor e os seus responsáveis não garantem a exactidão, completude ou adequação do conteúdo apresentado. O uso de qualquer informação é feito por conta e risco do utilizador."
    },
    {
      titulo: "3. Não Substitui Formação nem Conhecimento Clínico",
      texto: "O uso desta aplicação NÃO substitui a formação profissional certificada, o estudo contínuo, a supervisão clínica nem o julgamento do profissional de saúde. Toda a orientação terapêutica dada ao paciente é da exclusiva responsabilidade do terapeuta que realiza o atendimento."
    },
    {
      titulo: "4. Responsabilidade do Utilizador",
      texto: "O terapeuta/utilizador é o único responsável pelo conteúdo que regista, pelas orientações que fornece ao paciente e pelas decisões terapêuticas que toma. O VitalDoctor não assume qualquer responsabilidade por danos directos ou indirectos resultantes da utilização da aplicação."
    },
    {
      titulo: "5. Protecção de Dados (RGPD)",
      texto: "Os dados inseridos na aplicação são armazenados de forma segura na plataforma Supabase (servidores na União Europeia, Frankfurt), em conformidade com o Regulamento Geral de Protecção de Dados (RGPD). Cada terapeuta só tem acesso aos seus próprios pacientes e consultas. Os dados não são partilhados com terceiros."
    },
    {
      titulo: "6. Conteúdo Clínico",
      texto: "Qualquer protocolo, sugestão terapêutica ou conteúdo presente na aplicação tem carácter meramente informativo e de apoio. Devem sempre ser validados pelo terapeuta com base no seu conhecimento, formação e avaliação individual do paciente."
    },
    {
      titulo: "7. Propriedade Intelectual",
      texto: "Os módulos especializados desta aplicação podem conter conteúdo protegido por direitos de propriedade intelectual. O acesso a esses módulos é concedido a título pessoal e não transferível, e não autoriza a reprodução, cópia ou distribuição do conteúdo."
    },
  ],
  rodape: "Ao aceitar estes termos, confirmas que leste e compreendiste todas as condições acima e que utilizarás esta aplicação com consciência profissional e ética."
};

const AVISO_RODAPE = "⚠️ Ferramenta de apoio ao atendimento — não substitui formação, conhecimento clínico nem julgamento profissional. O terapeuta é o único responsável pelo que indica ao paciente.";

const jaAceitouTermos = (uid) => {
  try { return localStorage.getItem("vd_termos_" + uid) === "1"; } catch { return false; }
};
const registarAceiteTermos = (uid) => {
  try { localStorage.setItem("vd_termos_" + uid, "1"); } catch {}
};


// ─── HELPERS ───
const hoje = () => new Date().toISOString().split("T")[0];
const fmtData = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-PT") : "";
const uid = () => Math.random().toString(36).substr(2, 9);
const tog = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
const HORAS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ══════════════════════════════════════════════════════
// TIPOS DE CONSULTA E PASSOS — DEFINIÇÃO INTERNA COMPLETA
// Independente de qualquer ficheiro externo
// ══════════════════════════════════════════════════════
const PERGUNTAS_PODER = [
  "Quem és tu hoje?",
  "Já passaste por isso antes?",
  "Quais foram os 3 piores momentos da tua vida?",
  "Quantas crises por semana tens?",
  "Quais os sintomas principais?",
  "O que gostarias que fosse o foco da consulta hoje?",
];

const PERGUNTAS_MONITORIZACAO = [
  "Como te has sentido desde o nosso último encontro?",
  "Quantas crises tiveste esta semana?",
  "O que mudou nos sintomas desde a última sessão?",
];

const PERGUNTAS_ESTRESSORES = [
  "Quem do teu convívio actual mais te estressa ou altera o teu humor?",
  "O que essa pessoa faz ou diz que mais te desestabiliza?",
  "Que situações te tiram do foco?",
  "Já existiu alguém no passado com esse mesmo papel?",
  "O que essas pessoas tinham em comum?",
];

const PASSOS_BASE = {
  acolhimento: { id:"acolhimento", titulo:"Início e Acolhimento", descricao:"Observa como o paciente chega. Escuta além das palavras: corpo, respiração, energia. Se houver tensão, conduz uma respiração guiada antes de começar." },
  dados: { id:"dados", titulo:"Recolha de Dados Pessoais", descricao:"Anota com calma: nome, idade, data de nascimento, profissão, quadro clínico, medicação." },
  perguntas: { id:"perguntas", titulo:"6 Perguntas do Poder", descricao:"Faz com presença e escuta activa. Estas perguntas abrem o campo para que o paciente se conecte com a sua própria história." },
  caminho: { id:"caminho", titulo:"Escolha do Caminho Terapêutico", descricao:"Com base na escuta, decide entre: Caminho 1 (Escudos), Caminho 2 (Mapeamento), Caminho 3 (Estressores)." },
  escudos: { id:"escudos", titulo:"Pontuação dos Escudos Emocionais", descricao:"Apresenta os 5 escudos. Pede que pontue de 0 a 10 qual sente mais presente hoje. Isto expande a consciência sobre o próprio processo." },
  mapeamento: { id:"mapeamento", titulo:"Avaliação Energética Vital", descricao:"Mapeamento corporal completo nos 4 quadrantes. Acede à raiz profunda do sintoma através do corpo." },
  estressores: { id:"estressores", titulo:"Mapeamento de Estressores", descricao:"Reconhecer padrões e ciclos emocionais activos. Ideal para sessões de manutenção." },
  monitorizacao: { id:"monitorizacao", titulo:"Monitorização de Sintomas", descricao:"Em todas as consultas: como se sentiu desde o último encontro, quantas crises, o que mudou." },
  devolutiva: { id:"devolutiva", titulo:"Devolutiva Terapêutica", descricao:"Entrega ao paciente o que o corpo revelou, com presença e sensibilidade. Gera o relatório completo." },
  protocolo: { id:"protocolo", titulo:"Protocolo de Cura — Trabalho em Casa", descricao:"Define o protocolo personalizado: áudio, alimentação, respiração, práticas diárias. Este é o trabalho de cura que o paciente faz entre sessões." },
  revisao: { id:"revisao", titulo:"Revisão da Sessão Anterior", descricao:"O que melhorou? O que permanece? O que surgiu de novo?" },
  ferramentas: { id:"ferramentas", titulo:"Ferramentas Práticas para a Vida", descricao:"Checklists personalizados, plano de autocuidado diário, sugestões para desafios emocionais." },
  encerramento: { id:"encerramento", titulo:"Encerramento e Miminho Terapêutico", descricao:"7 meditações de limpeza emocional (uma por dia). Cria um campo de encerramento e integração." },
};

const TIPOS_CONSULTA_LOCAL = [
  {
    id: "consulta_unica",
    nome: "Consulta Única",
    indicado: "Quando há só um encontro. Prioriza clareza, resultado e acolhimento real.",
    nota: "Paciente ansioso → caminhos rápidos e práticos. Paciente em baixa → acolhimento e micro metas.",
    passos: ["acolhimento","perguntas","caminho","monitorizacao","devolutiva","protocolo"],
  },
  {
    id: "pack_c1",
    nome: "Pack 3 Sessões — Sessão 1",
    indicado: "Mente Consciente + Modulação + Protocolo 7 dias.",
    nota: "Objectivo: criar base emocional, clareza e pequenos hábitos transformadores.",
    passos: ["acolhimento","perguntas","escudos","protocolo"],
  },
  {
    id: "pack_c2",
    nome: "Pack 3 Sessões — Sessão 2",
    indicado: "Mente Subconsciente + Análise Energética completo.",
    nota: "Revisão da sessão anterior + mapeamento + devolutiva + protocolo 7-15 dias.",
    passos: ["revisao","mapeamento","devolutiva","protocolo"],
  },
  {
    id: "pack_c3",
    nome: "Pack 3 Sessões — Sessão 3",
    indicado: "Direcionamento, Consolidação e Ferramentas de Vida.",
    nota: "Checklists, plano de autocuidado, miminho terapêutico de encerramento.",
    passos: ["revisao","ferramentas","protocolo","encerramento"],
  },
  {
    id: "mapeamento_unico",
    nome: "Avaliação Energética Vital",
    indicado: "Aceder à raiz profunda do sintoma pelo corpo. Pode ser frente, costas ou ambos.",
    nota: "Ideal para 2ª consulta ou pacientes que já conhecem a técnica.",
    passos: ["acolhimento","mapeamento","devolutiva","protocolo"],
  },
  {
    id: "manutencao",
    nome: "Sessão de Manutenção",
    indicado: "Pacientes em tratamento contínuo. Sintomas que se repetem sem causa clara.",
    nota: "Caminho 3 — estressores activos e ajustes na rotina emocional.",
    passos: ["monitorizacao","estressores","protocolo"],
  },
];

// Buscar tipo local pelo id
const getTipoLocal = (id) => TIPOS_CONSULTA_LOCAL.find(t => t.id === id) || null;

// Obter passos do tipo (usa definição local, independente de atendimento.js)
const getPassosLocal = (tipoId) => {
  const tipo = getTipoLocal(tipoId);
  if (!tipo) return [];
  return tipo.passos.map(pid => PASSOS_BASE[pid]).filter(Boolean);
};

// MONITORIZACAO local (não depende de atendimento.js)
const MONITORIZACAO_LOCAL = PERGUNTAS_MONITORIZACAO;


// ─── CSS ───
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px}
@media(min-width:769px){html{font-size:17px}}
@media(min-width:1100px){html{font-size:18px}}
@media(min-width:1500px){html{font-size:20px}}
html,body,#root{height:100%;background:#07090f;color:#dde4f0;font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1a2840;border-radius:3px}
.fade{animation:fd .3s ease}
@keyframes fd{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.app{display:flex;height:100vh;overflow:hidden}
.sb{width:13.5rem;background:#0a0e18;border-right:1px solid #0d1828;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sb-logo{padding:16px 14px 10px;border-bottom:1px solid #0d1828}
.sb-logo-t{font-family:'Cormorant Garamond',serif;font-size:1.05rem;letter-spacing:3px;background:linear-gradient(135deg,#00c6b8,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sb-logo-v{font-size:.55rem;color:#1a2840;letter-spacing:1px}
.sb-user{padding:10px 14px;border-bottom:1px solid #0d1828}
.sb-user-n{font-size:.8rem;font-weight:600;color:#b0c4d8}
.sb-user-p{font-size:.62rem;color:#2d4a66;margin-top:1px}
.sb-nav{flex:1;padding:5px 0}
.sb-sec{font-size:.55rem;letter-spacing:2px;text-transform:uppercase;color:#131e2e;padding:10px 14px 3px}
.sb-item{display:flex;align-items:center;gap:7px;padding:9px 14px;cursor:pointer;transition:all .15s;font-size:.78rem;color:#5a7a9a;border-left:2px solid transparent}
.sb-item:hover{background:rgba(0,198,184,.04);color:#5ae0d8}
.sb-item.on{background:rgba(0,198,184,.06);color:#00c6b8;border-left-color:#00c6b8}
.sb-item-i{font-size:.95rem;width:16px;text-align:center;flex-shrink:0}
.sb-foot{padding:10px 14px;border-top:1px solid #0d1828;display:flex;flex-direction:column;gap:5px}
.sb-btn{width:100%;padding:7px;background:transparent;border:1px solid #0d1828;border-radius:5px;color:#3d5a7a;font-size:.68rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;text-align:center}
.sb-btn:hover{border-color:#ef4444;color:#ef4444}
.main{flex:1;overflow-y:auto}
.main-hdr{padding:12px 18px;border-bottom:1px solid #0d1828;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#07090f;z-index:20}
.main-title{font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:#dde4f0}
.main-body{padding:18px 22px;max-width:1100px;margin:0 auto;width:100%}
.mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#0a0e18;border-top:1px solid #0d1828;z-index:100;overflow-x:auto}
.mob-inner{display:flex;overflow-x:auto;scrollbar-width:none}
.mob-inner::-webkit-scrollbar{display:none}
.mob-btn{flex:1;min-width:54px;padding:7px 3px 5px;border:none;background:transparent;color:#2d4a66;font-size:.5rem;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:'DM Sans',sans-serif;transition:color .2s;max-width:70px}
.mob-btn.on{color:#00c6b8}
.mob-icon{font-size:1rem}
@media(max-width:768px){.sb{display:none}.mob-nav{display:block}.main{padding-bottom:60px}.main-body{padding:12px 12px}}
.card{background:#0a0e18;border:1px solid #0d1828;border-radius:10px;padding:1rem;margin-bottom:.7rem}
.card-t{font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:#00c6b8;margin-bottom:10px;display:flex;align-items:center;gap:5px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:9px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
@media(max-width:500px){.g2{grid-template-columns:1fr}.g3{grid-template-columns:1fr 1fr}}
.inp{width:100%;background:#050810;border:1px solid #0d1828;border-radius:6px;padding:9px 11px;color:#dde4f0;font-family:'DM Sans',sans-serif;font-size:.82rem;outline:none;transition:border-color .2s;resize:vertical}
.inp:focus{border-color:#00c6b8}
.inp::placeholder{color:#1a2840}
.lbl{font-size:.62rem;color:#3d5a7a;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;display:block}
.sel{appearance:none;cursor:pointer}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}
.slbl{font-size:.55rem;letter-spacing:2px;text-transform:uppercase;color:#1a2840;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #0d1828}
.btn{border:none;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;padding:9px 15px}
.btn-p{background:linear-gradient(135deg,#00c6b8,#009e92);color:#050810;width:100%}
.btn-p:hover{opacity:.9}
.btn-p:disabled{opacity:.5;cursor:not-allowed}
.btn-g{background:linear-gradient(135deg,#f59e0b,#d97706);color:#050810;width:100%}
.btn-s{background:#0a0e18;border:1px solid #0d1828;color:#3d5a7a;width:100%}
.btn-s:hover{border-color:#00c6b8;color:#00c6b8}
.btn-d{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.btn-sm{padding:6px 11px;font-size:.7rem;width:auto}
.btn-row{display:flex;gap:7px;margin-top:10px}
.btn-row .btn{flex:1;margin:0}
.al{padding:9px 12px;border-radius:6px;border-left:3px solid;margin-bottom:7px;font-size:.78rem;line-height:1.6}
.al-i{background:rgba(0,198,184,.05);border-color:#00c6b8;color:#5ae0d8}
.al-w{background:rgba(251,191,36,.05);border-color:#fbbf24;color:#fde68a}
.al-s{background:rgba(74,222,128,.06);border-left:3px solid #4ade80;color:#86efac;padding:8px 11px;border-radius:6px;margin-bottom:7px;font-size:.78rem}
.al-d{background:rgba(239,68,68,.06);border-color:#ef4444;color:#fca5a5}
.al-ok{background:rgba(16,185,129,.05);border-color:#10b981;color:#6ee7b7}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.chip{padding:5px 11px;border-radius:12px;border:1px solid #0d1828;background:#050810;font-size:.72rem;cursor:pointer;transition:all .13s;color:#5a7a9a;user-select:none}
.chip:hover{border-color:#00c6b8;color:#00c6b8}
.chip.on{background:#003d39;border-color:#00c6b8;color:#00c6b8}
.prog{height:2px;background:#0d1828;border-radius:2px;margin:8px 0}
.prog-b{height:100%;background:linear-gradient(90deg,#00c6b8,#f59e0b);border-radius:2px;transition:width .5s}
.dots{display:flex;gap:4px;justify-content:center;margin-bottom:8px}
.dot{width:5px;height:5px;border-radius:50%;background:#0d1828;transition:all .3s}
.dot.done{background:#10b981}.dot.act{background:#00c6b8;box-shadow:0 0 5px #00c6b8}
.pac-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#050810;border:1px solid #0d1828;border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all .15s}
.pac-row:hover{border-color:#1a3a5c}
.pac-avatar{width:38px;height:38px;border-radius:50%;background:#0d1828;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;overflow:hidden}
.pac-avatar img{width:100%;height:100%;object-fit:cover}
.agenda-row{display:flex;align-items:flex-start;gap:9px;padding:9px 11px;background:#050810;border:1px solid #0d1828;border-radius:7px;margin-bottom:5px}
.agenda-hora{font-size:14px;font-weight:700;color:#00c6b8;min-width:42px;flex-shrink:0;font-family:'Cormorant Garamond',serif}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px}
.stat{background:#0a0e18;border:1px solid #0d1828;border-radius:9px;padding:11px;text-align:center}
.stat-n{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#00c6b8}
.stat-l{font-size:8px;color:#2d4a66;margin-top:1px;letter-spacing:1px;text-transform:uppercase}
.pay-row{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:#050810;border:1px solid #0d1828;border-radius:7px;margin-bottom:5px;font-size:11px}
.tw{width:32px;height:17px;border-radius:9px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0}
.tw.on{background:#00c6b8}.tw.off{background:#1a2840}
.tw::after{content:'';position:absolute;width:11px;height:11px;border-radius:50%;background:#fff;top:3px;transition:left .2s}
.tw.on::after{left:18px}.tw.off::after{left:3px}
.foto-circle{width:70px;height:70px;border-radius:50%;background:#0d1828;border:2px solid #1a2840;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;transition:border-color .2s}
.foto-circle:hover{border-color:#00c6b8}
.foto-circle img{width:100%;height:100%;object-fit:cover}
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(0,198,184,.06),transparent),#07090f}
.auth-box{background:#0a0e18;border:1px solid #0d1828;border-radius:13px;padding:30px 22px;width:100%;max-width:370px}
.auth-logo{font-family:'Cormorant Garamond',serif;font-size:23px;letter-spacing:4px;background:linear-gradient(135deg,#00c6b8,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-align:center;margin-bottom:3px}
.auth-sub{font-size:9px;color:#2d4a66;text-align:center;letter-spacing:2px;text-transform:uppercase;margin-bottom:22px}
.auth-tabs{display:flex;background:#050810;border-radius:7px;padding:3px;margin-bottom:18px}
.auth-tab{flex:1;padding:7px;border:none;background:transparent;border-radius:5px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;color:#3d5a7a;transition:all .15s}
.auth-tab.on{background:#0d1828;color:#00c6b8}
.admin-section{background:#050810;border:1px solid #0d1828;border-radius:8px;padding:12px;margin-bottom:8px}
.admin-row{display:flex;align-items:center;justify-content:space-between;padding:8px;background:#040710;border-radius:6px;margin-bottom:4px}
.week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:8px}
.week-day{background:#050810;border:1px solid #0d1828;border-radius:7px;padding:6px;min-height:80px}
.week-day-n{font-size:9px;color:#2d4a66;text-align:center;margin-bottom:4px}
.week-day.hoje{border-color:#00c6b8}
.week-event{background:#003d39;border-left:2px solid #00c6b8;padding:3px 5px;border-radius:3px;font-size:9px;color:#5ae0d8;margin-bottom:2px;cursor:pointer;line-height:1.3}
.field-row{display:flex;gap:5px;align-items:flex-start;padding:5px;background:#040810;border-radius:5px;margin-bottom:3px}
.trial-bar{background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(0,198,184,.05));border:1px solid rgba(245,158,11,.16);border-radius:8px;padding:9px 13px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.loading{display:flex;align-items:center;justify-content:center;height:60px;color:#2d4a66;font-size:12px}
`;


// ──────────────────────────────────────────────
// TERMOS MODAL — mostrado na 1ª sessão de cada utilizador
// ──────────────────────────────────────────────
function TermosModal({ onAceitar }) {
  const [scroll, setScroll] = useState(false);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0a0e18",border:"1px solid #1a3a5c",borderRadius:14,width:"100%",maxWidth:520,maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        {/* Cabeçalho */}
        <div style={{padding:"20px 22px 14px",borderBottom:"1px solid #0d1828"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#00c6b8",marginBottom:3}}>{TERMOS_APP.titulo}</div>
          <div style={{fontSize:10,color:"#3d5a7a",letterSpacing:1}}>{TERMOS_APP.subtitulo}</div>
        </div>
        {/* Corpo */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px"}}
          onScroll={e => { if(e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 20) setScroll(true); }}>
          {TERMOS_APP.seccoes.map((s,i) => (
            <div key={i} style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#b0c4d8",marginBottom:5}}>{s.titulo}</div>
              <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.7}}>{s.texto}</div>
            </div>
          ))}
          <div style={{background:"rgba(0,198,184,.05)",border:"1px solid rgba(0,198,184,.2)",borderRadius:8,padding:"10px 12px",marginTop:8}}>
            <div style={{fontSize:11,color:"#5ae0d8",lineHeight:1.6}}>{TERMOS_APP.rodape}</div>
          </div>
          {!scroll && (
            <div style={{textAlign:"center",fontSize:10,color:"#2d4a66",marginTop:12}}>
              ↓ Faz scroll até ao fim para poderes aceitar
            </div>
          )}
        </div>
        {/* Rodapé */}
        <div style={{padding:"14px 22px",borderTop:"1px solid #0d1828"}}>
          <button
            className="btn btn-p"
            disabled={!scroll}
            onClick={onAceitar}
            style={{opacity: scroll ? 1 : 0.4, cursor: scroll ? "pointer" : "not-allowed"}}>
            {scroll ? "✅ Li, compreendi e aceito os termos" : "Lê até ao fim para aceitar"}
          </button>
          <div style={{fontSize:9,color:"#1a2840",marginTop:7,textAlign:"center"}}>
            VitalDoctor · Versão {TERMOS_APP.versao} · {TERMOS_APP.data} · Dados armazenados na EU (RGPD)
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// AVISO RODAPÉ — aparece em todas as páginas da app
// ──────────────────────────────────────────────
function AvisoRodape() {
  return (
    <div style={{padding:"5px 18px 8px",background:"#040710",borderTop:"1px solid #0d1828",fontSize:8,color:"#1a2840",textAlign:"center",lineHeight:1.5,flexShrink:0}}>
      {AVISO_RODAPE}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════
function Auth({ onLogin }) {
  const [modo, setModo] = useState("landing"); // landing | login | reg | confirmar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  const entrar = async () => {
    setLoad(true); setErr("");
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) { setErr("Email ou senha incorretos."); setLoad(false); return; }
    const { data: prof } = await sb.from("profiles").select("*").eq("id", data.user.id).single();
    setLoad(false);
    onLogin({ ...data.user, ...prof });
  };

  const registar = async () => {
    if (!nome || !email || !senha) { setErr("Preenche todos os campos."); return; }
    if (senha.length < 6) { setErr("A senha precisa de pelo menos 6 caracteres."); return; }
    setLoad(true); setErr("");
    const { data, error } = await sb.auth.signUp({ email, password: senha, options: { data: { nome } } });
    if (error) { setErr(error.message); setLoad(false); return; }
    setLoad(false); setModo("confirmar");
  };

  const FEATURES = [
    { icon:"🗂️", t:"Gestão de Pacientes", d:"Fichas completas, histórico de consultas e evolução." },
    { icon:"📅", t:"Agenda Inteligente", d:"Agenda visual, packs de sessões e lembretes automáticos." },
    { icon:"🧠", t:"Consultas Guiadas", d:"Fluxos passo a passo para qualquer tipo de atendimento." },
    { icon:"💳", t:"Controlo Financeiro", d:"Registo de pagamentos, packs e alertas de dívida." },
    { icon:"📹", t:"Teleconsulta", d:"Videochamada gratuita integrada, sem apps externas." },
    { icon:"🌐", t:"Mini Site Próprio", d:"Página pública personalizável para captares novos pacientes." },
    { icon:"📤", t:"Pré-Consulta Digital", d:"Envia fichas por WhatsApp — o paciente preenche em casa." },
    { icon:"🔒", t:"Dados Seguros (RGPD)", d:"Isolamento total entre terapeutas. Os teus dados são teus." },
  ];

  const PLANOS = [
    { nome:"Gratuito", preco:"0€", periodo:"para sempre", cor:"#3d5a7a", features:["Até 5 pacientes","Agenda básica","Mini Site","Consultas guiadas","Suporte por email"], cta:"Começar grátis", modo:"reg" },
    { nome:"Profissional", preco:"19€", periodo:"/mês", cor:"#00c6b8", destaque:true, features:["Pacientes ilimitados","Packs & Pagamentos","Teleconsulta","Pré-consulta digital","Farmácia de conhecimento","Módulos personalizados","Suporte prioritário"], cta:"14 dias grátis", modo:"reg" },
    { nome:"Clínica", preco:"39€", periodo:"/mês", cor:"#5a9ab8", features:["Tudo do Profissional","Multi-terapeuta","Painel de clínica","Relatórios agregados","Módulos exclusivos","Onboarding dedicado"], cta:"Falar connosco", modo:"reg" },
  ];

  if (modo === "confirmar") return (
    <div style={{minHeight:"100vh",background:"#050810",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#07101c",border:"1px solid #0d1828",borderRadius:16,padding:32,maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>📧</div>
        <div style={{fontSize:"1.2rem",fontWeight:700,color:"#dde4f0",marginBottom:8}}>Confirma o teu email</div>
        <div style={{color:"#5a7a9a",fontSize:13,lineHeight:1.7,marginBottom:20}}>Enviámos um link de confirmação para <strong style={{color:"#00c6b8"}}>{email}</strong>. Abre o email e clica no link para activar a tua conta.</div>
        <div style={{background:"rgba(0,198,184,.06)",border:"1px solid #00c6b840",borderRadius:10,padding:12,marginBottom:16,fontSize:11,color:"#5ae0d8"}}>
          ✨ Os teus <strong>14 dias de teste gratuito</strong> começam assim que confirmares o email.
        </div>
        <button style={{width:"100%",padding:"12px 0",borderRadius:10,background:"#0d1828",border:"1px solid #1a3a5c",color:"#b0c4d8",fontSize:13,cursor:"pointer"}} onClick={() => setModo("login")}>← Ir para login</button>
      </div>
    </div>
  );

  if (modo === "login" || modo === "reg") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#050810 0%,#07131e 60%,#050c16 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{marginBottom:24,textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:800,color:"#00c6b8",letterSpacing:2,fontFamily:"Georgia,serif"}}>VITALDOCTOR</div>
        <div style={{fontSize:11,color:"#3d5a7a",letterSpacing:1,marginTop:2}}>CONSULTÓRIO TERAPÊUTICO DIGITAL</div>
      </div>
      <div style={{background:"#07101c",border:"1px solid #0d1828",borderRadius:16,padding:"28px 24px",maxWidth:360,width:"100%"}}>
        <div style={{display:"flex",gap:0,marginBottom:20,background:"#050810",borderRadius:10,padding:3}}>
          <button onClick={()=>{setModo("login");setErr("");}} style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:modo==="login"?"#0d1828":"transparent",color:modo==="login"?"#dde4f0":"#5a7a9a",fontSize:13,fontWeight:modo==="login"?700:400,cursor:"pointer"}}>Entrar</button>
          <button onClick={()=>{setModo("reg");setErr("");}} style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:modo==="reg"?"#0d1828":"transparent",color:modo==="reg"?"#00c6b8":"#5a7a9a",fontSize:13,fontWeight:modo==="reg"?700:400,cursor:"pointer"}}>Criar conta</button>
        </div>
        {modo==="reg"&&<div style={{marginBottom:10}}><span className="lbl">Nome completo</span><input className="inp" placeholder="O teu nome" value={nome} onChange={e=>setNome(e.target.value)}/></div>}
        <div style={{marginBottom:10}}><span className="lbl">Email</span><input className="inp" type="email" placeholder="email@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(modo==="login"?entrar():registar())}/></div>
        <div style={{marginBottom:14}}><span className="lbl">Senha</span><input className="inp" type="password" placeholder="••••••••" value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(modo==="login"?entrar():registar())}/></div>
        {err&&<div className="al al-d" style={{marginBottom:10}}>{err}</div>}
        {modo==="reg"&&(
          <div style={{background:"rgba(0,198,184,.06)",border:"1px solid #00c6b830",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#5ae0d8",textAlign:"center"}}>
            🎁 <strong>14 dias gratuitos</strong> · Sem cartão · Cancela quando quiseres
          </div>
        )}
        {err && <div style={{padding:"8px 12px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,fontSize:11,color:"#f87171",marginBottom:8}}>{err}</div>}
        <button className="btn btn-p" style={{fontSize:14,padding:"13px 0"}} onClick={modo==="login"?entrar:registar} disabled={load}>
          {load?"A processar...":modo==="login"?"Entrar na minha conta":"Criar conta gratuita →"}
        </button>
        {modo==="login"&&<div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#3d5a7a",cursor:"pointer"}} onClick={()=>{setModo("reg");setErr("");}}>Sem conta? <span style={{color:"#00c6b8"}}>Regista-te grátis</span></div>}
        <button style={{width:"100%",marginTop:10,padding:"8px 0",background:"none",border:"none",color:"#3d5a7a",fontSize:10,cursor:"pointer"}} onClick={()=>setModo("landing")}>← Ver funcionalidades</button>
        <div style={{marginTop:14,paddingTop:10,borderTop:"1px solid #0d1828",fontSize:9,lineHeight:1.6,color:"#2d4a66",textAlign:"center"}}>
          Ferramenta de apoio à gestão. Não substitui o julgamento clínico do profissional.
        </div>
      </div>
    </div>
  );

  // ── LANDING PAGE ──────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#050810",color:"#b0c4d8",fontFamily:"Arial,sans-serif"}}>
      {/* HERO */}
      <div style={{background:"linear-gradient(160deg,#050810 0%,#071422 50%,#050810 100%)",padding:"48px 20px 40px",textAlign:"center",borderBottom:"1px solid #0d1828"}}>
        <div style={{fontSize:11,color:"#00c6b8",letterSpacing:3,fontWeight:700,marginBottom:8}}>CONSULTÓRIO TERAPÊUTICO DIGITAL</div>
        <div style={{fontSize:32,fontWeight:800,color:"#dde4f0",lineHeight:1.2,marginBottom:12,fontFamily:"Georgia,serif"}}>VITALDOCTOR</div>
        <div style={{fontSize:16,color:"#8ba3c0",lineHeight:1.6,marginBottom:6,maxWidth:420,margin:"0 auto 12px"}}>A plataforma de gestão clínica para terapeutas que querem focar-se nos pacientes — não na burocracia.</div>
        <div style={{fontSize:13,color:"#5a7a9a",marginBottom:28}}>Agenda · Consultas · Pacientes · Financeiro · Teleconsulta · Mini Site</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setModo("reg")} style={{padding:"14px 28px",borderRadius:10,background:"#00c6b8",border:"none",color:"#050810",fontSize:14,fontWeight:800,cursor:"pointer"}}>Começar grátis →</button>
          <button onClick={()=>setModo("login")} style={{padding:"14px 24px",borderRadius:10,background:"transparent",border:"1px solid #1a3a5c",color:"#b0c4d8",fontSize:14,cursor:"pointer"}}>Já tenho conta</button>
        </div>
        <div style={{marginTop:16,fontSize:11,color:"#3d5a7a"}}>✓ 14 dias grátis &nbsp;·&nbsp; ✓ Sem cartão &nbsp;·&nbsp; ✓ Cancela a qualquer momento</div>
      </div>

      {/* FEATURES GRID */}
      <div style={{padding:"36px 20px",maxWidth:600,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:11,color:"#00c6b8",letterSpacing:2,fontWeight:700,marginBottom:6}}>TUDO O QUE PRECISAS</div>
          <div style={{fontSize:20,fontWeight:700,color:"#dde4f0"}}>Uma plataforma. Tudo integrado.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {FEATURES.map(f=>(
            <div key={f.t} style={{background:"#07101c",border:"1px solid #0d1828",borderRadius:12,padding:"16px 14px"}}>
              <div style={{fontSize:22,marginBottom:6}}>{f.icon}</div>
              <div style={{fontWeight:700,color:"#dde4f0",fontSize:12,marginBottom:4}}>{f.t}</div>
              <div style={{fontSize:10,color:"#5a7a9a",lineHeight:1.5}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PLANOS */}
      <div style={{padding:"0 20px 36px",maxWidth:600,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:11,color:"#00c6b8",letterSpacing:2,fontWeight:700,marginBottom:6}}>PLANOS</div>
          <div style={{fontSize:20,fontWeight:700,color:"#dde4f0"}}>Começa grátis. Cresce quando quiseres.</div>
        </div>
        {PLANOS.map(p=>(
          <div key={p.nome} style={{background:p.destaque?"linear-gradient(135deg,#071c2e,#0a2a3a)":"#07101c",border:`2px solid ${p.destaque?p.cor:"#0d1828"}`,borderRadius:14,padding:"20px 18px",marginBottom:12,position:"relative"}}>
            {p.destaque&&<div style={{position:"absolute",top:-10,right:16,background:"#00c6b8",color:"#050810",fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:10,letterSpacing:1}}>MAIS POPULAR</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontWeight:700,color:p.cor,fontSize:14}}>{p.nome}</div>
                <div style={{fontSize:9,color:"#3d5a7a",marginTop:2}}>Para terapeutas {p.nome==="Clínica"?"com equipa":"individuais"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:800,color:"#dde4f0"}}>{p.preco}</div>
                <div style={{fontSize:10,color:"#5a7a9a"}}>{p.periodo}</div>
              </div>
            </div>
            {p.features.map(f=><div key={f} style={{fontSize:11,color:"#8ba3c0",padding:"3px 0",display:"flex",gap:8}}><span style={{color:p.cor}}>✓</span>{f}</div>)}
            <button onClick={()=>setModo(p.modo)} style={{width:"100%",marginTop:14,padding:"11px 0",borderRadius:10,background:p.destaque?p.cor:"transparent",border:p.destaque?"none":`1px solid ${p.cor}`,color:p.destaque?"#050810":p.cor,fontSize:13,fontWeight:700,cursor:"pointer"}}>{p.cta}</button>
          </div>
        ))}
        <div style={{textAlign:"center",fontSize:10,color:"#3d5a7a",marginTop:8,lineHeight:1.7}}>
          🛡️ Os primeiros <strong style={{color:"#5a9ab8"}}>14 dias são totalmente gratuitos</strong> — prazo legalmente previsto para desistência sem custo (Decreto-Lei n.º 24/2014).<br/>
          Sem compromisso. Sem cartão. Cancela a qualquer momento.
        </div>
      </div>

      {/* TESTEMUNHOS */}
      <div style={{padding:"0 20px 36px",maxWidth:600,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:11,color:"#00c6b8",letterSpacing:2,fontWeight:700,marginBottom:6}}>TERAPEUTAS QUE JÁ USAM</div>
        </div>
        {[
          {nome:"Ana F.", terapia:"Terapeuta Holística",t:"Finalmente tenho tudo num só lugar. Poupei mais de 3h por semana em burocracia."},
          {nome:"Marco S.", terapia:"Psicoterapeuta",t:"O módulo de pré-consulta por WhatsApp é genial. Os pacientes chegam muito mais preparados."},
          {nome:"Carla M.", terapia:"Nutricionista & Coach",t:"O mini site captou 4 novos pacientes no primeiro mês. Valeu logo o investimento."},
        ].map(t=>(
          <div key={t.nome} style={{background:"#07101c",border:"1px solid #0d1828",borderRadius:12,padding:"16px 14px",marginBottom:10}}>
            <div style={{fontSize:12,color:"#b0c4d8",lineHeight:1.6,marginBottom:10,fontStyle:"italic"}}>"{t.t}"</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#1a4a6c,#0d2535)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>👤</div>
              <div><div style={{fontSize:11,fontWeight:700,color:"#dde4f0"}}>{t.nome}</div><div style={{fontSize:9,color:"#5a7a9a"}}>{t.terapia}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA FINAL */}
      <div style={{padding:"32px 20px",background:"linear-gradient(135deg,#071422,#050c16)",borderTop:"1px solid #0d1828",textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:"#dde4f0",marginBottom:8}}>Pronto para começar?</div>
        <div style={{fontSize:12,color:"#5a7a9a",marginBottom:20}}>Junta-te a terapeutas que já escolheram trabalhar de forma mais inteligente.</div>
        <button onClick={()=>setModo("reg")} style={{padding:"14px 36px",borderRadius:10,background:"#00c6b8",border:"none",color:"#050810",fontSize:14,fontWeight:800,cursor:"pointer"}}>Criar conta gratuita →</button>
        <div style={{marginTop:12,fontSize:10,color:"#3d5a7a"}}>14 dias grátis · Sem cartão · RGPD</div>
        <div style={{marginTop:20,fontSize:10,color:"#1a3a5c"}}>
          suportevitaldoctor@gmail.com &nbsp;·&nbsp; <a href="https://t.me/+rOkqo8Orr-NhOTVk" target="_blank" style={{color:"#1a3a5c"}}>Telegram</a>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════

// ─── DASHBOARD FEEDBACKS ─────────────────────────────────────────────────────
function DashboardFeedbacks({ user }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.from("consultas")
      .select("paciente_nome,feedback_paciente,feedback_nota,criado_em,pacientes(nome)")
      .eq("terapeuta_id", user?.id)
      .not("feedback_paciente", "is", null)
      .order("criado_em", { ascending: false })
      .limit(5)
      .then(({ data }) => { setFeedbacks(data || []); setLoading(false); });
  }, [user?.id]);

  if (loading || feedbacks.length === 0) return null;

  return (
    <div className="card" style={{marginBottom:10}}>
      <div className="card-t">⭐ Feedbacks Recentes</div>
      {feedbacks.map((f, i) => (
        <div key={i} style={{padding:"10px 0",borderBottom: i<feedbacks.length-1?"1px solid #0d1828":"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:700,color:"#b0c4d8"}}>{f.pacientes?.nome || f.paciente_nome || "Paciente"}</div>
            {f.feedback_nota && (
              <div style={{display:"flex",gap:2}}>
                {[1,2,3,4,5].map(n=><span key={n} style={{fontSize:11,color:n<=f.feedback_nota?"#f59e0b":"#1a2a3a"}}>★</span>)}
              </div>
            )}
          </div>
          {f.feedback_paciente && <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.5,fontStyle:"italic"}}>"{f.feedback_paciente}"</div>}
        </div>
      ))}
    </div>
  );
}



// ─── PÁGINA DE PREÇOS / SUBSCRIÇÃO ──────────────────────────────────────────
function PaginaPrecos({ user, onVoltar }) {
  const planoActual = user?.plano || "trial";
  const isAdmin = user?.role === "superadmin";

  const PLANOS = [
    {
      id: "basico", nome: "Básico", preco: "19€", periodo: "/mês",
      cor: "#1a4a6c", destaque: false,
      desc: "Para terapeutas que estão a começar",
      features: [
        "✅ Até 30 pacientes",
        "✅ Agenda e marcações",
        "✅ Nova Consulta (método universal)",
        "✅ Pré-Consulta digital",
        "✅ Relatórios PDF",
        "✅ Mini Site",
        "✅ WhatsApp integrado",
        "❌ Módulos avançados",
        "❌ Hikari Fafe",
      ]
    },
    {
      id: "pro", nome: "Pro", preco: "39€", periodo: "/mês",
      cor: "#00c6b8", destaque: true,
      desc: "Para terapeutas em crescimento",
      features: [
        "✅ Pacientes ilimitados",
        "✅ Tudo do Básico",
        "✅ Módulos terapêuticos personalizados",
        "✅ Família e grupos",
        "✅ Packs de consultas",
        "✅ Dashboard financeiro completo",
        "✅ Histórico e evolução",
        "✅ Assistente IA avançado",
        "❌ Módulos exclusivos certificados",
      ]
    },
    {
      id: "premium", nome: "Premium", preco: "69€", periodo: "/mês",
      cor: "#9a5ae0", destaque: false,
      desc: "Acesso completo + módulos exclusivos",
      features: [
        "✅ Tudo do Pro",
        "✅ Módulo Ansiedade & Depressão",
        "✅ Módulo Hikari Fafe",
        "✅ Intervenção Energética",
        "✅ 72 Nomes de Deus",
        "✅ Etiquetas Hebraicas",
        "✅ Suporte prioritário",
        "✅ Formação incluída",
      ]
    },
  ];

  return (
    <div className="fade" style={{paddingBottom:60}}>
      <div style={{textAlign:"center",padding:"24px 16px 20px"}}>
        {onVoltar && <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:16}} onClick={onVoltar}>← Voltar</button>}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#dde4f0",marginBottom:6}}>Planos VitalDoctor</div>
        <div style={{fontSize:12,color:"#5a7a9a"}}>Escolhe o plano certo para a tua prática terapêutica</div>
        {planoActual === "trial" && (
          <div style={{marginTop:10,padding:"8px 16px",background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",borderRadius:8,display:"inline-block",fontSize:11,color:"#f59e0b"}}>
            ⏳ Estás em período de teste gratuito
          </div>
        )}
      </div>

      {PLANOS.map(p => (
        <div key={p.id} style={{
          margin:"0 0 12px 0",
          borderRadius:12,
          border:`2px solid ${p.destaque ? p.cor : p.cor+"40"}`,
          background:p.destaque ? `${p.cor}10` : "#050810",
          overflow:"hidden",
          position:"relative",
        }}>
          {p.destaque && (
            <div style={{background:p.cor,textAlign:"center",padding:"4px 0",fontSize:10,fontWeight:700,color:"#050810",letterSpacing:1}}>
              ⭐ MAIS POPULAR
            </div>
          )}
          <div style={{padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontWeight:800,fontSize:16,color:"#dde4f0"}}>{p.nome}</div>
                <div style={{fontSize:11,color:"#5a7a9a"}}>{p.desc}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:800,fontSize:22,color:p.cor}}>{p.preco}</div>
                <div style={{fontSize:10,color:"#5a7a9a"}}>{p.periodo}</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
              {p.features.map((f,i) => (
                <div key={i} style={{fontSize:11,color:f.startsWith("✅")?"#b0c4d8":"#3d5a7a"}}>{f}</div>
              ))}
            </div>
            {planoActual === p.id ? (
              <div style={{textAlign:"center",padding:"10px 0",borderRadius:8,border:`1px solid ${p.cor}`,color:p.cor,fontSize:12,fontWeight:700}}>
                ✓ Plano actual
              </div>
            ) : (
              <button
                onClick={() => window.open(`https://pay.hotmart.com/vitaldoctor_${p.id}?email=${encodeURIComponent(user?.email||"")}`, "_blank")}
                style={{width:"100%",padding:"12px 0",borderRadius:8,border:"none",background:p.cor,color:p.destaque?"#050810":"#dde4f0",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                {planoActual === "trial" ? "Começar agora" : "Mudar para " + p.nome} →
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{textAlign:"center",padding:"16px 8px",color:"#3d5a7a",fontSize:11,lineHeight:1.7}}>
        💳 Pagamento seguro via Hotmart<br/>
        🔒 Cancela quando quiseres — sem compromissos<br/>
        📞 Dúvidas? <span style={{color:"#00c6b8",cursor:"pointer"}} onClick={()=>window.open("https://t.me/+rOkqo8Orr-NhOTVk","_blank")}>Fala connosco no Telegram</span>
      </div>

      {isAdmin && (
        <div style={{marginTop:8,padding:12,background:"#0a1e2e",border:"1px solid #1a3a5c",borderRadius:8,fontSize:10,color:"#3d5a7a"}}>
          🔧 <strong style={{color:"#00c6b8"}}>Super Admin:</strong> Para activar planos manualmente, vai ao Painel Admin → Subscritores → toggle de módulos.
        </div>
      )}
    </div>
  );
}

// ─── GERADOR DE PDF PROFISSIONAL ────────────────────────────────────────────
function abrirPDFProfissional({ titulo, paciente, terapeuta, texto, logo, nomePratica }) {
  const w = window.open("", "_blank");
  if (!w) { alert("Activa os popups para gerar o PDF."); return; }
  const logoHtml = logo ? `<img src="${logo}" style="max-height:52px;margin-bottom:6px;display:block" />` : "";
  const cabecalho = nomePratica || "VitalDoctor";
  const dataTxt = new Date().toLocaleDateString("pt-PT", { day:"2-digit", month:"long", year:"numeric" });
  const htmlTexto = (texto||"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\n/g,"<br>")
    .replace(/(═{3,}|─{3,})/g,'<hr style="border:1px solid #ddd;margin:10px 0">')
    .replace(/^(🔯|🌀|⚡|🔍|🌿|📋|✨|🛡️|🔮|💡|📿)(.+)$/gm,'<div style="font-weight:700;color:#1a6b61;margin:12px 0 4px">$1$2</div>');

  w.document.write(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${titulo||"Relatório"}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; padding: 36px; max-width: 720px; margin: 0 auto; color: #1a1a2e; font-size: 13px; line-height: 1.8; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a6b61; padding-bottom: 14px; margin-bottom: 20px; }
    .header-left { flex: 1; }
    .clinica { font-size: 20px; font-weight: bold; color: #1a6b61; letter-spacing: 2px; margin-bottom: 2px; }
    .subtitulo { font-size: 10px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
    .header-right { text-align: right; font-size: 11px; color: #888; }
    .patient-box { background: #f8f9fa; border-left: 4px solid #1a6b61; padding: 10px 14px; margin-bottom: 20px; border-radius: 0 6px 6px 0; }
    .patient-nome { font-size: 15px; font-weight: bold; color: #1a1a2e; }
    .patient-info { font-size: 11px; color: #666; margin-top: 2px; }
    .content { white-space: pre-wrap; line-height: 1.9; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #ddd; font-size: 10px; color: #aaa; text-align: center; }
    .badge { display: inline-block; background: #1a6b6120; color: #1a6b61; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; margin-bottom: 12px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div class="clinica">${cabecalho}</div>
      <div class="subtitulo">Relatório Terapêutico Confidencial</div>
    </div>
    <div class="header-right">
      <div>${dataTxt}</div>
      ${terapeuta ? `<div style="margin-top:4px"><strong>${terapeuta}</strong></div>` : ""}
    </div>
  </div>
  ${paciente ? `<div class="patient-box">
    <div class="patient-nome">👤 ${paciente.nome||""}</div>
    <div class="patient-info">${[paciente.telefone, paciente.email, paciente.data_nasc ? "Nasc: "+new Date(paciente.data_nasc).toLocaleDateString("pt-PT") : ""].filter(Boolean).join(" · ")}</div>
  </div>` : ""}
  <div class="badge">${titulo||"Relatório"}</div>
  <div class="content">${htmlTexto}</div>
  <div class="footer">
    Documento gerado por VitalDoctor · ${dataTxt} · Uso exclusivo do profissional de saúde<br>
    Este relatório é de natureza terapêutica complementar e não substitui avaliação médica.
  </div>
</body>
</html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ─── DADOS EXEMPLO DASHBOARD ────────────────────────────────────────────────
const DASH_EXEMPLO = {
  nomePratica: "Clínica Harmonia Vital",
  subtitulo: "Saúde Integrativa e Bem-Estar",
  saudacao: "Bom dia! Pronto(a) para uma sessão transformadora?",
  metodosAtivos: [
    { id: "m1", icone: "🌿", nome: "Consulta de Avaliação", desc: "Primeira sessão — anamnese e definição de objetivos terapêuticos.", ativo: true },
    { id: "m2", icone: "🔬", nome: "Análise Energética", desc: "Sessão de análise profunda com protocolo personalizado.", ativo: true },
    { id: "m3", icone: "🔄", nome: "Sessão de Seguimento", desc: "Monitorização de progresso e ajuste do protocolo.", ativo: true },
    { id: "m4", icone: "💊", nome: "Consulta de Nutrição", desc: "Orientação nutricional integrada ao plano terapêutico.", ativo: false },
  ],
  pacienteExemplo: { nome: "Maria S.", proxima: "Hoje, 14h30", motivo: "Ansiedade e insónia recorrente" },
  alertas: [
    { tipo: "pag", msg: "João P. — Sessão 2 por pagar (€40)", cor: "#f87171" },
    { tipo: "ok",  msg: "Ana F. — Protocolo concluído ✓", cor: "#5ae0d8" },
  ],
};

function Dashboard({ user, pacs, agenda, go }) {
  const dias = user?.trial_fim ? Math.max(0, Math.ceil((new Date(user.trial_fim) - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const trial = user?.plano === "trial" && user?.role !== "superadmin";
  const hojeMs = agenda.filter(m => m.data === hoje());

  // Dados reais de pagamentos do Supabase
  const [resumoFin, setResumoFin] = useState({ pago: 0, pendente: 0, consultas: 0 });
  useEffect(() => {
    if (!user?.id) return;
    // Pagamentos reais
    sb.from("pagamentos").select("valor,estado")
      .eq("terapeuta_id", user.id)
      .then(({ data }) => {
        const pgs = data || [];
        const pago = pgs.filter(p => p.estado === "pago").reduce((s,p) => s + parseFloat(p.valor||0), 0);
        const pendente = pgs.filter(p => p.estado !== "pago").reduce((s,p) => s + parseFloat(p.valor||0), 0);
        setResumoFin(r => ({ ...r, pago, pendente }));
      }).catch(() => {});
    // Total consultas do mês actual
    const mes = new Date().toISOString().slice(0, 7); // YYYY-MM
    sb.from("consultas").select("id", { count: "exact" })
      .eq("terapeuta_id", user.id)
      .gte("data", mes + "-01")
      .then(({ count }) => setResumoFin(r => ({ ...r, consultas: count || 0 })))
      .catch(() => {});
  }, [user?.id]);

  const DASH_PADRAO = user?.config?.dash || DASH_EXEMPLO;
  const [dash, setDash] = useState({ ...DASH_EXEMPLO, ...DASH_PADRAO });
  const [editando, setEditando] = useState(false);
  const [editDash, setEditDash] = useState(null);
  const [ok, setOk] = useState("");

  const abrirEditor = () => { setEditDash(JSON.parse(JSON.stringify(dash))); setEditando(true); };
  const cancelar = () => { setEditando(false); setEditDash(null); };
  const guardar = async () => {
    const novoConfig = { ...(user?.config || {}), dash: editDash };
    const { error } = await sb.from("profiles").update({ config: novoConfig }).eq("id", user.id);
    if (!error) { setDash(editDash); setOk("✅ Dashboard guardado!"); setTimeout(() => setOk(""), 2500); }
    setEditando(false);
  };
  const toggleMetodo = (id) => setEditDash(d => ({ ...d, metodosAtivos: d.metodosAtivos.map(m => m.id === id ? { ...m, ativo: !m.ativo } : m) }));
  const addMetodo = () => setEditDash(d => ({ ...d, metodosAtivos: [...d.metodosAtivos, { id: "m"+Date.now(), icone: "🩺", nome: "Novo Método", desc: "", ativo: true }] }));
  const updateMetodo = (id, campo, val) => setEditDash(d => ({ ...d, metodosAtivos: d.metodosAtivos.map(m => m.id === id ? { ...m, [campo]: val } : m) }));
  const removeMetodo = (id) => setEditDash(d => ({ ...d, metodosAtivos: d.metodosAtivos.filter(m => m.id !== id) }));

  // MODO EDITAR
  if (editando && editDash) return (
    <div className="fade" style={{paddingBottom:60}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={cancelar}>✕ Cancelar</button>
        <div style={{flex:1,fontWeight:700,fontSize:14,color:"#dde4f0"}}>✏️ Editar Dashboard</div>
        <button className="btn btn-p btn-sm" style={{width:"auto",fontSize:11}} onClick={guardar}>💾 Guardar</button>
      </div>
      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">Identidade</div>
        <label className="lbl">Nome da Prática / Clínica</label>
        <input className="inp" value={editDash.nomePratica} onChange={e=>setEditDash(d=>({...d,nomePratica:e.target.value}))} style={{marginBottom:8}}/>
        <label className="lbl">Subtítulo</label>
        <input className="inp" value={editDash.subtitulo} onChange={e=>setEditDash(d=>({...d,subtitulo:e.target.value}))} style={{marginBottom:8}}/>
        <label className="lbl">Mensagem de boas-vindas</label>
        <input className="inp" value={editDash.saudacao} onChange={e=>setEditDash(d=>({...d,saudacao:e.target.value}))}/>
      </div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div className="card-t" style={{margin:0}}>Métodos de Atendimento</div>
          <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:10}} onClick={addMetodo}>+ Adicionar</button>
        </div>
        <div style={{fontSize:10,color:"#3d5a7a",marginBottom:8}}>Define os tipos de consulta que aparecem em "Iniciar Consulta". Activa/desactiva com o toggle.</div>
        {editDash.metodosAtivos.map((m,i) => (
          <div key={m.id} style={{background:"#050810",border:`1px solid ${m.ativo?"#1a4a3a":"#0d1828"}`,borderRadius:8,padding:10,marginBottom:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
              <input style={{width:30,background:"#0d1828",border:"1px solid #1a3a5c",borderRadius:4,padding:"3px 4px",color:"#b0c4d8",fontSize:16,textAlign:"center"}} value={m.icone} onChange={e=>updateMetodo(m.id,"icone",e.target.value)}/>
              <input className="inp" value={m.nome} onChange={e=>updateMetodo(m.id,"nome",e.target.value)} style={{flex:1,margin:0}}/>
              <button onClick={()=>toggleMetodo(m.id)} style={{background:m.ativo?"rgba(0,198,184,.15)":"rgba(90,26,26,.2)",border:`1px solid ${m.ativo?"#00c6b860":"#5a1a1a"}`,borderRadius:6,padding:"4px 8px",color:m.ativo?"#00c6b8":"#f87171",fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>{m.ativo?"✓ Ativo":"○ Inativo"}</button>
              <button onClick={()=>removeMetodo(m.id)} style={{background:"none",border:"none",color:"#5a2a2a",cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            <input className="inp" value={m.desc} onChange={e=>updateMetodo(m.id,"desc",e.target.value)} placeholder="Descrição breve..." style={{margin:0,fontSize:10}}/>
          </div>
        ))}
      </div>
    </div>
  );

  // MODO VISUALIZAR
  const metodosVisiveis = dash.metodosAtivos?.filter(m => m.ativo) || [];

  return (
    <div className="fade">
      {trial && dias > 0 && (
        <div className="trial-bar">
          <div style={{fontSize:11,color:"#fde68a"}}>Teste grátis: <strong style={{color:"#f59e0b"}}>{dias} {dias===1?"dia restante":"dias restantes"}</strong></div>
          <button className="btn btn-g btn-sm" style={{width:"auto"}}>Subscrever</button>
        </div>
      )}
      {trial && dias === 0 && (
        <div className="trial-bar">
          <div style={{fontSize:11,color:"#fde68a"}}>O teu <strong style={{color:"#f59e0b"}}>teste grátis terminou</strong> — subscreve.</div>
          <button className="btn btn-g btn-sm" style={{width:"auto"}}>Subscrever</button>
        </div>
      )}
      {ok && <div className="al al-ok" style={{marginBottom:8}}>{ok}</div>}

      {/* HERO IDENTIDADE */}
      <div style={{background:"linear-gradient(135deg,#071422,#0a1e2e)",border:"1px solid #1a3a5c",borderRadius:12,padding:"16px 18px",marginBottom:10,position:"relative"}}>
        <div style={{fontSize:9,color:"#00c6b8",letterSpacing:2,fontWeight:700,marginBottom:2}}>{dash.subtitulo}</div>
        <div style={{fontSize:16,fontWeight:800,color:"#dde4f0",marginBottom:4}}>{dash.nomePratica}</div>
        <div style={{fontSize:11,color:"#5a7a9a"}}>{dash.saudacao}</div>
        <button onClick={abrirEditor} style={{position:"absolute",top:10,right:10,background:"rgba(0,198,184,.08)",border:"1px solid #00c6b830",borderRadius:6,padding:"4px 8px",color:"#00c6b8",fontSize:10,cursor:"pointer"}}>✏️ Editar</button>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat"><div className="stat-n">{pacs.length||"—"}</div><div className="stat-l">Pacientes</div></div>
        <div className="stat"><div className="stat-n">{hojeMs.length||"0"}</div><div className="stat-l">Hoje</div></div>
        <div className="stat"><div className="stat-n" style={{color:"#5ae0d8"}}>€{resumoFin.pago.toFixed(0)}</div><div className="stat-l">Recebido</div></div>
        <div className="stat"><div className="stat-n" style={{color:resumoFin.pendente>0?"#fbbf24":"#00c6b8"}}>€{resumoFin.pendente.toFixed(0)}</div><div className="stat-l">Pendente</div></div>
      </div>

      {/* INICIAR CONSULTA — métodos do próprio terapeuta */}
      {metodosVisiveis.length > 0 && (
        <div className="card" style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div className="card-t" style={{margin:0}}>🩺 Iniciar Consulta</div>
            <button onClick={abrirEditor} style={{background:"none",border:"1px solid #0d1828",borderRadius:6,padding:"3px 8px",color:"#3d5a7a",fontSize:9,cursor:"pointer"}}>✏️</button>
          </div>
          {metodosVisiveis.map(m => (
            <div key={m.id} onClick={() => go && go("metodo","consulta")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#050810",border:"1px solid #0d1828",borderRadius:8,marginBottom:6,cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#00c6b8";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d1828";}}>
              <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#1a4a6c,#0d2535)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{m.icone}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{m.nome}</div>
                <div style={{fontSize:10,color:"#5a7a9a"}}>{m.desc}</div>
              </div>
              <div style={{color:"#00c6b8",fontSize:16}}>▶</div>
            </div>
          ))}
        </div>
      )}

      {/* AGENDA HOJE */}
      <div className="card" style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div className="card-t" style={{margin:0}}>📅 Agenda de Hoje</div>
          <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:9}} onClick={()=>go&&go("agenda")}>Ver tudo →</button>
        </div>
        {hojeMs.length === 0
          ? <div style={{color:"#1a2840",fontSize:11,textAlign:"center",padding:"12px 0"}}>Sem consultas marcadas para hoje</div>
          : hojeMs.sort((a,b)=>a.hora?.localeCompare(b.hora)).map(m=>{
            const pac = pacs.find(p=>p.id===m.paciente_id);
            const tel = (pac?.telefone||"").replace(/[^0-9]/g,"");
            return (
              <div key={m.id} className="agenda-row" style={{justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flex:1}}>
                  <div className="agenda-hora">{m.hora?.slice(0,5)}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{pac?.nome||"—"}</div>
                    <div style={{fontSize:9,color:"#2d4a66"}}>{m.tipo}·{m.formato||"Online"}·{m.duracao||60}min</div>
                  </div>
                </div>
                {tel && (
                  <button onClick={()=>{
                    const txt=`Olá ${pac?.nome||""}! Lembrete: tem consulta hoje às ${m.hora?.slice(0,5)}. Até já! 😊`;
                    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(txt)}`,"_blank");
                  }} style={{background:"#25D36618",border:"1px solid #25D36640",borderRadius:6,padding:"4px 7px",color:"#25D366",fontSize:10,cursor:"pointer",flexShrink:0}}>📱</button>
                )}
              </div>
            );
          })}
        {resumoFin.consultas > 0 && (
          <div style={{fontSize:9,color:"#3d5a7a",textAlign:"center",marginTop:8,padding:"4px 0",borderTop:"1px solid #0d1828"}}>
            📊 {resumoFin.consultas} consultas este mês
          </div>
        )}
      </div>

      <DashboardFeedbacks user={user} />

      {/* ACESSO RÁPIDO */}
      <div className="card">
        <div className="card-t">⚡ Acesso Rápido</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
          {[["👥","Pacientes","pacientes",null],["📅","Agenda","agenda",null],["💬","Mensagens","mensagens",null],["🏥","A Minha Clínica","clinica",null]].map(([ic,lb,m,ab])=>(
            <div key={lb} onClick={()=>go&&go(m,ab)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 11px",background:"#050810",border:"1px solid #0d1828",borderRadius:7,fontSize:11,color:"#b0c4d8",cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#00c6b8";e.currentTarget.style.color="#00c6b8";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d1828";e.currentTarget.style.color="#b0c4d8";}}>
              <span style={{fontSize:14}}>{ic}</span><span style={{fontWeight:600}}>{lb}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-s" style={{fontSize:11,padding:"8px 0",marginBottom:5}} onClick={()=>go&&go("metodo","preconsulta")}>📤 Enviar Pré-Consulta</button>
        <button className="btn btn-s" style={{fontSize:11,padding:"8px 0",marginBottom:5}} onClick={()=>go&&go("metodo","teleconsulta")}>📹 Iniciar Teleconsulta</button>
        <button className="btn btn-s" style={{fontSize:11,padding:"8px 0"}} onClick={()=>go&&go("metodo","packs")}>💳 Packs & Pagamentos</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PACIENTES
// ══════════════════════════════════════════════════════

// ─── WIDGET FAMÍLIA ─────────────────────────────────────────────────────────
function FamiliaWidget({ paciente, user, pacs, setPacs, onAbrirPaciente }) {
  const [modo, setModo] = useState("ver"); // ver | gerir | novoMembro
  const [novoNome, setNovoNome] = useState("");
  const [relacao, setRelacao] = useState("Familiar");
  const [msg, setMsg] = useState("");
  const [contactoRef, setContactoRef] = useState(""); // contacto via responsável

  // Membros da mesma família (mesmo grupo_familiar E mesmo terapeuta)
  const grupo = paciente?.grupo_familiar;
  const familia = grupo
    ? pacs.filter(p => p.grupo_familiar === grupo && p.id !== paciente.id)
    : [];

  // Responsável (quem tem o contacto principal)
  const responsavel = pacs.find(p => p.id === paciente?.responsavel_id);

  const definirGrupo = async (nome) => {
    const { error } = await sb.from("pacientes")
      .update({ grupo_familiar: nome })
      .eq("id", paciente.id);
    if (!error) {
      setPacs(ps => ps.map(p => p.id === paciente.id ? { ...p, grupo_familiar: nome } : p));
      setMsg("✅ Família criada!");
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const adicionarMembro = async () => {
    if (!novoNome.trim()) return;
    const grp = grupo || ("familia_" + paciente.id.substring(0, 8));
    // Se não tem grupo ainda, definir primeiro para o paciente actual
    if (!grupo) await definirGrupo(grp);
    // Criar novo paciente associado
    const { data, error } = await sb.from("pacientes").insert({
      nome: novoNome.trim(),
      terapeuta_id: user.id,
      grupo_familiar: grp,
      responsavel_id: contactoRef === "responsavel" ? paciente.id : null,
      relacao_familiar: relacao,
      telefone: contactoRef === "responsavel" ? paciente.telefone : "",
      notas: contactoRef === "responsavel" ? `Contacto via ${paciente.nome} (${paciente.telefone||"sem tel."})` : "",
    }).select().single();
    if (!error && data) {
      // Também actualizar o paciente actual para ter o grupo
      if (!grupo) await sb.from("pacientes").update({ grupo_familiar: grp }).eq("id", paciente.id);
      setPacs(ps => [...ps.map(p => p.id === paciente.id ? { ...p, grupo_familiar: grp } : p), data]);
      setNovoNome(""); setRelacao("Familiar"); setContactoRef("");
      setModo("ver");
      setMsg("✅ Membro adicionado à família!");
      setTimeout(() => setMsg(""), 2500);
    } else {
      setMsg("Erro: " + (error?.message || ""));
    }
  };

  const associarExistente = async (pacId) => {
    const grp = grupo || ("familia_" + paciente.id.substring(0, 8));
    if (!grupo) await definirGrupo(grp);
    await sb.from("pacientes").update({ grupo_familiar: grp }).eq("id", pacId);
    setPacs(ps => ps.map(p => p.id === pacId ? { ...p, grupo_familiar: grp } : p));
    if (!grupo) setPacs(ps => ps.map(p => p.id === paciente.id ? { ...p, grupo_familiar: grp } : p));
    setMsg("✅ Paciente associado à família!");
    setTimeout(() => setMsg(""), 2000);
    setModo("ver");
  };

  const removerDaFamilia = async (pacId) => {
    await sb.from("pacientes").update({ grupo_familiar: null, responsavel_id: null }).eq("id", pacId);
    setPacs(ps => ps.map(p => p.id === pacId ? { ...p, grupo_familiar: null, responsavel_id: null } : p));
  };

  const RELACOES = ["Cônjuge/Parceiro(a)","Filho(a)","Pai/Mãe","Irmão/Irmã","Avô/Avó","Neto(a)","Tio(a)","Sobrinho(a)","Primo(a)","Outro familiar"];
  const [buscaAssoc, setBuscaAssoc] = useState("");
  const candidatos = pacs.filter(p =>
    p.id !== paciente.id &&
    p.grupo_familiar !== grupo &&
    p.nome.toLowerCase().includes(buscaAssoc.toLowerCase())
  );

  return (
    <div>
      {msg && <div className="al al-ok" style={{marginBottom:8,fontSize:10}}>{msg}</div>}

      {/* Grupo familiar existente */}
      {familia.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginBottom:6,letterSpacing:1}}>
            👨‍👩‍👧‍👦 FAMÍLIA — {grupo}
          </div>
          {responsavel && responsavel.id !== paciente.id && (
            <div style={{fontSize:9,color:"#3d5a7a",marginBottom:6,padding:"5px 8px",background:"#050810",borderRadius:6,border:"1px solid #0d1828"}}>
              📞 Contacto principal: {responsavel.nome} ({responsavel.telefone||"sem tel."})
            </div>
          )}
          {familia.map(f => (
            <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#050810",border:"1px solid #0d1828",borderRadius:8,marginBottom:5}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#1a4a6c,#0d2535)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>👤</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:"#b0c4d8"}}>{f.nome}</div>
                <div style={{fontSize:9,color:"#3d5a7a"}}>
                  {f.relacao_familiar||"Familiar"}{f.telefone?" · "+f.telefone:f.responsavel_id===paciente.id?" · 📞 via "+paciente.nome:""}
                </div>
              </div>
              <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:9}} onClick={()=>onAbrirPaciente&&onAbrirPaciente(f)}>
                Ver ficha →
              </button>
            </div>
          ))}
        </div>
      )}

      {familia.length === 0 && !grupo && (
        <div style={{fontSize:10,color:"#2d4a66",textAlign:"center",padding:"10px 0",marginBottom:8}}>
          Nenhum familiar associado ainda.
        </div>
      )}

      {/* Acções */}
      {modo === "ver" && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button className="btn btn-s btn-sm" style={{fontSize:10,width:"auto"}} onClick={()=>setModo("novoMembro")}>
            ➕ Adicionar Familiar
          </button>
          {pacs.filter(p=>p.id!==paciente.id&&p.grupo_familiar!==grupo).length > 0 && (
            <button className="btn btn-s btn-sm" style={{fontSize:10,width:"auto"}} onClick={()=>setModo("associar")}>
              🔗 Associar Paciente Existente
            </button>
          )}
        </div>
      )}

      {/* Novo membro */}
      {modo === "novoMembro" && (
        <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:12}}>
          <div style={{fontWeight:700,fontSize:11,color:"#dde4f0",marginBottom:8}}>➕ Novo Familiar</div>
          <label style={{fontSize:9,color:"#5a7a9a",display:"block",marginBottom:3}}>Nome</label>
          <input className="inp" value={novoNome} onChange={e=>setNovoNome(e.target.value)} placeholder="Nome completo" style={{marginBottom:8}}/>
          <label style={{fontSize:9,color:"#5a7a9a",display:"block",marginBottom:3}}>Relação</label>
          <select className="inp" value={relacao} onChange={e=>setRelacao(e.target.value)} style={{marginBottom:8}}>
            {RELACOES.map(r=><option key={r}>{r}</option>)}
          </select>
          <label style={{fontSize:9,color:"#5a7a9a",display:"block",marginBottom:3}}>Contacto</label>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
            {[
              ["proprio","Tem o próprio contacto (preencher depois)"],
              ["responsavel",`Contacto via ${paciente.nome} (${paciente.telefone||"sem tel."})`],
            ].map(([v,l])=>(
              <div key={v} onClick={()=>setContactoRef(v)} style={{display:"flex",gap:6,alignItems:"center",padding:"6px 8px",borderRadius:6,border:`1px solid ${contactoRef===v?"#00c6b8":"#0d1828"}`,background:contactoRef===v?"rgba(0,198,184,.08)":"transparent",cursor:"pointer"}}>
                <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${contactoRef===v?"#00c6b8":"#3d5a7a"}`,background:contactoRef===v?"#00c6b8":"transparent",flexShrink:0}}/>
                <div style={{fontSize:9,color:contactoRef===v?"#00c6b8":"#5a7a9a"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            <button className="btn btn-s btn-sm" style={{flex:1,fontSize:10}} onClick={()=>setModo("ver")}>Cancelar</button>
            <button className="btn btn-p btn-sm" style={{flex:2,fontSize:10}} onClick={adicionarMembro} disabled={!novoNome.trim()}>✅ Adicionar</button>
          </div>
        </div>
      )}

      {/* Associar existente */}
      {modo === "associar" && (
        <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:12}}>
          <div style={{fontWeight:700,fontSize:11,color:"#dde4f0",marginBottom:8}}>🔗 Associar Paciente Existente</div>
          <input className="inp" value={buscaAssoc} onChange={e=>setBuscaAssoc(e.target.value)} placeholder="Pesquisar..." style={{marginBottom:8}}/>
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {candidatos.slice(0,10).map(p=>(
              <div key={p.id} onClick={()=>associarExistente(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",background:"#07101c",border:"1px solid #0d1828",borderRadius:6,marginBottom:4,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#00c6b8"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#0d1828"}>
                <div style={{flex:1,fontSize:11,color:"#b0c4d8"}}>{p.nome}</div>
                <div style={{fontSize:9,color:"#3d5a7a"}}>{p.telefone||"sem tel."}</div>
                <div style={{color:"#00c6b8",fontSize:12}}>+</div>
              </div>
            ))}
            {candidatos.length===0 && <div style={{fontSize:10,color:"#2d4a66",textAlign:"center",padding:"8px 0"}}>Nenhum paciente disponível</div>}
          </div>
          <button className="btn btn-s btn-sm" style={{marginTop:8,fontSize:10}} onClick={()=>setModo("ver")}>← Cancelar</button>
        </div>
      )}
    </div>
  );
}

function Pacientes({ user, pacs, setPacs, navegar }) {
  const [vista, setVista] = useState("lista");
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("info");
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState({ nome:"",data_nasc:"",email:"",telefone:"",genero:"feminino",forma_pag:"MBWay",medicacao:"",alergias:"",notas:"",foto:"",grupo_familiar:"",relacao_familiar:"" });
  const [consultas, setConsultas] = useState([]);
  const [verCons, setVerCons] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [novoPag, setNovoPag] = useState({ descricao:"",valor:"",status:"pago",forma:"MBWay",acordo:"unico",data:hoje() });
  const [novoCons, setNovoCons] = useState({ data:hoje(),tipo:"Consulta",notas:"" });
  const [load, setLoad] = useState(false);
  const [materiais, setMateriais] = useState([]);
  const [novoMat, setNovoMat] = useState({ nome:"", url:"" });
  const [sala, setSala] = useState("");
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [respostasPac, setRespostasPac] = useState([]);
  const [portalItens, setPortalItens] = useState([]);
  const [diario, setDiario] = useState([]);
  const [novoPortal, setNovoPortal] = useState({ tipo:"frase", titulo:"", conteudo:"" });
  const [novoDiario, setNovoDiario] = useState({ sentir:"", evolucao:"", dificuldades:"", nota:"" });
  const [relAlta, setRelAlta] = useState("");
  const [compTexto, setCompTexto] = useState("");
  const [editRelId, setEditRelId] = useState(null);
  const [editRelTxt, setEditRelTxt] = useState("");
  const fotoRef = useRef(null);
  const upMatRef = useRef(null);

  const filtrados = pacs.filter(p => p.nome?.toLowerCase().includes(busca.toLowerCase()));

  const salvarNovo = async () => {
    if (!novo.nome) return;
    setLoad(true);
    const novoFinal = { ...novo, terapeuta_id: user.id, org_id: user.org_id || null };
    // Limpar valores placeholder
    if (novoFinal.grupo_familiar === "__nova__" || novoFinal.grupo_familiar === "") delete novoFinal.grupo_familiar;
    if (!novoFinal.relacao_familiar) delete novoFinal.relacao_familiar;
    const { data, error } = await sb.from("pacientes").insert(novoFinal).select().single();
    setLoad(false);
    if (error) { alert("Erro: " + error.message); return; }
    setPacs([...pacs, data]);
    setNovo({ nome:"",data_nasc:"",email:"",telefone:"",genero:"feminino",forma_pag:"MBWay",medicacao:"",alergias:"",notas:"",foto:"",grupo_familiar:"",relacao_familiar:"" });
    setMsg("✅ Paciente criado com sucesso!");
    setTimeout(()=>setMsg(""), 2500);
    setVista("lista");
  };

  const gerarLinkPortal = async () => {
    let token = sel.portal_token;
    if (!token) {
      // Token único ligado ao paciente (id curto + aleatório)
      const idCurto = (sel.id || "").replace(/-/g, "").slice(0, 8);
      token = `${idCurto}-${crypto.randomUUID().slice(0, 12)}`;
      await sb.from("pacientes").update({ portal_token: token, portal_ativo: true }).eq("id", sel.id).eq("terapeuta_id", user.id);
      setSel({ ...sel, portal_token: token, portal_ativo: true });
    } else if (!sel.portal_ativo) {
      await sb.from("pacientes").update({ portal_ativo: true }).eq("id", sel.id).eq("terapeuta_id", user.id);
      setSel({ ...sel, portal_ativo: true });
    }
    return `${window.location.origin}/?portal=${token}`;
  };

  const removerAcessoPortal = async () => {
    if (!confirm(`Remover o acesso ao portal de ${sel.nome}?\n\nO link atual deixa de funcionar. Podes gerar um novo depois.`)) return;
    await sb.from("pacientes").update({ portal_ativo: false }).eq("id", sel.id).eq("terapeuta_id", user.id);
    setSel({ ...sel, portal_ativo: false });
    alert("Acesso removido. O link antigo já não funciona.");
  };

  const regenerarLink = async () => {
    if (!confirm(`Gerar um link NOVO para ${sel.nome}?\n\nO link antigo deixa de funcionar imediatamente.`)) return;
    const idCurto = (sel.id || "").replace(/-/g, "").slice(0, 8);
    const token = `${idCurto}-${crypto.randomUUID().slice(0, 12)}`;
    await sb.from("pacientes").update({ portal_token: token, portal_ativo: true }).eq("id", sel.id).eq("terapeuta_id", user.id);
    setSel({ ...sel, portal_token: token, portal_ativo: true });
    const link = `${window.location.origin}/?portal=${token}`;
    navigator.clipboard?.writeText(link);
    alert("Novo link gerado e copiado! O antigo já não funciona.");
  };

  const enviarLinkPortal = async (via) => {
    const link = await gerarLinkPortal();
    const msg = `Olá ${sel.nome}, este é o seu espaço pessoal de acompanhamento: ${link}`;
    if (via === "whatsapp") {
      const num = (sel.telefone || "").replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
    } else if (via === "email") {
      window.open(`mailto:${sel.email}?subject=${encodeURIComponent("O seu espaço de acompanhamento")}&body=${encodeURIComponent(msg)}`, "_blank");
    } else {
      navigator.clipboard?.writeText(link);
      alert("Link copiado!");
    }
  };

  const addPortalItem = async () => {
    if (!novoPortal.conteudo.trim()) { alert("Escreve o conteúdo."); return; }
    const { data } = await sb.from("portal_itens").insert({
      paciente_id: sel.id, terapeuta_id: user.id,
      tipo: novoPortal.tipo, titulo: novoPortal.titulo || (novoPortal.tipo === "frase" ? "Mensagem" : "Material"),
      conteudo: novoPortal.conteudo, visivel: true,
    }).select().single();
    if (data) { setPortalItens([data, ...portalItens]); setNovoPortal({ tipo:"frase", titulo:"", conteudo:"" }); }
  };

  const removerPortalItem = async (id) => {
    await sb.from("portal_itens").delete().eq("id", id);
    setPortalItens(portalItens.filter(p => p.id !== id));
  };

  const addDiario = async () => {
    if (!novoDiario.sentir && !novoDiario.evolucao && !novoDiario.dificuldades && !novoDiario.nota) { alert("Preenche pelo menos um campo."); return; }
    const { data } = await sb.from("diario_terapeuta").insert({
      paciente_id: sel.id, terapeuta_id: user.id, ...novoDiario,
    }).select().single();
    if (data) { setDiario([data, ...diario]); setNovoDiario({ sentir:"", evolucao:"", dificuldades:"", nota:"" }); }
  };

  const removerDiario = async (id) => {
    await sb.from("diario_terapeuta").delete().eq("id", id);
    setDiario(diario.filter(d => d.id !== id));
  };

  const abrirPac = async (p) => {
    setSel(p); setTab("info"); setEditando(false);
    setSala(`https://meet.jit.si/VitalDoctor-${p.id}`);
    const { data: cs } = await sb.from("consultas").select("*").eq("paciente_id", p.id).order("data", { ascending: false });
    const { data: pg } = await sb.from("pagamentos").select("*").eq("paciente_id", p.id).order("data", { ascending: false });
    const { data: rsp } = await sb.from("respostas").select("*").eq("paciente_id", p.id).eq("status", "respondido").order("created_at", { ascending: true });
    setRespostasPac(rsp || []);
    const { data: mt } = await sb.from("materiais").select("*").eq("paciente_id", p.id).order("created_at", { ascending: false });
    sb.from("portal_itens").select("*").eq("paciente_id", p.id).order("created_at", { ascending: false }).then(({ data }) => setPortalItens(data || [])).catch(() => setPortalItens([]));
    sb.from("diario_terapeuta").select("*").eq("paciente_id", p.id).order("created_at", { ascending: false }).then(({ data }) => setDiario(data || [])).catch(() => setDiario([]));
    setConsultas(cs || []);
    setPagamentos(pg || []);
    setMateriais(mt || []);
  };

  const iniciarEdicao = () => {
    setEditForm({
      nome: sel.nome || "", data_nasc: sel.data_nasc || "", email: sel.email || "",
      telefone: sel.telefone || "", genero: sel.genero || "feminino",
      forma_pag: sel.forma_pag || "MBWay", medicacao: sel.medicacao || "", alergias: sel.alergias || "",
    });
    setEditando(true);
  };

  const guardarEdicao = async () => {
    setLoad(true);
    const { error } = await sb.from("pacientes").update(editForm).eq("id", sel.id).eq("terapeuta_id", user.id);
    setLoad(false);
    if (error) { alert("Erro ao guardar: " + error.message); return; }
    const atualizado = { ...sel, ...editForm };
    setSel(atualizado);
    setPacs(pacs.map(p => p.id === sel.id ? atualizado : p));
    setEditando(false);
  };

  const apagarPaciente = async () => {
    if (!confirm(`Apagar o paciente "${sel.nome}"?\n\nIsto remove o paciente e os seus dados. Esta ação não pode ser desfeita.`)) return;
    setLoad(true);
    // Apagar dados associados primeiro (isolamento por terapeuta)
    await sb.from("consultas").delete().eq("paciente_id", sel.id).eq("terapeuta_id", user.id);
    await sb.from("pagamentos").delete().eq("paciente_id", sel.id).eq("terapeuta_id", user.id);
    await sb.from("materiais").delete().eq("paciente_id", sel.id);
    const { error } = await sb.from("pacientes").delete().eq("id", sel.id).eq("terapeuta_id", user.id);
    setLoad(false);
    if (error) { alert("Erro ao apagar: " + error.message); return; }
    setPacs(pacs.filter(p => p.id !== sel.id));
    setSel(null); setVista("lista");
  };

  const addConsulta = async () => {
    if (!novoCons.tipo) return;
    const { data } = await sb.from("consultas").insert({ ...novoCons, paciente_id: sel.id, terapeuta_id: user.id }).select().single();
    if (data) setConsultas([data, ...consultas]);
    setNovoCons({ data:hoje(),tipo:"Consulta",notas:"" });
  };

  const addPag = async () => {
    if (!novoPag.descricao || !novoPag.valor) return;
    const { data } = await sb.from("pagamentos").insert({ ...novoPag, valor: parseFloat(novoPag.valor), paciente_id: sel.id, terapeuta_id: user.id, org_id: user.org_id||null, registado_por: user.nome_profissional||user.nome||"" }).select().single();
    if (data) setPagamentos([data, ...pagamentos]);
    setNovoPag({ descricao:"",valor:"",status:"pago",forma:"MBWay",data:hoje() });
  };

  const addMaterialLink = async () => {
    if (!novoMat.url) return;
    const { data } = await sb.from("materiais").insert({ nome: novoMat.nome || "Material", url: novoMat.url, tipo:"link", paciente_id: sel.id, terapeuta_id: user.id }).select().single();
    if (data) setMateriais([data, ...materiais]);
    setNovoMat({ nome:"", url:"" });
  };

  const handleUploadMaterial = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoad(true);
    const path = `${user.id}/${sel.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    const { error: upErr } = await sb.storage.from("materiais").upload(path, file);
    if (upErr) { setLoad(false); alert("Para enviar ficheiros do dispositivo, cria o bucket publico 'materiais' no Supabase (Storage). " + upErr.message); return; }
    const { data: pub } = sb.storage.from("materiais").getPublicUrl(path);
    const { data } = await sb.from("materiais").insert({ nome: file.name, url: pub.publicUrl, tipo:"ficheiro", paciente_id: sel.id, terapeuta_id: user.id }).select().single();
    if (data) setMateriais([data, ...materiais]);
    setLoad(false);
  };

  const removerMaterial = async (id) => {
    await sb.from("materiais").delete().eq("id", id);
    setMateriais(materiais.filter(m => m.id !== id));
  };

  const waPaciente = (texto) => {
    const num = (sel.telefone||"").replace(/[^0-9]/g,"");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const handleFoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const foto = ev.target.result;
      if (vista === "novo") { setNovo({ ...novo, foto }); return; }
      await sb.from("pacientes").update({ foto }).eq("id", sel.id);
      const upd = { ...sel, foto };
      setSel(upd);
      setPacs(pacs.map(p => p.id === sel.id ? upd : p));
    };
    reader.readAsDataURL(file);
  };

  const totalPago = pagamentos.filter(p => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor || 0), 0);
  const totalPend = pagamentos.filter(p => p.status !== "pago").reduce((s, p) => s + parseFloat(p.valor || 0), 0);

  if (vista === "novo") return (
    <div className="card fade">
      <div className="card-t">Novo Paciente</div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,marginBottom:10}}>
        <div className="foto-circle" onClick={() => fotoRef.current?.click()}>
          {novo.foto ? <img src={novo.foto} alt="foto" /> : <span style={{fontSize:24,color:"#2d4a66"}}>📷</span>}
        </div>
        <span style={{fontSize:10,color:"#2d4a66",cursor:"pointer"}} onClick={() => fotoRef.current?.click()}>Adicionar foto</span>
        <input ref={fotoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFoto} />
      </div>
      <div className="mb8"><span className="lbl">Nome completo *</span><input className="inp" placeholder="Nome..." value={novo.nome} onChange={e => setNovo({...novo,nome:e.target.value})} /></div>
      <div className="g2">
        <div><span className="lbl">Nascimento</span><input className="inp" type="date" value={novo.data_nasc} onChange={e => setNovo({...novo,data_nasc:e.target.value})} /></div>
        <div><span className="lbl">Genero</span><select className="inp sel" value={novo.genero} onChange={e => setNovo({...novo,genero:e.target.value})}><option value="feminino">Feminino</option><option value="masculino">Masculino</option></select></div>
      </div>
      <div className="g2">
        <div><span className="lbl">Email</span><input className="inp" type="email" value={novo.email} onChange={e => setNovo({...novo,email:e.target.value})} /></div>
        <div><span className="lbl">Telefone</span><input className="inp" placeholder="+351..." value={novo.telefone} onChange={e => setNovo({...novo,telefone:e.target.value})} /></div>
      </div>
      <div className="g2">
        <div><span className="lbl">Pagamento acordado</span><select className="inp sel" value={novo.forma_pag} onChange={e => setNovo({...novo,forma_pag:e.target.value})}><option>MBWay</option><option>Transferencia</option><option>Dinheiro</option><option>Cartao</option><option>Pack</option></select></div>
        <div><span className="lbl">Medicacao</span><input className="inp" value={novo.medicacao} onChange={e => setNovo({...novo,medicacao:e.target.value})} /></div>
      </div>
      <div className="mb8"><span className="lbl">Alergias</span><input className="inp" value={novo.alergias} onChange={e => setNovo({...novo,alergias:e.target.value})} /></div>
      <div className="mb12"><span className="lbl">Notas</span><textarea className="inp" rows={3} value={novo.notas} onChange={e => setNovo({...novo,notas:e.target.value})} /></div>
      <div className="mb8">
        <span className="lbl">Família <span style={{color:"#3d5a7a",fontWeight:400}}>(opcional)</span></span>
        {(() => {
          const familias = [...new Set(pacs.filter(p=>p.grupo_familiar).map(p=>p.grupo_familiar))];
          return (
            <div>
              <select className="inp" style={{marginBottom:4}} value={novo.grupo_familiar||""} onChange={e=>setNovo({...novo,grupo_familiar:e.target.value==="__nova__"?"":e.target.value})}>
                <option value="">— sem família —</option>
                {familias.map(f=>{
                  const membros=pacs.filter(p=>p.grupo_familiar===f);
                  return <option key={f} value={f}>{f} ({membros.slice(0,3).map(m=>m.nome.split(" ")[0]).join(", ")})</option>;
                })}
                <option value="__nova__">+ Criar nova família...</option>
              </select>
              {!familias.includes(novo.grupo_familiar) && novo.grupo_familiar && novo.grupo_familiar !== "" && (
                <input className="inp" value={novo.grupo_familiar} onChange={e=>setNovo({...novo,grupo_familiar:e.target.value})} placeholder="Nome da família (ex: Família Silva)"/>
              )}
              {novo.grupo_familiar && (
                <select className="inp" style={{marginTop:4}} value={novo.relacao_familiar||""} onChange={e=>setNovo({...novo,relacao_familiar:e.target.value})}>
                  <option value="">— relação —</option>
                  {["Cônjuge/Parceiro(a)","Filho(a)","Pai/Mãe","Irmão/Irmã","Avô/Avó","Neto(a)","Tio(a)","Sobrinho(a)","Primo(a)","Outro"].map(r=><option key={r}>{r}</option>)}
                </select>
              )}
            </div>
          );
        })()}
      </div>
      <div className="btn-row">
        <button className="btn btn-s" onClick={() => setVista("lista")}>Cancelar</button>
        <button className="btn btn-p" onClick={salvarNovo} disabled={load}>{load ? "A guardar..." : "Guardar"}</button>
      </div>
    </div>
  );

  if (sel) return (
    <div className="fade">
      <button className="btn btn-s btn-sm" style={{marginBottom:9}} onClick={() => { setSel(null); setTab("info"); }}>Voltar</button>
      <div className="card">
        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
          <div className="foto-circle" style={{width:54,height:54}} onClick={() => fotoRef.current?.click()}>
            {sel.foto ? <img src={sel.foto} alt="foto" /> : <span style={{fontSize:20,color:"#2d4a66"}}>👤</span>}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFoto} />
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:"#b0c4d8"}}>{sel.nome}</div>
            <div style={{fontSize:10,color:"#2d4a66",marginTop:1}}>{sel.email}</div>
            <div style={{fontSize:10,color:"#2d4a66"}}>Pago: <span style={{color:"#10b981",fontWeight:700}}>€{totalPago.toFixed(2)}</span> · Pendente: <span style={{color:"#fbbf24",fontWeight:700}}>€{totalPend.toFixed(2)}</span></div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {sel.email && <a href={`mailto:${sel.email}`} className="btn btn-sm btn-s" style={{width:"auto",textDecoration:"none"}}>✉️</a>}
          {sel.telefone && <a href={`https://wa.me/${sel.telefone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-p" style={{width:"auto",textDecoration:"none"}}>WhatsApp</a>}
          {sel.telefone && <a href={`tel:${sel.telefone}`} className="btn btn-sm btn-s" style={{width:"auto",textDecoration:"none"}}>📞</a>}
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {[["info","Info"],["consultas","Consultas"],["evolucao","📈 Evolução"],["portal","🏛️ Portal"],["diario","📔 Diário"],["pagamentos","Pagamentos"],["online","Online"],["notas","Notas"]].map(([k,l]) => (
            <button key={k} className={`chip ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === "info" && !editando && (
          <div>
            <div style={{fontSize:11,color:"#7a8fa8",lineHeight:1.8}}>
              {sel.data_nasc && <div><span style={{color:"#2d4a66"}}>Nascimento:</span> {fmtData(sel.data_nasc)}</div>}
              {sel.email && <div><span style={{color:"#2d4a66"}}>Email:</span> {sel.email}</div>}
              {sel.telefone && <div><span style={{color:"#2d4a66"}}>Telefone:</span> {sel.telefone}</div>}
              {sel.forma_pag && <div><span style={{color:"#2d4a66"}}>Pagamento:</span> {sel.forma_pag}</div>}
              {sel.medicacao && <div><span style={{color:"#2d4a66"}}>Medicação:</span> {sel.medicacao}</div>}
              {sel.alergias && <div><span style={{color:"#2d4a66"}}>Alergias:</span> {sel.alergias}</div>}
            </div>
            <div style={{marginTop:14,marginBottom:14}}>
              <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginBottom:8,letterSpacing:1,display:"flex",alignItems:"center",gap:6}}>
                👨‍👩‍👧‍👦 NÚCLEO FAMILIAR
              </div>
              <FamiliaWidget
                paciente={sel}
                user={user}
                pacs={pacs}
                setPacs={setPacs}
                onAbrirPaciente={(p)=>{ setSel(p); setTab("info"); }}
              />
            </div>
            <div style={{display:"flex",gap:7,marginTop:14,flexWrap:"wrap"}}>
              <button className="btn btn-p btn-sm" style={{flex:"1 1 100%",padding:"10px 0",marginBottom:4}} onClick={()=>{ if(typeof navegar==="function"){navegar("metodo");} else if(typeof go==="function"){go("metodo");} }}>
                🩺 Nova Consulta com {sel?.nome?.split(" ")[0]||"este paciente"}
              </button>
              <button className="btn btn-s btn-sm" style={{flex:1}} onClick={iniciarEdicao}>✏️ Editar</button>
              <button className="btn btn-d btn-sm" style={{flex:1}} onClick={apagarPaciente} disabled={load}>🗑️ Apagar</button>
            </div>
          </div>
        )}
        {tab === "info" && editando && (
          <div className="fade">
            <div className="lbl">Nome completo</div>
            <input className="inp" value={editForm.nome} onChange={e=>setEditForm({...editForm,nome:e.target.value})} />
            <div className="g2">
              <div><span className="lbl">Nascimento</span><input className="inp" type="date" value={editForm.data_nasc} onChange={e=>setEditForm({...editForm,data_nasc:e.target.value})} /></div>
              <div><span className="lbl">Género</span><select className="inp sel" value={editForm.genero} onChange={e=>setEditForm({...editForm,genero:e.target.value})}><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option></select></div>
            </div>
            <div className="g2">
              <div><span className="lbl">Email</span><input className="inp" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} /></div>
              <div><span className="lbl">Telefone</span><input className="inp" value={editForm.telefone} onChange={e=>setEditForm({...editForm,telefone:e.target.value})} /></div>
            </div>
            <div className="lbl">Forma de pagamento habitual</div>
            <select className="inp sel" value={editForm.forma_pag} onChange={e=>setEditForm({...editForm,forma_pag:e.target.value})}><option>MBWay</option><option>Transferência</option><option>Numerário</option><option>Multibanco</option></select>
            <div className="lbl">Medicação</div>
            <textarea className="inp" rows={2} value={editForm.medicacao} onChange={e=>setEditForm({...editForm,medicacao:e.target.value})} />
            <div className="lbl">Alergias</div>
            <input className="inp" value={editForm.alergias} onChange={e=>setEditForm({...editForm,alergias:e.target.value})} />
            <div className="lbl">Família</div>
            {(() => {
              const familias = [...new Set(pacs.filter(p=>p.grupo_familiar&&p.id!==sel?.id).map(p=>p.grupo_familiar))];
              return (
                <div style={{marginBottom:8}}>
                  <select className="inp" style={{marginBottom:4}} value={editForm.grupo_familiar||""} onChange={e=>setEditForm({...editForm,grupo_familiar:e.target.value})}>
                    <option value="">— sem família —</option>
                    {familias.map(f=>{
                      const membros=pacs.filter(p=>p.grupo_familiar===f&&p.id!==sel?.id);
                      return <option key={f} value={f}>{f} ({membros.slice(0,3).map(m=>m.nome.split(" ")[0]).join(", ")})</option>;
                    })}
                    <option value="__nova__">+ Criar nova família...</option>
                  </select>
                  {editForm.grupo_familiar === "__nova__" && (
                    <input className="inp" placeholder="Nome da família" onChange={e=>setEditForm({...editForm,grupo_familiar:e.target.value})}/>
                  )}
                  {editForm.grupo_familiar && editForm.grupo_familiar !== "__nova__" && (
                    <select className="inp" value={editForm.relacao_familiar||""} onChange={e=>setEditForm({...editForm,relacao_familiar:e.target.value})}>
                      <option value="">— relação —</option>
                      {["Cônjuge/Parceiro(a)","Filho(a)","Pai/Mãe","Irmão/Irmã","Avô/Avó","Neto(a)","Tio(a)","Sobrinho(a)","Primo(a)","Outro"].map(r=><option key={r}>{r}</option>)}
                    </select>
                  )}
                </div>
              );
            })()}
            <div style={{display:"flex",gap:7,marginTop:12}}>
              <button className="btn btn-p" style={{flex:2}} onClick={guardarEdicao} disabled={load}>{load?"A guardar...":"💾 Guardar alterações"}</button>
              <button className="btn btn-s" style={{flex:1}} onClick={()=>setEditando(false)}>Cancelar</button>
            </div>
          </div>
        )}
        {tab === "consultas" && (
          <div>
            {consultas.length === 0 && <div style={{fontSize:11,color:"#2d4a66",textAlign:"center",padding:"14px 0"}}>Sem consultas registadas ainda.</div>}
            {consultas.map((c,i) => (
              <div key={c.id||i} style={{borderBottom:"1px solid #0d1828",padding:"9px 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1}}>
                    <strong style={{color:"#b0c4d8",fontSize:12}}>{fmtData(c.data)}</strong>
                    <span style={{fontSize:10,color:"#00c6b8",marginLeft:6}}>{c.tipo}</span>
                    {c.notas && <div style={{fontSize:10,color:"#3d5a7a",marginTop:2}}>{c.notas}</div>}
                  </div>
                  {(c.relatorio || c.dados_formulario) && (
                    <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:10}}
                      onClick={()=>setVerCons(verCons===(c.id||i)?null:(c.id||i))}>
                      {verCons===(c.id||i)?"Fechar":"Ver relatório"}
                    </button>
                  )}
                </div>
                {verCons===(c.id||i) && c.relatorio && (
                  <div style={{marginTop:8,background:"#040810",border:"1px solid #0d1828",borderRadius:8,padding:"10px 12px"}}>
                    {editRelId===(c.id||i) ? (
                      <>
                        <textarea className="inp" value={editRelTxt} onChange={e=>setEditRelTxt(e.target.value)} rows={14} style={{fontFamily:"monospace",fontSize:11,lineHeight:1.6}} />
                        <div style={{display:"flex",gap:6,marginTop:8}}>
                          <button className="btn btn-p btn-sm" style={{flex:1}} onClick={async()=>{
                            await sb.from("consultas").update({relatorio:editRelTxt}).eq("id",c.id);
                            c.relatorio=editRelTxt; setEditRelId(null);
                          }}>💾 Guardar</button>
                          <button className="btn btn-s btn-sm" style={{flex:1}} onClick={()=>setEditRelId(null)}>Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <pre style={{whiteSpace:"pre-wrap",fontSize:10,color:"#7a98b8",fontFamily:"monospace",lineHeight:1.7,maxHeight:280,overflowY:"auto",margin:0}}>{c.relatorio}</pre>
                        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                          <button className="btn btn-p btn-sm" style={{flex:1}} onClick={()=>{
                            abrirPDFProfissional({
                              titulo: c.tipo||"Relatório de Consulta",
                              paciente: sel,
                              terapeuta: user?.nome_profissional||user?.nome||"",
                              texto: c.relatorio||"",
                              logo: user?.config?.logo||null,
                              nomePratica: user?.config?.nomePratica||user?.config?.dash?.nomePratica||null,
                            });
                          }}>🖨️ PDF</button>
                          <button className="btn btn-sm" style={{flex:1,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={()=>{
                            const num=(sel?.telefone||"").replace(/[^0-9]/g,"");
                            window.open(num?`https://wa.me/${num}?text=${encodeURIComponent((c.relatorio||"").substring(0,1500))}`:`https://wa.me/?text=${encodeURIComponent((c.relatorio||"").substring(0,1500))}`,"_blank");
                          }}>WhatsApp</button>
                          <button className="btn btn-s btn-sm" style={{flex:1}} onClick={()=>navigator.clipboard?.writeText(c.relatorio||"")}>📋 Copiar</button>
                          <button className="btn btn-s btn-sm" style={{flex:1}} onClick={()=>{setEditRelId(c.id||i);setEditRelTxt(c.relatorio||"");}}>✏️ Editar</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div style={{marginTop:10,background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:10}}>
              <div className="slbl">Adicionar Consulta Manual</div>
              <div className="g2">
                <div><span className="lbl">Data</span><input className="inp" type="date" value={novoCons.data} onChange={e => setNovoCons({...novoCons,data:e.target.value})} /></div>
                <div><span className="lbl">Tipo</span><select className="inp sel" value={novoCons.tipo} onChange={e => setNovoCons({...novoCons,tipo:e.target.value})}><option>Consulta</option><option>Avaliação Energética</option><option>Pack 1</option><option>Pack 2</option><option>Pack 3</option><option>Seguimento</option></select></div>
              </div>
              <div className="mb8"><span className="lbl">Notas</span><textarea className="inp" rows={2} value={novoCons.notas} onChange={e => setNovoCons({...novoCons,notas:e.target.value})} /></div>
              <button className="btn btn-p btn-sm" style={{width:"100%"}} onClick={addConsulta}>+ Adicionar</button>
            </div>
          </div>
        )}
        {tab === "evolucao" && (() => {
          const medosResp = respostasPac.filter(r => r.questionario === "medos");
          const calcMedos = (r) => {
            const blocos = [];
            for (let b = 1; b <= 7; b++) {
              let total = 0;
              for (let i = 1; i <= 10; i++) total += Number(r.respostas[`mb${b}_${i}`]) || 0;
              blocos.push(total);
            }
            return blocos;
          };
          const MEDOS_N = ["Pobreza","Doença","Crítica","Morte","Relacionam.","Envelhecer","Liberdade"];
          const evolucaoMedos = medosResp.map((r, i) => {
            const blocos = calcMedos(r);
            return { sessao: `S${i+1}`, total: blocos.reduce((a,b)=>a+b,0), data: r.created_at?.split("T")[0] };
          });
          const totalConsultas = consultas.length;
          const totalQuest = respostasPac.length;

          return (
            <div className="fade">
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
                {[["Consultas",totalConsultas,"#00c6b8"],["Questionários",totalQuest,"#a855f7"],["Sessões medos",medosResp.length,"#f59e0b"]].map(([l,n,c])=>(
                  <div key={l} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:"10px 6px",textAlign:"center"}}>
                    <div style={{fontSize:"1.2rem",fontWeight:700,color:c}}>{n}</div>
                    <div style={{fontSize:".52rem",color:"#3d5a7a",textTransform:"uppercase"}}>{l}</div>
                  </div>
                ))}
              </div>
              {respostasPac.length === 0 && consultas.length === 0 && (
                <div className="al al-i">Ainda não há dados de evolução. Faz consultas e envia questionários para acompanhar o progresso.</div>
              )}
              {evolucaoMedos.length >= 2 && (
                <div className="card">
                  <div className="card-t">📉 Evolução da Carga Emocional (Medos)</div>
                  <div style={{fontSize:".66rem",color:"#5a7a9a",marginBottom:10}}>Soma total das pontuações dos medos ao longo das sessões. Tendência decrescente = melhoria.</div>
                  {(() => {
                    const max = Math.max(...evolucaoMedos.map(e=>e.total), 1);
                    return (
                      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120,padding:"0 4px"}}>
                        {evolucaoMedos.map((e,i) => {
                          const h = (e.total/max)*100;
                          const desceu = i>0 && e.total < evolucaoMedos[i-1].total;
                          return (
                            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                              <div style={{fontSize:".6rem",color:desceu?"#4ade80":"#7a98b8"}}>{e.total}</div>
                              <div style={{width:"100%",height:`${h}%`,minHeight:4,borderRadius:"4px 4px 0 0",background:desceu?"linear-gradient(180deg,#4ade80,#1a6b4a)":"linear-gradient(180deg,#00c6b8,#0d4a47)"}} />
                              <div style={{fontSize:".55rem",color:"#3d5a7a"}}>{e.sessao}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
              {medosResp.length >= 2 && (
                <div className="card">
                  <div className="card-t">🔄 Cruzamento — Primeira vs Última Avaliação (Medos)</div>
                  {(() => {
                    const prim = calcMedos(medosResp[0]);
                    const ult = calcMedos(medosResp[medosResp.length-1]);
                    return (
                      <div>
                        {MEDOS_N.map((nome,i) => {
                          const dif = ult[i] - prim[i];
                          return (
                            <div key={i} style={{marginBottom:7}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:".68rem",marginBottom:2}}>
                                <span style={{color:"#7a98b8"}}>{nome}</span>
                                <span style={{color:dif<0?"#4ade80":dif>0?"#f87171":"#3d5a7a"}}>{prim[i]}→{ult[i]} {dif<0?`▼${Math.abs(dif)}`:dif>0?`▲${dif}`:"="}</span>
                              </div>
                              <div style={{display:"flex",gap:3,height:5}}>
                                <div style={{flex:1,background:"#0d1828",borderRadius:3,position:"relative",overflow:"hidden"}}>
                                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${(prim[i]/50)*100}%`,background:"#3d5a7a"}} />
                                </div>
                                <div style={{flex:1,background:"#0d1828",borderRadius:3,position:"relative",overflow:"hidden"}}>
                                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${(ult[i]/50)*100}%`,background:dif<0?"#4ade80":"#00c6b8"}} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div style={{fontSize:".6rem",color:"#3d5a7a",marginTop:6,display:"flex",gap:12}}>
                          <span>▪ esquerda: 1ª avaliação</span><span>▪ direita: última</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Comparação entre consultas + Relatório de Alta */}
              {consultas.length >= 1 && (
                <div className="card">
                  <div className="card-t">📋 Relatórios de Evolução</div>
                  <div style={{fontSize:".66rem",color:"#5a7a9a",marginBottom:10,lineHeight:1.5}}>
                    Gera automaticamente e edita à vontade — ou escreve do zero.
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>{
                      // Comparação automática 1ª vs última consulta
                      const ord = [...consultas].sort((a,b)=>(a.data||"").localeCompare(b.data||""));
                      const prim = ord[0], ult = ord[ord.length-1];
                      const L = [];
                      L.push("COMPARAÇÃO ENTRE CONSULTAS");
                      L.push("─".repeat(40));
                      L.push(`Primeira consulta: ${fmtData(prim.data)} (${prim.tipo})`);
                      L.push(`Última consulta: ${fmtData(ult.data)} (${ult.tipo})`);
                      L.push(`Total de consultas: ${consultas.length}`);
                      const medos = respostasPac.filter(r=>r.questionario==="medos");
                      if (medos.length>=2){
                        const calc=(r)=>{let t=0;for(let b=1;b<=7;b++)for(let i=1;i<=10;i++)t+=Number(r.respostas[`mb${b}_${i}`])||0;return t;};
                        const p=calc(medos[0]), u=calc(medos[medos.length-1]);
                        L.push(`\nCarga emocional (medos): ${p} → ${u} ${u<p?`(melhoria de ${p-u} pontos)`:u>p?`(subiu ${u-p})`:"(estável)"}`);
                      }
                      L.push(`\nEVOLUÇÃO OBSERVADA\n(edita aqui as tuas observações sobre o progresso do paciente)`);
                      setCompTexto(L.join("\n"));
                    }}>⚡ Gerar comparação</button>
                    <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>{
                      // Relatório de alta automático
                      const ord = [...consultas].sort((a,b)=>(a.data||"").localeCompare(b.data||""));
                      const L = [];
                      L.push("RELATÓRIO DE ALTA TERAPÊUTICA");
                      L.push("─".repeat(40));
                      L.push(`Paciente: ${sel.nome}`);
                      L.push(`Período de acompanhamento: ${fmtData(ord[0]?.data)} a ${fmtData(ord[ord.length-1]?.data)}`);
                      L.push(`Total de consultas realizadas: ${consultas.length}`);
                      L.push(`\nTIPOS DE ATENDIMENTO\n${[...new Set(consultas.map(c=>c.tipo))].map(t=>`• ${t}`).join("\n")}`);
                      const medos = respostasPac.filter(r=>r.questionario==="medos");
                      if (medos.length>=2){
                        const calc=(r)=>{let t=0;for(let b=1;b<=7;b++)for(let i=1;i<=10;i++)t+=Number(r.respostas[`mb${b}_${i}`])||0;return t;};
                        const p=calc(medos[0]), u=calc(medos[medos.length-1]);
                        L.push(`\nEVOLUÇÃO DA CARGA EMOCIONAL\nInício: ${p} → Final: ${u} ${u<p?`— melhoria de ${p-u} pontos`:""}`);
                      }
                      L.push(`\nSÍNTESE DA JORNADA\n(edita: resumo do percurso, conquistas, recomendações finais)`);
                      L.push(`\nRECOMENDAÇÕES PÓS-ALTA\n(edita: o que o paciente deve continuar a praticar)`);
                      setRelAlta(L.join("\n"));
                    }}>🎓 Gerar relatório de alta</button>
                  </div>

                  {compTexto && (
                    <div style={{marginBottom:10}}>
                      <span className="lbl">Comparação (editável)</span>
                      <textarea className="inp" rows={8} value={compTexto} onChange={e=>setCompTexto(e.target.value)} style={{fontFamily:"monospace",fontSize:11}} />
                      <div style={{display:"flex",gap:6,marginTop:6}}>
                        <button className="btn btn-p btn-sm" style={{flex:1}} onClick={async()=>{
                          await sb.from("consultas").insert({paciente_id:sel.id,terapeuta_id:user.id,org_id:user.org_id||null,data:hoje(),tipo:"Comparação de Evolução",relatorio:compTexto,atendido_por:user.nome_profissional||user.nome||""});
                          alert("Comparação guardada na ficha!"); setCompTexto("");
                          abrirPac(sel);
                        }}>💾 Guardar na ficha</button>
                        <button className="btn btn-sm" style={{flex:1,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={()=>{const num=(sel?.telefone||"").replace(/[^0-9]/g,"");window.open(num?`https://wa.me/${num}?text=${encodeURIComponent(compTexto.substring(0,1500))}`:`https://wa.me/?text=${encodeURIComponent(compTexto)}`,"_blank");}}>WhatsApp</button>
                      </div>
                    </div>
                  )}
                  {relAlta && (
                    <div>
                      <span className="lbl">Relatório de Alta (editável)</span>
                      <textarea className="inp" rows={10} value={relAlta} onChange={e=>setRelAlta(e.target.value)} style={{fontFamily:"monospace",fontSize:11}} />
                      <div style={{display:"flex",gap:6,marginTop:6}}>
                        <button className="btn btn-p btn-sm" style={{flex:1}} onClick={async()=>{
                          await sb.from("consultas").insert({paciente_id:sel.id,terapeuta_id:user.id,org_id:user.org_id||null,data:hoje(),tipo:"Relatório de Alta",relatorio:relAlta,atendido_por:user.nome_profissional||user.nome||""});
                          alert("Relatório de alta guardado na ficha!"); setRelAlta("");
                          abrirPac(sel);
                        }}>💾 Guardar na ficha</button>
                        <button className="btn btn-sm" style={{flex:1,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={()=>{const num=(sel?.telefone||"").replace(/[^0-9]/g,"");window.open(num?`https://wa.me/${num}?text=${encodeURIComponent(relAlta.substring(0,1500))}`:`https://wa.me/?text=${encodeURIComponent(relAlta)}`,"_blank");}}>WhatsApp</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(consultas.length > 0 || respostasPac.length > 0) && (
                <div className="card">
                  <div className="card-t">🗓️ Linha do Tempo</div>
                  {[...consultas.map(c=>({tipo:"consulta",data:c.data,label:c.tipo,id:c.id})),
                    ...respostasPac.map(r=>({tipo:"quest",data:r.created_at?.split("T")[0],label:r.titulo,id:r.id}))]
                    .sort((a,b)=>(b.data||"").localeCompare(a.data||""))
                    .map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:9,padding:"7px 0",borderBottom:"1px solid #0d1828"}}>
                      <div style={{fontSize:"1rem"}}>{item.tipo==="consulta"?"🩺":"📋"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:".72rem",color:"#b0c4d8"}}>{item.label}</div>
                        <div style={{fontSize:".6rem",color:"#3d5a7a"}}>{fmtData(item.data)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        {tab === "portal" && (
          <div className="fade">
            <div className="card">
              <div className="card-t">🏛️ Espaço do Paciente</div>
              <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:10,lineHeight:1.5}}>
                Envia o link e o paciente acede ao seu espaço pessoal — frases, áudios, protocolos e evolução.
              </div>
              {sel.portal_token && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:6,marginBottom:10,background:sel.portal_ativo?"rgba(74,222,128,.06)":"rgba(248,113,113,.06)",border:`1px solid ${sel.portal_ativo?"#1a5c3a":"#5c1a1a"}`}}>
                  <span style={{fontSize:".7rem",color:sel.portal_ativo?"#86efac":"#f87171"}}>{sel.portal_ativo?"● Acesso ativo":"○ Acesso removido"}</span>
                </div>
              )}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className="btn btn-sm" style={{width:"auto",background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={()=>enviarLinkPortal("whatsapp")}>📱 Enviar WhatsApp</button>
                <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>enviarLinkPortal("email")}>✉️ Email</button>
                <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>enviarLinkPortal("copiar")}>🔗 Copiar link</button>
              </div>
              {sel.portal_token && (
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,paddingTop:8,borderTop:"1px solid #0d1828"}}>
                  <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".64rem"}} onClick={regenerarLink}>🔄 Gerar link novo</button>
                  {sel.portal_ativo
                    ? <button className="btn btn-d btn-sm" style={{width:"auto",fontSize:".64rem"}} onClick={removerAcessoPortal}>🚫 Remover acesso</button>
                    : <button className="btn btn-p btn-sm" style={{width:"auto",fontSize:".64rem"}} onClick={async()=>{await gerarLinkPortal();}}>✓ Reativar acesso</button>}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-t">✨ Enviar para o Portal</div>
              <div className="lbl">Tipo</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {[["frase","💬 Frase motivacional"],["audio","🎧 Áudio"],["protocolo","📋 Protocolo"],["material","📎 Material/Link"]].map(([k,l])=>(
                  <button key={k} className={`chip ${novoPortal.tipo===k?"on":""}`} onClick={()=>setNovoPortal({...novoPortal,tipo:k})} style={{fontSize:".66rem"}}>{l}</button>
                ))}
              </div>
              {novoPortal.tipo !== "frase" && <>
                <div className="lbl">Título</div>
                <input className="inp" value={novoPortal.titulo} onChange={e=>setNovoPortal({...novoPortal,titulo:e.target.value})} placeholder="Ex: Áudio de modulação..." />
              </>}
              <div className="lbl">{novoPortal.tipo==="frase"?"Frase motivacional":novoPortal.tipo==="audio"||novoPortal.tipo==="material"?"Link":"Conteúdo do protocolo"}</div>
              <textarea className="inp" rows={novoPortal.tipo==="frase"||novoPortal.tipo==="protocolo"?3:2} value={novoPortal.conteudo} onChange={e=>setNovoPortal({...novoPortal,conteudo:e.target.value})} placeholder={novoPortal.tipo==="frase"?"Ex: Cada passo teu é uma vitória...":novoPortal.tipo==="audio"?"Cola o link do áudio (Drive)...":"..."} />
              <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:8}} onClick={addPortalItem}>+ Enviar ao Portal</button>
            </div>

            <div className="card">
              <div className="card-t">📤 Já no Portal ({portalItens.length})</div>
              {portalItens.length===0 && <div style={{fontSize:".7rem",color:"#2d4a66"}}>Nada enviado ainda.</div>}
              {portalItens.map(it=>(
                <div key={it.id} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:"1px solid #0d1828",alignItems:"flex-start"}}>
                  <span style={{fontSize:"1rem"}}>{it.tipo==="frase"?"💬":it.tipo==="audio"?"🎧":it.tipo==="protocolo"?"📋":"📎"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:".7rem",color:"#b0c4d8",fontWeight:600}}>{it.titulo}</div>
                    <div style={{fontSize:".64rem",color:"#5a7a9a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.conteudo}</div>
                  </div>
                  <button className="btn btn-d btn-sm" style={{padding:"3px 7px"}} onClick={()=>removerPortalItem(it.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "diario" && (
          <div className="fade">
            <div className="card">
              <div className="card-t">📔 Diário do Terapeuta · Privado</div>
              <div style={{fontSize:".68rem",color:"#5a7a9a",marginBottom:10,lineHeight:1.5}}>
                Espaço só teu — o paciente nunca vê isto. Regista como te sentes no acompanhamento, a evolução que observas e novas dificuldades.
              </div>
              <div className="lbl">💗 Como me sinto neste acompanhamento</div>
              <textarea className="inp" rows={2} value={novoDiario.sentir} onChange={e=>setNovoDiario({...novoDiario,sentir:e.target.value})} placeholder="O que sinto sobre este caso..." />
              <div className="lbl">📈 Evolução que observo</div>
              <textarea className="inp" rows={2} value={novoDiario.evolucao} onChange={e=>setNovoDiario({...novoDiario,evolucao:e.target.value})} placeholder="Progressos, mudanças..." />
              <div className="lbl">⚠️ Novas dificuldades / pontos de atenção</div>
              <textarea className="inp" rows={2} value={novoDiario.dificuldades} onChange={e=>setNovoDiario({...novoDiario,dificuldades:e.target.value})} placeholder="Resistências, recaídas, sinais a vigiar..." />
              <div className="lbl">📝 Nota livre</div>
              <textarea className="inp" rows={2} value={novoDiario.nota} onChange={e=>setNovoDiario({...novoDiario,nota:e.target.value})} placeholder="Outras observações..." />
              <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:8}} onClick={addDiario}>+ Guardar Entrada</button>
            </div>

            {diario.map(d=>(
              <div key={d.id} className="card" style={{padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <strong style={{fontSize:".7rem",color:"#00c6b8"}}>{fmtData(d.data)}</strong>
                  <button className="btn btn-d btn-sm" style={{padding:"3px 7px"}} onClick={()=>removerDiario(d.id)}>✕</button>
                </div>
                {d.sentir && <div style={{fontSize:".7rem",color:"#7a98b8",marginBottom:4}}><span style={{color:"#3d5a7a"}}>💗 Sinto:</span> {d.sentir}</div>}
                {d.evolucao && <div style={{fontSize:".7rem",color:"#7a98b8",marginBottom:4}}><span style={{color:"#3d5a7a"}}>📈 Evolução:</span> {d.evolucao}</div>}
                {d.dificuldades && <div style={{fontSize:".7rem",color:"#7a98b8",marginBottom:4}}><span style={{color:"#3d5a7a"}}>⚠️ Dificuldades:</span> {d.dificuldades}</div>}
                {d.nota && <div style={{fontSize:".7rem",color:"#7a98b8"}}><span style={{color:"#3d5a7a"}}>📝 Nota:</span> {d.nota}</div>}
              </div>
            ))}
          </div>
        )}
        {tab === "pagamentos" && (
          <div>
            {pagamentos.map((pg,i) => (
              <div key={i} className="pay-row">
                <div><div style={{fontWeight:600,color:"#b0c4d8"}}>{pg.descricao}</div><div style={{fontSize:9,color:"#2d4a66"}}>{fmtData(pg.data)} · {pg.forma}{pg.acordo?` · ${pg.acordo}`:""}{pg.registado_por?` · ${pg.registado_por}`:""}</div></div>
                <div style={{display:"flex",gap:7,alignItems:"center"}}>
                  <span style={{fontWeight:700}}>€{parseFloat(pg.valor||0).toFixed(2)}</span>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:pg.status==="pago"?"rgba(16,185,129,.1)":"rgba(251,191,36,.08)",color:pg.status==="pago"?"#10b981":"#fbbf24",border:`1px solid ${pg.status==="pago"?"rgba(16,185,129,.2)":"rgba(251,191,36,.2)"}`}}>{pg.status}</span>
                </div>
              </div>
            ))}
            <div style={{marginTop:10,background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:10}}>
              <div className="slbl">Registar Pagamento</div>
              <div className="g2">
                <div><span className="lbl">Descricao</span><input className="inp" value={novoPag.descricao} onChange={e => setNovoPag({...novoPag,descricao:e.target.value})} /></div>
                <div><span className="lbl">Valor €</span><input className="inp" type="number" value={novoPag.valor} onChange={e => setNovoPag({...novoPag,valor:e.target.value})} /></div>
              </div>
              <div className="g2">
                <div><span className="lbl">Acordo</span><select className="inp sel" value={novoPag.acordo} onChange={e => setNovoPag({...novoPag,acordo:e.target.value})}><option value="unico">Único</option><option value="faseado">Faseado/Prestações</option><option value="livre">Valor livre</option></select></div>
                <div><span className="lbl">Estado</span><select className="inp sel" value={novoPag.status} onChange={e => setNovoPag({...novoPag,status:e.target.value})}><option value="pago">Pago ✓</option><option value="pendente">Em dívida</option><option value="parcial">Parcial</option></select></div>
              </div>
              <div className="g2">
                <div><span className="lbl">Forma</span><select className="inp sel" value={novoPag.forma} onChange={e => setNovoPag({...novoPag,forma:e.target.value})}><option>MBWay</option><option>Transferencia</option><option>Dinheiro</option><option>Multibanco</option><option>Cartao</option></select></div>
                <div><span className="lbl">Data</span><input className="inp" type="date" value={novoPag.data} onChange={e => setNovoPag({...novoPag,data:e.target.value})} /></div>
              </div>
              <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:6}} onClick={addPag}>+ Registar / Confirmar Recebimento</button>
            </div>
          </div>
        )}
        {tab === "online" && (
          <div style={{fontSize:11}}>
            <div className="slbl">Teleconsulta (sala gratuita)</div>
            <input className="inp" value={sala} onChange={e => setSala(e.target.value)} placeholder="Link da sala..." style={{marginBottom:6}} />
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              <a href={sala} target="_blank" rel="noopener noreferrer" className="btn btn-p btn-sm" style={{width:"auto",textDecoration:"none"}}>Entrar (Jitsi)</a>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => window.open("https://meet.google.com/new","_blank")}>Google Meet</button>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => window.open("https://zoom.us/start/videomeeting","_blank")}>Zoom</button>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => { navigator.clipboard.writeText(sala); }}>Copiar link</button>
            </div>
            <button className="btn btn-sm" style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"100%"}} onClick={() => waPaciente(`Ola ${sel.nome}, aqui esta o link da nossa teleconsulta: ${sala}`)} disabled={!sel.telefone}>Enviar sala ao paciente (WhatsApp)</button>
            <div style={{fontSize:9,color:"#2d4a66",margin:"5px 0 16px"}}>Meet/Zoom: abre, copia o link gerado e cola no campo acima antes de enviar. Jitsi ja esta pronto a usar.</div>
            <div className="slbl">Materiais (Drive ou dispositivo)</div>
            <div className="g2">
              <div><span className="lbl">Nome</span><input className="inp" value={novoMat.nome} onChange={e => setNovoMat({...novoMat,nome:e.target.value})} /></div>
              <div><span className="lbl">Link (Drive/YouTube...)</span><input className="inp" value={novoMat.url} onChange={e => setNovoMat({...novoMat,url:e.target.value})} /></div>
            </div>
            <div style={{display:"flex",gap:6,margin:"6px 0 10px",flexWrap:"wrap"}}>
              <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={addMaterialLink}>+ Adicionar link</button>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => upMatRef.current?.click()} disabled={load}>{load ? "A enviar..." : "Carregar do dispositivo"}</button>
              <input ref={upMatRef} type="file" style={{display:"none"}} onChange={handleUploadMaterial} />
            </div>
            {materiais.map(m => (
              <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:7,padding:"6px 0",borderBottom:"1px solid #0d1828"}}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" style={{color:"#b0c4d8",textDecoration:"none",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.nome}</a>
                <div style={{display:"flex",gap:5}}>
                  <button className="btn btn-sm" style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"auto"}} onClick={() => waPaciente(`${m.nome}: ${m.url}`)} disabled={!sel.telefone}>Enviar</button>
                  <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => removerMaterial(m.id)}>✕</button>
                </div>
              </div>
            ))}
            {materiais.length === 0 && <div style={{fontSize:10,color:"#2d4a66"}}>Sem materiais ainda.</div>}
          </div>
        )}
        {tab === "notas" && (
          <textarea className="inp" rows={6} value={sel.notas||""} onChange={async e => {
            const notas = e.target.value;
            setSel({...sel,notas});
            await sb.from("pacientes").update({notas}).eq("id",sel.id);
          }} placeholder="Notas de evolucao..." />
        )}
      </div>
    </div>
  );

  return (
    <div className="fade">
      <div style={{display:"flex",gap:7,marginBottom:9}}>
        <input className="inp" placeholder="Pesquisar paciente..." value={busca} onChange={e => setBusca(e.target.value)} style={{flex:1}} />
        <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={() => setVista("novo")}>+ Novo</button>
      </div>
      {filtrados.length === 0 && <div className="al al-i">Sem pacientes{busca ? ` para "${busca}"` : ". Clica em + Novo."}.</div>}
      {filtrados.map(p => (
        <div key={p.id} className="pac-row" onClick={() => abrirPac(p)}>
          <div className="pac-avatar">{p.foto ? <img src={p.foto} alt="" /> : <span style={{fontSize:16,color:"#2d4a66"}}>👤</span>}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:12,color:"#b0c4d8"}}>
              {p.nome}
              {p.grupo_familiar && <span style={{marginLeft:5,fontSize:10}}>👨‍👩‍👧‍👦</span>}
            </div>
            <div style={{fontSize:10,color:"#2d4a66",marginTop:1}}>{p.email||"Sem email"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// AGENDA
// ══════════════════════════════════════════════════════
function Agenda({ user, pacs, agenda, setAgenda }) {
  const [vista, setVista] = useState("mes");
  const [modal, setModal] = useState(false);
  const [semOff, setSemOff] = useState(0);
  const [mesOff, setMesOff] = useState(0);
  const [diaSel, setDiaSel] = useState(null);
  const [nova, setNova] = useState({ paciente_id:"",data:hoje(),hora:"09:00",duracao:60,tipo:"Consulta",sala:"Online",formato:"Online",atendido_por:user?.nome_profissional||user?.nome||"",notas:"",pack_total:1,pack_espaco:7 });
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  const todayStr = hoje();
  const getIniSem = () => { const d=new Date(); d.setDate(d.getDate()+semOff*7-d.getDay()); return d; };
  const diasArr = () => Array.from({length:7},(_,i)=>{ const d=new Date(getIniSem()); d.setDate(d.getDate()+i); return d; });

  const marcDia = (ds) => agenda.filter(m => m.data === ds).sort((a,b) => a.hora.localeCompare(b.hora));
  const nomePac = (id) => pacs.find(p => p.id === id)?.nome || "—";

  // Converte "HH:MM" em minutos desde meia-noite
  const toMin = (h) => { const [hh,mm] = (h||"0:0").split(":").map(Number); return hh*60+(mm||0); };
  // Dois intervalos sobrepõem-se?
  const sobrepoe = (ini1, dur1, ini2, dur2) => { const a1=toMin(ini1),a2=a1+dur1,b1=toMin(ini2),b2=b1+dur2; return a1<b2 && b1<a2; };

  // Verifica sobreposição de SALA e de PROFISSIONAL (online não ocupa sala física)
  const verificarSobrep = (data, hora, sala, dur, atendidoPor, excId) => {
    const doDia = agenda.filter(m => m.id !== excId && m.data === data);
    // Conflito de sala física (online não conta)
    if (sala && sala !== "Online") {
      const salaOcupada = doDia.some(m => m.sala === sala && sobrepoe(hora, dur, m.hora?.slice(0,5), m.duracao||60));
      if (salaOcupada) return `A sala "${sala}" já está ocupada nesse horário.`;
    }
    // Conflito do mesmo profissional (não pode estar em 2 sítios ao mesmo tempo)
    if (atendidoPor) {
      const profOcupado = doDia.some(m => (m.atendido_por||"") === atendidoPor && sobrepoe(hora, dur, m.hora?.slice(0,5), m.duracao||60));
      if (profOcupado) return `${atendidoPor} já tem uma marcação nesse horário.`;
    }
    return null;
  };

  const adicionar = async () => {
    setErr("");
    if (!nova.paciente_id) { setErr("Seleciona um paciente."); return; }
    const conflito = verificarSobrep(nova.data, nova.hora, nova.sala, nova.duracao, nova.atendido_por, null);
    if (conflito) { setErr("⚠️ " + conflito); return; }
    setLoad(true);
    const novas = [];
    for (let i = 0; i < nova.pack_total; i++) {
      const d = new Date(nova.data + "T00:00:00"); d.setDate(d.getDate() + i * nova.pack_espaco);
      const dataI = d.toISOString().split("T")[0];
      novas.push({ paciente_id:nova.paciente_id, data:dataI, hora:nova.hora+":00", duracao:nova.duracao, tipo:nova.tipo, sala:nova.sala, formato:nova.formato, atendido_por:nova.atendido_por, notas:nova.notas, pack_sessao:i+1, pack_total:nova.pack_total, terapeuta_id:user.id, org_id:user.org_id||null });
    }
    const { data, error } = await sb.from("agenda").insert(novas).select();
    setLoad(false);
    if (error) { setErr("Erro: " + error.message); return; }
    setAgenda([...agenda, ...data]);
    setModal(false);
    setNova({ paciente_id:"",data:hoje(),hora:"09:00",duracao:60,tipo:"Consulta",sala:"Online",formato:"Online",atendido_por:user?.nome_profissional||user?.nome||"",notas:"",pack_total:1,pack_espaco:7 });
  };

  const remover = async (id) => {
    await sb.from("agenda").delete().eq("id", id);
    setAgenda(agenda.filter(m => m.id !== id));
  };

  const lembrarWA = (m, tipo = "lembrete") => {
    const pac = pacs.find(p => p.id === m.paciente_id);
    const num = (pac?.telefone||"").replace(/[^0-9]/g,"");
    if (!num) { alert("Este paciente não tem número de telefone registado."); return; }
    const nomePratica = perfil?.config?.dash?.nomePratica || perfil?.config?.nomePratica || "VitalDoctor";
    const templates = {
      lembrete: `Olá ${pac?.nome||""}! 👋\n\nLembrete da sua consulta:\n📅 ${fmtData(m.data)} às ${m.hora?.slice(0,5)}\n📍 ${m.sala||m.formato||"Online"}\n\nSe precisar remarcar, por favor avise com antecedência.\n\nAté já! 😊\n— ${nomePratica}`,
      confirmacao: `Olá ${pac?.nome||""}! 👋\n\nA sua consulta foi confirmada:\n📅 ${fmtData(m.data)} às ${m.hora?.slice(0,5)}\n📍 ${m.sala||m.formato||"Online"}\n\nQualquer questão estou disponível.\n\nAté breve! 🌟\n— ${nomePratica}`,
      cancelamento: `Olá ${pac?.nome||""}!\n\nInfelizmente temos de cancelar a consulta de ${fmtData(m.data)} às ${m.hora?.slice(0,5)}.\n\nEntraremos em contacto em breve para remarcar.\n\nDesculpe o incómodo! 🙏\n— ${nomePratica}`,
    };
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(templates[tipo]||templates.lembrete)}`,"_blank");
  };
  const addCalendar = (m) => {
    const pac = pacs.find(p => p.id === m.paciente_id);
    const ini = new Date(m.data + "T" + (m.hora||"09:00:00"));
    const fim = new Date(ini.getTime() + (m.duracao||60)*60000);
    const fmt = (d) => d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")+"T"+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+"00";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Consulta: "+(pac?.nome||""))}&dates=${fmt(ini)}/${fmt(fim)}&details=${encodeURIComponent((m.tipo||"")+" - "+(m.sala||""))}`;
    window.open(url,"_blank");
  };

  return (
    <div className="fade">
      <div className="card">
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#dde4f0"}}>Agenda</span>
          <div style={{display:"flex",gap:5,flex:1,justifyContent:"flex-end",flexWrap:"wrap"}}>
            <button className={`chip ${vista==="mes"?"on":""}`} onClick={() => setVista("mes")}>Mês</button>
            <button className={`chip ${vista==="semana"?"on":""}`} onClick={() => setVista("semana")}>Semana</button>
            <button className={`chip ${vista==="lista"?"on":""}`} onClick={() => setVista("lista")}>Lista</button>
            <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={() => setModal(true)}>+ Marcação</button>
          </div>
        </div>
        {vista === "mes" && (() => {
          const base = new Date(); base.setMonth(base.getMonth() + mesOff);
          const ano = base.getFullYear(), mes = base.getMonth();
          const primeiro = new Date(ano, mes, 1);
          const inicioGrelha = new Date(primeiro); inicioGrelha.setDate(1 - primeiro.getDay());
          const dias = Array.from({length:42},(_,i)=>{ const d=new Date(inicioGrelha); d.setDate(d.getDate()+i); return d; });
          const nomeMes = base.toLocaleDateString("pt-PT",{month:"long",year:"numeric"});
          return (
            <>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
                <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => setMesOff(m=>m-1)}>‹</button>
                <span style={{fontSize:".82rem",color:"#dde4f0",flex:1,textAlign:"center",textTransform:"capitalize",fontWeight:600}}>{nomeMes}</span>
                <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => setMesOff(m=>m+1)}>›</button>
                <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".62rem"}} onClick={() => setMesOff(0)}>Hoje</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:".6rem",color:"#3d5a7a",fontWeight:600,padding:"2px 0"}}>{d}</div>)}
                {dias.map((d,i) => {
                  const ds = d.toISOString().split("T")[0];
                  const noMes = d.getMonth() === mes;
                  const eHoje = ds === todayStr;
                  const marc = marcDia(ds);
                  return (
                    <div key={i} onClick={() => { setDiaSel(ds); setNova(n=>({...n,data:ds})); }}
                      style={{minHeight:"3.2rem",padding:"3px",borderRadius:6,cursor:"pointer",
                        background: eHoje ? "rgba(0,198,184,.1)" : noMes ? "#050810" : "transparent",
                        border: `1px solid ${diaSel===ds?"#00c6b8":eHoje?"#1a4a5c":"#0d1828"}`,
                        opacity: noMes ? 1 : 0.35}}>
                      <div style={{fontSize:".62rem",color:eHoje?"#00c6b8":"#5a7a9a",fontWeight:eHoje?700:400,textAlign:"center"}}>{d.getDate()}</div>
                      {marc.slice(0,3).map(m => (
                        <div key={m.id} style={{fontSize:".5rem",background:m.formato==="Online"?"#1a4a5c":"#3d2a5c",color:"#b0c4d8",borderRadius:3,padding:"1px 3px",marginTop:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                          {m.hora?.slice(0,5)} {nomePac(m.paciente_id).split(" ")[0]}
                        </div>
                      ))}
                      {marc.length>3 && <div style={{fontSize:".5rem",color:"#3d5a7a",textAlign:"center"}}>+{marc.length-3}</div>}
                    </div>
                  );
                })}
              </div>
              {diaSel && (
                <div style={{marginTop:12,background:"#050810",border:"1px solid #1a3a5c",borderRadius:8,padding:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <strong style={{fontSize:".78rem",color:"#dde4f0"}}>{fmtData(diaSel)}</strong>
                    <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={()=>{ setNova(n=>({...n,data:diaSel})); setModal(true); }}>+ Marcar neste dia</button>
                  </div>
                  {marcDia(diaSel).length===0 && <div style={{fontSize:".7rem",color:"#2d4a66"}}>Sem marcações neste dia.</div>}
                  {marcDia(diaSel).map(m => (
                    <div key={m.id} className="agenda-row">
                      <div className="agenda-hora">{m.hora?.slice(0,5)}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:".75rem",color:"#b0c4d8"}}>{nomePac(m.paciente_id)}</div>
                        <div style={{fontSize:".62rem",color:"#2d4a66"}}>{m.tipo} · {m.sala} · {m.duracao}min</div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button className="btn btn-sm" style={{padding:"3px 7px",background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"auto"}} onClick={() => lembrarWA(m,"lembrete")}>🔔 Lembrete</button>
                        <button className="btn btn-d btn-sm" style={{padding:"3px 7px"}} onClick={() => remover(m.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
        {vista === "semana" && (
          <>
            <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:7}}>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => setSemOff(s=>s-1)}>‹</button>
              <span style={{fontSize:11,color:"#5a7a9a",flex:1,textAlign:"center"}}>{diasArr()[0].toLocaleDateString("pt-PT",{day:"2-digit",month:"short"})} – {diasArr()[6].toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"})}</span>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => setSemOff(s=>s+1)}>›</button>
              <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:9}} onClick={() => setSemOff(0)}>Hoje</button>
            </div>
            <div className="week-grid">
              {diasArr().map((d,i) => {
                const ds = d.toISOString().split("T")[0];
                return (
                  <div key={i} className={`week-day ${ds===todayStr?"hoje":""}`}>
                    <div className="week-day-n">{diasSemana[i]}<br/>{d.getDate()}</div>
                    {marcDia(ds).map(m => (
                      <div key={m.id} className="week-event" onClick={() => remover(m.id)} title={`${m.hora?.slice(0,5)} ${nomePac(m.paciente_id)} - toque para remover`}>
                        {m.hora?.slice(0,5)} {nomePac(m.paciente_id).split(" ")[0]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {vista === "lista" && (
          <>
            {agenda.length === 0 && <div className="al al-i">Sem marcacoes.</div>}
            {[...agenda].sort((a,b) => a.data.localeCompare(b.data)||a.hora.localeCompare(b.hora)).map(m => (
              <div key={m.id} className="agenda-row">
                <div className="agenda-hora">{m.hora?.slice(0,5)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:12,color:"#b0c4d8"}}>{nomePac(m.paciente_id)}</div>
                  <div style={{fontSize:10,color:"#2d4a66"}}>{fmtData(m.data)} · {m.tipo} · {m.sala} · {m.duracao}min</div>
                  {m.pack_total > 1 && <div style={{fontSize:9,color:"#f59e0b"}}>Sessao {m.pack_sessao}/{m.pack_total}</div>}
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <button className="btn btn-sm" title="Lembrar paciente por WhatsApp" style={{padding:"3px 7px",fontSize:11,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"auto"}} onClick={() => lembrarWA(m,"lembrete")}>🔔 Lembrete</button>
                  <button className="btn btn-s btn-sm" title="Adicionar ao Google Calendar (lembrete automatico)" style={{padding:"3px 7px",fontSize:11,width:"auto"}} onClick={() => addCalendar(m)}>📅</button>
                  <button className="btn btn-d btn-sm" style={{padding:"3px 7px",fontSize:9}} onClick={() => remover(m.id)}>✕</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {modal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0a0e18",border:"1px solid #1a3a5c",borderRadius:12,width:"100%",maxWidth:420,maxHeight:"90vh",overflow:"auto",padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#00c6b8"}}>Nova Marcacao</div>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => { setModal(false); setErr(""); }}>✕</button>
            </div>
            {err && <div className="al al-d">{err}</div>}
            {/* PACIENTE com seletor rápido */}
            <div className="mb8">
              <span className="lbl">Paciente *</span>
              {nova._pacNome ? (
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{flex:1,padding:"7px 10px",background:"#050810",border:"1px solid #00c6b8",borderRadius:7,fontSize:11,color:"#b0c4d8"}}>👤 {nova._pacNome}</div>
                  <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:9}} onClick={()=>setNova({...nova,paciente_id:"",_pacNome:""})}>🔄</button>
                </div>
              ) : (
                <div>
                  <input className="inp" placeholder="🔍 Escreve o nome..." autoFocus
                    onChange={e=>{
                      const v=e.target.value.toLowerCase();
                      const found=pacs.find(p=>p.nome.toLowerCase().startsWith(v));
                      if(found&&v.length>1)setNova({...nova,paciente_id:found.id,_pacNome:found.nome});
                    }}/>
                  {nova._searchBusca!==undefined&&(
                    <div style={{maxHeight:120,overflowY:"auto",background:"#050810",border:"1px solid #0d1828",borderRadius:6,marginTop:3}}>
                      {pacs.filter(p=>nova._searchBusca&&p.nome.toLowerCase().includes(nova._searchBusca.toLowerCase())).slice(0,5).map(p=>(
                        <div key={p.id} onClick={()=>setNova({...nova,paciente_id:p.id,_pacNome:p.nome,_searchBusca:undefined})} style={{padding:"6px 10px",cursor:"pointer",fontSize:10,color:"#b0c4d8",borderBottom:"1px solid #0d1828"}}>{p.nome}</div>
                      ))}
                    </div>
                  )}
                  <select className="inp sel" style={{marginTop:4}} value={nova.paciente_id} onChange={e=>{
                    const p=pacs.find(x=>x.id===e.target.value);
                    setNova({...nova,paciente_id:e.target.value,_pacNome:p?.nome||""});
                  }}>
                    <option value="">— ou selecionar da lista —</option>
                    {pacs.sort((a,b)=>a.nome.localeCompare(b.nome)).map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              )}
            </div>
            {/* DATA E HORA */}
            <div className="g2">
              <div><span className="lbl">Data</span><input className="inp" type="date" value={nova.data} onChange={e => setNova({...nova,data:e.target.value})} /></div>
              <div>
                <span className="lbl">Hora</span>
                <input className="inp" type="time" value={nova.hora} onChange={e => setNova({...nova,hora:e.target.value})} />
                {(() => {
                  const conf = nova.paciente_id ? verificarSobrep(nova.data, nova.hora, nova.sala, nova.duracao, nova.atendido_por, null) : null;
                  if (!conf) return null;
                  const oc = agenda.filter(m=>m.data===nova.data&&(m.atendido_por||"")===(nova.atendido_por||"")).sort((a,b)=>a.hora.localeCompare(b.hora));
                  const ult = oc[oc.length-1];
                  const livreMin = ult ? toMin(ult.hora?.slice(0,5))+(ult.duracao||60)+10 : null;
                  const livreH = livreMin ? String(Math.floor(livreMin/60)).padStart(2,"0")+":"+String(livreMin%60).padStart(2,"0") : null;
                  return <div style={{fontSize:8,color:"#f87171",marginTop:2}}>⚠️ Conflito {livreH&&<span style={{color:"#fbbf24",cursor:"pointer"}} onClick={()=>setNova({...nova,hora:livreH})}>· Usar {livreH} ▶</span>}</div>;
                })()}
              </div>
            </div>
            {/* DURAÇÃO E SALA */}
            <div className="g2">
              <div><span className="lbl">Duração (min)</span><select className="inp sel" value={nova.duracao} onChange={e => setNova({...nova,duracao:parseInt(e.target.value)})}><option value={30}>30min</option><option value={45}>45min</option><option value={60}>60min</option><option value={90}>90min</option><option value={120}>120min</option></select></div>
              <div>
                <span className="lbl">Sala/Local</span>
                <select className="inp sel" value={nova.sala} onChange={e => setNova({...nova,sala:e.target.value})}>
                  <option>Online</option><option>Sala 1</option><option>Sala 2</option><option>Sala 3</option><option>Domicílio</option><option>A Distância</option>
                </select>
                {nova.sala&&nova.sala!=="Online"&&nova.sala!=="A Distância"&&(() => {
                  const oc=agenda.filter(m=>m.data===nova.data&&m.sala===nova.sala&&sobrepoe(nova.hora,nova.duracao,m.hora?.slice(0,5),m.duracao||60));
                  return oc.length>0 ? <div style={{fontSize:8,color:"#f87171",marginTop:1}}>⚠️ Sala ocupada — {nomePac(oc[0].paciente_id)}</div>
                  : <div style={{fontSize:8,color:"#5ae0d8",marginTop:1}}>✅ Sala livre</div>;
                })()}
              </div>
            </div>
            <div className="g2">
              <div><span className="lbl">Tipo</span><select className="inp sel" value={nova.tipo} onChange={e => setNova({...nova,tipo:e.target.value})}><option>Consulta</option><option>Avaliação Energética</option><option>Intervenção Energética</option><option>Seguimento</option><option>Pack</option><option>Triagem</option></select></div>
              <div><span className="lbl">Formato</span><select className="inp sel" value={nova.formato} onChange={e => setNova({...nova,formato:e.target.value})}><option>Online</option><option>Presencial</option><option>A Distância</option></select></div>
            </div>
            {user?.org_id && (
              <div className="mb8"><span className="lbl">Quem atende</span><input className="inp" value={nova.atendido_por} onChange={e => setNova({...nova,atendido_por:e.target.value})} placeholder="Nome do profissional" /></div>
            )}
            <div className="slbl" style={{marginTop:10}}>Pack de sessoes</div>
            <div className="g2">
              <div><span className="lbl">Numero de sessoes</span><input className="inp" type="number" min="1" max="20" value={nova.pack_total} onChange={e => setNova({...nova,pack_total:parseInt(e.target.value)||1})} /></div>
              <div><span className="lbl">Espacamento (dias)</span><input className="inp" type="number" min="1" value={nova.pack_espaco} onChange={e => setNova({...nova,pack_espaco:parseInt(e.target.value)||7})} /></div>
            </div>
            {nova.pack_total > 1 && <div className="al al-i" style={{fontSize:10}}>{nova.pack_total} sessoes a cada {nova.pack_espaco} dias.</div>}
            <div className="mb8"><span className="lbl">Notas</span><textarea className="inp" rows={2} value={nova.notas} onChange={e => setNova({...nova,notas:e.target.value})} /></div>
            <div className="btn-row">
              <button className="btn btn-s" onClick={() => { setModal(false); setErr(""); }}>Cancelar</button>
              <button className="btn btn-p" onClick={adicionar} disabled={load}>{load ? "A guardar..." : "Confirmar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// CONSTRUTOR DE FORMULÁRIOS — autonomia total para o admin
// ══════════════════════════════════════════════════════
function FormBuilder() {
  const [forms, setForms] = useState([]);
  const [vista, setVista] = useState("lista"); // lista | criar | editar
  const [formActivo, setFormActivo] = useState(null);
  const [ok, setOk] = useState("");

  const TIPOS_Q = [
    { val: "texto", label: "📝 Resposta livre" },
    { val: "escala", label: "🔢 Escala 1-2-3" },
    { val: "sim_nao", label: "✅ Sim / Não" },
    { val: "escolha", label: "🔘 Múltipla escolha" },
  ];

  const carregarForms = () => {
    sb.from("config_global").select("valor").eq("chave", "formularios_custom").single()
      .then(({ data: d }) => {
        if (d?.valor) {
          const v = Array.isArray(d.valor) ? d.valor : JSON.parse(d.valor);
          setForms(v);
          FORMS_CUSTOM.length = 0;
          v.forEach(f => FORMS_CUSTOM.push(f));
        }
      }).catch(() => {});
  };

  useEffect(() => { carregarForms(); }, []);

  const sync = async (lista) => {
    FORMS_CUSTOM.length = 0;
    lista.forEach(f => FORMS_CUSTOM.push(f));
    await sb.from("config_global").upsert({ chave: "formularios_custom", valor: lista }, { onConflict: "chave" });
    setForms(lista);
    setOk("Guardado! ✅");
    setTimeout(() => setOk(""), 2000);
  };

  const novoForm = () => setFormActivo({
    id: "custom_" + Date.now(),
    key: "custom_" + Date.now(),
    titulo: "",
    descricao: "",
    escala: [1, 2, 3],
    blocos: [{ titulo: "Bloco 1", perguntas: [] }],
  });

  const guardarForm = async () => {
    if (!formActivo.titulo.trim()) { alert("Dá um título ao formulário."); return; }
    const lista = forms.filter(f => f.id !== formActivo.id);
    lista.push(formActivo);
    await sync(lista);
    setVista("lista");
    setFormActivo(null);
  };

  const apagarForm = async (id) => {
    if (!confirm("Apagar este formulário?")) return;
    await sync(forms.filter(f => f.id !== id));
  };

  const addBloco = () => setFormActivo(f => ({
    ...f, blocos: [...f.blocos, { titulo: "Novo bloco", perguntas: [] }]
  }));

  const addPergunta = (bIdx) => setFormActivo(f => {
    const blocos = [...f.blocos];
    blocos[bIdx] = {
      ...blocos[bIdx],
      perguntas: [...blocos[bIdx].perguntas, {
        id: "p" + Date.now(),
        q: "",
        tipo: "texto",
        opcoes: []
      }]
    };
    return { ...f, blocos };
  });

  const updatePergunta = (bIdx, pIdx, field, val) => setFormActivo(f => {
    const blocos = f.blocos.map((b, bi) => {
      if (bi !== bIdx) return b;
      return {
        ...b, perguntas: b.perguntas.map((p, pi) =>
          pi === pIdx ? { ...p, [field]: val } : p
        )
      };
    });
    return { ...f, blocos };
  });

  const removerPergunta = (bIdx, pIdx) => setFormActivo(f => {
    const blocos = f.blocos.map((b, bi) => {
      if (bi !== bIdx) return b;
      return { ...b, perguntas: b.perguntas.filter((_, pi) => pi !== pIdx) };
    });
    return { ...f, blocos };
  });

  const removerBloco = (bIdx) => setFormActivo(f => ({
    ...f, blocos: f.blocos.filter((_, bi) => bi !== bIdx)
  }));

  if (vista === "lista") return (
    <div>
      {ok && <div className="al al-ok" style={{ marginBottom: 8 }}>{ok}</div>}
      <div className="al al-i" style={{ fontSize: 10, marginBottom: 10 }}>
        Cria e edita questionários sem código. Ficam disponíveis imediatamente para todos os terapeutas.
      </div>
      <button className="btn btn-p" style={{ marginBottom: 12 }}
        onClick={() => { novoForm(); setVista("criar"); }}>
        + Criar Novo Formulário
      </button>
      {forms.length === 0 && (
        <div style={{ fontSize: 11, color: "#2d4a66", textAlign: "center", padding: "20px 0" }}>
          Ainda não criaste formulários personalizados.<br/>
          <span style={{ fontSize: 10 }}>Os formulários de base (Escudos, Medos, Pré-Consulta, etc.) estão sempre disponíveis.</span>
        </div>
      )}
      {forms.map(f => (
        <div key={f.id} className="admin-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#b0c4d8" }}>{f.titulo}</div>
              {f.descricao && <div style={{ fontSize: 10, color: "#3d5a7a", marginTop: 2 }}>{f.descricao}</div>}
              <div style={{ fontSize: 9, color: "#2d4a66", marginTop: 3 }}>
                {f.blocos?.length || 0} blocos · {f.blocos?.reduce((t, b) => t + (b.perguntas?.length || 0), 0)} perguntas
              </div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button className="btn btn-s btn-sm" style={{ width: "auto" }}
                onClick={() => { setFormActivo({ ...f }); setVista("criar"); }}>✏️</button>
              <button className="btn btn-d btn-sm" style={{ width: "auto" }}
                onClick={() => apagarForm(f.id)}>✕</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (!formActivo) return null;

  return (
    <div className="fade">
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <button className="btn btn-s btn-sm" style={{ width: "auto" }}
          onClick={() => { setVista("lista"); setFormActivo(null); }}>← Voltar</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#b0c4d8", flex: 1 }}>
          {formActivo.titulo || "Novo Formulário"}
        </span>
        <button className="btn btn-p btn-sm" style={{ width: "auto" }} onClick={guardarForm}>
          💾 Guardar
        </button>
      </div>

      {ok && <div className="al al-ok" style={{ marginBottom: 8 }}>{ok}</div>}

      {/* Info geral */}
      <div className="card">
        <div className="card-t">Informação geral</div>
        <div className="lbl">Título do formulário *</div>
        <input className="inp" value={formActivo.titulo}
          onChange={e => setFormActivo(f => ({ ...f, titulo: e.target.value }))}
          placeholder="Ex: Avaliação de Ansiedade" />
        <div className="lbl">Descrição (aparece ao topo do formulário)</div>
        <textarea className="inp" rows={2} value={formActivo.descricao}
          onChange={e => setFormActivo(f => ({ ...f, descricao: e.target.value }))}
          placeholder="Breve descrição para o paciente..." />
      </div>

      {/* Blocos e perguntas */}
      {formActivo.blocos.map((bloco, bIdx) => (
        <div key={bIdx} className="card" style={{ borderColor: "#1a3a5c" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input className="inp" value={bloco.titulo} style={{ flex: 1, fontSize: 12, fontWeight: 700 }}
              onChange={e => setFormActivo(f => {
                const b = [...f.blocos]; b[bIdx] = { ...b[bIdx], titulo: e.target.value }; return { ...f, blocos: b };
              })} placeholder="Título do bloco" />
            <button className="btn btn-d btn-sm" style={{ width: "auto" }} onClick={() => removerBloco(bIdx)}>🗑</button>
          </div>

          {bloco.perguntas.map((p, pIdx) => (
            <div key={p.id} style={{ background: "#040810", border: "1px solid #0d1828", borderRadius: 7, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <input className="inp" value={p.q}
                    onChange={e => updatePergunta(bIdx, pIdx, "q", e.target.value)}
                    placeholder={`Pergunta ${pIdx + 1}`} style={{ marginBottom: 5 }} />
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {TIPOS_Q.map(t => (
                      <button key={t.val}
                        onClick={() => updatePergunta(bIdx, pIdx, "tipo", t.val)}
                        style={{
                          padding: "3px 9px", borderRadius: 12, fontSize: 10, cursor: "pointer",
                          border: `1px solid ${p.tipo === t.val ? "#00c6b8" : "#0d1828"}`,
                          background: p.tipo === t.val ? "#003d39" : "#050810",
                          color: p.tipo === t.val ? "#00c6b8" : "#3d5a7a"
                        }}>{t.label}</button>
                    ))}
                  </div>
                  {p.tipo === "escolha" && (
                    <div style={{ marginTop: 5 }}>
                      <input className="inp" value={(p.opcoes || []).join(" · ")}
                        onChange={e => updatePergunta(bIdx, pIdx, "opcoes", e.target.value.split(" · ").map(s => s.trim()).filter(Boolean))}
                        placeholder="Opção 1 · Opção 2 · Opção 3 (separar com ·)" style={{ fontSize: 10 }} />
                    </div>
                  )}
                </div>
                <button className="btn btn-d btn-sm" style={{ width: "auto", marginTop: 2 }}
                  onClick={() => removerPergunta(bIdx, pIdx)}>✕</button>
              </div>
            </div>
          ))}

          <button className="btn btn-s btn-sm" style={{ width: "auto", fontSize: 10 }}
            onClick={() => addPergunta(bIdx)}>+ Pergunta</button>
        </div>
      ))}

      <button className="btn btn-s" style={{ marginBottom: 8 }} onClick={addBloco}>+ Novo Bloco</button>
      <button className="btn btn-p" onClick={guardarForm}>💾 Guardar Formulário</button>
    </div>
  );
}

function Suporte({ user, isSuperAdmin }) {
  const TELEGRAM = "https://t.me/+rOkqo8Orr-NhOTVk";
  const EMAIL = "suportevitaldoctor@gmail.com";
  const [tipo, setTipo] = useState("duvida");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [anexo, setAnexo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState("");
  const [avisos, setAvisos] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    sb.from("avisos").select("*").eq("ativo", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setAvisos(data); }).catch(() => {});
  }, []);

  const anexarFoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setErr("Imagem demasiado grande (máx 2MB)."); return; }
    const r = new FileReader();
    r.onload = () => setAnexo(r.result);
    r.readAsDataURL(f);
  };

  const enviar = async () => {
    setErr("");
    if (!mensagem.trim() && tipo !== "comprovativo") { setErr("Escreve a tua mensagem."); return; }
    if (tipo === "comprovativo" && !anexo) { setErr("Anexa o comprovativo."); return; }
    setLoad(true);
    const { error } = await sb.from("mensagens").insert({
      user_id: user.id, nome: user.nome || "", email: user.email || "",
      tipo, assunto: assunto || (tipo === "comprovativo" ? "Comprovativo de pagamento" : "Dúvida"),
      mensagem, anexo, estado: "novo",
    });
    setLoad(false);
    if (error) { setErr("Erro ao enviar: " + error.message); return; }
    setEnviado(true);
    setAssunto(""); setMensagem(""); setAnexo("");
  };

  // Se for super admin, mostra a caixa de entrada (gestão)
  if (isSuperAdmin) return <SuporteAdmin />;

  const AVISO_COR = { info:"#1a4a5c", premium:"#7a4a00", manutencao:"#5c1a1a" };
  const AVISO_ICON = { info:"ℹ️", premium:"⭐", manutencao:"🔧" };

  return (
    <div className="fade">
      {/* Avisos do admin */}
      {avisos.map(a => (
        <div key={a.id} style={{background:AVISO_COR[a.tipo]||"#1a4a5c",borderRadius:8,padding:"11px 13px",marginBottom:8}}>
          <div style={{fontSize:".78rem",fontWeight:700,color:"#fff",marginBottom:3}}>{AVISO_ICON[a.tipo]||"ℹ️"} {a.titulo}</div>
          <div style={{fontSize:".72rem",color:"#dde4f0",lineHeight:1.5}}>{a.corpo}</div>
        </div>
      ))}

      {/* Contactos directos */}
      <div className="card">
        <div className="card-t">💬 Falar com o Suporte</div>
        <div style={{fontSize:".72rem",color:"#5a7a9a",marginBottom:10,lineHeight:1.5}}>
          Tira as tuas dúvidas connosco. Resposta gratuita pelos canais abaixo ou pela mensagem direta.
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <a href={`mailto:${EMAIL}?subject=Suporte VitalDoctor`} className="btn btn-s btn-sm" style={{width:"auto",textDecoration:"none"}}>✉️ Email</a>
          <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{width:"auto",textDecoration:"none",background:"#229ED918",border:"1px solid #229ED940",color:"#229ED9"}}>💬 Telegram</a>
        </div>
      </div>

      {/* Mensagem direta */}
      {enviado ? (
        <div className="card" style={{textAlign:"center",padding:"22px 18px"}}>
          <div style={{fontSize:"2rem",marginBottom:8}}>✅</div>
          <div style={{fontSize:".85rem",fontWeight:700,color:"#b0c4d8",marginBottom:4}}>Mensagem enviada!</div>
          <div style={{fontSize:".7rem",color:"#3d5a7a"}}>Vamos responder o mais breve possível.</div>
          <button className="btn btn-s btn-sm" style={{width:"auto",marginTop:12}} onClick={()=>setEnviado(false)}>Enviar outra</button>
        </div>
      ) : (
        <div className="card">
          <div className="card-t">📨 Enviar Mensagem ao Suporte</div>
          {err && <div className="al al-d">{err}</div>}
          <div className="lbl">Tipo</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {[["duvida","❓ Dúvida"],["comprovativo","🧾 Comprovativo de pagamento"],["sugestao","💡 Sugestão"]].map(([k,l])=>(
              <button key={k} className={`chip ${tipo===k?"on":""}`} onClick={()=>setTipo(k)} style={{fontSize:".68rem"}}>{l}</button>
            ))}
          </div>
          <div className="lbl">Assunto</div>
          <input className="inp" value={assunto} onChange={e=>setAssunto(e.target.value)} placeholder={tipo==="comprovativo"?"Comprovativo de pagamento":"Resumo da tua questão"} />
          {tipo !== "comprovativo" && <>
            <div className="lbl">Mensagem</div>
            <textarea className="inp" rows={4} value={mensagem} onChange={e=>setMensagem(e.target.value)} placeholder="Descreve a tua dúvida ou sugestão..." />
          </>}
          {tipo === "comprovativo" && <>
            <div className="lbl">Comprovativo (foto/print)</div>
            <input ref={fileRef} type="file" accept="image/*" onChange={anexarFoto} style={{display:"none"}} />
            <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>fileRef.current?.click()}>📎 {anexo?"Trocar imagem":"Anexar imagem"}</button>
            {anexo && <img src={anexo} alt="comprovativo" style={{maxWidth:"100%",marginTop:8,borderRadius:8,border:"1px solid #1a3a5c"}} />}
            <div className="lbl" style={{marginTop:10}}>Nota (opcional)</div>
            <textarea className="inp" rows={2} value={mensagem} onChange={e=>setMensagem(e.target.value)} placeholder="Ex: pagamento do plano Pro de junho..." />
          </>}
          <button className="btn btn-p" style={{marginTop:12}} onClick={enviar} disabled={load}>{load?"A enviar...":"Enviar ao Suporte"}</button>
        </div>
      )}
    </div>
  );
}

function SuporteAdmin() {
  const [aba, setAba] = useState("inbox");
  const [msgs, setMsgs] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState({ titulo:"", corpo:"", tipo:"info" });
  const [filtro, setFiltro] = useState("novo");
  const [ok, setOk] = useState("");

  const carregar = () => {
    sb.from("mensagens").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setMsgs(data); }).catch(() => {});
    sb.from("avisos").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setAvisos(data); }).catch(() => {});
  };
  useEffect(carregar, []);

  const marcar = async (id, estado) => {
    await sb.from("mensagens").update({ estado }).eq("id", id);
    setMsgs(msgs.map(m => m.id === id ? { ...m, estado } : m));
  };
  const publicarAviso = async () => {
    if (!novoAviso.titulo.trim()) return;
    const { data } = await sb.from("avisos").insert({ ...novoAviso, ativo: true }).select().single();
    if (data) { setAvisos([data, ...avisos]); setNovoAviso({ titulo:"", corpo:"", tipo:"info" }); setOk("Aviso publicado a todos!"); setTimeout(()=>setOk(""),2500); }
  };
  const toggleAviso = async (id, ativo) => {
    await sb.from("avisos").update({ ativo: !ativo }).eq("id", id);
    setAvisos(avisos.map(a => a.id === id ? { ...a, ativo: !ativo } : a));
  };
  const apagarAviso = async (id) => {
    await sb.from("avisos").delete().eq("id", id);
    setAvisos(avisos.filter(a => a.id !== id));
  };

  const msgsFiltradas = filtro === "todos" ? msgs : msgs.filter(m => m.estado === filtro);
  const naoLidas = msgs.filter(m => m.estado === "novo").length;
  const TIPO_LBL = { duvida:"❓ Dúvida", comprovativo:"🧾 Comprovativo", sugestao:"💡 Sugestão" };

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">📡 Central de Comunicação</div>
        <div style={{display:"flex",gap:6}}>
          <button className={`chip ${aba==="inbox"?"on":""}`} onClick={()=>setAba("inbox")}>📥 Caixa de Entrada {naoLidas>0&&`(${naoLidas})`}</button>
          <button className={`chip ${aba==="avisos"?"on":""}`} onClick={()=>setAba("avisos")}>📢 Avisos / Campanhas</button>
        </div>
      </div>

      {ok && <div className="al al-s">{ok}</div>}

      {aba==="inbox" && (
        <div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
            {[["novo","Novos"],["lido","Lidos"],["resolvido","Resolvidos"],["todos","Todos"]].map(([k,l])=>(
              <button key={k} className={`chip ${filtro===k?"on":""}`} onClick={()=>setFiltro(k)} style={{fontSize:".62rem"}}>{l}</button>
            ))}
          </div>
          {msgsFiltradas.length===0 && <div className="al al-i">Nenhuma mensagem nesta categoria.</div>}
          {msgsFiltradas.map(m => (
            <div key={m.id} className="card" style={{padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:5}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:".75rem",fontWeight:700,color:"#b0c4d8"}}>{TIPO_LBL[m.tipo]||m.tipo} · {m.assunto}</div>
                  <div style={{fontSize:".6rem",color:"#3d5a7a"}}>{m.nome} · {m.email} · {fmtData(m.created_at?.split("T")[0])}</div>
                </div>
                <span style={{fontSize:".55rem",padding:"2px 7px",borderRadius:8,background:m.estado==="novo"?"#7a4a0022":m.estado==="resolvido"?"#1a5c2a22":"#1a4a5c22",color:m.estado==="novo"?"#f59e0b":m.estado==="resolvido"?"#4ade80":"#5a9ec9"}}>{m.estado}</span>
              </div>
              {m.mensagem && <div style={{fontSize:".72rem",color:"#7a98b8",lineHeight:1.5,marginBottom:6}}>{m.mensagem}</div>}
              {m.anexo && <img src={m.anexo} alt="anexo" style={{maxWidth:"100%",borderRadius:8,border:"1px solid #1a3a5c",marginBottom:6}} />}
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <a href={`mailto:${m.email}?subject=RE: ${encodeURIComponent(m.assunto||"Suporte VitalDoctor")}`} className="btn btn-s btn-sm" style={{width:"auto",textDecoration:"none"}}>✉️ Responder</a>
                {m.estado!=="lido" && <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>marcar(m.id,"lido")}>Marcar lido</button>}
                {m.estado!=="resolvido" && <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={()=>marcar(m.id,"resolvido")}>✓ Resolver</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba==="avisos" && (
        <div>
          <div className="card">
            <div className="card-t">📢 Novo Aviso para Todos os Subscritores</div>
            <div className="lbl">Tipo</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[["info","ℹ️ Informação"],["premium","⭐ Premium/Campanha"],["manutencao","🔧 Manutenção"]].map(([k,l])=>(
                <button key={k} className={`chip ${novoAviso.tipo===k?"on":""}`} onClick={()=>setNovoAviso({...novoAviso,tipo:k})} style={{fontSize:".62rem"}}>{l}</button>
              ))}
            </div>
            <div className="lbl">Título</div>
            <input className="inp" value={novoAviso.titulo} onChange={e=>setNovoAviso({...novoAviso,titulo:e.target.value})} placeholder="Ex: Nova funcionalidade disponível!" />
            <div className="lbl">Mensagem</div>
            <textarea className="inp" rows={3} value={novoAviso.corpo} onChange={e=>setNovoAviso({...novoAviso,corpo:e.target.value})} placeholder="Descreve o aviso ou campanha..." />
            <button className="btn btn-p" style={{marginTop:10}} onClick={publicarAviso}>📢 Publicar a Todos</button>
          </div>
          <div style={{fontSize:".62rem",color:"#3d5a7a",margin:"4px 0 8px",letterSpacing:1,textTransform:"uppercase"}}>Avisos publicados</div>
          {avisos.length===0 && <div className="al al-i">Sem avisos publicados.</div>}
          {avisos.map(a => (
            <div key={a.id} className="card" style={{padding:11,opacity:a.ativo?1:0.5}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:".75rem",fontWeight:700,color:"#b0c4d8"}}>{a.titulo}</div>
                  <div style={{fontSize:".68rem",color:"#5a7a9a",marginTop:2}}>{a.corpo}</div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>toggleAviso(a.id,a.ativo)}>{a.ativo?"Desativar":"Ativar"}</button>
                  <button className="btn btn-d btn-sm" style={{width:"auto"}} onClick={()=>apagarAviso(a.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════ Motor de texto editável em-página (só super admin) ════════
// Override guardado em app_config.config.textos[chave]. Cache carregado uma vez.
let _txtOverrides = null;
const _txtListeners = new Set();
async function _carregarOverrides() {
  if (_txtOverrides) return _txtOverrides;
  try {
    const { data } = await sb.from("app_config").select("config").eq("id",1).maybeSingle();
    _txtOverrides = (data?.config?.textos) || {};
  } catch { _txtOverrides = {}; }
  _txtListeners.forEach(fn => fn());
  return _txtOverrides;
}
async function _guardarOverride(chave, valor) {
  try {
    const { data } = await sb.from("app_config").select("config").eq("id",1).maybeSingle();
    const c = data?.config || {};
    const textos = { ...(c.textos||{}), [chave]: valor };
    const { error } = await sb.from("app_config").upsert({ id:1, config:{ ...c, textos }, updated_at:new Date().toISOString() });
    if (error) return false;
    _txtOverrides = textos; _txtListeners.forEach(fn => fn());
    return true;
  } catch { return false; }
}

function TextoEditavel({ chave, padrao, user, style, multiline }) {
  const [, force] = useState(0);
  const [editar, setEditar] = useState(false);
  const [draft, setDraft] = useState("");
  const ehAdmin = user?.role === "superadmin";
  useEffect(() => {
    const fn = () => force(n => n+1);
    _txtListeners.add(fn);
    _carregarOverrides();
    return () => { _txtListeners.delete(fn); };
  }, []);
  const temOverride = _txtOverrides && _txtOverrides[chave] != null;
  const valor = temOverride ? _txtOverrides[chave] : padrao;

  if (ehAdmin && editar) {
    return (
      <span style={{display:"block",textAlign:"left"}}>
        {multiline
          ? <textarea className="inp" rows={3} value={draft} onChange={e=>setDraft(e.target.value)} />
          : <input className="inp" value={draft} onChange={e=>setDraft(e.target.value)} />}
        <span style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <button className="btn btn-p btn-sm" onClick={async()=>{ const ok=await _guardarOverride(chave,draft); if(ok) setEditar(false); else alert("Não foi possível guardar."); }}>💾 Guardar</button>
          <button className="btn btn-s btn-sm" onClick={()=>setEditar(false)}>Cancelar</button>
          {temOverride && <button className="btn btn-s btn-sm" onClick={async()=>{ await _guardarOverride(chave,null); setEditar(false); }}>↺ Repor original</button>}
        </span>
      </span>
    );
  }
  if (!ehAdmin) return <span style={style}>{valor}</span>;
  return (
    <span style={{...style,borderBottom:"1px dashed rgba(0,198,184,.45)",cursor:"pointer"}}
      title="Editar este texto" onClick={()=>{ setDraft(valor); setEditar(true); }}>
      {valor}<span style={{fontSize:".7em",color:"#00c6b8",marginLeft:5}}>✏️</span>
    </span>
  );
}

// ════════ Conteúdo do método — override em base de dados (fallback ao código) ════════
let _metodoOverrides = null;
async function _carregarMetodoConteudo() {
  if (_metodoOverrides) return _metodoOverrides;
  try {
    const { data } = await sb.from("app_config").select("config").eq("id",1).maybeSingle();
    _metodoOverrides = (data?.config?.metodo) || {};
  } catch { _metodoOverrides = {}; }
  return _metodoOverrides;
}
function getConteudoMetodo(chave, padrao) {
  if (_metodoOverrides && _metodoOverrides[chave] != null) return _metodoOverrides[chave];
  return padrao;
}
async function guardarConteudoMetodo(chave, valor) {
  try {
    const { data } = await sb.from("app_config").select("config").eq("id",1).maybeSingle();
    const c = data?.config || {};
    const metodo = { ...(c.metodo||{}), [chave]: valor };
    const { error } = await sb.from("app_config").upsert({ id:1, config:{ ...c, metodo }, updated_at:new Date().toISOString() });
    if (error) return false;
    _metodoOverrides = metodo;
    return true;
  } catch { return false; }
}

// Pontos do método com override aplicado (reserva ao original)
function pontosComOverride() {
  const ov = (_metodoOverrides && _metodoOverrides.pontos) || {};
  return PONTOS.map(p => ov[p.id] ? { ...p, ...ov[p.id] } : p);
}

// ════════ Construtor de Módulos Terapêuticos (agnóstico) ════════

// ─── TEMPLATES PRÉ-BUILT ─────────────────────────────────────────────────────
const TEMPLATES_PREBUILT = [
  {
    id: "tpl_reiki",
    icone: "✨",
    nome: "Reiki",
    descricao: "Protocolo completo para sessões de Reiki — canalização, chakras, avaliação energética e protocolo pós-sessão.",
    categoria: "Terapias Energéticas",
    passos: [
      { id:"r1", titulo:"Acolhimento & Intenção", tipo:"texto_livre", pergunta:"Como se sente hoje? Qual a intenção para esta sessão?", obrigatorio:true },
      { id:"r2", titulo:"Avaliação Energética Inicial", tipo:"multipla_escolha", pergunta:"Quais chakras reporta como mais sobrecarregados?", opcoes:["Raiz (segurança)","Sacral (emoções)","Plexo Solar (poder pessoal)","Coração (amor)","Garganta (expressão)","3º Olho (intuição)","Coroa (conexão)"], multiplo:true },
      { id:"r3", titulo:"Sintomas Físicos", tipo:"texto_livre", pergunta:"Descreve os sintomas físicos presentes (dores, tensões, desconfortos):" },
      { id:"r4", titulo:"Intensidade Antes", tipo:"escala", pergunta:"De 0 a 10, nível de tensão/desconforto antes da sessão:", min:0, max:10 },
      { id:"r5", titulo:"Notas da Sessão", tipo:"notas_terapeuta", pergunta:"Zonas trabalhadas, sensações detectadas, bloqueios identificados (visível só para ti):" },
      { id:"r6", titulo:"Intensidade Após", tipo:"escala", pergunta:"De 0 a 10, nível de tensão/desconforto após a sessão:", min:0, max:10 },
      { id:"r7", titulo:"Experiência do Paciente", tipo:"texto_livre", pergunta:"O que o paciente sentiu durante e após a sessão?" },
      { id:"r8", titulo:"Recomendações", tipo:"texto_livre", pergunta:"Recomendações para os próximos dias (hidratação, descanso, exercícios de ancoragem):" },
    ],
    template_relatorio: "✨ SESSÃO DE REIKI\nPaciente: {nome} · {data}\n\nINTENÇÃO DA SESSÃO:\n{r1}\n\nCHAKRAS EM FOCO:\n{r2}\n\nSINTOMAS:\n{r3}\n\nEVOLUÇÃO: {r4}/10 → {r6}/10\n\nEXPERIÊNCIA:\n{r7}\n\nRECOMENDAÇÕES:\n{r8}"
  },
  {
    id: "tpl_psicologia",
    icone: "🧩",
    nome: "Psicologia / Psicoterapia",
    descricao: "Ficha clínica completa para sessões de psicologia — anamnese, SOAP, avaliação de risco e plano terapêutico.",
    categoria: "Saúde Mental",
    passos: [
      { id:"ps1", titulo:"Motivo da Consulta", tipo:"texto_livre", pergunta:"Qual o motivo que traz o paciente à consulta hoje?", obrigatorio:true },
      { id:"ps2", titulo:"Estado de Humor (S — Subjectivo)", tipo:"multipla_escolha", pergunta:"O paciente descreve o seu estado como:", opcoes:["Ansioso/a","Triste/deprimido/a","Irritável","Tranquilo/a","Ambivalente","Com pensamentos intrusivos","Em crise","Estável"], multiplo:true },
      { id:"ps3", titulo:"Observações Clínicas (O — Objectivo)", tipo:"notas_terapeuta", pergunta:"Apresentação, humor observado, contacto ocular, linguagem corporal, discurso:" },
      { id:"ps4", titulo:"Avaliação (A — Avaliação)", tipo:"texto_livre", pergunta:"Hipóteses de trabalho, padrões identificados, evolução desde a última sessão:" },
      { id:"ps5", titulo:"Risco", tipo:"sim_nao", pergunta:"Existem sinais de risco (auto ou heterolesão) a registar?" },
      { id:"ps6", titulo:"Notas de Risco", tipo:"texto_livre", pergunta:"Se sim, descreve o risco identificado e as medidas tomadas:" },
      { id:"ps7", titulo:"Plano (P — Plano)", tipo:"texto_livre", pergunta:"Intervenções desta sessão, tarefas para casa, próximos objectivos terapêuticos:" },
      { id:"ps8", titulo:"Próxima Sessão", tipo:"texto_livre", pergunta:"Foco para a próxima sessão:" },
    ],
    template_relatorio: "🧩 NOTA CLÍNICA PSICOLÓGICA (SOAP)\nPaciente: {nome} · {data}\n\nS — SUBJECTIVO:\n{ps1}\nEstado: {ps2}\n\nO — OBJECTIVO:\n{ps3}\n\nA — AVALIAÇÃO:\n{ps4}\n\nP — PLANO:\n{ps7}\n\nPRÓXIMA SESSÃO:\n{ps8}"
  },
  {
    id: "tpl_nutricao",
    icone: "🥗",
    nome: "Nutrição / Consulta Alimentar",
    descricao: "Ficha de consulta nutricional completa — anamnese alimentar, objectivos, plano e seguimento.",
    categoria: "Saúde & Bem-Estar",
    passos: [
      { id:"n1", titulo:"Objectivo Principal", tipo:"multipla_escolha", pergunta:"Qual o objectivo desta consulta?", opcoes:["Perda de peso","Ganho de massa muscular","Manutenção","Saúde digestiva","Energia e vitalidade","Alimentação anti-inflamatória","Intolerâncias / alergias","Outro"] },
      { id:"n2", titulo:"Historial Alimentar", tipo:"texto_livre", pergunta:"Descreve um dia alimentar típico (refeições, horários, quantidades aproximadas):" },
      { id:"n3", titulo:"Hábitos e Restrições", tipo:"multipla_escolha", pergunta:"Restrições ou preferências alimentares:", opcoes:["Vegetariano","Vegan","Sem glúten","Sem lactose","Sem açúcar","Sem carne vermelha","Halal","Kosher","Nenhuma restrição"], multiplo:true },
      { id:"n4", titulo:"Sintomas Digestivos", tipo:"multipla_escolha", pergunta:"Sintomas presentes:", opcoes:["Inchaço","Gases","Obstipação","Diarreia","Refluxo","Náuseas","Nenhum"], multiplo:true },
      { id:"n5", titulo:"Nível de Actividade Física", tipo:"multipla_escolha", pergunta:"Frequência de exercício:", opcoes:["Sedentário/a","1-2x semana","3-4x semana","5+ vezes semana","Treino de alta intensidade"] },
      { id:"n6", titulo:"Medidas (se aplicável)", tipo:"texto_livre", pergunta:"Peso actual, altura, IMC (se disponível):" },
      { id:"n7", titulo:"Plano Nutricional", tipo:"notas_terapeuta", pergunta:"Orientações, substituições, alimentos a incluir/reduzir, suplementação indicada (visível só para ti):" },
      { id:"n8", titulo:"Recomendações para o Paciente", tipo:"texto_livre", pergunta:"Orientações práticas para o paciente levar para casa:" },
    ],
    template_relatorio: "🥗 RELATÓRIO NUTRICIONAL\nPaciente: {nome} · {data}\n\nOBJECTIVO: {n1}\nHISTORIAL ALIMENTAR:\n{n2}\n\nSINTOMAS DIGESTIVOS: {n4}\nACTIVIDADE FÍSICA: {n5}\n\nRECOMENDAÇÕES:\n{n8}"
  },
  {
    id: "tpl_universal",
    icone: "🌀",
    nome: "Método Universal — Terapias Integrativas",
    descricao: "Protocolo base completo e adaptável a qualquer terapia integrativa. Inclui acolhimento, avaliação, protocolo e devolutiva.",
    categoria: "Universal",
    passos: [
      { id:"u1", titulo:"Acolhimento", tipo:"texto_livre", pergunta:"Como se sente hoje? O que o(a) traz à consulta?", obrigatorio:true },
      { id:"u2", titulo:"Queixa Principal", tipo:"texto_livre", pergunta:"Qual é o principal desafio que quer trabalhar hoje?", obrigatorio:true },
      { id:"u3", titulo:"Há quanto tempo", tipo:"multipla_escolha", pergunta:"Esta situação é:", opcoes:["Nova (primeira vez)","Recorrente (já aconteceu antes)","Crónica (há muito tempo)","Agravamento recente"] },
      { id:"u4", titulo:"Intensidade", tipo:"escala", pergunta:"De 0 a 10, como sente este desafio agora?", min:0, max:10, obrigatorio:true },
      { id:"u5", titulo:"Impacto na Vida", tipo:"multipla_escolha", pergunta:"Onde sente mais impacto?", opcoes:["Trabalho/Carreira","Relações afectivas","Saúde física","Sono/descanso","Bem-estar emocional","Família","Finanças","Sentido de vida"], multiplo:true },
      { id:"u6", titulo:"O que já tentou", tipo:"texto_livre", pergunta:"O que já fez para melhorar? O que ajudou, mesmo que pouco?" },
      { id:"u7", titulo:"Objectivo da Sessão", tipo:"texto_livre", pergunta:"O que gostaria de sentir/alcançar no final desta sessão?", obrigatorio:true },
      { id:"u8", titulo:"Notas do Terapeuta", tipo:"notas_terapeuta", pergunta:"Observações clínicas e percepções (visível apenas para ti):" },
      { id:"u9", titulo:"Protocolo & Próximos Passos", tipo:"texto_livre", pergunta:"Recomendações e protocolo para levar para casa:" },
    ],
    template_relatorio: "🌀 RELATÓRIO TERAPÊUTICO\nPaciente: {nome} · {data}\n\nQUEIXA: {u2}\nINTENSIDADE: {u4}/10\nIMPACTO: {u5}\n\nO QUE JÁ TENTOU:\n{u6}\n\nOBJECTIVO:\n{u7}\n\nPROTOCOLO & PRÓXIMOS PASSOS:\n{u9}"
  },
];

function ConstrutorModulos({ user }) {
  const ehAdmin = user?.role === "superadmin";
  const [modulos, setModulos] = useState([]);
  const [load, setLoad] = useState(true);
  const [editando, setEditando] = useState(null); // id do módulo a editar
  const [novo, setNovo] = useState(null); // nome do novo módulo
  const [msg, setMsg] = useState("");

  useEffect(() => {
    carregar();
  }, [user?.id]);

  const carregar = async () => {
    const { data } = await sb.from("custom_modules").select("*").eq("terapeuta_id", user.id).order("criado_em", { ascending: false });
    setModulos(data || []);
    setLoad(false);
  };

  const criarModulo = async (tpl = null) => {
    const nome = tpl ? tpl.nome : novo;
    if (!nome?.trim()) { setMsg("Dá um nome ao módulo."); return; }
    setLoad(true);
    const { data, error } = await sb.from("custom_modules").insert({
      terapeuta_id: user.id,
      nome: tpl ? tpl.nome : nome,
      descricao: tpl?.descricao || "",
      biblioteca: { criterios: [], protocolos: [], template_id: tpl?.id || null },
      fluxo: { passos: tpl?.passos || [] },
      logica: { template_relatorio: tpl?.template_relatorio || "" },
      template_relatorio: tpl?.template_relatorio || "",
      publicado: false,
      bloqueado_com: null,
    }).select().single();
    if (error) { setMsg("Erro: " + error.message); setLoad(false); return; }
    setModulos([data, ...modulos]);
    setNovo(null);
    setEditando(data.id);
    setLoad(false);
    setMsg("✅ " + (tpl ? `Template "${tpl.nome}" criado!` : "Módulo criado!"));
    setTimeout(() => setMsg(""), 2500);
  };

  const deletarModulo = async (id) => {
    if (!confirm("Apagar este módulo? (dados dos pacientes não são afetados)")) return;
    await sb.from("custom_modules").delete().eq("id", id);
    setModulos(modulos.filter(m => m.id !== id));
  };

  const publicarModulo = async (id) => {
    await sb.from("custom_modules").update({ publicado: true }).eq("id", id);
    setModulos(modulos.map(m => m.id === id ? { ...m, publicado: true } : m));
    setMsg("✅ Módulo publicado!");
    setTimeout(() => setMsg(""), 2000);
  };

  const [verTemplates, setVerTemplates] = useState(!modulos.length);

  if (load) return (
    <div className="fade" style={{padding:40,textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite"}}>🔄</div>
      <div style={{color:"#5a7a9a",fontSize:13}}>A carregar...</div>
    </div>
  );

  // MODO EDIÇÃO
  if (editando) {
    const mod = modulos.find(m => m.id === editando);
    return <EditorModulo modulo={mod} user={user} onSalvar={() => { carregar(); setEditando(null); }} onVoltar={() => setEditando(null)} />;
  }

  // LISTA DE MÓDULOS
  return (
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:"1.05rem",fontWeight:700,color:"#dde4f0"}}>⚙️ Meus Módulos Terapêuticos</div>
      </div>

      <div style={{fontSize:".72rem",background:"#0d1422",border:"1px solid #14233a",borderRadius:10,padding:12,marginBottom:14,color:"#5a7a9a",lineHeight:1.5}}>
        Cria módulos customizados para a tua terapia. Cada módulo tem: critérios de avaliação, fluxo de consulta, lógica de cálculo e relatório automático. Totalmente no-code e editável.
      </div>

      {msg && <div className="al al-ok">{msg}</div>}

      {/* GALERIA DE TEMPLATES PRÉ-BUILT */}
      <div className="card" style={{marginBottom:12,borderColor:"#1a4a6c"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:verTemplates?10:0}}>
          <div className="card-t" style={{margin:0}}>📦 Templates Prontos</div>
          <button onClick={()=>setVerTemplates(v=>!v)} style={{background:"none",border:"1px solid #0d1828",borderRadius:6,padding:"3px 10px",color:"#3d5a7a",fontSize:10,cursor:"pointer"}}>{verTemplates?"▲ Esconder":"▼ Ver templates"}</button>
        </div>
        {verTemplates && (
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <div style={{fontSize:9,color:"#3d5a7a",marginBottom:4}}>Começa com um template já configurado e edita à tua medida:</div>
            {TEMPLATES_PREBUILT.map(tpl=>(
              <div key={tpl.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:"#050810",border:"1px solid #0d1828",borderRadius:8}}>
                <span style={{fontSize:20,flexShrink:0}}>{tpl.icone}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:11,color:"#dde4f0"}}>{tpl.nome}</div>
                  <div style={{fontSize:9,color:"#3d5a7a"}}>{tpl.categoria} · {tpl.passos.length} passos pré-definidos</div>
                </div>
                <button className="btn btn-p btn-sm" style={{width:"auto",fontSize:10,padding:"5px 11px",flexShrink:0}} onClick={()=>criarModulo(tpl)}>Usar →</button>
              </div>
            ))}
            <div style={{textAlign:"center",fontSize:9,color:"#2d4a66",padding:"6px 0"}}>— ou cria do zero em baixo —</div>
          </div>
        )}
      </div>

      {/* CRIAR NOVO DO ZERO */}
      <div className="card">
        <label className="lbl">Criar módulo do zero</label>
        <div style={{display:"flex",gap:8}}>
          <input className="inp" value={novo || ""} onChange={e => setNovo(e.target.value)} placeholder="Ex: Meu Protocolo Nutricional" onKeyDown={e=>e.key==="Enter"&&criarModulo()}/>
          <button className="btn btn-p btn-sm" style={{width:"auto"}} disabled={load} onClick={()=>criarModulo()}>+ Criar</button>
        </div>
      </div>

      {/* LISTA */}
      {modulos.length === 0 ? (
        <div className="al al-i">Nenhum módulo ainda. Usa um template acima ou cria do zero!</div>
      ) : (
        modulos.map(m => (
          <div key={m.id} className="card" style={{borderColor: m.publicado ? "#1a5a4c" : "#3a3a3a"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:".9rem",fontWeight:700,color:"#dde4f0"}}>{m.nome}</div>
                <div style={{fontSize:".7rem",color:"#5a7a9a",marginTop:3}}>{m.descricao || "(sem descrição)"}</div>
                <div style={{fontSize:".65rem",color:"#3d5a7a",marginTop:5}}>
                  Passos: {(m.fluxo?.passos || []).length} · 
                  Critérios: {(m.biblioteca?.criterios || []).length} · 
                  Protocolos: {(m.biblioteca?.protocolos || []).length}
                </div>
                {m.publicado && <span style={{display:"inline-block",fontSize:".65rem",background:"#1a5a4c",color:"#5ae0d8",padding:"2px 8px",borderRadius:4,marginTop:8}}>✅ Publicado</span>}
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => setEditando(m.id)}>✏️ Editar</button>
                {!m.publicado && <button className="btn btn-g btn-sm" style={{width:"auto"}} onClick={() => publicarModulo(m.id)}>📤 Publicar</button>}
                <button className="btn btn-s btn-sm" style={{width:"auto",color:"#d9534f"}} onClick={() => deletarModulo(m.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Editor de módulo (construtor visual)
function EditorModulo({ modulo, user, onSalvar, onVoltar }) {
  const [cfg, setCfg] = useState(modulo);
  const [aGuardar, setAGuardar] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState(null);
  const [construindoMapeamento, setConstruindoMapeamento] = useState(false);

  const guardar = async () => {
    setAGuardar(true);
    await sb.from("custom_modules").update(cfg).eq("id", modulo.id);
    setAGuardar(false);
    onSalvar && onSalvar();
  };

  // MODO CONSTRUTOR DE MAPEAMENTO
  if (construindoMapeamento) {
    return <ConstruitorMapeamentoDinamico modulo={cfg} onSalvar={() => { setCfg({...cfg}); setConstruindoMapeamento(false); }} onVoltar={() => setConstruindoMapeamento(false)} />;
  }

  const Secao = ({ titulo, conteudo }) => {
    const open = secaoAberta === titulo;
    return (
      <div style={{marginBottom:10,border:"1px solid #14233a",borderRadius:10,overflow:"hidden"}}>
        <button 
          onClick={() => setSecaoAberta(s => s === titulo ? null : titulo)}
          style={{width:"100%",background:"#0d1422",border:"none",color:"#b0c4d8",fontSize:".75rem",fontWeight:700,cursor:"pointer",padding:"11px 14px",textAlign:"left",display:"flex",justifyContent:"space-between"}}
        >
          <span>{titulo}</span><span>{open ? "▲" : "▼"}</span>
        </button>
        {open && <div style={{padding:"11px 14px",background:"#050810"}}>{conteudo}</div>}
      </div>
    );
  };

  return (
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:"1.05rem",fontWeight:700,color:"#dde4f0"}}>📝 {cfg.nome}</div>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
      </div>

      {/* DADOS BÁSICOS */}
      <Secao titulo="📋 Dados Básicos" conteudo={
        <>
          <label className="lbl">Nome do módulo</label>
          <input className="inp mb8" value={cfg.nome} onChange={e => setCfg({...cfg, nome: e.target.value})} />
          <label className="lbl">Descrição</label>
          <textarea className="inp mb8" rows={2} value={cfg.descricao || ""} onChange={e => setCfg({...cfg, descricao: e.target.value})} placeholder="Ex: Protocolo personalizado baseado em energia, nutrição, etc." />
        </>
      } />

      {/* BIBLIOTECA DE DADOS */}
      <Secao titulo="📚 Biblioteca de Dados" conteudo={
        <>
          <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>Define os critérios, pontos ou categorias de avaliação que usas.</div>
          <label className="lbl">Critérios de avaliação (um por linha)</label>
          <textarea className="inp mb8" rows={4} value={(cfg.biblioteca?.criterios || []).join("\n")} 
            onChange={e => setCfg({...cfg, biblioteca: {...cfg.biblioteca, criterios: e.target.value.split("\n").filter(x => x.trim())}}) } 
            placeholder="Ex:&#10;Item 1&#10;Item 2&#10;Item 3&#10;..." />
          
          <label className="lbl">Protocolos (um por linha, com ação)</label>
          <textarea className="inp mb8" rows={4} value={(cfg.biblioteca?.protocolos || []).join("\n")} 
            onChange={e => setCfg({...cfg, biblioteca: {...cfg.biblioteca, protocolos: e.target.value.split("\n").filter(x => x.trim())}}) } 
            placeholder="Ex:&#10;Se {{criterio}} acionado → usar {{acao}}&#10;Se energia baixa → suplementação B12&#10;..." />
        </>
      } />

      {/* FLUXO DE CONSULTA */}
      <Secao titulo="🎯 Fluxo da Consulta" conteudo={
        <>
          <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>Define os passos que a consulta segue. Edita nome, descrição e instruções de cada um.</div>
          
          {(cfg.fluxo?.passos || []).length === 0 ? (
            <div style={{fontSize:".7rem",color:"#3d5a7a",padding:10,background:"#050810",borderRadius:8,marginBottom:10}}>
              Nenhum passo definido. Adiciona alguns:
            </div>
          ) : (
            <div style={{marginBottom:10}}>
              {cfg.fluxo.passos.map((p, i) => (
                <div key={i} style={{marginBottom:10,padding:10,background:"#050810",borderRadius:8,border:"1px solid #0d1828"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:".7rem",fontWeight:700,color:"#5ae0d8"}}>Passo {i + 1}</div>
                    <div style={{display:"flex",gap:4,flexShrink:0,flexDirection:"row"}}>
                      <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".65rem",padding:"4px 6px"}} disabled={i === 0} onClick={() => {
                        const novos = [...cfg.fluxo.passos];
                        [novos[i], novos[i-1]] = [novos[i-1], novos[i]];
                        setCfg({...cfg, fluxo: {...cfg.fluxo, passos: novos}});
                      }}>⬆️</button>
                      <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".65rem",padding:"4px 6px"}} disabled={i === cfg.fluxo.passos.length - 1} onClick={() => {
                        const novos = [...cfg.fluxo.passos];
                        [novos[i], novos[i+1]] = [novos[i+1], novos[i]];
                        setCfg({...cfg, fluxo: {...cfg.fluxo, passos: novos}});
                      }}>⬇️</button>
                      <button className="btn btn-s btn-sm" style={{width:"auto",color:"#d9534f",fontSize:".65rem",padding:"4px 6px"}} onClick={() => {
                        const novos = cfg.fluxo.passos.filter((_, idx) => idx !== i);
                        setCfg({...cfg, fluxo: {...cfg.fluxo, passos: novos}});
                      }}>🗑️</button>
                    </div>
                  </div>
                  
                  <label className="lbl" style={{fontSize:".65rem"}}>Nome do passo</label>
                  <input className="inp mb8" value={p.nome || ""} onChange={e => {
                    const novos = [...cfg.fluxo.passos];
                    novos[i] = {...p, nome: e.target.value};
                    setCfg({...cfg, fluxo: {...cfg.fluxo, passos: novos}});
                  }} placeholder="Ex: Acolhimento, Avaliação, Protocolo" style={{fontSize:".7rem"}} />
                  
                  <label className="lbl" style={{fontSize:".65rem"}}>Descrição/Instruções</label>
                  <textarea className="inp mb8" rows={2} value={p.descricao || ""} onChange={e => {
                    const novos = [...cfg.fluxo.passos];
                    novos[i] = {...p, descricao: e.target.value};
                    setCfg({...cfg, fluxo: {...cfg.fluxo, passos: novos}});
                  }} placeholder="Ex: Selecciona os itens aplicáveis" style={{fontSize:".7rem"}} />
                </div>
              ))}
            </div>
          )}
          
          <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={() => {
            const novoPasso = {nome: `Passo ${(cfg.fluxo?.passos || []).length + 1}`, descricao: ""};
            setCfg({...cfg, fluxo: {...cfg.fluxo, passos: [...(cfg.fluxo?.passos || []), novoPasso]}});
          }}>+ Adicionar passo</button>
        </>
      } />

      {/* LÓGICA DE CÁLCULO */}
      <Secao titulo="⚙️ Lógica de Cálculo" conteudo={
        <>
          <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>Define como os dados são processados (ex: se paciente responde X, calcula Y). Por agora, documentação manual.</div>
          <label className="lbl">Notas sobre cálculo</label>
          <textarea className="inp mb8" rows={3} value={cfg.logica?.notas || ""} 
            onChange={e => setCfg({...cfg, logica: {...cfg.logica, notas: e.target.value}})} 
            placeholder="Ex: Somar respostas A+B, multiplicar por peso C. Se resultado > 70 → protocolo intenso." />
        </>
      } />

      {/* Secção de Mapeamento Dinâmico */}
      <Secao titulo="🗺️ Mapeamento Dinâmico (Agnóstico)" conteudo={
        <>
          <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>Cria a estrutura do teu mapeamento. Define áreas/seções e itens/pontos. Totalmente customizável, nenhuma estrutura pré-definida.</div>
          <button className="btn btn-p btn-sm" style={{width:"100%"}} onClick={() => setConstruindoMapeamento(true)}>🗺️ Abrir Construtor de Mapeamento</button>
        </>
      } />
      <Secao titulo="📄 Template do Relatório" conteudo={
        <>
          <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>Template com variáveis {{nome_paciente}}, {{data}}, {{criterios_acionados}}, etc.</div>
          <textarea className="inp mb8" rows={6} value={cfg.template_relatorio || ""} 
            onChange={e => setCfg({...cfg, template_relatorio: e.target.value})} 
            placeholder={`RELATÓRIO — {{data}}
Paciente: {{nome_paciente}}

ACHADOS:
{{criterios_acionados}}

PROTOCOLO RECOMENDADO:
{{protocolos_indicados}}

PRÓXIMOS PASSOS:
- Seguimento em 7 dias
- Monitorizar {{pontos_chave}}`} />
        </>
      } />

      {/* BOTÕES */}
      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-p" style={{flex:1}} onClick={guardar} disabled={aGuardar}>💾 {aGuardar ? "A guardar..." : "Guardar módulo"}</button>
        <button className="btn btn-s" style={{flex:1}} onClick={onVoltar}>Cancelar</button>
      </div>
    </div>
  );
}

// ════════ Executor de Módulo Customizado ════════
function ExecutorModuloCustomizado({ modulo, paciente, user, onGuardar, onVoltar }) {
  const [passoAtual, setPassoAtual] = useState(0);
  const [dados, setDados] = useState({}); // dados recolhidos em cada passo
  const [load, setLoad] = useState(false);
  const [msg, setMsg] = useState("");

  if (!modulo) return <div className="fade"><div className="al al-e">Módulo não encontrado.</div></div>;

  const passos = modulo.fluxo?.passos || [];
  const passo = passos[passoAtual];
  const progresso = ((passoAtual + 1) / passos.length) * 100;

  const handleProx = () => {
    if (passoAtual < passos.length - 1) {
      setPassoAtual(p => p + 1);
    }
  };

  const handleAnt = () => {
    if (passoAtual > 0) {
      setPassoAtual(p => p - 1);
    }
  };

  const handleGuardar = async () => {
    setLoad(true);
    
    // Recolher protocolos dos itens marcados
    const protocolosAtivos = [];
    if (modulo.biblioteca?.secoes) {
      modulo.biblioteca.secoes.forEach(secao => {
        if (secao.itens) {
          secao.itens.forEach(item => {
            if (dados[`${secao.nome}_${item.nome}`] && item.protocolo) {
              protocolosAtivos.push(`${item.nome}: ${item.protocolo}`);
            }
          });
        }
      });
    }
    
    // Substituir variáveis no template
    let relatorio = modulo.template_relatorio || "";
    relatorio = relatorio.replace(/{{nome_paciente}}/g, paciente?.nome || "Paciente");
    relatorio = relatorio.replace(/{{data}}/g, fmtData(new Date()));
    
    const itensAtivos = Object.entries(dados)
      .filter(([k,v]) => v && !k.startsWith("passo_"))
      .map(([k]) => k.split("_").pop())
      .join(", ");
    relatorio = relatorio.replace(/{{criterios_acionados}}/g, itensAtivos || "(nenhum)");
    relatorio = relatorio.replace(/{{protocolos_indicados}}/g, protocolosAtivos.length > 0 ? protocolosAtivos.join("\n") : "(nenhum)");

    const consulta = {
      paciente_id: paciente?.id,
      terapeuta_id: user.id,
      data: fmtData(new Date()),
      tipo: "custom_module",
      modulo_id: modulo.id,
      modulo_nome: modulo.nome,
      dados_modulo: dados,
      relatorio: relatorio,
      notas: `Módulo: ${modulo.nome} | Itens marcados: ${itensAtivos}`,
    };

    const { error } = await sb.from("consultas").insert(consulta);
    setLoad(false);
    if (error) { setMsg("Erro: " + error.message); return; }
    setMsg("✅ Consulta guardada!");
    setTimeout(() => onGuardar && onGuardar(), 1500);
  };

  return (
    <div className="fade">
      {/* CABEÇALHO */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:"1rem",fontWeight:700,color:"#dde4f0"}}>📋 {modulo.nome}</div>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
      </div>

      {/* PROGRESSO */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:".65rem",color:"#5a7a9a",marginBottom:4}}>Passo {passoAtual + 1} de {passos.length}</div>
        <div style={{width:"100%",height:4,background:"#0d1828",borderRadius:2,overflow:"hidden"}}>
          <div style={{width:progresso+"%",height:"100%",background:"linear-gradient(90deg,#00c6b8,#f59e0b)",transition:"width .3s"}} />
        </div>
      </div>

      {/* PASSO ATUAL */}
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontSize:".9rem",fontWeight:700,color:"#dde4f0",marginBottom:4}}>
          {passo?.nome || "Passo"}
        </div>
        {passo?.descricao && (
          <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:12,paddingBottom:10,borderBottom:"1px solid #0d1828"}}>
            {passo.descricao}
          </div>
        )}

        {/* CONTEÚDO DO PASSO (dinâmico) */}
        {passoAtual === 0 && (
          <div>
            <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>Informações do paciente</div>
            <div style={{padding:10,background:"#050810",borderRadius:8,fontSize:".75rem",color:"#b0c4d8"}}>
              <div>👤 <strong>{paciente?.nome}</strong></div>
              <div>📧 {paciente?.email}</div>
              <div>📱 {paciente?.telefone}</div>
            </div>
          </div>
        )}

        {passoAtual === 1 && (
          <div>
            <div style={{fontSize:".75rem",color:"#5a7a9a",marginBottom:10}}>
              {modulo.biblioteca?.secoes?.length > 0 ? "Selecciona os itens aplicáveis:" : "Selecciona os critérios aplicáveis:"}
            </div>
            
            {/* Renderizar seções dinâmicas (novo sistema) */}
            {modulo.biblioteca?.secoes?.length > 0 && modulo.biblioteca.secoes.map((secao, i) => (
              <div key={secao.id || i} style={{marginBottom:14}}>
                <div style={{fontSize:".8rem",fontWeight:700,color:"#5ae0d8",marginBottom:6}}>
                  <span style={{fontSize:"1.1rem",marginRight:6}}>{secao.icone || "📋"}</span>
                  {secao.nome}
                </div>
                {secao.descricao && (
                  <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:8,paddingLeft:10}}>
                    {secao.descricao}
                  </div>
                )}
                <div style={{paddingLeft:10,borderLeft:"2px solid #1a5a4c"}}>
                  {secao.itens && secao.itens.map((item, j) => (
                    <label key={item.id || j} style={{display:"flex",gap:8,padding:"6px 0",alignItems:"center",fontSize:".73rem",cursor:"pointer"}}>
                      <input type="checkbox" checked={dados[`${secao.nome}_${item.nome}`] || false} onChange={e => setDados({...dados, [`${secao.nome}_${item.nome}`]: e.target.checked})} />
                      <span style={{color:"#b0c4d8"}}>{item.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Retrocompatibilidade: critérios antigos */}
            {(!modulo.biblioteca?.secoes || modulo.biblioteca.secoes.length === 0) && modulo.biblioteca?.criterios && (
              modulo.biblioteca.criterios.map((crit, i) => (
                <label key={i} style={{display:"flex",gap:8,padding:"8px 0",alignItems:"center",fontSize:".75rem",cursor:"pointer"}}>
                  <input type="checkbox" checked={dados[crit] || false} onChange={e => setDados({...dados, [crit]: e.target.checked})} />
                  <span style={{color:"#b0c4d8"}}>{crit}</span>
                </label>
              ))
            )}
          </div>
        )}

        {passoAtual > 1 && passoAtual < passos.length - 1 && (
          <div style={{fontSize:".75rem",color:"#5a7a9a"}}>
            <textarea className="inp" rows={4} value={dados[`passo_${passoAtual}`] || ""} onChange={e => setDados({...dados, [`passo_${passoAtual}`]: e.target.value})} placeholder="Anotações para este passo..." />
          </div>
        )}

        {passoAtual === passos.length - 1 && (
          <div style={{fontSize:".75rem",color:"#5a7a9a"}}>
            <div style={{marginBottom:12}}>Revisão dos protocolos recomendados:</div>
            
            {/* Protocolo por item marcado */}
            {modulo.biblioteca?.secoes && modulo.biblioteca.secoes.map((secao, i) => {
              const itensComProtocolo = secao.itens?.filter(item => dados[`${secao.nome}_${item.nome}`] && item.protocolo) || [];
              if (itensComProtocolo.length === 0) return null;
              return (
                <div key={i} style={{marginBottom:12,padding:10,background:"#050810",borderRadius:8,border:"1px solid #1a5a4c"}}>
                  <div style={{fontSize:".78rem",fontWeight:700,color:"#5ae0d8",marginBottom:6}}>
                    {secao.icone || "📋"} {secao.nome}
                  </div>
                  {itensComProtocolo.map((item, j) => (
                    <div key={j} style={{fontSize:".7rem",color:"#b0c4d8",marginBottom:6,paddingLeft:8,borderLeft:"2px solid #1a7a7c"}}>
                      <strong>{item.nome}</strong><br/>
                      📋 {item.protocolo}
                    </div>
                  ))}
                </div>
              );
            })}
            
            <div style={{padding:10,background:"#050810",borderRadius:8,fontSize:".7rem",color:"#3d5a7a",marginTop:12}}>
              ✅ Pronto? Clica em "Gerar relatório e guardar" para finalizar.
            </div>
          </div>
        )}
      </div>

      {/* BOTÕES */}
      <div style={{display:"flex",gap:10}}>
        {passoAtual > 0 && <button className="btn btn-s" style={{flex:1}} onClick={handleAnt}>← Anterior</button>}
        {passoAtual < passos.length - 1 ? (
          <button className="btn btn-p" style={{flex:passoAtual > 0 ? 1 : 2}} onClick={handleProx}>Próximo →</button>
        ) : (
          <button className="btn btn-p" style={{flex:1}} onClick={handleGuardar} disabled={load}>{load ? "A guardar..." : "💾 Gerar relatório e guardar"}</button>
        )}
      </div>

      {msg && <div className="al al-ok" style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}

// ════════ Construtor Dinâmico de Mapeamento (Agnóstico) ════════
function ConstruitorMapeamentoDinamico({ modulo, onSalvar, onVoltar }) {
  const [cfg, setCfg] = useState(modulo?.biblioteca || { secoes: [] });
  const [novaSecao, setNovaSecao] = useState("");
  const [expandidas, setExpandidas] = useState({});
  const [load, setLoad] = useState(false);

  const adicionarSecao = () => {
    if (!novaSecao.trim()) return;
    const novas = [...cfg.secoes, { id: Date.now(), nome: novaSecao, itens: [] }];
    setCfg({ ...cfg, secoes: novas });
    setNovaSecao("");
  };

  const adicionarItem = (secaoId) => {
    const secoes = cfg.secoes.map(s => 
      s.id === secaoId ? { ...s, itens: [...s.itens, { id: Date.now(), nome: `Item ${s.itens.length + 1}` }] } : s
    );
    setCfg({ ...cfg, secoes });
  };

  const atualizarSecao = (secaoId, campo, valor) => {
    const secoes = cfg.secoes.map(s => s.id === secaoId ? { ...s, [campo]: valor } : s);
    setCfg({ ...cfg, secoes });
  };

  const atualizarItem = (secaoId, itemId, campo, valor) => {
    const secoes = cfg.secoes.map(s => 
      s.id === secaoId ? { ...s, itens: s.itens.map(i => i.id === itemId ? { ...i, [campo]: valor } : i) } : s
    );
    setCfg({ ...cfg, secoes });
  };

  const deletarSecao = (secaoId) => {
    setCfg({ ...cfg, secoes: cfg.secoes.filter(s => s.id !== secaoId) });
  };

  const deletarItem = (secaoId, itemId) => {
    const secoes = cfg.secoes.map(s => 
      s.id === secaoId ? { ...s, itens: s.itens.filter(i => i.id !== itemId) } : s
    );
    setCfg({ ...cfg, secoes });
  };

  const guardar = async () => {
    setLoad(true);
    await sb.from("custom_modules").update({ biblioteca: cfg }).eq("id", modulo.id);
    setLoad(false);
    onSalvar && onSalvar();
  };

  return (
    <div className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:"1.05rem",fontWeight:700,color:"#dde4f0"}}>🗺️ Construtor de Mapeamento</div>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
      </div>

      <div style={{fontSize:".72rem",background:"#0d1422",border:"1px solid #14233a",borderRadius:10,padding:12,marginBottom:14,color:"#5a7a9a",lineHeight:1.5}}>
        Define as "áreas" ou "seções" do teu mapeamento. Tu escolhes os nomes e quantos itens em cada. Completamente customizável.
      </div>

      {/* ADICIONAR NOVA SEÇÃO */}
      <div className="card" style={{marginBottom:14}}>
        <label className="lbl">Adicionar nova área/seção</label>
        <div style={{display:"flex",gap:8}}>
          <input className="inp" value={novaSecao} onChange={e => setNovaSecao(e.target.value)} placeholder="Ex: Energia, Digestão, Emoções, etc." />
          <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={adicionarSecao}>+ Adicionar</button>
        </div>
      </div>

      {/* LISTA DE SEÇÕES */}
      {cfg.secoes.length === 0 ? (
        <div className="al al-i">Nenhuma seção criada. Começa a adicionar!</div>
      ) : (
        cfg.secoes.map((secao, idx) => (
          <div key={secao.id} className="card" style={{marginBottom:10,borderColor:"#1a5a4c"}}>
            {/* CABEÇALHO SEÇÃO */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                  <input className="inp" style={{fontSize:"1.2rem",width:50}} value={secao.icone || "📋"} onChange={e => atualizarSecao(secao.id, "icone", e.target.value)} placeholder="🔴" maxLength={2} />
                  <input className="inp" style={{fontSize:".85rem",fontWeight:700,flex:1}} value={secao.nome} onChange={e => atualizarSecao(secao.id, "nome", e.target.value)} placeholder="Nome da seção" />
                </div>
                <textarea className="inp mb8" rows={2} value={secao.descricao || ""} onChange={e => atualizarSecao(secao.id, "descricao", e.target.value)} placeholder="Descrição/instruções que aparece na consulta (ex: Selecciona os itens que se aplicam...)" style={{fontSize:".7rem"}} />
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0,flexDirection:"column"}}>
                <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".65rem",padding:"4px 6px"}} disabled={idx === 0} onClick={() => {
                  const novos = [...cfg.secoes];
                  [novos[idx], novos[idx-1]] = [novos[idx-1], novos[idx]];
                  setCfg({...cfg, secoes: novos});
                }}>⬆️</button>
                <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".65rem",padding:"4px 6px"}} disabled={idx === cfg.secoes.length - 1} onClick={() => {
                  const novos = [...cfg.secoes];
                  [novos[idx], novos[idx+1]] = [novos[idx+1], novos[idx]];
                  setCfg({...cfg, secoes: novos});
                }}>⬇️</button>
                <button className="btn btn-s btn-sm" style={{width:"auto",color:"#d9534f",whiteSpace:"nowrap",fontSize:".65rem",padding:"4px 6px"}} onClick={() => deletarSecao(secao.id)}>🗑️</button>
              </div>
            </div>

            {/* ITENS DA SEÇÃO */}
            <div style={{background:"#050810",borderRadius:8,padding:10,marginBottom:10}}>
              <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:8}}>Itens/Pontos ({secao.itens.length})</div>
              {secao.itens.map((item, jdx) => (
                <div key={item.id} style={{marginBottom:12,padding:10,background:"#0a1419",borderRadius:6,border:"1px solid #0d1828"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                    <input className="inp" value={item.nome} onChange={e => atualizarItem(secao.id, item.id, "nome", e.target.value)} placeholder="Nome do ponto/critério" style={{fontSize:".75rem",flex:1}} />
                    <div style={{display:"flex",gap:3,flexShrink:0,flexDirection:"column"}}>
                      <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".6rem",padding:"2px 4px"}} disabled={jdx === 0} onClick={() => {
                        const novos = [...secao.itens];
                        [novos[jdx], novos[jdx-1]] = [novos[jdx-1], novos[jdx]];
                        atualizarSecao(secao.id, "itens", novos);
                      }}>⬆️</button>
                      <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".6rem",padding:"2px 4px"}} disabled={jdx === secao.itens.length - 1} onClick={() => {
                        const novos = [...secao.itens];
                        [novos[jdx], novos[jdx+1]] = [novos[jdx+1], novos[jdx]];
                        atualizarSecao(secao.id, "itens", novos);
                      }}>⬇️</button>
                      <button className="btn btn-s btn-sm" style={{width:"auto",color:"#d9534f",fontSize:".6rem",padding:"2px 4px"}} onClick={() => deletarItem(secao.id, item.id)}>✕</button>
                    </div>
                  </div>
                  <label className="lbl" style={{fontSize:".65rem"}}>Protocolo/Ação (aparece no relatório quando marcado)</label>
                  <textarea className="inp" rows={2} value={item.protocolo || ""} onChange={e => atualizarItem(secao.id, item.id, "protocolo", e.target.value)} placeholder="Ex: Usar óleo de Mirra por 7 dias" style={{fontSize:".7rem"}} />
                </div>
              ))}
              <button className="btn btn-s btn-sm" style={{width:"100%",marginTop:8}} onClick={() => adicionarItem(secao.id)}>+ Adicionar item</button>
            </div>
          </div>
        ))
      )}

      {/* BOTÃO GUARDAR */}
      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-p" style={{flex:1}} onClick={guardar} disabled={load}>💾 {load ? "A guardar..." : "Guardar estrutura"}</button>
        <button className="btn btn-s" style={{flex:1}} onClick={onVoltar}>Cancelar</button>
      </div>
    </div>
  );
}

// ════════ Painel de edição de conteúdo do método (só super admin)
function EditorConteudoMetodo({ user }) {
  const ehAdmin = user?.role === "superadmin";
  const [aberto, setAberto] = useState(false);
  const [perguntas, setPerguntas] = useState(null);
  const [quest, setQuest] = useState(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [ok, setOk] = useState("");
  useEffect(() => { _carregarMetodoConteudo().then(() => {
    setPerguntas(getConteudoMetodo("perguntas_abertura", PERGUNTAS_ABERTURA));
    setQuest(getConteudoMetodo("questionario_escudos", QUESTIONARIO_ESCUDOS).map(b => ({ blocoId:b.blocoId, titulo:b.titulo, afirmacoes:[...(b.afirmacoes||[])] })));
  }); }, []);
  if (!ehAdmin) return null;
  const guardar = async () => {
    setAGuardar(true);
    const lista = (perguntas || []).map(s => s.trim()).filter(Boolean);
    const r = await guardarConteudoMetodo("perguntas_abertura", lista);
    setAGuardar(false);
    setOk(r ? "✅ Perguntas guardadas." : "❌ Não foi possível guardar.");
    setTimeout(() => setOk(""), 3000);
  };
  const repor = async () => {
    await guardarConteudoMetodo("perguntas_abertura", null);
    setPerguntas(PERGUNTAS_ABERTURA);
    setOk("↺ Reposto o original."); setTimeout(() => setOk(""), 3000);
  };
  const setAfirm = (bi, texto) => setQuest(qs => (qs||[]).map(b => b.blocoId===bi ? { ...b, afirmacoes: texto.split("\n") } : b));
  const guardarQuest = async () => {
    setAGuardar(true);
    const limpo = (quest||[]).map(b => ({ blocoId:b.blocoId, titulo:b.titulo, afirmacoes:(b.afirmacoes||[]).map(s=>s.trim()).filter(Boolean) }));
    const r = await guardarConteudoMetodo("questionario_escudos", limpo);
    setAGuardar(false);
    setOk(r ? "✅ Questionário guardado." : "❌ Não foi possível guardar.");
    setTimeout(() => setOk(""), 3000);
  };
  const reporQuest = async () => {
    await guardarConteudoMetodo("questionario_escudos", null);
    setQuest(QUESTIONARIO_ESCUDOS.map(b => ({ blocoId:b.blocoId, titulo:b.titulo, afirmacoes:[...(b.afirmacoes||[])] })));
    setOk("↺ Questionário reposto."); setTimeout(() => setOk(""), 3000);
  };
  return (
    <div className="card" style={{borderColor:"#1a3a5c",background:"#0a1422"}}>
      <button onClick={() => setAberto(a => !a)} style={{background:"none",border:"none",color:"#00c6b8",fontSize:".78rem",fontWeight:700,cursor:"pointer",width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
        <span>🛠️ Conteúdo do método (super admin)</span><span>{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div style={{marginTop:12}}>
          {ok && <div className="al al-ok" style={{marginBottom:8,fontSize:".75rem"}}>{ok}</div>}
          <div style={{fontSize:".72rem",color:"#7a98b8",marginBottom:6,fontWeight:600}}>Perguntas de abertura (uma por linha)</div>
          <textarea className="inp" rows={6} value={(perguntas || []).join("\n")} onChange={e => setPerguntas(e.target.value.split("\n"))} placeholder="Uma pergunta por linha..." />
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button className="btn btn-p btn-sm" style={{flex:1}} disabled={aGuardar} onClick={guardar}>{aGuardar ? "A guardar..." : "💾 Guardar"}</button>
            <button className="btn btn-s btn-sm" onClick={repor}>↺ Repor original</button>
          </div>
          <div style={{fontSize:".64rem",color:"#5a7a9a",marginTop:8,lineHeight:1.5}}>Enquanto não editares, usa o conteúdo original do código. Os subscritores nunca veem este painel.</div>

          <div style={{borderTop:"1px solid #14233a",margin:"14px 0 10px"}}></div>
          <div style={{fontSize:".72rem",color:"#7a98b8",marginBottom:8,fontWeight:600}}>Questionário dos escudos (afirmações, uma por linha)</div>
          {(quest||[]).map(b => (
            <div key={b.blocoId} style={{marginBottom:10}}>
              <div style={{fontSize:".68rem",color:"#00c6b8",marginBottom:4,fontWeight:600}}>{b.titulo}</div>
              <textarea className="inp" rows={Math.max(4,(b.afirmacoes||[]).length)} value={(b.afirmacoes||[]).join("\n")} onChange={e=>setAfirm(b.blocoId,e.target.value)} />
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button className="btn btn-p btn-sm" style={{flex:1}} disabled={aGuardar} onClick={guardarQuest}>{aGuardar ? "A guardar..." : "💾 Guardar questionário"}</button>
            <button className="btn btn-s btn-sm" onClick={reporQuest}>↺ Repor</button>
          </div>
          <div style={{fontSize:".62rem",color:"#5a7a9a",marginTop:8,lineHeight:1.5}}>⚠️ Podes mudar o texto das afirmações à vontade. Evita alterar o número de afirmações por bloco — a pontuação conta pela posição.</div>
        </div>
      )}
    </div>
  );
}

// Editor no-code dos pontos do mapeamento (só super admin). Guarda override; ligação à geração é passo posterior.
function EditorPontosMetodo({ user }) {
  const ehAdmin = user?.role === "superadmin";
  const [aberto, setAberto] = useState(false);
  const [sisAberto, setSisAberto] = useState(null);
  const [ov, setOv] = useState(null);
  const [okMsg, setOkMsg] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  useEffect(() => { _carregarMetodoConteudo().then(() => setOv(getConteudoMetodo("pontos", {}))); }, []);
  if (!ehAdmin) return null;
  const setCampo = (id, campo, val) => setOv(o => ({ ...o, [id]: { ...((o||{})[id]||{}), [campo]: val } }));
  const guardar = async () => {
    setAGuardar(true);
    const limpo = {};
    Object.entries(ov || {}).forEach(([id, campos]) => {
      const orig = PONTOS.find(p => p.id === id) || {};
      const c = {};
      Object.entries(campos || {}).forEach(([k, v]) => {
        const txt = (v || "").trim();
        if (txt && txt !== (orig[k] || "")) c[k] = txt; // só guarda o que difere do original
      });
      if (Object.keys(c).length) limpo[id] = c;
    });
    const r = await guardarConteudoMetodo("pontos", limpo);
    setAGuardar(false);
    setOkMsg(r ? "✅ Pontos guardados." : "❌ Erro ao guardar.");
    setTimeout(() => setOkMsg(""), 3000);
  };
  const CAMPOS = [["funcao","Função"],["aspectos","Aspetos emocionais"],["sintomas","Sintomas"],["frase","Pergunta-chave"]];
  return (
    <div className="card" style={{borderColor:"#1a3a5c",background:"#0a1422"}}>
      <button onClick={() => setAberto(a => !a)} style={{background:"none",border:"none",color:"#00c6b8",fontSize:".78rem",fontWeight:700,cursor:"pointer",width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
        <span>🗺️ Pontos do mapeamento (super admin)</span><span>{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div style={{marginTop:12}}>
          {okMsg && <div className="al al-ok" style={{marginBottom:8,fontSize:".75rem"}}>{okMsg}</div>}
          <div style={{fontSize:".64rem",color:"#5a7a9a",marginBottom:10,lineHeight:1.5}}>Preenche o significado de cada ponto. Por agora guarda o teu conteúdo; a ligação à geração de relatórios é o passo seguinte (testado). Vazio = usa o original.</div>
          {["Superior","Central","Inferior"].map(sis => {
            const pts = PONTOS.filter(p => p.sistema === sis);
            const open = sisAberto === sis;
            return (
              <div key={sis} style={{marginBottom:8,border:"1px solid #14233a",borderRadius:8,overflow:"hidden"}}>
                <button onClick={() => setSisAberto(s => s === sis ? null : sis)} style={{width:"100%",background:"#0d1422",border:"none",color:"#b0c4d8",fontSize:".74rem",fontWeight:700,cursor:"pointer",padding:"9px 11px",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                  <span>Sistema {sis} ({pts.length})</span><span>{open ? "▲" : "▼"}</span>
                </button>
                {open && pts.map(p => {
                  const o = (ov || {})[p.id] || {};
                  return (
                    <div key={p.id} style={{padding:"9px 11px",borderTop:"1px solid #0d1828"}}>
                      <div style={{fontSize:".72rem",color:"#00c6b8",fontWeight:700,marginBottom:6}}>{p.codigo} · {p.nome}</div>
                      {CAMPOS.map(([campo,lbl]) => (
                        <div key={campo} style={{marginBottom:6}}>
                          <span style={{fontSize:".6rem",color:"#7a98b8"}}>{lbl}</span>
                          <textarea className="inp" rows={2} value={o[campo] ?? p[campo] ?? ""} onChange={e => setCampo(p.id, campo, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:8}} disabled={aGuardar} onClick={guardar}>{aGuardar ? "A guardar..." : "💾 Guardar pontos"}</button>
        </div>
      )}
    </div>
  );
}

// Aviso global — controlado pelo super admin, visto por todos. Edição na própria barra.
function AvisoGlobal({ user }) {
  const [cfg, setCfg] = useState(null);
  const [editar, setEditar] = useState(false);
  const [draft, setDraft] = useState({ ativo:false, texto:"", cor:"#00c6b8" });
  const ehAdmin = user?.role === "superadmin";

  useEffect(() => {
    sb.from("app_config").select("config").eq("id",1).maybeSingle().then(({ data }) => {
      const c = data?.config || {};
      setCfg(c);
      setDraft(c.aviso || { ativo:false, texto:"", cor:"#00c6b8" });
    }).catch(() => setCfg({}));
  }, []);

  const guardar = async () => {
    const novo = { ...(cfg||{}), aviso: draft };
    const { error } = await sb.from("app_config").upsert({ id:1, config:novo, updated_at:new Date().toISOString() });
    if (error) { alert("Não foi possível guardar o aviso."); return; }
    setCfg(novo); setEditar(false);
  };

  if (cfg === null) return null;
  const aviso = cfg.aviso || { ativo:false, texto:"", cor:"#00c6b8" };

  // Edição in-place (só super admin)
  if (ehAdmin && editar) {
    return (
      <div style={{background:"#0d1422",border:"1px solid #14233a",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{fontSize:".68rem",color:"#00c6b8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>📢 Aviso global (todos os utilizadores)</div>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:".78rem",color:"#7a98b8",marginBottom:8,cursor:"pointer"}}>
          <input type="checkbox" checked={draft.ativo} onChange={e=>setDraft({...draft,ativo:e.target.checked})} /> Mostrar a todos
        </label>
        <input className="inp" value={draft.texto} onChange={e=>setDraft({...draft,texto:e.target.value})} placeholder="Mensagem do aviso..." style={{marginBottom:8}} />
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:".72rem",color:"#7a98b8"}}>Cor</span>
          <input type="color" value={draft.cor} onChange={e=>setDraft({...draft,cor:e.target.value})} style={{width:46,height:30,borderRadius:6,border:"1px solid #0d1828",background:"#050810",cursor:"pointer"}} />
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-p btn-sm" style={{flex:1}} onClick={guardar}>💾 Guardar</button>
          <button className="btn btn-s btn-sm" onClick={()=>{ setDraft(aviso); setEditar(false); }}>Cancelar</button>
        </div>
      </div>
    );
  }

  // Banner visível (todos)
  if (aviso.ativo && aviso.texto) {
    return (
      <div style={{position:"relative",background:aviso.cor,color:"#fff",borderRadius:10,padding:"11px 40px 11px 14px",marginBottom:12,fontSize:".82rem",fontWeight:600}}>
        📢 {aviso.texto}
        {ehAdmin && <button onClick={()=>setEditar(true)} title="Editar aviso" style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.9)",border:"none",borderRadius:"50%",width:28,height:28,fontSize:".72rem",cursor:"pointer"}}>✏️</button>}
      </div>
    );
  }

  // Sem aviso ativo — só o super admin vê um botão discreto para criar
  if (ehAdmin) {
    return (
      <div style={{textAlign:"right",marginBottom:8}}>
        <button onClick={()=>setEditar(true)} style={{background:"none",border:"1px solid #14233a",color:"#5a7a9a",borderRadius:20,padding:"4px 12px",fontSize:".68rem",cursor:"pointer"}}>✏️ Criar aviso global</button>
      </div>
    );
  }
  return null;
}

function AdminPanel({ user }) {
  const [users, setUsers] = useState([]);
  const [aba, setAba] = useState("users");
  const [audios, setAudios] = useState([]);
  const [novoAudio, setNovoAudio] = useState({ nome:"",descricao:"",link_drive:"",tipo:"meditacao" });
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const LC_C = "vd_conteudo";
  const [conteudo, setConteudo] = useState(() => { try { return JSON.parse(localStorage.getItem(LC_C)||"{}"); } catch { return {}; } });
  const [novoItem, setNovoItem] = useState({ categoria:"farmacia", nome:"", descricao:"", contraind:"", notas:"" });
  const [hotmartKey, setHotmartKey] = useState(() => localStorage.getItem("vd_hotmart_key")||"");
  const [planos, setPlanos] = useState([]);
  const [parceria, setParceria] = useState({ parceiro_nome:"", comissao_pct:0, ativo:false, notas:"" });
  const [okMsg, setOkMsg] = useState("");
  useEffect(() => {
    sb.from("planos").select("*").order("ordem").then(({ data }) => { if (data) setPlanos(data); }).catch(()=>{});
    sb.from("parceria_config").select("*").eq("id",1).maybeSingle().then(({ data }) => { if (data) setParceria(data); }).catch(()=>{});
  }, []);
  const salvarPlano = async (p) => {
    await sb.from("planos").update({ preco:p.preco, nome:p.nome, descricao:p.descricao, max_pacientes_portal:p.max_pacientes_portal, max_profissionais:p.max_profissionais, minisite:p.minisite, modulo_avancado:p.modulo_avancado, experimental_dias:p.experimental_dias, destaque:p.destaque, ativo:p.ativo }).eq("id", p.id);
    setOkMsg("Plano guardado!"); setTimeout(()=>setOkMsg(""), 2000);
  };
  const salvarParceria = async () => {
    await sb.from("parceria_config").update({ parceiro_nome:parceria.parceiro_nome, comissao_pct:parceria.comissao_pct, ativo:parceria.ativo, notas:parceria.notas }).eq("id", 1);
    setOkMsg("Parceria guardada!"); setTimeout(()=>setOkMsg(""), 2000);
  };
  const [buscaUser, setBuscaUser] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("todos");
  const [filtroMod, setFiltroMod] = useState("todos");
  const [userAberto, setUserAberto] = useState(null);

  useEffect(() => {
    sb.from("profiles").select("*").then(({ data }) => { if (data) setUsers(data); });
    sb.from("audios").select("*").order("ordem").then(({ data }) => { if (data) setAudios(data); });
    sb.from("config_global").select("valor").eq("chave","conteudo_admin").single()
      .then(({data:d})=>{ if(d?.valor){ const v=typeof d.valor==="object"?d.valor:JSON.parse(d.valor); setConteudo(v); localStorage.setItem(LC_C,JSON.stringify(v)); } }).catch(()=>{});
  }, []);

  const mudarPlano = async (id, plano) => {
    await sb.from("profiles").update({ plano }).eq("id", id);
    setUsers(users.map(u => u.id === id ? { ...u, plano } : u));
  };
  const toggleMod = async (id, mod) => {
    const u = users.find(x => x.id === id);
    const novo = tog(u.modulos_ativos||[], mod);
    await sb.from("profiles").update({ modulos_ativos: novo }).eq("id", id);
    setUsers(users.map(x => x.id === id ? { ...x, modulos_ativos: novo } : x));
  };
  const setValidade = async (id, mod, data) => {
    const u = users.find(x=>x.id===id);
    const prefs = { ...(u.preferencias||{}), modulos_validade: { ...(u.preferencias?.modulos_validade||{}), [mod]: data||null } };
    await sb.from("profiles").update({ preferencias: prefs }).eq("id", id);
    setUsers(users.map(x=>x.id===id?{...x,preferencias:prefs}:x));
  };

  const addAudio = async () => {
    if (!novoAudio.nome||!novoAudio.link_drive) { setErr("Nome e link obrigatorios."); return; }
    const { data } = await sb.from("audios").insert(novoAudio).select().single();
    if (data) { setAudios([...audios,data]); setNovoAudio({nome:"",descricao:"",link_drive:"",tipo:"meditacao"}); setOk("Audio publicado!"); setTimeout(()=>setOk(""),2000); }
    setErr("");
  };
  const removerAudio = async (id) => { await sb.from("audios").delete().eq("id",id); setAudios(audios.filter(a=>a.id!==id)); };
  const syncConteudo = async (dados) => {
    localStorage.setItem(LC_C,JSON.stringify(dados));
    try { await sb.from("config_global").upsert({chave:"conteudo_admin",valor:dados},{onConflict:"chave"}); } catch {}
  };
  const addItemConteudo = async () => {
    if (!novoItem.nome.trim()) return;
    const lista = [...(conteudo[novoItem.categoria]||[]), {...novoItem,id:Date.now()}];
    const novo = {...conteudo,[novoItem.categoria]:lista};
    setConteudo(novo); await syncConteudo(novo);
    setNovoItem({...novoItem,nome:"",descricao:"",contraind:"",notas:""});
    setOk("Adicionado!"); setTimeout(()=>setOk(""),1500);
  };
  const rmItemConteudo = async (cat,id) => {
    const novo = {...conteudo,[cat]:(conteudo[cat]||[]).filter(i=>i.id!==id)};
    setConteudo(novo); await syncConteudo(novo);
  };
  const TABS = [["users","👥 Subscritores"],["planos","💎 Planos"],["parceria","🤝 Parceria"],["conteudo","📝 Conteúdo"],["formularios","🛠️ Formulários"],["modulos","🧩 Módulos"],["hotmart","💳 Hotmart"],["audio","🎧 Áudios"],["stats","📊 Stats"]];
  const CATS = [["farmacia","🌿 Farmácia Natural"],["infanto","👶 Infanto-Juvenil"],["protocolo","📋 Protocolo"],["texto","📄 Texto livre"]];

  return (
    <div className="fade">
      {ok && <div className="al al-ok" style={{marginBottom:8}}>{ok}</div>}
      {err && <div className="al al-d" style={{marginBottom:8}}>{err}</div>}
      <div className="card">
        <div className="card-t">⚙️ Super Painel Admin</div>
        <div style={{fontSize:9,color:"#2d4a66",marginBottom:8,display:"flex",gap:14,flexWrap:"wrap"}}>
          <span>✉️ <a href="mailto:suportevitaldoctor@gmail.com" style={{color:"#00c6b8",textDecoration:"none"}}>suportevitaldoctor@gmail.com</a></span>
          <span style={{color:"#3d5a7a"}}>💬 Telegram: em breve</span>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {TABS.map(([k,l])=><button key={k} className={`chip ${aba===k?"on":""}`} onClick={()=>setAba(k)}>{l}</button>)}
        </div>
      </div>

      {aba==="users" && (() => {
        const filtrados = users
          .filter(u => !buscaUser || (u.nome||"").toLowerCase().includes(buscaUser.toLowerCase()) || (u.email||"").toLowerCase().includes(buscaUser.toLowerCase()))
          .filter(u => filtroPlano==="todos" || (u.plano||"trial")===filtroPlano)
          .filter(u => filtroMod==="todos" || (filtroMod==="avancado" && (u.modulos_ativos||[]).includes("avancado")) || (filtroMod==="sem_avancado" && !(u.modulos_ativos||[]).includes("avancado")));
        const planoLabel = { trial:"Trial", base:"Base", pro:"Pro", elite:"Elite" };
        const planoCor = { trial:"#3d5a7a", base:"#00c6b8", pro:"#f59e0b", elite:"#a855f7" };
        return (
          <div>
            {/* Resumo rápido (estatísticas) */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
              {[
                ["Total", users.length, "#00c6b8"],
                ["Especializado", users.filter(u=>(u.modulos_ativos||[]).includes("avancado")).length, "#a855f7"],
                ["Pagos", users.filter(u=>["base","pro","elite"].includes(u.plano)).length, "#f59e0b"],
                ["Trial", users.filter(u=>!u.plano||u.plano==="trial").length, "#3d5a7a"],
              ].map(([l,n,c])=>(
                <div key={l} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                  <div style={{fontSize:"1.1rem",fontWeight:700,color:c}}>{n}</div>
                  <div style={{fontSize:".52rem",color:"#3d5a7a",textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Pesquisa + filtros */}
            <input className="inp" placeholder="🔍 Pesquisar por nome ou email..." value={buscaUser} onChange={e=>setBuscaUser(e.target.value)} style={{marginBottom:7}} />
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {[["todos","Todos os planos"],["trial","Trial"],["base","Base"],["pro","Pro"],["elite","Elite"]].map(([k,l])=>(
                <button key={k} className={`chip ${filtroPlano===k?"on":""}`} onClick={()=>setFiltroPlano(k)} style={{fontSize:".62rem"}}>{l}</button>
              ))}
              <button className={`chip ${filtroMod==="avancado"?"on":""}`} onClick={()=>setFiltroMod(filtroMod==="avancado"?"todos":"avancado")} style={{fontSize:".62rem"}}>🧠 Com Especializado</button>
            </div>

            {/* Lista compacta */}
            {filtrados.length===0 && <div className="al al-i">Nenhum subscritor encontrado.</div>}
            {filtrados.map(u=>{
              const aberto = userAberto===u.id;
              const temAv = (u.modulos_ativos||[]).includes("avancado");
              return (
                <div key={u.id} style={{background:"#0a0e18",border:`1px solid ${aberto?"#1a4a5c":"#0d1828"}`,borderRadius:8,marginBottom:6,overflow:"hidden"}}>
                  {/* Linha compacta — sempre visível */}
                  <div onClick={()=>setUserAberto(aberto?null:u.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",cursor:"pointer"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:"#0d1828",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".75rem",flexShrink:0,color:"#5a7a9a"}}>{(u.nome||"?")[0].toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:".75rem",color:"#b0c4d8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nome||"(sem nome)"}{u.role==="superadmin"&&" 👑"}</div>
                      <div style={{fontSize:".58rem",color:"#2d4a66",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                    </div>
                    <span style={{fontSize:".55rem",padding:"2px 7px",borderRadius:8,background:planoCor[u.plano||"trial"]+"22",color:planoCor[u.plano||"trial"],fontWeight:600,flexShrink:0}}>{planoLabel[u.plano||"trial"]}</span>
                    {temAv && <span style={{fontSize:".7rem",flexShrink:0}} title="Módulo Especializado activo">🧠</span>}
                    <span style={{color:"#3d5a7a",fontSize:".7rem",flexShrink:0}}>{aberto?"▾":"▸"}</span>
                  </div>
                  {/* Detalhe — só quando aberto */}
                  {aberto && (
                    <div style={{padding:"4px 11px 11px",borderTop:"1px solid #0d1828"}} className="fade">
                      {u.role!=="superadmin" && <>
                        <div className="admin-row">
                          <span style={{fontSize:".68rem",color:"#3d5a7a"}}>Plano</span>
                          <select className="inp sel" value={u.plano||"trial"} onChange={e=>mudarPlano(u.id,e.target.value)} style={{width:"auto",padding:"3px 22px 3px 7px",fontSize:".68rem"}}>
                            <option value="trial">Trial</option><option value="base">Base €10</option><option value="pro">Pro €18</option><option value="elite">Elite €23</option>
                          </select>
                        </div>
                        {[["hikari","🔮 Hikari Fafe"],["avancado","🧠 A&D (Especializado)"],["audios","🎧 Áudios"],["minisite","🌐 Mini Site (Trial 14d)"]].map(([mod,label])=>(
                          <div key={mod}>
                            <div className="admin-row">
                              <span style={{fontSize:".68rem",color:"#3d5a7a"}}>{label}</span>
                              <button className={`tw ${(u.modulos_ativos||[]).includes(mod)?"on":"off"}`} onClick={()=>toggleMod(u.id,mod)} />
                            </div>
                            {(mod==="avancado"||mod==="minisite")&&(u.modulos_ativos||[]).includes(mod)&&(
                              <div className="admin-row" style={{paddingLeft:10}}>
                                {mod==="avancado"&&(
                                  <>
                                    <span style={{fontSize:".6rem",color:"#2d4a66"}}>Válido até (vazio=vitalício)</span>
                                    <input type="date" style={{background:"#040810",border:"1px solid #0d1828",borderRadius:4,padding:"2px 6px",fontSize:".6rem",color:"#b0c4d8"}}
                                      value={u.preferencias?.modulos_validade?.avancado||""}
                                      onChange={e=>setValidade(u.id,"avancado",e.target.value||null)} />
                                  </>
                                )}
                                {mod==="minisite"&&(
                                  <>
                                    <span style={{fontSize:".6rem",color:"#2d4a66"}}>Trial até (auto 14 dias)</span>
                                    <input type="date" style={{background:"#040810",border:"1px solid #0d1828",borderRadius:4,padding:"2px 6px",fontSize:".6rem",color:"#b0c4d8"}}
                                      value={u.preferencias?.modulos_trial?.[mod]||new Date(Date.now()+14*24*60*60*1000).toISOString().split("T")[0]}
                                      onChange={e=>setValidade(u.id,mod,e.target.value||null)} />
                                    <span style={{fontSize:".55rem",color:"#1a4a5c"}}>ℹ️ Após trial: subscrição ou desativa</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </>}
                      {u.role==="superadmin" && <div style={{fontSize:".68rem",color:"#3d5a7a",padding:"6px 0"}}>👑 Super Admin — acesso total à aplicação.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {okMsg && <div className="al al-s">{okMsg}</div>}

      {aba==="planos" && (
        <div>
          <div className="al al-i" style={{marginBottom:10}}>Define cada plano: preço, limites e o que o torna indispensável. Tudo editável — guarda e fica ativo para todos.</div>
          {planos.map((p,idx) => (
            <div key={p.id} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <input className="inp" value={p.nome} onChange={e=>{const n=[...planos];n[idx]={...p,nome:e.target.value};setPlanos(n);}} style={{width:"55%",fontWeight:700}} />
                <label style={{fontSize:".62rem",color:"#5a7a9a",display:"flex",alignItems:"center",gap:5}}>
                  <input type="checkbox" checked={p.ativo} onChange={e=>{const n=[...planos];n[idx]={...p,ativo:e.target.checked};setPlanos(n);}} /> Ativo
                </label>
              </div>
              <div className="g2">
                <div><span className="lbl">Preço €/mês</span><input className="inp" type="number" value={p.preco} onChange={e=>{const n=[...planos];n[idx]={...p,preco:parseFloat(e.target.value)||0};setPlanos(n);}} /></div>
                <div><span className="lbl">Experimental (dias)</span><input className="inp" type="number" value={p.experimental_dias} onChange={e=>{const n=[...planos];n[idx]={...p,experimental_dias:parseInt(e.target.value)||0};setPlanos(n);}} /></div>
              </div>
              <div className="g2">
                <div><span className="lbl">Máx. pacientes-portal</span><input className="inp" type="number" value={p.max_pacientes_portal} onChange={e=>{const n=[...planos];n[idx]={...p,max_pacientes_portal:parseInt(e.target.value)||0};setPlanos(n);}} /></div>
                <div><span className="lbl">Máx. profissionais</span><input className="inp" type="number" value={p.max_profissionais} onChange={e=>{const n=[...planos];n[idx]={...p,max_profissionais:parseInt(e.target.value)||1};setPlanos(n);}} /></div>
              </div>
              <div style={{display:"flex",gap:14,margin:"8px 0"}}>
                <label style={{fontSize:".68rem",color:"#7a98b8",display:"flex",alignItems:"center",gap:5}}><input type="checkbox" checked={p.minisite} onChange={e=>{const n=[...planos];n[idx]={...p,minisite:e.target.checked};setPlanos(n);}} /> 🌐 Mini-site</label>
                <label style={{fontSize:".68rem",color:"#7a98b8",display:"flex",alignItems:"center",gap:5}}><input type="checkbox" checked={p.modulo_avancado} onChange={e=>{const n=[...planos];n[idx]={...p,modulo_avancado:e.target.checked};setPlanos(n);}} /> 🧠 Módulo especializado</label>
              </div>
              <span className="lbl">O que torna este plano indispensável</span>
              <input className="inp" value={p.destaque||""} onChange={e=>{const n=[...planos];n[idx]={...p,destaque:e.target.value};setPlanos(n);}} placeholder="Ex: Portal ilimitado + dados na nuvem" />
              <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:8}} onClick={()=>salvarPlano(planos[idx])}>💾 Guardar {p.nome}</button>
            </div>
          ))}
          {planos.length===0 && <div className="al al-w">Corre o SQL planos.sql para criar os planos.</div>}
        </div>
      )}

      {aba==="parceria" && (
        <div>
          <div className="al al-i" style={{marginBottom:10}}>Gestão da parceria do módulo especializado. Regista a comissão acordada com a criadora.</div>
          <div className="card">
            <div className="card-t">🤝 Parceria do Módulo Especializado</div>
            <span className="lbl">Nome do parceiro/criador</span>
            <input className="inp" value={parceria.parceiro_nome||""} onChange={e=>setParceria({...parceria,parceiro_nome:e.target.value})} placeholder="Nome do parceiro" />
            <div className="g2">
              <div><span className="lbl">Comissão por venda (%)</span><input className="inp" type="number" value={parceria.comissao_pct} onChange={e=>setParceria({...parceria,comissao_pct:parseFloat(e.target.value)||0})} /></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><label style={{fontSize:".68rem",color:"#7a98b8",display:"flex",alignItems:"center",gap:5,paddingBottom:8}}><input type="checkbox" checked={parceria.ativo} onChange={e=>setParceria({...parceria,ativo:e.target.checked})} /> Parceria ativa</label></div>
            </div>
            <span className="lbl">Notas (acordos, condições)</span>
            <textarea className="inp" rows={3} value={parceria.notas||""} onChange={e=>setParceria({...parceria,notas:e.target.value})} placeholder="Condições da parceria, datas, observações..." />
            <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:8}} onClick={salvarParceria}>💾 Guardar Parceria</button>
            {parceria.ativo && parceria.comissao_pct>0 && (
              <div style={{marginTop:10,padding:"10px",background:"rgba(245,158,11,.06)",border:"1px solid #5c4a1a",borderRadius:7,fontSize:".7rem",color:"#fde68a"}}>
                💡 Com {parceria.comissao_pct}% de comissão: por cada subscrição de €15, devolves €{(15*parceria.comissao_pct/100).toFixed(2)} ao parceiro.
              </div>
            )}
          </div>
        </div>
      )}

      {aba==="conteudo" && (
        <div>
          <div className="al al-i" style={{fontSize:10,marginBottom:8}}>Adiciona conteúdo sem código. Fica disponível imediatamente nos separadores correspondentes da app.</div>
          <div className="card">
            <div className="card-t">+ Novo item</div>
            <select className="inp sel" value={novoItem.categoria} onChange={e=>setNovoItem(n=>({...n,categoria:e.target.value}))} style={{marginBottom:6}}>
              {CATS.map(([k,l])=><option key={k} value={k}>{l}</option>)}
            </select>
            {[["nome","Título / Nome *"],["descricao","Descrição / Indicação"],["contraind","Contra-indicações / Cuidados ⚠️"],["notas","Notas adicionais"]].map(([k,ph])=>(
              <textarea key={k} className="inp" rows={k==="nome"?1:2} placeholder={ph} style={{resize:"vertical"}} value={novoItem[k]||""} onChange={e=>setNovoItem(n=>({...n,[k]:e.target.value}))} />
            ))}
            <button className="btn btn-p" onClick={addItemConteudo} disabled={!novoItem.nome.trim()}>Adicionar</button>
          </div>
          {CATS.map(([cat,catLabel])=>(conteudo[cat]||[]).length>0&&(
            <div key={cat} className="card">
              <div className="card-t">{catLabel} ({(conteudo[cat]||[]).length})</div>
              {(conteudo[cat]||[]).map(item=>(
                <div key={item.id} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid #0d1828"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div style={{fontWeight:600,fontSize:11,color:"#00c6b8"}}>{item.nome}</div>
                    <button className="chip" onClick={()=>rmItemConteudo(cat,item.id)}>✕</button>
                  </div>
                  {item.descricao&&<div style={{fontSize:10,color:"#5a7a9a"}}>{item.descricao}</div>}
                  {item.contraind&&<div style={{fontSize:10,color:"#f59e0b"}}>⚠️ {item.contraind}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {aba==="modulos" && (
        <div>
          <div className="al al-i" style={{fontSize:10,marginBottom:8}}>Configura visibilidade e acesso de cada módulo.</div>
          {[{id:"metodo",nome:"🧠 Atendimento Especializado",desc:"Módulo certificado (avancado)"},{id:"minisite",nome:"🌐 Mini Site",desc:"Página pública (Pro)"},{id:"audios",nome:"🎧 Biblioteca de Áudios",desc:"Áudios terapêuticos"}].map(m=>(
            <div key={m.id} className="card" style={{marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:12,color:"#b0c4d8"}}>{m.nome}</div>
              <div style={{fontSize:10,color:"#5a7a9a",marginBottom:6}}>{m.desc}</div>
              <div className="admin-row"><span style={{fontSize:10,color:"#3d5a7a"}}>Permissão necessária: {m.id}</span></div>
              <div className="admin-row">
                <span style={{fontSize:10,color:"#3d5a7a"}}>Utilizadores com acesso</span>
                <strong style={{color:"#b0c4d8"}}>{users.filter(u=>(u.modulos_ativos||[]).includes(m.id)).length}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba==="hotmart" && (
        <div>
          <div className="card">
            <div className="card-t">💳 Integração Hotmart</div>
            <div className="al al-i" style={{fontSize:10,marginBottom:8}}>Quando alguém compra na Hotmart, o acesso é activado automaticamente via webhook.</div>
            <div className="lbl">URL do webhook (coloca na Hotmart)</div>
            <div style={{background:"#040810",border:"1px solid #0d1828",borderRadius:6,padding:"8px 10px",fontSize:10,color:"#00c6b8",wordBreak:"break-all",marginBottom:6,userSelect:"all"}}>
              https://lrmylsywevawexzcgqzc.supabase.co/functions/v1/hotmart-webhook
            </div>
            <div style={{fontSize:9,color:"#2d4a66",marginBottom:10}}>Na Hotmart: Ferramentas → Webhooks → Novo → cola o URL acima. O sistema activa o acesso automaticamente após pagamento confirmado.</div>
            <div className="lbl">Chave secreta do webhook (Hotmart)</div>
            <input className="inp" placeholder="hotmart_secret_key_..." value={hotmartKey} onChange={e=>{setHotmartKey(e.target.value);localStorage.setItem("vd_hotmart_key",e.target.value);}} />
            <div className="al al-w" style={{fontSize:9,marginTop:8}}>Para activar o webhook: cria uma Edge Function chamada "hotmart-webhook" no painel Supabase. Diz-me e gero o código em segundos.</div>
          </div>
          <div className="card">
            <div className="card-t">Activação manual</div>
            <div style={{fontSize:10,color:"#5a7a9a"}}>Enquanto o webhook não estiver activo: vai a Subscritores → activa "Módulo Especializado" → define a data de validade → pronto.</div>
          </div>
          <div className="card">
            <div className="card-t">Como colocar à venda na Hotmart</div>
            {["1. Cria uma conta de produtor em app.hotmart.com","2. Novo produto → Acesso a Software/Ferramenta","3. Link de entrega: vitaldoctor.netlify.app + instruções de registo","4. Para subscriçções mensais: tipo Assinatura Recorrente","5. Activa o programa Acesso Antecipado para -10% de comissão no 1.º mês","6. Cola o URL do webhook acima em Ferramentas → Webhooks"].map((p,i)=>(
              <div key={i} style={{fontSize:10,color:"#5a7a9a",marginBottom:4}}>• {p}</div>
            ))}
          </div>
        </div>
      )}

      {aba==="audio" && (
        <div>
          <div className="al al-i" style={{marginBottom:9}}>Adiciona links do Google Drive. Ficam disponíveis imediatamente.</div>
          {audios.map((a,i)=>(
            <div key={i} style={{background:"#040810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:5}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{a.nome}</div>{a.descricao&&<div style={{fontSize:9,color:"#2d4a66"}}>{a.descricao}</div>}</div>
                <button className="btn btn-d btn-sm" style={{fontSize:9}} onClick={()=>removerAudio(a.id)}>✕</button>
              </div>
            </div>
          ))}
          <div className="card">
            <div className="card-t">+ Novo áudio</div>
            {[["nome","Nome *"],["descricao","Descrição"],["link_drive","Link Google Drive *"]].map(([k,ph])=>(
              <input key={k} className="inp" placeholder={ph} value={novoAudio[k]} onChange={e=>setNovoAudio(n=>({...n,[k]:e.target.value}))} />
            ))}
            <select className="inp sel" value={novoAudio.tipo} onChange={e=>setNovoAudio(n=>({...n,tipo:e.target.value}))} style={{marginTop:4}}>
              {["meditacao","modulacao","frequencia","outro"].map(t=><option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-p" style={{marginTop:6}} onClick={addAudio}>Publicar áudio</button>
          </div>
        </div>
      )}

      {aba==="stats" && (
        <div className="card">
          <div className="card-t">📊 Resumo</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["Total",users.length],["Trial",users.filter(u=>u.plano==="trial").length],["Base",users.filter(u=>u.plano==="base").length],["Pro",users.filter(u=>u.plano==="pro").length],["Elite",users.filter(u=>u.plano==="elite").length],["Especializado",users.filter(u=>(u.modulos_ativos||[]).includes("avancado")).length]].map(([l,v])=>(
              <div key={l} className="stat"><div className="stat-n">{v}</div><div className="stat-l">{l}</div></div>
            ))}
          </div>
          <div style={{fontSize:11,color:"#5a7a9a"}}>Receita estimada: <strong style={{color:"#10b981"}}>€{(users.filter(u=>u.plano==="base").length*10+users.filter(u=>u.plano==="pro").length*18+users.filter(u=>u.plano==="elite").length*23).toFixed(0)}/mês</strong></div>
        </div>
      )}
      {aba==="formularios" && <FormBuilder />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════
// ════════ Política de Privacidade / RGPD ════════
const POLITICA_PRIVACIDADE = {
  titulo: "Política de Privacidade e Proteção de Dados",
  subtitulo: "Tratamento de dados pessoais ao abrigo do RGPD",
  secoes: [
    { titulo: "1. Responsável pelo tratamento", texto: "O terapeuta/clínica titular da conta é o responsável pelo tratamento dos dados dos seus pacientes. A VitalDoctor atua como subcontratante (fornecedor da ferramenta), processando os dados apenas para prestar o serviço." },
    { titulo: "2. Que dados são tratados", texto: "Dados de conta (nome, email), dados de pacientes inseridos pelo terapeuta (identificação, contactos, notas de consulta, respostas a formulários), agendamentos e registos de pagamento. Os dados de saúde são categoria especial e tratados com proteção reforçada." },
    { titulo: "3. Finalidade e base legal", texto: "Os dados são tratados para a gestão da relação terapêutica (execução do serviço) e com base no consentimento do paciente, recolhido pelo terapeuta. Não são usados para publicidade nem vendidos a terceiros." },
    { titulo: "4. Onde os dados são guardados", texto: "Os dados são armazenados de forma encriptada em servidores na União Europeia (infraestrutura Supabase). A ligação é protegida por HTTPS e o acesso é isolado por utilizador através de políticas de segurança ao nível da base de dados (RLS)." },
    { titulo: "5. Conservação", texto: "Os dados são conservados enquanto a conta estiver ativa ou enquanto forem necessários à relação terapêutica e a obrigações legais. O titular pode pedir a eliminação a qualquer momento." },
    { titulo: "6. Direitos do titular", texto: "Tens direito de acesso, retificação, eliminação, limitação, portabilidade e oposição. Podes exportar os teus dados em formato estruturado através do botão abaixo. Para eliminar dados de um paciente, usa a opção de apagar na ficha do paciente." },
    { titulo: "7. Segurança", texto: "Encriptação em repouso e em trânsito, isolamento de dados por conta, e controlo de acessos. Nenhum subscritor consegue aceder aos dados de outro." },
    { titulo: "8. Contacto e reclamações", texto: "Para exercer os teus direitos, contacta o responsável pela conta. Tens também o direito de apresentar reclamação à autoridade de controlo (em Portugal, a CNPD)." },
  ],
  nota: "Documento informativo. Recomenda-se revisão por advogado antes da comercialização.",
};

function PrivacidadeModal({ perfil, onFechar }) {
  const [aExportar, setAExportar] = useState(false);
  const exportar = async () => {
    setAExportar(true);
    try {
      const uid = perfil.id;
      const q = (n) => sb.from(n).select("*").eq("terapeuta_id", uid);
      const [pac, cons, pag, resp, ag, mat] = await Promise.all([q("pacientes"), q("consultas"), q("pagamentos"), q("respostas"), q("agenda"), q("materiais")]);
      const dados = {
        exportado_em: new Date().toISOString(),
        perfil: { id: perfil.id, nome: perfil.nome, email: perfil.email, role: perfil.role, plano: perfil.plano },
        pacientes: pac.data || [], consultas: cons.data || [], pagamentos: pag.data || [],
        respostas: resp.data || [], agenda: ag.data || [], materiais: mat.data || [],
      };
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `vitaldoctor-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Não foi possível exportar agora. Tenta novamente."); }
    setAExportar(false);
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(2,6,14,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onFechar}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0a0e18",border:"1px solid #14233a",borderRadius:14,maxWidth:560,width:"100%",maxHeight:"88vh",overflowY:"auto",padding:"20px 18px"}}>
        <div style={{fontSize:"1.05rem",fontWeight:700,color:"#cdd9e8"}}>🔒 {POLITICA_PRIVACIDADE.titulo}</div>
        <div style={{fontSize:".72rem",color:"#5a7a9a",marginTop:3,marginBottom:14}}>{POLITICA_PRIVACIDADE.subtitulo}</div>

        <div style={{background:"#0d1422",border:"1px solid #14233a",borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{fontSize:".82rem",fontWeight:700,color:"#00c6b8",marginBottom:6}}>📥 Exportar os meus dados (RGPD)</div>
          <div style={{fontSize:".74rem",color:"#7a98b8",lineHeight:1.5,marginBottom:10}}>Descarrega um ficheiro com todos os teus dados em formato estruturado (portabilidade — Art. 20.º RGPD).</div>
          <button className="btn btn-p btn-sm" style={{width:"100%"}} disabled={aExportar} onClick={exportar}>{aExportar ? "A preparar..." : "📥 Exportar os meus dados"}</button>
        </div>

        {POLITICA_PRIVACIDADE.secoes.map((s, i) => (
          <div key={i} style={{marginBottom:11}}>
            <div style={{fontSize:".8rem",fontWeight:700,color:"#b0c4d8",marginBottom:3}}>{s.titulo}</div>
            <div style={{fontSize:".74rem",color:"#7a98b8",lineHeight:1.6}}>{s.texto}</div>
          </div>
        ))}
        <div style={{fontSize:".64rem",color:"#5a7a9a",fontStyle:"italic",marginTop:8,marginBottom:14}}>{POLITICA_PRIVACIDADE.nota}</div>

        <button className="btn btn-s" style={{width:"100%"}} onClick={onFechar}>Fechar</button>
      </div>
    </div>
  );
}

function ModuloExclusivoBioHertz(props) { return <DashboardComTemplates {...props} />; }

export default function VitalDoctor() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mod, setMod] = useState("dashboard");
  const [metodoTab, setMetodoTab] = useState(null);
  const [showMaisMobile, setShowMaisMobile] = useState(false);
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const navegar = (m, aba) => {
    // Shortcuts sidebar → metodo sub-tabs
    if (m === "metodo_preconsulta") { setMetodoTab("preconsulta"); setMod("metodo"); window.scrollTo(0,0); return; }
    if (m === "metodo_packs")       { setMetodoTab("packs");       setMod("metodo"); window.scrollTo(0,0); return; }
    setMetodoTab(aba || null);
    setMod(m);
    // Reset fluxo de consulta ao sair do módulo método
    if (m !== "metodo") {
      setPacConfirmado && setPacConfirmado(false);
    }
    window.scrollTo(0, 0);
  };
  // Botão de retroceder do aparelho: recua dentro da app, nunca sai (só "Sair" sai)
  const navHist = useRef(["dashboard"]);
  const navSkip = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Não prender nas páginas públicas (mini-site, formulário, portal)
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("site") || sp.get("form") || sp.get("portal")) return;
    window.history.pushState({ vd: true }, "");
    const onPop = () => {
      const h = navHist.current;
      if (h.length > 1) {
        h.pop();
        navSkip.current = true;
        setMod(h[h.length - 1]);
      }
      window.history.pushState({ vd: true }, ""); // nunca sai da app
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (navSkip.current) { navSkip.current = false; return; }
    const h = navHist.current;
    if (h[h.length - 1] !== mod) h.push(mod);
  }, [mod]);
  const [pacs, setPacs] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) carregarUser(session.user);
      else setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) carregarUser(session.user);
      else { setUser(null); setPerfil(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const carregarUser = async (u) => {
    try {
      setUser(u);
      let { data: prof, error: profErr } = await sb.from("profiles").select("*").eq("id", u.id).single();
      
      if (profErr && profErr.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', profErr);
        setLoading(false);
        return;
      }
      
      if (!prof) {
        await sb.from("profiles").insert({ id: u.id, nome: u.user_metadata?.nome || u.email?.split("@")[0], email: u.email, role: "terapeuta", plano: "trial", trial_fim: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() });
        const { data } = await sb.from("profiles").select("*").eq("id", u.id).single();
        prof = data;
      }
      
      if (u.email === "ricardocorreia.211984@gmail.com" && prof?.role !== "superadmin") {
        await sb.from("profiles").update({ role: "superadmin" }).eq("id", u.id);
        prof = { ...prof, role: "superadmin" };
      }
      
      setPerfil(prof);
      
      // Carregar pacientes e agenda
      const pacQuery = prof.org_id
        ? sb.from("pacientes").select("*").eq("org_id", prof.org_id).order("nome")
        : sb.from("pacientes").select("*").eq("terapeuta_id", u.id).order("nome");
      const { data: ps, error: psErr } = await pacQuery;
      if (psErr) console.error('Erro ao carregar pacientes:', psErr);
      setPacs(ps || []);
      
      const agQuery = prof.org_id
        ? sb.from("agenda").select("*").eq("org_id", prof.org_id).order("data")
        : sb.from("agenda").select("*").eq("terapeuta_id", u.id).order("data");
      const { data: ag, error: agErr } = await agQuery;
      if (agErr) console.error('Erro ao carregar agenda:', agErr);
      setAgenda(ag || []);
      
      // Verificar termos na primeira sessão
      if (prof && !jaAceitouTermos(u.id)) setMostrarTermos(true);
      setLoading(false);
    } catch (err) {
      console.error('Erro fatal ao carregar utilizador:', err);
      setLoading(false);
    }
  };

  const logout = async () => {
    await sb.auth.signOut();
    setUser(null); setPerfil(null); setPacs([]); setAgenda([]); setMod("dashboard");
  };

  const isSuperAdmin = perfil?.role === "superadmin";
  const isAdmin = perfil?.role === "admin" || perfil?.role === "superadmin";
  const temMod = (m) => {
    if (isSuperAdmin) return true;
    const mods = perfil?.modulos_ativos || [];
    if (!mods.includes(m)) return false;
    const val = perfil?.preferencias?.modulos_validade?.[m];
    return !val || new Date(val) >= new Date();
  };

  // Navegação limpa — apenas o essencial
  const SB_NAV = [
    { t:"Principal",  items:[{ id:"dashboard",    icon:"🏠",l:"Dashboard" }] },
    { t:"Clínico",    items:[
      { id:"pacientes",  icon:"👥",l:"Pacientes" },
      { id:"agenda",     icon:"📅",l:"Agenda" },
      { id:"mensagens",  icon:"💬",l:"Mensagens" },
    ]},
    { t:"Consultas",  items:[
      { id:"metodo",         icon:"🩺",l:"Nova Consulta" },
      { id:"metodo_preconsulta", icon:"📤",l:"Pré-Consulta" },
      { id:"metodo_packs",   icon:"💳",l:"Packs" },
    ]},
    { t:"Mais",       items:[
      { id:"clinica",    icon:"🏥",l:"Clínica" },
      { id:"modulos",    icon:"⚙️",l:"Módulos" },
      { id:"minisite",   icon:"🌐",l:"Mini Site" },
      { id:"precos",     icon:"💎",l:"Planos & Preços" },
      ...(isSuperAdmin ? [{ id:"admin", icon:"🔧",l:"Admin" }] : []),
      { id:"suporte",    icon:"🆘",l:"Ajuda" },
    ]},
  ];
  // Itens da bottom nav (visíveis sem scroll) — máx 6
  const BOT_MAIN = [
    { id:"dashboard",   icon:"🏠",l:"Dashboard" },
    { id:"pacientes",   icon:"👥",l:"Pacientes" },
    { id:"agenda",      icon:"📅",l:"Agenda" },
    { id:"mensagens",   icon:"💬",l:"Mensagens" },
    { id:"metodo",      icon:"🩺",l:"Consulta" },
    { id:"metodo_packs",icon:"💳",l:"Packs" },
  ];

  const TITULOS = {
    dashboard:"Dashboard", pacientes:"Pacientes", agenda:"Agenda", mensagens:"Mensagens",
    metodo:"Nova Consulta", minisite:"Mini Site",
    admin:"Painel Super Admin", suporte:"Ajuda / Suporte", clinica:"A Minha Clínica", modulos:"Métodos Terapêuticos",
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,letterSpacing:4,background:"linear-gradient(135deg,#00c6b8,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>VITALDOCTOR</div>
        <div style={{color:"#2d4a66",fontSize:12}}>A carregar...</div>
      </div>
    </div>
  );

  const _formTok = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("form") : null;
  if (_formTok) return <><style>{CSS}</style><FormPublico token={_formTok} /></>;
  const _portalTok = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("portal") : null;
  if (_portalTok) return <><style>{CSS}</style><PortalPaciente token={_portalTok} /></>;
  const _siteTok = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("site") : null;
  if (_siteTok) return <><style>{CSS}</style><SitePublico slug={_siteTok} /></>;
  if (!user) return <><style>{CSS}</style><Auth onLogin={(u) => {
    if (u && !jaAceitouTermos(u.id)) setMostrarTermos(true);
  }} /></>;

  return (
    <>
      <style>{CSS}</style>
      {!online && <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9998,background:"#7a3a00",color:"#ffd9a0",fontSize:11,textAlign:"center",padding:"5px 10px"}}>📡 Sem ligação à internet — a ver dados guardados. As alterações serão gravadas quando voltar a ligação.</div>}
      {mostrarTermos && user && <TermosModal onAceitar={() => {
        registarAceiteTermos(user.id);
        setMostrarTermos(false);
      }} />}
      {mostrarPrivacidade && perfil && <PrivacidadeModal perfil={perfil} onFechar={() => setMostrarPrivacidade(false)} />}
      <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
        <div className="app" style={{flex:1,overflow:"hidden"}}>
        <aside className="sb">
          <div className="sb-logo">
            {perfil?.config?.logo
              ? <img src={perfil.config.logo} style={{maxHeight:34,maxWidth:"100%",objectFit:"contain"}} />
              : <div className="sb-logo-t">{perfil?.config?.nomePratica || "VITALDOCTOR"}</div>}
            <div className="sb-logo-v">{perfil?.config?.nomePratica ? "" : "SaaS v1.0"}</div>
          </div>
          <div className="sb-user">
            {perfil?.config?.nomePratica && perfil?.config?.logo && <div style={{fontSize:".62rem",color:"#3d5a7a",marginBottom:4}}>{perfil.config.nomePratica}</div>}
            <div className="sb-user-n">{perfil?.nome || user.email}</div>
            <div className="sb-user-p">
              {perfil?.plano === "trial"
                ? `Trial — ${Math.max(0, Math.ceil((new Date(perfil.trial_fim) - Date.now()) / (1000*60*60*24)))}d`
                : perfil?.plano || "Terapeuta"}
            </div>
          </div>
          <nav className="sb-nav">
            {SB_NAV.map(s => (
              <div key={s.t}>
                <div className="sb-sec">{s.t}</div>
                {s.items.map(i => (
                  <div key={i.id} className={`sb-item ${mod === i.id ? "on" : ""}`} onClick={() => setMod(i.id)}>
                    <span className="sb-item-i">{i.icon}</span><span>{i.l}</span>
                  </div>
                ))}
              </div>
            ))}
          </nav>
          <div className="sb-foot">
            <div style={{fontSize:8,lineHeight:1.5,color:"#1a2840",marginBottom:6,textAlign:"center"}}>
              Ferramenta de apoio. Não substitui conhecimento, formação nem julgamento clínico.
            </div>
            <button className="sb-btn" style={{background:"none",border:"1px solid #14233a",color:"#7a98b8",marginBottom:5}} onClick={() => setMostrarPrivacidade(true)}>🔒 Privacidade & RGPD</button>
            <button className="sb-btn" onClick={logout}>Sair</button>
          </div>
        </aside>

        <main className="main">
          <div className="main-hdr">
            <div className="main-title">{TITULOS[mod] || "VitalDoctor"}</div>
            <div style={{fontSize:9,color:"#1a2840"}}>{user.email}</div>
          </div>
          <div className="main-body">
            <AvisoGlobal user={perfil} />
            {mod === "dashboard" && <Dashboard user={perfil} pacs={pacs} agenda={agenda} go={navegar} />}
            {mod === "pacientes" && <Pacientes user={perfil} pacs={pacs} setPacs={setPacs} navegar={navegar} />}
            {mod === "mensagens" && <Mensagens user={perfil} pacs={pacs} />}
            {mod === "clinica"   && <Clinica user={perfil} onUpdate={setPerfil} />}
            {mod === "modulos"   && <ConstrutorModulos user={perfil} />}
            {mod === "agenda"    && <Agenda user={perfil} pacs={pacs} agenda={agenda} setAgenda={setAgenda} />}
            {mod === "metodo" && <ModuloMetodo user={perfil} adminMode={isSuperAdmin} temAcesso={isSuperAdmin || temMod("avancado")} temHikari={isSuperAdmin || temMod("hikari")} initAba={metodoTab} voltar={() => navegar("dashboard")} />}
            {mod === "minisite"  && <MiniSite user={perfil} />}
            {mod === "precos"    && <PaginaPrecos user={perfil} onVoltar={()=>navegar("dashboard")} />}
            {mod === "admin"     && isSuperAdmin && <AdminPanel user={perfil} />}
            {mod === "suporte"   && <Suporte user={perfil} isSuperAdmin={isSuperAdmin} />}
          </div>
        </main>

        </div>{/* end .app */}
        <nav className="mob-nav">
          <div className="mob-inner">
            {BOT_MAIN.map(i => (
              <button key={i.id} className={`mob-btn ${mod === i.id ? "on" : ""}`} onClick={() => navegar(i.id)}>
                <span className="mob-icon">{i.icon}</span>{i.l}
              </button>
            ))}
            <button className="mob-btn" onClick={() => setShowMaisMobile(v=>!v)}>
              <span className="mob-icon">⋯</span>Mais
            </button>
          </div>
        </nav>
        {/* MENU MAIS — mobile overlay */}
        {showMaisMobile && (
          <div style={{position:"fixed",bottom:60,left:0,right:0,background:"#0a0e18",borderTop:"1px solid #1a3a5c",zIndex:200,padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[
              { id:"clinica",    icon:"🏥",l:"A Minha Clínica" },
              { id:"modulos",    icon:"⚙️",l:"Módulos" },
              { id:"minisite",   icon:"🌐",l:"Mini Site" },
              { id:"suporte",    icon:"🆘",l:"Ajuda" },
              { id:"metodo_preconsulta", icon:"📤",l:"Pré-Consulta" },
              ...(isSuperAdmin ? [{ id:"admin", icon:"🔧",l:"Admin" }] : []),
            ].map(i=>(
              <button key={i.id} onClick={()=>{navegar(i.id);setShowMaisMobile(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 6px",borderRadius:8,border:"1px solid #1a3a5c",background:"#050810",cursor:"pointer"}}>
                <span style={{fontSize:18}}>{i.icon}</span>
                <span style={{fontSize:9,color:"#8ba3c0"}}>{i.l}</span>
              </button>
            ))}
            <button onClick={logout} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 6px",borderRadius:8,border:"1px solid #5a1a1a",background:"#050810",cursor:"pointer"}}>
              <span style={{fontSize:18}}>🚪</span><span style={{fontSize:9,color:"#f87171"}}>Sair</span>
            </button>
            <button onClick={()=>setShowMaisMobile(false)} style={{gridColumn:"1/-1",padding:"8px 0",borderRadius:8,border:"1px solid #0d1828",background:"#0d1828",cursor:"pointer",fontSize:10,color:"#5a7a9a"}}>✕ Fechar</button>
          </div>
        )}
        </div>{/* end outer flex col */}
        <AvisoRodape />
    </>
  );
}

// ══════════════════════════════════════════════════════
// MATRIX SELECTOR — Grelha estilo Google Forms (Mapeamento)
// ══════════════════════════════════════════════════════════════════
function MatrixSelector({ titulo, linhas, colunas, values, onChange }) {
  return (
    <div className="card" style={{marginBottom:10}}>
      <div className="card-t">{titulo}</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",fontSize:11,textAlign:"center",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th style={{padding:"7px 6px",textAlign:"left",minWidth:120,color:"#5a7a9a",fontWeight:600}}></th>
              {colunas.map(c=><th key={c} style={{padding:"7px 6px",color:"#b0c4d8",fontWeight:600,fontSize:10,minWidth:70}}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l,i)=>(
              <tr key={l} style={{borderTop:"1px solid #0d1828",background:i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
                <td style={{padding:"9px 6px",textAlign:"left",color:"#dde4f0",fontWeight:500,fontSize:11}}>{l}</td>
                {colunas.map(c=>(
                  <td key={c} style={{padding:"9px 6px"}}>
                    <input type="radio" style={{cursor:"pointer",accentColor:"#00c6b8",transform:"scale(1.2)"}}
                      name={titulo+"-"+l} checked={values[l]===c} onChange={()=>onChange(l,c)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// GERADOR DE RELATÓRIO FIEL AO PROTOCOLO
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// PROTOCOLO DE CURA — gerado automaticamente por escudo + pontos
// (4 fases, fiel ao método; editável pelo terapeuta)
// ══════════════════════════════════════════════════════════════════
const MEDITACAO_ESCUDO = {
  "PERDA": "Visualize um lugar seguro e acolhedor, onde todas as suas experiências passadas são honradas e reconhecidas.",
  "DESVALORIZAÇÃO": "Visualize um escudo de luz dourada a envolvê-lo. Este escudo representa a sua autoestima inabalável e o seu valor eterno.",
  "SOBREVIVÊNCIA": "Visualize-se a construir um escudo de estabilidade e confiança a partir dos seus pés, subindo até ao coração. Este escudo é feito de paz e recursos infinitos.",
  "DESPROTEÇÃO": "Visualize-se envolvido por um escudo de luz prateada. Esta luz é a sua proteção divina e a sua confiança interior.",
  "IMPOTÊNCIA": "Visualize um escudo de fogo amarelo e vibrante no centro do seu ser (plexo solar). Este escudo representa o seu poder de escolha e a sua capacidade de ação.",
};
const AFIRM_PROTOCOLO_CURA = {
  "PERDA": {
    libertacao: "Eu libero todo sentimento de PERDA; falta; separação; abandono; insegurança; rejeição; insuficiência; apreensão; medo; incertezas, que estejam bloqueados no meu corpo. Eu libero todos os sentimentos negativos que não me ajudam a evoluir, fica em mim apenas o necessário para o meu aprendizado, o resto eu libero e solto em gratidão!",
    cura: "Eu comando que todas as memórias e emoções dolorosas ligadas a essa separação/perda sejam curadas e transformadas em aprendizado e crescimento. Eu comando que todas as áreas afetadas do meu ser recebam a energia curativa do amor universal.",
  },
  "DESVALORIZAÇÃO": {
    libertacao: "Eu libero todo sentimento de DESVALORIZAÇÃO; inferioridade; baixa estima; incompreensão; insegurança; rejeição; insuficiência; angústia; medo; incertezas, que estejam bloqueados no meu corpo. Eu libero todos os sentimentos negativos que não me ajudam a evoluir, fica em mim apenas o necessário para o meu aprendizado, o resto eu libero e solto em gratidão!",
    cura: "Eu comando que todas as experiências de desvalorização sejam transformadas em força e confiança. Eu comando que minha autoestima seja restaurada e reforçada. Que assim seja.",
  },
  "SOBREVIVÊNCIA": {
    libertacao: "Eu libero todo sentimento de SOBREVIVÊNCIA; escassez; sufoco; indignação; pressão, que estejam bloqueados no meu corpo. Eu libero todos os sentimentos negativos que não me ajudam a evoluir, fica em mim apenas o necessário para o meu aprendizado, o resto eu libero e solto em gratidão!",
    cura: "Eu comando que todos os medos e ansiedades relacionados à minha sobrevivência sejam liberados gentilmente agora. Eu comando que meu ser seja preenchido com confiança, segurança e força. Que assim seja.",
  },
  "DESPROTEÇÃO": {
    libertacao: "Eu libero todo sentimento de DESPROTEÇÃO; injustiça; insegurança; acusação; dúvida, que estejam bloqueados no meu corpo. Eu libero todos os sentimentos negativos que não me ajudam a evoluir, fica em mim apenas o necessário para o meu aprendizado, o resto eu libero e solto em gratidão!",
    cura: "Eu comando que todas as experiências de desproteção sejam transformadas em força interior e segurança. Eu comando que minha sensação de proteção e bem-estar sejam restauradas e reforçadas. Que assim seja.",
  },
  "IMPOTÊNCIA": {
    libertacao: "Eu libero todo sentimento de IMPOTÊNCIA; incapacidade; medo; insegurança; paralisia; pressão, que estejam bloqueados no meu corpo. Eu libero todos os sentimentos negativos que não me ajudam a evoluir, fica em mim apenas o necessário para o meu aprendizado, o resto eu libero e solto em gratidão!",
    cura: "Eu comando que todos os sentimentos de impotência e incapacidade sejam liberados gentilmente. Eu comando que o nosso ser seja preenchido com poder, motivação e autossuficiência. Que assim seja.",
  },
};

function gerarProtocoloCuraFases({ escudo, passagens }) {
  const esc = (escudo || "").toUpperCase();
  const med = MEDITACAO_ESCUDO[esc] || "Visualize um espaço de luz e segurança a envolver todo o seu ser.";
  const afir = AFIRM_PROTOCOLO_CURA[esc] || { libertacao: "", cura: "" };

  // Recolher todos os pontos detectados, separados por face
  const pontosFrente = [];
  const pontosCostas = [];
  (passagens || []).forEach(p => {
    const todos = [...(p.pv||[]), ...(p.pe||[]), ...(p.ss||[]), ...(p.sc||[]), ...(p.si||[])];
    todos.forEach(pt => {
      const entry = `${pt} (${p.lado})`;
      if (p.lado && p.lado.includes("COSTAS")) pontosCostas.push(entry);
      else pontosFrente.push(entry);
    });
  });

  const L = [];
  L.push(`PROTOCOLO DE CURA — PARA FAZER EM CASA`);
  L.push(`Escudo de trabalho: ${esc || "—"}`);
  L.push(``);
  L.push(`▸ FASE 1 — Preparação e Meditação Guiada`);
  L.push(`Bebe um copo de água. Coloca o áudio de tratamento enviado pelo terapeuta. Fecha os olhos, inspira profundamente e faz a visualização do teu escudo:`);
  L.push(`"${med}"`);
  L.push(``);
  L.push(`▸ FASE 2 — Sequência nos Pontos Detectados`);
  L.push(`Em cada ponto marcado, com uma mão de apoio fixa e a outra em pinça sobre o ponto:`);
  L.push(`  1. Rodar 3 vezes sobre o ponto`);
  L.push(`  2. Empurrar/deslizar 3 vezes`);
  L.push(`  3. Bater 3 vezes sobre o ponto`);
  if (pontosFrente.length) {
    L.push(``);
    L.push(`PONTOS NA FRENTE (mão de apoio na fronte/testa):`);
    pontosFrente.forEach(p => L.push(`  • ${p}`));
  }
  if (pontosCostas.length) {
    L.push(``);
    L.push(`PONTOS NAS COSTAS:`);
    L.push(`  - Pontos do sistema superior: apoio na nuca (osso mais saliente), um de cada vez`);
    L.push(`  - Pontos do sistema central: apoio atrás no pescoço (osso saliente), um de cada vez`);
    L.push(`  - Pontos do sistema inferior: no local exacto de cada perna`);
    pontosCostas.forEach(p => L.push(`  • ${p}`));
  }
  L.push(``);
  L.push(`▸ FASE 3 — Auto-Abraço e Afirmações de Cura`);
  L.push(`Respira fundo, dá um auto-abraço e repete:`);
  if (afir.libertacao) { L.push(`LIBERTAÇÃO:`); L.push(`"${afir.libertacao}"`); }
  if (afir.cura)       { L.push(``); L.push(`CURA:`); L.push(`"${afir.cura}"`); }
  L.push(``);
  L.push(`▸ FASE 4 — Ativação e Selamento`);
  L.push(`Bate no peito esquerdo 3 vezes para cada frase:`);
  L.push(`  "Está feito" (bater 3x)`);
  L.push(`  "Está feito" (bater 3x)`);
  L.push(`  "Está feito" (bater 3x)`);
  L.push(`  "Está selado" (bater 3x)`);
  return L.join("\n");
}

function gerarRelatorioFiel(tipo, dados, pacienteNome) {
  const data = new Date().toLocaleDateString("pt-PT");
  const linhas = [];
  linhas.push(`RELATÓRIO DE ATENDIMENTO TERAPÊUTICO`);
  linhas.push(`Paciente: ${pacienteNome || "—"}  |  Data: ${data}  |  Tipo: ${tipo}`);
  linhas.push(`${"─".repeat(55)}`);

  if (tipo === "1º Atendimento") {
    if (dados.queixa)    linhas.push(`\nQUEIXA PRINCIPAL\n${dados.queixa}`);
    if (dados.historico) linhas.push(`\nHISTÓRICO EMOCIONAL\n${dados.historico}`);
    linhas.push(`\nPERGUNTAS DE APROFUNDAMENTO`);
    if (dados.p1) linhas.push(`1. Quem é você hoje?\n   → ${dados.p1}`);
    if (dados.p2) linhas.push(`2. 3 maiores traumas vivenciados:\n   → ${dados.p2}`);
    if (dados.p3) linhas.push(`3. O que trouxe à consulta:\n   → ${dados.p3}`);
    if (dados.p4) linhas.push(`4. Crises por semana: ${dados.p4}`);
    if (dados.p5) linhas.push(`5. Sintomas físicos e emocionais:\n   → ${dados.p5}`);
    if (dados.reflexoes) linhas.push(`\nPERCEPÇÕES DO TERAPEUTA\n${dados.reflexoes}`);
    if (dados.exercicio)  linhas.push(`\nEXERCÍCIO DIÁRIO SUGERIDO\n${dados.exercicio}`);
    if (dados.passos?.length) linhas.push(`\nTÉCNICAS INDICADAS\n${dados.passos.map(p=>`• ${p}`).join("\n")}`);
  }

  if (tipo === "Avaliação Energética Vital") {
    const { ficha, modo, face, cab, passagens, escudo, escudoLado, quando, notas } = dados;
    linhas.push(`\nCONSULTA DE MAPEAMENTO${ficha ? " — " + ficha : ""}`);
    if (cab?.consultaNum) linhas.push(`Consulta Nº: ${cab.consultaNum}`);
    if (cab?.dataAval)  linhas.push(`Data da Consulta: ${cab.dataAval}`);
    if (cab?.dataNasc)  linhas.push(`Data de Nascimento: ${cab.dataNasc}`);
    if (cab?.medicacao) linhas.push(`Medicação: ${cab.medicacao}`);

    // Mapeamento por lados
    (passagens || []).forEach(p => {
      linhas.push(`\n${"·".repeat(40)}`);
      linhas.push(`LADO MAPEADO: ${p.lado}`);
      if (p.pv?.length) linhas.push(`  Pontos Vitais: ${p.pv.join(", ")}`);
      if (p.pe?.length) linhas.push(`  Pontos de Entrada: ${p.pe.join(", ")}`);
      if (p.zona)       linhas.push(`  Zona/Localização: ${p.zona}`);
      if (p.ss?.length) linhas.push(`  Sistema Superior: ${p.ss.join(", ")}`);
      if (p.sc?.length) linhas.push(`  Sistema Central: ${p.sc.join(", ")}`);
      if (p.si?.length) linhas.push(`  Sistema Inferior: ${p.si.join(", ")}`);
    });

    // Enriquecimento: significado dos pontos de sistema selecionados (biblioteca editável, match estrito)
    const _n = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\(.*?\)/g,"").replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim();
    const selSist = [];
    (passagens || []).forEach(p => ["ss","sc","si"].forEach(k => (p[k] || []).forEach(v => selSist.push(v))));
    const PM = pontosComOverride();
    const descs = [];
    [...new Set(selSist)].forEach(lbl => {
      const nl = _n(lbl);
      if (!nl) return;
      const matches = PM.filter(pt => {
        const np = _n(pt.nome);
        if (!np) return false;
        if (np === nl) return true;
        if (np.startsWith(nl + " ") || nl.startsWith(np + " ")) return true;
        const w1 = np.split(" ")[0], w2 = nl.split(" ")[0];
        return w1 === w2 && w2.length > 3;
      });
      if (matches.length === 1) {
        const pt = matches[0];
        const txt = pt.aspectos || pt.funcao;
        if (txt) descs.push(`  • ${lbl}: ${txt}`);
      }
    });
    if (descs.length) linhas.push(`\nSIGNIFICADO DOS PONTOS (sistema)\n${descs.join("\n")}`);


    const q = [];
    if (quando?.trans)    q.push("TRANSGERACIONAL");
    if (quando?.gestacao) q.push("NA GESTAÇÃO");
    if (quando?.apos)     q.push("APÓS GESTAÇÃO");
    if (q.length || quando?.texto) linhas.push(`\nQUANDO (IDADE)\n  ${q.join(" · ")}${quando?.texto ? `\n  Quando/Idade: ${quando.texto}` : ""}`);

    // CORRELAÇÃO PROFUNDA (fiel à Devolutiva de Alto Impacto)
    const ESC_SENTIDO = {
      "DESPROTEÇÃO": "falta de segurança para existir e ocupar o próprio lugar",
      "DESVALORIZAÇÃO": "memória de não ser suficiente, não merecer ou não ter valor",
      "IMPOTÊNCIA": "bloqueio da acção — queria agir, mas não pôde",
      "SOBREVIVÊNCIA": "estado de alerta permanente — preciso resistir para continuar",
      "PERDA": "algo ou alguém se foi e uma parte ficou presa nesse momento",
    };
    const lado = escudoLado || (passagens?.[passagens.length-1]?.lado || "");
    const direcao = lado.includes("Esq") ? "padrão contentor (lógica, bloqueio)" : lado.includes("Drt") ? "padrão emocional (sensibilidade, profundidade)" : "";
    if (escudo || direcao) {
      linhas.push(`\nCORRELAÇÃO (Critério + Contexto + Zona + Tempo)`);
      if (escudo && ESC_SENTIDO[escudo]) linhas.push(`  Contexto ${escudo}: ${ESC_SENTIDO[escudo]}.`);
      if (direcao) linhas.push(`  Padrão (${lado}): ${direcao}.`);
      if (quando?.texto) linhas.push(`  Tempo do conflito: ${quando.texto}.`);
    }

    if (notas) linhas.push(`\nDEVOLUTIVA\n${notas}`);
    if (dados.protocolo) linhas.push(`\n${dados.protocolo}`);
  }

  if (tipo === "Atendimento Estruturado — Caminhos") {
    if (dados.p1) linhas.push(`\nPERGUNTAS DO PODER\n1. Quem é você hoje? → ${dados.p1}`);
    if (dados.p3) linhas.push(`2. 3 piores momentos → ${dados.p3}`);
    if (dados.p6) linhas.push(`3. Foco da consulta → ${dados.p6}`);
    if (dados.p4) linhas.push(`4. Crises por semana: ${dados.p4}`);
    if (dados.p5) linhas.push(`5. Sintomas: ${dados.p5}`);
    if (dados.p2) linhas.push(`Já passou por isto antes? → ${dados.p2}`);
    if (dados.caminho === 1 && dados.escudos) {
      linhas.push(`\nCAMINHO 1 — MENTE CONSCIENTE (Escudos)`);
      Object.entries(dados.escudos).forEach(([e,v])=>{ if(v) linhas.push(`  ${e}: ${v}/10`); });
      const dom = Object.entries(dados.escudos||{}).sort((a,b)=>Number(b[1])-Number(a[1]))[0];
      if (dom?.[0]) linhas.push(`  → Escudo dominante: ${dom[0]} (${dom[1]}/10)`);
    }
    if (dados.caminho === 3 && dados.estressores) {
      linhas.push(`\nCAMINHO 3 — ESTRESSORES ATIVOS`);
      if (dados.estressores.q1) linhas.push(`  Quem estressa: ${dados.estressores.q1}`);
      if (dados.estressores.q2) linhas.push(`  O que desestabiliza: ${dados.estressores.q2}`);
      if (dados.estressores.q3) linhas.push(`  Situações que tiram o foco: ${dados.estressores.q3}`);
      if (dados.estressores.q4) linhas.push(`  Padrão do passado: ${dados.estressores.q4}`);
      if (dados.estressores.q5) linhas.push(`  Em comum: ${dados.estressores.q5}`);
    }
    if (dados.protocolo) linhas.push(`\nPROTOCOLO DE CURA — TRABALHO EM CASA\n${dados.protocolo}`);
    if (dados.monit_crises) linhas.push(`\nMONITORIZAÇÃO\nCrises: ${dados.monit_crises}${dados.monit_mudancas?` · O que mudou: ${dados.monit_mudancas}`:""}`);
  }

  // ─── SECÇÃO PARA O PACIENTE ────────────────────────────────────────
  // Gerada automaticamente a partir dos pontos identificados
  // ─────────────────────────────────────────────────────────────────
  if (tipo === "Avaliação Energética Vital") {
    const { escudo, passagens } = dados;
    const escData = escudo ? ESCUDOS.find(e => e.nome.toUpperCase() === escudo || e.id === escudo?.toLowerCase()) : null;

    linhas.push(`\n${"═".repeat(55)}`);
    linhas.push(`DEVOLUTIVA PARA O PACIENTE`);
    linhas.push(`${"═".repeat(55)}`);

    if (escData) {
      linhas.push(`\n🔍 O QUE FOI IDENTIFICADO`);
      linhas.push(`O padrão emocional predominante identificado na tua avaliação é:`);
      linhas.push(`"${escData.nome.toUpperCase()}" — ${escData.sentenca}`);
      linhas.push(`\n${escData.devolutiva}`);
      linhas.push(`\nEste padrão reflecte-se habitualmente em: ${escData.corpo}`);

      linhas.push(`\n💬 PERGUNTAS PARA TOMADA DE CONSCIÊNCIA`);
      linhas.push(`Reserva uns minutos para reflectir sobre estas perguntas:`);

      const PERGUNTAS_POR_ESCUDO = {
        desvalorizacao: [
          "Em que situações da tua vida te sentes mais insuficiente ou menos capaz?",
          "Existe uma voz interior que frequentemente te critica? O que é que ela costuma dizer?",
          "Que conquistas tuas, por menores que pareçam, podes reconhecer hoje?",
          "Quando é que esta sensação de 'não ser suficiente' começou? Há alguém que a tenhas associado?",
          "O que mudaria na tua vida se te acreditasses capaz e digno(a) de amor?"
        ],
        desprotecao: [
          "Em que momentos da tua vida te sentiste mais vulnerável e sem apoio?",
          "Há alguém em quem confias completamente? O que essa confiança representa para ti?",
          "Que situações do teu passado te ensinaram que o mundo era um lugar perigoso?",
          "Como seria a tua vida se te sentisses genuinamente seguro(a) e protegido(a)?",
          "Que passo pequeno podes dar hoje para te sentires mais apoiado(a)?"
        ],
        sobrevivencia: [
          "Há quanto tempo vives em modo de alerta? O que inicialmente te colocou neste estado?",
          "O que é que sentes quando tudo parece estar fora do teu controlo?",
          "Recorda um momento em que te sentiste verdadeiramente seguro(a). Como era?",
          "O que precisas para permitir-te descansar, mesmo que por um momento?",
          "Que crença sobre o futuro te impede de relaxar no presente?"
        ],
        impotencia: [
          "Recorda uma situação em que quiseste agir, mas algo te impediu. O que sentiste?",
          "Que decisões tens adiado por sentires que não vais conseguir?",
          "Que pequena acção, por mínima que seja, podes tomar amanhã?",
          "Quem ou o quê acreditas ter mais poder sobre a tua vida do que tu próprio(a)?",
          "Se soubesses que não podias falhar, que escolha farias agora mesmo?"
        ],
        perda: [
          "Que perda ainda carregas e que ainda não foi verdadeiramente chorada ou integrada?",
          "Como te relacionas com as despedidas? Costumas afastar-te antes ou apegar-te em excesso?",
          "Existe algo que perdeste e que nunca te permitiste lamentar plenamente?",
          "Que parte de ti 'ficou presa' num momento do passado? O que essa parte precisa de ouvir?",
          "O que precisas de deixar ir para te sentires mais livre?"
        ]
      };

      const escKey = escData?.id || "";
      const pergs = PERGUNTAS_POR_ESCUDO[escKey] || [];
      pergs.forEach((p, i) => linhas.push(`  ${i+1}. ${p}`));
    }

    linhas.push(`\n🌱 SUGESTÃO DE FOCO PARA ESTA SEMANA`);
    if (escData) {
      const FOCO_POR_ESCUDO = {
        desvalorizacao: "Escreve diariamente 3 coisas que fizeste bem nesse dia, por mais pequenas que sejam. Sem julgamento, apenas observação.",
        desprotecao: "Identifica uma pessoa de confiança e partilha algo genuíno contigo esta semana. Pratica receber apoio.",
        sobrevivencia: "Reserva 10 minutos por dia em silêncio ou com música suave. Observa o que acontece quando paras.",
        impotencia: "Escolhe uma micro-acção — algo que possas fazer em 5 minutos — e fá-la. Regista como te sentiste depois.",
        perda: "Permite-te recordar algo que perdeste com carinho, sem tentar suprimir o que sentes. A integração começa com presença."
      };
      linhas.push(FOCO_POR_ESCUDO[escData.id] || "");
    }
  }

  linhas.push(`\n${dados.protocolo && tipo === "Avaliação Energética Vital" ? "" : ""}`);
  linhas.push(`${"─".repeat(55)}`);
  linhas.push(`AVISO ÉTICO: Esta avaliação revela hipóteses emocionais e padrões corporais. Não substitui avaliação médica nem fecha diagnóstico. A responsabilidade terapêutica é exclusivamente do profissional que realiza o atendimento.`);
  return linhas.join("\n");
}

// ══════════════════════════════════════════════════════════════════
// PDF + WHATSAPP — enviar relatório
// ══════════════════════════════════════════════════════════════════
function EnviarRelatorio({ texto, paciente, onFechar, onGerarProtocolo }) {
  const [copiado, setCopiado] = useState(false);
  const [aba, setAba] = useState("relatorio"); // relatorio | protocolo
  const copiar = () => { navigator.clipboard?.writeText(texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000); };
  const copiarWA = () => {
    const num = paciente?.telefone?.replace(/[^0-9]/g,"");
    if (!num) { copiar(); return; }
    navigator.clipboard?.writeText(texto);
    setTimeout(() => window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto.substring(0,1000)+"...")}`, "_blank"), 300);
  };
  const pdf = () => {
    abrirPDFProfissional({
      titulo: "Relatório de Atendimento Terapêutico",
      paciente,
      texto,
      logo: null,
      nomePratica: null,
    });
  };;
  const whatsapp = () => {
    const num = (paciente?.telefone||"").replace(/[^0-9]/g,"");
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(texto.substring(0,1500))}`
      : `https://wa.me/?text=${encodeURIComponent(texto.substring(0,1500))}`;
    window.open(url,"_blank");
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0a0e18",border:"1px solid #1a3a5c",borderRadius:12,width:"100%",maxWidth:560,maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #0d1828",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,color:"#00c6b8",fontSize:14}}>📄 Relatório Gerado</div>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onFechar}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
          <pre style={{whiteSpace:"pre-wrap",fontSize:10,color:"#7a9ab8",fontFamily:"monospace",lineHeight:1.7}}>{texto}</pre>
        </div>
        <div style={{padding:"14px 20px",borderTop:"1px solid #0d1828",display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-p" style={{flex:1}} onClick={pdf}>🖨️ PDF / Imprimir</button>
          <button className="btn btn-sm" style={{flex:1,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={whatsapp}>WhatsApp</button>
          <button className="btn btn-s btn-sm" style={{flex:1}} onClick={copiar}>{copiado?"✓ Copiado":"📋 Copiar"}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FORMULÁRIO A — 1º ATENDIMENTO (Consulta Única)
// Segue exactamente o protocolo: Acolhimento → Dados → 6 Perguntas → Indicação
// ══════════════════════════════════════════════════════════════════
function FormPrimeiroAtendimento({ paciente, user, onGuardar, onVoltar }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    estado:"", queixa:"", historico:"",
    p1:"", p2:"", p3:"", p4:"", p5:"",
    reflexoes:"", exercicio:"", passos:[], protocolo:"", notas:""
  });
  const [guardado, setGuardado] = useState(false);
  const [load, setLoad] = useState(false);
  const set = (k,v) => setForm(d=>({...d,[k]:v}));
  const togglePasso = p => set("passos", form.passos.includes(p) ? form.passos.filter(x=>x!==p) : [...form.passos,p]);

  const handleGuardar = async () => {
    setLoad(true);
    await onGuardar("1º Atendimento", form);
    setLoad(false);
    setGuardado(true);
  };

  const PASSOS_FORM = [
    // Step 0: Acolhimento
    <div key={0}>
      <div style={{background:"linear-gradient(135deg,#061428,#0a1e2e)",border:"1px solid #1a3a5c",borderRadius:10,padding:"16px 18px",marginBottom:12,textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:6}}>💙</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#dde4f0",marginBottom:6}}>Início e Acolhimento</div>
        <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.7}}>
          Observa como o paciente chega. Escuta além das palavras.<br/>
          <em>"Você está seguro aqui. Vamos juntos olhar para o que precisa ser ouvido."</em>
        </div>
      </div>
      <div className="card">
        <div className="card-t">Estado emocional predominante</div>
        {[["ansioso","😰 Ansioso(a)","Caminhos rápidos e práticos · respiração, autocuidado, micro-acções"],["depressivo","😔 Depressivo(a)","Acolhimento e leveza · micro metas, segurança emocional"]].map(([k,l,h])=>(
          <div key={k} onClick={()=>set("estado",k)} style={{cursor:"pointer",padding:"12px 14px",marginBottom:7,borderRadius:8,border:`2px solid ${form.estado===k?"#00c6b8":"#0d1828"}`,background:form.estado===k?"#0d2535":"#050810",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:22}}>{l.split(" ")[0]}</span>
            <div><div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{l.split(" ").slice(1).join(" ")}</div><div style={{fontSize:10,color:"#3d5a7a",marginTop:2}}>{h}</div></div>
          </div>
        ))}
        {form.estado && <div style={{padding:"9px 12px",background:"rgba(0,198,184,.06)",border:"1px solid rgba(0,198,184,.2)",borderRadius:7,fontSize:10,color:"#5ae0d8"}}>
          {form.estado==="ansioso"?"⚡ Foco: acções simples e imediatas. Respiração, rotina, autocuidado.":"💙 Foco: acolhimento e leveza. Micro metas e devolve a sensação de que é possível continuar."}
        </div>}
      </div>
    </div>,

    // Step 1: Recolha de dados + queixa
    <div key={1}>
      <div className="card">
        <div className="card-t">Recolha de Dados Pessoais</div>
        <div className="al al-i" style={{fontSize:10,marginBottom:10}}>Preenche os dados que ainda não constam na ficha.</div>
        <div className="g2">
          <div><span className="lbl">Nome completo</span><input className="inp" value={paciente?.nome||""} readOnly style={{opacity:.7}} /></div>
          <div><span className="lbl">Profissão</span><input className="inp" value={form.profissao||""} onChange={e=>set("profissao",e.target.value)} /></div>
        </div>
        <div className="g2">
          <div><span className="lbl">Medicação em uso</span><input className="inp" value={paciente?.medicacao||form.medicacao||""} onChange={e=>set("medicacao",e.target.value)} /></div>
          <div><span className="lbl">Quadro clínico actual</span><input className="inp" value={form.quadro||""} onChange={e=>set("quadro",e.target.value)} /></div>
        </div>
        <span className="lbl">Queixa principal</span>
        <textarea className="inp" rows={3} value={form.queixa} onChange={e=>set("queixa",e.target.value)} placeholder="O que traz o paciente à consulta hoje..." />
        <span className="lbl">Histórico de vida e emoções marcantes</span>
        <textarea className="inp" rows={3} value={form.historico} onChange={e=>set("historico",e.target.value)} placeholder="Contexto emocional relevante..." />
      </div>
    </div>,

    // Step 2: 6 Perguntas do Poder
    <div key={2}>
      <div className="card">
        <div className="card-t">6 Perguntas do Poder</div>
        <div className="al al-i" style={{fontSize:10,marginBottom:10}}>Faz com presença e escuta activa. Estas perguntas abrem o campo para que o paciente se conecte com a sua própria história.</div>
        {[
          ["p1","1. Quem é você hoje?"],
          ["p2","2. Você já passou por isso antes?"],
          ["p3","3. Quais foram os 3 piores momentos da sua vida?"],
          ["p4","4. Quantas crises por semana tem?"],
          ["p5","5. Quais os sintomas principais (físicos e emocionais)?"],
          ["p6","6. O que gostaria que fosse o foco da consulta hoje?"],
        ].map(([k,q])=>(
          <div key={k} style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#00c6b8",fontWeight:600,marginBottom:4}}>{q}</div>
            <textarea className="inp" rows={2} value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder="Resposta do paciente..." />
          </div>
        ))}
      </div>
    </div>,

    // Step 3: Indicação + Protocolo
    <div key={3}>
      <div className="card">
        <div className="card-t">Indicação Terapêutica e Próximos Passos</div>
        <div className="g2">
          <div><span className="lbl">Percepções do terapeuta</span><textarea className="inp" rows={3} value={form.reflexoes} onChange={e=>set("reflexoes",e.target.value)} placeholder="Observações, correlações, insights..." /></div>
          <div><span className="lbl">Exercício diário sugerido</span><textarea className="inp" rows={3} value={form.exercicio} onChange={e=>set("exercicio",e.target.value)} placeholder="Prática diária recomendada..." /></div>
        </div>
        <span className="lbl" style={{marginTop:10,display:"block"}}>Técnicas a trabalhar</span>
        <div className="chips" style={{marginBottom:12}}>
          {["Audioterapia Frequencial","Libertação consciente","Memória celular","Ressignificação","Respiração","Meditação","Alimentação consciente"].map(p=>(
            <div key={p} className={`chip ${form.passos.includes(p)?"on":""}`} onClick={()=>togglePasso(p)}>{p}</div>
          ))}
        </div>
        <span className="lbl">Protocolo de cura — para trabalhar em casa</span>
        <textarea className="inp" rows={4} value={form.protocolo} onChange={e=>set("protocolo",e.target.value)} placeholder="Áudio recomendado · Duração · Alimentação · Práticas diárias · Frequência..." />
        <span className="lbl" style={{marginTop:8,display:"block"}}>Notas adicionais</span>
        <textarea className="inp" rows={2} value={form.notas} onChange={e=>set("notas",e.target.value)} />
      </div>
    </div>
  ];

  const STEP_LABELS = ["Acolhimento","Dados","6 Perguntas","Protocolo"];

  if (guardado) return (
    <div className="card fade" style={{textAlign:"center",padding:"30px 20px"}}>
      <div style={{fontSize:40,marginBottom:10}}>✅</div>
      <div style={{fontSize:16,fontWeight:700,color:"#b0c4d8",marginBottom:6}}>Consulta guardada na ficha!</div>
      <div style={{fontSize:11,color:"#3d5a7a",marginBottom:16}}>1º Atendimento de {paciente?.nome||"paciente"}</div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn btn-p" onClick={()=>{setStep(0);setForm({estado:"",queixa:"",historico:"",p1:"",p2:"",p3:"",p4:"",p5:"",reflexoes:"",exercicio:"",passos:[],protocolo:"",notas:""});setGuardado(false);}}>Nova Consulta</button>
        <button className="btn btn-s" onClick={onVoltar}>← Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="fade">
      {/* Barra de progresso */}
      <div className="card" style={{paddingBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>step>0?setStep(s=>s-1):onVoltar()}>←</button>
          <div style={{fontSize:11,color:"#5a7a9a",textAlign:"center"}}>
            <strong style={{color:"#b0c4d8"}}>1º Atendimento</strong><br/>
            <span style={{fontSize:9}}>{STEP_LABELS[step]} · {step+1}/{STEP_LABELS.length}</span>
          </div>
          <div style={{fontSize:10,color:"#00c6b8",maxWidth:80,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{paciente?.nome||""}</div>
        </div>
        <div style={{height:3,background:"#1a2a3a",borderRadius:2}}>
          <div style={{height:3,background:"#00c6b8",borderRadius:2,width:`${((step+1)/STEP_LABELS.length)*100}%`,transition:"width .3s"}} />
        </div>
      </div>

      {PASSOS_FORM[step]}

      <div style={{display:"flex",gap:8,marginTop:4}}>
        {step>0 && <button className="btn btn-s" style={{flex:1}} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
        {step < STEP_LABELS.length-1
          ? <button className="btn btn-p" style={{flex:2}} onClick={()=>setStep(s=>s+1)}>Próximo: {STEP_LABELS[step+1]} →</button>
          : <button className="btn btn-p" style={{flex:2}} onClick={handleGuardar} disabled={load}>{load?"A guardar...":"💾 Gerar Relatório e Guardar"}</button>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FORMULÁRIO B — MAPEAMENTO ENERGÉTICO VITAL (Grelha)
// Segue exactamente os 8 passos do protocolo de mapeamento
// ══════════════════════════════════════════════════════════════════
function FormMapeamentoGrelha({ paciente, user, onGuardar, onVoltar }) {
  const PONTOS_VITAIS = ["COROA (topo da cabeça)","GARGANTA","CORAÇÃO","PLEXO (boca/estômago)","PLEXO SOLAR","ESPLÉNICO","RAIZ"];
  // 13 pontos de entrada conforme ficha de mapeamento original
  const PONTOS_ENTRADA = [
    "COROA (Topo da cabeça)",
    "OMBRO (Direito)",
    "OMBRO (Esquerdo)",
    "COSTELAS (Direitas)",
    "COSTELAS (Esquerdas)",
    "MÃO (Direita)",
    "MÃO (Esquerda)",
    "COXA / ANCA (Direita)",
    "COXA / ANCA (Esquerda)",
    "JOELHO (Direito)",
    "JOELHO (Esquerdo)",
    "PÉ (Direito)",
    "PÉ (Esquerdo)",
  ];
  const SIST_SUP = ["EPÍFISE","HIPOTÁLAMO","HIPÓFISE","AMÍGDALAS","PARATIROIDE","TIMO","GLÂNDULAS SALIVARES E LACRIMAIS","TIREOIDE","ESÓFAGO"];
  const SIST_CEN = ["VASO LINFÁTICO, artérias e veias","INTESTINO GROSSO","CORAÇÃO","BRÔNQUIOS","ALVÉOLOS PULMONARES","INTESTINO DELGADO","BAÇO","FÍGADO","ESTÔMAGO","DUODENO","VESÍCULA BILIAR","PÂNCREAS"];
  const SIST_INF = ["GLÂNDULAS MAMÁRIAS","ÚTERO, PRÓSTATA","SUPRARRENAIS","TESTÍCULOS, OVÁRIOS","RINS","BEXIGA"];
  const ESCUDOS_L = ["DESPROTEÇÃO","DESVALORIZAÇÃO","SOBREVIVÊNCIA","PERDA","IMPOTÊNCIA"];

  // Tipos de ficha (baseados nas fichas em papel)
  const TIPOS_FICHA = [
    { id: "aval_frente", nome: "Avaliação — Frente", face: "FRENTE", modo: "Avaliação" },
    { id: "aval_costas", nome: "Avaliação — Costas", face: "COSTAS", modo: "Avaliação" },
    { id: "trat_frente", nome: "Tratamento — Frente", face: "FRENTE", modo: "Tratamento" },
    { id: "trat_costas", nome: "Tratamento — Costas", face: "COSTAS", modo: "Tratamento" },
  ];

  const [etapa, setEtapa] = useState("ficha"); // ficha → cab → lado → mapear → final
  const [ficha, setFicha] = useState(null);     // tipo de ficha escolhido
  const [cab, setCab] = useState({
    dataAval: new Date().toISOString().split("T")[0],
    dataNasc: paciente?.data_nasc || "",
    medicacao: paciente?.medicacao || "",
    consultaNum: "",
  });
  const [passagens, setPassagens] = useState([]); // cada lado mapeado
  const [atual, setAtual] = useState(null);
  const [escudo, setEscudo] = useState("");
  const [quando, setQuando] = useState({ trans:false, gestacao:false, apos:false, texto:"" });
  const [notas, setNotas] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [load, setLoad] = useState(false);
  const [relatorio, setRelatorio] = useState("");

  // Lados disponíveis dependem da face escolhida na ficha
  const ladosBase = ficha ? [`${ficha.face} · DIREITA`, `${ficha.face} · ESQUERDA`] : [];
  const ladosFeitos = passagens.map(p => p.lado);
  const ladosDisponiveis = ladosBase.filter(l => !ladosFeitos.includes(l));

  const iniciarLado = (lado) => {
    setAtual({ lado, pv: [], pe: [], zona: "", ss: [], sc: [], si: [] });
    setEtapa("mapear");
  };
  const toggle = (campo, item) => setAtual(a => ({
    ...a, [campo]: a[campo].includes(item) ? a[campo].filter(x => x !== item) : [...a[campo], item]
  }));
  const terminarMapeamento = () => { setPassagens(p => [...p, atual]); setAtual(null); setEtapa("final"); };
  const mapearOutroLado = () => { setPassagens(p => [...p, atual]); setAtual(null); setEtapa("lado"); };

  const handleGuardar = async () => {
    if (!escudo) { alert("Selecciona o ESCUDO MAIS ATIVO — é obrigatório."); return; }
    if (!quando.texto.trim() && !quando.trans && !quando.gestacao && !quando.apos) { alert("Preenche o QUANDO / IDADE — é obrigatório."); return; }
    const ultimoLado = passagens[passagens.length-1]?.lado || "";
    const dados = { ficha: ficha?.nome, modo: ficha?.modo, face: ficha?.face, cab, passagens, escudo, escudoLado: ultimoLado, quando, notas, protocolo };
    const txt = gerarRelatorioFiel("Avaliação Energética Vital", dados, paciente?.nome);
    setRelatorio(txt);
    setLoad(true);
    await onGuardar("Avaliação Energética Vital", dados);
    setLoad(false);
    setGuardado(true);
  };

  const ChipGroup = ({ titulo, hint, lista, campo }) => (
    <div className="card" style={{marginBottom:10}}>
      <div className="card-t">{titulo}</div>
      {hint && <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8,lineHeight:1.5}}>{hint}</div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {lista.map(item => (
          <button key={item} className={`chip ${atual[campo].includes(item) ? "on" : ""}`}
            onClick={() => toggle(campo, item)} style={{fontSize:10,padding:"7px 12px"}}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  if (guardado) return (
    <div className="fade">
      <EnviarRelatorio texto={relatorio} paciente={paciente} onFechar={onVoltar} />
      <div className="card" style={{textAlign:"center",padding:"24px 20px"}}>
        <div style={{fontSize:36,marginBottom:8}}>✅</div>
        <div style={{fontSize:14,fontWeight:700,color:"#b0c4d8",marginBottom:4}}>Mapeamento guardado na ficha de {paciente?.nome}!</div>
        <div style={{fontSize:10,color:"#3d5a7a"}}>Consulta o histórico em Pacientes → Consultas → Ver relatório.</div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn btn-p" onClick={()=>{setFicha(null);setPassagens([]);setAtual(null);setEscudo("");setQuando({trans:false,gestacao:false,apos:false,texto:""});setNotas("");setProtocolo("");setGuardado(false);setRelatorio("");setEtapa("ficha");}}>Novo Mapeamento</button>
          <button className="btn btn-s" onClick={onVoltar}>← Voltar</button>
        </div>
      </div>
    </div>
  );

  /* ───── ETAPA 0: Escolher o tipo de ficha ───── */
  if (etapa === "ficha") return (
    <div className="fade">
      <div className="card">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>←</button>
          <strong style={{color:"#dde4f0",fontSize:13}}>Que tipo de ficha vais usar?</strong>
        </div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:12,lineHeight:1.6}}>
          Escolhe a ficha conforme o que vais fazer — Avaliação ou Tratamento, Frente ou Costas. O mapeamento segue a estrutura dessa ficha.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {TIPOS_FICHA.map(f => (
            <div key={f.id} onClick={()=>{setFicha(f);setEtapa("cab");}}
              style={{cursor:"pointer",padding:"16px 12px",borderRadius:10,border:"2px solid #0d1828",background:"#050810",textAlign:"center",transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#00c6b8"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#0d1828"}>
              <div style={{fontSize:22,marginBottom:6}}>{f.face==="FRENTE"?"🧍":"🚶"}</div>
              <div style={{fontWeight:700,fontSize:11,color:"#dde4f0"}}>{f.modo}</div>
              <div style={{fontSize:10,color:"#00c6b8",marginTop:2}}>{f.face}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ───── ETAPA 1: Cabeçalho ───── */
  if (etapa === "cab") return (
    <div className="fade">
      <div className="card">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>setEtapa("ficha")}>←</button>
          <strong style={{color:"#dde4f0",fontSize:13}}>{ficha?.nome}</strong>
        </div>
        <div className="lbl">PACIENTE: NOME BATISMO COMPLETO *</div>
        <input className="inp" value={paciente?.nome||""} readOnly style={{opacity:.75}} />
        <div className="g2">
          <div><div className="lbl">DATA DE NASCIMENTO *</div><input className="inp" type="date" value={cab.dataNasc} onChange={e=>setCab(c=>({...c,dataNasc:e.target.value}))} /></div>
          <div><div className="lbl">DATA DA CONSULTA *</div><input className="inp" type="date" value={cab.dataAval} onChange={e=>setCab(c=>({...c,dataAval:e.target.value}))} /></div>
        </div>
        <div className="g2">
          <div><div className="lbl">CONSULTA Nº</div><input className="inp" value={cab.consultaNum} onChange={e=>setCab(c=>({...c,consultaNum:e.target.value}))} placeholder="ex: 1, 2, 3..." /></div>
          <div></div>
        </div>
        <div className="lbl">MEDICAÇÃO (qual, dose, vezes/dia)</div>
        <textarea className="inp" rows={2} value={cab.medicacao} onChange={e=>setCab(c=>({...c,medicacao:e.target.value}))} placeholder="Ex: Sertralina 50mg, 1x/dia..." />
        <button className="btn btn-p" style={{marginTop:10}} onClick={()=>setEtapa("lado")}>Continuar → Escolher lado</button>
      </div>
    </div>
  );

  /* ───── ETAPA 2: Escolher lado (Direita/Esquerda da face escolhida) ───── */
  if (etapa === "lado") return (
    <div className="fade">
      <div className="card">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>passagens.length?setEtapa("final"):setEtapa("cab")}>←</button>
          <strong style={{color:"#dde4f0",fontSize:13}}>{passagens.length ? "Mapear outro lado" : `${ficha?.face} — por onde começas?`}</strong>
        </div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:12,lineHeight:1.6}}>
          Todos os pontos que travarem ficam guardados como sendo deste lado ({ficha?.face}).
        </div>
        {passagens.length > 0 && (
          <div style={{background:"rgba(0,198,184,.05)",border:"1px solid rgba(0,198,184,.15)",borderRadius:7,padding:"8px 12px",marginBottom:10,fontSize:10,color:"#5ae0d8"}}>
            ✔ Já mapeado: {ladosFeitos.join(" · ")}
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {ladosDisponiveis.map(l => (
            <div key={l} onClick={()=>iniciarLado(l)}
              style={{cursor:"pointer",padding:"18px 12px",borderRadius:10,border:"2px solid #0d1828",background:"#050810",textAlign:"center",transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#00c6b8"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#0d1828"}>
              <div style={{fontSize:22,marginBottom:6}}>{l.includes("DIREITA")?"➡️":"⬅️"}</div>
              <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{l.includes("DIREITA")?"DIREITA":"ESQUERDA"}</div>
              <div style={{fontSize:9,color:"#3d5a7a",marginTop:3}}>{l.includes("ESQUERDA")?"Trauma racionalizado":"Trauma emocionalizado"}</div>
            </div>
          ))}
        </div>
        {passagens.length > 0 && (
          <button className="btn btn-s" style={{marginTop:12}} onClick={()=>setEtapa("final")}>
            Não mapear mais → Avançar para o Escudo
          </button>
        )}
      </div>
    </div>
  );

  /* ───── ETAPA 3: Mapear o lado activo ───── */
  if (etapa === "mapear" && atual) return (
    <div className="fade">
      <div className="card" style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <strong style={{color:"#dde4f0",fontSize:13}}>🗺️ A mapear: <span style={{color:"#00c6b8"}}>{atual.lado}</span></strong>
          <span style={{fontSize:9,color:"#3d5a7a"}}>{paciente?.nome}</span>
        </div>
        <div style={{fontSize:10,color:"#5a7a9a",marginTop:4,lineHeight:1.5}}>
          Marca os pontos que travaram neste lado. Tudo fica associado a <strong style={{color:"#00c6b8"}}>{atual.lado}</strong>.
        </div>
      </div>

      <ChipGroup titulo={`1. CRITÉRIOS — ${atual.lado}`} hint="Selecciona os critérios observados. Marca os que se aplicam." lista={PONTOS_VITAIS} campo="pv" />
      <ChipGroup titulo={`2. PONTOS DE ENTRADA — ${atual.lado}`} hint="Zona onde o corpo conteve a reação." lista={PONTOS_ENTRADA} campo="pe" />

      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">3. ZONA/LOCALIZAÇÃO (onde foi detetado)</div>
        <input className="inp" value={atual.zona} onChange={e=>setAtual(a=>({...a,zona:e.target.value}))} placeholder="Zona onde travou ao deslizar..." />
      </div>

      <ChipGroup titulo={`4. SISTEMA SUPERIOR — ${atual.lado}`} lista={SIST_SUP} campo="ss" />
      <ChipGroup titulo={`5. SISTEMA CENTRAL — ${atual.lado}`} lista={SIST_CEN} campo="sc" />
      <ChipGroup titulo={`6. SISTEMA INFERIOR — ${atual.lado}`} lista={SIST_INF} campo="si" />

      <div style={{display:"flex",gap:8,flexDirection:"column"}}>
        <button className="btn btn-p" style={{padding:"12px 0"}} onClick={terminarMapeamento}>
          ✔ Terminar aqui → Avaliar Escudo
        </button>
        {ladosDisponiveis.filter(l=>l!==atual.lado).length > 0 && (
          <button className="btn btn-s" onClick={mapearOutroLado}>
            ➕ Guardar este lado e mapear o outro
          </button>
        )}
      </div>
    </div>
  );

  /* ───── ETAPA 4: Escudo + Quando + Devolutiva ───── */
  return (
    <div className="fade">
      <div className="card" style={{marginBottom:10}}>
        <strong style={{color:"#dde4f0",fontSize:13}}>Finalização — {ficha?.nome}</strong>
        <div style={{fontSize:10,color:"#5ae0d8",marginTop:6,padding:"7px 10px",background:"rgba(0,198,184,.05)",borderRadius:6}}>
          ✔ Lados mapeados: {ladosFeitos.join(" · ") || "—"}
        </div>
        {ladosDisponiveis.length > 0 && <button className="btn btn-s btn-sm" style={{width:"auto",marginTop:8}} onClick={()=>setEtapa("lado")}>➕ Mapear o outro lado</button>}
      </div>

      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">ESCUDO MAIS ATIVO *</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>
          Avaliado no último lado mapeado: <strong style={{color:"#00c6b8"}}>{passagens[passagens.length-1]?.lado || "—"}</strong>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {ESCUDOS_L.map(e => (
            <button key={e} className={`chip ${escudo===e?"on":""}`} onClick={()=>setEscudo(e)} style={{fontSize:11,padding:"9px 14px"}}>{e}</button>
          ))}
        </div>
      </div>

      {/* QUANDO — só aparece depois do escudo escolhido, fica sempre visível aqui */}
      <div className="card" style={{marginBottom:10, opacity: escudo ? 1 : 0.5}}>
        <div className="card-t">QUANDO (TEMPO / IDADE) *</div>
        {!escudo && <div style={{fontSize:10,color:"#f59e0b",marginBottom:8}}>↑ Escolhe primeiro o escudo acima.</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
          {[["trans","TRANSGERACIONAL"],["gestacao","NA GESTAÇÃO"],["apos","APÓS GESTAÇÃO"]].map(([k,l])=>(
            <button key={k} className={`chip ${quando[k]?"on":""}`} disabled={!escudo} onClick={()=>setQuando(q=>({...q,[k]:!q[k]}))}>{l}</button>
          ))}
        </div>
        <div className="lbl">ESCREVER — (QUANDO / IDADE) *</div>
        <input className="inp" disabled={!escudo} value={quando.texto} onChange={e=>setQuando(q=>({...q,texto:e.target.value}))} placeholder="Ex: 2 gerações · Gestação 3º mês · 7 anos..." />
      </div>

      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">DEVOLUTIVA AO PACIENTE</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:6}}>O que o corpo revelou — correlação ponto → escudo → história emocional.</div>
        <textarea className="inp" rows={3} value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Devolutiva com presença e sensibilidade..." />
      </div>

      {/* PROTOCOLO DE CURA — automático / editável / do zero */}
      <div className="card" style={{marginBottom:10, opacity: escudo ? 1 : 0.5}}>
        <div className="card-t">🏠 PROTOCOLO DE CURA — Trabalho em Casa</div>
        {!escudo && <div style={{fontSize:10,color:"#f59e0b",marginBottom:8}}>↑ Escolhe o escudo para gerar o protocolo automaticamente.</div>}
        <div style={{fontSize:10,color:"#5ae0d8",marginBottom:8,lineHeight:1.5}}>
          Gera as 4 fases automaticamente com base no escudo e nos pontos detectados. Podes editar ou escrever do zero.
        </div>
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          <button className="btn btn-p btn-sm" style={{width:"auto"}} disabled={!escudo}
            onClick={()=>setProtocolo(gerarProtocoloCuraFases({ escudo, passagens }))}>
            ⚡ Gerar automático (4 fases)
          </button>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>setProtocolo("")}>
            🗑️ Limpar / escrever do zero
          </button>
        </div>
        <textarea className="inp" rows={protocolo ? 14 : 4} value={protocolo}
          onChange={e=>setProtocolo(e.target.value)}
          placeholder="Clica em 'Gerar automático' ou escreve aqui o teu próprio protocolo de cura..."
          style={{fontFamily: protocolo ? "monospace" : "inherit", fontSize: protocolo ? 10 : 12}} />
      </div>

      <button className="btn btn-p" style={{padding:"12px 0",fontSize:13}} onClick={handleGuardar} disabled={load || passagens.length===0}>
        {load?"A guardar...":"💾 Gerar Relatório e Guardar na Ficha"}
      </button>
    </div>
  );
}

function FormAtendimentoEstruturado({ paciente, user, caminhoInit, tituloConsulta, onGuardar, onVoltar }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ p1:"",p2:"",p3:"",p4:"",p5:"",p6:"", caminho:caminhoInit||null, escudos:{}, estressores:{q1:"",q2:"",q3:"",q4:"",q5:""}, protocolo:"", monit_crises:"", monit_mudancas:"" });
  const [guardado, setGuardado] = useState(false);
  const [relatorio, setRelatorio] = useState("");
  const [load, setLoad] = useState(false);
  const set = (k,v) => setForm(d=>({...d,[k]:v}));

  const handleGuardar = async () => {
    const txt = gerarRelatorioFiel("Atendimento Estruturado — Caminhos", form, paciente?.nome);
    setRelatorio(txt);
    setLoad(true);
    await onGuardar("Atendimento Estruturado — Caminhos", form);
    setLoad(false);
    setGuardado(true);
  };

  const escDom = Object.entries(form.escudos||{}).filter(([,v])=>v).sort((a,b)=>Number(b[1])-Number(a[1]))[0];

  if (guardado) return (
    <div className="fade">
      <EnviarRelatorio texto={relatorio} paciente={paciente} onFechar={onVoltar} />
      <div className="card" style={{textAlign:"center",padding:"24px 20px"}}>
        <div style={{fontSize:36,marginBottom:8}}>✅</div>
        <div style={{fontSize:14,fontWeight:700,color:"#b0c4d8",marginBottom:4}}>Guardado na ficha!</div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn btn-p" onClick={()=>{setStep(0);setForm({p1:"",p2:"",p3:"",p4:"",p5:"",p6:"",caminho:null,escudos:{},estressores:{q1:"",q2:"",q3:"",q4:"",q5:""},protocolo:"",monit_crises:"",monit_mudancas:""});setGuardado(false);setRelatorio("");}}>Nova Sessão</button>
          <button className="btn btn-s" onClick={onVoltar}>← Voltar</button>
        </div>
      </div>
    </div>
  );

  const STEP_LABELS = ["Monitorização","6 Perguntas","Caminho","Protocolo"];

  return (
    <div className="fade">
      <div className="card" style={{paddingBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>step>0?setStep(s=>s-1):onVoltar()}>←</button>
          <div style={{fontSize:11,color:"#5a7a9a",textAlign:"center"}}>
            <strong style={{color:"#b0c4d8"}}>Atendimento Estruturado</strong><br/>
            <span style={{fontSize:9}}>{STEP_LABELS[step]} · {step+1}/{STEP_LABELS.length}</span>
          </div>
          <div style={{fontSize:10,color:"#00c6b8"}}>{paciente?.nome||""}</div>
        </div>
        <div style={{height:3,background:"#1a2a3a",borderRadius:2}}>
          <div style={{height:3,background:"#00c6b8",borderRadius:2,width:`${((step+1)/STEP_LABELS.length)*100}%`,transition:"width .3s"}} />
        </div>
      </div>

      {step===0 && <div className="card">
        <div className="card-t">Monitorização de Sintomas e Crises</div>
        <div className="al al-i" style={{fontSize:10,marginBottom:10}}>Em todas as consultas: como se sentiu desde o último encontro.</div>
        <span className="lbl">Quantas crises teve esta semana?</span>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {["Nenhuma","1-2","3-5","Mais de 5"].map(o=><button key={o} className={`chip ${form.monit_crises===o?"on":""}`} onClick={()=>set("monit_crises",o)}>{o}</button>)}
        </div>
        <span className="lbl">O que mudou desde a última sessão?</span>
        <textarea className="inp" rows={3} value={form.monit_mudancas} onChange={e=>set("monit_mudancas",e.target.value)} placeholder="Melhorias, permanências, novidades..." />
      </div>}

      {step===1 && <div className="card">
        <div className="card-t">6 Perguntas do Poder (Escuta Activa)</div>
        {[["p1","1. Quem é você hoje?"],["p2","2. Já passou por isto antes?"],["p3","3. 3 piores momentos da vida"],["p4","4. Crises por semana"],["p5","5. Sintomas principais"],["p6","6. Foco desta consulta"]].map(([k,q])=>(
          <div key={k} style={{marginBottom:9}}>
            <div style={{fontSize:11,color:"#00c6b8",fontWeight:600,marginBottom:3}}>{q}</div>
            <textarea className="inp" rows={2} value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder="Resposta do paciente..." />
          </div>
        ))}
      </div>}

      {step===2 && <div>
        <div className="card">
          <div className="card-t">Escolhe o Caminho Terapêutico</div>
          {[
            [1,"🧠 Caminho 1 — Mente Consciente","Pontuação dos Escudos (0-10). Ideal: 1ª consulta, pacientes que falam muito, quem ainda não conhece a técnica."],
            [2,"🗺️ Caminho 2 — Mente Subconsciente","Avaliação Energética Vital. Ideal: 2ª consulta, aceder à raiz profunda do sintoma."],
            [3,"🔥 Caminho 3 — Estressores Activos","Mapeamento de ciclos e gatilhos. Ideal: sessões de manutenção, sintomas recorrentes."],
          ].map(([n,l,d])=>(
            <div key={n} onClick={()=>set("caminho",n)} style={{cursor:"pointer",padding:"12px 14px",marginBottom:8,borderRadius:8,border:`2px solid ${form.caminho===n?"#00c6b8":"#0d1828"}`,background:form.caminho===n?"#0d2535":"#050810"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{l}</div>
              <div style={{fontSize:10,color:"#3d5a7a",marginTop:3,lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
        {form.caminho===1 && <div className="card">
          <div className="card-t">Pontuação dos Escudos (0 a 10)</div>
          <div style={{fontSize:10,color:"#5a7a9a",marginBottom:10}}>Apresenta os 5 escudos. O paciente pontua de 0 a 10 qual sente mais presente.</div>
          <div className="g2">
            {["Desproteção","Desvalorização","Impotência","Sobrevivência","Perda"].map(e=>(
              <div key={e}>
                <span className="lbl">{e}</span>
                <input className="inp" type="number" min="0" max="10" placeholder="0 a 10" value={form.escudos[e]||""} onChange={ev=>set("escudos",{...form.escudos,[e]:ev.target.value})} />
              </div>
            ))}
          </div>
          {escDom && <div style={{padding:"10px 12px",background:"rgba(0,198,184,.06)",border:"1px solid rgba(0,198,184,.2)",borderRadius:8,marginTop:8}}>
            <span style={{color:"#5a7a9a",fontSize:10}}>Escudo dominante: </span>
            <strong style={{color:"#f59e0b"}}>{escDom[0]}</strong>
            <span style={{color:"#5a7a9a",fontSize:10}}> ({escDom[1]}/10)</span>
          </div>}
        </div>}
        {form.caminho===2 && <div className="al al-w" style={{fontSize:11}}>
          Para o Caminho 2, usa o separador <strong>"🗺️ Mapeamento"</strong> que tem a grelha completa com todos os sistemas e mapas.
        </div>}
        {form.caminho===3 && <div className="card">
          <div className="card-t">Estressores Activos e Gatilhos</div>
          {[["q1","1. Quem do teu convívio mais te estressa ou altera o humor?"],["q2","2. O que essa pessoa faz/diz que mais te desestabiliza?"],["q3","3. Que situações te tiram do foco?"],["q4","4. Já existiu alguém no passado com esse mesmo papel?"],["q5","5. O que essas pessoas tinham em comum?"]].map(([k,q])=>(
            <div key={k} style={{marginBottom:9}}>
              <div style={{fontSize:11,color:"#00c6b8",fontWeight:600,marginBottom:3}}>{q}</div>
              <textarea className="inp" rows={2} value={form.estressores[k]||""} onChange={e=>set("estressores",{...form.estressores,[k]:e.target.value})} placeholder="Resposta..." />
            </div>
          ))}
        </div>}
      </div>}

      {step===3 && <div className="card">
        <div className="card-t">Protocolo de Cura — Trabalho em Casa</div>
        <div style={{fontSize:10,color:"#5ae0d8",padding:"8px 10px",background:"rgba(0,198,184,.04)",border:"1px solid rgba(0,198,184,.15)",borderRadius:7,marginBottom:10,lineHeight:1.6}}>
          🏠 Este é o trabalho que o paciente realiza entre sessões. Define com cuidado — é o que sustenta a transformação.
        </div>
        <textarea className="inp" rows={6} value={form.protocolo} onChange={e=>set("protocolo",e.target.value)} placeholder="🎧 Áudio frequencial específico para o escudo activo&#10;🥗 Alimentação: alimentos a incluir/retirar esta semana&#10;🌬️ Exercício de respiração (técnica, duração, frequência)&#10;📝 Prática diária (afirmações, escrita, pausas conscientes)&#10;⏱ Duração do protocolo: 7 ou 15 dias" />
        <div style={{marginTop:10}}>
          <span className="lbl">Duração do protocolo</span>
          <div style={{display:"flex",gap:8}}>
            {["7 dias","15 dias"].map(d=>(
              <button key={d} className={`chip ${form.protocolo_dias===d?"on":""}`} onClick={()=>set("protocolo_dias",d)}>{d}</button>
            ))}
          </div>
        </div>
      </div>}

      <div style={{display:"flex",gap:8,marginTop:4}}>
        {step>0 && <button className="btn btn-s" style={{flex:1}} onClick={()=>setStep(s=>s-1)}>← Anterior</button>}
        {step < STEP_LABELS.length-1
          ? <button className="btn btn-p" style={{flex:2}} onClick={()=>setStep(s=>s+1)}>Próximo: {STEP_LABELS[step+1]} →</button>
          : <button className="btn btn-p" style={{flex:2}} onClick={handleGuardar} disabled={load}>{load?"A guardar...":"💾 Gerar Relatório e Guardar"}</button>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NOVA CONSULTA — Menu com 3 Tipos de Atendimento
// ══════════════════════════════════════════════════════════════════

// ─── MÉTODO UNIVERSAL EDITÁVEL ───────────────────────────────────────────────
// Template de consulta genérico, adaptável por cada subscritor
const TEMPLATE_UNIVERSAL_PADRAO = {
  id: "universal",
  nome: "Método de Avaliação Terapêutica",
  descricao: "Fluxo de consulta completo e adaptável. Já pré-configurado com os melhores passos para um primeiro atendimento — edita à tua medida.",
  cor: "#00c6b8",
  icone: "🌀",
  passos: [
    { id: "p1", titulo: "Acolhimento", tipo: "texto_livre", pergunta: "Como se sente hoje? O que o(a) trouxe à consulta?", obrigatorio: true },
    { id: "p2", titulo: "Queixa Principal", tipo: "texto_livre", pergunta: "Qual é o principal sintoma ou dificuldade que quer trabalhar hoje?", obrigatorio: true },
    { id: "p3", titulo: "Histórico", tipo: "multipla_escolha", pergunta: "Esta situação é:", opcoes: ["Nova (primeira vez)", "Recorrente (já aconteceu antes)", "Crónica (presente há muito tempo)", "Agravamento recente"], obrigatorio: false },
    { id: "p4", titulo: "Intensidade", tipo: "escala", pergunta: "De 0 a 10, qual a intensidade do que sente agora?", min: 0, max: 10, obrigatorio: true },
    { id: "p5", titulo: "Impacto na Vida", tipo: "multipla_escolha", pergunta: "Onde sente mais impacto?", opcoes: ["Trabalho / Carreira", "Relações afetivas", "Saúde física", "Sono / descanso", "Bem-estar emocional", "Família", "Finanças"], multiplo: true, obrigatorio: false },
    { id: "p6", titulo: "Recursos", tipo: "texto_livre", pergunta: "O que já tentou fazer para melhorar? O que ajudou, mesmo que pouco?", obrigatorio: false },
    { id: "p7", titulo: "Objetivo da Sessão", tipo: "texto_livre", pergunta: "O que gostaria de sentir/alcançar no final desta sessão?", obrigatorio: true },
    { id: "p8", titulo: "Notas do Terapeuta", tipo: "notas_terapeuta", pergunta: "Observações clínicas (visível apenas para ti):", obrigatorio: false },
    { id: "p9", titulo: "Próximos Passos", tipo: "texto_livre", pergunta: "Protocolo e recomendações para o paciente:", obrigatorio: false },
  ]
};

function MetodoUniversalEditor({ user, onClose }) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editandoPasso, setEditandoPasso] = useState(null);

  useEffect(() => {
    sb.from("metodo_universal").select("*").eq("terapeuta_id", user?.id).single()
      .then(({ data }) => {
        setTemplate(data?.config || TEMPLATE_UNIVERSAL_PADRAO);
        setLoading(false);
      })
      .catch(() => { setTemplate(TEMPLATE_UNIVERSAL_PADRAO); setLoading(false); });
  }, [user?.id]);

  const salvar = async () => {
    setSaving(true);
    // Try upsert; if table doesn't exist yet, show helpful message
    const { error } = await sb.from("metodo_universal").upsert({
      terapeuta_id: user?.id,
      config: template,
      atualizado_em: new Date().toISOString()
    }, { onConflict: "terapeuta_id" });
    if (error?.code === "42P01") {
      setSaving(false);
      setMsg("⚠️ Tabela não criada ainda. Corre o SQL de configuração no Supabase.");
      setTimeout(() => setMsg(""), 4000);
      return;
    }
    setSaving(false);
    setMsg(error ? "❌ Erro ao guardar" : "✅ Método guardado!");
    setTimeout(() => setMsg(""), 2500);
  };

  const adicionarPasso = () => {
    const novoPasso = { id: "p" + Date.now(), titulo: "Novo Passo", tipo: "texto_livre", pergunta: "Escreve aqui a tua pergunta...", obrigatorio: false };
    setTemplate(t => ({ ...t, passos: [...(t.passos||[]), novoPasso] }));
  };

  const removerPasso = (id) => setTemplate(t => ({ ...t, passos: t.passos.filter(p => p.id !== id) }));

  const moverPasso = (id, dir) => {
    setTemplate(t => {
      const ps = [...t.passos];
      const i = ps.findIndex(p => p.id === id);
      if (dir === "up" && i > 0) [ps[i-1], ps[i]] = [ps[i], ps[i-1]];
      if (dir === "down" && i < ps.length-1) [ps[i], ps[i+1]] = [ps[i+1], ps[i]];
      return { ...t, passos: ps };
    });
  };

  const atualizarPasso = (id, campo, valor) => setTemplate(t => ({ ...t, passos: t.passos.map(p => p.id === id ? { ...p, [campo]: valor } : p) }));

  if (loading) return <div style={{padding:20,textAlign:"center",color:"#5a7a9a"}}>A carregar...</div>;

  const TIPOS_PASSO = [
    { v:"texto_livre", l:"✍️ Texto livre" },
    { v:"multipla_escolha", l:"☑️ Múltipla escolha" },
    { v:"escala", l:"🔢 Escala numérica" },
    { v:"sim_nao", l:"✅ Sim / Não" },
    { v:"notas_terapeuta", l:"🔒 Notas do terapeuta" },
  ];

  return (
    <div className="fade" style={{padding:"0 0 80px 0"}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onClose}>← Voltar</button>
        <div style={{flex:1,fontWeight:700,fontSize:14,color:"#dde4f0"}}>🌀 Editor do Método Universal</div>
        <button className="btn btn-p btn-sm" style={{width:"auto",fontSize:11}} onClick={salvar} disabled={saving}>{saving?"A guardar...":"💾 Guardar"}</button>
      </div>
      {msg && <div className="al al-s" style={{marginBottom:10}}>{msg}</div>}

      <div className="card" style={{marginBottom:12}}>
        <div className="card-t">Informação Geral</div>
        <label style={{fontSize:11,color:"#5a7a9a"}}>Nome do método</label>
        <input className="inp" value={template.nome} onChange={e=>setTemplate(t=>({...t,nome:e.target.value}))} style={{marginBottom:8}} />
        <label style={{fontSize:11,color:"#5a7a9a"}}>Descrição</label>
        <textarea className="inp" rows={2} value={template.descricao} onChange={e=>setTemplate(t=>({...t,descricao:e.target.value}))} style={{resize:"vertical"}} />
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontWeight:700,fontSize:11,color:"#5a7a9a"}}>PASSOS DA CONSULTA ({(template.passos||[]).length})</div>
        <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:11}} onClick={adicionarPasso}>+ Adicionar Passo</button>
      </div>

      {(template.passos||[]).map((p, idx) => (
        <div key={p.id} className="card" style={{marginBottom:8,borderColor: editandoPasso===p.id?"#00c6b8":"#0d1828"}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom: editandoPasso===p.id?10:0}}>
            <div style={{fontSize:11,color:"#3d5a7a",width:22,textAlign:"center",fontWeight:700}}>{idx+1}</div>
            <div style={{flex:1,fontWeight:600,fontSize:12,color:"#b0c4d8"}}>{p.titulo}</div>
            <div style={{fontSize:9,color:"#3d5a7a",padding:"2px 7px",borderRadius:8,background:"#0d1828"}}>{TIPOS_PASSO.find(t=>t.v===p.tipo)?.l||p.tipo}</div>
            <button onClick={()=>moverPasso(p.id,"up")} style={{background:"none",border:"none",color:"#3d5a7a",cursor:"pointer",fontSize:14,padding:"0 2px"}} title="Subir">↑</button>
            <button onClick={()=>moverPasso(p.id,"down")} style={{background:"none",border:"none",color:"#3d5a7a",cursor:"pointer",fontSize:14,padding:"0 2px"}} title="Descer">↓</button>
            <button onClick={()=>setEditandoPasso(editandoPasso===p.id?null:p.id)} style={{background:"none",border:"none",color:"#00c6b8",cursor:"pointer",fontSize:12,padding:"0 4px"}}>✏️</button>
            <button onClick={()=>removerPasso(p.id)} style={{background:"none",border:"none",color:"#5a2a2a",cursor:"pointer",fontSize:14,padding:"0 2px"}}>✕</button>
          </div>
          {editandoPasso===p.id && (
            <div style={{borderTop:"1px solid #0d1828",paddingTop:10}}>
              <label style={{fontSize:10,color:"#5a7a9a"}}>Título do passo</label>
              <input className="inp" value={p.titulo} onChange={e=>atualizarPasso(p.id,"titulo",e.target.value)} style={{marginBottom:8}} />
              <label style={{fontSize:10,color:"#5a7a9a"}}>Pergunta / Instrução</label>
              <textarea className="inp" rows={2} value={p.pergunta} onChange={e=>atualizarPasso(p.id,"pergunta",e.target.value)} style={{marginBottom:8,resize:"vertical"}} />
              <label style={{fontSize:10,color:"#5a7a9a"}}>Tipo de resposta</label>
              <select className="inp" value={p.tipo} onChange={e=>atualizarPasso(p.id,"tipo",e.target.value)} style={{marginBottom:8}}>
                {TIPOS_PASSO.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
              {(p.tipo==="multipla_escolha") && (
                <div>
                  <label style={{fontSize:10,color:"#5a7a9a"}}>Opções (uma por linha)</label>
                  <textarea className="inp" rows={3} value={(p.opcoes||[]).join("\n")} onChange={e=>atualizarPasso(p.id,"opcoes",e.target.value.split("\n"))} style={{resize:"vertical",marginBottom:8}} />
                  <label style={{display:"flex",gap:6,alignItems:"center",fontSize:10,color:"#5a7a9a",marginBottom:8}}>
                    <input type="checkbox" checked={!!p.multiplo} onChange={e=>atualizarPasso(p.id,"multiplo",e.target.checked)} />
                    Permitir várias respostas
                  </label>
                </div>
              )}
              <label style={{display:"flex",gap:6,alignItems:"center",fontSize:10,color:"#5a7a9a"}}>
                <input type="checkbox" checked={!!p.obrigatorio} onChange={e=>atualizarPasso(p.id,"obrigatorio",e.target.checked)} />
                Passo obrigatório
              </label>
            </div>
          )}
        </div>
      ))}

      <div className="card" style={{marginTop:14,borderColor:"#1a3a5c"}}>
        <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.7}}>
          <strong style={{color:"#b0c4d8"}}>💡 Como funciona:</strong> Este método aparece na lista de consultas de todos os teus pacientes. Podes criar um método universal base e depois criar módulos personalizados em "Métodos Terapêuticos" para casos específicos.
        </div>
      </div>
    </div>
  );
}

function ExecutorMetodoUniversal({ paciente, user, onGuardar, onVoltar }) {
  const [template, setTemplate] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [passoAtual, setPassoAtual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    sb.from("metodo_universal").select("*").eq("terapeuta_id", user?.id).single()
      .then(({ data }) => { setTemplate(data?.config || TEMPLATE_UNIVERSAL_PADRAO); setLoading(false); })
      .catch(() => { setTemplate(TEMPLATE_UNIVERSAL_PADRAO); setLoading(false); });
  }, [user?.id]);

  if (loading) return <div style={{padding:20,textAlign:"center",color:"#5a7a9a"}}>A carregar método...</div>;
  if (!template) return null;

  const passos = template.passos || [];
  const passo = passos[passoAtual];
  const progresso = Math.round(((passoAtual+1)/passos.length)*100);

  const responder = (val) => setRespostas(r => ({ ...r, [passo.id]: val }));

  const finalizar = async () => {
    setGuardando(true);
    const linhas = passos.map(p => `**${p.titulo}:** ${Array.isArray(respostas[p.id]) ? respostas[p.id].join(", ") : (respostas[p.id] || "(não respondido)")}`);
    // Gerar perguntas de consciência baseadas nas respostas
    const pergConsc = [];
    passos.forEach(p => {
      const r = respostas[p.id];
      if (p.tipo === "escala" && typeof r === "number" && r >= 7) {
        pergConsc.push(`• A tua resposta "${p.titulo}" foi ${r}/10. O que contribui para essa intensidade?`);
      }
      if (p.tipo === "texto_livre" && r && r.length > 20) {
        pergConsc.push(`• Sobre "${p.titulo}": o que mudaria se este aspecto fosse diferente na tua vida?`);
      }
    });

    const devolutiva = pergConsc.length > 0
      ? `\n\n--- PERGUNTAS PARA REFLEXÃO ---\n${pergConsc.join("\n")}`
      : "";

    const relatorio = `# Relatório de Sessão — ${template.nome}\nPaciente: ${paciente?.nome}\nData: ${new Date().toLocaleDateString("pt-PT")}\n\n${linhas.join("\n")}${devolutiva}\n\n---\nAVISO: Este relatório é de natureza terapêutica complementar e não substitui avaliação médica.`;
    await onGuardar("universal", { respostas, relatorio, template_nome: template.nome });
    setGuardando(false);
  };

  return (
    <div className="fade">
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
        <div style={{flex:1,fontSize:13,fontWeight:700,color:"#dde4f0"}}>🌀 {template.nome}</div>
        <div style={{fontSize:10,color:"#5a7a9a"}}>{paciente?.nome}</div>
      </div>
      <div style={{background:"#0d1828",borderRadius:6,height:4,marginBottom:14}}>
        <div style={{background:"#00c6b8",borderRadius:6,height:4,width:progresso+"%",transition:"width .3s"}} />
      </div>
      <div style={{fontSize:10,color:"#5a7a9a",textAlign:"right",marginTop:-10,marginBottom:14}}>Passo {passoAtual+1} de {passos.length}</div>

      {passo && (
        <div className="card" style={{minHeight:180}}>
          <div style={{fontWeight:700,fontSize:14,color:"#dde4f0",marginBottom:4}}>{passo.titulo}</div>
          {passo.obrigatorio && <div style={{fontSize:9,color:"#f59e0b",marginBottom:10}}>* Obrigatório</div>}
          <div style={{fontSize:12,color:"#8ba3c0",marginBottom:14,lineHeight:1.6}}>{passo.pergunta}</div>

          {(passo.tipo==="texto_livre"||passo.tipo==="notas_terapeuta") && (
            <textarea className="inp" rows={4} placeholder={passo.tipo==="notas_terapeuta"?"(visível apenas para ti)":""} value={respostas[passo.id]||""} onChange={e=>responder(e.target.value)} style={{resize:"vertical"}} />
          )}
          {passo.tipo==="escala" && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Array.from({length:(passo.max||10)-(passo.min||0)+1},(_,i)=>(passo.min||0)+i).map(n=>(
                <button key={n} onClick={()=>responder(n)} style={{width:40,height:40,borderRadius:8,border:`2px solid ${respostas[passo.id]===n?"#00c6b8":"#0d1828"}`,background:respostas[passo.id]===n?"#00c6b8":"#050810",color:respostas[passo.id]===n?"#07090f":"#b0c4d8",fontWeight:700,cursor:"pointer",fontSize:14}}>{n}</button>
              ))}
            </div>
          )}
          {passo.tipo==="sim_nao" && (
            <div style={{display:"flex",gap:10}}>
              {["Sim","Não"].map(op=>(
                <button key={op} onClick={()=>responder(op)} style={{flex:1,padding:"12px 0",borderRadius:8,border:`2px solid ${respostas[passo.id]===op?"#00c6b8":"#0d1828"}`,background:respostas[passo.id]===op?"#00c6b8":"#050810",color:respostas[passo.id]===op?"#07090f":"#b0c4d8",fontWeight:700,cursor:"pointer",fontSize:14}}>{op}</button>
              ))}
            </div>
          )}
          {passo.tipo==="multipla_escolha" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(passo.opcoes||[]).map(op=>{
                const sels = Array.isArray(respostas[passo.id])?respostas[passo.id]:[];
                const sel = passo.multiplo?sels.includes(op):respostas[passo.id]===op;
                const toggle = () => {
                  if (passo.multiplo) responder(sel?sels.filter(s=>s!==op):[...sels,op]);
                  else responder(op);
                };
                return <button key={op} onClick={toggle} style={{textAlign:"left",padding:"10px 14px",borderRadius:8,border:`2px solid ${sel?"#00c6b8":"#0d1828"}`,background:sel?"rgba(0,198,184,.08)":"#050810",color:sel?"#00c6b8":"#b0c4d8",cursor:"pointer",fontSize:12,fontWeight:sel?700:400}}>{sel?"✓ ":""}{op}</button>;
              })}
            </div>
          )}
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:14}}>
        {passoAtual>0 && <button className="btn btn-s" style={{flex:1}} onClick={()=>setPassoAtual(i=>i-1)}>← Anterior</button>}
        {passoAtual<passos.length-1
          ? <button className="btn btn-p" style={{flex:2}} onClick={()=>setPassoAtual(i=>i+1)}>Próximo →</button>
          : <button className="btn btn-p" style={{flex:2}} onClick={finalizar} disabled={guardando}>{guardando?"A guardar...":"✅ Finalizar Consulta"}</button>
        }
      </div>
    </div>
  );
}


// ─── PRÉ-CONSULTA EXTERNA ────────────────────────────────────────────────────
function PainelPreConsulta({ user }) {
  const [pacs, setPacs] = useState([]);
  const [sel, setSel] = useState(null);
  const [link, setLink] = useState("");
  const [tipo, setTipo] = useState("pre_consulta");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [showSelPac, setShowSelPac] = useState(false);

  useEffect(()=>{
    sb.from("pacientes").select("id,nome,telefone").eq("terapeuta_id",user?.id).order("nome")
      .then(({data})=>setPacs(data||[]));
  },[user?.id]);

  const gerarLink = async () => {
    if(!sel) return;
    setCarregando(true);
    const {data,error} = await sb.from("pre_consulta_tokens")
      .insert({paciente_id:sel.id, terapeuta_id:user.id, tipo})
      .select().single();
    setCarregando(false);
    if(error||!data){alert("Erro: "+(error?.message||""));return;}
    const url = `${window.location.origin}?formulario=${data.id}`;
    setLink(url);
    setEnviado(false);
  };

  const enviarWA = () => {
    if(!sel?.telefone||!link) return;
    const num = sel.telefone.replace(/[^0-9]/g,"");
    const tipos = {pre_consulta:"pré-consulta",escudos:"Questionário dos Escudos Emocionais",medos:"Questionário dos Medos"};
    const msg = `Olá ${sel.nome}! Antes da nossa sessão, peço que preenchas este questionário rápido (${tipos[tipo]||tipo}):

${link}

Obrigado(a)! 🙏`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
    setEnviado(true);
  };

  const copiar = () => { navigator.clipboard?.writeText(link); setEnviado(true); };

  const TIPOS = [
    {id:"pre_consulta",l:"📋 Pré-Consulta"},
    {id:"escudos",l:"🛡️ Escudos Emocionais"},
    {id:"medos",l:"😨 Questionário dos Medos"},
  ];

  return (
    <div className="fade" style={{padding:"0 0 60px 0"}}>
      <div className="card-t" style={{marginBottom:10}}>📤 Enviar Formulário por Link / WhatsApp</div>
      <div className="card" style={{marginBottom:10}}>
        <label style={{fontSize:11,color:"#5a7a9a",marginBottom:6,display:"block"}}>Formulário a enviar</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {TIPOS.map(t=>(
            <button key={t.id} onClick={()=>setTipo(t.id)} style={{padding:"7px 12px",borderRadius:8,border:`2px solid ${tipo===t.id?"#00c6b8":"#0d1828"}`,background:tipo===t.id?"rgba(0,198,184,.1)":"#050810",color:tipo===t.id?"#00c6b8":"#5a7a9a",fontSize:11,cursor:"pointer",fontWeight:tipo===t.id?700:400}}>{t.l}</button>
          ))}
        </div>
        <label style={{fontSize:11,color:"#5a7a9a",marginBottom:6,display:"block"}}>Paciente</label>
        <select className="inp" value={sel?.id||""} onChange={e=>setSel(pacs.find(p=>p.id===e.target.value)||null)} style={{marginBottom:12}}>
          <option value="">— seleccionar —</option>
          {pacs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button className="btn btn-p" onClick={gerarLink} disabled={!sel||carregando} style={{marginBottom:12}}>
          {carregando?"A gerar...":"🔗 Gerar Link"}
        </button>
        {link && (
          <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#3d5a7a",marginBottom:6,wordBreak:"break-all"}}>{link}</div>
            <div style={{display:"flex",gap:6}}>
              <button className="btn btn-s" style={{flex:1,fontSize:11}} onClick={copiar}>📋 Copiar Link</button>
              {sel?.telefone && <button className="btn btn-sm" style={{flex:1,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",fontSize:11}} onClick={enviarWA}>📱 WhatsApp</button>}
            </div>
            {enviado && <div style={{fontSize:10,color:"#00c6b8",marginTop:6,textAlign:"center"}}>✅ Link copiado/enviado!</div>}
          </div>
        )}
        <div style={{fontSize:10,color:"#2d4a66",lineHeight:1.6}}>
          O paciente preenche no telemóvel sem precisar de conta. As respostas entram directamente na sua ficha.
        </div>
      </div>
    </div>
  );
}

// ─── PACKS DE CONSULTAS + PAGAMENTOS ────────────────────────────────────────
function PainelPacks({ user }) {
  const [pacs, setPacs] = useState([]);
  const [packs, setPacks] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [sel, setSel] = useState(null); // pack seleccionado
  const [aba, setAba] = useState("lista"); // lista | novo | pagar | selPac_packs
  const [form, setForm] = useState({nome:"Pack 3 Sessões",total_sessoes:3,preco_total:"",paciente_id:""});
  const [pagForm, setPagForm] = useState({valor:"",metodo:"MBWay",notas:"",data_pagamento:new Date().toISOString().split("T")[0]});
  const [ok, setOk] = useState("");

  const load = () => {
    sb.from("packs_consultas").select("*,pacientes(nome)").eq("terapeuta_id",user?.id).order("criado_em",{ascending:false}).then(({data})=>setPacks(data||[]));
    sb.from("pagamentos").select("*").eq("terapeuta_id",user?.id).order("criado_em",{ascending:false}).then(({data})=>setPagamentos(data||[]));
    sb.from("pacientes").select("id,nome").eq("terapeuta_id",user?.id).order("nome").then(({data})=>setPacs(data||[]));
  };
  useEffect(()=>{load();},[user?.id]);

  const criarPack = async () => {
    if(!form.paciente_id||!form.preco_total) return;
    const {error} = await sb.from("packs_consultas").insert({...form,terapeuta_id:user.id,preco_total:parseFloat(form.preco_total)});
    if(error){alert(error.message);return;}
    setOk("✅ Pack criado!");setTimeout(()=>setOk(""),2000);setAba("lista");load();
  };

  const registarPagamento = async () => {
    if(!sel||!pagForm.valor) return;
    const {error} = await sb.from("pagamentos").insert({...pagForm,pack_id:sel.id,paciente_id:sel.paciente_id,terapeuta_id:user.id,valor:parseFloat(pagForm.valor)});
    if(error){alert(error.message);return;}
    // Update pack pago_total
    const jaPane = pagamentos.filter(p=>p.pack_id===sel.id).reduce((s,p)=>s+parseFloat(p.valor||0),0)+parseFloat(pagForm.valor);
    await sb.from("packs_consultas").update({pago_total:jaPane,sessoes_realizadas:sel.sessoes_realizadas+(pagForm.notas.includes("sessão")?1:0)}).eq("id",sel.id);
    setOk("✅ Pagamento registado!");setTimeout(()=>setOk(""),2000);setSel(null);setAba("lista");load();
  };

  const packsComSaldo = packs.map(pk=>{
    const pago = pagamentos.filter(p=>p.pack_id===pk.id).reduce((s,p)=>s+parseFloat(p.valor||0),0);
    const divida = parseFloat(pk.preco_total||0)-pago;
    return{...pk,pago_real:pago,divida};
  });

  const totalDivida = packsComSaldo.reduce((s,pk)=>s+(pk.divida>0?pk.divida:0),0);

  return (
    <div className="fade" style={{padding:"0 0 60px 0"}}>
      {ok&&<div className="al al-ok" style={{marginBottom:8}}>{ok}</div>}
      {totalDivida>0&&<div className="al" style={{marginBottom:8,borderColor:"#f87171",background:"rgba(248,113,113,.07)",color:"#f87171"}}>⚠️ Total em dívida: <strong>{totalDivida.toFixed(2)}€</strong></div>}
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {[["lista","📋 Packs"],["novo","➕ Novo Pack"]].map(([k,l])=>(
          <button key={k} onClick={()=>setAba(k)} style={{flex:1,padding:"9px 0",borderRadius:8,border:`2px solid ${aba===k?"#00c6b8":"#0d1828"}`,background:aba===k?"rgba(0,198,184,.1)":"#050810",color:aba===k?"#00c6b8":"#5a7a9a",fontSize:12,fontWeight:aba===k?700:400,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {aba==="novo"&&(
        <div className="card">
          <div className="card-t">Novo Pack</div>
          <label style={{fontSize:10,color:"#5a7a9a"}}>Paciente</label>
          <select className="inp" value={form.paciente_id} onChange={e=>setForm(f=>({...f,paciente_id:e.target.value}))} style={{marginBottom:8}}>
            <option value="">— seleccionar —</option>
            {pacs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <label style={{fontSize:10,color:"#5a7a9a"}}>Nome do pack</label>
          <input className="inp" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} style={{marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div>
              <label style={{fontSize:10,color:"#5a7a9a"}}>Nº sessões</label>
              <input className="inp" type="number" min="1" value={form.total_sessoes} onChange={e=>setForm(f=>({...f,total_sessoes:parseInt(e.target.value)||1}))}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#5a7a9a"}}>Preço total (€)</label>
              <input className="inp" type="number" placeholder="0.00" value={form.preco_total} onChange={e=>setForm(f=>({...f,preco_total:e.target.value}))}/>
            </div>
          </div>
          <button className="btn btn-p" onClick={criarPack} disabled={!form.paciente_id||!form.preco_total}>💾 Criar Pack</button>
        </div>
      )}

      {aba==="lista"&&packsComSaldo.map(pk=>{
        const progresso=Math.round((pk.sessoes_realizadas/pk.total_sessoes)*100);
        const pago_pct=Math.round((pk.pago_real/parseFloat(pk.preco_total||1))*100);
        return(
          <div key={pk.id} className="card" style={{marginBottom:8,borderColor:pk.divida>0?"#5a1a1a":pk.divida===0?"#1a4a3a":"#0d1828"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{pk.nome}</div>
                <div style={{fontSize:10,color:"#5a7a9a"}}>{pk.pacientes?.nome||""}</div>
              </div>
              <div style={{textAlign:"right"}}>
                {pk.divida>0
                  ?<div style={{fontSize:11,color:"#f87171",fontWeight:700}}>Em dívida: {pk.divida.toFixed(2)}€</div>
                  :<div style={{fontSize:11,color:"#5ae0d8",fontWeight:700}}>✅ Saldado</div>
                }
                <div style={{fontSize:10,color:"#3d5a7a"}}>{pk.pago_real.toFixed(2)}€ / {parseFloat(pk.preco_total||0).toFixed(2)}€</div>
              </div>
            </div>
            <div style={{background:"#0a1e2e",borderRadius:4,height:4,marginBottom:4}}>
              <div style={{background:"#00c6b8",height:4,borderRadius:4,width:pago_pct+"%",transition:"width .3s"}}/>
            </div>
            <div style={{fontSize:9,color:"#3d5a7a",marginBottom:8}}>{pk.sessoes_realizadas}/{pk.total_sessoes} sessões · {pago_pct}% pago</div>
            <div style={{display:"flex",gap:6}}>
              <button className="btn btn-s btn-sm" style={{flex:1,fontSize:10}} onClick={()=>{setSel(pk);setAba("pagar");}}>💳 Registar Pagamento</button>
              <button className="btn btn-sm" style={{flex:1,fontSize:10,background:"rgba(248,113,113,.1)",border:"1px solid #5a1a1a",color:"#f87171"}} onClick={async()=>{if(confirm("Apagar pack?"))await sb.from("packs_consultas").delete().eq("id",pk.id).then(()=>load());}}>🗑️</button>
            </div>
          </div>
        );
      })}

      {aba==="selPac_packs"&&(
        <SeletorPacienteUniversal user={user} titulo="💳 Pack — Escolher Paciente"
          onSelecionado={(p)=>{ setForm(f=>({...f,paciente_id:p.id})); setAba("novo"); }}
          onVoltar={()=>setAba("novo")} />
      )}
      {aba==="pagar"&&sel&&(
        <div className="card">
          <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:8}} onClick={()=>{setSel(null);setAba("lista");}}>← Voltar</button>
          <div className="card-t">💳 Registar Pagamento — {sel.nome}</div>
          <div style={{fontSize:11,color:"#f87171",marginBottom:10}}>Em dívida: {(parseFloat(sel.preco_total||0)-sel.pago_real).toFixed(2)}€</div>
          <label style={{fontSize:10,color:"#5a7a9a"}}>Valor recebido (€)</label>
          <input className="inp" type="number" placeholder="0.00" value={pagForm.valor} onChange={e=>setPagForm(f=>({...f,valor:e.target.value}))} style={{marginBottom:8}}/>
          <label style={{fontSize:10,color:"#5a7a9a"}}>Método</label>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
            {["MBWay","Transferência","Dinheiro","Cartão","Outro"].map(m=>(
              <button key={m} onClick={()=>setPagForm(f=>({...f,metodo:m}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${pagForm.metodo===m?"#00c6b8":"#0d1828"}`,background:pagForm.metodo===m?"rgba(0,198,184,.1)":"#050810",color:pagForm.metodo===m?"#00c6b8":"#5a7a9a",fontSize:11,cursor:"pointer"}}>{m}</button>
            ))}
          </div>
          <label style={{fontSize:10,color:"#5a7a9a"}}>Data</label>
          <input className="inp" type="date" value={pagForm.data_pagamento} onChange={e=>setPagForm(f=>({...f,data_pagamento:e.target.value}))} style={{marginBottom:8}}/>
          <label style={{fontSize:10,color:"#5a7a9a"}}>Notas (opcional)</label>
          <input className="inp" placeholder="ex: referente à sessão 2" value={pagForm.notas} onChange={e=>setPagForm(f=>({...f,notas:e.target.value}))} style={{marginBottom:12}}/>
          <button className="btn btn-p" onClick={registarPagamento} disabled={!pagForm.valor}>✅ Guardar Pagamento</button>
        </div>
      )}
    </div>
  );
}

// ─── TELECONSULTA JITSI AUTO ─────────────────────────────────────────────────
function TeleconsultaPanel({ user }) {
  const [pacs, setPacs] = useState([]);
  const [sel, setSel] = useState(null);
  const [sala, setSala] = useState("");
  const [iframeMode, setIframeMode] = useState(false);
  const [showSelTc, setShowSelTc] = useState(false);
  const APP_URL = "vitaldoctor.netlify.app";

  useEffect(()=>{
    sb.from("pacientes").select("id,nome,telefone").eq("terapeuta_id",user?.id).order("nome")
      .then(({data})=>setPacs(data||[]));
  },[user?.id]);

  const gerarSala = () => {
    if(!sel) return;
    const roomId = `VitalDoctor-${user.id.substring(0,6)}-${sel.id.substring(0,6)}`;
    setSala(`https://meet.jit.si/${roomId}`);
  };

  const enviarLink = () => {
    if(!sel?.telefone||!sala) return;
    const num=sel.telefone.replace(/[^0-9]/g,"");
    const msg=`Olá ${sel.nome}! A nossa teleconsulta já está pronta:

${sala}

Clica no link na hora marcada. Não precisas de conta. 🩺`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  return (
    <div className="fade" style={{padding:"0 0 60px 0"}}>
      <div className="card-t" style={{marginBottom:10}}>📹 Teleconsulta (Jitsi — 100% Gratuito)</div>
      <div className="card" style={{marginBottom:10}}>
        <label style={{fontSize:11,color:"#5a7a9a",marginBottom:6,display:"block"}}>Paciente</label>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}>
          <div style={{flex:1,padding:"9px 12px",background:"#050810",border:"1px solid #0d1828",borderRadius:7,fontSize:11,color:sel?"#b0c4d8":"#3d5a7a"}}>
            {sel ? `👤 ${sel.nome}${sel.telefone?" · "+sel.telefone:""}` : "— nenhum paciente —"}
          </div>
          <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:10}} onClick={()=>setShowSelTc(true)}>
            {sel?"🔄":"👤"} {sel?"Mudar":"Escolher"}
          </button>
        </div>
        {showSelTc && (
          <SeletorPacienteUniversal user={user} titulo="📹 Teleconsulta — Paciente"
            onSelecionado={(p)=>{ setSel(p); setShowSelTc(false); }}
            onVoltar={()=>setShowSelTc(false)} />
        )}
        <button className="btn btn-p" onClick={gerarSala} disabled={!sel} style={{marginBottom:10}}>📹 Gerar Sala de Videochamada</button>
        {sala&&(
          <div>
            <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:10,marginBottom:8}}>
              <div style={{fontSize:10,color:"#3d5a7a",wordBreak:"break-all",marginBottom:6}}>{sala}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className="btn btn-s btn-sm" style={{fontSize:10}} onClick={()=>navigator.clipboard?.writeText(sala)}>📋 Copiar</button>
                <a href={sala} target="_blank" rel="noopener noreferrer" className="btn btn-p btn-sm" style={{fontSize:10,textDecoration:"none",flex:1,textAlign:"center"}}>▶ Entrar na Sala</a>
                {sel?.telefone&&<button className="btn btn-sm" style={{fontSize:10,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={enviarLink}>📱 Enviar WhatsApp</button>}
              </div>
            </div>
            <label style={{display:"flex",gap:6,alignItems:"center",fontSize:11,color:"#5a7a9a",cursor:"pointer"}}>
              <input type="checkbox" checked={iframeMode} onChange={e=>setIframeMode(e.target.checked)}/>
              Abrir videochamada incorporada nesta página
            </label>
            {iframeMode&&(
              <iframe src={sala+"#config.startWithAudioMuted=true&config.startWithVideoMuted=false"} style={{width:"100%",height:420,border:"none",borderRadius:10,marginTop:8}} allow="camera; microphone; fullscreen; display-capture"/>
            )}
          </div>
        )}
        <div style={{fontSize:10,color:"#2d4a66",marginTop:10,lineHeight:1.6}}>
          Powered by Jitsi Meet — gratuito, sem conta, sem tempo limite. O paciente clica no link e entra directamente.
        </div>
      </div>
    </div>
  );
}

function NovaConsulta({ user, onIniciar }) {
  const [modulos, setModulos] = useState([]);
  const [metodosPersonalizados, setMetodosPersonalizados] = useState([]);
  const nomes = user?.config?.sessoes_nomes || {
    consulta_unica: "Consulta de Avaliação",
    pack_s1: "Pack Terapêutico — Sessão 1",
    pack_s2: "Pack Terapêutico — Sessão 2",
    pack_s3: "Pack Terapêutico — Sessão 3",
    seguimento: "Seguimento / Manutenção",
  };
  
  useEffect(() => {
    // Módulos custom SEM bloqueio (os bloqueados ficam na tab Exclusivo)
    sb.from("custom_modules").select("*")
      .eq("terapeuta_id", user.id).eq("publicado", true)
      .is("bloqueado_com", null)
      .order("criado_em", { ascending: false })
      .then(({data}) => setModulos(data || []))
      .catch(() => {});
    // Métodos personalizados do dashboard do terapeuta
    sb.from("profiles").select("config").eq("id", user?.id).single()
      .then(({data}) => {
        const ativos = (data?.config?.dash?.metodosAtivos || []).filter(m => m.ativo);
        setMetodosPersonalizados(ativos);
      }).catch(() => {});
  }, [user?.id]);


// Helper: renderiza um tile de consulta
const TileConsulta = ({icon, titulo, sub, desc, cor="#1a4a6c", onClick}) => (
  <div onClick={onClick}
    style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",marginBottom:8,borderRadius:10,border:"1px solid #0d1828",background:"#050810",cursor:"pointer",transition:"all .18s"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=cor.replace("1a","3a");e.currentTarget.style.background="#07101c";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d1828";e.currentTarget.style.background="#050810";}}>
    <div style={{width:42,height:42,borderRadius:9,background:`linear-gradient(135deg,${cor},#0d2535)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
    <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{titulo}</div>
      <div style={{fontSize:10,color:"#00c6b8",fontWeight:600}}>{sub}</div>
      {desc&&<div style={{fontSize:9,color:"#5a7a9a",marginTop:2,lineHeight:1.5}}>{desc}</div>}
    </div>
    <div style={{color:"#3d5a7a",fontSize:16,flexShrink:0}}>▶</div>
  </div>
);

  // Tiles base da plataforma — genéricos para qualquer terapia
  const TILES_BASE = [
    { id:"universal", form:"universal", icon:"🌀", titulo:"Método de Avaliação Terapêutica", sub:"Adaptável — editável — qualquer terapia", desc:"Fluxo de consulta completo. Edita os passos à tua medida." },
    { id:"consulta_unica", form:"form_a", icon:"🩺", titulo:nomes.consulta_unica, sub:"1ª Consulta / Atendimento único", desc:"Acolhimento completo com avaliação inicial e protocolo." },
    { id:"pack_s1", form:"form_c", caminho:1, icon:"1️⃣", titulo:nomes.pack_s1, sub:"Pack — Sessão 1", desc:"Avaliação inicial e questionário completo." },
    { id:"pack_s2", form:"form_b", icon:"2️⃣", titulo:nomes.pack_s2, sub:"Pack — Sessão 2", desc:"Análise energética e identificação de padrões." },
    { id:"pack_s3", form:"form_c", caminho:1, icon:"3️⃣", titulo:nomes.pack_s3, sub:"Pack — Sessão 3", desc:"Consolidação e protocolo de manutenção." },
    { id:"seguimento", form:"form_c", caminho:3, icon:"🔄", titulo:nomes.seguimento, sub:"Acompanhamento contínuo", desc:"Monitorização de progresso e reforço." },
    { id:"avaliacao", form:"form_b", icon:"🔬", titulo:"Avaliação Energética", sub:"Sessão independente", desc:"Análise profunda fora de pack." },
  ];

  return (
    <div className="fade">
      <div style={{background:"linear-gradient(135deg,#061428,#0a1e2e)",border:"1px solid #1a3a5c",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:800,color:"#dde4f0",marginBottom:2}}>🩺 Nova Consulta</div>
        <div style={{fontSize:10,color:"#3d5a7a"}}>Selecciona o tipo de atendimento para iniciar passo a passo</div>
      </div>

      {/* MÉTODOS PERSONALIZADOS DO TERAPEUTA (do seu Dashboard) */}
      {metodosPersonalizados.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:"#00c6b8",fontWeight:800,letterSpacing:1.5,marginBottom:8}}>OS MEUS MÉTODOS</div>
          {metodosPersonalizados.map(m=>(
            <TileConsulta key={m.id} icon={m.icone||"🌿"} titulo={m.nome} sub="Método personalizado" desc={m.desc}
              cor="#1a5a4c"
              onClick={()=>onIniciar&&onIniciar("universal", null, m.nome)} />
          ))}
        </div>
      )}

      {/* TILES BASE DA PLATAFORMA */}
      <div style={{fontSize:9,color:"#5a7a9a",fontWeight:800,letterSpacing:1.5,marginBottom:8}}>MÉTODOS DA PLATAFORMA</div>
      {TILES_BASE.map(t=>(
        <TileConsulta key={t.id} icon={t.icon} titulo={t.titulo} sub={t.sub} desc={t.desc}
          onClick={()=>onIniciar&&onIniciar(t.form, t.caminho, t.titulo)} />
      ))}

      {/* MÓDULOS CUSTOMIZADOS (sem exclusivo) */}
      {modulos.length > 0 && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:9,color:"#5a7a9a",fontWeight:800,letterSpacing:1.5,marginBottom:8}}>MÓDULOS CRIADOS POR MIM</div>
          {modulos.map(m=>(
            <TileConsulta key={m.id} icon="📋" titulo={m.nome} sub="Módulo personalizado" desc={m.descricao}
              cor="#1a5a5c"
              onClick={()=>onIniciar&&onIniciar("custom_module", null, m.nome, m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// 🧠 MÓDULO EXCLUSIVO — ANSIEDADE & DEPRESSÃO
// Visível APENAS com has_exclusive_therapy_access = true
// Nomenclatura neutra — sem referência ao método original
// ═══════════════════════════════════════════════════════════════════

const MODULO_AD_CONFIG = {
  tipos: [
    {
      id: "ad_avaliacao",
      icone: "🧠",
      nome: "Avaliação Inicial — Ansiedade & Depressão",
      sub: "1ª sessão · identificação do padrão dominante",
      cor: "#4a1a7c",
      passos: [
        { id: "s1", titulo: "Acolhimento", instrucao: "Observa como a pessoa chega. Nota o corpo, a voz, a respiração. Não apresses." },
        { id: "s2", titulo: "Estado Predominante", tipo: "escolha", pergunta: "O que predomina neste momento?",
          opcoes: [
            { id: "ansiedade", label: "😰 Ansiedade", desc: "Agitação, pensamento acelerado, dificuldade em parar, alerta constante" },
            { id: "depressao", label: "😔 Depressão", desc: "Tristeza, vazio, falta de energia, desligamento do mundo" },
            { id: "misto", label: "⚡ Misto", desc: "Alternância ou coexistência dos dois estados" },
          ]
        },
        { id: "s3", titulo: "Intensidade Actual", tipo: "escala", pergunta: "De 0 a 10, qual a intensidade do que sentes neste momento?", min: 0, max: 10 },
        { id: "s4", titulo: "Tempo e Origem", tipo: "texto", pergunta: "Há quanto tempo sentes isto? Consegues identificar quando começou ou o que aconteceu antes?" },
        { id: "s5", titulo: "Impacto na Vida", tipo: "multiplo", pergunta: "Onde sentes mais impacto?",
          opcoes: ["Sono / descanso","Alimentação","Relações afectivas","Trabalho / foco","Corpo físico","Motivação e energia","Autoestima","Sentido de vida"]
        },
        { id: "s6", titulo: "Escudos Emocionais", tipo: "escudos", pergunta: "Pontua cada padrão de 0 a 10 (0 = não me identifico, 10 = identifico-me muito):" },
        { id: "s7", titulo: "Perguntas de Aprofundamento", tipo: "perguntas_ad", pergunta: "Responde às seguintes questões:" },
        { id: "s8", titulo: "Observações do Terapeuta", tipo: "notas", pergunta: "Regista as tuas percepções clínicas (visível apenas para ti):" },
      ]
    },
    {
      id: "ad_mapeamento",
      icone: "🔬",
      nome: "Avaliação Energética Vital",
      sub: "Análise dos padrões corporais",
      cor: "#1a4a7c",
      passos: [] // usa o FormMapeamentoGrelha existente
    },
    {
      id: "ad_protocolo",
      icone: "🌀",
      nome: "Sessão de Protocolo",
      sub: "Aplicação do protocolo de cura",
      cor: "#1a5a4c",
      passos: [
        { id: "p1", titulo: "Revisão da sessão anterior", tipo: "texto", pergunta: "O que mudou desde a última sessão? Que reacções surgiram durante o protocolo?" },
        { id: "p2", titulo: "Intensidade actual", tipo: "escala", pergunta: "De 0 a 10, como estás agora?", min: 0, max: 10 },
        { id: "p3", titulo: "Foco desta sessão", tipo: "escolha_livre", pergunta: "O que vamos trabalhar hoje?",
          opcoes: ["Reforço do protocolo anterior","Novo escudo identificado","Estressores activos","Acompanhamento emocional","Encerramento do ciclo"]
        },
        { id: "p4", titulo: "Notas e protocolo", tipo: "notas", pergunta: "Protocolo indicado e observações:" },
      ]
    },
    {
      id: "ad_seguimento",
      icone: "📊",
      nome: "Sessão de Seguimento",
      sub: "Monitorização e consolidação",
      cor: "#1a3a5c",
      passos: [
        { id: "f1", titulo: "Evolução", tipo: "escala", pergunta: "Compara com o início: de 0 a 10, como estás hoje?", min: 0, max: 10 },
        { id: "f2", titulo: "O que mudou", tipo: "texto", pergunta: "Que mudanças concretas observaste na tua vida? Por mais pequenas que sejam." },
        { id: "f3", titulo: "Desafios actuais", tipo: "texto", pergunta: "O que ainda te desafia? Que padrões persistem?" },
        { id: "f4", titulo: "Próximos passos", tipo: "notas", pergunta: "Indicações para continuação:" },
      ]
    },
  ]
};

const PERGUNTAS_AD = {
  ansiedade: [
    "O teu pensamento acelera sozinho? Em que momentos isso acontece mais?",
    "Sentes dificuldade em parar, descansar ou simplesmente estar parado(a)?",
    "Que situações ou pessoas disparam mais o teu estado de alerta?",
    "Já sentiste ataques de pânico ou crises de ansiedade? Descreve como são.",
    "O que acreditas que vai acontecer de mau se perderes o controlo?",
  ],
  depressao: [
    "Há quanto tempo te sentes assim? Houve algum acontecimento antes?",
    "Que actividades ou pessoas ainda conseguem despertar algum interesse em ti?",
    "Como descreverias o vazio que sentes? Tem uma cor, um peso, uma forma?",
    "Tens pensamentos de que nada vai melhorar? Com que frequência?",
    "O que te faria sentir, mesmo que um pouco, que vale a pena continuar?",
  ],
  misto: [
    "Quando predomina a ansiedade e quando predomina a tristeza?",
    "Existe algum padrão — horas do dia, situações, pessoas — que alterna esses estados?",
    "Como é o teu sono? Tens dificuldade em adormecer, acordas a meio da noite ou dormes em excesso?",
    "O que precisarias de sentir para dizer que estás melhor?",
    "Que recursos internos já utilizaste que, mesmo que pouco, te ajudaram?",
  ]
};

function ModuloADExecutor({ tipo, paciente, user, onGuardar, onVoltar }) {
  const cfg = MODULO_AD_CONFIG.tipos.find(t => t.id === tipo);
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [guardando, setGuardando] = useState(false);

  if (!cfg) return null;
  if (cfg.id === "ad_mapeamento") {
    // Usa o FormMapeamentoGrelha existente
    return <FormMapeamentoGrelha paciente={paciente} user={user} onGuardar={onGuardar} onVoltar={onVoltar} />;
  }

  const passos = cfg.passos;
  const p = passos[passo];
  const total = passos.length;
  const prog = Math.round(((passo+1)/total)*100);
  const r = (id, val) => setRespostas(prev => ({...prev, [id]: val}));

  const finalizar = async () => {
    setGuardando(true);
    const estadoPred = respostas["s2"] || respostas["p0"] || "geral";
    const escudoScores = respostas["s6"] || {};
    const escDom = Object.entries(escudoScores).sort((a,b)=>Number(b[1])-Number(a[1]))[0];
    const linhas = [
      `🧠 MÓDULO ANSIEDADE & DEPRESSÃO — ${cfg.nome}`,
      `Paciente: ${paciente?.nome} · Data: ${new Date().toLocaleDateString("pt-PT")}`,
      "─".repeat(50),
    ];
    passos.forEach(ps => {
      const rv = respostas[ps.id];
      if (!rv && rv !== 0) return;
      linhas.push(`
${ps.titulo.toUpperCase()}`);
      if (Array.isArray(rv)) linhas.push(rv.join(", "));
      else if (typeof rv === "object") Object.entries(rv).forEach(([k,v])=>linhas.push(`  ${k}: ${v}/10`));
      else linhas.push(String(rv));
    });
    if (escDom) linhas.push(`
ESCUDO DOMINANTE: ${escDom[0].toUpperCase()} (${escDom[1]}/10)`);
    // Perguntas de consciência
    const pergsAD = PERGUNTAS_AD[estadoPred] || PERGUNTAS_AD.misto;
    linhas.push("\n" + "═".repeat(50));
    linhas.push("DEVOLUTIVA PARA O PACIENTE");
    linhas.push("═".repeat(50));
    linhas.push("\n💬 PERGUNTAS PARA TOMADA DE CONSCIÊNCIA");
    pergsAD.forEach((q,i) => linhas.push(`  ${i+1}. ${q}`));
    if (escDom) {
      const escObj = ESCUDOS.find(e => e.id === escDom[0].toLowerCase() || e.nome.toLowerCase().includes(escDom[0].toLowerCase()));
      if (escObj) {
        linhas.push(`
🔍 PADRÃO IDENTIFICADO: ${escObj.nome}`);
        linhas.push(escObj.devolutiva);
        linhas.push(`
🌱 FOCO DESTA SEMANA`);
        linhas.push(escObj.expressoes?.[0] ? `Observa quando sentes: "${escObj.expressoes[0]}". Regista sem julgamento.` : "");
      }
    }
    const relatorio = linhas.join("\n");
    await onGuardar(cfg.nome, { respostas, relatorio, estado: estadoPred, escudoDominante: escDom?.[0] });
    setGuardando(false);
  };

  return (
    <div className="fade" style={{paddingBottom:80}}>
      {/* Header */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:800,color:"#c8a8f0"}}>{cfg.icone} {cfg.nome}</div>
          <div style={{fontSize:9,color:"#7a5a9a"}}>{paciente?.nome}</div>
        </div>
        <div style={{fontSize:10,color:"#5a7a9a"}}>{passo+1}/{total}</div>
      </div>

      {/* Progresso */}
      <div style={{background:"#1a0a2e",borderRadius:6,height:4,marginBottom:14}}>
        <div style={{background:`linear-gradient(90deg,${cfg.cor},#9a5ae0)`,height:4,borderRadius:6,width:prog+"%",transition:"width .3s"}}/>
      </div>

      {/* Passo actual */}
      {p && (
        <div className="card" style={{borderColor:cfg.cor+"60",minHeight:200}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:6}}>{p.titulo}</div>
          <div style={{fontSize:12,color:"#7a5a9a",marginBottom:14,lineHeight:1.6}}>{p.pergunta}</div>

          {p.tipo === "texto" && (
            <textarea className="inp" rows={4} value={respostas[p.id]||""} onChange={e=>r(p.id,e.target.value)} placeholder="Escreve aqui..." style={{resize:"vertical"}}/>
          )}
          {p.tipo === "notas" && (
            <textarea className="inp" rows={4} value={respostas[p.id]||""} onChange={e=>r(p.id,e.target.value)} placeholder="(visível apenas para ti)" style={{resize:"vertical",borderColor:"#2a1a4c"}}/>
          )}
          {p.tipo === "escala" && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Array.from({length:p.max-p.min+1},(_,i)=>p.min+i).map(n=>(
                <button key={n} onClick={()=>r(p.id,n)} style={{width:42,height:42,borderRadius:8,border:`2px solid ${respostas[p.id]===n?cfg.cor:"#1a0a2e"}`,background:respostas[p.id]===n?cfg.cor+"30":"#050810",color:respostas[p.id]===n?"#c8a8f0":"#5a7a9a",fontWeight:700,cursor:"pointer",fontSize:14}}>{n}</button>
              ))}
            </div>
          )}
          {p.tipo === "escolha" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {p.opcoes.map(op=>(
                <div key={op.id} onClick={()=>r(p.id,op.id)} style={{padding:"12px 14px",borderRadius:9,border:`2px solid ${respostas[p.id]===op.id?cfg.cor:"#1a0a2e"}`,background:respostas[p.id]===op.id?cfg.cor+"20":"#050810",cursor:"pointer",transition:"all .15s"}}>
                  <div style={{fontWeight:700,fontSize:12,color:respostas[p.id]===op.id?"#c8a8f0":"#8ba3c0"}}>{op.label}</div>
                  <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{op.desc}</div>
                </div>
              ))}
            </div>
          )}
          {p.tipo === "multiplo" && (
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {p.opcoes.map(op=>{
                const sels = Array.isArray(respostas[p.id])?respostas[p.id]:[];
                const sel = sels.includes(op);
                return <div key={op} onClick={()=>r(p.id,sel?sels.filter(s=>s!==op):[...sels,op])} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${sel?cfg.cor:"#1a0a2e"}`,background:sel?cfg.cor+"15":"#050810",cursor:"pointer",fontSize:11,color:sel?"#c8a8f0":"#5a7a9a",fontWeight:sel?700:400}}>{sel?"✓ ":""}{op}</div>;
              })}
            </div>
          )}
          {p.tipo === "escudos" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {ESCUDOS.map(e=>(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#050810",border:"1px solid #1a0a2e",borderRadius:8}}>
                  <div style={{flex:1,fontSize:11,color:"#8ba3c0",fontWeight:600}}>{e.nome}</div>
                  <div style={{display:"flex",gap:3}}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <button key={n} onClick={()=>r(p.id,{...(respostas[p.id]||{}),[e.nome]:n})} style={{width:22,height:22,borderRadius:4,border:`1px solid ${(respostas[p.id]||{})[e.nome]===n?cfg.cor:"#1a0a2e"}`,background:(respostas[p.id]||{})[e.nome]===n?cfg.cor+"40":"#0a0e18",color:(respostas[p.id]||{})[e.nome]===n?"#c8a8f0":"#3d5a7a",fontSize:9,cursor:"pointer",fontWeight:700}}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {p.tipo === "perguntas_ad" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(PERGUNTAS_AD[respostas["s2"]] || PERGUNTAS_AD.misto).map((q,i)=>(
                <div key={i}>
                  <div style={{fontSize:10,color:"#9a7ab8",marginBottom:4,lineHeight:1.5}}>{i+1}. {q}</div>
                  <textarea className="inp" rows={2} value={(respostas[p.id]||{})[i]||""} onChange={e=>r(p.id,{...(respostas[p.id]||{}),[i]:e.target.value})} style={{resize:"vertical",margin:0}} placeholder="Resposta..."/>
                </div>
              ))}
            </div>
          )}
          {p.tipo === "escolha_livre" && (
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
              {p.opcoes.map(op=>(
                <div key={op} onClick={()=>r(p.id,op)} style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${respostas[p.id]===op?cfg.cor:"#1a0a2e"}`,background:respostas[p.id]===op?cfg.cor+"15":"#050810",cursor:"pointer",fontSize:11,color:respostas[p.id]===op?"#c8a8f0":"#5a7a9a"}}>{op}</div>
              ))}
              <textarea className="inp" rows={2} value={typeof respostas[p.id]==="string"&&!p.opcoes.includes(respostas[p.id])?respostas[p.id]:""} onChange={e=>r(p.id,e.target.value)} placeholder="Ou descreve..." style={{margin:0,resize:"vertical"}}/>
            </div>
          )}
        </div>
      )}

      {/* Navegação */}
      <div style={{display:"flex",gap:8,marginTop:14}}>
        {passo>0 && <button className="btn btn-s" style={{flex:1}} onClick={()=>setPasso(i=>i-1)}>← Anterior</button>}
        {passo<total-1
          ? <button className="btn btn-p" style={{flex:2,background:cfg.cor,borderColor:cfg.cor}} onClick={()=>setPasso(i=>i+1)}>Próximo →</button>
          : <button className="btn btn-p" style={{flex:2,background:cfg.cor,borderColor:cfg.cor}} onClick={finalizar} disabled={guardando}>{guardando?"A guardar...":"✅ Finalizar Sessão"}</button>
        }
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// 🔮 MÓDULO HIKARI FAFE — ATENDIMENTO RADIESTÉSICO & LIMPEZA ENERGÉTICA
// Pêndulo · 72 Nomes de Deus · Etiquetas Hebraicas · Reiki · Chakras
// Módulo exclusivo — protegido por has_exclusive_therapy_access
// ═══════════════════════════════════════════════════════════════════════════

// ─── BASE DE CONHECIMENTO ───────────────────────────────────────────────────

const INTERFERENCIAS_ENERGETICAS = [
  { n:"01", nome:"Larvas Astrais",    sintoma:"Pensamentos repetitivos que sugam. Cansaço extremo.",                    diagnostico:"Parasitas mentais alimentados por vícios ou pensamentos de baixa vibração." },
  { n:"02", nome:"Miasmas",           sintoma:"Sinto-me doente e pesado, sem explicação.",                              diagnostico:"Sujidade energética acumulada no corpo etérico. Imunidade espiritual e física em queda." },
  { n:"03", nome:"Inveja / Olho Gordo",sintoma:"Tudo se parte, os caminhos travam do nada.",                           diagnostico:"Cobiça e projeção de escassez de terceiros. Alguém quer o que o consultante tem." },
  { n:"04", nome:"Magia Consciente",  sintoma:"Sinto que algo ou alguém me está a atacar.",                            diagnostico:"Ataque energético intencional. Trabalho feito ou ritual direcionado para prejudicar." },
  { n:"05", nome:"Magia Inconsciente",sintoma:"Não consigo avançar, sinto um peso nas costas.",                        diagnostico:"Praga rogada ou ódio profundo. A intenção pesou sem ritual." },
  { n:"06", nome:"Magia Ritual",      sintoma:"Sinto uma escuridão e um bloqueio total na vida.",                      diagnostico:"Magia negra ou rituais de amarração/destruição. Exige limpeza profunda." },
  { n:"07", nome:"Auto-Sabotagem",    sintoma:"Eu tento, mas sou sempre eu a estragar tudo.",                          diagnostico:"O inimigo é interno. Crenças limitantes e síndrome de impostor a bloquear o sucesso." },
  { n:"08", nome:"Contratos Cármicos",sintoma:"Parece que a minha vida anda em ciclos repetitivos.",                   diagnostico:"Dívida ou padrão de vidas passadas/antepassados. A lição ainda não foi aprendida." },
  { n:"09", nome:"Obsessão (Mental)", sintoma:"Não tiro este problema/pessoa da cabeça.",                              diagnostico:"Fixação mental extrema. O campo está bloqueado por esta obsessão." },
  { n:"10", nome:"Obsessores",        sintoma:"Tenho mudanças de humor repentinas e impulsos estranhos.",               diagnostico:"Entidades desencarnadas agarradas à aura. Estão a alimentar-se da energia vital." },
  { n:"11", nome:"Geopatias",         sintoma:"Não durmo bem. A minha casa suga-me.",                                  diagnostico:"O ambiente está doente. Linhas telúricas, veias de água, memórias no solo." },
  { n:"12", nome:"Campo Elétrico",    sintoma:"Estou sempre ansioso e com névoa mental.",                              diagnostico:"Poluição eletromagnética (Wi-Fi, ecrãs, antenas) a desregular o sistema nervoso central." },
  { n:"13", nome:"Efeito Bumerangue",sintoma:"Fiz algo no passado e a minha vida parou.",                              diagnostico:"Retorno kármico. O consultor enviou/encomendou magia no passado e o efeito voltou." },
  { n:"14", nome:"Semente Fértil",    sintoma:"Sinto uma energia nova no meu ventre/corpo.",                           diagnostico:"Energia altamente propícia para a geração de vida (gravidez) ou criação de um grande projeto." },
  { n:"15", nome:"Alerta Somático",   sintoma:"O meu corpo está a dar sinais estranhos.",                              diagnostico:"O bloqueio energético já desceu para a matéria. Urgência: fazer check-up físico." },
];

const CHAKRAS_BLOQUEIO = [
  { n:1, nome:"Raiz", aspecto:"Segurança", bloqueio:"Falta de base, medo da fome ou falência. A energia está a flutuar em pânico sobre o futuro material.", cura:"Pés descalços na terra/relva 5 min diários. Enraizar para voltar a confiar na providência." },
  { n:2, nome:"Sacro", aspecto:"Emoção", bloqueio:"Alegria estagnada. Rigidez, culpa profunda ou bloqueio sexual. O fluxo criativo está morto.", cura:"Beber mais água e movimentar as ancas (dançar/alongar). Permitir que a emoção saia da estagnação." },
  { n:3, nome:"Plexo Solar", aspecto:"Poder", bloqueio:"Desistência do poder pessoal. Submissão, ansiedade severa e vontade de controlar o incontrolável.", cura:"Apanhar sol na barriga. Dizer um 'NÃO' assertivo hoje. Proteger o umbigo em multidões." },
  { n:4, nome:"Cardíaco", aspecto:"Amor", bloqueio:"Coração blindado pela dor. Mágoas não digeridas, lutos pendentes e recusa em confiar de novo.", cura:"Praticar o perdão (a si e aos outros). Mão no peito, respirar fundo e decretar: 'Eu liberto a dor.'" },
  { n:5, nome:"Laríngeo", aspecto:"Verdade", bloqueio:"Silenciamento. 'Engolir sapos'. A verdade presa na garganta está a sufocar o caminho do indivíduo.", cura:"Falar, cantar, gritar ou escrever o que está preso e queimar o papel. A voz tem de ser ouvida." },
  { n:6, nome:"Terceiro Olho", aspecto:"Mente", bloqueio:"Excesso de racionalização. Insónias, hipervigilância e cegueira espiritual (não ouve a intuição).", cura:"Silêncio absoluto por 5 minutos. Desligar ecrãs antes de dormir. Render a lógica à intuição." },
  { n:7, nome:"Coronário", aspecto:"Fé", bloqueio:"Vazio existencial severo. Desconexão da Fonte, sensação de abandono divino e perda de sentido.", cura:"Agradecer 3 coisas simples ao acordar. Religar a 'antena' humana ao Divino." },
  { n:8, nome:"Estrela da Alma", aspecto:"Propósito", bloqueio:"Vida no piloto automático. A alma exige alinhamento com a sua missão, mas o ego resiste.", cura:"Investir tempo naquilo que faz os olhos brilhar. Honrar a vocação e abandonar o modo 'sobrevivência'." },
  { n:9, nome:"Portal Estelar", aspecto:"Proteção", bloqueio:"Campo aberto e rasgado. O paciente é uma esponja de tudo o que é denso à sua volta.", cura:"Criar um escudo. Visualizar uma redoma dourada diariamente. Elevar a vibração sem negociações." },
];

const ABERTURA_CAMINHOS = [
  { n:1, pct:"0% a 30%",  prazo:"Longo Prazo",  leitura:"Caminho fortemente bloqueado. Exige de 6 meses a mais de 1 ano. Sem mudanças radicais nas atitudes ou limpeza energética, não vai acontecer." },
  { n:2, pct:"31% a 60%", prazo:"Médio Prazo",  leitura:"Resistência ativa. Vai levar de 3 a 6 meses. O Universo pede que o paciente altere uma rota, limpe a mente ou corrija um comportamento antes da entrega." },
  { n:3, pct:"61% a 90%", prazo:"Curto Prazo",  leitura:"O campo magnético está favorável. Manifestação nas próximas semanas ou num mês máximo. A energia já desceu da mente para a matéria. Mantém o foco." },
  { n:4, pct:"91% a 100%",prazo:"Imediato",     leitura:"O caminho está rasgado e aberto. Manifestação em dias ou horas. Não há atritos. A Fonte abençoa a materialização instantânea." },
];

const ETIQUETAS_HEBRAICAS = [
  "Libertar mágoas","Libertar ressentimentos","Perdoar","Limpar Karma","Eliminar fobias","Paciência",
  "Não sentir culpa","Libertar memórias dolorosas do passado","Vontade","Sabedoria","Libertação","Prosperidade",
  "Abundância","Rejuvenescimento celular","Coragem","Tolerância","Pensamentos positivos","Libertar medos",
  "Reconciliação","Força interior","Confiança","Compaixão","Gratidão","Auto-estima","Aceitação","Respeito",
  "Responsabilidade","Regeneração Celular","Segurança",
];

const NOMES_DEUS_SINTOMAS = {
  "Ansiedade": ["Eliminando Pensamentos Negativos (#4)","Sem Medo (#36)","Seguindo em Frente (#58)"],
  "Depressão": ["Jogando Fora a Depressão (#16)","Liberdade (#60)","DNA da Alma (#7)"],
  "Trauma": ["Viagem no Tempo (#1)","Memórias (#32)","Certeza Absoluta (#46)"],
  "Raiva": ["Dissipando a Raiva (#56)","Eliminando o Ódio (#29)","Neutralizando Energia Negativa (#8)"],
  "Medo": ["Sem Medo (#36)","Revelando o Oculto (#42)","Certeza Absoluta (#46)"],
  "Bloqueio financeiro": ["Sócia Silenciosa (#27)","O Poder da Prosperidade (#45)","Circuito (#38)"],
  "Relacionamentos": ["Alma Gémea (#28)","Amor Incondicional (#12)","Eliminando o Ódio (#29)"],
  "Falta de energia": ["Resgatando as Centelhas (#2)","Influências Angelicais (#9)","Agua (#61)"],
  "Autoestima": ["Auto-estima (#41)","Grande Fuga (#17)","Projetando Imagem Positiva (#64)"],
  "Propósito/vazio": ["Disque Deus (#19)","DNA da Alma (#7)","Cordão Umbilical (#59)"],
  "Saúde física": ["Cura (#5)","Água (#61)","Olhares Podem Matar (#10)"],
  "Vício": ["Vencendo os Vícios (#20)","Grande Fuga (#17)","Erradicando a Praga (#21)"],
};

// ─── EXECUTOR DO MÉTODO HIKARI ─────────────────────────────────────────────

const FASES_HIKARI = [
  { id:"f0", tipo:"triagem", nome:"Triagem / 1ª Consulta", icone:"🔮", cor:"#4a1a7c",
    desc:"Medição de Energia Bovis · Pesquisa de Interferências (1-15) · Chakras · Abertura de Caminhos · Escolha de Etiquetas" },
  { id:"f1", tipo:"mapeamento_frente", nome:"2ª Consulta — Mapeamento (Frente)", icone:"🗺️", cor:"#1a4a7c",
    desc:"Mapeamento Frente: Sistemas Superior · Central · Inferior · Escudo · Quando/Idade · Reiki · Bovis" },
  { id:"f2", tipo:"mapeamento_costas", nome:"3ª Consulta — Mapeamento (Costas)", icone:"🔄", cor:"#1a5a4c",
    desc:"Mapeamento Costas: mesmo protocolo · Reiki · Alinhamento Chakras · Fechar Aura · Bovis final" },
  { id:"f3", tipo:"mapeamento_completo", nome:"4ª Consulta — Mapeamento Completo", icone:"✨", cor:"#5a3a1a",
    desc:"Frente + Costas · Protocolo completo · Avaliação de alta · Bovis final ≥ 10.000?" },
  { id:"f4", tipo:"acompanhamento", nome:"Acompanhamento Entre Consultas", icone:"📊", cor:"#3a3a1a",
    desc:"Verificação rápida: Interferências · Chakras · Abertura Caminhos · Bovis · Reforço se necessário" },
];

function ModuloHikariExecutor({ fase, paciente, user, consultaAnterior, onGuardar, onVoltar }) {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState({
    bovis_antes: null, bovis_depois: null,
    interferencias: [], // ids detectados
    chakras_bloqueados: [], // ids
    abertura_caminhos: null, // n: 1-4
    etiquetas_escolhidas: [], // strings
    notas_terapeuta: "",
    protocolo_livre: "",
    focos_nomes_deus: [], // strings
    escudo_emocional: "",
    quando_idade: "",
    // Para mapeamento
    pontos_frente: {}, pontos_costas: {},
    reiki_feito: false, alinhamento_feito: false, aura_fechada: false,
    alta: null, // "sim" | "nao" | "reforco"
  });
  const [guardando, setGuardando] = useState(false);
  const d = (k, v) => setDados(prev => ({...prev, [k]: v}));
  const toggleArr = (k, v) => setDados(prev => ({ ...prev, [k]: prev[k].includes(v) ? prev[k].filter(x=>x!==v) : [...prev[k], v] }));

  const cor = fase.cor;

  // ─── ETAPAS ────────────────────────────────────────────────────
  const ETAPAS_TRIAGEM = [
    "bovis_antes", "interferencias", "chakras", "abertura", "nomes_deus", "etiquetas", "protocolo", "bovis_depois", "notas"
  ];
  const ETAPAS_MAPEAMENTO = [
    "bovis_antes", "pontos", "escudo", "quando_idade", "reiki", "chakras_alinhamento", "aura", "bovis_depois", "notas"
  ];
  const ETAPAS_ACOMP = [
    "bovis_antes", "interferencias", "chakras", "abertura", "bovis_depois", "notas", "alta"
  ];
  const etapas = fase.tipo === "triagem" ? ETAPAS_TRIAGEM : fase.tipo === "acompanhamento" ? ETAPAS_ACOMP : ETAPAS_MAPEAMENTO;
  const totalEtapas = etapas.length;
  const etapaAtual = etapas[etapa];
  const prog = Math.round(((etapa+1)/totalEtapas)*100);

  const finalizar = async () => {
    setGuardando(true);
    // Gerar relatório automático
    const relatorio = gerarRelatorioHikari(fase, dados, paciente, consultaAnterior);
    const protocolo = gerarProtocoloHikari(fase, dados);
    await onGuardar(fase.nome, { dados, relatorio, protocolo, fase: fase.id, bovis_antes: dados.bovis_antes, bovis_depois: dados.bovis_depois });
    setGuardando(false);
  };

  const Header = () => (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:"#dde4f0"}}>{fase.icone} {fase.nome}</div>
          <div style={{fontSize:9,color:"#7a5a9a"}}>{paciente?.nome} · Etapa {etapa+1}/{totalEtapas}</div>
        </div>
      </div>
      <div style={{background:"#1a0a2e",borderRadius:4,height:4}}>
        <div style={{background:`linear-gradient(90deg,${cor},#9a5ae0)`,height:4,borderRadius:4,width:prog+"%",transition:"width .3s"}}/>
      </div>
    </div>
  );

  // ─── RENDER POR ETAPA ──────────────────────────────────────────

  // BOVIS
  if (etapaAtual === "bovis_antes" || etapaAtual === "bovis_depois") {
    const k = etapaAtual; const label = etapaAtual === "bovis_antes" ? "Antes da Sessão" : "Após a Sessão";
    const val = dados[k];
    const RANGES = [
      {min:0,max:999,label:"< 1.000",cor:"#f87171",sig:"Campo muito baixo. Doença iminente ou ativa."},
      {min:1000,max:3499,label:"1.000 – 3.500",cor:"#fb923c",sig:"Baixa vitalidade. Sinais físicos e emocionais."},
      {min:3500,max:6499,label:"3.500 – 6.500",cor:"#fbbf24",sig:"Campo médio. Vida normal mas sem brilho."},
      {min:6500,max:9999,label:"6.500 – 10.000",cor:"#a3e635",sig:"Boa vitalidade. Campo em expansão."},
      {min:10000,max:99999,label:"≥ 10.000",cor:"#5ae0d8",sig:"Campo saudável. Alta vibração. Alta terapêutica possível."},
    ];
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>⚡ Energia Bovis — {label}</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:12}}>Mede com o pêndulo e insere o valor lido na escala bovis:</div>
          <input className="inp" type="number" min="0" max="99999" placeholder="Ex: 6500" value={val||""}
            onChange={e=>d(k, parseInt(e.target.value)||null)} style={{marginBottom:10,fontSize:16,textAlign:"center"}}/>
          {val > 0 && (() => {
            const r = RANGES.find(r=>val>=r.min&&val<=r.max) || RANGES[RANGES.length-1];
            return <div style={{padding:10,background:r.cor+"20",border:`1px solid ${r.cor}40`,borderRadius:8,textAlign:"center"}}>
              <div style={{fontWeight:700,color:r.cor,fontSize:13}}>{r.label}</div>
              <div style={{fontSize:10,color:"#8ba3c0",marginTop:4}}>{r.sig}</div>
              {etapaAtual==="bovis_depois" && consultaAnterior?.dados?.bovis_depois &&
                <div style={{fontSize:10,color:"#5ae0d8",marginTop:6}}>
                  Anterior: {consultaAnterior.dados.bovis_depois} → Atual: {val} ({val>=consultaAnterior.dados.bovis_depois?"📈 Subiu":"📉 Desceu"})
                </div>}
            </div>;
          })()}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // INTERFERÊNCIAS
  if (etapaAtual === "interferencias") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🔍 Pesquisa de Interferências Energéticas (1 a 15)</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Onde está o parasita ou o bloqueio no campo? Selecciona as que o pêndulo detetar:</div>
          {INTERFERENCIAS_ENERGETICAS.map(ie=>{
            const sel = dados.interferencias.includes(ie.nome);
            return <div key={ie.n} onClick={()=>toggleArr("interferencias",ie.nome)}
              style={{display:"flex",gap:8,padding:"8px 10px",marginBottom:5,borderRadius:8,border:`1px solid ${sel?cor+"80":"#1a0a2e"}`,background:sel?cor+"15":"#050810",cursor:"pointer",transition:"all .15s"}}>
              <div style={{fontSize:12,fontWeight:800,color:sel?"#c8a8f0":"#3d5a7a",flexShrink:0,width:24}}>{ie.n}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:sel?"#c8a8f0":"#8ba3c0"}}>{ie.nome}</div>
                <div style={{fontSize:9,color:"#5a3a7a"}}>{ie.sintoma}</div>
              </div>
              {sel&&<div style={{fontSize:14,color:cor}}>✓</div>}
            </div>;
          })}
          {dados.interferencias.length>0&&<div style={{marginTop:8,padding:8,background:"#0a0518",borderRadius:6,fontSize:9,color:"#9a7ab8"}}>
            Detectadas: {dados.interferencias.join(" · ")}
          </div>}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // CHAKRAS
  if (etapaAtual === "chakras" || etapaAtual === "chakras_alinhamento") {
    const isAlinha = etapaAtual === "chakras_alinhamento";
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>
            {isAlinha ? "🌀 Alinhamento de Chakras" : "🌀 Pesquisa de Chakras com Bloqueio (1 a 9)"}
          </div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>
            {isAlinha ? "Marca os chakras alinhados nesta sessão:" : "Qual é o centro de poder que está a sangrar energia?"}
          </div>
          {CHAKRAS_BLOQUEIO.map(c=>{
            const sel = (isAlinha ? dados.chakras_alinhados||[] : dados.chakras_bloqueados).includes(c.nome);
            const k2 = isAlinha ? "chakras_alinhados" : "chakras_bloqueados";
            return <div key={c.n} onClick={()=>toggleArr(k2,c.nome)}
              style={{display:"flex",gap:8,padding:"9px 10px",marginBottom:5,borderRadius:8,border:`1px solid ${sel?cor+"80":"#1a0a2e"}`,background:sel?cor+"15":"#050810",cursor:"pointer"}}>
              <div style={{fontSize:12,fontWeight:800,color:sel?"#c8a8f0":"#3d5a7a",flexShrink:0,width:20}}>{c.n}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:sel?"#c8a8f0":"#8ba3c0"}}>{c.nome} <span style={{fontSize:9,color:"#7a5a9a"}}>({c.aspecto})</span></div>
                {sel&&!isAlinha&&<div style={{fontSize:9,color:"#9a7ab8",marginTop:2}}>{c.cura}</div>}
              </div>
              {sel&&<div style={{fontSize:14,color:cor}}>✓</div>}
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // ABERTURA CAMINHOS
  if (etapaAtual === "abertura") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🛤️ Abertura de Caminhos</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Medição com pêndulo — que percentagem indica?</div>
          {ABERTURA_CAMINHOS.map(a=>{
            const sel = dados.abertura_caminhos === a.n;
            return <div key={a.n} onClick={()=>d("abertura_caminhos",a.n)}
              style={{padding:"11px 13px",marginBottom:7,borderRadius:9,border:`2px solid ${sel?cor:"#1a0a2e"}`,background:sel?cor+"20":"#050810",cursor:"pointer",transition:"all .15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div style={{fontWeight:800,fontSize:13,color:sel?"#c8a8f0":"#8ba3c0"}}>{a.pct}</div>
                <div style={{fontSize:11,fontWeight:700,color:sel?"#9a7ab8":"#3d5a7a"}}>{a.prazo}</div>
              </div>
              <div style={{fontSize:10,color:"#7a5a9a",lineHeight:1.5}}>{a.leitura}</div>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // NOMES DE DEUS SUGERIDOS
  if (etapaAtual === "nomes_deus") {
    // Sugerir com base nas interferências e chakras detectados
    const focosDetectados = new Set();
    dados.interferencias.forEach(i => {
      if (i.includes("Magia")) focosDetectados.add("Bloqueio financeiro");
      if (i.includes("Ansiedade") || i.includes("Obsessão")) focosDetectados.add("Ansiedade");
      if (i.includes("Auto-Sabotagem")) focosDetectados.add("Autoestima");
    });
    dados.chakras_bloqueados.forEach(c => {
      if (c === "Cardíaco") focosDetectados.add("Relacionamentos");
      if (c === "Coronário" || c === "Estrela da Alma") focosDetectados.add("Propósito/vazio");
      if (c === "Raiz") focosDetectados.add("Medo");
    });
    const sugeridos = [...focosDetectados].flatMap(f => NOMES_DEUS_SINTOMAS[f] || []);
    const todos = Object.entries(NOMES_DEUS_SINTOMAS);
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🔮 72 Nomes de Deus — Foco de Cura</div>
          {sugeridos.length>0&&<div style={{background:"#1a0a2e",borderRadius:6,padding:8,marginBottom:8}}>
            <div style={{fontSize:9,color:"#9a7ab8",marginBottom:5}}>✨ SUGERIDOS com base no que detetaste:</div>
            {sugeridos.map(s=>{
              const sel = dados.focos_nomes_deus.includes(s);
              return <div key={s} onClick={()=>toggleArr("focos_nomes_deus",s)}
                style={{padding:"5px 8px",marginBottom:3,borderRadius:6,border:`1px solid ${sel?cor+"80":"#2a0a4c"}`,background:sel?cor+"15":"transparent",cursor:"pointer",fontSize:10,color:sel?"#c8a8f0":"#7a5a9a"}}>{sel?"✓ ":""}{s}</div>;
            })}
          </div>}
          <div style={{fontSize:10,color:"#5a3a7a",marginBottom:6}}>Ou escolhe por tema:</div>
          {todos.map(([tema,nomes])=>(
            <div key={tema} style={{marginBottom:8}}>
              <div style={{fontSize:9,color:"#7a5a9a",fontWeight:700,marginBottom:4}}>{tema}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {nomes.map(n=>{const sel=dados.focos_nomes_deus.includes(n);return <div key={n} onClick={()=>toggleArr("focos_nomes_deus",n)} style={{padding:"3px 8px",borderRadius:12,border:`1px solid ${sel?cor:"#1a0a2e"}`,background:sel?cor+"20":"#050810",cursor:"pointer",fontSize:9,color:sel?"#c8a8f0":"#5a7a9a"}}>{n}</div>;})}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // ETIQUETAS HEBRAICAS
  if (etapaAtual === "etiquetas") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🏷️ Etiquetas Hebraicas do Pêndulo</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Selecciona as etiquetas escolhidas para este protocolo (A1 a A29):</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            {ETIQUETAS_HEBRAICAS.map((et,i)=>{
              const sel=dados.etiquetas_escolhidas.includes(et);
              return <div key={et} onClick={()=>toggleArr("etiquetas_escolhidas",et)}
                style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${sel?cor:"#1a0a2e"}`,background:sel?cor+"20":"#050810",cursor:"pointer",fontSize:10,color:sel?"#c8a8f0":"#5a7a9a",fontWeight:sel?700:400}}>
                A{i+1} — {et}
              </div>;
            })}
          </div>
          <label style={{fontSize:10,color:"#5a7a9a",display:"block",marginBottom:4}}>Notas sobre as etiquetas / modo de uso:</label>
          <textarea className="inp" rows={2} value={dados.protocolo_livre} onChange={e=>d("protocolo_livre",e.target.value)} placeholder="Ex: A1 + A3 sobre o chakra cardíaco durante 7 dias..." style={{resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // PROTOCOLO LIVRE
  if (etapaAtual === "protocolo") {
    return (
      <div className="fade">
        <Header />
        <SugestaoProtocoloCard dados={dados} onAplicar={(sug)=>{
          const extra = [...sug.audios,...sug.cuidados].join("\n");
          d("protocolo_livre",(dados.protocolo_livre?dados.protocolo_livre+"\n":"")+extra);
        }}/>
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>📋 Protocolo de Cura — Instruções Livres</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Adiciona as instruções específicas para este paciente (áudios, meditações, códigos numéricos, etc.):</div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,color:"#5a3a7a",marginBottom:6}}>Sugestões rápidas (toca para adicionar):</div>
            {["🎧 Áudio dos Medos e Gatilhos (modulação neuroplástica)",
              "🌱 Meditação de Enraizamento — 5 min de manhã antes de se levantar",
              "🌀 Meditação guiada de Reiki",
              "🔢 Códigos numéricos dos 7 chakras principais",
              "🏷️ Etiquetas hebraicas conforme escolhidas acima",
              "💧 Beber 2L de água por dia durante o protocolo",
              "🌿 Pés descalços na terra 5 min diários (enraizamento)",
            ].map(s=>(
              <div key={s} onClick={()=>d("protocolo_livre",(dados.protocolo_livre?dados.protocolo_livre+"\n":"")+s)}
                style={{padding:"6px 10px",marginBottom:4,borderRadius:6,border:"1px solid #1a0a2e",background:"#050810",cursor:"pointer",fontSize:10,color:"#7a5a9a"}}>
                + {s}
              </div>
            ))}
          </div>
          <textarea className="inp" rows={5} value={dados.protocolo_livre} onChange={e=>d("protocolo_livre",e.target.value)} placeholder="Protocolo personalizado..." style={{resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // REIKI / PONTOS
  if (etapaAtual === "reiki") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:10}}>✨ Reiki & Desbloqueio de Pontos</div>
          {[
            ["reiki_feito","✨ Reiki realizado nesta sessão"],
            ["alinhamento_feito","🌀 Alinhamento de chakras realizado"],
          ].map(([k2,label])=>(
            <div key={k2} onClick={()=>d(k2,!dados[k2])} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",marginBottom:6,borderRadius:8,border:`1px solid ${dados[k2]?cor+"80":"#1a0a2e"}`,background:dados[k2]?cor+"15":"#050810",cursor:"pointer"}}>
              <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${dados[k2]?cor:"#3a1a5c"}`,background:dados[k2]?cor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{dados[k2]&&"✓"}</div>
              <div style={{fontSize:11,color:dados[k2]?"#c8a8f0":"#8ba3c0"}}>{label}</div>
            </div>
          ))}
          <label style={{fontSize:10,color:"#5a7a9a",marginTop:8,display:"block",marginBottom:4}}>Notas do terapeuta sobre os pontos trabalhados:</label>
          <textarea className="inp" rows={3} value={dados.notas_terapeuta} onChange={e=>d("notas_terapeuta",e.target.value)} placeholder="Pontos específicos, sensações, reações..." style={{resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // FECHAR AURA
  if (etapaAtual === "aura") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:10}}>🛡️ Fechar Aura</div>
          <div onClick={()=>d("aura_fechada",!dados.aura_fechada)} style={{display:"flex",gap:10,alignItems:"center",padding:"12px 14px",borderRadius:8,border:`1px solid ${dados.aura_fechada?cor+"80":"#1a0a2e"}`,background:dados.aura_fechada?cor+"15":"#050810",cursor:"pointer"}}>
            <div style={{width:22,height:22,borderRadius:4,border:`2px solid ${dados.aura_fechada?cor:"#3a1a5c"}`,background:dados.aura_fechada?cor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{dados.aura_fechada&&"✓"}</div>
            <div style={{fontSize:12,color:dados.aura_fechada?"#c8a8f0":"#8ba3c0",fontWeight:700}}>🛡️ Aura fechada e selada</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // NOTAS FINAIS
  if (etapaAtual === "notas") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>📝 Notas do Terapeuta</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:8}}>Observações clínicas, percepções intuitivas, próximos passos (visível apenas para ti):</div>
          <textarea className="inp" rows={5} value={dados.notas_terapeuta} onChange={e=>d("notas_terapeuta",e.target.value)} placeholder="Notas privadas..." style={{resize:"vertical",marginBottom:12}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // AVALIAÇÃO DE ALTA
  if (etapaAtual === "alta") {
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:10}}>🎯 Avaliação de Alta</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Com base em toda a avaliação de hoje (Bovis, interferências, chakras, caminhos):</div>
          {[
            {id:"alta",label:"✅ ALTA — Campo saneado. Bovis ≥ 10.000.",cor:"#5ae0d8"},
            {id:"reforco",label:"🔄 REFORÇO — Campo em melhoria. Continuar protocolo.",cor:"#fbbf24"},
            {id:"nao",label:"⚠️ SEM ALTA — Limpeza incompleta. Agendar nova sessão.",cor:"#f87171"},
          ].map(o=>(
            <div key={o.id} onClick={()=>d("alta",o.id)} style={{padding:"12px 14px",marginBottom:7,borderRadius:9,border:`2px solid ${dados.alta===o.id?o.cor:"#1a0a2e"}`,background:dados.alta===o.id?o.cor+"20":"#050810",cursor:"pointer"}}>
              <div style={{fontSize:12,fontWeight:700,color:dados.alta===o.id?o.cor:"#8ba3c0"}}>{o.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={finalizar} disabled={guardando}>{guardando?"A guardar...":"✅ Finalizar & Gerar Relatório"}</button>
        </div>
      </div>
    );
  }

  // PONTOS DE MAPEAMENTO — usa o form existente adaptado
  if (etapaAtual === "pontos") {
    const face = fase.tipo === "mapeamento_costas" ? "costas" : "frente";
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:cor+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🗺️ Mapeamento — {face.charAt(0).toUpperCase()+face.slice(1)}</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:8}}>Sistemas Superior · Central · Inferior · Pontos de Entrada · Centros Vitais:</div>
          {["escudo_emocional","quando_idade"].map(k2=>(
            <div key={k2} style={{marginBottom:8}}>
              <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:4}}>
                {k2==="escudo_emocional"?"Escudo Emocional mais activo:":"Quando/Idade (época do trauma):"}
              </label>
              <input className="inp" value={dados[k2]||""} onChange={e=>d(k2,e.target.value)} placeholder={k2==="escudo_emocional"?"Ex: Impotência":"Ex: Infância, 7 anos, gestação..."}/>
            </div>
          ))}
          <label style={{fontSize:10,color:"#5a7a9a",display:"block",marginBottom:4}}>Pontos detectados:</label>
          <textarea className="inp" rows={4} value={dados.notas_terapeuta} onChange={e=>d("notas_terapeuta",e.target.value)} placeholder="Ex: S.Superior: Hipotálamo, Timo · S.Central: Estômago · S.Inferior: Rins · PE: Ombro dir, Costelas..." style={{resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        </div>
      </div>
    );
  }

  // FALLBACK
  return (
    <div className="fade">
      <Header />
      <div className="card"><div style={{textAlign:"center",padding:20,color:"#5a7a9a",fontSize:12}}>Etapa: {etapaAtual}</div></div>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
        {etapa<totalEtapas-1
          ? <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
          : <button className="btn btn-p" style={{flex:2,background:cor,borderColor:cor}} onClick={finalizar} disabled={guardando}>{guardando?"A guardar...":"✅ Finalizar"}</button>
        }
      </div>
    </div>
  );
}

// ─── GERADOR DE RELATÓRIO HIKARI ────────────────────────────────────────────

function gerarRelatorioHikari(fase, dados, paciente, anterior) {
  const L = [];
  const lin = (t) => L.push(t);
  const sep = () => lin("─".repeat(52));
  
  lin(`🔮 RELATÓRIO — ${fase.nome.toUpperCase()}`);
  lin(`Paciente: ${paciente?.nome} · Data: ${new Date().toLocaleDateString("pt-PT")}`);
  lin(`Terapeuta: ${paciente?.terapeuta_nome||"—"}`);
  sep();

  // Bovis
  if (dados.bovis_antes) {
    lin(`\n⚡ ENERGIA BOVIS`);
    lin(`  Antes: ${dados.bovis_antes}`);
    if (dados.bovis_depois) lin(`  Após:  ${dados.bovis_depois} (${dados.bovis_depois>=dados.bovis_antes?"📈 Subiu":"📉 Desceu"})`);
    if (anterior?.dados?.bovis_depois) lin(`  Consulta anterior: ${anterior.dados.bovis_depois}`);
  }

  // Interferências
  if (dados.interferencias?.length > 0) {
    lin(`\n🔍 INTERFERÊNCIAS ENERGÉTICAS DETECTADAS`);
    dados.interferencias.forEach(ie => {
      const data = INTERFERENCIAS_ENERGETICAS.find(x => x.nome === ie);
      lin(`  • ${ie}`);
      if (data) lin(`    Diagnóstico: ${data.diagnostico}`);
    });
  }

  // Chakras
  if (dados.chakras_bloqueados?.length > 0) {
    lin(`\n🌀 CHAKRAS COM BLOQUEIO DETECTADO`);
    dados.chakras_bloqueados.forEach(c => {
      const data = CHAKRAS_BLOQUEIO.find(x => x.nome === c);
      lin(`  • ${c}${data?" ("+data.aspecto+")":""}`);
      if (data) lin(`    Cura indicada: ${data.cura}`);
    });
  }

  // Abertura de caminhos
  if (dados.abertura_caminhos) {
    const ac = ABERTURA_CAMINHOS.find(a => a.n === dados.abertura_caminhos);
    if (ac) {
      lin(`\n🛤️ ABERTURA DE CAMINHOS`);
      lin(`  ${ac.pct} — ${ac.prazo}`);
      lin(`  ${ac.leitura}`);
    }
  }

  // Pontos de mapeamento
  if (dados.notas_terapeuta && fase.tipo.includes("mapeamento")) {
    lin(`\n🗺️ PONTOS MAPEADOS`);
    lin(`  ${dados.notas_terapeuta}`);
    if (dados.escudo_emocional) lin(`  Escudo activo: ${dados.escudo_emocional}`);
    if (dados.quando_idade) lin(`  Quando/Idade: ${dados.quando_idade}`);
  }

  // Procedimentos
  const procs = [];
  if (dados.reiki_feito) procs.push("Reiki");
  if (dados.alinhamento_feito || dados.chakras_alinhados?.length > 0) procs.push("Alinhamento de Chakras");
  if (dados.aura_fechada) procs.push("Fechar Aura");
  if (procs.length > 0) { lin(`\n✨ PROCEDIMENTOS REALIZADOS`); lin(`  ${procs.join(" · ")}`); }

  // Alta
  if (dados.alta) {
    lin(`\n🎯 AVALIAÇÃO DE ALTA`);
    const altaTexto = {alta:"✅ ALTA — Campo saneado.",reforco:"🔄 REFORÇO — Continuar protocolo.",nao:"⚠️ SEM ALTA — Nova sessão necessária."};
    lin(`  ${altaTexto[dados.alta]||dados.alta}`);
  }

  sep();
  lin(`\n📋 PARA O PACIENTE`);
  sep();
  lin(`\n🌱 PROTOCOLO ENTRE SESSÕES`);
  if (dados.protocolo_livre) { lin(dados.protocolo_livre); }
  else {
    lin("• Meditação de Enraizamento — 5 minutos de manhã, antes de se levantar");
    lin("• Beber 2L de água por dia durante o protocolo");
    if (dados.etiquetas_escolhidas?.length > 0) lin(`• Etiquetas hebraicas ativas: ${dados.etiquetas_escolhidas.join(", ")}`);
  }

  if (dados.focos_nomes_deus?.length > 0) {
    lin(`\n🔮 72 NOMES DE DEUS INDICADOS`);
    dados.focos_nomes_deus.forEach(n => lin(`  • ${n}`));
  }

  sep();
  lin("\n⚠️ AVISO: Este relatório é de carácter terapêutico complementar e não substitui avaliação médica.");
  return L.join("\n");
}

function gerarProtocoloHikari(fase, dados) {
  const L = [];
  L.push(`🔮 PROTOCOLO DE CURA — ${fase.nome}`);
  L.push(`Data: ${new Date().toLocaleDateString("pt-PT")}`);
  L.push("─".repeat(40));
  if (dados.etiquetas_escolhidas?.length > 0) {
    L.push("\n🏷️ ETIQUETAS HEBRAICAS PARA USAR:");
    dados.etiquetas_escolhidas.forEach((e,i) => L.push(`  ${i+1}. ${e}`));
  }
  if (dados.focos_nomes_deus?.length > 0) {
    L.push("\n🔮 72 NOMES DE DEUS:");
    dados.focos_nomes_deus.forEach(n => L.push(`  • ${n}`));
  }
  if (dados.protocolo_livre) { L.push("\n📋 INSTRUÇÕES:"); L.push(dados.protocolo_livre); }
  L.push("\n" + "─".repeat(40));
  L.push("Usa as etiquetas sobre os chakras identificados ou sobre os pontos detectados no mapeamento.");
  return L.join("\n");
}

// ─── PAINEL PRINCIPAL DO MÓDULO HIKARI ──────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════
// 🔯 TRABALHO À DISTÂNCIA — HON SHA ZE SHO NEN
// Pêndulo · Reiki à Distância · Etiquetas Hebraicas
// EXCLUSIVO: Hikari Fafe (Super Admin apenas)
// ═══════════════════════════════════════════════════════════════════════════

const INTENCOES_PADRAO = [
  "Desbloqueio e limpeza de amarras",
  "Justiça e resolução célere",
  "Limpeza de magia e interferências",
  "Abertura de caminhos — prosperidade",
  "Cura física e equilíbrio energético",
  "Proteção divina e blindagem do campo",
  "Libertação de contratos cármicos",
  "Alinhamento com o propósito de alma",
  "Restauração de vínculos familiares",
  "Saúde emocional e paz interior",
  "Concretização de projeto/negócio",
  "Resolução de herança / processo legal",
  "Reconexão espiritual com a Fonte",
];

const ETAPAS_TRABALHO = [
  { id:"testemunho", label:"📝 Dados do Testemunho" },
  { id:"bovis_antes", label:"⚡ Bovis Inicial" },
  { id:"interferencias_distancia", label:"🔍 Interferências Detectadas" },
  { id:"chakras_distancia", label:"🌀 Chakras em Bloqueio" },
  { id:"abertura_distancia", label:"🛤️ Abertura de Caminhos" },
  { id:"trabalho_realizado", label:"✨ Trabalho Realizado" },
  { id:"etiquetas_distancia", label:"🏷️ Etiquetas Aplicadas" },
  { id:"nomes_deus_distancia", label:"🔮 72 Nomes de Deus" },
  { id:"bovis_depois", label:"⚡ Bovis Final" },
  { id:"relatorio_distancia", label:"📋 Testemunho & Protocolo" },
];

function WorkDistanciaExecutor({ user, trabalhoInicial, onGuardar, onVoltar }) {
  const [etapa, setEtapa] = useState(0);
  // Pré-preencher dados do paciente se disponíveis
  const dadosIniciais = trabalhoInicial || {};
  const [dados, setDados] = useState({
    // Testemunho — pré-preenchido com dados do paciente
    nome_completo: dadosIniciais.nome_completo || paciente?.nome || "",
    data_nascimento: dadosIniciais.data_nascimento || paciente?.data_nascimento || "",
    intencoes: dadosIniciais.intencoes || [], intencao_livre: dadosIniciais.intencao_livre || "",
    local_referencia: dadosIniciais.local_referencia || "", processo_referencia: dadosIniciais.processo_referencia || "",
    foto_enviada: dadosIniciais.foto_enviada || false, objecto_testemunho: dadosIniciais.objecto_testemunho || false,
    // Medições
    bovis_antes: null, bovis_depois: null,
    interferencias: [], chakras_bloqueados: [],
    abertura_caminhos: null,
    // Trabalho
    hon_sha_ze_sho_nen: false,
    reiki_distancia: false,
    cho_ku_rei: false,
    sei_heki: false,
    pendulo_usado: false,
    duracao_minutos: 30,
    // Etiquetas e nomes
    etiquetas_escolhidas: [],
    focos_nomes_deus: [],
    // Notas
    notas_privadas: "",
    observacoes_pendulo: "",
    // Acompanhamento
    verificacoes: [], // array de {data, bovis, notas}
    alta_distancia: null,
  });
  const d = (k, v) => setDados(prev => ({...prev, [k]: v}));
  const toggleArr = (k, v) => setDados(prev => ({ ...prev, [k]: prev[k].includes(v) ? prev[k].filter(x=>x!==v) : [...prev[k], v] }));
  const [guardando, setGuardando] = useState(false);

  const etapaAtual = ETAPAS_TRABALHO[etapa];
  const total = ETAPAS_TRABALHO.length;
  const prog = Math.round(((etapa+1)/total)*100);
  const COR = "#4a1a7c";

  const Header = () => (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={onVoltar}>← Voltar</button>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:"#dde4f0"}}>🔯 {etapaAtual.label}</div>
          <div style={{fontSize:9,color:"#7a5a9a"}}>{dados.nome_completo||"Sem nome"} · Passo {etapa+1}/{total}</div>
        </div>
      </div>
      <div style={{background:"#1a0a2e",borderRadius:4,height:4}}>
        <div style={{background:`linear-gradient(90deg,${COR},#e040fb)`,height:4,borderRadius:4,width:prog+"%",transition:"width .3s"}}/>
      </div>
    </div>
  );

  const Navegacao = ({ultimoFinalizar}) => (
    <div style={{display:"flex",gap:8,marginTop:14}}>
      {etapa>0&&<button className="btn btn-s" style={{flex:1}} onClick={()=>setEtapa(i=>i-1)}>← Anterior</button>}
      {!ultimoFinalizar
        ? <button className="btn btn-p" style={{flex:2,background:COR,borderColor:COR}} onClick={()=>setEtapa(i=>i+1)}>Próximo →</button>
        : <button className="btn btn-p" style={{flex:2,background:COR,borderColor:COR}} onClick={async()=>{
            setGuardando(true);
            const rel = gerarRelatorioDistancia(dados);
            await onGuardar("Intervenção Energética — "+dados.nome_completo, { dados, relatorio: rel });
            setGuardando(false);
          }} disabled={guardando}>{guardando?"A guardar...":"🔯 Finalizar & Gerar Testemunho"}</button>
      }
    </div>
  );

  // ── ETAPA: TESTEMUNHO ─────────────────────────────────────────
  if (etapaAtual.id === "testemunho") return (
    <div className="fade">
      <Header />
      <div className="card" style={{borderColor:COR+"60"}}>
        <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:10}}>📝 Dados do Testemunho</div>
        <div style={{background:"#0a0518",border:"1px solid #3a1a5c",borderRadius:8,padding:10,marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#9a7ab8",fontStyle:"italic",letterSpacing:2}}>HON SHA ZE SHO NEN</div>
          <div style={{fontSize:9,color:"#5a3a7a",marginTop:2}}>Símbolo Reiki — Cura à Distância · O espaço e o tempo não existem</div>
        </div>
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:3}}>Nome Completo *</label>
        <input className="inp" value={dados.nome_completo} onChange={e=>d("nome_completo",e.target.value)} placeholder="Nome completo da pessoa" style={{marginBottom:8}}/>
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:3}}>Data de Nascimento</label>
        <input className="inp" type="date" value={dados.data_nascimento} onChange={e=>d("data_nascimento",e.target.value)} style={{marginBottom:8}}/>
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:3}}>Intenções (selecciona ou escreve)</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {INTENCOES_PADRAO.map(int=>{
            const sel=dados.intencoes.includes(int);
            return <div key={int} onClick={()=>toggleArr("intencoes",int)}
              style={{padding:"4px 9px",borderRadius:12,border:`1px solid ${sel?COR:"#1a0a2e"}`,background:sel?COR+"20":"#050810",cursor:"pointer",fontSize:9,color:sel?"#c8a8f0":"#5a7a9a",fontWeight:sel?700:400}}>
              {sel?"✓ ":""}{int}
            </div>;
          })}
        </div>
        <textarea className="inp" rows={2} value={dados.intencao_livre} onChange={e=>d("intencao_livre",e.target.value)} placeholder="Intenção específica adicional..." style={{resize:"vertical",marginBottom:8}}/>
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:3}}>Local / Imóvel / Referência</label>
        <input className="inp" value={dados.local_referencia} onChange={e=>d("local_referencia",e.target.value)} placeholder="Ex: Rua de Moçambique nº1, Almada" style={{marginBottom:8}}/>
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:3}}>Nº de Processo / Referência Legal</label>
        <input className="inp" value={dados.processo_referencia} onChange={e=>d("processo_referencia",e.target.value)} placeholder="Ex: Processo nº 6234/10.2 Tribunal de Almada"/>
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
          {[
            ["foto_enviada","📸 Foto do testemunho enviada / preparada"],
            ["objecto_testemunho","🕯️ Objecto de testemunho preparado (se aplicável)"],
          ].map(([k2,label])=>(
            <div key={k2} onClick={()=>d(k2,!dados[k2])} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 10px",borderRadius:7,border:`1px solid ${dados[k2]?COR+"60":"#1a0a2e"}`,background:dados[k2]?COR+"10":"#050810",cursor:"pointer"}}>
              <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${dados[k2]?COR:"#3a1a5c"}`,background:dados[k2]?COR:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{dados[k2]&&"✓"}</div>
              <div style={{fontSize:10,color:dados[k2]?"#c8a8f0":"#7a5a9a"}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <Navegacao />
    </div>
  );

  // ── BOVIS ─────────────────────────────────────────────────────
  if (etapaAtual.id === "bovis_antes" || etapaAtual.id === "bovis_depois") {
    const k = etapaAtual.id === "bovis_antes" ? "bovis_antes" : "bovis_depois";
    const label = etapaAtual.id === "bovis_antes" ? "Antes do Trabalho" : "Após o Trabalho";
    const val = dados[k];
    const RANGES = [
      {min:0,max:999,cor:"#f87171",sig:"Campo muito baixo — bloqueio severo."},
      {min:1000,max:3499,cor:"#fb923c",sig:"Baixa vitalidade — limpeza necessária."},
      {min:3500,max:6499,cor:"#fbbf24",sig:"Campo médio — em processo."},
      {min:6500,max:9999,cor:"#a3e635",sig:"Campo em expansão — evolução positiva."},
      {min:10000,max:999999,cor:"#5ae0d8",sig:"Campo saudável — alta vibração."},
    ];
    const r = val ? (RANGES.find(rx=>val>=rx.min&&val<=rx.max)||RANGES[RANGES.length-1]) : null;
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:COR+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>⚡ Energia Bovis — {label}</div>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>
            Mede o campo energético de {dados.nome_completo||"a pessoa"} com o pêndulo à distância:
          </div>
          <input className="inp" type="number" min="0" placeholder="Ex: 4500" value={val||""}
            onChange={e=>d(k,parseInt(e.target.value)||null)} style={{marginBottom:10,fontSize:18,textAlign:"center"}}/>
          {r && <div style={{padding:10,background:r.cor+"20",border:`1px solid ${r.cor}40`,borderRadius:8,textAlign:"center"}}>
            <div style={{fontWeight:700,color:r.cor,fontSize:13}}>{val}</div>
            <div style={{fontSize:10,color:"#8ba3c0",marginTop:3}}>{r.sig}</div>
            {etapaAtual.id==="bovis_depois"&&dados.bovis_antes&&
              <div style={{fontSize:11,color:val>=dados.bovis_antes?"#5ae0d8":"#f87171",marginTop:6,fontWeight:700}}>
                {val>=dados.bovis_antes?"📈 Subiu":"📉 Desceu"} {Math.abs(val-dados.bovis_antes)} unidades
              </div>}
          </div>}
        </div>
        <Navegacao />
      </div>
    );
  }

  // ── INTERFERÊNCIAS À DISTÂNCIA ────────────────────────────────
  if (etapaAtual.id === "interferencias_distancia") return (
    <div className="fade">
      <Header />
      <div className="card" style={{borderColor:COR+"60"}}>
        <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🔍 Interferências no Campo de {dados.nome_completo||"a pessoa"}</div>
        <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Pesquisa com pêndulo à distância — 1 a 15:</div>
        {INTERFERENCIAS_ENERGETICAS.map(ie=>{
          const sel=dados.interferencias.includes(ie.nome);
          return <div key={ie.n} onClick={()=>toggleArr("interferencias",ie.nome)}
            style={{display:"flex",gap:8,padding:"7px 10px",marginBottom:4,borderRadius:8,border:`1px solid ${sel?COR+"80":"#1a0a2e"}`,background:sel?COR+"15":"#050810",cursor:"pointer"}}>
            <div style={{fontSize:11,fontWeight:800,color:sel?"#c8a8f0":"#3d5a7a",width:22,flexShrink:0}}>{ie.n}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:700,color:sel?"#c8a8f0":"#8ba3c0"}}>{ie.nome}</div>
              {sel&&<div style={{fontSize:9,color:"#7a5a9a",marginTop:1}}>{ie.diagnostico}</div>}
            </div>
            {sel&&<div style={{color:COR,fontSize:12}}>✓</div>}
          </div>;
        })}
      </div>
      <Navegacao />
    </div>
  );

  // ── CHAKRAS À DISTÂNCIA ───────────────────────────────────────
  if (etapaAtual.id === "chakras_distancia") return (
    <div className="fade">
      <Header />
      <div className="card" style={{borderColor:COR+"60"}}>
        <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🌀 Chakras com Bloqueio</div>
        {CHAKRAS_BLOQUEIO.map(c=>{
          const sel=dados.chakras_bloqueados.includes(c.nome);
          return <div key={c.n} onClick={()=>toggleArr("chakras_bloqueados",c.nome)}
            style={{display:"flex",gap:8,padding:"8px 10px",marginBottom:4,borderRadius:8,border:`1px solid ${sel?COR+"80":"#1a0a2e"}`,background:sel?COR+"15":"#050810",cursor:"pointer"}}>
            <div style={{fontSize:11,fontWeight:800,color:sel?"#c8a8f0":"#3d5a7a",width:18,flexShrink:0}}>{c.n}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:700,color:sel?"#c8a8f0":"#8ba3c0"}}>{c.nome} <span style={{fontSize:8,color:"#5a3a7a"}}>({c.aspecto})</span></div>
              {sel&&<div style={{fontSize:9,color:"#9a7ab8",marginTop:1}}>Cura: {c.cura}</div>}
            </div>
            {sel&&<div style={{color:COR,fontSize:12}}>✓</div>}
          </div>;
        })}
      </div>
      <Navegacao />
    </div>
  );

  // ── ABERTURA DE CAMINHOS ──────────────────────────────────────
  if (etapaAtual.id === "abertura_distancia") return (
    <div className="fade">
      <Header />
      <div className="card" style={{borderColor:COR+"60"}}>
        <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:8}}>🛤️ Abertura de Caminhos</div>
        {ABERTURA_CAMINHOS.map(a=>{
          const sel=dados.abertura_caminhos===a.n;
          return <div key={a.n} onClick={()=>d("abertura_caminhos",a.n)}
            style={{padding:"11px 13px",marginBottom:6,borderRadius:9,border:`2px solid ${sel?COR:"#1a0a2e"}`,background:sel?COR+"20":"#050810",cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <div style={{fontWeight:800,fontSize:12,color:sel?"#c8a8f0":"#8ba3c0"}}>{a.pct}</div>
              <div style={{fontSize:10,color:sel?"#9a7ab8":"#3d5a7a"}}>{a.prazo}</div>
            </div>
            <div style={{fontSize:9,color:"#7a5a9a",lineHeight:1.5}}>{a.leitura}</div>
          </div>;
        })}
      </div>
      <Navegacao />
    </div>
  );

  // ── TRABALHO REALIZADO ────────────────────────────────────────
  if (etapaAtual.id === "trabalho_realizado") return (
    <div className="fade">
      <Header />
      <div className="card" style={{borderColor:COR+"60"}}>
        <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:10}}>✨ Trabalho Realizado</div>
        <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Marca o que foi feito nesta sessão à distância:</div>
        {[
          ["hon_sha_ze_sho_nen","🔯 HON SHA ZE SHO NEN — Reiki à distância activado"],
          ["reiki_distancia","🌀 Reiki à distância — canalização completa"],
          ["cho_ku_rei","⚡ CHO KU REI — Amplificação de poder"],
          ["sei_heki","💜 SEI HE KI — Harmonização mental/emocional"],
          ["pendulo_usado","🔮 Pêndulo usado durante todo o trabalho"],
        ].map(([k2,label])=>(
          <div key={k2} onClick={()=>d(k2,!dados[k2])}
            style={{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",marginBottom:6,borderRadius:8,border:`1px solid ${dados[k2]?COR+"80":"#1a0a2e"}`,background:dados[k2]?COR+"15":"#050810",cursor:"pointer"}}>
            <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${dados[k2]?COR:"#3a1a5c"}`,background:dados[k2]?COR:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{dados[k2]&&"✓"}</div>
            <div style={{fontSize:11,color:dados[k2]?"#c8a8f0":"#8ba3c0"}}>{label}</div>
          </div>
        ))}
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginTop:10,marginBottom:4}}>Duração do trabalho (minutos):</label>
        <input className="inp" type="number" min="5" max="180" value={dados.duracao_minutos||30} onChange={e=>d("duracao_minutos",parseInt(e.target.value)||30)} style={{marginBottom:8}}/>
        <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:4}}>Observações do pêndulo / percepções durante o trabalho:</label>
        <textarea className="inp" rows={4} value={dados.observacoes_pendulo} onChange={e=>d("observacoes_pendulo",e.target.value)} placeholder="O que o pêndulo indicou, sensações, bloqueios encontrados, como respondeu o campo..." style={{resize:"vertical"}}/>
      </div>
      <Navegacao />
    </div>
  );

  // ── ETIQUETAS À DISTÂNCIA ─────────────────────────────────────
  if (etapaAtual.id === "etiquetas_distancia") return (
    <div className="fade">
      <Header />
      <SugestaoProtocoloCard dados={dados} onAplicar={(sug)=>{
        d("etiquetas_escolhidas",[...new Set([...dados.etiquetas_escolhidas,...sug.etiquetas.map(e=>e.nome)])]);
        d("focos_nomes_deus",[...new Set([...dados.focos_nomes_deus,...sug.nomes])]);
        if (sug.audios.length) d("protocolo_livre",(dados.protocolo_livre?dados.protocolo_livre+"\n":"")+sug.audios.join("\n"));
      }}/>
      <div className="card" style={{borderColor:COR+"60"}}>
        <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:4}}>🏷️ Etiquetas Hebraicas Aplicadas</div>
        <div style={{fontSize:10,color:"#7a5a9a",marginBottom:10}}>Selecciona as etiquetas usadas neste trabalho à distância:</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {ETIQUETAS_HEBRAICAS.map((et,i)=>{
            const sel=dados.etiquetas_escolhidas.includes(et);
            return <div key={et} onClick={()=>toggleArr("etiquetas_escolhidas",et)}
              style={{padding:"4px 9px",borderRadius:8,border:`1px solid ${sel?COR:"#1a0a2e"}`,background:sel?COR+"20":"#050810",cursor:"pointer",fontSize:9,color:sel?"#c8a8f0":"#5a7a9a",fontWeight:sel?700:400}}>
              A{i+1}·{et}
            </div>;
          })}
        </div>
      </div>
      <Navegacao />
    </div>
  );

  // ── 72 NOMES DE DEUS ──────────────────────────────────────────
  if (etapaAtual.id === "nomes_deus_distancia") {
    const autoSugeridos = [];
    dados.intencoes.forEach(int=>{
      if (int.includes("Justiça")) autoSugeridos.push("Amenizando o Julgamento (#44)","O Poder da Prosperidade (#45)");
      if (int.includes("Desbloqueio") || int.includes("amarra")) autoSugeridos.push("Expulsando os Resíduos do Mal (#11)","Grande Fuga (#17)");
      if (int.includes("Abertura") || int.includes("prosperidade")) autoSugeridos.push("O Poder da Prosperidade (#45)","Circuito (#38)","Sócia Silenciosa (#27)");
      if (int.includes("Protecção") || int.includes("Proteção")) autoSugeridos.push("Neutralizando Energia Negativa (#8)","Olhares Podem Matar (#10)");
      if (int.includes("herança") || int.includes("processo") || int.includes("legal")) autoSugeridos.push("Amenizando o Julgamento (#44)","O Poder da Prosperidade (#45)","Ordem a Partir do Caos (#26)");
    });
    const sugeridos = [...new Set(autoSugeridos)];
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:COR+"60"}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:8}}>🔮 72 Nomes de Deus</div>
          {sugeridos.length>0&&<div style={{background:"#1a0a2e",borderRadius:7,padding:8,marginBottom:8}}>
            <div style={{fontSize:9,color:"#9a7ab8",marginBottom:5}}>✨ Sugeridos para esta intenção:</div>
            {sugeridos.map(s=>{
              const sel=dados.focos_nomes_deus.includes(s);
              return <div key={s} onClick={()=>toggleArr("focos_nomes_deus",s)}
                style={{padding:"5px 8px",marginBottom:3,borderRadius:6,border:`1px solid ${sel?COR+"80":"#2a0a4c"}`,background:sel?COR+"15":"transparent",cursor:"pointer",fontSize:10,color:sel?"#c8a8f0":"#7a5a9a"}}>{sel?"✓ ":""}{s}</div>;
            })}
          </div>}
          <div style={{fontSize:9,color:"#5a3a7a",marginBottom:6}}>Ou adiciona por tema:</div>
          {Object.entries(NOMES_DEUS_SINTOMAS).slice(0,6).map(([tema,nomes])=>(
            <div key={tema} style={{marginBottom:7}}>
              <div style={{fontSize:9,color:"#7a5a9a",fontWeight:700,marginBottom:3}}>{tema}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {nomes.map(n=>{const sel=dados.focos_nomes_deus.includes(n);return <div key={n} onClick={()=>toggleArr("focos_nomes_deus",n)} style={{padding:"2px 7px",borderRadius:10,border:`1px solid ${sel?COR:"#1a0a2e"}`,background:sel?COR+"20":"#050810",cursor:"pointer",fontSize:8,color:sel?"#c8a8f0":"#5a7a9a"}}>{n}</div>;})}
              </div>
            </div>
          ))}
        </div>
        <Navegacao />
      </div>
    );
  }

  // ── RELATÓRIO FINAL ───────────────────────────────────────────
  if (etapaAtual.id === "relatorio_distancia") {
    const [notasPrivadas, setNotasPrivadas] = useState(dados.notas_privadas||"");
    const [altaSel, setAltaSel] = useState(dados.alta_distancia||null);
    return (
      <div className="fade">
        <Header />
        <div className="card" style={{borderColor:COR+"60",marginBottom:10}}>
          <div style={{fontWeight:800,fontSize:13,color:"#dde4f0",marginBottom:8}}>📋 Fecho do Trabalho</div>
          <label style={{fontSize:10,color:"#7a5a9a",display:"block",marginBottom:4}}>Notas privadas do terapeuta:</label>
          <textarea className="inp" rows={3} value={notasPrivadas} onChange={e=>{setNotasPrivadas(e.target.value);d("notas_privadas",e.target.value);}} placeholder="Percepções, próximos passos, reforço..." style={{resize:"vertical",marginBottom:10}}/>
          <div style={{fontSize:10,color:"#7a5a9a",marginBottom:6}}>Estado do trabalho:</div>
          {[
            {id:"concluido",label:"✅ Trabalho concluído — agendar verificação",cor:"#5ae0d8"},
            {id:"reforco",label:"🔄 Necessário reforço — repetir em X dias",cor:"#fbbf24"},
            {id:"processo",label:"⏳ Em processo — monitorizar",cor:"#9a7ab8"},
          ].map(o=>(
            <div key={o.id} onClick={()=>{setAltaSel(o.id);d("alta_distancia",o.id);}}
              style={{padding:"9px 12px",marginBottom:5,borderRadius:8,border:`2px solid ${altaSel===o.id?o.cor:"#1a0a2e"}`,background:altaSel===o.id?o.cor+"15":"#050810",cursor:"pointer"}}>
              <div style={{fontSize:11,fontWeight:700,color:altaSel===o.id?o.cor:"#8ba3c0"}}>{o.label}</div>
            </div>
          ))}
        </div>
        <Navegacao ultimoFinalizar={true} />
      </div>
    );
  }

  return (
    <div className="fade">
      <Header />
      <div className="card" style={{textAlign:"center",padding:20,color:"#5a7a9a",fontSize:12}}>Etapa em desenvolvimento</div>
      <Navegacao />
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════
// PAINEL HISTÓRICO — aparece ANTES de iniciar qualquer consulta
// Mostra evolução, sessões anteriores e comparação entre consultas
// ═══════════════════════════════════════════════════════════════════════════

function PainelHistoricoPaciente({ paciente, user, tipoFiltro, onNovaSessao, onVoltar }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    if (!paciente?.id) { setLoading(false); return; }
    sb.from("consultas").select("*")
      .eq("paciente_id", paciente.id)
      .eq("terapeuta_id", user?.id)
      .order("data", { ascending: false })
      .then(({ data }) => { setHistorico(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paciente?.id]);

  // Filtrar por tipo se especificado
  const sessoes = tipoFiltro
    ? historico.filter(c => c.tipo?.toLowerCase().includes(tipoFiltro.toLowerCase()) || c.dados_formulario?.fase)
    : historico;

  // Calcular evolução de Bovis
  const bovisHistorico = sessoes
    .filter(c => c.dados_formulario?.dados?.bovis_depois || c.dados_formulario?.bovis_depois)
    .map(c => ({
      data: c.data,
      tipo: c.tipo,
      antes: c.dados_formulario?.dados?.bovis_antes || c.dados_formulario?.bovis_antes,
      depois: c.dados_formulario?.dados?.bovis_depois || c.dados_formulario?.bovis_depois,
    }))
    .reverse(); // cronológico

  const ultimaBovis = bovisHistorico[bovisHistorico.length - 1]?.depois;
  const primeiraBovis = bovisHistorico[0]?.antes;
  const evolucaoTotal = ultimaBovis && primeiraBovis ? ultimaBovis - primeiraBovis : null;

  const BOVIS_COR = (v) => {
    if (!v) return "#5a7a9a";
    if (v >= 10000) return "#5ae0d8";
    if (v >= 6500) return "#a3e635";
    if (v >= 3500) return "#fbbf24";
    return "#f87171";
  };

  return (
    <div className="fade" style={{paddingBottom:60}}>
      {/* Header do paciente */}
      <div style={{background:"linear-gradient(135deg,#071422,#0a1e2e)",border:"1px solid #1a3a5c",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#1a4a6c,#0d2535)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👤</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:14,color:"#dde4f0"}}>{paciente.nome}</div>
            <div style={{fontSize:10,color:"#5a7a9a"}}>{paciente.telefone||paciente.email||"Sem contacto"}</div>
          </div>
          <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:10}} onClick={onVoltar}>← Mudar</button>
        </div>

        {/* Estatísticas rápidas */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8}}>
          <div style={{textAlign:"center",background:"#0d1828",borderRadius:6,padding:"6px 0"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#00c6b8"}}>{sessoes.length}</div>
            <div style={{fontSize:8,color:"#3d5a7a"}}>Sessões</div>
          </div>
          <div style={{textAlign:"center",background:"#0d1828",borderRadius:6,padding:"6px 0"}}>
            <div style={{fontSize:18,fontWeight:800,color:BOVIS_COR(ultimaBovis)}}>{ultimaBovis||"—"}</div>
            <div style={{fontSize:8,color:"#3d5a7a"}}>Último Bovis</div>
          </div>
          <div style={{textAlign:"center",background:"#0d1828",borderRadius:6,padding:"6px 0"}}>
            <div style={{fontSize:18,fontWeight:800,color:evolucaoTotal>=0?"#5ae0d8":"#f87171"}}>
              {evolucaoTotal!==null?(evolucaoTotal>=0?"+":"")+evolucaoTotal:"—"}
            </div>
            <div style={{fontSize:8,color:"#3d5a7a"}}>Evolução</div>
          </div>
        </div>
      </div>

      {/* Evolução Bovis gráfica */}
      {bovisHistorico.length > 0 && (
        <div className="card" style={{marginBottom:10}}>
          <div className="card-t" style={{marginBottom:8}}>📈 Evolução Bovis</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
            {bovisHistorico.map((b, i) => {
              const max = Math.max(...bovisHistorico.map(x=>x.depois||0), 10000) || 10000;
              const h = Math.round(((b.depois||0)/max)*60);
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{width:"100%",background:BOVIS_COR(b.depois),borderRadius:"3px 3px 0 0",height:h+"px",minHeight:2,transition:"height .3s"}}/>
                  <div style={{fontSize:7,color:"#3d5a7a",textAlign:"center"}}>{b.depois}</div>
                  <div style={{fontSize:6,color:"#2d4a66",textAlign:"center"}}>{b.data?.slice(5)}</div>
                </div>
              );
            })}
          </div>
          {ultimaBovis >= 10000
            ? <div style={{textAlign:"center",fontSize:10,color:"#5ae0d8",marginTop:8,fontWeight:700}}>✅ Campo saudável — alta possível</div>
            : <div style={{textAlign:"center",fontSize:10,color:"#fbbf24",marginTop:8}}>Objetivo: ≥ 10.000 Bovis</div>
          }
        </div>
      )}

      {/* Histórico de sessões */}
      {sessoes.length > 0 && (
        <div className="card" style={{marginBottom:12}}>
          <div className="card-t" style={{marginBottom:8}}>📋 Sessões Anteriores</div>
          {sessoes.slice(0,8).map((c, i) => {
            const d = c.dados_formulario?.dados || {};
            const bovisA = d.bovis_antes || c.dados_formulario?.bovis_antes;
            const bovisD = d.bovis_depois || c.dados_formulario?.bovis_depois;
            const interf = d.interferencias?.length || 0;
            const alta = d.alta_distancia || d.alta;
            const isExp = expandido === c.id;
            return (
              <div key={c.id} style={{borderBottom:"1px solid #0d1828",paddingBottom:8,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",cursor:"pointer"}} onClick={()=>setExpandido(isExp?null:c.id)}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#b0c4d8"}}>{c.tipo}</div>
                    <div style={{fontSize:9,color:"#3d5a7a"}}>{c.data} {alta==="concluido"&&"· ✅ Concluído"}{alta==="reforco"&&"· 🔄 Reforço"}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {bovisD && <div style={{fontSize:11,fontWeight:700,color:BOVIS_COR(bovisD)}}>{bovisA&&`${bovisA}→`}{bovisD}</div>}
                    {interf>0 && <div style={{fontSize:9,color:"#5a3a7a"}}>{interf} interferências</div>}
                    <div style={{fontSize:10,color:"#3d5a7a"}}>{isExp?"▲":"▼"}</div>
                  </div>
                </div>
                {isExp && (
                  <div style={{marginTop:8,padding:8,background:"#050810",borderRadius:6,fontSize:9,color:"#5a7a9a",lineHeight:1.7}}>
                    {d.interferencias?.length>0 && <div><strong style={{color:"#8ba3c0"}}>Interferências:</strong> {d.interferencias.join(", ")}</div>}
                    {d.chakras_bloqueados?.length>0 && <div><strong style={{color:"#8ba3c0"}}>Chakras:</strong> {d.chakras_bloqueados.join(", ")}</div>}
                    {d.etiquetas_escolhidas?.length>0 && <div><strong style={{color:"#8ba3c0"}}>Etiquetas:</strong> {d.etiquetas_escolhidas.join(", ")}</div>}
                    {d.observacoes_pendulo && <div><strong style={{color:"#8ba3c0"}}>Notas:</strong> {d.observacoes_pendulo.slice(0,120)}{d.observacoes_pendulo.length>120?"...":""}</div>}
                    {(c.relatorio||c.dados_formulario?.relatorio) && (
                      <button className="btn btn-s btn-sm" style={{marginTop:6,fontSize:9,width:"auto"}}
                        onClick={()=>navigator.clipboard?.writeText(c.relatorio||c.dados_formulario?.relatorio)}>
                        📋 Copiar relatório desta sessão
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {sessoes.length > 8 && <div style={{textAlign:"center",fontSize:10,color:"#3d5a7a"}}>+ {sessoes.length-8} sessões mais antigas</div>}
        </div>
      )}

      {sessoes.length === 0 && !loading && (
        <div style={{textAlign:"center",padding:"16px 0",color:"#3d5a7a",fontSize:11}}>
          Nenhuma sessão anterior. Esta será a 1ª consulta.
        </div>
      )}

      {/* Botão nova sessão */}
      <button className="btn btn-p" style={{fontSize:13,padding:"14px 0"}} onClick={onNovaSessao}>
        ✦ Iniciar Nova Sessão
      </button>
    </div>
  );
}

// ─── SELETOR UNIVERSAL DE PACIENTE (usado em todos os módulos) ─────────────
function SeletorPacienteUniversal({ user, titulo, onSelecionado, onVoltar }) {
  const [pacs, setPacs] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.from("pacientes").select("id,nome,telefone,email,data_nascimento,grupo_familiar,relacao_familiar")
      .eq("terapeuta_id", user?.id).order("nome")
      .then(({ data }) => { setPacs(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const filtrados = pacs.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.telefone?.includes(busca) ||
    p.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const criarEAvancar = async () => {
    const nome = busca.trim(); if (!nome) return;
    const { data, error } = await sb.from("pacientes")
      .insert({ nome, terapeuta_id: user.id }).select().single();
    if (!error && data) onSelecionado(data);
    else alert("Erro: " + (error?.message || ""));
  };

  return (
    <div className="fade">
      {onVoltar && <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:10}} onClick={onVoltar}>← Voltar</button>}
      <div style={{fontWeight:700,color:"#dde4f0",fontSize:13,marginBottom:10}}>
        👤 {titulo || "Seleccionar Paciente"}
      </div>
      <input className="inp" placeholder="🔍 Nome, telefone ou email..." value={busca}
        onChange={e=>setBusca(e.target.value)} autoFocus style={{marginBottom:8}}/>
      <div style={{maxHeight:360,overflowY:"auto"}}>
        {filtrados.map(p => (
          <div key={p.id} onClick={() => onSelecionado(p)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#050810",border:`1px solid ${p.grupo_familiar?"#1a3a2a":"#0d1828"}`,borderRadius:8,marginBottom:5,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#00c6b8";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=p.grupo_familiar?"#1a3a2a":"#0d1828";}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${p.grupo_familiar?"#1a5a4c":"#1a4a6c"},#0d2535)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
              {p.grupo_familiar?"👨‍👩‍👧":"👤"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:12,color:"#b0c4d8"}}>{p.nome}</div>
              <div style={{fontSize:9,color:"#3d5a7a"}}>
                {p.telefone||p.email||"Sem contacto"}
                {p.data_nascimento&&" · "+new Date(p.data_nascimento).toLocaleDateString("pt-PT")}
              </div>
              {p.grupo_familiar&&<div style={{fontSize:8,color:"#2a5a3a",marginTop:1}}>👨‍👩‍👧‍👦 Tem família associada</div>}
            </div>
            <div style={{color:"#00c6b8",fontSize:14}}>▶</div>
          </div>
        ))}
        {filtrados.length === 0 && busca.length > 1 && (
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:11,color:"#3d5a7a",marginBottom:8}}>Paciente não encontrado.</div>
            <button className="btn btn-p" style={{fontSize:11}} onClick={criarEAvancar}>
              ➕ Criar "{busca.trim()}" e avançar
            </button>
          </div>
        )}
        {filtrados.length === 0 && busca.length === 0 && !loading && (
          <div style={{textAlign:"center",padding:"10px 0",color:"#3d5a7a",fontSize:11}}>Escreve o nome para pesquisar.</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR DE SUGESTÃO DE PROTOCOLO — Hikari Fafe
// Com base nos dados da sessão, sugere etiquetas, nomes de Deus,
// áudios e cuidados de autocuidado de forma automática
// ═══════════════════════════════════════════════════════════════════════════

// Mapeamento: interferência → etiquetas hebraicas (índices 0-28)
const PROTOCOLO_POR_INTERFERENCIA = {
  "Larvas Astrais":      { etiquetas:[5,19,23,8], nomes:["Expulsando os Resíduos do Mal (#11)","Neutralizando Energia Negativa (#8)"], audio:"medos", cuidados:["Beber 2L de água com intenção de pureza","Sal grosso no banho 3 dias seguidos","Evitar redes sociais 48h"] },
  "Miasmas":             { etiquetas:[2,0,23,28], nomes:["Expulsando os Resíduos do Mal (#11)","Água (#61)"], audio:"meditacao_reiki", cuidados:["Incenso de sândalo ou mirra no ambiente","Abrir janelas às 6h da manhã 7 dias","Banho de ervas (arruda e guiné)"] },
  "Inveja / Olho Gordo": { etiquetas:[0,23,1,27], nomes:["Olhares Podem Matar (#10)","Neutralizando Energia Negativa (#8)"], audio:"medos", cuidados:["Ovo de proteção 3 dias","Sal grosso na entrada de casa","Fita vermelha no pulso esquerdo"] },
  "Magia Consciente":    { etiquetas:[5,1,23,11], nomes:["Expulsando os Resíduos do Mal (#11)","Adeus às Armas (#14)"], audio:"meditacao_reiki", cuidados:["Limpeza com vela branca e preta em simultâneo","Oração de São Miguel Arcanjo diária","Não revelar o trabalho a ninguém"] },
  "Magia Inconsciente":  { etiquetas:[5,1,2,19], nomes:["Expulsando os Resíduos do Mal (#11)","Grande Fuga (#17)"], audio:"meditacao_reiki", cuidados:["Corte de cordões energéticos","Visualização de luz dourada ao acordar","Declaração de libertação em voz alta 3x"] },
  "Magia Ritual":        { etiquetas:[5,1,23,0,2], nomes:["Expulsando os Resíduos do Mal (#11)","Transformação Global (#47)"], audio:"meditacao_reiki", cuidados:["Requer limpeza profunda em 3 sessões","Não entrar nos locais afectados sozinho","Colocar galhos de arruda nas janelas"] },
  "Auto-Sabotagem":      { etiquetas:[3,15,9,22,17], nomes:["Grande Fuga (#17)","Auto-estima (#41)","Vencendo os Vícios (#20)"], audio:"gatilhos", cuidados:["Journaling diário: 3 conquistas do dia","Afirmação matinal: 'Eu mereço o meu sucesso'","Limitar decisões importantes a períodos de energia alta"] },
  "Contratos Cármicos":  { etiquetas:[2,6,7,9,11], nomes:["Viagem no Tempo (#1)","Memórias (#32)","Certeza Absoluta (#46)"], audio:"meditacao_reiki", cuidados:["Meditação de revisão de vida 21 dias","Escrever uma carta de perdão e queimá-la","Gratidão pelos aprendizados do padrão"] },
  "Obsessão (Mental)":   { etiquetas:[15,17,16,3], nomes:["Eliminando Pensamentos Negativos (#4)","Sem Medo (#36)"], audio:"medos", cuidados:["Técnica de interrupção de pensamento (dizer STOP e respirar)","Reduzir tempo de ecrã antes de dormir","Mindfulness 10 min ao acordar"] },
  "Obsessores":          { etiquetas:[5,23,1,2], nomes:["Expulsando os Resíduos do Mal (#11)","Adeus às Armas (#14)"], audio:"meditacao_reiki", cuidados:["Requer sessão presencial de desencarnação","Limpeza de aura com pêndulo diária","Proteção antes de dormir: visualizar luz branca"] },
  "Geopatias":           { etiquetas:[5,23,28], nomes:["Água (#61)","Transformação Global (#47)"], audio:"enraizamento", cuidados:["Reorganizar o quarto de dormir","Plantas em casa (samambaia, espada de São Jorge)","Pés descalços na terra 10 min diários"] },
  "Campo Elétrico":      { etiquetas:[5,23,16], nomes:["Eliminando Pensamentos Negativos (#4)","Água (#61)"], audio:"enraizamento", cuidados:["Router WiFi desligado à noite","Telemóvel fora do quarto ao dormir","Pedra turmalina negra perto do computador"] },
  "Efeito Bumerangue":   { etiquetas:[2,6,9,22], nomes:["Viagem no Tempo (#1)","Amenizando o Julgamento (#44)"], audio:"meditacao_reiki", cuidados:["Pedido de desculpas energético ao(s) afectado(s)","Doação a uma causa (limpeza de karma)","21 dias de gratidão"] },
  "Semente Fértil":      { etiquetas:[6,11,24,20], nomes:["Fertilidade (#18)","DNA da Alma (#7)"], audio:"enraizamento", cuidados:["Alimentação consciente rica em verde","Contacto com a natureza diário","Visualização do projeto/bebé em luz"] },
  "Alerta Somático":     { etiquetas:[22,13,5,23], nomes:["Cura (#5)","Água (#61)"], audio:"meditacao_reiki", cuidados:["CHECK-UP MÉDICO URGENTE — prioridade máxima","Repouso: 8h de sono mínimo","Reduzir stress imediatamente"] },
};

// Mapeamento: chakra bloqueado → etiquetas + nomes
const PROTOCOLO_POR_CHAKRA = {
  "Raiz":          { etiquetas:[27,18,6,14], nomes:["Seguindo em Frente (#58)","Certeza Absoluta (#46)"], cuidados:["Pés descalços 10 min diários","Cor vermelha na roupa ou ambiente","Alimentação: raízes (beterraba, cenoura, batata-doce)"] },
  "Sacro":         { etiquetas:[6,18,20,25], nomes:["Amor Incondicional (#12)","Energia Sexual (#35)"], cuidados:["Movimentar ancas (dançar, ioga)","Beber mais água","Cor laranja"] },
  "Plexo Solar":   { etiquetas:[3,15,21,17], nomes:["Auto-estima (#41)","O Suficiente Nunca É Suficiente (#50)"], cuidados:["Apanhar sol na barriga 10 min","Dizer 'não' de forma assertiva","Cor amarela"] },
  "Cardíaco":      { etiquetas:[0,8,25,24], nomes:["Amor Incondicional (#12)","Eliminando o Ódio (#29)"], cuidados:["Mão no peito, respirar e repetir: 'Eu liberto a dor'","Praticar perdão activo","Cor verde"] },
  "Laríngeo":      { etiquetas:[16,9,25,24], nomes:["Fale o que Está Pensando (#25)","Compartilhando a Chama (#23)"], cuidados:["Cantar ou humm-humm durante 5 min","Escrever e queimar o que está reprimido","Cor azul turquesa"] },
  "Terceiro Olho": { etiquetas:[3,9,16,21], nomes:["Plano Geral (#37)","Revelando o Oculto (#42)"], cuidados:["Silêncio 5 min antes de dormir","Desligar ecrãs 1h antes de dormir","Cor índigo"] },
  "Coronário":     { etiquetas:[8,11,9,28], nomes:["Disque Deus (#19)","DNA da Alma (#7)"], cuidados:["Gratidão: 3 coisas simples ao acordar","Meditação de conexão com a Fonte","Cor violeta ou branco"] },
  "Estrela da Alma":{ etiquetas:[8,9,11,19], nomes:["DNA da Alma (#7)","Desafiando a Gravidade (#43)"], cuidados:["Identificar e agir na vocação (1 passo hoje)","Meditação de propósito","Perguntar: 'O que me faz os olhos brilhar?'"] },
  "Portal Estelar":{ etiquetas:[5,23,28,1], nomes:["Neutralizando Energia Negativa (#8)","Expulsando os Resíduos do Mal (#11)"], cuidados:["Visualizar redoma dourada diariamente","Proteger o campo antes de entrar em locais cheios","Declaração: 'O meu campo está selado e protegido'"] },
};

// Sugestão por abertura de caminhos
const PROTOCOLO_POR_ABERTURA = {
  1: { etiquetas:[10,9,14,11], nomes:["O Poder da Prosperidade (#45)","Ordem a Partir do Caos (#26)","DNA da Alma (#7)"], cuidados:["Mudança radical de pelo menos 1 comportamento","Limpeza física profunda do espaço de vida","Jejum energético: sem notícias negativas 21 dias"] },
  2: { etiquetas:[10,9,2,8], nomes:["O Poder da Prosperidade (#45)","Grande Fuga (#17)"], cuidados:["Alterar 1 rota/hábito que está a bloquear","Revisão de crenças limitantes","Persistência: não desistir nos próximos 90 dias"] },
  3: { etiquetas:[10,9,11], nomes:["Circuito (#38)","O Suficiente Nunca É Suficiente (#50)"], cuidados:["Foco total na intenção — não dispersar energia","Agir nas oportunidades que aparecem","Agradecer como se já tivesse recebido"] },
  4: { etiquetas:[10,9], nomes:["Felicidade (#49)","Circuito (#38)"], cuidados:["Manifestação em curso — manter a frequência alta","Receber com gratidão","Partilhar a bênção (dízimo/doação)"] },
};

// Função principal de geração automática de sugestão de protocolo
function gerarSugestaoProtocolo(dados) {
  const etiquetasSet = new Set();
  const nomesSet = new Set();
  const cuidadosSet = new Set();
  const audiosSugeridos = new Set();

  // Por interferências
  (dados.interferencias || []).forEach(interf => {
    const p = PROTOCOLO_POR_INTERFERENCIA[interf];
    if (p) {
      p.etiquetas.forEach(i => etiquetasSet.add(i));
      p.nomes.forEach(n => nomesSet.add(n));
      p.cuidados.forEach(c => cuidadosSet.add(c));
      if (p.audio) audiosSugeridos.add(p.audio);
    }
  });

  // Por chakras
  (dados.chakras_bloqueados || []).forEach(chakra => {
    const p = PROTOCOLO_POR_CHAKRA[chakra];
    if (p) {
      p.etiquetas.forEach(i => etiquetasSet.add(i));
      p.nomes.forEach(n => nomesSet.add(n));
      p.cuidados.forEach(c => cuidadosSet.add(c));
    }
  });

  // Por abertura de caminhos
  if (dados.abertura_caminhos) {
    const p = PROTOCOLO_POR_ABERTURA[dados.abertura_caminhos];
    if (p) {
      p.etiquetas.forEach(i => etiquetasSet.add(i));
      p.nomes.forEach(n => nomesSet.add(n));
      p.cuidados.forEach(c => cuidadosSet.add(c));
    }
  }

  // Por intenções (análise de palavras-chave)
  const intencoes = [...(dados.intencoes || []), dados.intencao_livre || ""].join(" ").toLowerCase();
  if (intencoes.includes("justiça") || intencoes.includes("tribunal") || intencoes.includes("processo") || intencoes.includes("legal")) {
    [43,8,9].forEach(i => etiquetasSet.add(i));
    nomesSet.add("Amenizando o Julgamento (#44)");
    nomesSet.add("O Poder da Prosperidade (#45)");
    nomesSet.add("Ordem a Partir do Caos (#26)");
    cuidadosSet.add("Declarar em voz alta: 'A Justiça Divina actua no meu processo'");
    cuidadosSet.add("Escrever no papel o resultado desejado e guardar no lado esquerdo da carteira");
  }
  if (intencoes.includes("herança") || intencoes.includes("imóvel") || intencoes.includes("propriedade")) {
    [10,9,20,6].forEach(i => etiquetasSet.add(i));
    nomesSet.add("Sócia Silenciosa (#27)");
    nomesSet.add("O Poder da Prosperidade (#45)");
    cuidadosSet.add("Colocar a A11 (Prosperidade) na escritura ou fotografia do imóvel");
  }
  if (intencoes.includes("prosperidade") || intencoes.includes("dinheiro") || intencoes.includes("trabalho") || intencoes.includes("emprego")) {
    [10,9,26,20].forEach(i => etiquetasSet.add(i));
    nomesSet.add("O Poder da Prosperidade (#45)");
    nomesSet.add("Sócia Silenciosa (#27)");
    nomesSet.add("Circuito (#38)");
  }
  if (intencoes.includes("amor") || intencoes.includes("relacionamento") || intencoes.includes("casal") || intencoes.includes("casamento")) {
    [0,24,8,25].forEach(i => etiquetasSet.add(i));
    nomesSet.add("Amor Incondicional (#12)");
    nomesSet.add("Alma Gémea (#28)");
  }
  if (intencoes.includes("saúde") || intencoes.includes("cura") || intencoes.includes("doença")) {
    [22,5,23].forEach(i => etiquetasSet.add(i));
    nomesSet.add("Cura (#5)");
    nomesSet.add("Água (#61)");
    audiosSugeridos.add("meditacao_reiki");
  }
  if (intencoes.includes("desbloqueio") || intencoes.includes("amarra") || intencoes.includes("limpeza")) {
    [0,1,5,23].forEach(i => etiquetasSet.add(i));
    nomesSet.add("Expulsando os Resíduos do Mal (#11)");
    nomesSet.add("Grande Fuga (#17)");
    audiosSugeridos.add("meditacao_reiki");
  }

  // Mapear índices para nomes das etiquetas
  const etiquetasSugeridas = [...etiquetasSet]
    .filter(i => i < ETIQUETAS_HEBRAICAS.length)
    .map(i => ({ codigo: `A${i+1}`, nome: ETIQUETAS_HEBRAICAS[i], idx: i }));

  // Áudios para texto
  const AUDIO_LABELS = {
    medos: "🎧 Áudio dos Medos e Gatilhos — modulação neuroplástica",
    gatilhos: "🎧 Áudio de Gatilhos Emocionais",
    enraizamento: "🌱 Meditação de Enraizamento (5 min de manhã antes de se levantar)",
    meditacao_reiki: "🌀 Meditação Guiada de Reiki",
  };

  return {
    etiquetas: etiquetasSugeridas,
    nomes: [...nomesSet],
    cuidados: [...cuidadosSet].slice(0, 8), // max 8 cuidados
    audios: [...audiosSugeridos].map(a => AUDIO_LABELS[a] || a),
  };
}

// Componente visual da sugestão — reutilizável em qualquer etapa
function SugestaoProtocoloCard({ dados, onAplicar }) {
  const sug = gerarSugestaoProtocolo(dados);
  const [expandido, setExpandido] = useState(false);
  const [aplicado, setAplicado] = useState(false);

  if (sug.etiquetas.length === 0 && sug.nomes.length === 0) return null;

  return (
    <div style={{background:"linear-gradient(135deg,#1a0a2e,#0a0518)",border:"1px solid #4a1a7c60",borderRadius:10,padding:12,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:expandido?10:0}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"#c8a8f0"}}>✨ Sugestão de Protocolo Automática</div>
          <div style={{fontSize:9,color:"#5a3a7a"}}>Baseada nos dados detectados · toca para ver</div>
        </div>
        <button onClick={()=>setExpandido(e=>!e)} style={{background:"none",border:"1px solid #4a1a7c",borderRadius:6,padding:"4px 10px",color:"#9a7ab8",fontSize:10,cursor:"pointer"}}>{expandido?"▲ Fechar":"▼ Ver sugestão"}</button>
      </div>
      {expandido && (
        <div>
          {sug.etiquetas.length > 0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:"#9a7ab8",fontWeight:800,marginBottom:5,letterSpacing:1}}>🏷️ ETIQUETAS HEBRAICAS SUGERIDAS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {sug.etiquetas.map(e=>(
                  <div key={e.codigo} style={{padding:"4px 9px",borderRadius:8,background:"rgba(74,26,124,.3)",border:"1px solid #4a1a7c80",fontSize:9,color:"#c8a8f0",fontWeight:700}}>
                    {e.codigo} — {e.nome}
                  </div>
                ))}
              </div>
            </div>
          )}
          {sug.nomes.length > 0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:"#9a7ab8",fontWeight:800,marginBottom:5,letterSpacing:1}}>🔮 72 NOMES DE DEUS SUGERIDOS</div>
              {sug.nomes.map(n=><div key={n} style={{fontSize:9,color:"#7a5a9a",padding:"2px 0"}}>• {n}</div>)}
            </div>
          )}
          {sug.audios.length > 0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:"#9a7ab8",fontWeight:800,marginBottom:5,letterSpacing:1}}>🎧 ÁUDIOS INDICADOS</div>
              {sug.audios.map(a=><div key={a} style={{fontSize:9,color:"#7a5a9a",padding:"2px 0"}}>• {a}</div>)}
            </div>
          )}
          {sug.cuidados.length > 0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:"#9a7ab8",fontWeight:800,marginBottom:5,letterSpacing:1}}>🌱 CUIDADOS ENTRE SESSÕES</div>
              {sug.cuidados.map(c=><div key={c} style={{fontSize:9,color:"#7a5a9a",padding:"2px 0"}}>• {c}</div>)}
            </div>
          )}
          {onAplicar && !aplicado && (
            <button className="btn btn-p" style={{fontSize:10,padding:"8px 0",marginTop:6,background:"#4a1a7c",borderColor:"#4a1a7c"}}
              onClick={()=>{onAplicar(sug);setAplicado(true);}}>
              ✅ Aplicar sugestões (preenche automaticamente)
            </button>
          )}
          {aplicado && <div style={{fontSize:10,color:"#5ae0d8",textAlign:"center",padding:"6px 0"}}>✅ Aplicado! Podes editar nas etapas seguintes.</div>}
        </div>
      )}
    </div>
  );
}

function gerarRelatorioDistancia(dados) {
  const sep = "─".repeat(50);
  const sec = (titulo) => ["", titulo, ""];
  const L = [
    "🔯 RELATÓRIO — TRABALHO À DISTÂNCIA",
    "HON SHA ZE SHO NEN — O espaço e o tempo não existem",
    sep,
    ...sec("DADOS DO TESTEMUNHO"),
    `Nome: ${dados.nome_completo || "(sem nome)"}`,
    dados.data_nascimento ? `Nascimento: ${new Date(dados.data_nascimento).toLocaleDateString("pt-PT")}` : null,
    dados.local_referencia ? `Local/Imóvel: ${dados.local_referencia}` : null,
    dados.processo_referencia ? `Processo: ${dados.processo_referencia}` : null,
    `Data: ${new Date().toLocaleDateString("pt-PT")}`,
  ].filter(Boolean);

  if (dados.intencoes?.length > 0 || dados.intencao_livre) {
    L.push(...sec("INTENÇÃO"));
    (dados.intencoes||[]).forEach(i => L.push(`  • ${i}`));
    if (dados.intencao_livre) L.push(`  • ${dados.intencao_livre}`);
  }

  if (dados.bovis_antes || dados.bovis_depois) {
    L.push(...sec("⚡ ENERGIA BOVIS"));
    L.push(`  Antes: ${dados.bovis_antes || "—"}`);
    if (dados.bovis_depois) {
      const diff = (dados.bovis_depois||0) - (dados.bovis_antes||0);
      L.push(`  Após:  ${dados.bovis_depois} (${diff >= 0 ? "📈 Subiu" : "📉 Desceu"} ${Math.abs(diff)} unidades)`);
    }
  }

  if (dados.interferencias?.length > 0) {
    L.push(...sec("🔍 INTERFERÊNCIAS DETECTADAS"));
    dados.interferencias.forEach(i => {
      const dt = INTERFERENCIAS_ENERGETICAS.find(x => x.nome === i);
      L.push(`  • ${i}`);
      if (dt) L.push(`    → ${dt.diagnostico}`);
    });
  }

  if (dados.chakras_bloqueados?.length > 0) {
    L.push(...sec("🌀 CHAKRAS EM BLOQUEIO"));
    dados.chakras_bloqueados.forEach(c => {
      const dt = CHAKRAS_BLOQUEIO.find(x => x.nome === c);
      L.push(`  • ${c}${dt ? " (" + dt.aspecto + ")" : ""}`);
      if (dt) L.push(`    Cura: ${dt.cura}`);
    });
  }

  if (dados.abertura_caminhos) {
    const ac = ABERTURA_CAMINHOS.find(a => a.n === dados.abertura_caminhos);
    if (ac) {
      L.push(...sec("🛤️ ABERTURA DE CAMINHOS"));
      L.push(`  ${ac.pct} — ${ac.prazo}`);
      L.push(`  ${ac.leitura}`);
    }
  }

  const proc = [
    dados.hon_sha_ze_sho_nen && "HON SHA ZE SHO NEN",
    dados.reiki_distancia && "Reiki à Distância",
    dados.cho_ku_rei && "CHO KU REI",
    dados.sei_heki && "SEI HE KI",
    dados.pendulo_usado && "Pêndulo",
  ].filter(Boolean);
  if (proc.length > 0 || dados.duracao_minutos) {
    L.push(...sec("✨ TRABALHO REALIZADO"));
    if (proc.length) L.push(`  ${proc.join(" · ")}`);
    if (dados.duracao_minutos) L.push(`  Duração: ${dados.duracao_minutos} minutos`);
    if (dados.observacoes_pendulo) { L.push("  Observações do pêndulo:"); L.push(`  ${dados.observacoes_pendulo}`); }
  }

  if (dados.etiquetas_escolhidas?.length > 0) {
    L.push(...sec("🏷️ ETIQUETAS HEBRAICAS APLICADAS"));
    dados.etiquetas_escolhidas.forEach(e => {
      const idx = ETIQUETAS_HEBRAICAS.indexOf(e);
      L.push(`  A${idx + 1} — ${e}`);
    });
  }

  if (dados.focos_nomes_deus?.length > 0) {
    L.push(...sec("🔮 72 NOMES DE DEUS ACTIVADOS"));
    dados.focos_nomes_deus.forEach(n => L.push(`  • ${n}`));
  }

  const estadoTexto = {concluido:"✅ TRABALHO CONCLUÍDO — agendar verificação em breve",reforco:"🔄 NECESSÁRIO REFORÇO — repetir em breve",processo:"⏳ EM PROCESSO — monitorizar evolução"};
  if (dados.alta_distancia) {
    L.push(...sec("🎯 ESTADO DO TRABALHO"));
    L.push(`  ${estadoTexto[dados.alta_distancia] || dados.alta_distancia}`);
  }

  // ─── PROTOCOLO SUGERIDO ────────────────────────────────────────
  const sug = gerarSugestaoProtocolo(dados);
  if (sug.etiquetas.length > 0 || sug.nomes.length > 0 || sug.cuidados.length > 0) {
    L.push(...sec("═══ PROTOCOLO SUGERIDO (TERAPEUTA) ═══"));
    if (sug.etiquetas.length > 0) {
      L.push("🏷️ Etiquetas Hebraicas:");
      sug.etiquetas.forEach(e => L.push(`  ${e.codigo} — ${e.nome}`));
    }
    if (sug.nomes.length > 0) {
      L.push("🔮 72 Nomes de Deus:");
      sug.nomes.forEach(n => L.push(`  • ${n}`));
    }
    if (sug.audios.length > 0) {
      L.push("🎧 Áudios indicados:");
      sug.audios.forEach(a => L.push(`  • ${a}`));
    }
    if (sug.cuidados.length > 0) {
      L.push("🌱 Cuidados entre sessões:");
      sug.cuidados.forEach(c => L.push(`  • ${c}`));
    }
  }

  // ─── PARA ENVIAR AO PACIENTE ────────────────────────────────────
  L.push(...sec(""));
  L.push("═".repeat(50));
  L.push("       PROTOCOLO PARA O PACIENTE");
  L.push("═".repeat(50));
  L.push("");
  if (dados.intencoes?.length || dados.intencao_livre) {
    L.push("A sua intenção foi recebida e trabalhada:");
    [...(dados.intencoes||[]),dados.intencao_livre||""].filter(Boolean).forEach(i=>L.push(`  ✦ ${i}`));
    L.push("");
  }
  if (dados.bovis_depois) {
    const diff = (dados.bovis_depois||0)-(dados.bovis_antes||0);
    L.push(`Energia Bovis: ${dados.bovis_antes||"—"} → ${dados.bovis_depois} (${diff>=0?"📈 Subiu":"📉 Desceu"} ${Math.abs(diff)} unidades)`);
    L.push("");
  }
  if (dados.abertura_caminhos) {
    const ac = ABERTURA_CAMINHOS.find(a=>a.n===dados.abertura_caminhos);
    if(ac){L.push(`🛤️ ${ac.pct} — ${ac.prazo}`);L.push(`  ${ac.leitura}`);L.push("");}
  }

  // Cuidados para o paciente (versão simplificada — sem o técnico)
  const cuidadosPaciente = (dados.etiquetas_escolhidas?.length ? [`🏷️ Etiquetas colocadas: ${dados.etiquetas_escolhidas.slice(0,5).join(", ")}`] : []);
  if (dados.protocolo_livre) cuidadosPaciente.push(...dados.protocolo_livre.split("\n").filter(Boolean));
  sug.cuidados.slice(0,5).forEach(c=>cuidadosPaciente.push(c));

  if (cuidadosPaciente.length) {
    L.push("O que pode fazer agora para apoiar o trabalho:");
    cuidadosPaciente.forEach(c=>L.push(`  • ${c}`));
    L.push("");
  }
  L.push("Este trabalho foi realizado com amor, intenção e gratidão.");
  L.push("Em breve sentirá a energia a mover-se. Fique atento(a) aos sinais.");
  L.push("");
  L.push(sep);
  L.push("Hikari Fafe | HON SHA ZE SHO NEN");
  return L.join("\n");
}

// ─── PAINEL GESTÃO TRABALHOS À DISTÂNCIA (Super Admin / Hikari only) ─────────

function PainelDistancia({ user }) {
  const isSuperAdmin = user?.role === "superadmin" || user?.email === "ricardocorreia.211984@gmail.com";
  const [trabalhos, setTrabalhos] = useState([]);
  const [sel, setSel] = useState(null);         // trabalho/consulta a editar
  const [pacSel, setPacSel] = useState(null);   // paciente seleccionado para novo trabalho
  const [fase, setFase] = useState("lista");    // lista | selecionar_pac | historico | trabalho
  const [verRelatorio, setVerRelatorio] = useState(null);
  const [msg, setMsg] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const reload = () => sb.from("consultas").select("*,pacientes(nome)")
    .eq("terapeuta_id", user.id)
    .or("tipo.ilike.%Intervenção Energética%,tipo.ilike.%Trabalho à Distância%")
    .order("created_at", {ascending:false})
    .then(({data})=>setTrabalhos(data||[]))
    .catch(()=>{});

  useEffect(()=>{ if(isSuperAdmin) reload(); },[user?.id]);

  if (!isSuperAdmin) return (
    <div style={{padding:24,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:10}}>🔒</div>
      <div style={{color:"#f87171",fontSize:12}}>Acesso restrito.</div>
    </div>
  );

  // Editar trabalho existente
  if (sel && fase === "trabalho") return (
    <WorkDistanciaExecutor user={user} trabalhoInicial={sel.dados_formulario?.dados}
      onGuardar={async(tipo,dados)=>{
        const pacId = sel.paciente_id || pacSel?.id || null;
        if (sel.id) {
          await sb.from("consultas").update({dados_formulario:dados,paciente_id:pacId}).eq("id",sel.id);
        } else {
          await sb.from("consultas").insert({
            terapeuta_id:user.id, paciente_id:pacId,
            tipo:"Intervenção Energética — "+( dados.nome_completo||""),
            dados_formulario:dados, data:new Date().toISOString().split("T")[0]
          });
        }
        setMsg("✅ Guardado!");setTimeout(()=>setMsg(""),2500);
        reload();
        // Mostrar relatório para enviar ao paciente
        if (dados.relatorio) {
          setVerRelatorio(dados.relatorio);
        } else {
          setSel(null); setPacSel(null); setFase("lista");
        }
      }}
      onVoltar={()=>{setFase(pacSel?"historico":"lista");}} />
  );

  // Histórico do paciente antes de iniciar
  if (pacSel && fase === "historico") return (
    <PainelHistoricoPaciente paciente={pacSel} user={user} tipoFiltro="distância"
      onNovaSessao={()=>{ setSel({id:null,dados_formulario:null}); setFase("trabalho"); }}
      onVoltar={()=>{ setPacSel(null); setFase("selecionar_pac"); }} />
  );

  // Seleção de paciente para novo trabalho
  if (fase === "selecionar_pac") return (
    <SeletorPacienteUniversal user={user} titulo="🔯 Intervenção Energética — Escolher Paciente"
      onSelecionado={(p)=>{ setPacSel(p); setFase("historico"); }}
      onVoltar={()=>setFase("lista")} />
  );

  if (verRelatorio) return (
    <div className="fade" style={{paddingBottom:60}}>
      <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:10}} onClick={()=>setVerRelatorio(null)}>← Voltar</button>
      <div style={{background:"#050810",border:"1px solid #1a0a2e",borderRadius:10,padding:14,fontSize:10,color:"#8ba3c0",fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.7,maxHeight:500,overflowY:"auto",marginBottom:10}}>
        {verRelatorio}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <button className="btn btn-p" style={{background:"#4a1a7c",borderColor:"#4a1a7c",fontSize:11}} onClick={()=>navigator.clipboard?.writeText(verRelatorio)}>📋 Copiar</button>
        <button className="btn btn-s" style={{fontSize:11}} onClick={()=>{const w=window.open("","_blank");if(!w)return;w.document.write(`<pre style="font-family:monospace;white-space:pre-wrap;padding:24px;font-size:12px;line-height:1.7">${verRelatorio.replace(/</g,"&lt;")}</pre>`);w.document.close();w.print();}}>🖨️ PDF</button>
      </div>
    </div>
  );

  const trabalhosFiltrados = filtro==="todos" ? trabalhos : trabalhos.filter(t=>t.dados_formulario?.dados?.alta_distancia===filtro);
  const stats = { total:trabalhos.length, concluido:trabalhos.filter(t=>t.dados_formulario?.dados?.alta_distancia==="concluido").length, reforco:trabalhos.filter(t=>t.dados_formulario?.dados?.alta_distancia==="reforco").length, processo:trabalhos.filter(t=>t.dados_formulario?.dados?.alta_distancia==="processo").length };

  return (
    <div className="fade" style={{paddingBottom:60}}>
      {msg&&<div className="al al-ok" style={{marginBottom:8}}>{msg}</div>}

      <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d0518)",border:"1px solid #4a1a7c40",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:22}}>🔯</span>
          <div>
            <div style={{fontWeight:800,fontSize:13,color:"#dde4f0"}}>Trabalhos à Distância</div>
            <div style={{fontSize:9,color:"#7a5a9a"}}>HON SHA ZE SHO NEN · Gestão exclusiva Hikari Fafe</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginTop:8}}>
          {[["Total",stats.total,"#c8a8f0"],["✅",stats.concluido,"#5ae0d8"],["🔄",stats.reforco,"#fbbf24"],["⏳",stats.processo,"#9a7ab8"]].map(([l,v,cor])=>(
            <div key={l} style={{textAlign:"center",padding:"6px 0",background:"#0a0518",borderRadius:6}}>
              <div style={{fontSize:16,fontWeight:800,color:cor}}>{v}</div>
              <div style={{fontSize:9,color:"#5a3a7a"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-p" style={{marginBottom:12,background:"#4a1a7c",borderColor:"#4a1a7c"}}
        onClick={()=>{ setSel(null); setPacSel(null); setFase("selecionar_pac"); }}>
        🔯 Novo Trabalho à Distância
      </button>

      <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto"}}>
        {[["todos","Todos"],["concluido","✅ Concluídos"],["reforco","🔄 Reforço"],["processo","⏳ Em Processo"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFiltro(k)} style={{flexShrink:0,padding:"5px 10px",borderRadius:12,border:`1px solid ${filtro===k?"#9a5ae0":"#1a0a2e"}`,background:filtro===k?"rgba(154,90,224,.15)":"#050810",color:filtro===k?"#c8a8f0":"#5a7a9a",fontSize:10,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {trabalhosFiltrados.length===0 && <div style={{textAlign:"center",padding:20,color:"#3d5a7a",fontSize:11}}>Nenhum trabalho encontrado.</div>}

      {trabalhosFiltrados.map(t=>{
        const d = t.dados_formulario?.dados || {};
        const estado = {concluido:"✅",reforco:"🔄",processo:"⏳"}[d.alta_distancia||""] || "🔮";
        const bovisOk = d.bovis_depois >= 10000;
        return (
          <div key={t.id} className="card" style={{marginBottom:8,borderColor:d.alta_distancia==="concluido"?"#1a5a4c":d.alta_distancia==="reforco"?"#5a4a00":"#1a0a2e"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{estado} {d.nome_completo||t.pacientes?.nome||"(sem nome)"}</div>
                <div style={{fontSize:9,color:"#5a3a7a",marginTop:1}}>
                  {d.data_nascimento&&new Date(d.data_nascimento).toLocaleDateString("pt-PT")+" · "}
                  {new Date(t.created_at||Date.now()).toLocaleDateString("pt-PT")}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:bovisOk?"#5ae0d8":"#f87171",fontWeight:700}}>{d.bovis_depois||"—"} Bovis</div>
                {d.abertura_caminhos&&<div style={{fontSize:9,color:"#7a5a9a"}}>{ABERTURA_CAMINHOS.find(a=>a.n===d.abertura_caminhos)?.pct}</div>}
              </div>
            </div>
            {(d.intencoes?.length>0||d.intencao_livre)&&(
              <div style={{fontSize:9,color:"#7a5a9a",marginBottom:6,lineHeight:1.5}}>
                {[...(d.intencoes||[]),d.intencao_livre].filter(Boolean).join(" · ")}
              </div>
            )}
            <div style={{display:"flex",gap:5}}>
              <button className="btn btn-s btn-sm" style={{flex:1,fontSize:9}} onClick={()=>{ setSel(t); setFase("trabalho"); }}>✏️ Editar</button>
              <button className="btn btn-s btn-sm" style={{flex:1,fontSize:9}} onClick={()=>setVerRelatorio(t.dados_formulario?.relatorio||"")}>📄 Relatório</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuloHikariTab({ user, temAcesso }) {
  const [faseSel, setFaseSel] = useState(null);
  const [pacSel, setPacSel] = useState(null);
  const [pacs, setPacs] = useState([]);
  const [busca, setBusca] = useState("");
  const [relatorio, setRelatorio] = useState(null);
  const [protocolo, setProtocolo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [abaRel, setAbaRel] = useState("relatorio");
  const [showHistorico, setShowHistorico] = useState(false); // passa para true após ver histórico

  useEffect(()=>{
    if (!temAcesso) return;
    sb.from("pacientes").select("id,nome,telefone").eq("terapeuta_id",user?.id).order("nome")
      .then(({data})=>setPacs(data||[]));
  },[user?.id,temAcesso]);

  useEffect(()=>{
    if (!pacSel) return;
    sb.from("consultas").select("*").eq("paciente_id",pacSel.id).eq("terapeuta_id",user?.id)
      .order("criado_em",{ascending:false}).then(({data})=>{
        const h = (data||[]).filter(c=>c.dados_formulario?.fase?.startsWith("f"));
        setHistorico(h);
      });
  },[pacSel?.id]);

  if (!temAcesso) return (
    <div className="fade" style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:12}}>🔮</div>
      <div style={{fontWeight:800,color:"#dde4f0",fontSize:"1.1rem",marginBottom:8}}>Método Hikari Fafe</div>
      <div style={{color:"#7a5a9a",fontSize:12,lineHeight:1.8,marginBottom:20}}>Acesso reservado. Solicita activação ao administrador.</div>
      <button className="btn btn-s" style={{borderColor:"#4a1a7c",color:"#c8a8f0",fontSize:12}} onClick={()=>window.open("https://t.me/+rOkqo8Orr-NhOTVk","_blank")}>📩 Pedir Acesso</button>
    </div>
  );

  if (relatorio && protocolo) return (
    <div className="fade" style={{paddingBottom:60}}>
      <div style={{display:"flex",gap:4,marginBottom:10}}>
        {[["relatorio","📄 Relatório"],["protocolo","🏷️ Protocolo"]].map(([k,l])=>(
          <button key={k} onClick={()=>setAbaRel(k)} style={{flex:1,padding:"7px 0",borderRadius:8,border:`1px solid ${abaRel===k?"#9a5ae0":"#0d1828"}`,background:abaRel===k?"rgba(154,90,224,.15)":"#050810",color:abaRel===k?"#c8a8f0":"#5a7a9a",fontSize:11,fontWeight:abaRel===k?700:400,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{background:"#050810",border:"1px solid #1a0a2e",borderRadius:10,padding:14,fontSize:10,color:"#8ba3c0",fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.7,maxHeight:420,overflowY:"auto",marginBottom:12}}>
        {abaRel==="relatorio"?relatorio:protocolo}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <button className="btn btn-p" style={{fontSize:11,background:"#4a1a7c",borderColor:"#4a1a7c"}} onClick={()=>{navigator.clipboard?.writeText(abaRel==="relatorio"?relatorio:protocolo);}}>📋 Copiar</button>
        <button className="btn btn-s" style={{fontSize:11}} onClick={()=>{const w=window.open("","_blank");if(!w)return;w.document.write(`<pre style="font-family:monospace;white-space:pre-wrap;padding:24px;font-size:12px;line-height:1.7">${(abaRel==="relatorio"?relatorio:protocolo).replace(/</g,"&lt;")}</pre>`);w.document.close();w.print();}}>🖨️ PDF</button>
        {pacSel?.telefone&&<button style={{gridColumn:"1/-1",padding:"9px 0",borderRadius:8,border:"1px solid #25D36640",background:"#25D36618",color:"#25D366",fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={()=>{const num=pacSel.telefone.replace(/[^0-9]/g,"");const txt=(abaRel==="relatorio"?relatorio:protocolo).substring(0,900)+"...";window.open(`https://wa.me/${num}?text=${encodeURIComponent(txt)}`,"_blank");}}>📱 Enviar WhatsApp</button>}
        <button className="btn btn-s" style={{gridColumn:"1/-1",fontSize:10}} onClick={()=>{setRelatorio(null);setProtocolo(null);setFaseSel(null);setPacSel(null);}}>← Nova Sessão</button>
      </div>
    </div>
  );

  if (faseSel && pacSel && showHistorico) {
    const anterior = historico[0];
    return <ModuloHikariExecutor fase={faseSel} paciente={pacSel} user={user} consultaAnterior={anterior?.dados_formulario}
      onGuardar={async(tipo,dados)=>{
        await sb.from("consultas").insert({terapeuta_id:user.id,paciente_id:pacSel.id,tipo,dados_formulario:dados,data:new Date().toISOString().split("T")[0]});
        setRelatorio(dados.relatorio);
        setProtocolo(dados.protocolo);
      }}
      onVoltar={()=>{setShowHistorico(false);setFaseSel(null);}} />;
  }

  if (faseSel && !pacSel) return (
    <SeletorPacienteUniversal user={user} titulo={`${faseSel.icone} ${faseSel.nome}`}
      onSelecionado={(p) => setPacSel(p)}
      onVoltar={() => setFaseSel(null)} />
  );

  // Mostrar histórico antes de iniciar (se houver sessões)
  if (faseSel && pacSel && !relatorio && !protocolo && !showHistorico) return (
    <PainelHistoricoPaciente paciente={pacSel} user={user} tipoFiltro="hikari"
      onNovaSessao={() => setShowHistorico(true)}
      onVoltar={() => setPacSel(null)} />
  );

  return (
    <div className="fade">
      <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d0518)",border:"1px solid #4a1a7c40",borderRadius:12,padding:"16px 18px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:24}}>🔮</span>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"#dde4f0"}}>Método Hikari Fafe</div>
            <div style={{fontSize:9,color:"#7a5a9a",letterSpacing:1}}>PÊNDULO · ETIQUETAS HEBRAICAS · REIKI · LIMPEZA ENERGÉTICA</div>
          </div>
        </div>
        <div style={{fontSize:10,color:"#7a5a9a",lineHeight:1.7}}>
          Selecciona a fase do atendimento. O relatório e protocolo são gerados automaticamente.
        </div>
      </div>

      {FASES_HIKARI.map(f=>(
        <div key={f.id} onClick={()=>setFaseSel(f)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",marginBottom:8,borderRadius:10,border:`1px solid ${f.cor}40`,background:`${f.cor}08`,cursor:"pointer",transition:"all .18s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=f.cor;e.currentTarget.style.background=f.cor+"18";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=f.cor+"40";e.currentTarget.style.background=f.cor+"08";}}>
          <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(135deg,${f.cor},#0d0518)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{f.icone}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{f.nome}</div>
            <div style={{fontSize:10,color:"#7a5a9a"}}>{f.desc}</div>
          </div>
          <div style={{color:f.cor,fontSize:16}}>▶</div>
        </div>
      ))}

      <div style={{padding:10,background:"#0a0518",border:"1px solid #2a0a4c",borderRadius:8,marginTop:8}}>
        <div style={{fontSize:9,color:"#5a3a7a",lineHeight:1.7}}>
          🔒 Método protegido. Todos os dados ficam guardados na ficha do paciente para cruzamento evolutivo entre sessões.
        </div>
      </div>
    </div>
  );
}

function ModuloADTab({ user, temAcesso, onFarmacia, onInfanto }) {
  const [sel, setSel] = useState(null);       // tipo seleccionado
  const [pacSel, setPacSel] = useState(null); // paciente seleccionado
  const [pacs, setPacs] = useState([]);
  const [busca, setBusca] = useState("");
  const [relatorio, setRelatorio] = useState(null);

  useEffect(()=>{
    if (!temAcesso) return;
    sb.from("pacientes").select("id,nome,telefone").eq("terapeuta_id",user?.id).order("nome")
      .then(({data})=>setPacs(data||[]));
  },[user?.id, temAcesso]);

  if (!temAcesso) return (
    <div className="fade" style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:12}}>🧠</div>
      <div style={{fontWeight:800,color:"#dde4f0",fontSize:"1.1rem",marginBottom:8}}>Módulo Ansiedade & Depressão</div>
      <div style={{color:"#7a5a9a",fontSize:12,lineHeight:1.8,marginBottom:20}}>
        Acesso reservado a terapeutas certificados.<br/>
        Solicita a activação ao administrador.
      </div>
      <button className="btn btn-s" style={{borderColor:"#4a1a7c",color:"#c8a8f0",fontSize:12}} onClick={()=>window.open("https://t.me/+rOkqo8Orr-NhOTVk","_blank")}>
        📩 Pedir Acesso
      </button>
    </div>
  );

  if (sel && pacSel && mostrarSessao) return (
    <>
      <ModuloADExecutor tipo={sel.id} paciente={pacSel} user={user}
        onVoltar={()=>{setMostrarSessao(false);setPacSel(null);setSel(null);}}
        onGuardar={async(tipo,dados)=>{
          await sb.from("consultas").insert({terapeuta_id:user.id,paciente_id:pacSel.id,tipo,dados_formulario:dados,data:new Date().toISOString().split("T")[0]});
          setRelatorio(dados.relatorio);
        }}
      />
      {relatorio && (
        <EnviarRelatorio texto={relatorio} paciente={pacSel} onFechar={()=>setRelatorio(null)}/>
      )}
    </>
  );

  if (sel && !pacSel) return (
    <div className="fade">
      <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:12}} onClick={()=>setSel(null)}>← Voltar</button>
      <div style={{fontWeight:700,color:"#c8a8f0",fontSize:13,marginBottom:10}}>🧠 {sel.nome} — Seleccionar Paciente</div>
      <input className="inp" placeholder="🔍 Pesquisar paciente..." value={busca} onChange={e=>setBusca(e.target.value)} style={{marginBottom:8}}/>
      <div style={{maxHeight:320,overflowY:"auto"}}>
        {pacs.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())).map(p=>(
          <div key={p.id} onClick={()=>setPacSel(p)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#050810",border:"1px solid #1a0a2e",borderRadius:8,marginBottom:5,cursor:"pointer",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#9a5ae0"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1a0a2e"}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#4a1a7c,#2a0d4c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>
            <div style={{flex:1,fontWeight:600,fontSize:12,color:"#c8a8f0"}}>{p.nome}</div>
            <div style={{color:"#9a5ae0"}}>▶</div>
          </div>
        ))}
        {pacs.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())).length===0 && busca.length>1 && (
          <button className="btn btn-p" style={{fontSize:11,background:"#4a1a7c",borderColor:"#4a1a7c"}} onClick={async()=>{
            const{data,error}=await sb.from("pacientes").insert({nome:busca.trim(),terapeuta_id:user.id}).select().single();
            if(!error&&data){setPacs(ps=>[...ps,data]);setPacSel(data);}
          }}>➕ Criar "{busca.trim()}" e avançar</button>
        )}
      </div>
    </div>
  );

  // Lista de tipos de sessão
  return (
    <div className="fade">
      <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d0518)",border:"1px solid #4a1a7c40",borderRadius:12,padding:"16px 18px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:24}}>🧠</span>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"#dde4f0"}}>Ansiedade & Depressão</div>
            <div style={{fontSize:9,color:"#7a5a9a",letterSpacing:1}}>MÓDULO EXCLUSIVO · ACESSO CERTIFICADO</div>
          </div>
        </div>
        <div style={{fontSize:10,color:"#7a5a9a",lineHeight:1.7}}>
          Protocolo especializado para avaliação e acompanhamento terapêutico de ansiedade e depressão. Selecciona o tipo de sessão para iniciar.
        </div>
      </div>

      {MODULO_AD_CONFIG.tipos.map(t=>(
        <div key={t.id} onClick={()=>setSel(t)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",marginBottom:8,borderRadius:10,border:`1px solid ${t.cor}40`,background:`${t.cor}08`,cursor:"pointer",transition:"all .18s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=t.cor;e.currentTarget.style.background=t.cor+"18";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=t.cor+"40";e.currentTarget.style.background=t.cor+"08";}}>
          <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(135deg,${t.cor},#0d0518)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{t.icone}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{t.nome}</div>
            <div style={{fontSize:10,color:"#7a5a9a"}}>{t.sub}</div>
          </div>
          <div style={{color:t.cor,fontSize:16}}>▶</div>
        </div>
      ))}

      {/* Acesso rápido a Farmácia e Infanto dentro do módulo A&D */}
      <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        <button className="btn btn-s" style={{fontSize:10,borderColor:"#1a5a4c",color:"#5ae0d8"}} onClick={onFarmacia}>🌿 Farmácia</button>
        <button className="btn btn-s" style={{fontSize:10,borderColor:"#5a4a1a",color:"#f0c070"}} onClick={onInfanto}>👶 Infanto-Juvenil</button>
      </div>
      <div style={{padding:10,background:"#0a0518",border:"1px solid #2a0a4c",borderRadius:8}}>
        <div style={{fontSize:9,color:"#5a3a7a",lineHeight:1.7}}>
          🔒 Propriedade intelectual protegida. Acesso controlado. Não partilhar.
        </div>
      </div>
    </div>
  );
}


// ─── MÓDULO HIKARI FAFE COMPLETO (presencial + distância) ────────────────────
function ModuloHikariCompleto({ user, temHikari }) {
  const [sub, setSub] = useState("presencial"); // presencial | distancia

  if (!temHikari) return (
    <div className="fade" style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>🔮</div>
      <div style={{fontWeight:800,color:"#dde4f0",fontSize:"1rem",marginBottom:8}}>Método Hikari Fafe</div>
      <div style={{color:"#7a5a9a",fontSize:12,lineHeight:1.8,marginBottom:20}}>
        Acesso restrito. Solicita activação ao administrador.
      </div>
      <button className="btn btn-s" style={{borderColor:"#4a1a7c",color:"#c8a8f0",fontSize:12}}
        onClick={()=>window.open("https://t.me/+rOkqo8Orr-NhOTVk","_blank")}>
        📩 Pedir Acesso
      </button>
    </div>
  );

  return (
    <div className="fade">
      {/* Header do método */}
      <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d0518)",border:"1px solid #4a1a7c50",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <span style={{fontSize:22}}>🔮</span>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"#dde4f0"}}>Método Hikari Fafe</div>
            <div style={{fontSize:9,color:"#7a5a9a",letterSpacing:1}}>PÊNDULO · REIKI · ETIQUETAS HEBRAICAS · 72 NOMES DE DEUS</div>
          </div>
        </div>
        <div style={{fontSize:10,color:"#5a3a7a",lineHeight:1.6}}>
          Método de avaliação e limpeza energética. Funciona presencialmente e à distância.
        </div>
      </div>

      {/* Selector presencial / distância */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        <div onClick={()=>setSub("presencial")}
          style={{padding:"12px 10px",borderRadius:10,border:`2px solid ${sub==="presencial"?"#4a1a7c":"#1a0a2e"}`,background:sub==="presencial"?"rgba(74,26,124,.2)":"#050810",cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
          <div style={{fontSize:20,marginBottom:4}}>🙌</div>
          <div style={{fontSize:11,fontWeight:800,color:sub==="presencial"?"#c8a8f0":"#8ba3c0"}}>Presencial</div>
          <div style={{fontSize:9,color:"#5a3a7a",marginTop:2}}>Triagem · Consultas · Acompanhamento</div>
        </div>
        <div onClick={()=>setSub("distancia")}
          style={{padding:"12px 10px",borderRadius:10,border:`2px solid ${sub==="distancia"?"#4a1a7c":"#1a0a2e"}`,background:sub==="distancia"?"rgba(74,26,124,.2)":"#050810",cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
          <div style={{fontSize:20,marginBottom:4}}>🔯</div>
          <div style={{fontSize:11,fontWeight:800,color:sub==="distancia"?"#c8a8f0":"#8ba3c0"}}>🔯 Intervenção Energética</div>
          <div style={{fontSize:9,color:"#5a3a7a",marginTop:2}}>Limpeza · Processos · Desbloqueio · Casas · Caminhos</div>
        </div>
      </div>

      {/* Conteúdo por sub-tab */}
      {sub === "presencial" && <ModuloHikariTab user={user} temAcesso={temHikari} />}
      {sub === "distancia"  && <PainelDistancia user={user} />}
    </div>
  );
}

// ─── MÓDULO EXCLUSIVO — tab protegida ───────────────────────────────────────
// ModuloExclusivoTab é agora o wrapper do ModuloADTab
// ModuloExclusivoTab = apenas A&D (BioMicroHertz / Especializado)
// Hikari Fafe tem tab própria: "hikari_tab" → ModuloHikariCompleto
function ModuloExclusivoTab({ user, temAcesso, adminMode, onFarmacia, onInfanto }) {
  return <ModuloADTab user={user} temAcesso={temAcesso} onFarmacia={onFarmacia||(() => {})} onInfanto={onInfanto||(() => {})} />;
}
function ModuloExclusivoTabLegado({ user, temAcesso, adminMode }) {
  const [modulos, setModulos] = useState([]);
  const [sel, setSel] = useState(null);
  const [pacs, setPacs] = useState([]);
  const [pacSel, setPacSel] = useState(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!temAcesso) return;
    sb.from("custom_modules").select("*")
      .eq("terapeuta_id", user?.id).eq("publicado", true)
      .not("bloqueado_com", "is", null)
      .order("criado_em", { ascending: false })
      .then(({data}) => setModulos(data || []));
    sb.from("pacientes").select("id,nome,telefone").eq("terapeuta_id", user?.id).order("nome")
      .then(({data}) => setPacs(data || []));
  }, [user?.id, temAcesso]);

  if (!temAcesso) return (
    <div className="fade" style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontWeight:800,color:"#dde4f0",fontSize:"1.1rem",marginBottom:8}}>Módulo Exclusivo — Acesso Restrito</div>
      <div style={{color:"#5a7a9a",fontSize:12,lineHeight:1.8,marginBottom:20}}>
        Este módulo está reservado a terapeutas certificados e autorizados pelo administrador.<br/>
        A sua propriedade intelectual está protegida por 3 camadas de segurança independentes.
      </div>
      <div style={{background:"#0a1e2e",border:"1px solid #1a3a5c",borderRadius:8,padding:12,marginBottom:16,textAlign:"left"}}>
        {[["🗄️ Base de dados","RLS impede acesso mesmo via API directa"],["⚙️ Servidor","Flag has_exclusive_therapy_access = false por defeito"],["🖥️ Interface","Componente não existe no DOM quando bloqueado"]].map(([c,d])=>(
          <div key={c} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
            <div style={{fontSize:11,color:"#00c6b8",fontWeight:700,flexShrink:0}}>{c}</div>
            <div style={{fontSize:10,color:"#5a7a9a"}}>{d}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-s" style={{fontSize:12}} onClick={()=>window.open("https://t.me/+rOkqo8Orr-NhOTVk","_blank")}>📩 Pedir Activação ao Admin</button>
    </div>
  );

  if (sel && pacSel) return (
    <ExecutorModuloCustomizado modulo={sel} paciente={pacSel} user={user}
      onGuardar={async(tipo,dados) => {
        await sb.from("consultas").insert({terapeuta_id:user.id,paciente_id:pacSel.id,tipo,dados_formulario:dados,data:new Date().toISOString().split("T")[0]});
        setSel(null); setPacSel(null);
      }}
      onVoltar={()=>{ setSel(null); setPacSel(null); }} />
  );

  if (sel && !pacSel) return (
    <div className="fade">
      <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:12}} onClick={()=>setSel(null)}>← Voltar</button>
      <div className="card-t" style={{marginBottom:8}}>Seleccionar Paciente — {sel.nome}</div>
      <input className="inp" placeholder="🔍 Pesquisar..." value={busca} onChange={e=>setBusca(e.target.value)} style={{marginBottom:8}}/>
      <div style={{maxHeight:300,overflowY:"auto"}}>
        {pacs.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())).map(p=>(
          <div key={p.id} onClick={()=>setPacSel(p)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#050810",border:"1px solid #0d1828",borderRadius:8,marginBottom:5,cursor:"pointer",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#00c6b8"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#0d1828"}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#0d1828",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>
            <div style={{flex:1,fontWeight:600,fontSize:12,color:"#b0c4d8"}}>{p.nome}</div>
            <div style={{color:"#00c6b8"}}>▶</div>
          </div>
        ))}
        {pacs.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())).length===0 && busca.length>1 && (
          <button className="btn btn-p" style={{fontSize:11}} onClick={async()=>{
            const {data,error}=await sb.from("pacientes").insert({nome:busca.trim(),terapeuta_id:user.id}).select().single();
            if(!error&&data){setPacs(ps=>[...ps,data]);setPacSel(data);}
          }}>➕ Criar "{busca.trim()}" e avançar</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fade">
      <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d1428)",border:"1px solid #3a1a5c",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:800,color:"#dde4f0",marginBottom:2}}>🧠 Módulo Exclusivo</div>
        <div style={{fontSize:10,color:"#7a5a9a"}}>Acesso certificado activo — módulos protegidos disponíveis</div>
      </div>
      {modulos.length === 0 && (
        <div style={{textAlign:"center",padding:"24px 0",color:"#3d5a7a",fontSize:12}}>
          Nenhum módulo exclusivo publicado ainda.<br/>
          {adminMode && <span style={{color:"#00c6b8"}}>Cria módulos em "Métodos Terapêuticos".</span>}
        </div>
      )}
      {modulos.map(m=>(
        <div key={m.id} onClick={()=>setSel(m)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",marginBottom:8,borderRadius:10,border:"1px solid #3a1a5c",background:"#0d0518",cursor:"pointer",transition:"all .18s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#9a5ae0";e.currentTarget.style.background="#140a24";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#3a1a5c";e.currentTarget.style.background="#0d0518";}}>
          <div style={{width:42,height:42,borderRadius:9,background:"linear-gradient(135deg,#4a1a7c,#2a0d4c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🧠</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:12,color:"#c8a8f0"}}>{m.nome}</div>
            <div style={{fontSize:10,color:"#7a5a9a"}}>{m.descricao||"Módulo certificado"}</div>
          </div>
          <div style={{color:"#9a5ae0",fontSize:16}}>▶</div>
        </div>
      ))}
    </div>
  );
}

function ModuloMetodo({ user, adminMode, temAcesso, temHikari, initAba, voltar }) {
  const [aceite, setAceite] = useState(jaAceitou(user?.id, "metodo"));
  const [aba, setAba] = useState(initAba || "consulta");
  useEffect(() => {
    if (initAba) {
      setAba(initAba);
      // Resetar fluxo de consulta ao mudar de aba via link externo
      if (initAba !== "consulta") {
        setFormAtivo(null);
        setPacSel(null);
        setPacConfirmado(false);
      }
    }
  }, [initAba]);
  const [qForm, setQForm] = useState(null);
  const [formAtivo, setFormAtivo] = useState(null); // "form_a" | "form_b" | "form_c"
  const [caminhoInit, setCaminhoInit] = useState(null);
  const [tituloConsulta, setTituloConsulta] = useState("");
  const [pacSel, setPacSel] = useState(null);
  const [pacs, setPacs] = useState([]); // FIX: estado local de pacientes
  const [modulos, setModulos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ok, setOk] = useState("");
  const [moduloCustomSel, setModuloCustomSel] = useState(null);
  const [moduloCustomCarregado, setModuloCustomCarregado] = useState(null);
  const [showModuloEditor, setShowModuloEditor] = useState(false);
  const [modUniversal, setModUniversal] = useState(null); // módulo universal carregado
  const [pacConfirmado, setPacConfirmado] = useState(false); // passou pelo histórico
  const [relatorioFinal, setRelatorioFinal] = useState(null); // relatório pós-consulta

  useEffect(() => {
    if (user?.id) {
      // Carrega APENAS os pacientes deste terapeuta (isolamento garantido)
      sb.from("pacientes").select("id,nome,telefone,medicacao,email")
        .eq("terapeuta_id", user.id)  // RLS + filtro código = dupla protecção
        .order("nome")
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao carregar pacientes:', error);
            return;
          }
          setPacs(data || []);
        })
        .catch(err => console.error('Erro fatal ao carregar pacientes:', err));
    }
  }, [user]);

  // Carregar módulo customizado quando selecionado
  useEffect(() => {
    if (moduloCustomSel) {
      sb.from("custom_modules").select("*").eq("id", moduloCustomSel).single()
        .then(({ data, error }) => {
          if (error) { console.error("Erro ao carregar módulo:", error); return; }
          setModuloCustomCarregado(data);
        });
    }
  }, [moduloCustomSel]);

  // Quando o terapeuta escolhe o tipo de consulta, primeiro selecciona o paciente
  const handleIniciar = (tipoForm, caminho, titulo, moduloId) => {
    setFormAtivo(tipoForm);
    setCaminhoInit(caminho || null);
    setTituloConsulta(titulo || "");
    setModuloCustomSel(moduloId || null);
    setAba("consulta_ativa");
  };

  const voltarMenu = () => {
    setFormAtivo(null);
    setPacSel(null);
    setPacConfirmado(false);
    setBusca("");
    setAba("consulta");
  };

  // Guardar consulta na ficha com isolamento total
  const handleGuardar = async (tipo, dados) => {
    try {
      const relatorio = gerarRelatorioFiel(tipo, dados, pacSel?.nome || "Paciente");
      const registo = {
        paciente_id: pacSel?.id || null,
        paciente_nome: pacSel?.nome || "",
        terapeuta_id: user.id,
        tipo,
        dados_formulario: dados,
        relatorio,
        data: new Date().toISOString().split("T")[0],
      };
      let { error } = await sb.from("consultas").insert(registo);
      if (error) {
        // Tentativa de recurso: gravar versão mínima garantida (caso faltem colunas)
        const minimo = {
          paciente_id: pacSel?.id || null,
          paciente_nome: pacSel?.nome || "",
          terapeuta_id: user.id,
          tipo,
          notas: relatorio,
          data: new Date().toISOString().split("T")[0],
        };
        const r2 = await sb.from("consultas").insert(minimo);
        if (r2.error) throw r2.error;
      }
      setOk("✅ Guardado na ficha de " + (pacSel?.nome || "paciente") + "!");
      setTimeout(() => setOk(""), 3000);
      // Mostrar relatório para enviar ao paciente
      setRelatorioFinal({ texto: relatorio, paciente: pacSel });
    } catch (err) {
      alert("Erro ao guardar: " + (err.message || err) + "\n\nVerifica se a tabela 'consultas' tem as colunas necessárias.");
    }
  };

  if (!aceite) return (
    <div className="fade" style={{maxWidth:560,margin:"0 auto",padding:"8px 0"}}>
      <div style={{background:"linear-gradient(135deg,#0a1e2e,#061428)",border:"1px solid #1a3a5c",borderRadius:14,padding:"28px 24px",marginBottom:12,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:10}}>🧠</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#dde4f0",marginBottom:6,letterSpacing:1}}><TextoEditavel chave="metodo.titulo" padrao="Módulo de Atendimento Especializado" user={user} /></div>
        <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.7,maxWidth:380,margin:"0 auto"}}><TextoEditavel chave="metodo.subtitulo" padrao="Ferramenta de apoio a terapeutas certificados para conduzir atendimentos estruturados com protocolos guiados, mapeamento emocional e geração de relatórios de consciência." user={user} multiline /></div>
      </div>
      <div className="card" style={{marginBottom:10}}>
        <div className="card-t"><TextoEditavel chave="metodo.inclui_titulo" padrao="O que este módulo inclui" user={user} /></div>
        {[["🩺","3 Formulários Guiados","1º Atendimento · Análise Energética · Atendimento Estruturado"],["🗺️","Grelha Completa de Mapeamento","Todos os sistemas: Superior, Central, Inferior + Escudos + Temporalidade"],["📄","Relatório Fiel ao Protocolo","Gerado automaticamente com apenas os campos preenchidos"],["📤","Envio em PDF e WhatsApp","Imprime, envia ou copia com um toque"],["🔒","Dados 100% isolados","Os teus pacientes são exclusivamente teus — nenhum outro terapeuta acede"],].map(([ic,t,d],i)=>(
          <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid #0d1828"}}>
            <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
            <div><div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}><TextoEditavel chave={`metodo.feat${i}_t`} padrao={t} user={user} /></div><div style={{fontSize:10,color:"#3d5a7a",marginTop:2,lineHeight:1.5}}><TextoEditavel chave={`metodo.feat${i}_d`} padrao={d} user={user} multiline /></div></div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(251,191,36,.04)",border:"1px solid rgba(251,191,36,.18)",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:11,color:"#fbbf24",marginBottom:8}}><TextoEditavel chave="metodo.aviso_titulo" padrao="⚠️ Aviso Obrigatório" user={user} /></div>
        {["Este módulo é uma ferramenta de apoio. Não substitui a tua formação certificada nem o teu julgamento clínico.","Podes cometer erros. A responsabilidade pelo que indicares ao paciente é exclusivamente tua.","Não emite diagnósticos médicos.","O conteúdo é propriedade intelectual protegida. O acesso é pessoal e intransmissível."].map((p,i)=>(
          <div key={i} style={{fontSize:11,color:"#fde68a",marginBottom:4,lineHeight:1.6,paddingLeft:14,position:"relative"}}>
            <span style={{position:"absolute",left:0,color:"#f59e0b"}}>•</span><TextoEditavel chave={`metodo.aviso${i}`} padrao={p} user={user} multiline />
          </div>
        ))}
      </div>
      <button className="btn btn-p" style={{padding:"13px 0",fontSize:13}} onClick={()=>{ registarAceite(user?.id,"metodo"); setAceite(true); }}>
        ✅ Compreendi e assumo a responsabilidade profissional
      </button>
    </div>
  );

  const tabs = [
    ["consulta",     "🩺 Consulta"],
    ["preconsulta",  "📤 Pré-Consulta"],
    ["packs",        "💳 Packs"],
    ["teleconsulta", "📹 Vídeo"],
    ["questionario", "📋 Quest."],
    ["infanto",      "👶 Infanto"],
    ["farmacia",     "🌿 Farmácia"],
    ["assistente",   "🤖 IA"],
    ["audios",       "🎧 Áudios"],
    ...(temHikari ? [["hikari_tab",  "🔮 Hikari Fafe"]] : []),
    ...(temAcesso  ? [["exclusivo",  "🧠 A&D"]]        : []),
  ];

  // Ecrã de selecção de paciente (aparece ao escolher formulário)
  if (aba === "consulta_ativa" && formAtivo && !pacSel) {
    // Fase 1: selecionar paciente
    return (
      <SeletorPacienteUniversal
        user={user}
        titulo={tituloConsulta || "Seleccionar Paciente"}
        onSelecionado={(p) => { setPacSel(p); }}
        onVoltar={voltarMenu}
      />
    );
  }

  if (aba === "consulta_ativa" && formAtivo && pacSel && !pacConfirmado) {
    // Fase 2: mostrar histórico e confirmar início
    return (
      <PainelHistoricoPaciente
        paciente={pacSel}
        user={user}
        tipoFiltro={null}
        onNovaSessao={() => setPacConfirmado(true)}
        onVoltar={() => setPacSel(null)}
      />
    );
  }

  return (
    <div className="fade">
      {ok && <div className="al al-ok" style={{marginBottom:8}}>{ok}</div>}
      <div className="card">
        {voltar && <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:8}} onClick={voltar}>← Voltar</button>}
        <div style={{display:"flex",gap:4,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:4}}>
          {tabs.map(([k,l])=>(
            <button key={k} style={{flexShrink:0,padding:"6px 12px",borderRadius:16,border:"1px solid",borderColor:aba===k?"#00c6b8":"#0d1828",background:aba===k?"rgba(0,198,184,.12)":"transparent",color:aba===k?"#00c6b8":"#5a7a9a",fontSize:10,fontWeight:aba===k?700:400,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}
              onClick={()=>{ if(k==="consulta"){voltarMenu();}else{setFormAtivo(null);setPacSel(null);setAba(k);} }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Seções de edição do super admin removidas - só aparecem no Super Admin Panel */}

      {aba==="consulta" && !formAtivo && (
        <>
          <NovaConsulta user={user} onIniciar={handleIniciar} />
          <div style={{marginTop:10}}>
            <button className="btn btn-s" style={{fontSize:11,padding:"8px 0",borderColor:"#1a4a3a",color:"#5ae0d8"}} onClick={() => setShowModuloEditor(true)}>
              ✏️ Editar Método Universal
            </button>
          </div>
        </>
      )}
      {showModuloEditor && <MetodoUniversalEditor user={user} onClose={()=>setShowModuloEditor(false)} />}
      {aba==="preconsulta" && <PainelPreConsulta user={user} />}
      {aba==="packs" && <PainelPacks user={user} />}
      {aba==="teleconsulta" && <TeleconsultaPanel user={user} />}

      {aba==="consulta_ativa" && formAtivo && pacSel && pacConfirmado && (
        <>
          {formAtivo==="custom_module" && moduloCustomCarregado && <ExecutorModuloCustomizado modulo={moduloCustomCarregado} paciente={pacSel} user={user} onGuardar={voltarMenu} onVoltar={() => { setModuloCustomSel(null); setModuloCustomCarregado(null); voltarMenu(); }} />}
          {formAtivo==="universal" && <ExecutorMetodoUniversal paciente={pacSel} user={user} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
          {formAtivo==="form_a" && <FormPrimeiroAtendimento paciente={pacSel} user={user} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
          {formAtivo==="form_b" && <FormMapeamentoGrelha     paciente={pacSel} user={user} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
          {formAtivo==="form_c" && <FormAtendimentoEstruturado paciente={pacSel} user={user} caminhoInit={caminhoInit} tituloConsulta={tituloConsulta} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
        </>
      )}

      {relatorioFinal && (
        <div style={{position:"fixed",inset:0,background:"rgba(5,8,16,.97)",zIndex:500,overflowY:"auto",padding:"20px 16px 80px"}}>
          <div style={{maxWidth:640,margin:"0 auto"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>{setRelatorioFinal(null);voltarMenu();}}>✕ Fechar</button>
              <div style={{fontWeight:800,fontSize:14,color:"#dde4f0"}}>✅ Consulta guardada</div>
            </div>
            <EnviarRelatorio texto={relatorioFinal.texto} paciente={relatorioFinal.paciente} onFechar={()=>{setRelatorioFinal(null);voltarMenu();}}/>
          </div>
        </div>
      )}
      {aba==="questionario" && <Questionario user={user} initForm={qForm} />}
      {aba==="assistente"   && <Assistente user={user} />}
      {aba==="farmacia"     && <Farmacia adminMode={adminMode} />}
      {aba==="infanto"      && <Infanto adminMode={adminMode} ir={(ab,fk)=>{ setFormAtivo(null); setPacSel(null); if(fk) setQForm(fk); setAba(ab); }} />}
      {aba==="audios"       && <ModuloAudios />}
      {aba==="hikari_tab" && <ModuloHikariCompleto user={user} temHikari={temHikari} />}
      {aba==="exclusivo"  && <ModuloADTab user={user} temAcesso={temAcesso} onFarmacia={()=>setAba("farmacia")} onInfanto={()=>setAba("infanto")} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// QUESTIONÁRIOS
// ══════════════════════════════════════════════════════
// Nomes dos medos por bloco — revelados apenas no resultado (fiel ao original)
const MEDOS_NOMES = {
  1: "Medo da Pobreza",
  2: "Medo da Doença",
  3: "Medo da Crítica",
  4: "Medo da Morte",
  5: "Medo de Relacionamento",
  6: "Medo de Envelhecer",
  7: "Medo de Perder a Liberdade",
};

const FORMS_DEF = [
  {
    key: "pre_consulta",
    titulo: "Ficha de Pré-Consulta",
    descricao: "Preenche antes da primeira consulta. Podes enviar ao paciente por WhatsApp ou preencher presencialmente.",
    blocos: [
      { titulo: "Dados Pessoais", perguntas: [
        { id: "pc_nome", q: "Nome completo", tipo: "texto" },
        { id: "pc_idade", q: "Idade", tipo: "texto" },
        { id: "pc_profissao", q: "Profissão", tipo: "texto" },
        { id: "pc_cidade", q: "Cidade onde vives", tipo: "texto" },
        { id: "pc_como_conheceu", q: "Como chegaste até este espaço terapêutico?", tipo: "texto" },
      ]},
      { titulo: "Motivo e Contexto", perguntas: [
        { id: "pc_motivo", q: "Qual o principal motivo que te traz à consulta?", tipo: "texto" },
        { id: "pc_tempo", q: "Há quanto tempo sentes isso?", tipo: "texto" },
        { id: "pc_pior", q: "Quando piorou pela última vez?", tipo: "texto" },
        { id: "pc_gatilho", q: "Existe algum momento, pessoa ou situação que piora este quadro?", tipo: "texto" },
      ]},
      { titulo: "Saúde e Medicação", perguntas: [
        { id: "pc_diagnostico", q: "Tens algum diagnóstico médico actual?", tipo: "texto" },
        { id: "pc_medicacao", q: "Tomas alguma medicação? (nome, dose e frequência)", tipo: "texto" },
        { id: "pc_cirurgias", q: "Já tiveste cirurgias ou internamentos? Quando?", tipo: "texto" },
        { id: "pc_acompanhamento", q: "Tens acompanhamento médico, psicológico ou outro?", tipo: "sim_nao" },
      ]},
      { titulo: "Hábitos e Qualidade de Vida", perguntas: [
        { id: "pc_sono", q: "Como está o teu sono?", tipo: "escolha", opcoes: ["Muito bom", "Bom", "Irregular", "Mau", "Muito mau"] },
        { id: "pc_alimentacao", q: "Como classifica a tua alimentação?", tipo: "escolha", opcoes: ["Saudável", "Razoável", "Irregular", "Má"] },
        { id: "pc_exercicio", q: "Praticas exercício físico com regularidade?", tipo: "sim_nao" },
        { id: "pc_habitos", q: "Tens hábitos que queiras mencionar (álcool, tabaco, outros)?", tipo: "texto" },
      ]},
      { titulo: "Relacionamentos e Vida Emocional", perguntas: [
        { id: "pc_estado_civil", q: "Estado civil / situação relacional actual", tipo: "escolha", opcoes: ["Solteiro(a)", "Relacionamento", "Casado(a)", "Divorciado(a)", "Viúvo(a)"] },
        { id: "pc_familia", q: "Como descreves o teu ambiente familiar actualmente?", tipo: "texto" },
        { id: "pc_trabalho", q: "Como está a tua vida profissional?", tipo: "texto" },
        { id: "pc_suporte", q: "Sentes que tens suporte emocional (família, amigos)?", tipo: "sim_nao" },
      ]},
      { titulo: "Expectativas", perguntas: [
        { id: "pc_objetivo", q: "O que gostarias de alcançar com este acompanhamento?", tipo: "texto" },
        { id: "pc_mudanca", q: "O que precisaria de mudar na tua vida para te sentires melhor?", tipo: "texto" },
        { id: "pc_tentou", q: "Já tentaste outras abordagens terapêuticas? Com que resultados?", tipo: "texto" },
      ]},
    ],
  },
  {
    key: "pos_consulta",
    titulo: "Questionário Pós-Consulta",
    descricao: "Enviado após a sessão para acompanhar a evolução do paciente.",
    blocos: [
      { titulo: "Experiência da Sessão", perguntas: [
        { id: "pq_sensacao", q: "Como te sentes agora, após a sessão?", tipo: "escolha", opcoes: ["Muito melhor", "Melhor", "Igual", "Cansado(a)", "Emocionado(a)"] },
        { id: "pq_corpo", q: "Que sensações físicas notaste durante ou após a sessão?", tipo: "texto" },
        { id: "pq_emocional", q: "Que emoções surgiram durante a sessão?", tipo: "texto" },
        { id: "pq_revelacao", q: "Algo que tenha surpreendido ou tocado profundamente?", tipo: "texto" },
      ]},
      { titulo: "Protocolo e Compromisso", perguntas: [
        { id: "pq_protocolo", q: "Conseguiste cumprir o protocolo dado?", tipo: "escolha", opcoes: ["Sim, completamente", "Quase todo", "Parcialmente", "Não consegui"] },
        { id: "pq_audio", q: "Ouviste o áudio recomendado?", tipo: "sim_nao" },
        { id: "pq_dificuldades", q: "Que dificuldades encontraste ao aplicar o protocolo?", tipo: "texto" },
      ]},
      { titulo: "Evolução Desde a Última Sessão", perguntas: [
        { id: "pq_crises", q: "Quantas crises tiveste desde a última sessão?", tipo: "escolha", opcoes: ["Nenhuma", "1-2", "3-5", "Mais de 5"] },
        { id: "pq_melhorou", q: "O que melhorou desde a última sessão?", tipo: "texto" },
        { id: "pq_permanece", q: "O que ainda permanece ou piorou?", tipo: "texto" },
        { id: "pq_novos", q: "Surgiram novos sintomas ou situações?", tipo: "texto" },
      ]},
      { titulo: "Feedback e Próximos Passos", perguntas: [
        { id: "pq_satisfacao", q: "Nível de satisfação com a sessão", tipo: "escolha", opcoes: ["Excelente", "Muito bom", "Bom", "Regular"] },
        { id: "pq_partilha", q: "Algo que queiras partilhar com o terapeuta?", tipo: "texto" },
        { id: "pq_duvidas", q: "Tens alguma dúvida sobre o processo?", tipo: "texto" },
      ]},
    ],
  },
  {
    key: "escudos",
    titulo: "Questionário dos Escudos Emocionais",
    descricao: "Identifica os escudos emocionais activos. Escala: 1 = Não me identifico · 2 = Às vezes · 3 = Com frequência.",
    escala: [1, 2, 3],
    blocos: QUESTIONARIO_ESCUDOS.map(b => ({ titulo: b.titulo, perguntas: b.afirmacoes.map((a, i) => ({ id: b.blocoId + "_" + i, q: a, tipo: "escala" })) })),
  },
  {
    key: "medos",
    titulo: "Avaliação dos Medos Subconscientes",
    descricao: "Avaliação dos medos armazenados a partir de traumas vividos. Demora cerca de 5 minutos. Os resultados são mais precisos se preencher rapidamente, usando a primeira resposta que surgir. Não se preocupe em ser consistente em perguntas similares. As informações são confidenciais. Escala: 1 = discordo fortemente · 2 = discordo · 3 = neutro · 4 = concordo · 5 = concordo fortemente. Cada bloco corresponde a um medo — o nome é revelado apenas no resultado final, para não influenciar as respostas.",
    escala: [1, 2, 3, 4, 5],
    pontuacaoOculta: true,
    blocos: [
      { titulo: "Bloco 1", perguntas: [
        { id: "mb1_1", q: "Passei por muitas situações difíceis relacionadas ao dinheiro.", tipo: "escala" },
        { id: "mb1_2", q: "A minha relação com o meu pai foi bastante conturbada.", tipo: "escala" },
        { id: "mb1_3", q: "Presenciei momentos em que havia escassez de alimento em casa.", tipo: "escala" },
        { id: "mb1_4", q: "Preocupo-me e acredito que o meu futuro não será promissor e que estarei fadada(o) ao fracasso.", tipo: "escala" },
        { id: "mb1_5", q: "Tenho medo de mudar de emprego e acabar no desemprego, mesmo estando extremamente infeliz no emprego atual.", tipo: "escala" },
        { id: "mb1_6", q: "Os meus batimentos cardíacos aumentam quando recebo uma conta para pagar com que não contava.", tipo: "escala" },
        { id: "mb1_7", q: "Fico extremamente preocupada(o) quando penso no futuro.", tipo: "escala" },
        { id: "mb1_8", q: "Algum familiar meu entrou em falência financeira por má gestão.", tipo: "escala" },
        { id: "mb1_9", q: "Não acredito que consigo ter uma vida financeira tranquila.", tipo: "escala" },
        { id: "mb1_10", q: "Na minha infância passei por situações difíceis relacionadas com dinheiro.", tipo: "escala" },
      ]},
      { titulo: "Bloco 2", perguntas: [
        { id: "mb2_1", q: "Não me sinto confortável quando sei que tenho de ir ao médico.", tipo: "escala" },
        { id: "mb2_2", q: "Sempre que sinto algo diferente no meu corpo vou pesquisar.", tipo: "escala" },
        { id: "mb2_3", q: "Prefiro automedicar-me a esperar e ser tarde demais.", tipo: "escala" },
        { id: "mb2_4", q: "Fico extremamente preocupada(o) quando faço um exame.", tipo: "escala" },
        { id: "mb2_5", q: "Sofro só de pensar em ter uma doença.", tipo: "escala" },
        { id: "mb2_6", q: "Tenho receio de adoecer e precisar de tratamento.", tipo: "escala" },
        { id: "mb2_7", q: "Já perdi pessoas que eu amava por doença.", tipo: "escala" },
        { id: "mb2_8", q: "Fico muito assustada(o) quando o meu coração acelera, penso ser um enfarte.", tipo: "escala" },
        { id: "mb2_9", q: "Tenho medo de ficar sozinha(o), passar mal e ninguém saber.", tipo: "escala" },
        { id: "mb2_10", q: "Tenho pensamentos relacionados ao meu estado de saúde mais de duas vezes no meu dia.", tipo: "escala" },
      ]},
      { titulo: "Bloco 3", perguntas: [
        { id: "mb3_1", q: "Não fico confortável quando as pessoas me olham.", tipo: "escala" },
        { id: "mb3_2", q: "Preocupo-me com o que pensam sobre mim.", tipo: "escala" },
        { id: "mb3_3", q: "Faço mais pelos outros do que por mim.", tipo: "escala" },
        { id: "mb3_4", q: "Não gosto de como sou fisicamente neste momento.", tipo: "escala" },
        { id: "mb3_5", q: "Sinto dificuldades em expressar a minha opinião de forma clara.", tipo: "escala" },
        { id: "mb3_6", q: "Mesmo que o meu pensamento seja contrário ao que me peçam, acabo por fazer o que dizem.", tipo: "escala" },
        { id: "mb3_7", q: "Sou extremamente insegura(o).", tipo: "escala" },
        { id: "mb3_8", q: "Não gosto do meu corpo.", tipo: "escala" },
        { id: "mb3_9", q: "Não me sinto à vontade em lugares públicos.", tipo: "escala" },
        { id: "mb3_10", q: "Quando converso tenho dificuldades em olhar nos olhos.", tipo: "escala" },
      ]},
      { titulo: "Bloco 4", perguntas: [
        { id: "mb4_1", q: "Sinto-me insegura(o) ao conduzir.", tipo: "escala" },
        { id: "mb4_2", q: "Não fico bem quando estou sozinha(o).", tipo: "escala" },
        { id: "mb4_3", q: "Preocupo-me como será a minha vida quando estiver com mais de 70 anos.", tipo: "escala" },
        { id: "mb4_4", q: "Penso duas vezes antes de iniciar alguma coisa, pois acho que pode correr mal.", tipo: "escala" },
        { id: "mb4_5", q: "Não lido bem com cerimónias fúnebres.", tipo: "escala" },
        { id: "mb4_6", q: "Sou muito insegura(o) quando vou à rua.", tipo: "escala" },
        { id: "mb4_7", q: "Incomoda-me muito pensar em sofrer violências (assalto/sequestro/luta/violação).", tipo: "escala" },
        { id: "mb4_8", q: "Estou sempre a pensar no dia de amanhã.", tipo: "escala" },
        { id: "mb4_9", q: "Situações de perigo assustam-me.", tipo: "escala" },
        { id: "mb4_10", q: "Fico preocupada(o) em perder pessoas que eu amo.", tipo: "escala" },
      ]},
      { titulo: "Bloco 5", perguntas: [
        { id: "mb5_1", q: "Sou insegura(o) e ciumenta(o).", tipo: "escala" },
        { id: "mb5_2", q: "Tenho necessidade de agradar quem amo.", tipo: "escala" },
        { id: "mb5_3", q: "Eu não acredito no meu valor pessoal.", tipo: "escala" },
        { id: "mb5_4", q: "Acho que as pessoas se aproximam de mim com interesse.", tipo: "escala" },
        { id: "mb5_5", q: "Decepcionei-me com o amor e hoje prefiro estar sozinha(o).", tipo: "escala" },
        { id: "mb5_6", q: "Não acredito em demonstrações exageradas de carinho.", tipo: "escala" },
        { id: "mb5_7", q: "Sinto-me sozinha(o), mesmo quando tenho pessoas ao meu lado.", tipo: "escala" },
        { id: "mb5_8", q: "Sofro de um vazio interior constante.", tipo: "escala" },
        { id: "mb5_9", q: "Tenho dificuldades em acreditar nos outros.", tipo: "escala" },
        { id: "mb5_10", q: "Digo sim mesmo quando tenho vontade de dizer não.", tipo: "escala" },
      ]},
      { titulo: "Bloco 6", perguntas: [
        { id: "mb6_1", q: "Não gosto do meu aspecto físico atualmente.", tipo: "escala" },
        { id: "mb6_2", q: "Sinto-me cada vez mais desinteressante.", tipo: "escala" },
        { id: "mb6_3", q: "Fico com receio de esquecer coisas importantes.", tipo: "escala" },
        { id: "mb6_4", q: "Sinto-me cansada(o) constantemente.", tipo: "escala" },
        { id: "mb6_5", q: "Não vejo graça na vida.", tipo: "escala" },
        { id: "mb6_6", q: "Perdi o interesse em sair de casa.", tipo: "escala" },
        { id: "mb6_7", q: "Sinto-me incompreendida(o).", tipo: "escala" },
        { id: "mb6_8", q: "Faço tudo o que posso para estar bem na minha velhice.", tipo: "escala" },
        { id: "mb6_9", q: "Penso que o meu futuro poderá ser triste.", tipo: "escala" },
        { id: "mb6_10", q: "Acredito que tenho de estar atenta(o) à minha saúde constantemente.", tipo: "escala" },
      ]},
      { titulo: "Bloco 7", perguntas: [
        { id: "mb7_1", q: "Tenho tendência a ficar entediada(o) com as rotinas.", tipo: "escala" },
        { id: "mb7_2", q: "Penso muito antes de assumir compromissos.", tipo: "escala" },
        { id: "mb7_3", q: "Não consigo estar muito tempo com a mesma pessoa.", tipo: "escala" },
        { id: "mb7_4", q: "Tenho facilidade em mudar os meus planos consoante sinto vontade.", tipo: "escala" },
        { id: "mb7_5", q: "Não gosto de me sentir pressionada(o).", tipo: "escala" },
        { id: "mb7_6", q: "Não aceito bem ordens quando não partilho da mesma opinião.", tipo: "escala" },
        { id: "mb7_7", q: "Não gosto de me sentir desrespeitada(o) na minha privacidade.", tipo: "escala" },
        { id: "mb7_8", q: "Prefiro controlar as pessoas do que ser controlada(o).", tipo: "escala" },
        { id: "mb7_9", q: "Não lido bem com a partilha de coisas que são importantes para mim.", tipo: "escala" },
        { id: "mb7_10", q: "Prefiro perder um bom emprego do que a minha liberdade.", tipo: "escala" },
      ]},
    ],
  },
  {
    key: "anamnese_crianca",
    titulo: "Anamnese da Criança",
    descricao: "Preenchido pela criança (5-11 anos), com linguagem acessível. Para crianças mais novas, usar Ficha dos Pais.",
    blocos: [
      { titulo: "Quem és tu", perguntas: [
        { id: "ac_nome", q: "Qual é o teu nome?", tipo: "texto" },
        { id: "ac_idade", q: "Quantos anos tens?", tipo: "texto" },
        { id: "ac_escola", q: "Em que escola andas?", tipo: "texto" },
        { id: "ac_mora", q: "Com quem moras?", tipo: "texto" },
      ]},
      { titulo: "O que gostas", perguntas: [
        { id: "ac_brincadeiras", q: "Quais são as tuas brincadeiras ou actividades preferidas?", tipo: "texto" },
        { id: "ac_amigos", q: "Tens amigos na escola? Conta-me um pouco sobre eles.", tipo: "texto" },
        { id: "ac_familia", q: "O que gostas de fazer com a tua família?", tipo: "texto" },
        { id: "ac_super", q: "Se fosses um super-herói, qual seria o teu superpoder?", tipo: "texto" },
      ]},
      { titulo: "Como te sentes", perguntas: [
        { id: "ac_humor", q: "Como te sentes a maior parte do tempo?", tipo: "escolha", opcoes: ["Feliz", "Animado(a)", "Normal", "Triste", "Com raiva", "Com medo"] },
        { id: "ac_escola_sentir", q: "Como te sentes na escola?", tipo: "escolha", opcoes: ["Adoro", "Gosto", "É normal", "Não gosto muito", "Detesto"] },
        { id: "ac_quando_triste", q: "O que te deixa triste ou com raiva?", tipo: "texto" },
        { id: "ac_quando_feliz", q: "O que te deixa feliz?", tipo: "texto" },
      ]},
      { titulo: "Preocupações e Medos", perguntas: [
        { id: "ac_medo", q: "Há alguma coisa que te assusta ou preocupa?", tipo: "texto" },
        { id: "ac_pesadelos", q: "Tens pesadelos ou dificuldade em dormir?", tipo: "sim_nao" },
        { id: "ac_queixa", q: "Há algo que te doa no corpo com frequência?", tipo: "texto" },
        { id: "ac_mudar", q: "Se pudesses mudar uma coisa na tua vida, o que seria?", tipo: "texto" },
      ]},
      { titulo: "Sonhos e Desejos", perguntas: [
        { id: "ac_sonho", q: "O que queres ser quando fores grande?", tipo: "texto" },
        { id: "ac_pedido", q: "Se pudesses pedir três desejos, quais seriam?", tipo: "texto" },
        { id: "ac_mensagem", q: "O que queres que os adultos saibam sobre ti?", tipo: "texto" },
      ]},
    ],
  },
  {
    key: "ficha_pais",
    titulo: "Ficha para Pais e Encarregados",
    descricao: "Anamnese completa respondida pelos pais ou encarregados de educação.",
    blocos: [
      { titulo: "Identificação", perguntas: [
        { id: "fp_nome_crianca", q: "Nome completo da criança", tipo: "texto" },
        { id: "fp_nascimento", q: "Data de nascimento", tipo: "texto" },
        { id: "fp_idade", q: "Idade actual", tipo: "texto" },
        { id: "fp_quem", q: "Quem está a preencher e grau de parentesco", tipo: "texto" },
        { id: "fp_composicao", q: "Composição do agregado familiar (quem vive com a criança)", tipo: "texto" },
      ]},
      { titulo: "Motivo e Queixa Principal", perguntas: [
        { id: "fp_motivo", q: "Qual o motivo desta consulta?", tipo: "texto" },
        { id: "fp_tempo", q: "Há quanto tempo observam estes comportamentos/sintomas?", tipo: "texto" },
        { id: "fp_feito", q: "O que já foi feito até ao momento?", tipo: "texto" },
        { id: "fp_manifesta", q: "Como se manifesta no dia a dia? Quando agrava ou melhora?", tipo: "texto" },
        { id: "fp_gatilho", q: "Existe alguma situação ou pessoa que desencadeia o comportamento?", tipo: "texto" },
      ]},
      { titulo: "Desenvolvimento", perguntas: [
        { id: "fp_gravidez", q: "Como foi a gravidez? Houve complicações?", tipo: "texto" },
        { id: "fp_parto", q: "Como foi o parto? (normal/cesariana, complicações)", tipo: "texto" },
        { id: "fp_marcos", q: "A criança atingiu os marcos do desenvolvimento na idade esperada? (gatinhar, andar, falar)", tipo: "texto" },
        { id: "fp_linguagem", q: "Como está o desenvolvimento da linguagem?", tipo: "texto" },
        { id: "fp_autonomia", q: "Qual o nível de autonomia para a idade?", tipo: "texto" },
      ]},
      { titulo: "Saúde e Alimentação", perguntas: [
        { id: "fp_diagnostico", q: "Tem algum diagnóstico médico?", tipo: "texto" },
        { id: "fp_medicacao", q: "Toma medicação? Qual e que dose?", tipo: "texto" },
        { id: "fp_alergias", q: "Tem alergias ou intolerâncias alimentares?", tipo: "texto" },
        { id: "fp_alimentacao", q: "Como classifica a alimentação da criança?", tipo: "escolha", opcoes: ["Muito boa", "Boa", "Regular", "Difícil / selectiva"] },
        { id: "fp_sono", q: "Como está o sono? (hora de deitar, dorme sozinha, pesadelos)", tipo: "texto" },
      ]},
      { titulo: "Escola e Relações Sociais", perguntas: [
        { id: "fp_escola", q: "Como é o desempenho escolar?", tipo: "escolha", opcoes: ["Muito bom", "Bom", "Regular", "Com dificuldades"] },
        { id: "fp_amigos", q: "Tem amigos? Como são as relações com os pares?", tipo: "texto" },
        { id: "fp_professores", q: "Há queixas dos professores? Quais?", tipo: "texto" },
        { id: "fp_comportamento", q: "Como descreve o comportamento na escola?", tipo: "texto" },
        { id: "fp_bullying", q: "Há situações de bullying (como vítima ou agressor)?", tipo: "sim_nao" },
      ]},
      { titulo: "Contexto Familiar e Emocional", perguntas: [
        { id: "fp_clima", q: "Como descreve o clima emocional em casa?", tipo: "texto" },
        { id: "fp_conflitos", q: "Existem conflitos familiares relevantes que possam afectar a criança?", tipo: "texto" },
        { id: "fp_separacao", q: "Houve separações, perdas ou mudanças importantes recentes?", tipo: "texto" },
        { id: "fp_trauma", q: "A criança vivenciou alguma situação traumática?", tipo: "texto" },
      ]},
    ],
  },
  {
    key: "ficha_professor",
    titulo: "Ficha para Professores / Educadores",
    descricao: "Avaliação comportamental e escolar respondida pelo professor ou educador.",
    blocos: [
      { titulo: "Identificação", perguntas: [
        { id: "prof_nome_crianca", q: "Nome da criança/aluno(a)", tipo: "texto" },
        { id: "prof_idade", q: "Idade e ano de escolaridade", tipo: "texto" },
        { id: "prof_nome_prof", q: "Nome do professor/educador e função", tipo: "texto" },
        { id: "prof_tempo", q: "Há quanto tempo conhece este aluno(a)?", tipo: "texto" },
      ]},
      { titulo: "Comportamento em Sala", perguntas: [
        { id: "prof_atencao", q: "Como é a atenção/concentração em sala de aula?", tipo: "escolha", opcoes: ["Muito boa", "Boa", "Irregular", "Difícil", "Muito difícil"] },
        { id: "prof_agitacao", q: "Existe agitação ou hiperactividade?", tipo: "escolha", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
        { id: "prof_impulsividade", q: "Há comportamentos impulsivos (interromper, agir sem pensar)?", tipo: "escolha", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente"] },
        { id: "prof_oposicao", q: "Existe comportamento opositor ou desafiante?", tipo: "sim_nao" },
        { id: "prof_descricao", q: "Descreva o comportamento típico em sala de aula", tipo: "texto" },
      ]},
      { titulo: "Aprendizagem e Desempenho", perguntas: [
        { id: "prof_rendimento", q: "Como classifica o rendimento académico geral?", tipo: "escolha", opcoes: ["Acima da média", "Na média", "Abaixo da média", "Com grandes dificuldades"] },
        { id: "prof_leitura", q: "Dificuldades específicas em leitura ou escrita?", tipo: "sim_nao" },
        { id: "prof_matematica", q: "Dificuldades em matemática ou raciocínio lógico?", tipo: "sim_nao" },
        { id: "prof_pontos_fortes", q: "Quais as maiores forças ou talentos deste aluno(a)?", tipo: "texto" },
        { id: "prof_pontos_fracos", q: "Quais as maiores dificuldades académicas?", tipo: "texto" },
      ]},
      { titulo: "Relações Sociais", perguntas: [
        { id: "prof_colegas", q: "Como são as relações com os colegas?", tipo: "escolha", opcoes: ["Muito boas", "Boas", "Regulares", "Com conflitos", "Isolamento"] },
        { id: "prof_amizades", q: "Tem amizades estáveis?", tipo: "sim_nao" },
        { id: "prof_conflitos", q: "Com que frequência há conflitos com outros alunos?", tipo: "escolha", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente"] },
        { id: "prof_vitima", q: "Já foi vítima de bullying ou excluído(a) pelo grupo?", tipo: "sim_nao" },
      ]},
      { titulo: "Aspectos Emocionais Observados", perguntas: [
        { id: "prof_humor", q: "Como descreve o estado emocional habitual?", tipo: "texto" },
        { id: "prof_ansiedade", q: "Observa sinais de ansiedade (tensão, agitação, queixas físicas)?", tipo: "sim_nao" },
        { id: "prof_tristeza", q: "Observa sinais de tristeza ou retraimento?", tipo: "sim_nao" },
        { id: "prof_preocupacoes", q: "Que situações parecem afectar mais o aluno emocionalmente?", tipo: "texto" },
        { id: "prof_observacoes", q: "Observações adicionais que considere relevantes", tipo: "texto" },
      ]},
    ],
  },
];
// Merge com formulários personalizados do admin (carregados dinamicamente)
let FORMS_CUSTOM = [];
const _aplicarOverrideEscudos = (f) => {
  if (!f || f.key !== "escudos") return f;
  const q = getConteudoMetodo("questionario_escudos", null);
  if (!q || !Array.isArray(q)) return f;
  return { ...f, blocos: q.map(b => ({ titulo: b.titulo, perguntas: (b.afirmacoes||[]).map((a, i) => ({ id: b.blocoId + "_" + i, q: a, tipo: "escala" })) })) };
};
const getForm = (k) => _aplicarOverrideEscudos([...FORMS_DEF, ...FORMS_CUSTOM].find(f => f.key === k));
const getAllForms = () => [...FORMS_DEF, ...FORMS_CUSTOM].map(_aplicarOverrideEscudos);


function FormFill({ form, value, onChange }) {
  const set = (id, v) => onChange({ ...value, [id]: v });
  return (
    <>
      {form.blocos.map((b, bi) => (
        <div key={bi} className="card">
          <div className="card-t">{b.titulo}</div>
          {b.perguntas.map(p => (
            <div key={p.id} style={{ marginBottom: 9 }}>
              <div style={{ fontSize: 11, color: "#b0c4d8", marginBottom: 4 }}>{p.q}</div>
              {p.tipo === "escala" && (
                <div style={{ display: "flex", gap: 5 }}>
                  {(form.escala || [1, 2, 3]).map(e => <button key={e} className={`chip ${value[p.id] === e ? "on" : ""}`} onClick={() => set(p.id, e)}>{e}</button>)}
                </div>
              )}
              {p.tipo === "sim_nao" && (
                <div style={{ display: "flex", gap: 5 }}>
                  {["Sim", "Não"].map(o => <button key={o} className={`chip ${value[p.id] === o ? "on" : ""}`} onClick={() => set(p.id, o)}>{o}</button>)}
                </div>
              )}
              {p.tipo === "escolha" && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {p.opcoes.map(o => <button key={o} className={`chip ${value[p.id] === o ? "on" : ""}`} onClick={() => set(p.id, o)}>{o}</button>)}
                </div>
              )}
              {p.tipo === "texto" && (
                <textarea className="inp" rows={2} value={value[p.id] || ""} onChange={e => set(p.id, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Questionario({ user, initForm }) {
  const [formKey, setFormKey] = useState(initForm || "escudos");
  const [pacId, setPacId] = useState("");
  const [val, setVal] = useState({});
  const [pacs, setPacs] = useState([]);
  const [recebidas, setRecebidas] = useState([]);
  const [ver, setVer] = useState(null);
  const [, _force] = useState(0);
  useEffect(() => { _carregarMetodoConteudo().then(() => _force(n => n + 1)); }, []);
  const form = getForm(formKey);

  const carregar = () => {
    sb.from("pacientes").select("id,nome,telefone").eq("terapeuta_id", user?.id).order("nome").then(({ data }) => setPacs(data || []));
    sb.from("respostas").select("*").eq("terapeuta_id", user?.id).order("created_at", { ascending: false }).then(({ data }) => setRecebidas(data || []));
    // Carregar formulários personalizados criados pelo admin
    sb.from("config_global").select("valor").eq("chave","formularios_custom").single()
      .then(({data:d}) => { if(d?.valor){ const v=Array.isArray(d.valor)?d.valor:JSON.parse(d.valor); FORMS_CUSTOM.length=0; v.forEach(f=>FORMS_CUSTOM.push(f)); } })
      .catch(()=>{});
  };
  useEffect(() => { carregar(); }, []);

  const escolherForm = (k) => { setFormKey(k); setVal({}); setVer(null); };

  const guardar = async () => {
    if (!pacId) { alert("Escolhe um paciente."); return; }
    await sb.from("respostas").insert({ paciente_id: pacId, terapeuta_id: user?.id, questionario: form.key, titulo: form.titulo, respostas: val, status: "respondido" });
    alert("Guardado na ficha do paciente ✅");
    setVal({}); carregar();
  };

  const enviar = async () => {
    if (!pacId) { alert("Escolhe um paciente."); return; }
    const token = crypto.randomUUID();
    await sb.from("respostas").insert({ paciente_id: pacId, terapeuta_id: user?.id, questionario: form.key, titulo: form.titulo, respostas: {}, status: "pendente", token });
    const pac = pacs.find(p => p.id === pacId);
    const num = (pac?.telefone || "").replace(/[^0-9]/g, "");
    const link = `${window.location.origin}/?form=${token}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Ola ${pac?.nome || ""}, por favor preencha este questionario: ${link}`)}`, "_blank");
    carregar();
  };

  const dominante = (r) => {
    if (r.questionario !== "escudos") return null;
    try {
      const q = {};
      QUESTIONARIO_ESCUDOS.forEach(b => { q[b.blocoId] = b.afirmacoes.map((_, i) => r.respostas[b.blocoId + "_" + i] || 0); });
      return ESCUDOS.find(x => x.id === pontuarEscudos(q).dominante)?.nome;
    } catch { return null; }
  };

  // Pontuação dos Escudos por bloco (totais, fiel ao original)
  const totaisEscudos = (r) => {
    if (r.questionario !== "escudos") return null;
    try {
      return QUESTIONARIO_ESCUDOS.map(b => ({
        nome: b.titulo,
        total: b.afirmacoes.reduce((t, _, i) => t + (Number(r.respostas[b.blocoId + "_" + i]) || 0), 0),
        max: b.afirmacoes.length * 3,
      }));
    } catch { return null; }
  };

  // Pontuação dos Medos por bloco — revela os nomes (fiel ao original)
  const totaisMedos = (r) => {
    if (r.questionario !== "medos") return null;
    try {
      const blocos = [];
      for (let b = 1; b <= 7; b++) {
        let total = 0, respondidas = 0;
        for (let i = 1; i <= 10; i++) {
          const v = Number(r.respostas[`mb${b}_${i}`]) || 0;
          if (v > 0) respondidas++;
          total += v;
        }
        blocos.push({ bloco: b, nome: MEDOS_NOMES[b], total, max: 50, respondidas });
      }
      return blocos;
    } catch { return null; }
  };

  const respPac = recebidas.filter(r => !pacId || r.paciente_id === pacId);

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Questionários</div>
        <div className="lbl">Escolhe o questionário</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {getAllForms().map(f => <button key={f.key} className={`chip ${formKey === f.key ? "on" : ""}`} onClick={() => escolherForm(f.key)}>{f.titulo}</button>)}
        </div>
        <div className="lbl">Paciente</div>
        <select className="inp sel" value={pacId} onChange={e => setPacId(e.target.value)}>
          <option value="">-- Selecionar paciente --</option>
          {pacs.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button className="btn btn-s btn-sm" style={{ width: "auto", marginTop: 8 }} onClick={enviar} disabled={!pacId}>📤 Enviar ao paciente (WhatsApp)</button>
        {form.descricao && <div className="al al-i" style={{ fontSize: 10, marginTop: 8 }}>{form.descricao}</div>}
      </div>

      <FormFill form={form} value={val} onChange={setVal} />
      <button className="btn btn-p" onClick={guardar} disabled={!pacId}>Guardar na ficha do paciente</button>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-t">Respostas recebidas{pacId ? " (deste paciente)" : ""}</div>
        {respPac.length === 0 && <div style={{ fontSize: 10, color: "#2d4a66" }}>Sem respostas ainda.</div>}
        {respPac.map(r => {
          const pac = pacs.find(p => p.id === r.paciente_id);
          const dom = dominante(r);
          return (
            <div key={r.id} style={{ borderBottom: "1px solid #0d1828", padding: "7px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 7 }}>
                <div style={{ fontSize: 11, color: "#b0c4d8" }}>{r.titulo} · {pac?.nome || "—"}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: r.status === "pendente" ? "#f59e0b" : "#00c6b8" }}>{r.status === "pendente" ? "Aguarda resposta" : "Respondido"}</span>
                  {r.status !== "pendente" && <button className="btn btn-s btn-sm" style={{ width: "auto" }} onClick={() => setVer(ver === r.id ? null : r.id)}>{ver === r.id ? "Fechar" : "Ver"}</button>}
                </div>
              </div>
              {dom && <div style={{ fontSize: 9, color: "#00c6b8" }}>Escudo dominante: {dom}</div>}
              {ver === r.id && (
                <div style={{ marginTop: 5 }}>
                  {/* RESULTADO DOS MEDOS — pontuação por bloco com revelação dos nomes */}
                  {r.questionario === "medos" && (() => {
                    const tm = totaisMedos(r);
                    if (!tm) return null;
                    const maxT = Math.max(...tm.map(x => x.total));
                    return (
                      <div style={{ background: "#061020", border: "1px solid #1a3a5c", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: "#00c6b8", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>📊 Resultado — Pontuação por Medo</div>
                        {tm.map(x => (
                          <div key={x.bloco} style={{ marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                              <span style={{ color: x.total === maxT && x.total > 0 ? "#f59e0b" : "#7a98b8", fontWeight: x.total === maxT && x.total > 0 ? 700 : 400 }}>
                                {x.total === maxT && x.total > 0 ? "🔥 " : ""}Bloco {x.bloco} — {x.nome}
                              </span>
                              <span style={{ color: "#5a7a9a" }}>{x.total}/{x.max}</span>
                            </div>
                            <div style={{ height: 4, background: "#0d1828", borderRadius: 2, marginTop: 2 }}>
                              <div style={{ height: 4, borderRadius: 2, width: `${(x.total / x.max) * 100}%`, background: x.total === maxT && x.total > 0 ? "#f59e0b" : "#1a6b61" }} />
                            </div>
                          </div>
                        ))}
                        <div style={{ fontSize: 9, color: "#5a7a9a", marginTop: 6, fontStyle: "italic" }}>Quanto maior a pontuação, mais ativo está o medo correspondente ao bloco.</div>
                      </div>
                    );
                  })()}
                  {/* RESULTADO DOS ESCUDOS — totais por bloco */}
                  {r.questionario === "escudos" && (() => {
                    const te = totaisEscudos(r);
                    if (!te) return null;
                    const maxT = Math.max(...te.map(x => x.total));
                    return (
                      <div style={{ background: "#061020", border: "1px solid #1a3a5c", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: "#00c6b8", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>📊 Resumo de Pontuação dos Escudos</div>
                        {te.map((x, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                            <span style={{ color: x.total === maxT && x.total > 0 ? "#f59e0b" : "#7a98b8", fontWeight: x.total === maxT && x.total > 0 ? 700 : 400 }}>
                              {x.total === maxT && x.total > 0 ? "🛡️ " : ""}{x.nome}
                            </span>
                            <span style={{ color: "#5a7a9a" }}>{x.total}/{x.max}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 9, color: "#5a7a9a", marginTop: 4, fontStyle: "italic" }}>O escudo com maior pontuação indica a "gaveta emocional" mais ativa no momento.</div>
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 10, color: "#5a7a9a" }}>
                    {(getForm(r.questionario)?.blocos || []).flatMap(b => b.perguntas).map(p => (
                      <div key={p.id} style={{ marginBottom: 3 }}><strong style={{ color: "#7a98b8" }}>{p.q}</strong> — {String(r.respostas[p.id] ?? "—")}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// DASHBOARD COM KPIs
function DashboardClinica({ user, org }) {
  const [stats, setStats] = useState({ consultas: 0, consultasReais: 0, pacientes: 0, receita: 0, consultasHoje: 0 });
  const [ultimasConsultas, setUltimasConsultas] = useState([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      setLoad(true);
      
      // Total de consultas
      const { count: totalConsultas } = await sb.from("consultas").select("id", { count: "exact" }).eq("terapeuta_id", user.id);
      
      // Consultas neste mês
      const agora = new Date();
      const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,"0")}`;
      const { data: consultasMes } = await sb.from("consultas").select("id").eq("terapeuta_id", user.id).gte("data", mesAtual);
      
      // Pacientes únicos
      const { data: pacientes } = await sb.from("pacientes").select("id").eq("terapeuta_id", user.id);
      
      // Consultas hoje
      const hoje = agora.toISOString().split("T")[0];
      const { data: hojeDados } = await sb.from("consultas").select("id").eq("terapeuta_id", user.id).eq("data", hoje);
      
      setStats({
        consultas: totalConsultas || 0,
        consultasReais: consultasMes?.length || 0,
        pacientes: pacientes?.length || 0,
        receita: 0, // manual no futuro
        consultasHoje: hojeDados?.length || 0
      });
      
      // Últimas 5 consultas
      const { data: ultimas } = await sb.from("consultas")
        .select("id,data,pacientes(nome),tipo")
        .eq("terapeuta_id", user.id)
        .order("data", { ascending: false })
        .limit(5);
      setUltimasConsultas(ultimas || []);
      setLoad(false);
    };
    
    if (user?.id) carregar();
  }, [user?.id]);

  if (load) return <div style={{textAlign:"center",color:"#3d5a7a",padding:20}}>A carregar dashboard...</div>;

  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:"1rem",fontWeight:700,color:"#5ae0d8",marginBottom:12}}>📊 Resumo do Mês</div>
      
      {/* KPIs em grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12}}>
          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:4}}>Consultas este mês</div>
          <div style={{fontSize:"1.6rem",fontWeight:700,color:"#00c6b8"}}>{stats.consultasReais}</div>
        </div>
        
        <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12}}>
          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:4}}>Pacientes ativos</div>
          <div style={{fontSize:"1.6rem",fontWeight:700,color:"#5ae0d8"}}>{stats.pacientes}</div>
        </div>
        
        <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12}}>
          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:4}}>Total de consultas</div>
          <div style={{fontSize:"1.6rem",fontWeight:700,color:"#00c6b8"}}>{stats.consultas}</div>
        </div>
        
        <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12}}>
          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:4}}>Consultas hoje</div>
          <div style={{fontSize:"1.6rem",fontWeight:700,color:"#5ae0d8"}}>{stats.consultasHoje}</div>
        </div>
      </div>

      {/* Últimas consultas */}
      {ultimasConsultas.length > 0 && (
        <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12,marginBottom:14}}>
          <div style={{fontSize:".7rem",fontWeight:700,color:"#5ae0d8",marginBottom:10}}>📋 Últimas consultas</div>
          {ultimasConsultas.map((c,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:".65rem",padding:"6px 0",borderBottom:i<ultimasConsultas.length-1?"1px solid #0d1828":"none",color:"#b0c4d8"}}>
              <div>{c.pacientes?.nome || "Paciente"}</div>
              <div>{c.data?.split(" ")[0] || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// SISTEMA DE LEMBRETES AUTOMÁTICOS
function SistemaLembretes({ user }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem("brevo_key") || "");
  const [load, setLoad] = useState(false);
  const [msg, setMsg] = useState("");
  const [agendadas, setAgendadas] = useState([]);

  useEffect(() => {
    carregar();
  }, [user?.id]);

  const carregar = async () => {
    // Consultas agendadas para amanhã
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split("T")[0];

    const { data } = await sb.from("consultas")
      .select("id,data,pacientes(nome,email),terapeuta_id")
      .eq("terapeuta_id", user.id)
      .eq("data", dataAmanha)
      .is("lembrete_enviado", null);

    setAgendadas(data || []);
  };

  const enviarLembrete = async (consulta) => {
    if (!apiKey.trim()) {
      setMsg("⚠️ Configura a chave Brevo. Grátis em brevo.com");
      return;
    }

    if (!consulta.pacientes?.email) {
      setMsg("Paciente não tem email!");
      return;
    }

    setLoad(true);

    try {
      // Chamar API Brevo
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          to: [{ email: consulta.pacientes.email, name: consulta.pacientes.nome }],
          subject: "⏰ Lembrete: Consulta amanhã",
          htmlContent: `
            <h2>Olá ${consulta.pacientes.nome}!</h2>
            <p>Tens uma consulta agendada para <strong>amanhã</strong>.</p>
            <p style="color:#00c6b8"><strong>Data:</strong> ${consulta.data}</p>
            <p style="color:#666">Confirma presença ou avisa-nos se não consegues aparecer.</p>
            <p style="font-size:12px;color:#999">Plataforma VitalDoctor</p>
          `,
          sender: { name: "VitalDoctor", email: "noreply@vitaldoctor.app" },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Marcar como enviado no Supabase
        await sb.from("consultas").update({ lembrete_enviado: new Date().toISOString() }).eq("id", consulta.id);
        setMsg("✅ Lembrete enviado!");
        setTimeout(() => carregar(), 1500);
      } else {
        setMsg("❌ Erro ao enviar: " + (result.message || "Verifica a chave API"));
      }
    } catch (err) {
      setMsg("❌ Erro de rede: " + err.message);
    }

    setLoad(false);
  };

  const guardarChave = () => {
    localStorage.setItem("brevo_key", apiKey);
    setMsg("✅ Chave Brevo guardada (armazenamento local)");
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#5ae0d8", marginBottom: 12 }}>
        📬 Lembretes Automáticos
      </div>

      {/* Configuração da chave */}
      <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12,marginBottom:14}}>
        <label className="lbl" style={{fontSize:".7rem"}}>Chave API Brevo (grátis em brevo.com)</label>
        <div style={{display:"flex",gap:8}}>
          <input
            className="inp"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{fontSize:".7rem",flex:1}}
          />
          <button className="btn btn-s" style={{width:"auto"}} onClick={guardarChave} disabled={!apiKey.trim()}>
            💾
          </button>
        </div>
        <div style={{fontSize:".6rem",color:"#3d5a7a",marginTop:6}}>
          🔒 Guardado no navegador (privado). <a href="https://www.brevo.com/free-account/" target="_blank" rel="noopener noreferrer" style={{color:"#00c6b8"}}>Cria conta grátis aqui.</a>
        </div>
      </div>

      {/* Lista de consultas agendadas */}
      {agendadas.length > 0 ? (
        <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12}}>
          <div style={{fontSize:".7rem",fontWeight:700,color:"#b0c4d8",marginBottom:10}}>
            {agendadas.length} consulta(s) para amanhã
          </div>
          {agendadas.map(c => (
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #0d1828"}}>
              <div>
                <div style={{fontSize:".7rem",color:"#b0c4d8",fontWeight:600}}>{c.pacientes?.nome}</div>
                <div style={{fontSize:".6rem",color:"#3d5a7a"}}>{c.pacientes?.email}</div>
              </div>
              <button className="btn btn-s btn-sm" style={{width:"auto",fontSize:".65rem"}} onClick={() => enviarLembrete(c)} disabled={load}>
                📨 Enviar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{fontSize:".7rem",color:"#3d5a7a",padding:12,background:"#050810",borderRadius:8}}>
          Sem consultas agendadas para amanhã.
        </div>
      )}

      {msg && <div style={{marginTop:10,fontSize:".7rem",color:msg.includes("✅")?"#00c6b8":"#d9534f"}}>{msg}</div>}
    </div>
  );
}

// SISTEMA WHATSAPP INTEGRADO (3 OPÇÕES GRÁTIS)
function SistemaWhatsApp({ user }) {
  const [metodo, setMetodo] = useState(localStorage.getItem("whatsapp_metodo") || "direto");
  const [telefone, setTelefone] = useState(localStorage.getItem("whatsapp_telefone") || user?.telefone || "");
  const [chaveWhatsApp, setChaveWhatsApp] = useState(localStorage.getItem("whatsapp_api_key") || "");
  const [msg, setMsg] = useState("");
  const [load, setLoad] = useState(false);
  const [proximas, setProximas] = useState([]);

  useEffect(() => {
    carregarConsultas();
  }, [user?.id]);

  const carregarConsultas = async () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split("T")[0];

    const { data } = await sb.from("consultas")
      .select("id,data,pacientes(nome,telefone,email)")
      .eq("terapeuta_id", user.id)
      .eq("data", dataAmanha);

    setProximas(data || []);
  };

  const guardarConfigs = () => {
    localStorage.setItem("whatsapp_metodo", metodo);
    localStorage.setItem("whatsapp_telefone", telefone);
    localStorage.setItem("whatsapp_api_key", chaveWhatsApp);
    setMsg("✅ Configurações WhatsApp guardadas!");
    setTimeout(() => setMsg(""), 2000);
  };

  // OPÇÃO 1: Link direto (wa.me)
  const enviarWhatsAppDireto = (paciente) => {
    const numero = paciente.telefone?.replace(/\D/g, "");
    const mensagem = encodeURIComponent(
      `Olá ${paciente.nome}! Esta é uma confirmação/lembrete da tua consulta. Confirma presença ou avisa-nos se não consegues aparecer. Obrigado! 🙏`
    );
    window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
  };

  // OPÇÃO 2: WhatsApp Business API (oficial)
  const enviarWhatsAppAPI = async (paciente) => {
    if (!chaveWhatsApp.trim()) {
      setMsg("⚠️ Configura a chave WhatsApp Business API");
      return;
    }

    if (!paciente.telefone) {
      setMsg("Paciente não tem telefone!");
      return;
    }

    setLoad(true);

    try {
      const numero = paciente.telefone.replace(/\D/g, "");
      
      // Chamada para WhatsApp Business API (Meta)
      const response = await fetch(`https://graph.instagram.com/v18.0/YOUR_PHONE_ID/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${chaveWhatsApp}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: numero,
          type: "text",
          text: {
            preview_url: true,
            body: `Olá ${paciente.nome}! Confirmação da tua consulta. Confirma presença. VitalDoctor 🙏`
          }
        }),
      });

      if (response.ok) {
        setMsg("✅ Mensagem WhatsApp enviada!");
        setTimeout(() => carregarConsultas(), 1500);
      } else {
        const err = await response.json();
        setMsg("❌ Erro: " + (err.error?.message || "Verifica a chave"));
      }
    } catch (err) {
      setMsg("❌ Erro de rede: " + err.message);
    }

    setLoad(false);
  };

  // OPÇÃO 3: Baileys Bot (alternativa grátis)
  const copiarInstrucoesBaileys = () => {
    const instrucoes = `
# BAILEYS BOT (Grátis, alternativa WhatsApp)

1. Cria um projeto Node.js:
   npm init -y && npm install baileys qrcode

2. Cria arquivo "bot.whatsapp.js":
   const { default: makeWASocket } = require('@whiskeysockets/baileys');
   
   const sock = makeWASocket();
   
   sock.ev.on('messages.upsert', async (m) => {
     const msg = m.messages[0];
     if (!msg.key.fromMe) {
       await sock.sendMessage(msg.key.remoteJid, { 
         text: 'Olá! Confirmamos tua consulta. Responde SIM ou NÃO' 
       });
     }
   });

3. Deploy em Vercel ou Railway (grátis)

4. Aponta webhook para VitalDoctor

Tutorial completo: https://github.com/WhiskeySockets/Baileys
    `;
    navigator.clipboard.writeText(instrucoes);
    setMsg("✅ Instruções copiadas! Cola num editor.");
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#5ae0d8", marginBottom: 12 }}>
        📱 WhatsApp Integrado (3 Opções)
      </div>

      {/* Seletor de método */}
      <div style={{background:"#050810",border:"1px solid #1a4a7c",borderRadius:8,padding:12,marginBottom:14}}>
        <label className="lbl" style={{fontSize:".7rem",marginBottom:8}}>Escolhe o método WhatsApp:</label>
        
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:".7rem"}}>
            <input type="radio" value="direto" checked={metodo === "direto"} onChange={e => setMetodo(e.target.value)} />
            <span>
              <strong>Link Direto</strong> (100% grátis, instantâneo) — Botão "Chat WhatsApp"
            </span>
          </label>

          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:".7rem"}}>
            <input type="radio" value="api" checked={metodo === "api"} onChange={e => setMetodo(e.target.value)} />
            <span>
              <strong>API Oficial</strong> (1000 msg/mês grátis) — Automático + oficial
            </span>
          </label>

          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:".7rem"}}>
            <input type="radio" value="baileys" checked={metodo === "baileys"} onChange={e => setMetodo(e.target.value)} />
            <span>
              <strong>Baileys Bot</strong> (100% grátis) — Bot automático inteligente
            </span>
          </label>
        </div>
      </div>

      {/* OPÇÃO 1: Link Direto */}
      {metodo === "direto" && (
        <div style={{background:"#050810",border:"1px solid #0d7a5c",borderRadius:8,padding:12,marginBottom:14}}>
          <div style={{fontSize:".75rem",fontWeight:700,color:"#00c6b8",marginBottom:10}}>📱 Link Direto WhatsApp</div>
          
          <label className="lbl" style={{fontSize:".65rem"}}>Teu número WhatsApp (com código país)</label>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <input
              className="inp"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="+351912345678"
              style={{fontSize:".7rem",flex:1}}
            />
            <button className="btn btn-s" onClick={guardarConfigs} style={{width:"auto"}}>💾</button>
          </div>

          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:10}}>
            ✅ Simples e rápido. Cada paciente abre WhatsApp direto no seu telemóvel.
          </div>

          {proximas.length > 0 && (
            <>
              <div style={{fontSize:".7rem",fontWeight:700,color:"#b0c4d8",marginBottom:8}}>Enviar amanhã:</div>
              {proximas.map(c => (
                <button
                  key={c.id}
                  className="btn btn-s btn-sm"
                  style={{width:"100%",marginBottom:6,textAlign:"left",fontSize:".65rem",justifyContent:"flex-start"}}
                  onClick={() => enviarWhatsAppDireto(c.pacientes)}
                >
                  💬 {c.pacientes?.nome} — Abrir WhatsApp
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* OPÇÃO 2: API Oficial */}
      {metodo === "api" && (
        <div style={{background:"#050810",border:"1px solid #0d7a5c",borderRadius:8,padding:12,marginBottom:14}}>
          <div style={{fontSize:".75rem",fontWeight:700,color:"#00c6b8",marginBottom:10}}>🔑 WhatsApp Business API</div>
          
          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:10}}>
            1. Cria conta em <a href="https://www.whatsapp.com/business/api/" target="_blank" rel="noopener noreferrer" style={{color:"#00c6b8"}}>WhatsApp Business API</a><br/>
            2. Obtém <strong>Phone ID</strong> + <strong>Access Token</strong><br/>
            3. Cola abaixo
          </div>

          <label className="lbl" style={{fontSize:".65rem"}}>Phone ID (do teu número WhatsApp)</label>
          <input className="inp mb8" type="text" placeholder="123456789..." style={{fontSize:".7rem"}} />

          <label className="lbl" style={{fontSize:".65rem"}}>Access Token (da tua conta)</label>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <input
              className="inp"
              type="password"
              value={chaveWhatsApp}
              onChange={e => setChaveWhatsApp(e.target.value)}
              placeholder="EAAx..."
              style={{fontSize:".7rem",flex:1}}
            />
            <button className="btn btn-s" onClick={guardarConfigs} style={{width:"auto"}}>💾</button>
          </div>

          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:10}}>
            ✅ Oficial, seguro, 1000 mensagens/mês grátis. Melhor para escala.
          </div>

          {proximas.length > 0 && (
            <>
              <div style={{fontSize:".7rem",fontWeight:700,color:"#b0c4d8",marginBottom:8}}>Enviar amanhã:</div>
              {proximas.map(c => (
                <button
                  key={c.id}
                  className="btn btn-s btn-sm"
                  style={{width:"100%",marginBottom:6,textAlign:"left",fontSize:".65rem",justifyContent:"flex-start"}}
                  onClick={() => enviarWhatsAppAPI(c.pacientes)}
                  disabled={load}
                >
                  📤 {c.pacientes?.nome} — Enviar WhatsApp
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* OPÇÃO 3: Baileys */}
      {metodo === "baileys" && (
        <div style={{background:"#050810",border:"1px solid #0d7a5c",borderRadius:8,padding:12,marginBottom:14}}>
          <div style={{fontSize:".75rem",fontWeight:700,color:"#00c6b8",marginBottom:10}}>🤖 Baileys Bot (Código Aberto)</div>
          
          <div style={{fontSize:".65rem",color:"#3d5a7a",marginBottom:10}}>
            Bot automático grátis. Responde automaticamente às mensagens dos pacientes.
          </div>

          <button className="btn btn-p" style={{width:"100%"}} onClick={copiarInstrucoesBaileys}>
            📋 Copiar Instruções de Configuração
          </button>

          <div style={{fontSize:".65rem",color:"#3d5a7a",marginTop:10}}>
            ✅ 100% grátis, open-source, sem limites de mensagens.
          </div>
        </div>
      )}

      {msg && <div style={{marginTop:10,fontSize:".7rem",color:msg.includes("✅")?"#00c6b8":"#d9534f"}}>{msg}</div>}
    </div>
  );
}

// CONFIGURAÇÕES DE NOMES EDITÁVEIS (guardadas no profiles.config)
function SessõesConfig({ user, onAtualizar }) {
  const [cfg, setCfg] = useState(user?.config?.sessoes_nomes || {
    consulta_unica: "Consulta Única",
    pack_s1: "Pack 3 Sessões — Sessão 1",
    pack_s2: "Pack 3 Sessões — Sessão 2",
    pack_s3: "Pack 3 Sessões — Sessão 3",
    seguimento: "Seguimento / Manutenção",
    mapeamento_avulso: "Mapeamento Avulso"
  });
  const [editando, setEditando] = useState(false);
  const [msg, setMsg] = useState("");

  const guardar = async () => {
    const newConfig = { ...user.config, sessoes_nomes: cfg };
    const { error } = await sb.from("profiles").update({ config: newConfig }).eq("id", user.id);
    if (error) { setMsg("❌ Erro: " + error.message); return; }
    setMsg("✅ Nomes guardados!");
    onAtualizar && onAtualizar();
    setTimeout(() => { setMsg(""); setEditando(false); }, 1500);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#5ae0d8", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        ✏️ Nomes das Sessões (Customizáveis)
        <button className="btn btn-s btn-sm" onClick={() => setEditando(!editando)} style={{ width: "auto" }}>
          {editando ? "Cancelar" : "Editar"}
        </button>
      </div>

      {editando ? (
        <div style={{ background: "#050810", border: "1px solid #1a4a7c", borderRadius: 8, padding: 12 }}>
          {[
            { id: "consulta_unica", label: "Consulta Única" },
            { id: "pack_s1", label: "Sessão 1 do Pack" },
            { id: "pack_s2", label: "Sessão 2 do Pack" },
            { id: "pack_s3", label: "Sessão 3 do Pack" },
            { id: "seguimento", label: "Seguimento/Manutenção" },
            { id: "avaliacao_energetica", label: "Mapeamento Avulso" }
          ].map(s => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <label className="lbl" style={{ fontSize: ".65rem" }}>{s.label}</label>
              <input
                className="inp"
                value={cfg[s.id]}
                onChange={e => setCfg({ ...cfg, [s.id]: e.target.value })}
                placeholder="Nome customizado..."
                style={{ fontSize: ".7rem" }}
              />
            </div>
          ))}
          
          <button className="btn btn-p" style={{ width: "100%", marginTop: 10 }} onClick={guardar}>
            💾 Guardar Nomes
          </button>
          {msg && <div style={{ marginTop: 8, fontSize: ".7rem", color: msg.includes("✅") ? "#00c6b8" : "#d9534f" }}>{msg}</div>}
        </div>
      ) : (
        <div style={{ background: "#050810", border: "1px solid #1a4a7c", borderRadius: 8, padding: 12 }}>
          {Object.entries(cfg).map(([id, nome]) => (
            <div key={id} style={{ fontSize: ".7rem", color: "#b0c4d8", padding: "6px 0", borderBottom: "1px solid #0d1828" }}>
              <strong>{nome}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAINEL PRINCIPAL REFATORIZADO (VER + EDITAR + MENU LATERAL)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SUPER ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════

function PainelSuperAdmin({ user }) {
  const [abaSuperAdmin, setAbaSuperAdmin] = useState('overview');
  const [modoEdicaoAdmin, setModoEdicaoAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [modulesTerapeuticos, setModulesTerapeuticos] = useState([
    { id: 'ansiedade_depressao', nome: '🧠 Ansiedade & Depressão', status: 'ATIVO', visivel: true, exclusivo: 'público', modelo: 'trial_14d' },
    { id: 'reiki', nome: '✨ Reiki', status: 'ESCONDIDO', visivel: false, exclusivo: 'público', modelo: 'aguarda' },
    { id: 'hikari_fafe', nome: '🌿 Métodos Hikari Fafe', status: 'ESCONDIDO', visivel: false, exclusivo: 'apenas_hikari', modelo: 'aguarda' },
  ]);
  const [novoModulo, setNovoModulo] = useState({ nome: '', emoji: '', visivel: 'escondido', exclusivo: 'publico', modelo: 'aguarda' });
  const [msgAdmin, setMsgAdmin] = useState('');

  const criarModuloTerapeutico = async () => {
    if (!novoModulo.nome.trim()) {
      setMsgAdmin('❌ Nome do módulo obrigatório');
      setTimeout(() => setMsgAdmin(''), 3000);
      return;
    }
    const modId = novoModulo.nome.toLowerCase().replace(/\s+/g, '_');
    const novoMod = {
      id: modId,
      nome: (novoModulo.emoji || '📦') + ' ' + novoModulo.nome,
      status: novoModulo.visivel === 'visivel' ? 'ATIVO' : 'ESCONDIDO',
      visivel: novoModulo.visivel === 'visivel',
      exclusivo: novoModulo.exclusivo,
      modelo: novoModulo.modelo,
      criado_em: new Date().toISOString()
    };
    setModulesTerapeuticos([...modulesTerapeuticos, novoMod]);
    setNovoModulo({ nome: '', emoji: '', visivel: 'escondido', exclusivo: 'publico', modelo: 'aguarda' });
    setMsgAdmin('✅ Módulo criado com sucesso!');
    setTimeout(() => setMsgAdmin(''), 3000);
  };

  useEffect(() => {
    Promise.all([
      sb.from("profiles").select("*").order("created_at"),
      sb.from("custom_modules").select("*").order("criado_em")
    ]).then(([usersRes, modsRes]) => {
      setUsers(usersRes.data || []);
      setModulos(modsRes.data || []);
    });
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh', gap: 0, background: '#050810' }}>
      <div style={{ background: 'linear-gradient(180deg, #0d1828 0%, #061428 100%)', borderRight: '2px solid #d4a574', padding: '20px 0', maxHeight: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: '2px solid #d4a574', marginBottom: 12, fontWeight: 700, color: '#d4a574', fontSize: '0.8rem', textAlign: 'center' }}>👑 SUPER ADMIN</div>
        {[
          { id: 'overview', icon: '📊', label: 'Visão Geral', desc: 'Dashboard' },
          { id: 'usuarios', icon: '👥', label: 'Utilizadores', desc: 'Gestão' },
          { id: 'modulos', icon: '📦', label: 'Módulos', desc: 'Customizados' },
          { id: 'terapeuticos', icon: '📚', label: 'Módulos Terapêuticos', desc: 'Escondidos' },
          { id: 'conteudo_metodo', icon: '⚙️', label: 'Conteúdo Método', desc: 'Especializado' },
          { id: 'pontos_mapeamento', icon: '🗺️', label: 'Pontos Mapeamento', desc: 'Visual' },
        ].map(item => (
          <button key={item.id} onClick={() => setAbaSuperAdmin(item.id)} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: abaSuperAdmin === item.id ? 'rgba(212, 165, 116, 0.2)' : 'transparent', border: 'none', borderLeft: abaSuperAdmin === item.id ? '3px solid #d4a574' : 'none', color: abaSuperAdmin === item.id ? '#d4a574' : '#8ba3c0', cursor: 'pointer', fontSize: '0.75rem', fontWeight: abaSuperAdmin === item.id ? 700 : 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span>{item.icon}</span>
              <div style={{ fontWeight: 700 }}>{item.label}</div>
            </div>
            <div style={{ fontSize: '0.6rem', color: '#3d5a7a', marginLeft: 24 }}>{item.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ overflowY: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #0d1828, #061428)', borderBottom: '2px solid #d4a574', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1rem', color: '#d4a574', margin: 0, fontWeight: 700 }}>
            {abaSuperAdmin === 'overview' && '📊 Visão Geral'}
            {abaSuperAdmin === 'usuarios' && '👥 Utilizadores'}
            {abaSuperAdmin === 'modulos' && '📦 Módulos'}
            {abaSuperAdmin === 'terapeuticos' && '📚 Módulos Terapêuticos'}
            {abaSuperAdmin === 'conteudo_metodo' && '⚙️ Conteúdo do Método'}
            {abaSuperAdmin === 'pontos_mapeamento' && '🗺️ Pontos do Mapeamento'}
          </h1>
          {['usuarios', 'modulos', 'terapeuticos', 'conteudo_metodo', 'pontos_mapeamento'].includes(abaSuperAdmin) && <button onClick={() => setModoEdicaoAdmin(!modoEdicaoAdmin)} style={{ padding: '8px 14px', background: modoEdicaoAdmin ? '#d4a574' : '#00c6b8', color: '#050810', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem' }}>{modoEdicaoAdmin ? '✏️ Editar' : '👁️ Ver'}</button>}
        </div>
        <div style={{ padding: '20px 24px' }}>
          {abaSuperAdmin === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '2px solid #d4a574', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>👥</div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d4a574' }}>{users.length}</div><div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>Utilizadores</div></div>
              <div style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '2px solid #d4a574', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>📦</div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d4a574' }}>{modulos.length}</div><div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>Módulos</div></div>
              <div style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '2px solid #d4a574', borderRadius: 8, padding: 16, textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>🟢</div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d4a574' }}>✅</div><div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>Online</div></div>
            </div>
          )}
          {abaSuperAdmin === 'usuarios' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {users.map(u => (
                <div key={u.id} style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '1px solid #d4a574', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a574' }}>{u.nome_profissional || u.nome}</div>
                  <div style={{ fontSize: '0.65rem', color: '#8ba3c0' }}>{u.email.slice(0, 16)}...</div>
                  {modoEdicaoAdmin && (
                  <button
                    className="btn btn-sm"
                    style={{ marginTop: 8, width: '100%', fontSize: '0.65rem', background: u.has_exclusive_therapy_access ? 'rgba(0,198,184,.12)' : 'rgba(90,26,26,.3)', border: u.has_exclusive_therapy_access ? '1px solid #00c6b840' : '1px solid #5a1a1a', color: u.has_exclusive_therapy_access ? '#5ae0d8' : '#f87171' }}
                    onClick={async () => {
                      const novoVal = !u.has_exclusive_therapy_access;
                      const { error } = await sb.from('profiles').update({ has_exclusive_therapy_access: novoVal }).eq('id', u.id);
                      if (!error) {
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, has_exclusive_therapy_access: novoVal } : x));
                      } else {
                        alert('Erro: ' + error.message);
                      }
                    }}
                  >
                    {u.has_exclusive_therapy_access ? '⭐ 🧠 Activo — clica para revogar' : '🔒 Exclusivo INACTIVO — clica para activar'}
                  </button>
                )}
                </div>
              ))}
            </div>
          )}
          {abaSuperAdmin === 'modulos' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {modulos.map(m => (
                <div key={m.id} style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '1px solid #d4a574', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a574' }}>{m.nome}</div>
                  <div style={{ fontSize: '0.65rem', color: '#8ba3c0' }}>{m.bloqueado_com ? `🔒 ${m.bloqueado_com}` : '✅ Pub'}</div>
                </div>
              ))}
            </div>
          )}
          {abaSuperAdmin === 'conteudo_metodo' && (
            <div className="fade">
              <div style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '1px solid #d4a574', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d4a574', marginBottom: 16 }}>⚙️ Conteúdo do Método</div>
                {!modoEdicaoAdmin ? (
                  <div>
                    <div style={{ background: '#050810', border: '1px solid #1a3a5c', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dde4f0', marginBottom: 8 }}>📖 Nome</div>
                      <div style={{ fontSize: '0.8rem', color: '#8ba3c0' }}>Método Especializado de Ansiedade & Depressão</div>
                    </div>
                    <div style={{ background: '#050810', border: '1px solid #1a3a5c', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dde4f0', marginBottom: 8 }}>📝 Descrição</div>
                      <div style={{ fontSize: '0.8rem', color: '#8ba3c0' }}>Abordagem integrada. Certificado.</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="lbl" style={{ fontSize: '0.7rem' }}>📖 Nome</label>
                      <input className="inp" defaultValue="Método Especializado de Ansiedade & Depressão" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="lbl" style={{ fontSize: '0.7rem' }}>📝 Descrição</label>
                      <textarea className="inp" defaultValue="Abordagem integrada" style={{ minHeight: '60px' }} />
                    </div>
                    <button className="btn btn-p" style={{ width: '100%', fontSize: '0.75rem' }}>💾 Guardar</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {abaSuperAdmin === 'pontos_mapeamento' && (
            <div className="fade">
              <div style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '1px solid #d4a574', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d4a574', marginBottom: 16 }}>🗺️ Pontos do Mapeamento</div>
                {!modoEdicaoAdmin ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {[{ zona: 'Cabeça', pontos: ['Ansiedade', 'Stress'] }, { zona: 'Peito', pontos: ['Medo', 'Pânico'] }].map((zona, i) => (
                      <div key={i} style={{ background: '#050810', border: '1px solid #1a3a5c', borderRadius: 6, padding: 10 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d4a574', marginBottom: 8 }}>📍 {zona.zona}</div>
                        {zona.pontos.map((p, j) => (<div key={j} style={{ fontSize: '0.7rem', color: '#8ba3c0' }}>• {p}</div>))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="lbl" style={{ fontSize: '0.7rem' }}>📍 Zona</label>
                      <input className="inp" placeholder="Ex: Garganta" style={{ marginBottom: 6 }} />
                      <label className="lbl" style={{ fontSize: '0.7rem' }}>Pontos Emocionais</label>
                      <input className="inp" placeholder="Ex: Falta de voz" />
                    </div>
                    <button className="btn btn-p" style={{ width: '100%', fontSize: '0.75rem', marginTop: 12 }}>💾 Guardar</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {abaSuperAdmin === 'terapeuticos' && (
            <div className="fade">
              <div style={{ background: 'linear-gradient(135deg, #0a1e2e, #061428)', border: '1px solid #d4a574', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d4a574', marginBottom: 16 }}>📚 Módulos Terapêuticos (Escondidos & Seguros)</div>

                {!modoEdicaoAdmin ? (
                  // MODO VER
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {modulesTerapeuticos.map(m => (
                      <div key={m.id} style={{ background: '#050810', border: '1px solid #1a3a5c', borderRadius: 6, padding: 12 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dde4f0', marginBottom: 8 }}>{m.nome}</div>
                        <div style={{ fontSize: '0.7rem', color: '#8ba3c0', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div>🔍 {m.visivel ? '✅ Visível' : '👁️ Escondido'}</div>
                          <div>🔐 {m.exclusivo === 'publico' ? 'Público' : m.exclusivo === 'apenas_hikari' ? 'Apenas Hikari' : 'Selecionados'}</div>
                          <div>💰 {m.modelo === 'trial_14d' ? 'Trial 14d' : m.modelo === 'aguarda' ? 'Aguarda decisão' : 'Subscrição'}</div>
                          <div style={{ borderTop: '1px solid #1a3a5c', marginTop: 6, paddingTop: 6, color: m.status === 'ATIVO' ? '#00c6b8' : '#3d5a7a' }}>
                            {m.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // MODO EDITAR
                  <div>
                    {msgAdmin && <div className="al al-ok" style={{ marginBottom: 12, fontSize: '0.75rem' }}>{msgAdmin}</div>}
                    <div style={{ background: '#050810', border: '1px solid #1a3a5c', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a574', marginBottom: 12 }}>🆕 Criar Novo Módulo Terapêutico</div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="lbl" style={{ fontSize: '0.7rem' }}>Nome do Módulo *</label>
                        <input className="inp" placeholder="Ex: Reiki, Tarot, Meditação..." value={novoModulo.nome} onChange={e => setNovoModulo({...novoModulo, nome: e.target.value})} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="lbl" style={{ fontSize: '0.7rem' }}>Ícone/Emoji</label>
                        <input className="inp" placeholder="Ex: ✨, 🌙, 🧘" value={novoModulo.emoji} onChange={e => setNovoModulo({...novoModulo, emoji: e.target.value})} style={{ maxWidth: '120px' }} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="lbl" style={{ fontSize: '0.7rem' }}>Visibilidade</label>
                        <select className="inp" value={novoModulo.visivel} onChange={e => setNovoModulo({...novoModulo, visivel: e.target.value})}>
                          <option value="escondido">👁️ Escondido (desenvolvimento)</option>
                          <option value="visivel">✅ Visível (produção)</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="lbl" style={{ fontSize: '0.7rem' }}>Exclusividade</label>
                        <select className="inp" value={novoModulo.exclusivo} onChange={e => setNovoModulo({...novoModulo, exclusivo: e.target.value})}>
                          <option value="publico">🌍 Público (todos os subscritores)</option>
                          <option value="apenas_um">👤 Apenas um utilizador</option>
                          <option value="planos">📊 Apenas certos planos (Elite, Pro)</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="lbl" style={{ fontSize: '0.7rem' }}>Modelo de Monetização</label>
                        <select className="inp" value={novoModulo.modelo} onChange={e => setNovoModulo({...novoModulo, modelo: e.target.value})}>
                          <option value="trial_14d">⏳ Trial 14 dias → Subscrição</option>
                          <option value="subscricao">💳 Subscrição direta</option>
                          <option value="incluido">📦 Incluído no plano</option>
                          <option value="aguarda">⏳ Aguarda decisão (escondido por enquanto)</option>
                        </select>
                      </div>
                      <button className="btn btn-p" onClick={criarModuloTerapeutico} style={{ width: '100%', fontSize: '0.75rem' }}>➕ Criar Módulo</button>
                    </div>

                    <div style={{ fontSize: '0.65rem', color: '#3d5a7a', padding: 10, background: 'rgba(0, 198, 184, 0.05)', borderRadius: 6, borderLeft: '2px solid #00c6b8' }}>
                      💡 <strong>Workflow:</strong> Cria escondido → Desenvolve/Testa → Decide modelo (trial/subscrição/incluído) → Mostra em produção
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const [modo, setModo] = useState('dashboard');
  const [modoEdicao, setModoEdicao] = useState(false);

  if (!org) return null;
  
  // Se Super Admin clica em admin, mostra painel especial
  if (user?.email === 'ricardocorreia.211984@gmail.com' && modo === 'admin') {
    return <PainelSuperAdmin user={user} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050810' }}>
      {/* MENU LATERAL */}
      <div style={{
        width: '220px',
        background: 'linear-gradient(180deg, #0a1e2e 0%, #061428 100%)',
        borderRight: '1px solid #1a3a5c',
        padding: '20px 0',
        maxHeight: '100vh',
        overflowY: 'auto',
        position: 'sticky',
        top: 0
      }}>
        <div style={{ padding: '0 12px 24px 12px', borderBottom: '1px solid #1a3a5c', marginBottom: 12 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00c6b8', textTransform: 'uppercase', marginBottom: 4 }}>Menu</div>
          <div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>{org.nome}</div>
        </div>

        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard', sub: 'Templates' },
          { id: 'consultar', icon: '📋', label: 'Métodos Terapêuticos', sub: 'Iniciar' },
          { id: 'pacientes', icon: '👥', label: 'Pacientes', sub: 'Gestão' },
          { id: 'farmacia', icon: '🌿', label: 'Farmácia', sub: 'Conhecimento' },
          { id: 'relatorios', icon: '📄', label: 'Relatórios', sub: 'Histórico' },
          { id: 'configuracoes', icon: '⚙️', label: 'Config.', sub: 'Dados' },
          ...(user?.email === 'ricardocorreia.211984@gmail.com' ? [
            { id: 'admin', icon: '👑', label: 'Super Admin', sub: 'Controlo' }
          ] : [])
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setModo(item.id); setModoEdicao(false); }}
            style={{
              width: '100%',
              padding: '10px 12px',
              textAlign: 'left',
              background: modo === item.id ? 'rgba(0, 198, 184, 0.15)' : 'transparent',
              border: modo === item.id ? '1px solid #00c6b8' : 'none',
              color: modo === item.id ? '#00c6b8' : '#8ba3c0',
              cursor: 'pointer',
              marginBottom: 2,
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: modo === item.id ? 700 : 500,
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              <div style={{ fontWeight: 700 }}>{item.label}</div>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#3d5a7a', marginLeft: 26 }}>{item.sub}</div>
          </button>
        ))}
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #061428, #0a1e2e)',
          borderBottom: '1px solid #1a3a5c',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', color: '#dde4f0', margin: 0, marginBottom: 2, fontWeight: 700 }}>
              {modo === 'dashboard' && '📊 Dashboard'}
              {modo === 'consultar' && '📋 Métodos Terapêuticos'}
              {modo === 'pacientes' && '👥 Pacientes'}
              {modo === 'farmacia' && '🌿 A Farmácia'}
              {modo === 'relatorios' && '📄 Relatórios'}
              {modo === 'configuracoes' && '⚙️ Configurações'}
            </h1>
            <div style={{ fontSize: '0.65rem', color: '#3d5a7a' }}>
              {modoEdicao ? '✏️ Modo Edição' : '👁️ Modo Visualização'}
            </div>
          </div>

          {['dashboard', 'pacientes', 'farmacia', 'configuracoes'].includes(modo) && (
            <button
              onClick={() => setModoEdicao(!modoEdicao)}
              style={{
                padding: '8px 14px',
                background: modoEdicao ? '#d4a574' : '#00c6b8',
                color: '#050810',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.7rem',
                transition: 'all 0.2s'
              }}
            >
              {modoEdicao ? '✏️ Editar' : '👁️ Ver'}
            </button>
          )}
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div style={{ padding: '20px 24px' }}>
          {modo === 'dashboard' && <div style={{padding:20, textAlign:'center', color:'#8ba3c0'}}>Dashboard</div>}
          {modo === 'consultar' && <NovaConsultaRefatorizada user={user} />}
          {modo === 'pacientes' && <GestorPacientes user={user} modoEdicao={modoEdicao} />}
          {modo === 'farmacia' && <FarmaciaRefatorizada user={user} modoEdicao={modoEdicao} />}
          {modo === 'relatorios' && <div>📄 Relatórios (em desenvolvimento)</div>}
          {modo === 'configuracoes' && <ConfiguracoesPessoais user={user} modoEdicao={modoEdicao} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD UNIVERSAL
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// DASHBOARD COM TEMPLATES PRONTOS
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD COM LÓGICA DE REDIRECIONAMENTO INTELIGENTE
// ═══════════════════════════════════════════════════════════════════

function DashboardComTemplates({ user, modoEdicao }) {
  const [abaDashboard, setAbaDashboard] = useState('intro');
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [temAcessoExclusivo, setTemAcessoExclusivo] = useState(false);

  useEffect(() => {
    // Verificar se tem acesso ao módulo Método Especializado
    setTemAcessoExclusivo(user?.has_exclusive_therapy_access === true);
  }, [user?.has_exclusive_therapy_access]);

  const [templates] = useState([
    {
      id: 'consulta_unica',
      titulo: 'Consulta Única - Template Universal',
      descricao: 'Atendimento completo em uma sessão. Adaptável a qualquer terapia.',
      icon: '🩺',
      passos: [
        { num: 1, nome: 'Acolhimento', tempo: '10 min' },
        { num: 2, nome: 'Questionnaire Inicial', tempo: '15 min' },
        { num: 3, nome: 'Avaliação/Diagnóstico', tempo: '20 min' },
        { num: 4, nome: 'Protocolo Terapêutico', tempo: '30 min' },
        { num: 5, nome: 'Devolutiva', tempo: '10 min' },
      ]
    },
    {
      id: 'pack_3',
      titulo: 'Pack 3 Sessões - Template Universal',
      descricao: 'Tratamento estruturado em 3 encontros. Ideal para trabalho profundo.',
      icon: '📋',
      sessoes: [
        { num: 1, nome: 'Avaliação Inicial', duracao: '60 min' },
        { num: 2, nome: 'Mapeamento Profundo', duracao: '60 min' },
        { num: 3, nome: 'Consolidação', duracao: '60 min' },
      ]
    },
    {
      id: 'ficha_anamnese',
      titulo: 'Ficha de Anamnese Completa',
      descricao: 'Coleta estruturada de informações. Customizável por terapeuta.',
      icon: '📝',
      secoes: ['Dados Pessoais', 'Queixa Principal', 'Histórico Médico', 'Contexto Emocional', 'Estilo de Vida']
    },
    {
      id: 'questionario_escudos',
      titulo: 'Questionário de Escudos Emocionais',
      descricao: 'Avalia mecanismos de proteção emocional. Agnóstico.',
      icon: '🛡️',
      questoes: [
        'Tende a evitar conflitos?',
        'Dificuldade em expressar emoções?',
        'Usa humor para evitar problemas?',
        'Tende a intelectualizar emoções?',
        'Dificuldade em pedir ajuda?',
      ]
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA INTRO: ESCOLHER MÓDULO (se tem acesso) ou ir direto universal
  // ═══════════════════════════════════════════════════════════════════

  if (abaDashboard === 'intro') {
    return (
      <div className="fade" style={{ minHeight: '100vh', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #061428, #0a1e2e)',
          border: '2px solid #00c6b8',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
          marginBottom: 24
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            color: '#dde4f0',
            marginBottom: 12,
            fontWeight: 700
          }}>
            Bem-vindo ao VitalDoctor
          </div>
          <div style={{ fontSize: '0.9rem', color: '#8ba3c0' }}>
            Escolha por onde quer começar o atendimento
          </div>
        </div>

        {/* SE TEM ACESSO AO MÓDULO BIOMICROHERTZ - MOSTRA ESCOLHA */}
        {temAcessoExclusivo ? (
          <>
            {/* OPÇÃO 1: MÓDULO ANSIEDADE & DEPRESSÃO */}
            <button
              onClick={() => setAbaDashboard('método especializado')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #d4a574, #c0935c)',
                border: '2px solid #d4a574',
                borderRadius: 12,
                padding: '32px 28px',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: 16,
                transition: 'all 0.3s',
                color: '#050810'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 165, 116, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Módulo Ansiedade & Depressão
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.6 }}>
                Método especializado e certificado. Acesso exclusivo para profissionais autorizados.
              </div>
            </button>

            {/* DIVISOR */}
            <div style={{
              textAlign: 'center',
              margin: '24px 0',
              fontSize: '0.8rem',
              color: '#3d5a7a',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              OU
            </div>

            {/* OPÇÃO 2: ATENDIMENTO UNIVERSAL */}
            <button
              onClick={() => setAbaDashboard('templates')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0a1e2e, #061428)',
                border: '2px solid #00c6b8',
                borderRadius: 12,
                padding: '32px 28px',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: 24,
                transition: 'all 0.3s',
                color: '#dde4f0'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 198, 184, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌍</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Atendimento Universal
              </div>
              <div style={{ fontSize: '0.85rem', color: '#8ba3c0', lineHeight: 1.6 }}>
                Templates agnósticos para qualquer terapia. Customize conforme suas necessidades.
              </div>
            </button>

            <div style={{
              background: 'rgba(0, 198, 184, 0.1)',
              border: '1px solid #00c6b8',
              borderRadius: 8,
              padding: 16,
              fontSize: '0.75rem',
              color: '#8ba3c0',
              textAlign: 'center'
            }}>
              ✅ Tem acesso aos dois módulos. Escolha qual quer usar para este atendimento.
            </div>
          </>
        ) : (
          // SE NÃO TEM ACESSO - VAI DIRETO PARA UNIVERSAL
          <>
            <button
              onClick={() => setAbaDashboard('templates')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0a1e2e, #061428)',
                border: '2px solid #00c6b8',
                borderRadius: 12,
                padding: '32px 28px',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: 24,
                transition: 'all 0.3s',
                color: '#dde4f0'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 198, 184, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌍</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Atendimento Universal
              </div>
              <div style={{ fontSize: '0.85rem', color: '#8ba3c0', lineHeight: 1.6 }}>
                Templates agnósticos para qualquer terapia. Customize conforme suas necessidades.
              </div>
            </button>

            <div style={{
              background: 'rgba(0, 198, 184, 0.1)',
              border: '1px solid #00c6b8',
              borderRadius: 8,
              padding: 16,
              fontSize: '0.75rem',
              color: '#8ba3c0',
              textAlign: 'center'
            }}>
              📚 Sistema universal disponível para todos os terapeutas.
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA BIOMICROHERTZ (Módulo especializado)
  // ═══════════════════════════════════════════════════════════════════

  if (abaDashboard === 'método especializado') {
    return (
      <div className="fade" style={{ minHeight: '100vh' }}>
        <button
          onClick={() => setAbaDashboard('intro')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#d4a574',
            cursor: 'pointer',
            fontSize: '0.75rem',
            marginBottom: 20,
            fontWeight: 700
          }}
        >
          ← Voltar à Escolha
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #d4a574, #c0935c)',
          border: '2px solid #d4a574',
          borderRadius: 12,
          padding: '28px',
          color: '#050810',
          marginBottom: 24
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, marginBottom: 8 }}>
            Módulo Ansiedade & Depressão
          </h2>
          <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.95 }}>
            Método especializado e certificado. Você tem acesso exclusivo a este módulo.
          </p>
        </div>

        {/* AQUI VIRÁ O CONTEÚDO ESPECÍFICO DO MÓDULO */}
        <div style={{
          background: 'linear-gradient(135deg, #0a1e2e, #061428)',
          border: '1px solid #d4a574',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
          color: '#8ba3c0'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: '0.85rem' }}>
            Módulo especializado em desenvolvimento...
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: 8, color: '#3d5a7a' }}>
            Este é o seu módulo privado e exclusivo.
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA TEMPLATES (Universal)
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="fade" style={{ minHeight: '100vh' }}>
      <button
        onClick={() => setAbaDashboard('intro')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#00c6b8',
          cursor: 'pointer',
          fontSize: '0.75rem',
          marginBottom: 20,
          fontWeight: 700
        }}
      >
        ← Voltar à Escolha
      </button>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #1a3a5c', paddingBottom: 12 }}>
        {['templates', 'criar'].map(aba => (
          <button
            key={aba}
            onClick={() => setAbaDashboard(aba === 'templates' ? 'templates' : 'criar')}
            style={{
              padding: '8px 16px',
              background: (abaDashboard === 'templates' && aba === 'templates') || (abaDashboard === 'criar' && aba === 'criar') ? 'rgba(0, 198, 184, 0.15)' : 'transparent',
              border: (abaDashboard === 'templates' && aba === 'templates') || (abaDashboard === 'criar' && aba === 'criar') ? '1px solid #00c6b8' : 'none',
              color: (abaDashboard === 'templates' && aba === 'templates') || (abaDashboard === 'criar' && aba === 'criar') ? '#00c6b8' : '#8ba3c0',
              cursor: 'pointer',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: ((abaDashboard === 'templates' && aba === 'templates') || (abaDashboard === 'criar' && aba === 'criar')) ? 700 : 500
            }}
          >
            {aba === 'templates' && '📚 Templates Prontos'}
            {aba === 'criar' && '✨ Criar Novo'}
          </button>
        ))}
      </div>

      {(abaDashboard === 'templates' || abaDashboard === 'templates_detail') && !templateSelecionado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setTemplateSelecionado(t)}
              style={{
                background: 'linear-gradient(135deg, #0a1e2e, #061428)',
                border: '2px solid #1a3a5c',
                borderRadius: 8,
                padding: 16,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#dde4f0'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#00c6b8';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 198, 184, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1a3a5c';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>{t.icon}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00c6b8', marginBottom: 6 }}>
                {t.titulo}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>
                {t.descricao}
              </div>
            </button>
          ))}
        </div>
      )}

      {templateSelecionado && (
        <div>
          <button
            onClick={() => setTemplateSelecionado(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00c6b8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              marginBottom: 16,
              fontWeight: 700
            }}
          >
            ← Voltar aos Templates
          </button>

          <div style={{
            background: 'linear-gradient(135deg, #0a1e2e, #061428)',
            border: '1px solid #00c6b8',
            borderRadius: 8,
            padding: 20
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{templateSelecionado.icon}</div>
            <h2 style={{ fontSize: '1.1rem', color: '#dde4f0', margin: 0, marginBottom: 6 }}>
              {templateSelecionado.titulo}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#8ba3c0', margin: 0, marginBottom: 16 }}>
              {templateSelecionado.descricao}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className="btn btn-p" style={{ width: 'auto', fontSize: '0.7rem' }}>
                📋 Duplicar
              </button>
              <button className="btn btn-s" style={{ width: 'auto', fontSize: '0.7rem' }}>
                ✏️ Editar
              </button>
              <button className="btn btn-s" style={{ width: 'auto', fontSize: '0.7rem', background: '#d9534f' }}>
                🗑️ Deletar
              </button>
            </div>

            {templateSelecionado.passos && (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00c6b8', marginBottom: 12 }}>
                  📋 Passos
                </div>
                {templateSelecionado.passos.map((p, i) => (
                  <div key={i} style={{
                    background: '#050810',
                    border: '1px solid #1a3a5c',
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 8,
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#00c6b8' }}>Passo {p.num}: {p.nome} ({p.tempo})</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {abaDashboard === 'criar' && (
        <div style={{
          background: 'linear-gradient(135deg, #0a1e2e, #061428)',
          border: '1px solid #00c6b8',
          borderRadius: 8,
          padding: 20,
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00c6b8', marginBottom: 16 }}>
            ✨ Criar Template Novo
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="lbl" style={{ fontSize: '0.7rem' }}>Nome</label>
            <input className="inp" placeholder="Ex: Consulta Especial" />
          </div>
          <button className="btn btn-p" style={{ width: '100%', fontSize: '0.75rem' }}>
            ✨ Criar
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardUniversal({ user, modoEdicao }) {
  const [kpis, setKpis] = useState({ totalConsultas: 0, consultasHoje: 0, pacientes: 0 });
  const [materiais, setMateriais] = useState([
    { id: 1, titulo: 'Questionnaire Pré-Consulta', tipo: 'pdf', descricao: 'Para paciente preencher em casa' },
    { id: 2, titulo: 'Escudos Emocionais', tipo: 'form', descricao: 'Formulário interativo' },
    { id: 3, titulo: 'Protocolo de Relaxamento', tipo: 'video', descricao: 'Vídeo guiado' },
  ]);

  useEffect(() => {
    sb.from("consultas").select("id").eq("terapeuta_id", user.id)
      .then(({ data }) => {
        setKpis({
          totalConsultas: data?.length || 0,
          consultasHoje: data?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length || 0,
          pacientes: 0
        });
      });
  }, [user.id]);

  return (
    <div className="fade">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        {[
          { titulo: 'Total Consultas', valor: kpis.totalConsultas, icon: '📊' },
          { titulo: 'Consultas Hoje', valor: kpis.consultasHoje, icon: '⏰' },
          { titulo: 'Pacientes Ativos', valor: kpis.pacientes, icon: '👥' },
        ].map((k, i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, #0a1e2e, #061428)',
            border: '1px solid #1a3a5c',
            borderRadius: 8,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00c6b8', marginBottom: 3 }}>{k.valor}</div>
            <div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>{k.titulo}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #0a1e2e, #061428)',
        border: '1px solid #1a3a5c',
        borderRadius: 8,
        padding: 16
      }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#00c6b8',
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          📚 Materiais Universais
          {modoEdicao && <button className="btn btn-s btn-sm" style={{ width: 'auto' }}>➕ Adicionar</button>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {materiais.map(m => (
            <div key={m.id} style={{
              background: '#050810',
              border: '1px solid #1a3a5c',
              borderRadius: 6,
              padding: 10,
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>
                {m.tipo === 'pdf' && '📄'}
                {m.tipo === 'form' && '📋'}
                {m.tipo === 'video' && '🎥'}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dde4f0', marginBottom: 3 }}>{m.titulo}</div>
              <div style={{ fontSize: '0.65rem', color: '#8ba3c0', marginBottom: 8 }}>{m.descricao}</div>
              
              {modoEdicao && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.6rem' }}>✏️</button>
                  <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.6rem', background: '#d9534f' }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOVA CONSULTA REFATORIZADA (sem branco)
// ═══════════════════════════════════════════════════════════════════
function NovaConsultaRefatorizada({ user }) {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sb.from("custom_modules").select("*").eq("terapeuta_id", user.id).eq("publicado", true),
    ]).then(([modRes]) => {
      const modFiltrados = (modRes.data || []).filter(m =>
        !m.bloqueado_com || user.has_exclusive_therapy_access === true
      );
      setModulos(modFiltrados);
      setLoading(false);
    });
  }, [user?.id, user?.has_exclusive_therapy_access]);

  if (loading) return <div className="fade" style={{ padding: 20, textAlign: 'center' }}>⏳ Carregando...</div>;

  return (
    <div className="fade">
      <div style={{
        background: 'linear-gradient(135deg, #061428, #0a1e2e)',
        border: '1px solid #1a3a5c',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 20,
        textAlign: 'center'
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: '#dde4f0', marginBottom: 6 }}>
          Escolha o Tipo de Atendimento
        </div>
        <div style={{ fontSize: '0.75rem', color: '#8ba3c0' }}>
          {modulos.length > 0 ? 'Selecione a sessão que pretende iniciar' : 'Nenhum módulo disponível'}
        </div>
      </div>

      {modulos.length === 0 ? (
        <div style={{
          background: '#050810',
          border: '2px dashed #1a3a5c',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: '0.8rem', color: '#8ba3c0', marginBottom: 12 }}>
            Nenhum módulo de atendimento disponível
          </div>
          <button className="btn btn-p" style={{ width: 'auto' }}>
            Criar Primeiro Módulo
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14
        }}>
          {modulos.map(m => (
            <button
              key={m.id}
              onClick={() => console.log("Iniciando:", m.nome)}
              style={{
                background: 'linear-gradient(135deg, #0a1e2e, #061428)',
                border: '2px solid #1a3a5c',
                borderRadius: 8,
                padding: 16,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#dde4f0'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#00c6b8';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 198, 184, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1a3a5c';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>{m.nome}</div>
              <div style={{ fontSize: '0.75rem', color: '#8ba3c0', marginBottom: 10 }}>
                {m.descricao || 'Módulo personalizado'}
              </div>
              <div style={{
                fontSize: '0.65rem',
                background: 'rgba(0, 198, 184, 0.1)',
                padding: '4px 8px',
                borderRadius: 3,
                display: 'inline-block',
                color: '#00c6b8'
              }}>
                {m.bloqueado_com ? '🔒 Acesso Restrito' : '✅ Disponível'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GESTOR DE PACIENTES
// ═══════════════════════════════════════════════════════════════════
function GestorPacientes({ user, modoEdicao }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.from("pacientes").select("*").eq("terapeuta_id", user.id).order("nome")
      .then(({ data }) => {
        setPacientes(data || []);
        setLoading(false);
      });
  }, [user.id]);

  if (loading) return <div className="fade">⏳ Carregando...</div>;

  return (
    <div className="fade">
      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <input type="text" className="inp" placeholder="Procurar paciente..." style={{ flex: 1 }} />
        <button className="btn btn-p" style={{ width: 'auto' }}>➕ Novo</button>
      </div>

      {pacientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: '#8ba3c0', fontSize: '0.8rem' }}>
          Nenhum paciente cadastrado
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12
        }}>
          {pacientes.map(p => (
            <div key={p.id} style={{
              background: 'linear-gradient(135deg, #0a1e2e, #061428)',
              border: '1px solid #1a3a5c',
              borderRadius: 8,
              padding: 12
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00c6b8', marginBottom: 6 }}>{p.nome}</div>
              <div style={{ fontSize: '0.7rem', color: '#8ba3c0', marginBottom: 10 }}>
                📞 {p.telefone}<br/>📧 {p.email}
              </div>
              
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.65rem' }}>📋 Iniciar</button>
                {modoEdicao && (
                  <>
                    <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.65rem' }}>✏️</button>
                    <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.65rem', background: '#d9534f' }}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FARMACIA REFATORIZADA
// ═══════════════════════════════════════════════════════════════════
function FarmaciaRefatorizada({ user, modoEdicao }) {
  const [ervas] = useState([
    { id: 1, nome: 'Camomila', categoria: 'Calmantes', propriedades: 'Relaxamento, digestão' },
    { id: 2, nome: 'Melissa', categoria: 'Calmantes', propriedades: 'Ansiedade, stress' },
  ]);
  const [categoria, setCategoria] = useState('Todas');

  return (
    <div className="fade">
      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <select className="inp" value={categoria} onChange={e => setCategoria(e.target.value)} style={{ flex: 1 }}>
          <option>Todas</option>
          <option>Calmantes</option>
          <option>Digestivas</option>
        </select>
        {modoEdicao && <button className="btn btn-p" style={{ width: 'auto' }}>➕ Adicionar</button>}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12
      }}>
        {ervas.map(e => (
          <div key={e.id} style={{
            background: 'linear-gradient(135deg, #0a1e2e, #061428)',
            border: '1px solid #1a3a5c',
            borderRadius: 8,
            padding: 12
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00c6b8', marginBottom: 3 }}>
              {modoEdicao ? (
                <input type="text" className="inp" defaultValue={e.nome} style={{ fontSize: '0.75rem', marginBottom: 6 }} />
              ) : (
                e.nome
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8ba3c0', marginBottom: 8 }}>
              {modoEdicao ? (
                <input type="text" className="inp" defaultValue={e.categoria} style={{ fontSize: '0.65rem' }} />
              ) : (
                e.categoria
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#dde4f0' }}>
              {modoEdicao ? (
                <textarea className="inp" defaultValue={e.propriedades} style={{ fontSize: '0.65rem', minHeight: '50px' }} />
              ) : (
                e.propriedades
              )}
            </div>

            {modoEdicao && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.6rem' }}>💾 Guardar</button>
                <button className="btn btn-s btn-sm" style={{ flex: 1, fontSize: '0.6rem', background: '#d9534f' }}>🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES PESSOAIS
// ═══════════════════════════════════════════════════════════════════
function ConfiguracoesPessoais({ user, modoEdicao }) {
  const [form, setForm] = useState({
    nome: user?.user_metadata?.nome || '',
    telefone: user?.user_metadata?.telefone || '',
    email: user?.email || '',
    especialidade: user?.user_metadata?.especialidade || ''
  });

  return (
    <div className="fade">
      <div style={{
        background: 'linear-gradient(135deg, #0a1e2e, #061428)',
        border: '1px solid #1a3a5c',
        borderRadius: 8,
        padding: 20,
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00c6b8', marginBottom: 16 }}>
          👤 Dados Pessoais
        </div>

        {!modoEdicao ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl" style={{ fontSize: '0.7rem' }}>Nome</label>
              <div style={{ fontSize: '0.8rem', color: '#dde4f0', padding: '8px 10px', background: '#050810', borderRadius: 6 }}>
                {form.nome}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl" style={{ fontSize: '0.7rem' }}>Email</label>
              <div style={{ fontSize: '0.8rem', color: '#dde4f0', padding: '8px 10px', background: '#050810', borderRadius: 6 }}>
                {form.email}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl" style={{ fontSize: '0.7rem' }}>Telefone</label>
              <div style={{ fontSize: '0.8rem', color: '#dde4f0', padding: '8px 10px', background: '#050810', borderRadius: 6 }}>
                {form.telefone}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl" style={{ fontSize: '0.7rem' }}>Nome</label>
              <input className="inp" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl" style={{ fontSize: '0.7rem' }}>Telefone</label>
              <input className="inp" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <button className="btn btn-p" style={{ width: '100%', fontSize: '0.75rem' }}>💾 Guardar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Clinica({ user, onUpdate }) {
  const [org, setOrg] = useState(null);
  const [equipa, setEquipa] = useState([]);
  const [load, setLoad] = useState(true);
  const [nomeClinica, setNomeClinica] = useState("");
  const [codigoJuntar, setCodigoJuntar] = useState("");
  const [nomeProf, setNomeProf] = useState(user?.nome_profissional || user?.nome || "");
  const [msg, setMsg] = useState("");
  const [editandoPag, setEditandoPag] = useState(false);
  const [cfgPag, setCfgPag] = useState(null);
  const [secaoAbertaPag, setSecaoAbertaPag] = useState(null);

  const carregar = async () => {
    try {
      if (user?.org_id) {
        const { data: o, error: oErr } = await sb.from("organizacoes").select("*").eq("id", user.org_id).maybeSingle();
        if (!oErr && o) {
          setOrg(o);
          if (user.is_org_owner) {
            const { data: eq } = await sb.from("profiles").select("id,nome,email,nome_profissional,is_org_owner").eq("org_id", user.org_id);
            setEquipa(eq || []);
          }
        }
      }
    } catch(e) { /* tabela pode não existir ainda */ }
    setLoad(false);
  };
  useEffect(() => { carregar(); }, [user?.org_id]);

  const gerarCodigo = () => "CLIN-" + Math.random().toString(36).slice(2,8).toUpperCase();

  const criarClinica = async () => {
    if (!nomeClinica.trim()) { setMsg("Escreve o nome da clínica."); return; }
    setLoad(true);
    const codigo = gerarCodigo();
    const { data: o, error } = await sb.from("organizacoes").insert({ nome:nomeClinica, dono_id:user.id, codigo_convite:codigo }).select().single();
    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        setMsg("⚠️ A tabela de clínicas ainda não foi criada. Corre o SQL de configuração no Supabase e tenta novamente.");
      } else {
        setMsg("Erro: "+error.message);
      }
      setLoad(false); return;
    }
    await sb.from("profiles").update({ org_id:o.id, is_org_owner:true, nome_profissional:nomeProf }).eq("id", user.id);
    const novoPerfil = { ...user, org_id:o.id, is_org_owner:true, nome_profissional:nomeProf };
    onUpdate && onUpdate(novoPerfil);
    setOrg(o); setLoad(false); setMsg("Clínica criada!");
  };

  const juntarClinica = async () => {
    if (!codigoJuntar.trim()) { setMsg("Introduz o código de convite."); return; }
    setLoad(true);
    const { data: o } = await sb.from("organizacoes").select("*").eq("codigo_convite", codigoJuntar.trim().toUpperCase()).maybeSingle();
    if (!o) { setMsg("Código inválido. Confirma com o dono da clínica."); setLoad(false); return; }
    await sb.from("profiles").update({ org_id:o.id, is_org_owner:false, nome_profissional:nomeProf }).eq("id", user.id);
    const novoPerfil = { ...user, org_id:o.id, is_org_owner:false, nome_profissional:nomeProf };
    onUpdate && onUpdate(novoPerfil);
    setOrg(o); setLoad(false); setMsg(`Juntaste-te à clínica ${o.nome}!`);
  };

  const sairClinica = async () => {
    if (!confirm("Sair desta clínica? Os teus pacientes continuam teus, mas deixas de estar ligado à organização.")) return;
    await sb.from("profiles").update({ org_id:null, is_org_owner:false }).eq("id", user.id);
    const novoPerfil = { ...user, org_id:null, is_org_owner:false };
    onUpdate && onUpdate(novoPerfil);
    setOrg(null); setEquipa([]);
  };

  const abrirEditorPagina = async () => {
    const { data } = await sb.from("profiles").select("config").eq("id", user.id).maybeSingle();
    setCfgPag(data?.config || {site_slug: "", marca: "", oferta: "", categorias: []});
    setEditandoPag(true);
  };

  const guardarPagina = async () => {
    setLoad(true);
    await sb.from("profiles").update({config: cfgPag}).eq("id", user.id);
    setLoad(false);
    setMsg("✅ Página pública atualizada!");
    setEditandoPag(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const [verTemplates, setVerTemplates] = useState(!modulos.length);

  if (load) return (
    <div className="fade" style={{padding:40,textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite"}}>🔄</div>
      <div style={{color:"#5a7a9a",fontSize:13}}>A carregar...</div>
    </div>
  );

  // MODO EDIÇÃO DA PÁGINA PÚBLICA
  if (editandoPag && cfgPag) {
    return (
      <div className="fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:"1.05rem",fontWeight:700,color:"#dde4f0"}}>✏️ Editar página pública</div>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => setEditandoPag(false)}>✕ Fechar</button>
        </div>

        {/* Barra informativa */}
        <div style={{fontSize:".72rem",background:"#0d1422",border:"1px solid #14233a",borderRadius:10,padding:12,marginBottom:14,color:"#5a7a9a"}}>
          Edita com lápis. A página pública muda automaticamente. Não há lápis visível para os clientes.
        </div>

        {/* Edição visual com lápis (reutilizando SitePreview) */}
        <div style={{background:"#050810",border:"1px solid #1a3a5c",borderRadius:12,padding:"16px 18px",marginBottom:14}}>
          <SitePreview cfg={cfgPag} editavel={true} onEditar={(sec) => { setSecaoAbertaPag(sec); }} />
        </div>

        {/* Campos editáveis por secção (sanfona simplificada) */}
        <div className="card">
          <div style={{fontSize:".82rem",fontWeight:700,color:"#b0c4d8",marginBottom:10}}>Dados principais</div>
          
          <label className="lbl">URL da página (slug)</label>
          <input className="inp mb8" value={cfgPag.site_slug || ""} onChange={e => setCfgPag({...cfgPag, site_slug: e.target.value})} placeholder="ex: minha-clinica" />
          
          <label className="lbl">Nome da marca / clínica</label>
          <input className="inp mb8" value={cfgPag.marca || ""} onChange={e => setCfgPag({...cfgPag, marca: e.target.value})} placeholder="ex: Clínica Iqarifa" />
          
          <label className="lbl">Oferta principal</label>
          <textarea className="inp mb8" rows={2} value={cfgPag.oferta || ""} onChange={e => setCfgPag({...cfgPag, oferta: e.target.value})} placeholder="Descreve o que ofereces" />
        </div>

        {/* Botões de ação */}
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <button className="btn btn-p" style={{flex:1}} onClick={guardarPagina} disabled={load}>💾 Guardar e publicar</button>
          <button className="btn btn-s" style={{flex:1}} onClick={() => setEditandoPag(false)}>Cancelar</button>
        </div>

        {msg && <div className="al al-ok">{msg}</div>}
      </div>
    );
  }

  // JÁ TEM CLÍNICA
  if (org) {
    return (
      <div className="fade">
        {msg && <div className="al al-ok" style={{marginBottom:10}}>{msg}</div>}
        <div className="card" style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#1a4a6c,#0d2535)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏥</div>
            <div>
              <div style={{fontWeight:700,fontSize:"1rem",color:"#dde4f0"}}>{org.nome}</div>
              <div style={{fontSize:10,color:"#5a7a9a"}}>{user.is_org_owner?"Proprietário":"Membro"} · Código: <span style={{color:"#00c6b8",letterSpacing:1}}>{org.codigo_convite}</span></div>
            </div>
          </div>
          {user.is_org_owner && equipa.length>0 && (
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginBottom:6}}>EQUIPA ({equipa.length})</div>
              {equipa.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#050810",borderRadius:8,marginBottom:4,border:"1px solid #0d1828"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"#0d1828",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>👤</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"#b0c4d8",fontWeight:600}}>{m.nome_profissional||m.nome}</div>
                    <div style={{fontSize:9,color:"#3d5a7a"}}>{m.email}</div>
                  </div>
                  {m.is_org_owner && <span style={{fontSize:9,color:"#00c6b8",background:"rgba(0,198,184,.1)",padding:"2px 8px",borderRadius:10,border:"1px solid #00c6b840"}}>Proprietário</span>}
                </div>
              ))}
              <div style={{marginTop:10,background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:10}}>
                <div style={{fontSize:10,color:"#5a7a9a",marginBottom:4}}>Partilha este código com a tua equipa:</div>
                <div style={{fontSize:16,color:"#00c6b8",fontWeight:700,letterSpacing:3,textAlign:"center",padding:"8px 0"}}>{org.codigo_convite}</div>
                <button className="btn btn-s btn-sm" style={{fontSize:10}} onClick={()=>navigator.clipboard?.writeText(org.codigo_convite)}>📋 Copiar Código</button>
              </div>
            </div>
          )}
        </div>
        <div className="card" style={{marginBottom:10}}>
          <div className="card-t">⚙️ O Meu Perfil Profissional</div>
          <label className="lbl">Nome de atendimento</label>
          <input className="inp mb8" value={nomeProf} onChange={e=>setNomeProf(e.target.value)} placeholder="Como aparece aos pacientes"/>
          <button className="btn btn-p" style={{fontSize:11}} onClick={async()=>{
            await sb.from("profiles").update({nome_profissional:nomeProf}).eq("id",user.id);
            onUpdate&&onUpdate({...user,nome_profissional:nomeProf});
            setMsg("✅ Perfil atualizado!");setTimeout(()=>setMsg(""),2500);
          }}>💾 Guardar</button>
        </div>
        <div className="card">
          <div className="card-t">🌐 Página Pública</div>
          <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>A tua clínica tem uma página pública personalizável para captação de novos pacientes.</div>
          <button className="btn btn-s" style={{fontSize:11}} onClick={abrirEditorPagina}>✏️ Editar Página Pública</button>
        </div>
        <div style={{marginTop:10}}>
          <button className="btn btn-sm" style={{fontSize:10,background:"rgba(248,113,113,.08)",border:"1px solid #5a1a1a",color:"#f87171",width:"100%"}} onClick={sairClinica}>🚪 Sair da Clínica</button>
        </div>
      </div>
    );
  }

  // SEM CLÍNICA — escolher: criar ou juntar-se
  return (
    <div className="fade">
      {msg && <div className="al al-w">{msg}</div>}
      <div className="al al-i" style={{marginBottom:10}}>
        Trabalhas sozinho? Não precisas de clínica — a app já funciona só para ti. Esta secção é para quem quer ter uma <strong>clínica com vários profissionais</strong>.
      </div>

      <div className="card">
        <div className="card-t">🏥 Criar a Minha Clínica</div>
        <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:8}}>Cria uma clínica e convida profissionais. Tu vês os pacientes de todos; cada profissional vê os seus.</div>
        <span className="lbl">Nome da clínica</span>
        <input className="inp mb8" value={nomeClinica} onChange={e=>setNomeClinica(e.target.value)} placeholder="Ex: Clínica Bem-Estar" />
        <span className="lbl">O teu nome de atendimento</span>
        <input className="inp mb8" value={nomeProf} onChange={e=>setNomeProf(e.target.value)} placeholder="Ex: Dr. Ricardo" />
        <button className="btn btn-p" onClick={criarClinica}>Criar Clínica</button>
      </div>

      <div className="card">
        <div className="card-t">🔑 Juntar-me a uma Clínica</div>
        <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:8}}>Tens um código de convite? Introduz aqui para te juntares à equipa.</div>
        <span className="lbl">Código de convite</span>
        <input className="inp mb8" value={codigoJuntar} onChange={e=>setCodigoJuntar(e.target.value)} placeholder="CLIN-XXXXXX" style={{letterSpacing:2}} />
        <span className="lbl">O teu nome de atendimento</span>
        <input className="inp mb8" value={nomeProf} onChange={e=>setNomeProf(e.target.value)} placeholder="Ex: Dra. Natália" />
        <button className="btn btn-s" onClick={juntarClinica}>Juntar-me à Clínica</button>
      </div>
    </div>
  );
}

function Mensagens({ user, pacs }) {
  const [sel, setSel] = useState(null);
  const [conversas, setConversas] = useState({});
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState("");
  const [load, setLoad] = useState(true);

  const carregar = async () => {
    const { data } = await sb.from("mensagens").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    // Agrupar por email do paciente
    const grupos = {};
    (data || []).forEach(m => {
      const chave = m.email || "sem-email";
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(m);
    });
    setConversas(grupos);
    setLoad(false);
  };
  useEffect(() => { carregar(); }, [user.id]);

  // Pacientes com portal ativo (podem conversar)
  const pacsComPortal = pacs.filter(p => p.portal_ativo || p.email);
  const pacsFiltrados = pacsComPortal.filter(p => !busca || (p.nome||"").toLowerCase().includes(busca.toLowerCase()));

  const msgsDoPac = (pac) => conversas[pac.email] || [];
  const ultimaMsg = (pac) => {
    const ms = msgsDoPac(pac);
    return ms.length ? ms[ms.length-1] : null;
  };
  const naoLidas = (pac) => msgsDoPac(pac).filter(m => m.tipo === "paciente" && m.estado === "novo").length;

  const responder = async () => {
    if (!texto.trim() || !sel) return;
    // Marca a última mensagem do paciente como respondida (guarda a resposta)
    const ms = msgsDoPac(sel);
    const ultimaPac = [...ms].reverse().find(m => m.tipo === "paciente" && !m.resposta);
    if (ultimaPac) {
      await sb.from("mensagens").update({ resposta: texto, estado: "resolvido" }).eq("id", ultimaPac.id);
    } else {
      // Cria uma nova entrada como resposta do terapeuta
      await sb.from("mensagens").insert({
        user_id: user.id, nome: sel.nome, email: sel.email,
        tipo: "terapeuta", assunto: "Mensagem do terapeuta", resposta: texto, estado: "resolvido",
      });
    }
    setTexto("");
    carregar();
  };

  const marcarLidas = async (pac) => {
    const novas = msgsDoPac(pac).filter(m => m.tipo === "paciente" && m.estado === "novo");
    for (const m of novas) await sb.from("mensagens").update({ estado: "lido" }).eq("id", m.id);
    if (novas.length) carregar();
  };

  // Vista da conversa aberta
  if (sel) {
    const ms = msgsDoPac(sel);
    // Construir a sequência de balões (paciente + respostas do terapeuta)
    const baloes = [];
    ms.forEach(m => {
      if (m.mensagem && m.tipo === "paciente") baloes.push({ de: "paciente", txt: m.mensagem, data: m.created_at });
      if (m.resposta) baloes.push({ de: "terapeuta", txt: m.resposta, data: m.created_at });
    });
    return (
      <div className="fade" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 4px",borderBottom:"1px solid #0d1828"}}>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>setSel(null)}>←</button>
          <div style={{width:36,height:36,borderRadius:"50%",background:"#0d2535",display:"flex",alignItems:"center",justifyContent:"center",color:"#00c6b8",fontWeight:700}}>{(sel.nome||"?")[0].toUpperCase()}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:".82rem",fontWeight:600,color:"#dde4f0"}}>{sel.nome}</div>
            <div style={{fontSize:".6rem",color:sel.portal_ativo?"#4ade80":"#3d5a7a"}}>{sel.portal_ativo?"● Portal ativo":"○ Sem portal"}</div>
          </div>
          {sel.portal_token && (
            <button className="btn btn-sm" style={{width:"auto",background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}}
              onClick={()=>{ const link=`${window.location.origin}/?portal=${sel.portal_token}`; navigator.clipboard?.writeText(link); alert("Link do espaço do paciente copiado!"); }}>
              🔗 Link
            </button>
          )}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"12px 4px"}}>
          {baloes.length===0 && <div style={{textAlign:"center",color:"#3d5a7a",fontSize:".74rem",padding:30}}>Sem mensagens ainda. Escreve abaixo para começar.</div>}
          {baloes.map((b,i)=>(
            <div key={i} style={{display:"flex",justifyContent:b.de==="terapeuta"?"flex-end":"flex-start",marginBottom:8}}>
              <div style={{maxWidth:"78%",background:b.de==="terapeuta"?"#0d4a47":"#0d2535",borderRadius:b.de==="terapeuta"?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"9px 12px"}}>
                <div style={{fontSize:".76rem",color:"#dde4f0",lineHeight:1.5}}>{b.txt}</div>
                <div style={{fontSize:".54rem",color:"#5a7a9a",marginTop:3,textAlign:"right"}}>{fmtData(b.data?.split("T")[0])}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:7,padding:"8px 4px",borderTop:"1px solid #0d1828"}}>
          <input value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escreve a mensagem..." onKeyDown={e=>e.key==="Enter"&&responder()}
            style={{flex:1,background:"#050810",border:"1px solid #0d1828",borderRadius:20,padding:"10px 14px",color:"#dde4f0",fontSize:".78rem",outline:"none",fontFamily:"'DM Sans',sans-serif"}} />
          <button onClick={responder} style={{width:42,height:42,borderRadius:"50%",border:"none",background:"#00c6b8",color:"#04221f",fontSize:"1.1rem",cursor:"pointer"}}>➤</button>
        </div>
      </div>
    );
  }

  // Lista de conversas (estilo WhatsApp)
  return (
    <div className="fade">
      <input className="inp" placeholder="🔍 Procurar paciente..." value={busca} onChange={e=>setBusca(e.target.value)} style={{marginBottom:10}} />
      {load && <div style={{textAlign:"center",color:"#3d5a7a",fontSize:".74rem",padding:20}}>A carregar...</div>}
      {!load && pacsFiltrados.length===0 && (
        <div className="al al-i">Ainda não tens pacientes com portal ativo. Vai a um paciente → aba 🏛️ Portal → envia o link para ativar.</div>
      )}
      {pacsFiltrados.map(pac=>{
        const ult = ultimaMsg(pac);
        const nl = naoLidas(pac);
        const preview = ult ? (ult.mensagem || ult.resposta || "") : "Toca para conversar";
        return (
          <div key={pac.id} onClick={()=>{ setSel(pac); marcarLidas(pac); }}
            style={{display:"flex",alignItems:"center",gap:11,padding:"11px 8px",borderBottom:"1px solid #0d1828",cursor:"pointer",borderRadius:8}}
            onMouseEnter={e=>e.currentTarget.style.background="#0a0e18"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"#0d2535",display:"flex",alignItems:"center",justifyContent:"center",color:"#00c6b8",fontWeight:700,fontSize:"1rem",flexShrink:0,position:"relative"}}>
              {(pac.nome||"?")[0].toUpperCase()}
              {nl>0 && <span style={{position:"absolute",top:-2,right:-2,width:18,height:18,borderRadius:"50%",background:"#25D366",color:"#04221f",fontSize:".6rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{nl}</span>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:".82rem",fontWeight:nl>0?700:600,color:"#dde4f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pac.nome}</div>
              <div style={{fontSize:".68rem",color:nl>0?"#86efac":"#3d5a7a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{preview}</div>
            </div>
            <span style={{color:"#1a2840",fontSize:".9rem",flexShrink:0}}>›</span>
          </div>
        );
      })}
    </div>
  );
}

function PortalPaciente({ token }) {
  const [pac, setPac] = useState(null);
  const [marca, setMarca] = useState(null);
  const [itens, setItens] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [novaMsg, setNovaMsg] = useState("");
  const [respostas, setRespostas] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [marcacoes, setMarcacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = useState("inicio");

  const carregar = async () => {
    const { data: p } = await sb.from("pacientes").select("*").eq("portal_token", token).eq("portal_ativo", true).maybeSingle();
    if (!p) { setErro(true); setCarregando(false); return; }
    setPac(p);
    sb.from("profiles").select("config").eq("id", p.terapeuta_id).maybeSingle().then(({ data }) => { if (data?.config) setMarca(data.config); }).catch(()=>{});
    const [it, rs, mc, mg] = await Promise.all([
      sb.from("portal_itens").select("*").eq("paciente_id", p.id).eq("visivel", true).order("created_at", { ascending: false }),
      sb.from("respostas").select("*").eq("paciente_id", p.id).eq("status", "respondido").order("created_at", { ascending: true }),
      sb.from("agenda").select("*").eq("paciente_id", p.id).gte("data", new Date().toISOString().split("T")[0]).order("data"),
      sb.from("mensagens").select("*").eq("user_id", p.terapeuta_id).eq("email", p.email).order("created_at"),
    ]);
    setItens(it.data || []);
    setRespostas(rs.data || []);
    setMarcacoes(mc.data || []);
    setMsgs(mg.data || []);
    setCarregando(false);
  };
  useEffect(() => { carregar(); }, [token]);

  const enviarMsg = async () => {
    if (!novaMsg.trim() || !pac) return;
    const { data } = await sb.from("mensagens").insert({
      user_id: pac.terapeuta_id, nome: pac.nome, email: pac.email,
      tipo: "paciente", assunto: "Mensagem do paciente", mensagem: novaMsg, estado: "novo",
    }).select().single();
    if (data) { setMsgs([...msgs, data]); setNovaMsg(""); }
  };

  if (carregando) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f",color:"#3d5a7a"}}>A carregar o seu espaço...</div>;
  if (erro || !pac) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f",color:"#5a7a9a",padding:24,textAlign:"center"}}>Este link não é válido ou já não está disponível. Contacte o seu terapeuta.</div>;

  const frases = itens.filter(i => i.tipo === "frase");
  const audios = itens.filter(i => i.tipo === "audio");
  const protocolos = itens.filter(i => i.tipo === "protocolo");
  const materiais = itens.filter(i => i.tipo === "material");

  // Evolução simples (medos)
  const medosResp = respostas.filter(r => r.questionario === "medos");
  const calcTotal = (r) => { let t=0; for(let b=1;b<=7;b++)for(let i=1;i<=10;i++)t+=Number(r.respostas[`mb${b}_${i}`])||0; return t; };
  const evolucao = medosResp.map((r,i)=>({s:`S${i+1}`,total:calcTotal(r)}));

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0e18,#07090f)",color:"#dde4f0",maxWidth:600,margin:"0 auto"}}>
      {/* Cabeçalho acolhedor */}
      <div style={{padding:"26px 20px 18px",textAlign:"center",borderBottom:"1px solid #0d1828"}}>
        {marca?.logo
          ? <img src={marca.logo} style={{maxHeight:46,marginBottom:8,objectFit:"contain"}} />
          : <div style={{fontSize:"2.2rem",marginBottom:6}}>🏛️</div>}
        {marca?.nomePratica && <div style={{fontSize:".7rem",color:marca.cor||"#00c6b8",letterSpacing:1,marginBottom:8}}>{marca.nomePratica}</div>}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",color:"#dde4f0",marginBottom:3}}>Olá, {pac.nome?.split(" ")[0]}</div>
        <div style={{fontSize:".74rem",color:"#5a7a9a"}}>{pac.portal_boas_vindas || "Bem-vindo(a) ao seu espaço de cura e acompanhamento."}</div>
      </div>

      {/* Navegação */}
      <div style={{display:"flex",gap:5,padding:"10px 14px",overflowX:"auto",borderBottom:"1px solid #0d1828"}}>
        {[["inicio","✨ Início"],["materiais","🎧 Materiais"],["evolucao","📈 Evolução"],["mensagens","💬 Mensagens"]].map(([k,l])=>(
          <button key={k} onClick={()=>setAba(k)} style={{flexShrink:0,padding:"6px 13px",borderRadius:20,border:`1px solid ${aba===k?"#00c6b8":"#0d1828"}`,background:aba===k?"rgba(0,198,184,.08)":"transparent",color:aba===k?"#00c6b8":"#5a7a9a",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
        ))}
      </div>

      <div style={{padding:"16px 16px 40px"}}>
        {/* INÍCIO — frases motivacionais + próxima marcação */}
        {aba==="inicio" && (
          <div className="fade">
            {frases.length>0 && frases.map(f=>(
              <div key={f.id} style={{background:"linear-gradient(135deg,#0d2535,#0a1828)",border:"1px solid #1a4a5c",borderRadius:12,padding:"18px 16px",marginBottom:10,textAlign:"center"}}>
                <div style={{fontSize:"1.3rem",marginBottom:6}}>💫</div>
                <div style={{fontSize:".92rem",color:"#dde4f0",lineHeight:1.6,fontStyle:"italic"}}>"{f.conteudo}"</div>
              </div>
            ))}
            {frases.length===0 && <div style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:12,padding:20,textAlign:"center",color:"#3d5a7a",fontSize:".78rem"}}>O seu terapeuta vai partilhar mensagens aqui em breve. 🌱</div>}

            {marcacoes.length>0 && (
              <div style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:12,padding:14,marginTop:10}}>
                <div style={{fontSize:".64rem",color:"#00c6b8",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>📅 Próxima Sessão</div>
                {marcacoes.slice(0,2).map(m=>(
                  <div key={m.id} style={{fontSize:".78rem",color:"#b0c4d8",marginBottom:4}}>{fmtData(m.data)} {m.hora?.slice(0,5)} · {m.formato||"Consulta"}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MATERIAIS — áudios, protocolos */}
        {aba==="materiais" && (
          <div className="fade">
            {audios.length===0 && protocolos.length===0 && materiais.length===0 && <div style={{textAlign:"center",color:"#3d5a7a",fontSize:".78rem",padding:20}}>Ainda não há materiais partilhados.</div>}
            {audios.map(a=>(
              <div key={a.id} style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:10,padding:13,marginBottom:8}}>
                <div style={{fontSize:".8rem",color:"#b0c4d8",fontWeight:600,marginBottom:6}}>🎧 {a.titulo}</div>
                <a href={a.conteudo} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",padding:"6px 14px",borderRadius:6,background:"rgba(0,198,184,.1)",border:"1px solid #00c6b8",color:"#00c6b8",fontSize:".74rem",textDecoration:"none"}}>▶ Ouvir</a>
              </div>
            ))}
            {protocolos.map(p=>(
              <div key={p.id} style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:10,padding:13,marginBottom:8}}>
                <div style={{fontSize:".8rem",color:"#b0c4d8",fontWeight:600,marginBottom:6}}>📋 {p.titulo}</div>
                <pre style={{whiteSpace:"pre-wrap",fontSize:".72rem",color:"#7a98b8",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,margin:0}}>{p.conteudo}</pre>
              </div>
            ))}
            {materiais.map(m=>(
              <div key={m.id} style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:10,padding:13,marginBottom:8}}>
                <div style={{fontSize:".8rem",color:"#b0c4d8",fontWeight:600,marginBottom:6}}>📎 {m.titulo}</div>
                <a href={m.conteudo} target="_blank" rel="noopener noreferrer" style={{color:"#00c6b8",fontSize:".74rem",wordBreak:"break-all"}}>{m.conteudo}</a>
              </div>
            ))}
          </div>
        )}

        {/* EVOLUÇÃO — motivadora */}
        {aba==="evolucao" && (
          <div className="fade">
            {evolucao.length<2 ? (
              <div style={{textAlign:"center",color:"#3d5a7a",fontSize:".78rem",padding:20}}>A sua jornada de evolução vai aparecer aqui à medida que avança nas sessões. 🌿</div>
            ) : (
              <div style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:12,padding:16}}>
                <div style={{fontSize:".78rem",color:"#dde4f0",marginBottom:4,textAlign:"center"}}>A sua evolução 🌱</div>
                <div style={{fontSize:".66rem",color:"#5a7a9a",marginBottom:14,textAlign:"center"}}>Cada sessão é um passo em frente.</div>
                {(() => {
                  const max = Math.max(...evolucao.map(e=>e.total),1);
                  const desceu = evolucao[evolucao.length-1].total < evolucao[0].total;
                  return <>
                    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:110,padding:"0 4px"}}>
                      {evolucao.map((e,i)=>{
                        const h=(e.total/max)*100;
                        const melhor=i>0&&e.total<evolucao[i-1].total;
                        return (
                          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <div style={{width:"100%",height:`${h}%`,minHeight:6,borderRadius:"6px 6px 0 0",background:melhor?"linear-gradient(180deg,#4ade80,#1a6b4a)":"linear-gradient(180deg,#00c6b8,#0d4a47)"}} />
                            <div style={{fontSize:".58rem",color:"#3d5a7a"}}>{e.s}</div>
                          </div>
                        );
                      })}
                    </div>
                    {desceu && <div style={{textAlign:"center",marginTop:14,padding:"10px",background:"rgba(74,222,128,.06)",borderRadius:8,color:"#86efac",fontSize:".76rem"}}>🎉 Está a fazer um excelente progresso. Continue assim!</div>}
                  </>;
                })()}
              </div>
            )}
          </div>
        )}

        {/* MENSAGENS — comunicação com o terapeuta */}
        {aba==="mensagens" && (
          <div className="fade">
            <div style={{minHeight:200,marginBottom:12}}>
              {msgs.length===0 && <div style={{textAlign:"center",color:"#3d5a7a",fontSize:".76rem",padding:20}}>Ainda sem mensagens. Escreva ao seu terapeuta abaixo.</div>}
              {msgs.map(m=>{
                const doTerapeuta = m.resposta && m.tipo!=="paciente";
                return (
                  <div key={m.id} style={{marginBottom:8}}>
                    {m.mensagem && m.tipo==="paciente" && (
                      <div style={{marginLeft:"auto",maxWidth:"82%",background:"#0d2535",borderRadius:"12px 12px 3px 12px",padding:"9px 12px"}}>
                        <div style={{fontSize:".74rem",color:"#dde4f0"}}>{m.mensagem}</div>
                        <div style={{fontSize:".55rem",color:"#3d5a7a",marginTop:3,textAlign:"right"}}>{fmtData(m.created_at?.split("T")[0])}</div>
                      </div>
                    )}
                    {m.resposta && (
                      <div style={{maxWidth:"82%",background:"#0a1828",border:"1px solid #1a4a5c",borderRadius:"12px 12px 12px 3px",padding:"9px 12px",marginTop:6}}>
                        <div style={{fontSize:".6rem",color:"#00c6b8",marginBottom:2}}>Terapeuta</div>
                        <div style={{fontSize:".74rem",color:"#b0c4d8"}}>{m.resposta}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:6,position:"sticky",bottom:0,background:"#07090f",paddingTop:8}}>
              <input value={novaMsg} onChange={e=>setNovaMsg(e.target.value)} placeholder="Escreva a sua mensagem..." style={{flex:1,background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:"10px 12px",color:"#dde4f0",fontSize:".78rem",outline:"none",fontFamily:"'DM Sans',sans-serif"}} onKeyDown={e=>e.key==="Enter"&&enviarMsg()} />
              <button onClick={enviarMsg} style={{padding:"10px 16px",borderRadius:8,border:"none",background:"#00c6b8",color:"#04221f",fontWeight:700,fontSize:".76rem",cursor:"pointer"}}>Enviar</button>
            </div>
          </div>
        )}
      </div>

      <div style={{textAlign:"center",padding:"14px",fontSize:".58rem",color:"#1a2840",borderTop:"1px solid #0d1828"}}>VitalDoctor · O seu espaço de acompanhamento</div>
    </div>
  );
}

function FormPublico({ token }) {
  const [row, setRow] = useState(undefined);
  const [val, setVal] = useState({});
  const [feito, setFeito] = useState(false);
  const [marca, setMarca] = useState(null);
  useEffect(() => {
    sb.from("respostas").select("*").eq("token", token).eq("status", "pendente").maybeSingle()
      .then(({ data }) => {
        setRow(data || null);
        if (data?.terapeuta_id) sb.from("profiles").select("config").eq("id", data.terapeuta_id).maybeSingle().then(({ data:d }) => { if (d?.config) setMarca(d.config); }).catch(()=>{});
      }).catch(() => setRow(null));
  }, [token]);
  const submeter = async () => {
    await sb.from("respostas").update({ respostas: val, status: "respondido" }).eq("token", token);
    setFeito(true);
  };
  const form = row ? getForm(row.questionario) : null;
  return (
    <div style={{ minHeight: "100vh", background: "#050810", padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ padding: "10px 0 14px", display:"flex", alignItems:"center", gap:10 }}>
        {marca?.logo && <img src={marca.logo} style={{maxHeight:38,objectFit:"contain"}} />}
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: marca?.cor || "#00c6b8" }}>{marca?.nomePratica || "VitalDoctor"}</div>
      </div>
      {row === undefined && <div style={{ color: "#5a7a9a" }}>A carregar...</div>}
      {row === null && <div className="al al-i">Este questionário já foi preenchido ou o link não é válido.</div>}
      {feito && <div className="al al-ok">Obrigado! As suas respostas foram enviadas ao terapeuta. ✅</div>}
      {row && form && !feito && (
        <>
          <div className="card"><div className="card-t">{form.titulo}</div>{form.descricao && <div className="al al-i" style={{ fontSize: 10 }}>{form.descricao}</div>}</div>
          <FormFill form={form} value={val} onChange={setVal} />
          <button className="btn btn-p" onClick={submeter}>Enviar respostas</button>
        </>
      )}
    </div>
  );
}

function Farmacia({ adminMode }) {
  const LC = "vd_farmacia";
  const [itens, setItens] = useState(() => { try { return JSON.parse(localStorage.getItem(LC)||"[]"); } catch { return []; } });
  const [novo, setNovo] = useState({ categoria:"Fitoterapia", nome:"", indicacao:"", preparacao:"", contraind:"", notas:"" });
  const [busca, setBusca] = useState("");
  const [catSel, setCatSel] = useState("todas");
  const [bulk, setBulk] = useState("");

  useEffect(() => {
    sb.from("config_global").select("valor").eq("chave","farmacia").single()
      .then(({data:d}) => { if(d?.valor){ const v=Array.isArray(d.valor)?d.valor:JSON.parse(d.valor); setItens(v); localStorage.setItem(LC,JSON.stringify(v)); } })
      .catch(()=>{});
  }, []);

  const sync = async (lista) => {
    localStorage.setItem(LC, JSON.stringify(lista));
    try { await sb.from("config_global").upsert({chave:"farmacia",valor:lista},{onConflict:"chave"}); } catch {}
  };
  const adicionar = async () => {
    if (!novo.nome.trim()) return;
    const lista = [...itens, {...novo, id:Date.now()}];
    setItens(lista); await sync(lista); setNovo({categoria:novo.categoria,nome:"",indicacao:"",preparacao:"",contraind:"",notas:""});
  };
  const remover = async (id) => { const lista=itens.filter(i=>i.id!==id); setItens(lista); await sync(lista); };

  // Importação em massa: cola blocos separados por linha em branco
  const importarBulk = async () => {
    if (!bulk.trim()) return;
    const blocos = bulk.split(/\n\s*\n/).filter(b=>b.trim());
    const novos = blocos.map((b,i) => {
      const linhas = b.split("\n").map(l=>l.trim()).filter(Boolean);
      return { id:Date.now()+i, categoria:novo.categoria, nome:linhas[0]||"Sem nome", indicacao:linhas.slice(1).join(" "), preparacao:"", contraind:"", notas:"" };
    });
    const lista = [...itens, ...novos];
    setItens(lista); await sync(lista); setBulk("");
    alert(`${novos.length} itens importados!`);
  };

  const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const categorias = ["todas", ...Array.from(new Set(itens.map(i=>i.categoria||"Outros")))];
  const filtrados = itens
    .filter(i => catSel==="todas" || (i.categoria||"Outros")===catSel)
    .filter(i => !busca || norm(i.nome+" "+i.indicacao+" "+(i.contraind||"")).includes(norm(busca)));

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">🌿 Farmácia Natural</div>
        <div style={{background:"rgba(251,191,36,.04)",border:"1px solid rgba(251,191,36,.2)",borderRadius:8,padding:"10px 12px",fontSize:".62rem",lineHeight:1.7,color:"#fde68a"}}>
          <div style={{fontWeight:700,marginBottom:4}}>⚠️ Aviso Legal — Lê antes de usar</div>
          <div>Ferramenta de <strong>apoio informativo</strong>. É apenas uma sugestão — a decisão final cabe ao paciente em conjunto com o seu médico. O VitalDoctor <strong>não assume responsabilidade</strong> pelo uso desta informação.</div>
          <div style={{marginTop:6}}>• Aconselhar sempre o paciente a confirmar com o médico</div>
          <div>• Não substitui prescrição médica nem avaliação clínica</div>
          <div>• Verificar sempre interações com a medicação actual do paciente</div>
        </div>
      </div>

      {/* Pesquisa + categorias */}
      <div className="card">
        <input className="inp" placeholder="🔍 Pesquisar por nome, indicação ou sintoma..." value={busca} onChange={e=>setBusca(e.target.value)} style={{marginBottom:8}} />
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {categorias.map(c=>(
            <button key={c} className={`chip ${catSel===c?"on":""}`} onClick={()=>setCatSel(c)} style={{fontSize:".64rem"}}>{c==="todas"?"Todas":c}</button>
          ))}
        </div>
      </div>

      {adminMode && (
        <div className="card">
          <div className="card-t">+ Adicionar produto</div>
          <span className="lbl">Categoria</span>
          <select className="inp sel" value={novo.categoria} onChange={e=>setNovo(n=>({...n,categoria:e.target.value}))}>
            {["Fitoterapia","Óleos Essenciais","Probióticos","Suplementos","Limpeza de Órgãos","Outros"].map(c=><option key={c}>{c}</option>)}
          </select>
          <span className="lbl">Nome do produto *</span>
          <input className="inp mb8" value={novo.nome} onChange={e=>setNovo(n=>({...n,nome:e.target.value}))} placeholder="Ex: Alecrim (Rosmarinus officinalis)" />
          <span className="lbl">Indicação / Para que serve</span>
          <textarea className="inp mb8" rows={2} value={novo.indicacao} onChange={e=>setNovo(n=>({...n,indicacao:e.target.value}))} />
          <span className="lbl">Como preparar / tomar (doses)</span>
          <textarea className="inp mb8" rows={2} value={novo.preparacao} onChange={e=>setNovo(n=>({...n,preparacao:e.target.value}))} placeholder="Ex: Infusão, 1 punhado de folhas, 15 min..." />
          <span className="lbl">⚠️ Contra-indicações / interações</span>
          <textarea className="inp mb8" rows={2} value={novo.contraind} onChange={e=>setNovo(n=>({...n,contraind:e.target.value}))} placeholder="Ex: gravidez, tensão alta, anticoagulantes..." />
          <span className="lbl">Notas</span>
          <textarea className="inp mb8" rows={2} value={novo.notas} onChange={e=>setNovo(n=>({...n,notas:e.target.value}))} />
          <button className="btn btn-p" onClick={adicionar} disabled={!novo.nome.trim()}>Adicionar</button>

          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #0d1828"}}>
            <span className="lbl">📋 Importação em massa (cola blocos separados por linha em branco — 1ª linha = nome)</span>
            <textarea className="inp mb8" rows={3} value={bulk} onChange={e=>setBulk(e.target.value)} placeholder={"Camomila\nCalmante, digestão\n\nGengibre\nNáuseas, digestão"} />
            <button className="btn btn-s btn-sm" onClick={importarBulk} disabled={!bulk.trim()}>Importar em massa</button>
          </div>
        </div>
      )}

      {filtrados.length === 0
        ? <div className="al al-i">{busca?`Nada encontrado para "${busca}".`:(adminMode?"Adiciona o primeiro produto acima.":"Conteúdo a ser adicionado.")}</div>
        : filtrados.map(item => (
          <div key={item.id} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1}}>
                {item.categoria && <span style={{fontSize:".52rem",padding:"1px 7px",borderRadius:8,background:"#0d2535",color:"#5ae0d8",letterSpacing:.5}}>{item.categoria}</span>}
                <div style={{fontWeight:700,fontSize:".82rem",color:"#00c6b8",marginTop:4}}>{item.nome}</div>
              </div>
              {adminMode && <button className="chip" onClick={()=>remover(item.id)} style={{flexShrink:0}}>✕</button>}
            </div>
            {item.indicacao && <div style={{fontSize:".72rem",color:"#b0c4d8",marginTop:6}}><strong style={{color:"#5a7a9a"}}>Indicação:</strong> {item.indicacao}</div>}
            {item.preparacao && <div style={{fontSize:".72rem",color:"#86efac",marginTop:3}}><strong style={{color:"#5a7a9a"}}>Como tomar:</strong> {item.preparacao}</div>}
            {item.contraind && <div style={{fontSize:".72rem",color:"#f59e0b",marginTop:3}}><strong>⚠️ Contra-indicações:</strong> {item.contraind}</div>}
            {item.notas && <div style={{fontSize:".68rem",color:"#3d5a7a",marginTop:3}}>{item.notas}</div>}
          </div>
        ))
      }
    </div>
  );
}

function Infanto({ adminMode, ir }) {
  const LC = "vd_infanto";
  const [itens, setItens] = useState(() => { try { return JSON.parse(localStorage.getItem(LC) || "[]"); } catch { return []; } });
  const [novo, setNovo] = useState({ titulo: "", faixaEtaria: "", descricao: "", notas: "" });
  const [editId, setEditId] = useState(null);
  const [idadeSel, setIdadeSel] = useState(null); // null = visão geral
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    sb.from("config_global").select("valor").eq("chave", "infanto").single()
      .then(({ data: d }) => { if (d?.valor) { const v = Array.isArray(d.valor) ? d.valor : JSON.parse(d.valor); setItens(v); localStorage.setItem(LC, JSON.stringify(v)); } })
      .catch(() => {});
  }, []);

  const persistir = async (lista) => {
    setItens(lista); localStorage.setItem(LC, JSON.stringify(lista));
    await sb.from("config_global").upsert({ chave: "infanto", valor: lista }, { onConflict: "chave" }).catch(()=>{});
  };
  const guardarFicha = () => {
    if (!novo.titulo.trim()) return;
    const lista = editId ? itens.map(i => i.id === editId ? { ...i, ...novo } : i) : [...itens, { ...novo, id: "f" + Date.now() }];
    persistir(lista); setNovo({ titulo: "", faixaEtaria: "", descricao: "", notas: "" }); setEditId(null);
  };
  const apagar = (id) => { if (confirm("Apagar?")) persistir(itens.filter(i => i.id !== id)); };

  // Dados das faixas etárias com protocolos embutidos
  const FAIXAS = [
    {
      id: "0_2", label: "0 – 2 anos", icon: "👶",
      cor: "from-pink-600 to-pink-800",
      descricao: "Comunicação quase toda não verbal (olhar, choro, sorriso). Desenvolvimento do apego e ansiedade de separação aos 6-9 meses.",
      abordagem: "Focar no vínculo pais-bebé. Usar estímulos sensoriais suaves. Orientar os pais sobre rotinas previsíveis e segurança emocional.",
      alertas: "Falta de contacto visual · Ausência de resposta a estímulos · Dificuldade no vínculo afectivo · Choro apático e desinteresse em explorar.",
      tempo: "40 min (foco do bebé: 5 min)",
      chave: "Escudo da Rejeição",
      questionarios: ["ficha_pais"],
      consulta_tipo: null,
    },
    {
      id: "3_4", label: "3 – 4 anos", icon: "🧒",
      cor: "from-orange-600 to-orange-800",
      descricao: "Linguagem mais estruturada (muitos porquês). Jogos simbólicos. Emoções complexas (vergonha, ciúme). Birras e teste de limites.",
      abordagem: "Trabalhar ao nível lúdico (bonecos, histórias, desenhos). Ajudar a nomear emoções com cartões. Orientar os pais sobre limites saudáveis.",
      alertas: "Atraso na fala · Falta de jogo simbólico · Agressividade extrema · Apatia e comportamentos regressivos.",
      tempo: "40 min (foco da criança: 10 min)",
      chave: "Escudo da Imposição e Controlo",
      questionarios: ["ficha_pais", "anamnese_crianca"],
      consulta_tipo: null,
    },
    {
      id: "5_7", label: "5 – 7 anos", icon: "🎒",
      cor: "from-yellow-600 to-yellow-800",
      descricao: "Entrada na escola. Regras sociais e cooperação. Leitura e escrita. Medos mais elaborados (escuro, monstros, morte).",
      abordagem: "Histórias terapêuticas e desenhos expressivos. Trabalhar medos com externalização. Reforço positivo. Envolver escola.",
      alertas: "Recusa escolar · Medos intensos · Dificuldades de aprendizagem · Isolamento social · Queixas físicas sem causa médica.",
      tempo: "45 min (foco da criança: 20 min)",
      chave: "Escudo da Desproteção / Desvalorização",
      questionarios: ["ficha_pais", "anamnese_crianca", "ficha_professor"],
      consulta_tipo: null,
    },
    {
      id: "8_11", label: "8 – 11 anos", icon: "📚",
      cor: "from-blue-600 to-blue-800",
      descricao: "Pensamento lógico. Importância do grupo de pares. Autoestima ligada ao desempenho escolar e desportivo.",
      abordagem: "Técnicas cognitivas simples. Diário emocional. Resolução de conflitos. Psicoeducação emocional. Trabalhar autoestima.",
      alertas: "Baixa autoestima · Bullying · Ansiedade de desempenho · Comportamentos compulsivos · Retraimento social.",
      tempo: "50 min",
      chave: "Escudo da Desvalorização / Impotência",
      questionarios: ["ficha_pais", "anamnese_crianca", "ficha_professor", "medos"],
      consulta_tipo: null,
    },
    {
      id: "12_17", label: "12 – 17 anos", icon: "🧑",
      cor: "from-purple-600 to-purple-800",
      descricao: "Identidade em construção. Autonomia. Pressão de grupo. Redes sociais. Namoros. Conflitos com autoridade.",
      abordagem: "Aliança terapêutica forte. Validação emocional. Trabalhar identidade e valores. Mindfulness. Escudos emocionais.",
      alertas: "Automutilação · Ideação suicida · Isolamento · Consumo de substâncias · Perturbações alimentares · Ansiedade intensa.",
      tempo: "50-60 min",
      chave: "Todos os escudos possíveis · avaliação individual",
      questionarios: ["pre_consulta", "escudos", "medos", "ficha_pais"],
      consulta_tipo: "consciente",
    },
  ];

  const faixaActiva = idadeSel ? FAIXAS.find(f => f.id === idadeSel) : null;
  const itensParaFaixa = faixaActiva
    ? itens.filter(i => i.faixaEtaria && i.faixaEtaria.includes(faixaActiva.label.split("–")[0].trim()))
    : itens;

  return (
    <div className="fade">
      {/* Selector de faixa etária */}
      <div className="card">
        <div className="card-t">👶 Atendimento Infanto-Juvenil — Selecciona a Faixa Etária</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: idadeSel ? 10 : 0 }}>
          {FAIXAS.map(f => (
            <button key={f.id}
              onClick={() => setIdadeSel(idadeSel === f.id ? null : f.id)}
              style={{
                padding: "8px 12px", borderRadius: 10, border: `2px solid ${idadeSel === f.id ? "#00c6b8" : "#0d1828"}`,
                background: idadeSel === f.id ? "#0d2535" : "#050810", cursor: "pointer",
                fontSize: 11, fontWeight: 600, color: idadeSel === f.id ? "#dde4f0" : "#5a7a9a",
                transition: "all .15s"
              }}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Painel da faixa etária seleccionada */}
      {faixaActiva && (
        <div className="fade">
          <div className="card" style={{ borderColor: "#1a3a5c" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#dde4f0", marginBottom: 4 }}>
              {faixaActiva.icon} {faixaActiva.label}
            </div>
            <div style={{ fontSize: 10, color: "#f59e0b", marginBottom: 10 }}>
              ⏱ Duração: {faixaActiva.tempo} · 🔑 {faixaActiva.chave}
            </div>

            <div style={{ background: "#0a1e2e", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#00c6b8", fontWeight: 700, marginBottom: 4 }}>📋 Características desta faixa</div>
              <div style={{ fontSize: 11, color: "#5a7a9a", lineHeight: 1.6 }}>{faixaActiva.descricao}</div>
            </div>

            <div style={{ background: "#0a1e2e", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>✅ Abordagem terapêutica</div>
              <div style={{ fontSize: 11, color: "#5a7a9a", lineHeight: 1.6 }}>{faixaActiva.abordagem}</div>
            </div>

            <div style={{ background: "rgba(239,68,68,.04)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>⚠️ Sinais de alerta</div>
              <div style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.6 }}>{faixaActiva.alertas}</div>
            </div>

            {/* Acções */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {ir && (
                <button className="btn btn-p" style={{ flex: 1, minWidth: 140 }}
                  onClick={() => ir("consulta")}>
                  🩺 Iniciar Consulta
                </button>
              )}
              {faixaActiva.questionarios.map(qKey => {
                const f = getAllForms().find(x => x.key === qKey);
                return f ? (
                  <button key={qKey} className="btn btn-s" style={{ flex: 1, minWidth: 140 }}
                    onClick={() => ir && ir("questionario", qKey)}>
                    📋 {f.titulo}
                  </button>
                ) : null;
              })}
            </div>
            <div style={{ fontSize: 9, color: "#2d4a66", marginTop: 8, lineHeight: 1.5 }}>
              💡 "Iniciar Consulta" abre o menu de tipos de atendimento. Para crianças, começa pelas fichas (Pais, Anamnese) para recolher o contexto antes da sessão.
            </div>
          </div>

          {/* Conteúdo do admin para esta faixa */}
          {itensParaFaixa.length > 0 && (
            <div className="card">
              <div className="card-t">Notas e Protocolos — {faixaActiva.label}</div>
              {itensParaFaixa.map(item => (
                <div key={item.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #0d1828" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 7 }}>
                    <div onClick={() => setAberto(aberto === item.id ? null : item.id)}
                      style={{ fontWeight: 700, fontSize: 12, color: "#00c6b8", cursor: "pointer", flex: 1 }}>
                      {aberto === item.id ? "▾" : "▸"} {item.titulo}
                    </div>
                    {adminMode && (
                      <button className="btn btn-d btn-sm" style={{ width: "auto", padding: "2px 7px", fontSize: 10 }}
                        onClick={() => apagar(item.id)}>✕</button>
                    )}
                  </div>
                  {aberto === item.id && (
                    <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid #1a3a5c" }}>
                      {item.descricao && <div style={{ fontSize: 11, color: "#5a7a9a", marginBottom: 4, lineHeight: 1.6 }}>{item.descricao}</div>}
                      {item.notas && <div style={{ fontSize: 10, color: "#f59e0b", lineHeight: 1.6 }}>⚠️ {item.notas}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visão geral quando nenhuma faixa seleccionada */}
      {!faixaActiva && (
        <div className="card">
          <div className="card-t">Visão Geral — Todos os Protocolos</div>
          {FAIXAS.map(f => (
            <div key={f.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #0d1828" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#00c6b8", marginBottom: 3 }}>{f.icon} {f.label}</div>
              <div style={{ fontSize: 10, color: "#5a7a9a" }}>{f.descricao.substring(0, 100)}...</div>
              <div style={{ fontSize: 9, color: "#2d4a66", marginTop: 3 }}>Questionários: {f.questionarios.join(" · ")}</div>
            </div>
          ))}
        </div>
      )}

      {/* Admin: adicionar conteúdo */}
      {adminMode && (
        <div className="card">
          <div className="card-t">+ Adicionar Nota / Protocolo</div>
          <div className="lbl">Título</div>
          <input className="inp" value={novo.titulo} onChange={e => setNovo({ ...novo, titulo: e.target.value })} placeholder="Ex: Protocolo ansiedade 5-7 anos" />
          <div className="lbl">Faixa etária</div>
          <select className="inp sel" value={novo.faixaEtaria} onChange={e => setNovo({ ...novo, faixaEtaria: e.target.value })}>
            <option value="">-- Seleccionar --</option>
            {FAIXAS.map(f => <option key={f.id} value={f.label}>{f.icon} {f.label}</option>)}
          </select>
          <div className="lbl">Descrição</div>
          <textarea className="inp" rows={3} value={novo.descricao} onChange={e => setNovo({ ...novo, descricao: e.target.value })} />
          <div className="lbl">Sinais de alerta / notas clínicas</div>
          <textarea className="inp" rows={2} value={novo.notas} onChange={e => setNovo({ ...novo, notas: e.target.value })} />
          <button className="btn btn-p" style={{ marginTop: 8 }} onClick={guardarFicha} disabled={!novo.titulo.trim()}>+ Adicionar</button>
        </div>
      )}
    </div>
  );
}



// ── BASE DE CONHECIMENTO EXPANDIDA ─────────────────────────────────────────
// Mapas de sintomas → conteúdo da base de dados
const KB_SINTOMAS = {
  // Sono e descanso
  "sono": { escudo:"sobrevivencia", pontos:["epifise","hipotalamo","hipofise"], chakra:"Terceiro Olho", ervas:["valeriana","passiflora","camomila"], interferencia:"Campo Elétrico", conselho:"Desligar ecrãs 1h antes de dormir · Meditação de enraizamento · Reduzir Wi-Fi no quarto" },
  "dormir": { escudo:"sobrevivencia", pontos:["epifise","hipotalamo"], chakra:"Terceiro Olho", ervas:["valeriana","passiflora"], interferencia:"Campo Elétrico", conselho:"Meditação de enraizamento 5 min antes de dormir · Áudio dos medos" },
  "insonia": { escudo:"sobrevivencia", pontos:["epifise","hipotalamo","hipofise"], chakra:"Terceiro Olho", ervas:["valeriana","melissa","passiflora"], interferencia:"Campo Elétrico", conselho:"Desligar ecrãs · Eliminar Wi-Fi do quarto · Meditação guiada" },
  // Energia e fadiga
  "energia": { escudo:"sobrevivencia", pontos:["suprarrenais","figado","timo"], chakra:"Plexo Solar", ervas:["guarana","ginseng","espirulina"], interferencia:"Geopatias", conselho:"Pés descalços 10 min · Beber 2L água · Sol direto 15 min" },
  "cansaco": { escudo:"sobrevivencia", pontos:["suprarrenais","figado","baco"], chakra:"Raiz", ervas:["ginseng","guarana","ashwagandha"], interferencia:"Geopatias", conselho:"Enraizamento diário · Reduzir comprometimentos energéticos · Sono regular" },
  "fadiga": { escudo:"sobrevivencia", pontos:["suprarrenais","figado","timo"], chakra:"Raiz", ervas:["guarana","ginseng"], interferencia:"Geopatias", conselho:"Check-up energético · Avaliar Bovis · Protocolo de reforço" },
  // Clareza mental e foco
  "clareza": { escudo:"sobrevivencia", pontos:["hipofise","hipotalamo","epifise"], chakra:"Terceiro Olho", ervas:["ginkgo","romero","hortelã"], interferencia:"Campo Elétrico", conselho:"Silêncio mental 5 min · Reduzir ecrãs · Meditação" },
  "foco": { escudo:"sobrevivencia", pontos:["hipofise","hipotalamo"], chakra:"Terceiro Olho", ervas:["ginkgo","romero"], interferencia:"Campo Elétrico", conselho:"Técnica Pomodoro · Eliminar notificações · Meditação matinal" },
  "mental": { escudo:"sobrevivencia", pontos:["hipofise","hipotalamo","epifise"], chakra:"Terceiro Olho", ervas:["ginkgo","valeriana","romero"], interferencia:"Campo Elétrico", conselho:"Silêncio mental · Eliminar ecrãs · Exercício físico leve" },
  "memoria": { escudo:"desvalorizacao", pontos:["hipofise","epifise"], chakra:"Terceiro Olho", ervas:["ginkgo","romero"], interferencia:"Campo Elétrico", conselho:"Exercício físico · Omega 3 · Meditação diária" },
  // Ansiedade e stress
  "ansiedad": { escudo:"sobrevivencia", pontos:["hipotalamo","paratiroide","suprarrenais"], chakra:"Plexo Solar", ervas:["valeriana","passiflora","melissa"], interferencia:"Larvas Astrais", conselho:"Respiração 4-7-8 · Meditação guiada · Áudio de medos" },
  "stress": { escudo:"sobrevivencia", pontos:["suprarrenais","figado","estomago"], chakra:"Plexo Solar", ervas:["ashwagandha","valeriana","melissa"], interferencia:"Geopatias", conselho:"Enraizamento · Natureza · Reduzir estimulantes" },
  "nervoso": { escudo:"sobrevivencia", pontos:["hipotalamo","suprarrenais","estomago"], chakra:"Plexo Solar", ervas:["valeriana","passiflora","camomila"], interferencia:"Campo Elétrico", conselho:"Respiração · Chá de camomila · Saír ao ar livre" },
  "panico": { escudo:"sobrevivencia", pontos:["hipotalamo","suprarrenais","pulmonar"], chakra:"Raiz", ervas:["valeriana","passiflora"], interferencia:"Larvas Astrais", conselho:"Técnica de ancoragem 5-4-3-2-1 · Respiração diafragmática · Acompanhamento especializado" },
  // Tristeza e depressão
  "triste": { escudo:"perda", pontos:["coracao","baco","figado"], chakra:"Cardíaco", ervas:["hipericao","melissa","saffron"], interferencia:"Contratos Cármicos", conselho:"Exposição à luz solar · Contacto social · Movimentar o corpo" },
  "depress": { escudo:"perda", pontos:["coracao","baco","figado","epifise"], chakra:"Cardíaco", ervas:["hipericao","melissa"], interferencia:"Contratos Cármicos", conselho:"Áudio de enraizamento · Exposição solar · Exercício físico regular · Acompanhamento médico" },
  "vazio": { escudo:"perda", pontos:["coracao","epifise"], chakra:"Coronário", ervas:["hipericao","saffron"], interferencia:"Contratos Cármicos", conselho:"Reconectar com o propósito de vida · Gratidão diária · Acompanhamento especializado" },
  // Dor e físico
  "dor": { escudo:"impotencia", pontos:["figado","pancreas","rins"], chakra:"Plexo Solar", ervas:["arnica","gengibre","curcuma"], interferencia:"Alerta Somático", conselho:"Check-up médico urgente · Avaliação energética" },
  "cabeca": { escudo:"desvalorizacao", pontos:["hipofise","hipotalamo","epifise"], chakra:"Terceiro Olho", ervas:["hortelã","lavanda"], interferencia:"Campo Elétrico", conselho:"Reduzir ecrãs · Hidratação · Descanso" },
  // Autoestima e confiança
  "autoestima": { escudo:"desvalorizacao", pontos:["hipofise","hipotalamo"], chakra:"Plexo Solar", ervas:["ginseng","ashwagandha"], interferencia:"Auto-Sabotagem", conselho:"Journaling de conquistas · Afirmações matinais · Evitar comparações" },
  "confianca": { escudo:"desvalorizacao", pontos:["hipofise","plexo"], chakra:"Plexo Solar", ervas:["ginseng"], interferencia:"Auto-Sabotagem", conselho:"Pequenas vitórias diárias · Afirmação: Eu confio em mim · Eliminar crítica interna" },
  "medos": { escudo:"sobrevivencia", pontos:["hipotalamo","suprarrenais"], chakra:"Raiz", ervas:["valeriana","passiflora"], interferencia:"Larvas Astrais", conselho:"Áudio dos medos · Técnica de EFT · Exposição gradual" },
  // Relações e amor
  "relacionamento": { escudo:"perda", pontos:["coracao","uteroprostata"], chakra:"Cardíaco", ervas:["damiana","rosa"], interferencia:"Contratos Cármicos", conselho:"Comunicação não-violenta · Terapia de casal · Perdão activo" },
  "solidao": { escudo:"perda", pontos:["coracao","baco"], chakra:"Cardíaco", ervas:["melissa","hipericao"], interferencia:"Contratos Cármicos", conselho:"Contacto social intencional · Voluntariado · Animais de companhia" },
  // Dinheiro e trabalho
  "dinheiro": { escudo:"sobrevivencia", pontos:["figado","rins","suprarrenais"], chakra:"Raiz", ervas:["canela","patchouli"], interferencia:"Contratos Cármicos", conselho:"A11 — Prosperidade · Meditação de abundância · Gratidão financeira" },
  "trabalho": { escudo:"impotencia", pontos:["figado","suprarrenais"], chakra:"Plexo Solar", ervas:["rosmarino","ginseng"], interferencia:"Auto-Sabotagem", conselho:"Definir objetivos claros · Eliminar procrastinação · Enraizamento matinal" },
  "prosperidade": { escudo:"sobrevivencia", pontos:["figado","rins"], chakra:"Raiz", ervas:["canela"], interferencia:"Contratos Cármicos", conselho:"Limpeza energética do espaço de trabalho · A11 · 45 dias gratidão" },
  // Proteção
  "protecao": { escudo:"desprotecao", pontos:["timo","amigdalas","baco"], chakra:"Portal Estelar", ervas:["arruda","alecrim","sal"], interferencia:"Inveja / Olho Gordo", conselho:"Redoma dourada diária · Sal grosso no banho · Turmalina negra" },
  "inveja": { escudo:"desprotecao", pontos:["timo","baco"], chakra:"Portal Estelar", ervas:["arruda","alho"], interferencia:"Inveja / Olho Gordo", conselho:"Limão na entrada de casa · Ovo de proteção · Não revelar planos" },
  // Digestão
  "estomago": { escudo:"sobrevivencia", pontos:["estomago","duodeno","figado"], chakra:"Plexo Solar", ervas:["camomila","gengibre","hortelã"], interferencia:"Efeito Bumerangue", conselho:"Comer devagar · Evitar stress nas refeições · Chá digestivo" },
  "digestao": { escudo:"sobrevivencia", pontos:["intestgrosso","intestdelgado","estomago"], chakra:"Sacro", ervas:["camomila","boldo","gengibre"], interferencia:"Geopatias", conselho:"Probióticos · Fibras · Reduzir alimentos processados" },
  // Geral
  "bloqueio": { escudo:"impotencia", pontos:["figado","vesicula","bexiga"], chakra:"Raiz", ervas:["arruda","alecrim"], interferencia:"Magia Inconsciente", conselho:"Limpeza energética profunda · 3 sessões recomendadas" },
  "limpeza": { escudo:"desprotecao", pontos:["timo","baco","amigdalas"], chakra:"Portal Estelar", ervas:["arruda","guiné","alecrim"], interferencia:"Miasmas", conselho:"Banho de sal grosso · Defumação com alecrim · Limpeza dos 4 elementos" },
};

function Assistente({ user }) {
  const [texto, setTexto] = useState("");
  const [sug, setSug] = useState(null);
  const [ouvindo, setOuvindo] = useState(false);
  const [abaResult, setAbaResult] = useState("resumo"); // resumo | pontos | farmacia | protocolo

  const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

  const analisar = () => {
    if (!texto.trim()) return;
    const n = norm(texto);
    const palavras = n.split(/\W+/).filter(p=>p.length>3);

    // 1. Base de conhecimento expandida (KB_SINTOMAS)
    const kbMatches = {};
    Object.entries(KB_SINTOMAS).forEach(([key, data]) => {
      if (n.includes(key)) {
        kbMatches[key] = data;
      }
    });

    // 2. Escudos
    const scoreEsc = ESCUDOS.map(e => {
      const h = norm(e.nome+" "+e.emocoes+" "+e.foco+" "+(e.sentenca||""));
      const score = palavras.filter(p=>h.includes(p)&&p.length>3).length;
      return {...e, score};
    }).sort((a,b)=>b.score-a.score).filter(e=>e.score>0).slice(0,2);

    // Escudos do KB
    const kbEscudoIds = [...new Set(Object.values(kbMatches).map(m=>m.escudo).filter(Boolean))];
    const kbEscudos = kbEscudoIds.map(id => ESCUDOS.find(e=>e.id===id)).filter(Boolean);
    const todosEscudos = [...kbEscudos, ...scoreEsc.filter(e=>!kbEscudoIds.includes(e.id))].slice(0,3);

    // 3. Pontos (direto da base)
    const kbPontoIds = [...new Set(Object.values(kbMatches).flatMap(m=>m.pontos||[]))];
    const kbPontos = kbPontoIds.map(id=>getPonto(id)).filter(Boolean);
    // Pontos por keyword
    const scorePt = PONTOS.map(p => {
      const h = norm((p.sintomas||"")+" "+(p.aspectos||"")+" "+p.nome);
      const score = palavras.filter(w=>h.includes(w)&&w.length>3).length;
      return {...p,score};
    }).sort((a,b)=>b.score-a.score).filter(p=>p.score>0).slice(0,4);
    const todosPontos = [...kbPontos, ...scorePt.filter(p=>!kbPontoIds.includes(p.id))].slice(0,6);

    // 4. Ervas / Farmácia
    const kbErvas = [...new Set(Object.values(kbMatches).flatMap(m=>m.ervas||[]))];

    // 5. Chakras
    const kbChakras = [...new Set(Object.values(kbMatches).map(m=>m.chakra).filter(Boolean))];

    // 6. Interferências
    const kbInterf = [...new Set(Object.values(kbMatches).map(m=>m.interferencia).filter(Boolean))];

    const kbNomes = []; // 72 Nomes exclusivos da Hikari Fafe

    // 8. Conselhos
    const kbConselhos = [...new Set(Object.values(kbMatches).map(m=>m.conselho).filter(Boolean))];

    // 9. Afirmação do escudo dominante
    const escDom = todosEscudos[0];
    const afirm = escDom ? AFIRMACOES_ESCUDO[escDom.id] : null;

    setSug({
      kbMatches, todosEscudos, todosPontos,
      kbErvas, kbChakras, kbInterf, kbNomes, kbConselhos,
      afirm, escDom,
      semMatch: Object.keys(kbMatches).length===0 && todosEscudos.length===0 && todosPontos.length===0
    });
    setAbaResult("resumo");
  };

  const ditar = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Reconhecimento de voz não disponível."); return; }
    const rec = new SR(); rec.lang="pt-PT"; rec.continuous=false; rec.interimResults=false;
    rec.onstart=()=>setOuvindo(true);
    rec.onresult=e=>{setTexto(t=>t+" "+e.results[0][0].transcript);setOuvindo(false);};
    rec.onerror=()=>setOuvindo(false); rec.onend=()=>setOuvindo(false);
    rec.start();
  };

  const copyAll = () => {
    if (!sug) return;
    const linhas = [
      "🤖 ANÁLISE — ASSISTENTE VITALDOCTOR",
      "─".repeat(40),
    ];
    if (sug.todosEscudos.length) { linhas.push("\n🛡️ ESCUDO(S)"); sug.todosEscudos.forEach(e=>linhas.push(`• ${e.nome} — ${e.sentenca||e.emocoes}`)); }
    if (sug.kbChakras.length) { linhas.push("\n🌀 CHAKRAS EM ATENÇÃO"); sug.kbChakras.forEach(c=>linhas.push(`• ${c}`)); }
    if (sug.kbInterf.length) { linhas.push("\n🔍 POSSÍVEIS INTERFERÊNCIAS"); sug.kbInterf.forEach(i=>linhas.push(`• ${i}`)); }

    if (sug.kbErvas.length) { linhas.push("\n🌿 ERVAS INDICADAS"); sug.kbErvas.forEach(e=>linhas.push(`• ${e}`)); }
    if (sug.kbConselhos.length) { linhas.push("\n💡 CONSELHOS"); sug.kbConselhos.forEach(c=>linhas.push(`• ${c}`)); }
    if (sug.afirm) { linhas.push("\n📿 AFIRMAÇÃO"); linhas.push(sug.afirm.afirmacao); }
    navigator.clipboard?.writeText(linhas.join("\n"));
  };

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">🤖 Assistente VitalDoctor</div>
        <div style={{fontSize:9,color:"#3d5a7a",marginBottom:10,lineHeight:1.5,padding:"6px 8px",background:"#050810",borderRadius:6,border:"1px solid #0d1828"}}>
          ⚠️ Sugestões baseadas na base de conhecimento da app. <strong>NÃO</strong> substituem julgamento clínico. Verifica sempre antes de usar com o paciente.
        </div>
        <textarea className="inp" rows={4} style={{resize:"vertical"}} placeholder="Descreve o que o paciente sente, a queixa principal, sintomas físicos ou emocionais..." value={texto} onChange={e=>setTexto(e.target.value)} />
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          <button className="btn btn-p" style={{flex:2}} onClick={analisar} disabled={!texto.trim()}>🔍 Analisar</button>
          <button className={`btn ${ouvindo?"btn-d":"btn-s"}`} style={{flex:1}} onClick={ditar}>{ouvindo?"🔴 A ouvir...":"🎤 Voz"}</button>
          <button className="btn btn-s" style={{flex:1}} onClick={()=>{setTexto("");setSug(null);}}>Limpar</button>
        </div>
        {/* Exemplos rápidos */}
        <div style={{marginTop:8}}>
          <div style={{fontSize:9,color:"#3d5a7a",marginBottom:4}}>Exemplos rápidos:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {["não dorme bem + sem energia","ansiedade + pânico","tristeza + vazio","dores + cansaço","falta de dinheiro + bloqueio","autoestima baixa","limpeza energética"].map(ex=>(
              <div key={ex} onClick={()=>setTexto(ex)} style={{padding:"3px 8px",borderRadius:10,border:"1px solid #0d1828",background:"#050810",cursor:"pointer",fontSize:9,color:"#5a7a9a"}}>{ex}</div>
            ))}
          </div>
        </div>
      </div>

      {sug && (
        <div className="fade">
          {sug.semMatch && (
            <div className="al al-i" style={{fontSize:11}}>
              Não encontrei correspondências específicas. Tenta descrever com mais detalhe — ex: "não dorme, cansado, sem motivação, medos".
            </div>
          )}

          {!sug.semMatch && (
            <>
              {/* Abas de resultado */}
              <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:10,scrollbarWidth:"none"}}>
                {[["resumo","📋 Resumo"],["pontos","🔬 Pontos"],["farmacia","🌿 Ervas"],["protocolo","📋 Protocolo"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setAbaResult(k)} style={{flexShrink:0,padding:"6px 12px",borderRadius:16,border:`1px solid ${abaResult===k?"#00c6b8":"#0d1828"}`,background:abaResult===k?"rgba(0,198,184,.1)":"#050810",color:abaResult===k?"#00c6b8":"#5a7a9a",fontSize:10,fontWeight:abaResult===k?700:400,cursor:"pointer"}}>{l}</button>
                ))}
              </div>

              {abaResult === "resumo" && (
                <>
                  {sug.todosEscudos.length>0 && (
                    <div className="card" style={{marginBottom:8,borderColor:"#1a4a3a"}}>
                      <div style={{fontSize:9,color:"#00c6b8",fontWeight:800,letterSpacing:1,marginBottom:6}}>🛡️ ESCUDO(S) PROVÁVEIS</div>
                      {sug.todosEscudos.map(e=>(
                        <div key={e.id} style={{marginBottom:8,paddingBottom:6,borderBottom:"1px solid #0d1828"}}>
                          <div style={{fontWeight:800,color:"#00c6b8",fontSize:13}}>{e.nome}</div>
                          <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{e.emocoes}</div>
                          {e.sentenca&&<div style={{fontSize:10,color:"#8ba3c0",fontStyle:"italic",marginTop:2}}>"{e.sentenca}"</div>}
                          <div style={{fontSize:9,color:"#3d5a7a",marginTop:4}}>{e.devolutiva}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {sug.kbChakras.length>0 && (
                    <div className="card" style={{marginBottom:8}}>
                      <div style={{fontSize:9,color:"#9a5ae0",fontWeight:800,letterSpacing:1,marginBottom:6}}>🌀 CHAKRAS EM ATENÇÃO</div>
                      {sug.kbChakras.map(c=>{
                        const data=CHAKRAS_BLOQUEIO?.find(x=>x.nome===c);
                        return <div key={c} style={{marginBottom:6}}>
                          <div style={{fontWeight:700,fontSize:11,color:"#c8a8f0"}}>{c}</div>
                          {data&&<div style={{fontSize:9,color:"#7a5a9a"}}>{data.bloqueio}</div>}
                          {data&&<div style={{fontSize:9,color:"#9a7ab8",marginTop:2}}>Cura: {data.cura}</div>}
                        </div>;
                      })}
                    </div>
                  )}
                  {sug.kbInterf.length>0 && (
                    <div className="card" style={{marginBottom:8}}>
                      <div style={{fontSize:9,color:"#f59e0b",fontWeight:800,letterSpacing:1,marginBottom:6}}>🔍 POSSÍVEIS INTERFERÊNCIAS</div>
                      {sug.kbInterf.map(i=>{
                        const data=INTERFERENCIAS_ENERGETICAS?.find(x=>x.nome===i);
                        return <div key={i} style={{marginBottom:6}}>
                          <div style={{fontWeight:700,fontSize:11,color:"#fbbf24"}}>{i}</div>
                          {data&&<div style={{fontSize:9,color:"#7a6a3a"}}>{data.diagnostico}</div>}
                        </div>;
                      })}
                    </div>
                  )}

                  {sug.kbConselhos.length>0 && (
                    <div className="card" style={{marginBottom:8,borderColor:"#1a4a6c"}}>
                      <div style={{fontSize:9,color:"#5ae0d8",fontWeight:800,letterSpacing:1,marginBottom:6}}>💡 CONSELHOS PRÁTICOS</div>
                      {sug.kbConselhos.map((c,i)=>(
                        <div key={i} style={{fontSize:10,color:"#5a7a9a",marginBottom:5,display:"flex",gap:6,alignItems:"flex-start"}}>
                          <span style={{color:"#00c6b8",flexShrink:0}}>→</span>{c}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {abaResult === "pontos" && (
                <div className="card">
                  <div style={{fontSize:9,color:"#00c6b8",fontWeight:800,letterSpacing:1,marginBottom:8}}>🔬 PONTOS A EXPLORAR</div>
                  {sug.todosPontos.length===0 && <div style={{fontSize:10,color:"#3d5a7a"}}>Nenhum ponto específico encontrado.</div>}
                  {sug.todosPontos.map(p=>(
                    <div key={p.id} style={{marginBottom:10,paddingBottom:8,borderBottom:"1px solid #0d1828"}}>
                      <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{p.nome}</div>
                      {p.aspectos&&<div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}><strong>Ligado a:</strong> {p.aspectos}</div>}
                      {p.frase&&<div style={{fontSize:10,color:"#00c6b8",marginTop:4}}><strong>Pergunta:</strong> {p.frase}</div>}
                      {p.sintomas&&<div style={{fontSize:9,color:"#3d5a7a",marginTop:2}}>Sintomas: {p.sintomas}</div>}
                    </div>
                  ))}
                </div>
              )}

              {abaResult === "farmacia" && (
                <div className="card">
                  <div style={{fontSize:9,color:"#5ae0d8",fontWeight:800,letterSpacing:1,marginBottom:8}}>🌿 ERVAS INDICADAS</div>
                  {sug.kbErvas.length===0 && <div style={{fontSize:10,color:"#3d5a7a"}}>Nenhuma erva específica identificada — consulta a Farmácia para pesquisa manual.</div>}
                  {sug.kbErvas.map(e=>(
                    <div key={e} style={{padding:"8px 10px",background:"#050810",border:"1px solid #1a5a4c",borderRadius:8,marginBottom:5,fontSize:10,color:"#5ae0d8",fontWeight:700}}>🌿 {e}</div>
                  ))}
                  <div style={{fontSize:9,color:"#3d5a7a",marginTop:8,padding:"6px 8px",background:"#051018",borderRadius:6,border:"1px solid #1a5a4c"}}>
                    🌿 Consulta a tab <strong style={{color:"#5ae0d8"}}>Farmácia</strong> na barra de ferramentas para ver contra-indicações, preparação e interacções completas.
                  </div>
                </div>
              )}

              {abaResult === "protocolo" && sug.afirm && (
                <div className="card">
                  <div style={{fontSize:9,color:"#c8a8f0",fontWeight:800,letterSpacing:1,marginBottom:8}}>📿 AFIRMAÇÕES — {sug.escDom?.nome}</div>
                  <div style={{marginBottom:8,padding:8,background:"#0a0518",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#7a5a9a",marginBottom:3}}>AFIRMAÇÃO:</div>
                    <div style={{fontSize:10,color:"#c8a8f0",lineHeight:1.6}}>{sug.afirm.afirmacao}</div>
                  </div>
                  <div style={{marginBottom:8,padding:8,background:"#0a0518",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#7a5a9a",marginBottom:3}}>LIBERTAÇÃO:</div>
                    <div style={{fontSize:10,color:"#c8a8f0",lineHeight:1.6}}>{sug.afirm.liberacao}</div>
                  </div>
                  <div style={{padding:8,background:"#0a0518",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#7a5a9a",marginBottom:3}}>CURA:</div>
                    <div style={{fontSize:10,color:"#c8a8f0",lineHeight:1.6}}>{sug.afirm.cura}</div>
                  </div>
                </div>
              )}
              {abaResult === "protocolo" && !sug.afirm && (
                <div className="al al-i" style={{fontSize:10}}>Protocolo não disponível para esta combinação. Vai à tab Resumo e usa os conselhos práticos.</div>
              )}

              <button className="btn btn-s" style={{marginTop:8,fontSize:10}} onClick={copyAll}>
                📋 Copiar análise completa
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ModuloAudios() {
  const [audios, setAudios] = useState([]);
  const [copied, setCopied] = useState("");
  const [cat, setCat] = useState("todos");

  // Categorias fixas (as 4 bibliotecas) + ícones
  const CATEGORIAS = [
    { id: "todos", nome: "Todos", icon: "📚" },
    { id: "tratamento", nome: "Tratamento", icon: "🎧" },
    { id: "medos", nome: "Medos", icon: "😨" },
    { id: "meditacao", nome: "Meditação 21 dias", icon: "🧘" },
    { id: "escudos", nome: "Modulação Escudos", icon: "🛡️" },
  ];

  // Bibliotecas pré-carregadas (pastas do Drive) — sempre disponíveis
  const BIBLIOTECAS = [
    { id: "lib_trat", nome: "🎧 Áudios de Tratamento", descricao: "Pasta completa de áudios de tratamento para enviar ao paciente.", tipo: "tratamento", link_drive: "https://drive.google.com/drive/folders/1Q6s8dZcj74o5TVHQjZ1oLyrRy4ZPXgxh", pasta: true },
    { id: "lib_medos", nome: "😨 Áudios dos Medos", descricao: "Áudios específicos para trabalhar cada medo identificado.", tipo: "medos", link_drive: "https://drive.google.com/drive/folders/1LafUmx9FP4U10wcLhxFtnTn4CDCXD00i", pasta: true },
    { id: "lib_med_h", nome: "🧘 Meditação 21 Dias — Homem", descricao: "Programa de meditação de 21 dias (versão masculina).", tipo: "meditacao", link_drive: "https://drive.google.com/drive/folders/1GMolBdq_dp4rAOj3ErOYGVlOlAEVCatr", pasta: true },
    { id: "lib_med_m", nome: "🧘 Meditação 21 Dias — Mulher", descricao: "Programa de meditação de 21 dias (versão feminina).", tipo: "meditacao", link_drive: "https://drive.google.com/drive/folders/1GMolBdq_dp4rAOj3ErOYGVlOlAEVCatr", pasta: true },
    { id: "lib_escudos", nome: "🛡️ Modulação dos Escudos", descricao: "Áudios de modulação para cada escudo emocional (Desproteção, Desvalorização, Impotência, Sobrevivência, Perda).", tipo: "escudos", link_drive: "https://drive.google.com/drive/folders/19RwkwJx0H8e_Wkgg5R7788FaoPNcAd8H", pasta: true },
  ];

  useEffect(() => { sb.from("audios").select("*").eq("ativo", true).order("ordem").then(({ data }) => { if (data) setAudios(data); }); }, []);

  // Juntar bibliotecas fixas + áudios individuais do admin
  const todos = [...BIBLIOTECAS, ...audios];
  const filtrados = cat === "todos" ? todos : todos.filter(a => (a.tipo || "tratamento") === cat);

  const enviarWhatsApp = (a) => {
    const txt = `${a.nome}\n${a.descricao || ""}\n${a.link_drive}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  };

  return (
    <div className="fade">
      {/* Filtro por categoria */}
      <div className="card">
        <div className="card-t">🎧 Biblioteca de Áudios Terapêuticos</div>
        <div style={{ fontSize: 10, color: "#5a7a9a", marginBottom: 10, lineHeight: 1.5 }}>
          Escolhe o áudio e envia ao paciente por WhatsApp ou copia o link. O paciente abre no Drive e ouve.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIAS.map(c => (
            <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`}
              onClick={() => setCat(c.id)} style={{ fontSize: 11 }}>
              {c.icon} {c.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de áudios/bibliotecas */}
      <div className="card">
        {filtrados.length === 0 && <div className="al al-i">Sem áudios nesta categoria.</div>}
        {filtrados.map((a, i) => (
          <div key={a.id || i} style={{ background: "#050810", border: "1px solid #0d1828", borderRadius: 8, padding: 11, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {a.pasta && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: "#0d2535", color: "#00c6b8", fontWeight: 600 }}>PASTA</span>}
              <div style={{ fontWeight: 600, fontSize: 12, color: "#b0c4d8" }}>{a.nome}</div>
            </div>
            {a.descricao && <div style={{ fontSize: 10, color: "#3d5a7a", marginBottom: 7, lineHeight: 1.5 }}>{a.descricao}</div>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {a.link_drive && <a href={a.link_drive} target="_blank" rel="noopener noreferrer" className="btn btn-p btn-sm" style={{ width: "auto", textDecoration: "none" }}>{a.pasta ? "Abrir pasta" : "Ouvir"}</a>}
              {a.link_drive && <button className="btn btn-s btn-sm" style={{ width: "auto" }} onClick={() => { navigator.clipboard.writeText(a.link_drive); setCopied(a.id || a.nome); setTimeout(() => setCopied(""), 2000); }}>{copied === (a.id || a.nome) ? "✓ Copiado" : "Copiar link"}</button>}
              {a.link_drive && <button className="btn btn-sm" style={{ background: "#25D36618", border: "1px solid #25D36640", color: "#25D366", width: "auto" }} onClick={() => enviarWhatsApp(a)}>WhatsApp</button>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, color: "#2d4a66", textAlign: "center", padding: "4px 0", lineHeight: 1.5 }}>
        ⚠️ As pastas do Drive devem estar partilhadas como "Qualquer pessoa com o link pode ver" para o paciente conseguir abrir.
      </div>
    </div>
  );
}

// Secção recolhível do editor do mini-site (sanfona)
function Secao({ id, icon, titulo, resumo, aberta, onToggle, children }) {
  return (
    <div className="card" style={{padding:0,overflow:"hidden",marginBottom:8}}>
      <button onClick={()=>onToggle(id)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 15px",background:aberta?"#0d1422":"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:"1.25rem",width:26,textAlign:"center"}}>{icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:".9rem",fontWeight:700,color:"#cdd9e8"}}>{titulo}</div>
          {resumo && <div style={{fontSize:".68rem",color:"#5a7a9a",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{resumo}</div>}
        </div>
        <span style={{fontSize:".8rem",color:"#5a7a9a",transform:aberta?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▼</span>
      </button>
      {aberta && <div style={{padding:"4px 15px 16px"}}>{children}</div>}
    </div>
  );
}

function MiniSite({ user }) {
  const EXEMPLO = {
    nomePratica:"Espaço Bem-Estar", subtitulo:"Terapia Holística e Equilíbrio Emocional",
    bio:"Acompanho pessoas que procuram reequilíbrio emocional e bem-estar. Com uma abordagem acolhedora e personalizada, ajudo cada pessoa a reencontrar a sua harmonia interior, num espaço seguro e sem julgamentos.",
    abordagem:"Trabalho de forma integrativa, combinando escuta ativa, técnicas de relaxamento e ferramentas práticas adaptadas a cada pessoa. Cada sessão é um passo no seu caminho de cura.",
    credenciais:"Terapeuta Certificada · Membro da Associação Profissional",
    cor:"#5a9e94", logo:"", foto:"", horario:"Seg a Sex: 9h–19h · Sáb: 9h–13h",
    telefone:"912345678", email:"contacto@exemplo.pt", instagram:"espaco.bemestar", facebook:"",
    site_slug:"",
    servicos:[
      { nome:"Consulta de Avaliação", desc:"Primeira sessão para conhecer a sua história e definir objetivos.", duracao:"60 min", preco:"€45" },
      { nome:"Sessão de Acompanhamento", desc:"Sessão regular de terapia e trabalho emocional.", duracao:"50 min", preco:"€40" },
      { nome:"Pack 5 Sessões", desc:"Acompanhamento contínuo com desconto.", duracao:"5 × 50 min", preco:"€180" },
    ],
    testemunhos:[
      { nome:"Maria S.", texto:"Encontrei aqui um espaço de paz e transformação. Mudou a minha forma de lidar com a ansiedade." },
      { nome:"João P.", texto:"Profissionalismo e empatia em cada sessão. Recomendo de olhos fechados." },
    ],
    formacoes:[
      { nome:"Workshop de Gestão da Ansiedade", desc:"Aprende ferramentas práticas num dia intensivo.", data:"Sábado, 15 de Março", preco:"€60", vagas:"12 vagas" },
    ],
    produtos:[
      { nome:"E-book: 7 Passos para o Equilíbrio", desc:"Guia digital com exercícios práticos.", preco:"€15" },
    ],
    atividades:[
      { nome:"Grupo de Meditação Semanal", desc:"Encontros de meditação guiada, todas as quartas.", data:"Quartas, 19h", preco:"€10/sessão" },
    ],
    equipa:[
      { nome:"Dra. Ana Silva", funcao:"Fundadora · Terapeuta", bio:"15 anos de experiência em terapia holística.", foto:"" },
      { nome:"João Martins", funcao:"Psicólogo Clínico", bio:"Especialista em ansiedade e gestão de stress.", foto:"" },
    ],
    redes:[
      { rede:"Instagram", link:"https://instagram.com/exemplo" },
      { rede:"Facebook", link:"https://facebook.com/exemplo" },
    ],
    morada:"Rua das Flores, 123 · Lisboa",
    mapa_link:"",
    mostrar_marcacao:true,
  };
  const [cfg, setCfg] = useState(EXEMPLO);
  const [editando, setEditando] = useState(false);
  const [ok, setOk] = useState("");
  const [temConfig, setTemConfig] = useState(false);
  const [visitantes, setVisitantes] = useState(null);
  const [inscricoesPendentes, setInscricoesPendentes] = useState(null);
  const [verStats, setVerStats] = useState(false);
  const [leads, setLeads] = useState([]);
  const [secaoAberta, setSecaoAberta] = useState("marca");
  const toggleSecao = (id) => setSecaoAberta(a => a === id ? null : id);
  const logoRef = useRef(null);
  const fotoRef = useRef(null);

  useEffect(() => {
    // Se o utilizador já guardou um site, usa o dele; senão mostra o exemplo
    if (user?.config && user.config.nomePratica) {
      setCfg(c => ({ ...EXEMPLO, ...user.config }));
      setTemConfig(true);
    }
  }, [user]);

  // Carregar stats quando sai do modo editar
  useEffect(() => {
    if (!editando && temConfig && cfg.site_slug) {
      const carregarStats = async () => {
        try {
          // Visitantes nos últimos 7 dias
          const dataHoje = new Date();
          const data7diasAtras = new Date(dataHoje.getTime() - 7*24*60*60*1000).toISOString().split('T')[0];
          const { data: visitas } = await sb.from("visitas_minisite").select("*", { count:"exact" }).eq("site_slug", cfg.site_slug).gte("data", data7diasAtras);
          setVisitantes(visitas?.length || 0);
          
          // Inscrições pendentes
          const { data: inscricoes } = await sb.from("inscricoes").select("*", { count:"exact" }).eq("site_slug", cfg.site_slug).eq("status", "pendente");
          setInscricoesPendentes(inscricoes?.length || 0);

          // Lista completa de leads (mais recentes primeiro)
          const { data: todasLeads } = await sb.from("inscricoes").select("*").eq("site_slug", cfg.site_slug).order("created_at", { ascending:false });
          setLeads(todasLeads || []);
        } catch(e) {
          console.log("Erro ao carregar stats:", e);
        }
      };
      carregarStats();
    }
  }, [editando, temConfig, cfg.site_slug]);

  const atualizarLead = async (id, novoStatus) => {
    await sb.from("inscricoes").update({ status: novoStatus }).eq("id", id);
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status: novoStatus } : l));
    setInscricoesPendentes(n => {
      const lead = leads.find(l => l.id === id);
      if (lead?.status === "pendente" && novoStatus !== "pendente") return Math.max(0, (n||0) - 1);
      if (lead?.status !== "pendente" && novoStatus === "pendente") return (n||0) + 1;
      return n;
    });
  };

  const salvar = async () => {
    let slug = cfg.site_slug;
    if (!slug && cfg.nomePratica) {
      slug = cfg.nomePratica.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + "-" + (user.id||"").slice(0,4);
    }
    const novoCfg = { ...cfg, site_slug: slug };
    setCfg(novoCfg);
    await sb.from("profiles").update({ config: novoCfg }).eq("id", user.id);
    setTemConfig(true);
    setOk("Mini-site guardado!"); setTimeout(() => setOk(""), 2500);
  };

  const limparTudo = () => {
    if (!confirm("Limpar tudo e começar do zero? (Os exemplos desaparecem)")) return;
    setCfg({ nomePratica:"", subtitulo:"", bio:"", abordagem:"", credenciais:"", cor:"#00c6b8", logo:"", foto:"", horario:"", telefone:"", email:"", instagram:"", facebook:"", site_slug:cfg.site_slug, servicos:[], testemunhos:[], mostrar_marcacao:true });
  };

  const upImg = (e, campo) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 1.5*1024*1024) { alert("Imagem muito grande (máx 1.5MB)."); return; }
    const r = new FileReader();
    r.onload = () => setCfg(c => ({ ...c, [campo]: r.result }));
    r.readAsDataURL(f);
  };

  const addServico = () => setCfg(c => ({ ...c, servicos:[...c.servicos, { nome:"", desc:"", duracao:"60 min", preco:"" }] }));
  const updServico = (i, k, v) => setCfg(c => { const s=[...c.servicos]; s[i]={...s[i],[k]:v}; return {...c,servicos:s}; });
  const delServico = (i) => setCfg(c => ({ ...c, servicos:c.servicos.filter((_,x)=>x!==i) }));

  const addTest = () => setCfg(c => ({ ...c, testemunhos:[...c.testemunhos, { nome:"", texto:"" }] }));
  const updTest = (i, k, v) => setCfg(c => { const t=[...c.testemunhos]; t[i]={...t[i],[k]:v}; return {...c,testemunhos:t}; });
  const delTest = (i) => setCfg(c => ({ ...c, testemunhos:c.testemunhos.filter((_,x)=>x!==i) }));

  // Funções genéricas para listas de venda (formações, produtos, atividades)
  const addItem = (lista, modelo) => setCfg(c => ({ ...c, [lista]:[...(c[lista]||[]), modelo] }));
  const updItem = (lista, i, k, v) => setCfg(c => { const a=[...(c[lista]||[])]; a[i]={...a[i],[k]:v}; return {...c,[lista]:a}; });
  const delItem = (lista, i) => setCfg(c => ({ ...c, [lista]:(c[lista]||[]).filter((_,x)=>x!==i) }));
  // Upload de imagem dentro de um item de lista (equipa, testemunhos)
  const upItemImg = (lista, i, e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 1.5*1024*1024) { alert("Imagem muito grande (máx 1.5MB)."); return; }
    const r = new FileReader();
    r.onload = () => updItem(lista, i, "foto", r.result);
    r.readAsDataURL(f);
  };

  const linkPublico = cfg.site_slug ? `${window.location.origin}/?site=${cfg.site_slug}` : null;

  return (
    <div className="fade">
      {ok && <div className="al al-s">{ok}</div>}
      {!temConfig && !editando && (
        <div className="al al-w" style={{marginBottom:10}}>👋 Este é um exemplo. Toca em "✏️ Editar" para o tornar teu — muda textos, fotos, serviços, ou apaga tudo e cria do zero.</div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        <button className={`chip ${editando?"on":""}`} onClick={() => setEditando(true)}>✏️ Editar</button>
        <button className={`chip ${!editando?"on":""}`} onClick={() => setEditando(false)}>👁️ Pré-visualizar</button>
        {linkPublico && <button className="chip" style={{background:"#5a9e9415",border:"1px solid #5a9e9440",color:"#5a9e94"}} onClick={()=>{navigator.clipboard?.writeText(linkPublico);setOk("🔗 Link copiado!");setTimeout(()=>setOk(""),2000);}}>🔗 {cfg.nomePratica||"Mini-site"}</button>}
        {editando && <button className="chip" style={{borderColor:"#5c1a1a",color:"#f87171"}} onClick={limparTudo}>🗑️ Limpar tudo</button>}
      </div>

      {/* Dashboard de stats */}
      {!editando && temConfig && (
        <div className="card" style={{background:"linear-gradient(135deg,#5a9e9418,#5a9e940a)",borderLeft:`4px solid #5a9e94`,marginBottom:16}}>
          <div className="card-t">📊 Desempenho do Mini-Site</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <div style={{background:"#fff",borderRadius:10,padding:12,textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              <div style={{fontSize:".7rem",color:"#7a8a88"}}>Visitantes (7 dias)</div>
              <div style={{fontSize:"1.8rem",fontWeight:700,color:"#5a9e94",marginTop:4}}>{visitantes ?? "—"}</div>
              <div style={{fontSize:".65rem",color:"#9aaaa8",marginTop:2}}>{visitantes===null?"a carregar...":"visitantes"}</div>
            </div>
            <div style={{background:"#fff",borderRadius:10,padding:12,textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              <div style={{fontSize:".7rem",color:"#7a8a88"}}>Inscrições pendentes</div>
              <div style={{fontSize:"1.8rem",fontWeight:700,color:"#5a9e94",marginTop:4}}>{inscricoesPendentes ?? "—"}</div>
              <div style={{fontSize:".65rem",color:"#9aaaa8",marginTop:2}}>{inscricoesPendentes===null?"a carregar...":"pendentes"}</div>
            </div>
          </div>
          <button className="btn btn-s btn-sm" style={{width:"100%",marginTop:10}} onClick={()=>setVerStats(true)}>📈 Ver detalhes completos</button>
        </div>
      )}

      {editando ? (
        <div>
          <div style={{background:"#0d1422",border:"1px solid #14233a",borderRadius:10,padding:"11px 14px",marginBottom:10,fontSize:".72rem",color:"#7a98b8",lineHeight:1.5}}>
            Toca em cada secção para a abrir e editar. Quando terminares, carrega em <strong style={{color:"#00c6b8"}}>Guardar</strong> no fim.
          </div>
          <Secao id="marca" icon="🎨" titulo="Marca e Identidade" resumo={cfg.nomePratica || "Logo, foto, cor e nome"} aberta={secaoAberta==="marca"} onToggle={toggleSecao}>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{textAlign:"center"}}>
                <div onClick={()=>logoRef.current?.click()} style={{width:60,height:60,borderRadius:10,background:"#050810",border:"1px dashed #1a3a5c",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
                  {cfg.logo ? <img src={cfg.logo} style={{width:"100%",height:"100%",objectFit:"contain"}} /> : <span style={{fontSize:".55rem",color:"#3d5a7a"}}>+ Logo</span>}
                </div>
                <input ref={logoRef} type="file" accept="image/*" onChange={e=>upImg(e,"logo")} style={{display:"none"}} />
              </div>
              <div style={{textAlign:"center"}}>
                <div onClick={()=>fotoRef.current?.click()} style={{width:60,height:60,borderRadius:"50%",background:"#050810",border:"1px dashed #1a3a5c",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
                  {cfg.foto ? <img src={cfg.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:".55rem",color:"#3d5a7a"}}>+ Foto</span>}
                </div>
                <input ref={fotoRef} type="file" accept="image/*" onChange={e=>upImg(e,"foto")} style={{display:"none"}} />
              </div>
              <div style={{flex:1}}>
                <span className="lbl">Cor da marca</span>
                <input type="color" value={cfg.cor} onChange={e=>setCfg({...cfg,cor:e.target.value})} style={{width:"100%",height:36,borderRadius:6,border:"1px solid #0d1828",background:"#050810",cursor:"pointer"}} />
              </div>
            </div>
            <span className="lbl">Nome da prática / profissional</span>
            <input className="inp" value={cfg.nomePratica} onChange={e=>setCfg({...cfg,nomePratica:e.target.value})} placeholder="Ex: Clínica Bem-Estar · Dra. Ana Silva" />
            <span className="lbl">Subtítulo / especialidade</span>
            <input className="inp" value={cfg.subtitulo} onChange={e=>setCfg({...cfg,subtitulo:e.target.value})} placeholder="Ex: Terapia Holística e Bem-Estar Emocional" />
          </Secao>

          <Secao id="sobre" icon="📖" titulo="Apresentação" resumo={cfg.bio ? "Preenchida" : "Bio, abordagem e credenciais"} aberta={secaoAberta==="sobre"} onToggle={toggleSecao}>
            <span className="lbl">Bio / Sobre mim</span>
            <textarea className="inp" rows={3} value={cfg.bio} onChange={e=>setCfg({...cfg,bio:e.target.value})} placeholder="Apresente-se aos seus pacientes..." />
            <span className="lbl">Abordagem terapêutica</span>
            <textarea className="inp" rows={2} value={cfg.abordagem} onChange={e=>setCfg({...cfg,abordagem:e.target.value})} placeholder="Como trabalha, a sua filosofia..." />
            <span className="lbl">Credenciais / Formação</span>
            <input className="inp" value={cfg.credenciais} onChange={e=>setCfg({...cfg,credenciais:e.target.value})} placeholder="Ex: Psicóloga · Cédula 12345" />
          </Secao>

          <Secao id="oferta" icon="🎁" titulo="Oferta em Destaque" resumo={cfg.oferta_ativa ? `Ativa: ${cfg.oferta_titulo||"sem título"}` : "Desativada"} aberta={secaoAberta==="oferta"} onToggle={toggleSecao}>
            <label style={{display:"flex",alignItems:"center",gap:8,fontSize:".8rem",color:"#7a98b8",marginBottom:10,cursor:"pointer"}}>
              <input type="checkbox" checked={!!cfg.oferta_ativa} onChange={e=>setCfg({...cfg,oferta_ativa:e.target.checked})} />
              Mostrar oferta no topo do mini-site
            </label>
            <span className="lbl">Título da oferta</span>
            <input className="inp" value={cfg.oferta_titulo||""} onChange={e=>setCfg({...cfg,oferta_titulo:e.target.value})} placeholder="Ex: 1ª Consulta de Avaliação GRÁTIS" />
            <span className="lbl">Descrição (opcional)</span>
            <input className="inp" value={cfg.oferta_texto||""} onChange={e=>setCfg({...cfg,oferta_texto:e.target.value})} placeholder="Ex: Avaliação inicial · online · sem compromisso" />
            <span className="lbl">Texto do botão</span>
            <input className="inp" value={cfg.oferta_botao||""} onChange={e=>setCfg({...cfg,oferta_botao:e.target.value})} placeholder="Ex: Quero a minha consulta grátis" />
            <span className="lbl">Termina em (opcional — cria urgência com contagem)</span>
            <input className="inp" type="datetime-local" value={cfg.oferta_fim||""} onChange={e=>setCfg({...cfg,oferta_fim:e.target.value})} />
            <div style={{fontSize:".68rem",color:"#5a7a9a",marginTop:6,lineHeight:1.5}}>💡 O botão leva a pessoa diretamente ao formulário de contacto. Deixa os dados e cai na tua lista de leads.</div>
          </Secao>

          <Secao id="servicos" icon="💼" titulo="Serviços" resumo={`${cfg.servicos.length} serviço(s)`} aberta={secaoAberta==="servicos"} onToggle={toggleSecao}>
            {cfg.servicos.map((s,i)=>(
              <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:7}}>
                <div style={{display:"flex",gap:6,marginBottom:5}}>
                  <input className="inp" value={s.icone||""} onChange={e=>updServico(i,"icone",e.target.value)} placeholder="🌿" style={{width:54,textAlign:"center",fontSize:"1.1rem"}} maxLength={2} />
                  <input className="inp" value={s.nome} onChange={e=>updServico(i,"nome",e.target.value)} placeholder="Nome do serviço" style={{flex:1}} />
                  <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delServico(i)}>✕</button>
                </div>
                <input className="inp mb8" value={s.desc} onChange={e=>updServico(i,"desc",e.target.value)} placeholder="Descrição breve" />
                <div className="g2">
                  <input className="inp" value={s.duracao} onChange={e=>updServico(i,"duracao",e.target.value)} placeholder="60 min" />
                  <input className="inp" value={s.preco} onChange={e=>updServico(i,"preco",e.target.value)} placeholder="€50 (individual)" />
                </div>
                <span className="lbl" style={{marginTop:7}}>Benefícios (um por linha)</span>
                <textarea className="inp" rows={2} value={s.beneficios||""} onChange={e=>updServico(i,"beneficios",e.target.value)} placeholder={"Ex: Reduz o stress\nMelhora o sono\nEquilíbrio energético"} />
                <span className="lbl" style={{marginTop:7}}>Opções de preço (packs / sessões)</span>
                {(s.precos||[]).map((p,j)=>(
                  <div key={j} style={{display:"flex",gap:6,marginBottom:5}}>
                    <input className="inp" value={p.label} onChange={e=>{const arr=[...(s.precos||[])];arr[j]={...arr[j],label:e.target.value};updServico(i,"precos",arr);}} placeholder="Ex: Pack 5 sessões" style={{flex:1}} />
                    <input className="inp" value={p.valor} onChange={e=>{const arr=[...(s.precos||[])];arr[j]={...arr[j],valor:e.target.value};updServico(i,"precos",arr);}} placeholder="€200" style={{width:90}} />
                    <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>updServico(i,"precos",(s.precos||[]).filter((_,x)=>x!==j))}>✕</button>
                  </div>
                ))}
                <button className="btn btn-s btn-sm" style={{width:"100%",fontSize:".7rem"}} onClick={()=>updServico(i,"precos",[...(s.precos||[]),{label:"",valor:""}])}>+ Adicionar opção de preço</button>
              </div>
            ))}
            <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={addServico}>+ Adicionar serviço</button>
          </Secao>

          <Secao id="testemunhos" icon="⭐" titulo="Testemunhos" resumo={`${cfg.testemunhos.length} testemunho(s)`} aberta={secaoAberta==="testemunhos"} onToggle={toggleSecao}>
            {cfg.testemunhos.map((t,i)=>(
              <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:7}}>
                <div style={{display:"flex",gap:6,marginBottom:5}}>
                  <input className="inp" value={t.nome} onChange={e=>updTest(i,"nome",e.target.value)} placeholder="Nome (ex: Maria S.)" style={{flex:1}} />
                  <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delTest(i)}>✕</button>
                </div>
                <textarea className="inp" rows={2} value={t.texto} onChange={e=>updTest(i,"texto",e.target.value)} placeholder="O testemunho..." />
              </div>
            ))}
            <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={addTest}>+ Adicionar testemunho</button>
          </Secao>

          {/* Secções de venda */}
          {[
            ["formacoes","🎓","Formações / Workshops",{ nome:"", desc:"", data:"", preco:"", vagas:"" },true],
            ["produtos","🛍️","Produtos à Venda",{ nome:"", desc:"", preco:"" },false],
            ["atividades","📝","Atividades / Inscrições",{ nome:"", desc:"", data:"", preco:"" },true],
          ].map(([lista,icon,titulo,modelo,temData])=>(
            <Secao key={lista} id={lista} icon={icon} titulo={titulo} resumo={`${(cfg[lista]||[]).length} item(s)`} aberta={secaoAberta===lista} onToggle={toggleSecao}>
              {(cfg[lista]||[]).map((it,i)=>(
                <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:7}}>
                  <div style={{display:"flex",gap:6,marginBottom:5}}>
                    <input className="inp" value={it.icone||""} onChange={e=>updItem(lista,i,"icone",e.target.value)} placeholder={icon} style={{width:54,textAlign:"center",fontSize:"1.1rem"}} maxLength={2} />
                    <input className="inp" value={it.nome} onChange={e=>updItem(lista,i,"nome",e.target.value)} placeholder="Nome" style={{flex:1}} />
                    <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delItem(lista,i)}>✕</button>
                  </div>
                  <input className="inp mb8" value={it.desc} onChange={e=>updItem(lista,i,"desc",e.target.value)} placeholder="Descrição" />
                  <div className="g2">
                    <input className="inp" value={it.preco} onChange={e=>updItem(lista,i,"preco",e.target.value)} placeholder="€ preço normal" />
                    {temData
                      ? <input className="inp" value={it.data||""} onChange={e=>updItem(lista,i,"data",e.target.value)} placeholder="Data/Horário" />
                      : <div />}
                  </div>
                  <div className="g2" style={{marginTop:6}}>
                    <div><span className="lbl" style={{color:"#e55"}}>🔥 Preço promoção</span><input className="inp" value={it.desconto||""} onChange={e=>updItem(lista,i,"desconto",e.target.value)} placeholder="€ desconto (opcional)" /></div>
                    <div><span className="lbl" style={{color:"#e55"}}>Termina em</span><input className="inp" type="datetime-local" value={it.desconto_fim||""} onChange={e=>updItem(lista,i,"desconto_fim",e.target.value)} /></div>
                  </div>
                  {lista==="formacoes" && <input className="inp" style={{marginTop:6}} value={it.vagas||""} onChange={e=>updItem(lista,i,"vagas",e.target.value)} placeholder="Vagas (ex: 12 vagas)" />}
                  <span className="lbl" style={{marginTop:7}}>Benefícios (um por linha)</span>
                  <textarea className="inp" rows={2} value={it.beneficios||""} onChange={e=>updItem(lista,i,"beneficios",e.target.value)} placeholder={"Ex: Certificado incluído\nMaterial de apoio"} />
                  <span className="lbl" style={{marginTop:7}}>Opções de preço (packs / módulos)</span>
                  {(it.precos||[]).map((p,j)=>(
                    <div key={j} style={{display:"flex",gap:6,marginBottom:5}}>
                      <input className="inp" value={p.label} onChange={e=>{const arr=[...(it.precos||[])];arr[j]={...arr[j],label:e.target.value};updItem(lista,i,"precos",arr);}} placeholder="Ex: Pack completo" style={{flex:1}} />
                      <input className="inp" value={p.valor} onChange={e=>{const arr=[...(it.precos||[])];arr[j]={...arr[j],valor:e.target.value};updItem(lista,i,"precos",arr);}} placeholder="€200" style={{width:90}} />
                      <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>updItem(lista,i,"precos",(it.precos||[]).filter((_,x)=>x!==j))}>✕</button>
                    </div>
                  ))}
                  <button className="btn btn-s btn-sm" style={{width:"100%",fontSize:".7rem"}} onClick={()=>updItem(lista,i,"precos",[...(it.precos||[]),{label:"",valor:""}])}>+ Adicionar opção de preço</button>
                </div>
              ))}
              <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={()=>addItem(lista,modelo)}>+ Adicionar</button>
            </Secao>
          ))}

          {/* Equipa / Staff */}
          <Secao id="equipa" icon="👥" titulo="Equipa / Staff" resumo={`${(cfg.equipa||[]).length} profissional(is)`} aberta={secaoAberta==="equipa"} onToggle={toggleSecao}>
            {(cfg.equipa||[]).map((m,i)=>(
              <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:7}}>
                <div style={{display:"flex",gap:8,marginBottom:6}}>
                  <div onClick={()=>document.getElementById(`eqfoto${i}`)?.click()} style={{width:46,height:46,borderRadius:"50%",background:"#0a0e18",border:"1px dashed #1a3a5c",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",flexShrink:0}}>
                    {m.foto ? <img src={m.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:".5rem",color:"#3d5a7a"}}>+foto</span>}
                  </div>
                  <input id={`eqfoto${i}`} type="file" accept="image/*" onChange={e=>upItemImg("equipa",i,e)} style={{display:"none"}} />
                  <input className="inp" value={m.nome} onChange={e=>updItem("equipa",i,"nome",e.target.value)} placeholder="Nome" style={{flex:1}} />
                  <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delItem("equipa",i)}>✕</button>
                </div>
                <input className="inp mb8" value={m.funcao} onChange={e=>updItem("equipa",i,"funcao",e.target.value)} placeholder="Função (ex: Psicóloga)" />
                <input className="inp mb8" value={m.bio} onChange={e=>updItem("equipa",i,"bio",e.target.value)} placeholder="Bio breve" />
                <input className="inp" value={m.whatsapp||""} onChange={e=>updItem("equipa",i,"whatsapp",e.target.value)} placeholder="WhatsApp (ex: 351912345678)" />
              </div>
            ))}
            <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={()=>addItem("equipa",{nome:"",funcao:"",bio:"",foto:""})}>+ Adicionar profissional</button>
          </Secao>

          {/* Redes sociais */}
          <Secao id="redes" icon="🔗" titulo="Redes Sociais" resumo={`${(cfg.redes||[]).length} rede(s)`} aberta={secaoAberta==="redes"} onToggle={toggleSecao}>
            {(cfg.redes||[]).map((r,i)=>(
              <div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
                <input className="inp" value={r.rede} onChange={e=>updItem("redes",i,"rede",e.target.value)} placeholder="Rede (Instagram...)" style={{width:"35%"}} />
                <input className="inp" value={r.link} onChange={e=>updItem("redes",i,"link",e.target.value)} placeholder="https://..." style={{flex:1}} />
                <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delItem("redes",i)}>✕</button>
              </div>
            ))}
            <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={()=>addItem("redes",{rede:"",link:""})}>+ Adicionar rede</button>
          </Secao>

          {/* Localização */}
          <Secao id="local" icon="📍" titulo="Localização / Espaço Físico" resumo={cfg.morada ? cfg.morada : "Morada e mapa"} aberta={secaoAberta==="local"} onToggle={toggleSecao}>
            <span className="lbl">Morada</span>
            <input className="inp" value={cfg.morada||""} onChange={e=>setCfg({...cfg,morada:e.target.value})} placeholder="Rua, número, cidade" />
            <span className="lbl">Link do mapa (Google Maps — opcional)</span>
            <input className="inp" value={cfg.mapa_link||""} onChange={e=>setCfg({...cfg,mapa_link:e.target.value})} placeholder="Cola o link do Google Maps" />
          </Secao>

          <Secao id="contactos" icon="📞" titulo="Contactos e Horário" resumo={cfg.telefone ? cfg.telefone : "Telefone, email e horário"} aberta={secaoAberta==="contactos"} onToggle={toggleSecao}>
            <div className="g2">
              <div><span className="lbl">Telefone / WhatsApp</span><input className="inp" value={cfg.telefone} onChange={e=>setCfg({...cfg,telefone:e.target.value})} /></div>
              <div><span className="lbl">Email</span><input className="inp" value={cfg.email} onChange={e=>setCfg({...cfg,email:e.target.value})} /></div>
            </div>
            <span className="lbl">Horário</span>
            <input className="inp" value={cfg.horario} onChange={e=>setCfg({...cfg,horario:e.target.value})} />
          </Secao>

          <button className="btn btn-p" style={{width:"100%",padding:"14px 0",fontSize:".9rem",position:"sticky",bottom:10,boxShadow:"0 4px 18px rgba(0,0,0,.4)",marginTop:8}} onClick={salvar}>💾 Guardar Mini-site</button>
        </div>
      ) : (
        <SitePreview cfg={cfg} editavel={true} onEditar={(sec)=>{ setSecaoAberta(sec); setEditando(true); if(typeof window!=="undefined") window.scrollTo({top:0,behavior:"smooth"}); }} />
      )}

      {/* Modal de stats detalhadas */}
      {verStats && (
        <div className="modal" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div className="card" style={{maxWidth:500,maxHeight:"80vh",overflow:"auto",margin:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div className="card-t">📊 Estatísticas Completas</div>
              <button onClick={()=>setVerStats(false)} style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#5a7a9a"}}>✕</button>
            </div>
            
            <div style={{marginBottom:16}}>
              <div style={{fontSize:".8rem",fontWeight:700,color:"#2a3a4a",marginBottom:8}}>🔗 Seu Mini-Site</div>
              <div style={{background:"#f0f5f5",borderRadius:10,padding:12,fontSize:".75rem",wordBreak:"break-all",color:"#3a5a7a"}}>{linkPublico}</div>
              <button className="btn btn-s" style={{width:"100%",marginTop:8}} onClick={()=>{navigator.clipboard?.writeText(linkPublico);setOk("Link copiado!");setTimeout(()=>setOk(""),2000);}}>📋 Copiar link</button>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:".8rem",fontWeight:700,color:"#2a3a4a",marginBottom:8}}>👥 Visitantes (últimos 7 dias)</div>
              <div style={{background:"#5a9e9415",borderRadius:10,padding:16,textAlign:"center"}}>
                <div style={{fontSize:"2.2rem",fontWeight:700,color:"#5a9e94"}}>{visitantes || 0}</div>
                <div style={{fontSize:".75rem",color:"#7a8a88",marginTop:4}}>pessoas visitaram seu mini-site</div>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:".8rem",fontWeight:700,color:"#2a3a4a",marginBottom:8}}>📝 Contactos recebidos ({leads.length})</div>
              {leads.length === 0 ? (
                <div style={{background:"#f0f5f5",borderRadius:10,padding:16,textAlign:"center",fontSize:".78rem",color:"#7a8a88"}}>
                  Ainda sem contactos. Partilha o teu mini-site para começar a receber pedidos.
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {leads.map(l => {
                    const cor = l.status==="convertido"?"#2e9e5b":l.status==="contactado"?"#d99a2b":l.status==="cancelado"?"#a8a8a8":"#5a9e94";
                    const etiqueta = l.status==="convertido"?"✅ Paciente":l.status==="contactado"?"📞 Contactado":l.status==="cancelado"?"✖ Descartado":"🆕 Novo";
                    const wa = waNumero(l.cliente_telefone);
                    const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá "+(l.cliente_nome||"")+"! Recebi o teu pedido pelo site e estou a entrar em contacto.")}` : null;
                    return (
                      <div key={l.id} style={{border:"1px solid #e8eeee",borderLeft:`4px solid ${cor}`,borderRadius:10,padding:"11px 12px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                          <strong style={{fontSize:".86rem",color:"#2a3a4a"}}>{l.cliente_nome}</strong>
                          <span style={{fontSize:".62rem",fontWeight:700,color:cor,whiteSpace:"nowrap"}}>{etiqueta}</span>
                        </div>
                        <div style={{fontSize:".74rem",color:"#5a7a7a",marginTop:3}}>{l.cliente_telefone || l.cliente_email || "—"}</div>
                        {l.notas && <div style={{fontSize:".74rem",color:"#7a8a88",marginTop:4,fontStyle:"italic"}}>"{l.notas}"</div>}
                        <div style={{fontSize:".64rem",color:"#9aaaa8",marginTop:4}}>{l.data_inscricao || (l.created_at||"").split("T")[0]}</div>
                        <div style={{display:"flex",gap:6,marginTop:9,flexWrap:"wrap"}}>
                          {waLink && <a href={waLink} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",textDecoration:"none",borderRadius:8,padding:"6px 11px",fontSize:".7rem",fontWeight:600}}>💬 WhatsApp</a>}
                          {l.cliente_email && <a href={`mailto:${l.cliente_email}`} style={{background:"#5a7a9a",color:"#fff",textDecoration:"none",borderRadius:8,padding:"6px 11px",fontSize:".7rem",fontWeight:600}}>✉️ Email</a>}
                          {l.status!=="contactado" && l.status!=="convertido" && <button onClick={()=>atualizarLead(l.id,"contactado")} style={{background:"#fff",border:"1px solid #d99a2b",color:"#d99a2b",borderRadius:8,padding:"6px 11px",fontSize:".7rem",fontWeight:600,cursor:"pointer"}}>📞 Contactado</button>}
                          {l.status!=="convertido" && <button onClick={()=>atualizarLead(l.id,"convertido")} style={{background:"#fff",border:"1px solid #2e9e5b",color:"#2e9e5b",borderRadius:8,padding:"6px 11px",fontSize:".7rem",fontWeight:600,cursor:"pointer"}}>✅ Virou paciente</button>}
                          {l.status!=="cancelado" && <button onClick={()=>atualizarLead(l.id,"cancelado")} style={{background:"#fff",border:"1px solid #ccc",color:"#999",borderRadius:8,padding:"6px 11px",fontSize:".7rem",cursor:"pointer"}}>✖</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{padding:12,background:"#f7fafa",borderRadius:10,fontSize:".75rem",color:"#7a8a88"}}>
              <strong>💡 Dica:</strong> Partilha o teu mini-site nas redes sociais, email e WhatsApp para aumentar visitantes e inscrições!
            </div>

            <button className="btn btn-p" style={{width:"100%",marginTop:16}} onClick={()=>setVerStats(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Pré-visualização e página pública partilham o mesmo render
function FlashTimer({ fim }) {
  const [resto, setResto] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(fim) - new Date();
      if (diff <= 0) { setResto("EXPIROU"); return; }
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
      setResto(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [fim]);
  return <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"1.1rem",letterSpacing:2}}>{resto}</span>;
}

const REDE_ICONES = { Instagram:"📸", Facebook:"👥", TikTok:"🎵", YouTube:"▶️", LinkedIn:"💼", Twitter:"🐦", Pinterest:"📌", Spotify:"🎵", Website:"🌐" };

function SitePreview({ cfg, editavel, onEditar }) {
  const cor = cfg.cor || "#5a9e94";
  const corLight = cor + "18";
  const W = { fontFamily:"system-ui,sans-serif", background:"#f7fafa", color:"#1a2e2c" };
  const [aba, setAba] = useState(null);
  // Botão-lápis (só aparece no editor do subscritor; nunca na página pública)
  const Lapis = ({ sec, style }) => editavel ? (
    <button onClick={(e)=>{ e.stopPropagation(); onEditar && onEditar(sec); }} title="Editar esta secção"
      style={{position:"absolute",zIndex:30,top:8,right:8,background:"#fff",border:`1.5px solid ${cor}`,color:cor,borderRadius:"50%",width:30,height:30,fontSize:".78rem",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:0,...style}}>✏️</button>
  ) : null;
  const [membroAberto, setMembroAberto] = useState(null);
  const [subItem, setSubItem] = useState(null);
  useEffect(() => { setSubItem(null); }, [aba]);
  const topRef = useRef(null);

  const SECS = [
    cfg.servicos?.length && ["servicos","🌿","Serviços"],
    cfg.formacoes?.length && ["formacoes","🎓","Formações"],
    cfg.atividades?.length && ["atividades","📝","Atividades"],
    cfg.produtos?.length && ["produtos","🛍️","Produtos"],
    cfg.testemunhos?.length && ["testemunhos","💬","Testemunhos"],
    (cfg.bio||cfg.abordagem) && ["sobre","✦","Sobre"],
    (cfg.morada||cfg.mapa_link) && ["local","📍","Localização"],
  ].filter(Boolean);

  const agora = new Date();
  const flashItems = [];
  ["servicos","formacoes","atividades","produtos"].forEach(lista => {
    (cfg[lista]||[]).forEach(it => {
      if (it.desconto && it.desconto_fim && new Date(it.desconto_fim) > agora) flashItems.push({...it,lista});
    });
  });

  const ItemCard = ({it, lista}) => {
    const num = (cfg.telefone||"").replace(/[^0-9]/g,"");
    const acao = lista==="produtos"?"comprar":"inscrever-me em";
    const msg = `Olá! Tenho interesse em ${acao} "${it.nome}"${it.desconto?` (promoção: ${it.desconto})`:it.preco?` (${it.preco})`:""}.`;
    const temFlash = it.desconto && it.desconto_fim && new Date(it.desconto_fim) > agora;
    return (
      <div style={{background:"#fff",border:temFlash?`2px solid ${cor}`:"1px solid #e8f0ef",borderRadius:14,padding:16,marginBottom:10,boxShadow:temFlash?`0 2px 16px ${cor}30`:"0 1px 4px rgba(0,0,0,.04)"}}>
        {temFlash && <div style={{display:"flex",alignItems:"center",gap:8,background:`linear-gradient(90deg,${cor},${cor}cc)`,color:"#fff",padding:"6px 12px",borderRadius:8,marginBottom:10,fontSize:".72rem",fontWeight:600}}>
          🔥 PROMOÇÃO · <FlashTimer fim={it.desconto_fim} />
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
          <span style={{fontSize:"1rem",fontWeight:700,color:"#1a2e2c",lineHeight:1.3,flex:1}}>{it.nome}</span>
          <div style={{textAlign:"right",flexShrink:0}}>
            {temFlash && <div style={{fontSize:".72rem",color:"#9aaaa8",textDecoration:"line-through"}}>{it.preco}</div>}
            {(it.preco||it.desconto) && <span style={{fontSize:"1rem",color:temFlash?"#e55":cor,fontWeight:700}}>{temFlash?it.desconto:it.preco}</span>}
          </div>
        </div>
        {it.desc && <div style={{fontSize:".86rem",color:"#5a6e6c",lineHeight:1.6,marginBottom:8}}>{it.desc}</div>}
        {it.beneficios && (
          <div style={{marginBottom:9}}>
            {it.beneficios.split("\n").filter(b=>b.trim()).map((b,k)=>(
              <div key={k} style={{fontSize:".82rem",color:"#4a5e5c",display:"flex",gap:7,marginBottom:3,lineHeight:1.5}}><span style={{color:cor,fontWeight:700}}>✓</span><span>{b.trim()}</span></div>
            ))}
          </div>
        )}
        {(it.precos||[]).filter(p=>p.label||p.valor).length>0 && (
          <div style={{background:"#f7fafa",borderRadius:10,padding:"9px 13px",marginBottom:10,border:"1px solid #eef3f3"}}>
            {(it.precos||[]).filter(p=>p.label||p.valor).map((p,k)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:".82rem",color:"#3a4b4a",padding:"3px 0"}}>
                <span>{p.label||"Opção"}</span><strong style={{color:cor}}>{p.valor}</strong>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:num?10:0}}>
          {it.data && <span style={{fontSize:".72rem",color:"#8a9a98",background:"#f0f5f5",padding:"3px 9px",borderRadius:8}}>📅 {it.data}</span>}
          {it.vagas && <span style={{fontSize:".72rem",color:"#8a9a98",background:"#f0f5f5",padding:"3px 9px",borderRadius:8}}>👥 {it.vagas}</span>}
          {it.duracao && <span style={{fontSize:".72rem",color:"#8a9a98",background:"#f0f5f5",padding:"3px 9px",borderRadius:8}}>⏱ {it.duracao}</span>}
        </div>
        {num && <a href={`https://wa.me/${num}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:30,background:temFlash?"#e55":cor,color:"#fff",fontSize:".8rem",fontWeight:600,textDecoration:"none"}}>
          {lista==="produtos"?"🛒 Comprar":"✋ Inscrever-me"}
        </a>}
      </div>
    );
  };

  // Renderiza o conteúdo de uma categoria (para a página dedicada)
  const conteudoCategoria = (id) => {
    if (id==="sobre") return (
      <div>
        {cfg.bio && <div style={{fontSize:".95rem",color:"#2a3b3a",lineHeight:1.9,marginBottom:cfg.abordagem?18:0}}>{cfg.bio}</div>}
        {cfg.abordagem && <div style={{padding:"16px 18px",background:`${cor}0d`,borderRadius:14,borderLeft:`4px solid ${cor}`}}>
          <div style={{fontSize:".66rem",color:cor,textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8}}>A Minha Abordagem</div>
          <div style={{fontSize:".9rem",color:"#3a4b4a",lineHeight:1.85,fontStyle:"italic"}}>{cfg.abordagem}</div>
        </div>}
      </div>
    );
    const ICONE_LISTA = { servicos:"🌿", formacoes:"🎓", atividades:"📝", produtos:"🛍️" };
    if (["servicos","formacoes","atividades","produtos"].includes(id)) {
      const itens = cfg[id] || [];
      if (itens.length === 0) return <div style={{textAlign:"center",color:"#9aaaa8",fontSize:".85rem",padding:"20px 0"}}>Ainda sem itens nesta categoria.</div>;
      // Detalhe de um item escolhido
      if (subItem !== null && itens[subItem]) {
        return (
          <div>
            <button onClick={()=>setSubItem(null)}
              style={{display:"inline-flex",alignItems:"center",gap:5,marginBottom:14,padding:"7px 14px",borderRadius:20,border:`1.5px solid ${cor}`,background:"#fff",color:cor,fontSize:".78rem",fontWeight:600,cursor:"pointer"}}>
              ← Ver todos
            </button>
            <ItemCard it={itens[subItem]} lista={id} />
          </div>
        );
      }
      // Grelha de ícones (uma subcategoria por item)
      return (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {itens.map((it,i)=>(
            <button key={i} onClick={()=>setSubItem(i)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"20px 10px",borderRadius:16,border:`1.5px solid ${cor}25`,background:`linear-gradient(160deg,${cor}10,#fff)`,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
              <span style={{fontSize:"2rem"}}>{it.icone||ICONE_LISTA[id]}</span>
              <span style={{fontSize:".84rem",color:"#2a3b3a",fontWeight:700,textAlign:"center",lineHeight:1.25}}>{it.nome||"(sem nome)"}</span>
              {(it.preco || (it.precos||[]).some(p=>p.valor)) && <span style={{fontSize:".7rem",color:cor,fontWeight:600}}>{it.preco || "ver opções"}</span>}
              <span style={{fontSize:".62rem",color:cor,fontWeight:600,marginTop:2}}>Ver →</span>
            </button>
          ))}
        </div>
      );
    }
    if (id==="testemunhos") return cfg.testemunhos.map((t,i)=>(
      <div key={i} style={{background:"#fff",borderRadius:14,padding:18,marginBottom:12,borderLeft:`4px solid ${cor}`,boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
        <div style={{fontSize:".95rem",color:"#2a3b3a",fontStyle:"italic",lineHeight:1.75}}>"{t.texto}"</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
          {t.foto && <img src={t.foto} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:`2px solid ${cor}30`}} />}
          {t.nome && <span style={{fontSize:".8rem",color:cor,fontWeight:600}}>— {t.nome}</span>}
        </div>
      </div>
    ));
    if (id==="equipa") return cfg.equipa.map((m,i)=>(
      <div key={i} style={{background:"#fff",borderRadius:14,padding:18,marginBottom:12,boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
        <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
          <div style={{width:76,height:76,borderRadius:"50%",background:corLight,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:`2px solid ${cor}50`,flexShrink:0}}>
            {m.foto ? <img src={m.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:"1.9rem"}}>{(m.nome||"?")[0]}</span>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"1.05rem",fontWeight:700,color:"#1a2e2c"}}>{m.nome}</div>
            <div style={{fontSize:".78rem",color:cor,fontWeight:600,marginBottom:8}}>{m.funcao}</div>
            {m.bio && <div style={{fontSize:".84rem",color:"#5a6e6c",lineHeight:1.7,marginBottom:10}}>{m.bio}</div>}
            {m.whatsapp && <a href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 16px",borderRadius:20,background:"#25D36618",border:"1px solid #25D36650",color:"#128c52",fontSize:".8rem",fontWeight:600,textDecoration:"none"}}>
              📱 Contactar
            </a>}
          </div>
        </div>
      </div>
    ));
    if (id==="local") return (
      <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
        {cfg.morada && <div style={{fontSize:".95rem",color:"#2a3b3a",marginBottom:cfg.mapa_link?14:0}}>{cfg.morada}</div>}
        {cfg.mapa_link && <a href={cfg.mapa_link} target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,border:`1.5px solid ${cor}`,color:cor,fontSize:".84rem",fontWeight:600,textDecoration:"none"}}>🗺️ Ver no mapa</a>}
      </div>
    );
    return null;
  };

  const tituloCategoria = (id) => {
    const s = SECS.find(x=>x[0]===id);
    return s ? `${s[1]} ${s[2]}` : "";
  };

  // ═══ PÁGINA DE CATEGORIA (abre como uma app) ═══
  if (aba) {
    return (
      <div style={{...W, borderRadius:16, overflow:"hidden", maxWidth:580, margin:"0 auto", boxShadow:"0 8px 40px rgba(0,0,0,.08)", border:"1px solid #e0ecec", minHeight:480}}>
        {/* Barra de topo com voltar */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",background:`linear-gradient(135deg,${cor},${cor}cc)`,position:"sticky",top:0,zIndex:10}}>
          <button onClick={()=>{ if(subItem!==null) setSubItem(null); else setAba(null); }}
            style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:20,border:"1.5px solid rgba(255,255,255,.5)",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:".8rem",fontWeight:600,cursor:"pointer"}}>
            ← Voltar
          </button>
          <span style={{fontSize:"1.05rem",fontWeight:700,color:"#fff"}}>{tituloCategoria(aba)}</span>
          {editavel && <button onClick={()=>onEditar && onEditar(aba)} title="Editar esta secção" style={{marginLeft:"auto",background:"rgba(255,255,255,.9)",border:"none",color:cor,borderRadius:"50%",width:30,height:30,fontSize:".78rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>}
        </div>
        {/* Conteúdo da categoria */}
        <div style={{padding:"18px 16px 30px",background:"#f7fafa",minHeight:400}}>
          {conteudoCategoria(aba)}
          <div style={{textAlign:"center",marginTop:20}}>
            <button onClick={()=>setAba(null)}
              style={{padding:"10px 24px",borderRadius:24,border:`1.5px solid ${cor}`,background:"#fff",color:cor,fontSize:".82rem",fontWeight:600,cursor:"pointer"}}>
              ← Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ HOME (ícones tipo app) ═══
  return (
    <div ref={topRef} style={{...W, borderRadius:16, overflow:"hidden", maxWidth:580, margin:"0 auto", boxShadow:"0 8px 40px rgba(0,0,0,.08)", border:"1px solid #e0ecec"}}>

      {editavel && (
        <div style={{background:cor,color:"#fff",padding:"10px 14px",textAlign:"center",fontSize:".76rem",fontWeight:600}}>
          ✏️ Modo edição visual — toca no lápis de cada secção para a editar
        </div>
      )}

      {/* HERO */}
      <div style={{position:"relative",padding:"36px 22px 28px", background:`linear-gradient(160deg,${cor}20,${cor}06 55%,#f7fafa)`, textAlign:"center"}}>
        <Lapis sec="marca" />
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          {cfg.logo && <img src={cfg.logo} style={{maxHeight:56,objectFit:"contain",borderRadius:8}} />}
          {cfg.foto && <img src={cfg.foto} style={{width:76,height:76,borderRadius:"50%",objectFit:"cover",border:`3px solid #fff`,boxShadow:`0 4px 14px ${cor}50`}} />}
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:"2rem",color:"#1a2e2c",lineHeight:1.15,marginBottom:6}}>{cfg.nomePratica||"O teu espaço terapêutico"}</div>
        {cfg.subtitulo && <div style={{fontSize:".9rem",color:cor,fontWeight:600,marginBottom:8}}>{cfg.subtitulo}</div>}
        {cfg.credenciais && <div style={{fontSize:".72rem",color:"#7a8a88",marginBottom:16}}>{cfg.credenciais}</div>}
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {cfg.telefone && <a href={`https://wa.me/${cfg.telefone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
            style={{padding:"11px 24px",borderRadius:30,background:cor,color:"#fff",fontSize:".85rem",fontWeight:700,textDecoration:"none",boxShadow:`0 4px 16px ${cor}50`}}>📱 Marcar Consulta</a>}
          {cfg.email && <a href={`mailto:${cfg.email}`}
            style={{padding:"11px 20px",borderRadius:30,border:`1.5px solid ${cor}`,color:cor,fontSize:".85rem",fontWeight:600,textDecoration:"none",background:"#fff"}}>✉️ Email</a>}
        </div>
      </div>

      {/* OFERTA EM DESTAQUE */}
      {editavel && !(cfg.oferta_ativa && cfg.oferta_titulo) && (
        <div style={{position:"relative",background:"#fbeaea",color:"#a33",padding:"12px 16px",textAlign:"center",fontSize:".76rem",fontWeight:600}}>
          🎁 Oferta em destaque (desativada) <Lapis sec="oferta" style={{top:7,right:8}} />
        </div>
      )}
      {cfg.oferta_ativa && cfg.oferta_titulo && (
        <div style={{position:"relative",background:"linear-gradient(135deg,#e23b3b,#ff7a45)",padding:"18px 20px",textAlign:"center",color:"#fff"}}>
          <Lapis sec="oferta" style={{background:"#fff",border:"none"}} />
          <div style={{fontSize:".62rem",letterSpacing:2,fontWeight:700,opacity:.92,marginBottom:5}}>🎁 OFERTA ESPECIAL</div>
          <div style={{fontSize:"1.25rem",fontWeight:800,lineHeight:1.2,marginBottom:cfg.oferta_texto?5:11}}>{cfg.oferta_titulo}</div>
          {cfg.oferta_texto && <div style={{fontSize:".82rem",opacity:.95,marginBottom:11}}>{cfg.oferta_texto}</div>}
          {cfg.oferta_fim && new Date(cfg.oferta_fim) > agora && <div style={{fontSize:".74rem",marginBottom:11,opacity:.95}}>⏳ Termina em: <FlashTimer fim={cfg.oferta_fim} /></div>}
          <button onClick={()=>{const el=typeof document!=="undefined"&&document.getElementById("vd-captacao");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});}}
            style={{background:"#fff",color:"#e23b3b",border:"none",borderRadius:30,padding:"11px 26px",fontSize:".88rem",fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,.18)"}}>
            {cfg.oferta_botao||"Quero aproveitar →"}
          </button>
        </div>
      )}

      {/* FLASH BANNER */}
      {flashItems.length > 0 && (
        <div style={{background:`linear-gradient(90deg,#1a2e2c,${cor})`,padding:"12px 18px",textAlign:"center",cursor:"pointer"}} onClick={()=>setAba(flashItems[0].lista)}>
          <div style={{fontSize:".68rem",color:"rgba(255,255,255,.7)",letterSpacing:1,marginBottom:3}}>🔥 PROMOÇÃO RELÂMPAGO — toca para ver</div>
          {flashItems.map((it,i)=><div key={i} style={{color:"#fff",fontSize:".82rem",fontWeight:600}}>{it.nome} · <span style={{textDecoration:"line-through",opacity:.6}}>{it.preco}</span> → <span style={{color:"#ffd54f"}}>{it.desconto}</span></div>)}
          <div style={{color:"rgba(255,255,255,.8)",fontSize:".72rem",marginTop:4}}>Termina em: <FlashTimer fim={flashItems[0].desconto_fim} /></div>
        </div>
      )}

      {/* GRELHA DE CATEGORIAS — abre página ao tocar */}
      <div style={{background:"#fff",padding:"20px 16px 24px"}}>
        <div style={{fontSize:".62rem",color:"#9aaaa8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:14,textAlign:"center"}}>Toca para explorar</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {SECS.map(([id,icon,lbl])=>(
            <button key={id} onClick={()=>setAba(id)}
              style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"22px 10px",borderRadius:18,border:`1.5px solid ${cor}25`,background:`linear-gradient(160deg,${cor}10,#fff)`,cursor:"pointer",transition:"all .15s",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
              <Lapis sec={id} style={{width:26,height:26,top:6,right:6,fontSize:".68rem"}} />
              <span style={{fontSize:"2.2rem"}}>{icon}</span>
              <span style={{fontSize:".82rem",color:"#2a3b3a",fontWeight:700}}>{lbl}</span>
              <span style={{fontSize:".64rem",color:cor,fontWeight:600}}>Ver →</span>
            </button>
          ))}
        </div>
      </div>

      {/* EQUIPA — na página inicial, toca para abrir */}
      {editavel && !(cfg.equipa?.filter(m=>m.nome).length>0) && (
        <div style={{position:"relative",background:"#f7fafa",borderTop:"1px solid #eef3f3",padding:"14px 16px",textAlign:"center",fontSize:".76rem",color:"#7a8a88",fontWeight:600}}>
          👥 Equipa (vazia) — adiciona os terapeutas <Lapis sec="equipa" style={{top:9,right:10}} />
        </div>
      )}
      {cfg.equipa?.filter(m=>m.nome).length>0 && (
        <div style={{position:"relative",background:"#f7fafa",padding:"24px 16px",borderTop:"1px solid #eef3f3"}}>
          <Lapis sec="equipa" />
          <div style={{fontSize:".62rem",color:"#9aaaa8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,textAlign:"center"}}>Conhece quem te acompanha</div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:"1.5rem",color:"#1a2e2c",textAlign:"center",marginBottom:16}}>A Nossa Equipa</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cfg.equipa.filter(m=>m.nome).map((m,i)=>{
              const aberto = membroAberto===i;
              const wa = waNumero(m.whatsapp);
              const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá "+m.nome+"! Vi o seu perfil no site e gostava de marcar uma consulta.")}` : null;
              return (
                <div key={i} style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.05)",border:aberto?`1.5px solid ${cor}50`:"1px solid #eef3f3"}}>
                  <button onClick={()=>setMembroAberto(aberto?null:i)} style={{width:"100%",display:"flex",alignItems:"center",gap:13,padding:"13px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:corLight,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:`2px solid ${cor}40`,flexShrink:0}}>
                      {m.foto ? <img src={m.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:"1.5rem",color:cor}}>{(m.nome||"?")[0]}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:".98rem",fontWeight:700,color:"#1a2e2c"}}>{m.nome}</div>
                      {m.funcao && <div style={{fontSize:".76rem",color:cor,fontWeight:600}}>{m.funcao}</div>}
                    </div>
                    <span style={{fontSize:".8rem",color:"#9aaaa8",transform:aberto?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}>▼</span>
                  </button>
                  {aberto && (
                    <div style={{padding:"0 14px 15px"}}>
                      {m.bio && <div style={{fontSize:".86rem",color:"#5a6e6c",lineHeight:1.7,marginBottom:12}}>{m.bio}</div>}
                      {waLink
                        ? <a href={waLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#25D366",color:"#fff",textDecoration:"none",borderRadius:12,padding:"12px 0",fontWeight:700,fontSize:".88rem"}}>💬 Marcar com {(m.nome||"").split(" ")[0]}</a>
                        : <div style={{fontSize:".76rem",color:"#9aaaa8",textAlign:"center",padding:"6px 0"}}>Usa o botão de contacto no topo da página.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rodapé — redes + horário */}
      <div style={{position:"relative",padding:"20px 18px 16px",borderTop:"1px solid #eef3f3",background:"#fff"}}>
        <Lapis sec="contactos" />
        {cfg.redes?.filter(r=>r.link).length>0 && <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
          {cfg.redes.filter(r=>r.link).map((r,i)=>(
            <a key={i} href={r.link} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:20,background:"#f0f5f5",color:"#3a4b4a",fontSize:".8rem",fontWeight:600,textDecoration:"none"}}>
              {REDE_ICONES[r.rede]||"🔗"} {r.rede}
            </a>
          ))}
        </div>}
        {cfg.horario && <div style={{textAlign:"center",fontSize:".78rem",color:"#8a9a98"}}>🕐 {cfg.horario}</div>}
      </div>

      <div style={{textAlign:"center",padding:"10px 0",fontSize:".62rem",color:"#c8d4d2",background:"#fff"}}>© {new Date().getFullYear()}</div>
    </div>
  );
}

// Formatar número PT para link wa.me
function waNumero(tel) {
  const d = (tel || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("351")) return d;
  if (d.length === 9) return "351" + d;
  return d;
}

// Bloco de captação de contacto no site público (formulário + WhatsApp)
function CaptacaoLead({ slug, terapeutaId, cfg }) {
  const [nome, setNome] = useState("");
  const [contacto, setContacto] = useState("");
  const [interesse, setInteresse] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const cor = cfg.cor || "#00c6b8";
  const wa = waNumero(cfg.telefone);
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vi o seu mini-site e gostava de saber mais.")}` : null;

  const enviar = async () => {
    if (!nome.trim() || !contacto.trim()) { alert("Por favor preenche o nome e um contacto."); return; }
    setAEnviar(true);
    const ehEmail = contacto.includes("@");
    try {
      await sb.from("inscricoes").insert({
        terapeuta_id: terapeutaId,
        site_slug: slug,
        categoria: "lead",
        item_nome: "Contacto pelo mini-site",
        cliente_nome: nome.trim(),
        cliente_email: ehEmail ? contacto.trim() : null,
        cliente_telefone: ehEmail ? null : contacto.trim(),
        status: "pendente",
        notas: interesse.trim() || null
      });
      setEnviado(true);
    } catch (e) {
      alert("Não foi possível enviar. Tenta novamente.");
    }
    setAEnviar(false);
  };

  return (
    <div id="vd-captacao" style={{maxWidth:440,margin:"18px auto 0",background:"#fff",borderRadius:18,padding:"22px 18px",boxShadow:"0 6px 24px rgba(0,0,0,.06)"}}>
      {enviado ? (
        <div style={{textAlign:"center",padding:"10px 0"}}>
          <div style={{fontSize:"2.4rem"}}>✅</div>
          <div style={{fontWeight:700,fontSize:"1.05rem",color:"#2a3a4a",marginTop:6}}>Pedido enviado!</div>
          <div style={{fontSize:".82rem",color:"#7a8a88",marginTop:6}}>Em breve entramos em contacto contigo. Obrigado!</div>
          {waLink && <a href={waLink} target="_blank" rel="noreferrer" style={{display:"block",marginTop:16,background:"#25D366",color:"#fff",textDecoration:"none",borderRadius:12,padding:"13px 0",fontWeight:600,fontSize:".9rem"}}>💬 Falar agora no WhatsApp</a>}
        </div>
      ) : (
        <>
          <div style={{fontWeight:700,fontSize:"1.1rem",color:"#2a3a4a",textAlign:"center"}}>Quero saber mais</div>
          <div style={{fontSize:".8rem",color:"#7a8a88",textAlign:"center",marginTop:4,marginBottom:16}}>Deixa o teu contacto e eu falo contigo.</div>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="O teu nome" style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8e8",borderRadius:11,padding:"12px 13px",fontSize:".9rem",marginBottom:9,outline:"none"}} />
          <input value={contacto} onChange={e=>setContacto(e.target.value)} placeholder="Telemóvel ou email" style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8e8",borderRadius:11,padding:"12px 13px",fontSize:".9rem",marginBottom:9,outline:"none"}} />
          <textarea value={interesse} onChange={e=>setInteresse(e.target.value)} placeholder="O que procuras? (opcional)" rows={2} style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8e8",borderRadius:11,padding:"12px 13px",fontSize:".9rem",marginBottom:12,outline:"none",resize:"vertical",fontFamily:"inherit"}} />
          <button onClick={enviar} disabled={aEnviar} style={{width:"100%",background:cor,color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontWeight:700,fontSize:".92rem",cursor:"pointer",opacity:aEnviar?.6:1}}>{aEnviar?"A enviar...":"Enviar pedido"}</button>
          {waLink && <a href={waLink} target="_blank" rel="noreferrer" style={{display:"block",marginTop:10,background:"#25D366",color:"#fff",textAlign:"center",textDecoration:"none",borderRadius:12,padding:"13px 0",fontWeight:600,fontSize:".9rem"}}>💬 Ou fala já no WhatsApp</a>}
        </>
      )}
    </div>
  );
}

// Página pública do mini-site (acedida pelo link ?site=slug)
function SitePublico({ slug }) {
  const [cfg, setCfg] = useState(null);
  const [terapeutaId, setTerapeutaId] = useState(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    const carregar = async () => {
      const { data } = await sb.rpc("minisite_por_slug", { p_slug: slug });
      const perfil = (data || [])[0];
      if (perfil?.config) {
        setCfg(perfil.config);
        setTerapeutaId(perfil.id);
        // Registar visita (silencioso)
        sb.from("visitas_minisite").insert({
          site_slug: slug,
          terapeuta_id: perfil.id,
          user_agent: navigator.userAgent,
          referrer: document.referrer
        });
      } else setErro(true);
    };
    carregar().catch(() => setErro(true));
  }, [slug]);
  if (erro) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f",color:"#5a7a9a",textAlign:"center",padding:24}}>Página não encontrada.</div>;
  if (!cfg) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f",color:"#3d5a7a"}}>A carregar...</div>;
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#eef3f2,#f8fafa)",padding:"20px 14px"}}>
      <SitePreview cfg={cfg} />
      <CaptacaoLead slug={slug} terapeutaId={terapeutaId} cfg={cfg} />
      <div style={{textAlign:"center",fontSize:".62rem",color:"#b8c4c2",marginTop:18,paddingBottom:20}}>© {new Date().getFullYear()}</div>
    </div>
  );
}
