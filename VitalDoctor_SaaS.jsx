import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PONTOS_POR_SISTEMA, PONTOS, getPonto, CENTROS_VITAIS, PONTOS_ENTRADA } from "./mapaCorporal.js";
import { ESCUDOS, QUESTIONARIO_ESCUDOS, ESCALA_QUESTIONARIO, PERGUNTAS_ABERTURA, CAMINHOS, PROTOCOLO } from "./baseConhecimento.js";
import { gerarProtocoloCura, AFIRMACOES_ESCUDO } from "./protocoloCura.js";
import { pontuarEscudos } from "./gerarRelatorio.js";
import { AVISO_SAUDE, jaAceitou, registarAceite } from "./responsabilidade.js";

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
  mapeamento: { id:"mapeamento", titulo:"Mapeamento Energético", descricao:"Mapeamento corporal completo nos 4 quadrantes. Acede à raiz profunda do sintoma através do corpo." },
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
    indicado: "Mente Subconsciente + Mapeamento Energético completo.",
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
    nome: "Mapeamento Energético",
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
.mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#0a0e18;border-top:1px solid #0d1828;z-index:100}
.mob-inner{display:flex;overflow-x:auto;scrollbar-width:none}
.mob-inner::-webkit-scrollbar{display:none}
.mob-btn{flex:1;min-width:54px;padding:7px 3px 5px;border:none;background:transparent;color:#2d4a66;font-size:.5rem;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:'DM Sans',sans-serif;transition:color .2s}
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
  const [modo, setModo] = useState("login");
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
    onLogin({ ...data.user, ...prof }); // trigger termos check
  };

  const registar = async () => {
    if (!nome || !email || !senha) { setErr("Preenche todos os campos."); return; }
    if (senha.length < 6) { setErr("Senha minima 6 caracteres."); return; }
    setLoad(true); setErr("");
    const { data, error } = await sb.auth.signUp({
      email, password: senha,
      options: { data: { nome } }
    });
    if (error) { setErr(error.message); setLoad(false); return; }
    setLoad(false);
    setErr("");
    setModo("confirmar");
  };

  if (modo === "confirmar") return (
    <div className="auth-wrap fade">
      <div className="auth-box">
        <div className="auth-logo">VITALDOCTOR</div>
        <div className="auth-sub">Confirmacao de email</div>
        <div className="al al-ok">Enviamos um email de confirmacao para <strong>{email}</strong>. Confirma o email e depois entra.</div>
        <button className="btn btn-s" style={{marginTop:10}} onClick={() => setModo("login")}>Ir para Login</button>
      </div>
    </div>
  );

  return (
    <div className="auth-wrap fade">
      <div className="auth-box">
        <div className="auth-logo">VITALDOCTOR</div>
        <div className="auth-sub">Consultorio Terapeutico Digital</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${modo === "login" ? "on" : ""}`} onClick={() => { setModo("login"); setErr(""); }}>Entrar</button>
          <button className={`auth-tab ${modo === "reg" ? "on" : ""}`} onClick={() => { setModo("reg"); setErr(""); }}>Criar conta</button>
        </div>
        {modo === "reg" && <div className="mb8"><span className="lbl">Nome</span><input className="inp" placeholder="O teu nome" value={nome} onChange={e => setNome(e.target.value)} /></div>}
        <div className="mb8"><span className="lbl">Email</span><input className="inp" type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (modo === "login" ? entrar() : registar())} /></div>
        <div className="mb12"><span className="lbl">Senha</span><input className="inp" type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && (modo === "login" ? entrar() : registar())} /></div>
        {err && <div className="al al-d">{err}</div>}
        {modo === "reg" && <div className="al al-ok" style={{marginBottom:8}}>15 dias gratis - Sem cartao</div>}
        <button className="btn btn-p" onClick={modo === "login" ? entrar : registar} disabled={load}>
          {load ? "A processar..." : modo === "login" ? "Entrar" : "Criar conta gratis"}
        </button>
        {modo === "login" && <div style={{textAlign:"center",marginTop:9,fontSize:10,color:"#2d4a66",cursor:"pointer"}} onClick={() => setModo("reg")}>Nao tens conta? <span style={{color:"#00c6b8"}}>Regista-te gratis</span></div>}
        <div style={{marginTop:14,paddingTop:10,borderTop:"1px solid #0d1828",fontSize:9,lineHeight:1.6,color:"#2d4a66",textAlign:"center"}}>
          Ferramenta de apoio à gestão e ao atendimento. Não substitui conhecimento, formação nem o julgamento clínico do profissional — a responsabilidade pelo que é indicado a cada paciente é de quem atende.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function Dashboard({ user, pacs, agenda, go }) {
  const dias = user?.trial_fim ? Math.max(0, Math.ceil((new Date(user.trial_fim) - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const trial = user?.plano === "trial";
  const hojeMs = agenda.filter(m => m.data === hoje());
  const totalPago = pacs.reduce((s, p) => s + (p._pagoPago || 0), 0);
  const totalPend = pacs.reduce((s, p) => s + (p._pagoPend || 0), 0);

  return (
    <div className="fade">
      {trial && dias > 0 && (
        <div className="trial-bar">
          <div style={{fontSize:11,color:"#fde68a"}}>Trial: <strong style={{color:"#f59e0b"}}>{dias} dias restantes</strong></div>
          <button className="btn btn-g btn-sm" style={{width:"auto"}}>Fazer upgrade</button>
        </div>
      )}
      <div className="stats">
        <div className="stat"><div className="stat-n">{pacs.length}</div><div className="stat-l">Pacientes</div></div>
        <div className="stat"><div className="stat-n">{hojeMs.length}</div><div className="stat-l">Hoje</div></div>
        <div className="stat"><div className="stat-n">€{totalPago.toFixed(0)}</div><div className="stat-l">Pago</div></div>
        <div className="stat"><div className="stat-n" style={{color:totalPend>0?"#fbbf24":"#00c6b8"}}>€{totalPend.toFixed(0)}</div><div className="stat-l">Pendente</div></div>
      </div>
      <div className="card">
        <div className="card-t">Marcacoes de Hoje</div>
        {hojeMs.length === 0
          ? <div style={{color:"#1a2840",fontSize:11,textAlign:"center",padding:"14px 0"}}>Sem marcacoes para hoje</div>
          : hojeMs.sort((a,b) => a.hora.localeCompare(b.hora)).map(m => (
            <div key={m.id} className="agenda-row">
              <div className="agenda-hora">{m.hora?.slice(0,5)}</div>
              <div>
                <div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{pacs.find(p => p.id === m.paciente_id)?.nome || "—"}</div>
                <div style={{fontSize:9,color:"#2d4a66"}}>{m.tipo} · {m.formato} · {m.duracao}min</div>
              </div>
            </div>
          ))}
      </div>
      <div className="card">
        <div className="card-t">Acesso Rapido</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          {[
            ["👥","Pacientes","pacientes",null],
            ["📅","Agenda","agenda",null],
            ["💬","Espaço Pacientes","mensagens",null],
            ["🌐","Mini Site","minisite",null],
          ].map(([ic,lb,m,ab]) => (
            <div key={lb} onClick={() => go && go(m,ab)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 11px",background:"#050810",border:"1px solid #0d1828",borderRadius:7,fontSize:11,color:"#b0c4d8",cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#1a3a5c"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#0d1828"}>
              <span style={{fontSize:14}}>{ic}</span>{lb}
            </div>
          ))}
        </div>
        <div style={{marginTop:8}}>
          <button className="btn btn-p" style={{fontSize:12,padding:"10px 0"}} onClick={() => go && go("metodo","consulta")}>
            🩺 Iniciar Nova Consulta
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PACIENTES
// ══════════════════════════════════════════════════════
function Pacientes({ user, pacs, setPacs }) {
  const [vista, setVista] = useState("lista");
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("info");
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState({ nome:"",data_nasc:"",email:"",telefone:"",genero:"feminino",forma_pag:"MBWay",medicacao:"",alergias:"",notas:"",foto:"" });
  const [consultas, setConsultas] = useState([]);
  const [verCons, setVerCons] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [novoPag, setNovoPag] = useState({ descricao:"",valor:"",status:"pago",forma:"MBWay",data:hoje() });
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
  const fotoRef = useRef(null);
  const upMatRef = useRef(null);

  const filtrados = pacs.filter(p => p.nome?.toLowerCase().includes(busca.toLowerCase()));

  const salvarNovo = async () => {
    if (!novo.nome) return;
    setLoad(true);
    const { data, error } = await sb.from("pacientes").insert({ ...novo, terapeuta_id: user.id }).select().single();
    setLoad(false);
    if (error) { alert("Erro: " + error.message); return; }
    setPacs([...pacs, data]);
    setNovo({ nome:"",data_nasc:"",email:"",telefone:"",genero:"feminino",forma_pag:"MBWay",medicacao:"",alergias:"",notas:"",foto:"" });
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
    const { data } = await sb.from("pagamentos").insert({ ...novoPag, valor: parseFloat(novoPag.valor), paciente_id: sel.id, terapeuta_id: user.id }).select().single();
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
            <div style={{display:"flex",gap:7,marginTop:14}}>
              <button className="btn btn-s btn-sm" style={{flex:1}} onClick={iniciarEdicao}>✏️ Editar dados</button>
              <button className="btn btn-d btn-sm" style={{flex:1}} onClick={apagarPaciente} disabled={load}>🗑️ Apagar paciente</button>
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
                    <pre style={{whiteSpace:"pre-wrap",fontSize:10,color:"#7a98b8",fontFamily:"monospace",lineHeight:1.7,maxHeight:280,overflowY:"auto",margin:0}}>{c.relatorio}</pre>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      <button className="btn btn-p btn-sm" style={{flex:1}} onClick={()=>{
                        const w=window.open("","_blank");
                        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title><style>body{font-family:Georgia,serif;padding:32px;max-width:720px;margin:0 auto;color:#1a1a2e}pre{white-space:pre-wrap;font-size:13px;line-height:1.8}.h{border-bottom:3px solid #1a6b61;padding-bottom:10px;margin-bottom:16px;font-size:18px;letter-spacing:3px;color:#1a6b61;font-weight:bold}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><div class="h">VITALDOCTOR</div><pre>${(c.relatorio||"").replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre></body></html>`);
                        w.document.close(); setTimeout(()=>w.print(),400);
                      }}>🖨️ PDF</button>
                      <button className="btn btn-sm" style={{flex:1,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366"}} onClick={()=>{
                        const num=(sel?.telefone||"").replace(/[^0-9]/g,"");
                        window.open(num?`https://wa.me/${num}?text=${encodeURIComponent((c.relatorio||"").substring(0,1500))}`:`https://wa.me/?text=${encodeURIComponent((c.relatorio||"").substring(0,1500))}`,"_blank");
                      }}>WhatsApp</button>
                      <button className="btn btn-s btn-sm" style={{flex:1}} onClick={()=>navigator.clipboard?.writeText(c.relatorio||"")}>📋 Copiar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{marginTop:10,background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:10}}>
              <div className="slbl">Adicionar Consulta Manual</div>
              <div className="g2">
                <div><span className="lbl">Data</span><input className="inp" type="date" value={novoCons.data} onChange={e => setNovoCons({...novoCons,data:e.target.value})} /></div>
                <div><span className="lbl">Tipo</span><select className="inp sel" value={novoCons.tipo} onChange={e => setNovoCons({...novoCons,tipo:e.target.value})}><option>Consulta</option><option>Mapeamento</option><option>Pack 1</option><option>Pack 2</option><option>Pack 3</option><option>Seguimento</option></select></div>
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
                <div><div style={{fontWeight:600,color:"#b0c4d8"}}>{pg.descricao}</div><div style={{fontSize:9,color:"#2d4a66"}}>{fmtData(pg.data)} · {pg.forma}</div></div>
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
              <div className="g3">
                <div><span className="lbl">Estado</span><select className="inp sel" value={novoPag.status} onChange={e => setNovoPag({...novoPag,status:e.target.value})}><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="parcial">Parcial</option></select></div>
                <div><span className="lbl">Forma</span><select className="inp sel" value={novoPag.forma} onChange={e => setNovoPag({...novoPag,forma:e.target.value})}><option>MBWay</option><option>Transferencia</option><option>Dinheiro</option><option>Cartao</option></select></div>
                <div><span className="lbl">Data</span><input className="inp" type="date" value={novoPag.data} onChange={e => setNovoPag({...novoPag,data:e.target.value})} /></div>
              </div>
              <button className="btn btn-p btn-sm" style={{width:"100%",marginTop:6}} onClick={addPag}>+ Registar</button>
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
            <div style={{fontWeight:600,fontSize:12,color:"#b0c4d8"}}>{p.nome}</div>
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
  const [nova, setNova] = useState({ paciente_id:"",data:hoje(),hora:"09:00",duracao:60,tipo:"Consulta",sala:"Online",formato:"Online",notas:"",pack_total:1,pack_espaco:7 });
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  const todayStr = hoje();
  const getIniSem = () => { const d=new Date(); d.setDate(d.getDate()+semOff*7-d.getDay()); return d; };
  const diasArr = () => Array.from({length:7},(_,i)=>{ const d=new Date(getIniSem()); d.setDate(d.getDate()+i); return d; });

  const marcDia = (ds) => agenda.filter(m => m.data === ds).sort((a,b) => a.hora.localeCompare(b.hora));
  const nomePac = (id) => pacs.find(p => p.id === id)?.nome || "—";

  const verificarSobrep = (data, hora, sala, excId) => {
    return agenda.filter(m => m.id !== excId && m.data === data && m.sala === sala).some(m => {
      const h1 = parseInt(hora.replace(":",""));
      const h2 = parseInt(m.hora.replace(":",""));
      return Math.abs(h1 - h2) < 100;
    });
  };

  const adicionar = async () => {
    setErr("");
    if (!nova.paciente_id) { setErr("Seleciona um paciente."); return; }
    if (verificarSobrep(nova.data, nova.hora, nova.sala, null)) { setErr("Sobreposicao detetada nesta sala e horario!"); return; }
    setLoad(true);
    const novas = [];
    for (let i = 0; i < nova.pack_total; i++) {
      const d = new Date(nova.data + "T00:00:00"); d.setDate(d.getDate() + i * nova.pack_espaco);
      const dataI = d.toISOString().split("T")[0];
      novas.push({ paciente_id:nova.paciente_id, data:dataI, hora:nova.hora+":00", duracao:nova.duracao, tipo:nova.tipo, sala:nova.sala, formato:nova.formato, notas:nova.notas, pack_sessao:i+1, pack_total:nova.pack_total, terapeuta_id:user.id });
    }
    const { data, error } = await sb.from("agenda").insert(novas).select();
    setLoad(false);
    if (error) { setErr("Erro: " + error.message); return; }
    setAgenda([...agenda, ...data]);
    setModal(false);
    setNova({ paciente_id:"",data:hoje(),hora:"09:00",duracao:60,tipo:"Consulta",sala:"Online",formato:"Online",notas:"",pack_total:1,pack_espaco:7 });
  };

  const remover = async (id) => {
    await sb.from("agenda").delete().eq("id", id);
    setAgenda(agenda.filter(m => m.id !== id));
  };

  const lembrarWA = (m) => {
    const pac = pacs.find(p => p.id === m.paciente_id);
    const num = (pac?.telefone||"").replace(/[^0-9]/g,"");
    const txt = `Ola ${pac?.nome||""}, lembrete da sua consulta no dia ${fmtData(m.data)} as ${m.hora?.slice(0,5)}.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(txt)}`,"_blank");
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
                        <button className="btn btn-sm" style={{padding:"3px 7px",background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"auto"}} onClick={() => lembrarWA(m)}>🔔</button>
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
                  <button className="btn btn-sm" title="Lembrar paciente por WhatsApp" style={{padding:"3px 7px",fontSize:11,background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"auto"}} onClick={() => lembrarWA(m)}>🔔</button>
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
            <div className="mb8"><span className="lbl">Paciente *</span>
              <select className="inp sel" value={nova.paciente_id} onChange={e => setNova({...nova,paciente_id:e.target.value})}>
                <option value="">-- Selecionar --</option>
                {pacs.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="g2">
              <div><span className="lbl">Data</span><input className="inp" type="date" value={nova.data} onChange={e => setNova({...nova,data:e.target.value})} /></div>
              <div><span className="lbl">Hora</span><input className="inp" type="time" value={nova.hora} onChange={e => setNova({...nova,hora:e.target.value})} /></div>
            </div>
            <div className="g2">
              <div><span className="lbl">Duracao (min)</span><select className="inp sel" value={nova.duracao} onChange={e => setNova({...nova,duracao:parseInt(e.target.value)})}><option value={30}>30min</option><option value={45}>45min</option><option value={60}>60min</option><option value={90}>90min</option><option value={120}>120min</option></select></div>
              <div><span className="lbl">Sala/Local</span><select className="inp sel" value={nova.sala} onChange={e => setNova({...nova,sala:e.target.value})}><option>Online</option><option>Sala 1</option><option>Sala 2</option><option>Domicilio</option></select></div>
            </div>
            <div className="g2">
              <div><span className="lbl">Tipo</span><select className="inp sel" value={nova.tipo} onChange={e => setNova({...nova,tipo:e.target.value})}><option>Consulta</option><option>Mapeamento</option><option>Seguimento</option><option>Pack</option></select></div>
              <div><span className="lbl">Formato</span><select className="inp sel" value={nova.formato} onChange={e => setNova({...nova,formato:e.target.value})}><option>Online</option><option>Presencial</option><option>A Distancia</option></select></div>
            </div>
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
                        {[["avancado","🧠 Módulo Especializado"],["audios","🎧 Áudios"],["minisite","🌐 Mini Site"]].map(([mod,label])=>(
                          <div key={mod}>
                            <div className="admin-row">
                              <span style={{fontSize:".68rem",color:"#3d5a7a"}}>{label}</span>
                              <button className={`tw ${(u.modulos_ativos||[]).includes(mod)?"on":"off"}`} onClick={()=>toggleMod(u.id,mod)} />
                            </div>
                            {mod==="avancado"&&(u.modulos_ativos||[]).includes(mod)&&(
                              <div className="admin-row" style={{paddingLeft:10}}>
                                <span style={{fontSize:".6rem",color:"#2d4a66"}}>Válido até (vazio=vitalício)</span>
                                <input type="date" style={{background:"#040810",border:"1px solid #0d1828",borderRadius:4,padding:"2px 6px",fontSize:".6rem",color:"#b0c4d8"}}
                                  value={u.preferencias?.modulos_validade?.avancado||""}
                                  onChange={e=>setValidade(u.id,"avancado",e.target.value||null)} />
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
export default function VitalDoctor() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mod, setMod] = useState("dashboard");
  const [metodoTab, setMetodoTab] = useState(null);
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const navegar = (m, aba) => { setMetodoTab(aba || null); setMod(m); };
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
    setUser(u);
    let { data: prof } = await sb.from("profiles").select("*").eq("id", u.id).single();
    if (!prof) {
      await sb.from("profiles").insert({ id: u.id, nome: u.user_metadata?.nome || u.email?.split("@")[0], email: u.email, role: "terapeuta", plano: "trial" });
      const { data } = await sb.from("profiles").select("*").eq("id", u.id).single();
      prof = data;
    }
    if (u.email === "ricardocorreia.211984@gmail.com" && prof?.role !== "superadmin") {
      await sb.from("profiles").update({ role: "superadmin" }).eq("id", u.id);
      prof = { ...prof, role: "superadmin" };
    }
    setPerfil(prof);
    const { data: ps } = await sb.from("pacientes").select("*").eq("terapeuta_id", u.id).order("nome");
    setPacs(ps || []);
    const { data: ag } = await sb.from("agenda").select("*").eq("terapeuta_id", u.id).order("data");
    setAgenda(ag || []);
    // Verificar termos na primeira sessão
    if (prof && !jaAceitouTermos(u.id)) setMostrarTermos(true);
    setLoading(false);
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

  const SB_NAV = [
    { t:"Principal", items:[{ id:"dashboard",icon:"🏠",l:"Dashboard" }] },
    { t:"Clinico", items:[
      { id:"pacientes",icon:"👥",l:"Pacientes" },
      { id:"agenda",icon:"📅",l:"Agenda" },
      { id:"mensagens",icon:"💬",l:"Mensagens" },
    ]},
    ...(temMod("avancado") ? [{ t:"Especializado", items:[{ id:"metodo",icon:"🧠",l:"Atendimento Especializado" }] }] : []),
    ...(temMod("minisite") ? [{ t:"Pratica", items:[{ id:"minisite",icon:"🌐",l:"Mini Site" }] }] : []),
    ...(isSuperAdmin ? [{ t:"Gestão", items:[{ id:"admin",icon:"⚙️",l:"Painel Super Admin" }] }] : []),
    { t:"Apoio", items:[{ id:"suporte",icon:"🆘",l:"Ajuda / Suporte" }] },
  ];

  const TITULOS = {
    dashboard:"Dashboard", pacientes:"Pacientes", agenda:"Agenda", mensagens:"Mensagens",
    metodo:"Atendimento Especializado", minisite:"Mini Site",
    admin:"Painel Super Admin", suporte:"Ajuda / Suporte",
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
      <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
        <div className="app" style={{flex:1,overflow:"hidden"}}>
        <aside className="sb">
          <div className="sb-logo">
            <div className="sb-logo-t">VITALDOCTOR</div>
            <div className="sb-logo-v">SaaS v1.0</div>
          </div>
          <div className="sb-user">
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
            <button className="sb-btn" onClick={logout}>Sair</button>
          </div>
        </aside>

        <main className="main">
          <div className="main-hdr">
            <div className="main-title">{TITULOS[mod] || "VitalDoctor"}</div>
            <div style={{fontSize:9,color:"#1a2840"}}>{user.email}</div>
          </div>
          <div className="main-body">
            {mod === "dashboard" && <Dashboard user={perfil} pacs={pacs} agenda={agenda} go={navegar} />}
            {mod === "pacientes" && <Pacientes user={perfil} pacs={pacs} setPacs={setPacs} />}
            {mod === "mensagens" && <Mensagens user={perfil} pacs={pacs} />}
            {mod === "agenda"    && <Agenda user={perfil} pacs={pacs} agenda={agenda} setAgenda={setAgenda} />}
            {mod === "metodo"    && temMod("avancado") && <ModuloMetodo user={perfil} adminMode={isSuperAdmin} initAba={metodoTab} voltar={() => navegar("dashboard")} />}
            {mod === "minisite"  && <MiniSite user={perfil} />}
            {mod === "admin"     && isSuperAdmin && <AdminPanel user={perfil} />}
            {mod === "suporte"   && <Suporte user={perfil} isSuperAdmin={isSuperAdmin} />}
          </div>
        </main>

        </div>{/* end .app */}
        <nav className="mob-nav">
          <div className="mob-inner">
            {SB_NAV.flatMap(s => s.items).map(i => (
              <button key={i.id} className={`mob-btn ${mod === i.id ? "on" : ""}`} onClick={() => setMod(i.id)}>
                <span className="mob-icon">{i.icon}</span>{i.l}
              </button>
            ))}
            <button className="mob-btn" onClick={logout}>
              <span className="mob-icon">🚪</span>Sair
            </button>
          </div>
        </nav>
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

  if (tipo === "Mapeamento Energético Vital") {
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
      if (p.zona)       linhas.push(`  Lateralidade/Zona: ${p.zona}`);
      if (p.ss?.length) linhas.push(`  Sistema Superior: ${p.ss.join(", ")}`);
      if (p.sc?.length) linhas.push(`  Sistema Central: ${p.sc.join(", ")}`);
      if (p.si?.length) linhas.push(`  Sistema Inferior: ${p.si.join(", ")}`);
    });

    if (escudo) linhas.push(`\nESCUDO MAIS ATIVO: ${escudo}${escudoLado ? ` (avaliado em ${escudoLado})` : ""}`);

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
    const direcao = lado.includes("Esq") ? "trauma racionalizado (lógica, contenção — ansiedade, stress, burnout)" : lado.includes("Drt") ? "trauma emocionalizado (sensibilidade, profundidade — depressão, luto, desamparo)" : "";
    if (escudo || direcao) {
      linhas.push(`\nLEITURA DA CORRELAÇÃO (Ponto + Escudo + Lateralidade + Tempo)`);
      if (escudo && ESC_SENTIDO[escudo]) linhas.push(`  Escudo ${escudo}: ${ESC_SENTIDO[escudo]}.`);
      if (direcao) linhas.push(`  Lateralidade (${lado}): ${direcao}.`);
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

  linhas.push(`\n${"─".repeat(55)}`);
  linhas.push(`AVISO ÉTICO: O mapeamento não fecha diagnóstico. Revela hipóteses emocionais e padrões corporais. Não substitui avaliação médica nem indica tratamento. Diagnósticos pertencem à área médica.`);
  linhas.push(`A responsabilidade terapêutica é exclusivamente do profissional que realiza o atendimento.`);
  return linhas.join("\n");
}

// ══════════════════════════════════════════════════════════════════
// PDF + WHATSAPP — enviar relatório
// ══════════════════════════════════════════════════════════════════
function EnviarRelatorio({ texto, paciente, onFechar }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => { navigator.clipboard?.writeText(texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000); };
  const pdf = () => {
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title>
    <style>body{font-family:Georgia,serif;padding:32px 40px;max-width:720px;margin:0 auto;color:#1a1a2e}
    pre{white-space:pre-wrap;font-size:13px;line-height:1.8;font-family:Georgia,serif}
    .hdr{border-bottom:3px solid #1a6b61;padding-bottom:12px;margin-bottom:20px}
    .logo{font-size:20px;letter-spacing:4px;color:#1a6b61;font-weight:bold}
    .disc{font-size:10px;color:#999;border-top:1px solid #eee;padding-top:10px;margin-top:20px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
    </head><body>
    <div class="hdr"><div class="logo">VITALDOCTOR</div><div style="font-size:10px;color:#666;letter-spacing:1px">Relatório de Atendimento Terapêutico</div></div>
    <pre>${texto.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
    <div class="disc">VitalDoctor · Dados protegidos ao abrigo do RGPD · Este documento é confidencial.</div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),500);
  };
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
  const PONTOS_ENTRADA = ["COROA","OMBRO","COSTELAS","MÃO","COXA","JOELHO","PÉ"];
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
    const txt = gerarRelatorioFiel("Mapeamento Energético Vital", dados, paciente?.nome);
    setRelatorio(txt);
    setLoad(true);
    await onGuardar("Mapeamento Energético Vital", dados);
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

      <ChipGroup titulo={`1. PONTOS VITAIS — ${atual.lado}`} hint="Pesquisa os centros de energia vital. Marca onde travou." lista={PONTOS_VITAIS} campo="pv" />
      <ChipGroup titulo={`2. PONTOS DE ENTRADA — ${atual.lado}`} hint="Zona onde o corpo conteve a reação." lista={PONTOS_ENTRADA} campo="pe" />

      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">3. LATERALIDADE (zona detetada)</div>
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
            [2,"🗺️ Caminho 2 — Mente Subconsciente","Mapeamento Energético Vital. Ideal: 2ª consulta, aceder à raiz profunda do sintoma."],
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
function NovaConsulta({ user, onIniciar }) {
  return (
    <div className="fade">
      <div style={{background:"linear-gradient(135deg,#061428,#0a1e2e)",border:"1px solid #1a3a5c",borderRadius:12,padding:"18px 20px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#dde4f0",marginBottom:4}}>Selecciona o Tipo de Atendimento</div>
        <div style={{fontSize:10,color:"#3d5a7a"}}>Toca num cartão para iniciar a consulta guiada passo a passo</div>
      </div>

      {[
        { id:"consulta_unica", form:"form_a", icon:"🩺", titulo:"Consulta Única", sub:"Atendimento único", desc:"Acolhimento → Dados Pessoais → 6 Perguntas do Poder → Indicação Terapêutica → Protocolo de Cura", tags:["1ª consulta","Paciente novo","Clareza e direcionamento"] },
        { id:"pack_s1", form:"form_c", caminho:1, icon:"1️⃣", titulo:"Pack 3 Sessões — Sessão 1", sub:"Mente Consciente", desc:"Monitorização → 6 Perguntas → Pontuação dos Escudos (Caminho 1) → Protocolo 7 dias", tags:["Pack","Escudos","Base emocional"] },
        { id:"pack_s2", form:"form_b", icon:"2️⃣", titulo:"Pack 3 Sessões — Sessão 2", sub:"Mapeamento Energético", desc:"Grelha completa: Energia Vital → Zona de Impacto → Lateralidade → 3 Sistemas → Escudo → Tempo → Protocolo de Cura", tags:["Pack","Mapeamento","Raiz do sintoma"] },
        { id:"pack_s3", form:"form_c", caminho:1, icon:"3️⃣", titulo:"Pack 3 Sessões — Sessão 3", sub:"Consolidação", desc:"Revisão → Ferramentas práticas → Checklists e autocuidado → Protocolo de encerramento", tags:["Pack","Consolidação","Autocuidado"] },
        { id:"seguimento", form:"form_c", caminho:3, icon:"🔄", titulo:"Seguimento / Manutenção", sub:"Estressores Ativos", desc:"Monitorização → 6 Perguntas → Estressores e Gatilhos (Caminho 3) → Protocolo de manutenção", tags:["Seguimento","Estressores","Sintomas recorrentes"] },
        { id:"mapeamento_avulso", form:"form_b", icon:"🗺️", titulo:"Mapeamento Avulso", sub:"Mapeamento independente", desc:"Mapeamento Energético completo fora do pack — para aceder à raiz profunda do sintoma a qualquer momento", tags:["Avulso","Mapeamento"] },
      ].map(t=>(
        <div key={t.id} onClick={()=>onIniciar&&onIniciar(t.form, t.caminho, t.titulo)}
          style={{cursor:"pointer",padding:"16px 18px",marginBottom:10,borderRadius:12,border:"1px solid #0d1828",background:"#050810",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#1a4a6c";e.currentTarget.style.background="#07101c"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#0d1828";e.currentTarget.style.background="#050810"}}>
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#1a4a6c,#0d2535)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{t.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:"#dde4f0",marginBottom:2}}>{t.titulo}</div>
              <div style={{fontSize:10,color:"#00c6b8",marginBottom:5,fontWeight:600}}>{t.sub}</div>
              <div style={{fontSize:10,color:"#5a7a9a",lineHeight:1.6,marginBottom:8}}>{t.desc}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {t.tags.map(tag=><span key={tag} style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#0d1828",color:"#3d5a7a",border:"1px solid #1a2a3a"}}>{tag}</span>)}
              </div>
            </div>
            <div style={{fontSize:20,color:"#1a4a6c",flexShrink:0,alignSelf:"center"}}>▶</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MÓDULO MÉTODO — Orquestra todos os formulários + tabs
// ══════════════════════════════════════════════════════════════════
function ModuloMetodo({ user, adminMode, initAba, voltar }) {
  const [aceite, setAceite] = useState(jaAceitou(user?.id, "metodo"));
  const [aba, setAba] = useState(initAba || "consulta");
  const [qForm, setQForm] = useState(null);
  const [formAtivo, setFormAtivo] = useState(null); // "form_a" | "form_b" | "form_c"
  const [caminhoInit, setCaminhoInit] = useState(null); // caminho pré-seleccionado para form_c
  const [tituloConsulta, setTituloConsulta] = useState(""); // nome do tipo de consulta escolhido
  const [pacSel, setPacSel] = useState(null); // paciente seleccionado para a consulta
  const [pacs, setPacs] = useState([]);
  const [busca, setBusca] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (user?.id) {
      // Carrega APENAS os pacientes deste terapeuta (isolamento garantido)
      sb.from("pacientes").select("id,nome,telefone,medicacao,email")
        .eq("terapeuta_id", user.id)  // RLS + filtro código = dupla protecção
        .order("nome")
        .then(({ data }) => setPacs(data || []));
    }
  }, [user]);

  // Quando o terapeuta escolhe o tipo de consulta, primeiro selecciona o paciente
  const handleIniciar = (tipoForm, caminho, titulo) => {
    setFormAtivo(tipoForm);
    setCaminhoInit(caminho || null);
    setTituloConsulta(titulo || "");
    setAba("consulta_ativa");
  };

  const voltarMenu = () => {
    setFormAtivo(null);
    setPacSel(null);
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
      setOk("✅ Guardado na ficha de " + (pacSel?.nome || "paciente") + " — vê em Pacientes → Consultas");
      setTimeout(() => setOk(""), 4000);
    } catch (err) {
      alert("Erro ao guardar: " + (err.message || err) + "\n\nVerifica se a tabela 'consultas' tem as colunas necessárias (vê o SQL fornecido).");
    }
  };

  if (!aceite) return (
    <div className="fade" style={{maxWidth:560,margin:"0 auto",padding:"8px 0"}}>
      <div style={{background:"linear-gradient(135deg,#0a1e2e,#061428)",border:"1px solid #1a3a5c",borderRadius:14,padding:"28px 24px",marginBottom:12,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:10}}>🧠</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#dde4f0",marginBottom:6,letterSpacing:1}}>Módulo de Atendimento Especializado</div>
        <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.7,maxWidth:380,margin:"0 auto"}}>Ferramenta de apoio a terapeutas certificados para conduzir atendimentos estruturados com protocolos guiados, mapeamento emocional e geração de relatórios de consciência.</div>
      </div>
      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">O que este módulo inclui</div>
        {[["🩺","3 Formulários Guiados","1º Atendimento · Mapeamento Energético · Atendimento Estruturado"],["🗺️","Grelha Completa de Mapeamento","Todos os sistemas: Superior, Central, Inferior + Escudos + Temporalidade"],["📄","Relatório Fiel ao Protocolo","Gerado automaticamente com apenas os campos preenchidos"],["📤","Envio em PDF e WhatsApp","Imprime, envia ou copia com um toque"],["🔒","Dados 100% isolados","Os teus pacientes são exclusivamente teus — nenhum outro terapeuta acede"],].map(([ic,t,d])=>(
          <div key={t} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid #0d1828"}}>
            <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
            <div><div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{t}</div><div style={{fontSize:10,color:"#3d5a7a",marginTop:2,lineHeight:1.5}}>{d}</div></div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(251,191,36,.04)",border:"1px solid rgba(251,191,36,.18)",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:11,color:"#fbbf24",marginBottom:8}}>⚠️ Aviso Obrigatório</div>
        {["Este módulo é uma ferramenta de apoio. Não substitui a tua formação certificada nem o teu julgamento clínico.","Podes cometer erros. A responsabilidade pelo que indicares ao paciente é exclusivamente tua.","Não emite diagnósticos médicos.","O conteúdo é propriedade intelectual protegida. O acesso é pessoal e intransmissível."].map((p,i)=>(
          <div key={i} style={{fontSize:11,color:"#fde68a",marginBottom:4,lineHeight:1.6,paddingLeft:14,position:"relative"}}>
            <span style={{position:"absolute",left:0,color:"#f59e0b"}}>•</span>{p}
          </div>
        ))}
      </div>
      <button className="btn btn-p" style={{padding:"13px 0",fontSize:13}} onClick={()=>{ registarAceite(user?.id,"metodo"); setAceite(true); }}>
        ✅ Compreendi e assumo a responsabilidade profissional
      </button>
    </div>
  );

  const tabs = [
    ["consulta",       "🩺 Nova Consulta"],
    ["questionario",   "📋 Questionários"],
    ["assistente",     "🤖 Assistente"],
    ["farmacia",       "🌿 Farmácia"],
    ["infanto",        "👶 Infanto"],
    ["audios",         "🎧 Áudios"],
  ];

  // Ecrã de selecção de paciente (aparece ao escolher formulário)
  if (aba === "consulta_ativa" && formAtivo && !pacSel) {
    const filtrados = pacs.filter(p => p.nome?.toLowerCase().includes(busca.toLowerCase()));
    return (
      <div className="fade">
        <div className="card">
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
            <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={voltarMenu}>← Voltar</button>
            <div style={{fontWeight:700,color:"#dde4f0",fontSize:13}}>
              {tituloConsulta || (formAtivo==="form_a"?"🩺 1º Atendimento":formAtivo==="form_b"?"🗺️ Mapeamento Energético Vital":"🧭 Atendimento Estruturado")}
            </div>
          </div>
          <div className="card-t">Selecciona o paciente</div>
          <div style={{display:"flex",gap:7,marginBottom:10}}>
            <input className="inp" placeholder="Pesquisar paciente..." value={busca} onChange={e=>setBusca(e.target.value)} style={{flex:1}} />
          </div>
          <div className="al al-i" style={{fontSize:10,marginBottom:8}}>
            Só vês os teus próprios pacientes. Os dados são privados e não são partilhados com outros terapeutas.
          </div>
          {filtrados.length===0 && <div style={{fontSize:11,color:"#2d4a66",textAlign:"center",padding:"14px 0"}}>Sem pacientes encontrados.</div>}
          {filtrados.map(p=>(
            <div key={p.id} onClick={()=>setPacSel(p)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#050810",border:"1px solid #0d1828",borderRadius:8,marginBottom:6,cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#1a3a5c"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#0d1828"}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"#0d1828",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>👤</div>
              <div><div style={{fontWeight:600,fontSize:12,color:"#b0c4d8"}}>{p.nome}</div><div style={{fontSize:10,color:"#2d4a66"}}>{p.email||p.telefone||""}</div></div>
              <div style={{marginLeft:"auto",color:"#00c6b8",fontSize:16}}>▶</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade">
      {ok && <div className="al al-ok" style={{marginBottom:8}}>{ok}</div>}
      <div className="card">
        {voltar && <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:8}} onClick={voltar}>← Voltar</button>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {tabs.map(([k,l])=>(
            <button key={k} className={`chip ${aba===k?"on":""}`}
              onClick={()=>{ if(k==="consulta"){voltarMenu();}else{setFormAtivo(null);setPacSel(null);setAba(k);} }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {aba==="consulta" && !formAtivo && <NovaConsulta user={user} onIniciar={handleIniciar} />}

      {aba==="consulta_ativa" && formAtivo && pacSel && (
        <>
          {formAtivo==="form_a" && <FormPrimeiroAtendimento paciente={pacSel} user={user} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
          {formAtivo==="form_b" && <FormMapeamentoGrelha     paciente={pacSel} user={user} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
          {formAtivo==="form_c" && <FormAtendimentoEstruturado paciente={pacSel} user={user} caminhoInit={caminhoInit} tituloConsulta={tituloConsulta} onGuardar={handleGuardar} onVoltar={voltarMenu} />}
        </>
      )}

      {aba==="questionario" && <Questionario user={user} initForm={qForm} />}
      {aba==="assistente"   && <Assistente user={user} />}
      {aba==="farmacia"     && <Farmacia adminMode={adminMode} />}
      {aba==="infanto"      && <Infanto adminMode={adminMode} ir={(ab,fk)=>{ setFormAtivo(null); setPacSel(null); if(fk) setQForm(fk); setAba(ab); }} />}
      {aba==="audios"       && <ModuloAudios />}
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
const getForm = (k) => [...FORMS_DEF, ...FORMS_CUSTOM].find(f => f.key === k);
const getAllForms = () => [...FORMS_DEF, ...FORMS_CUSTOM];


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
        <div style={{fontSize:"2.2rem",marginBottom:6}}>🏛️</div>
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
  useEffect(() => {
    sb.from("respostas").select("*").eq("token", token).eq("status", "pendente").maybeSingle()
      .then(({ data }) => setRow(data || null)).catch(() => setRow(null));
  }, [token]);
  const submeter = async () => {
    await sb.from("respostas").update({ respostas: val, status: "respondido" }).eq("token", token);
    setFeito(true);
  };
  const form = row ? getForm(row.questionario) : null;
  return (
    <div style={{ minHeight: "100vh", background: "#050810", padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: "#00c6b8", padding: "10px 0 14px" }}>VitalDoctor</div>
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
  const [novo, setNovo] = useState({ nome:"", indicacao:"", contraind:"", notas:"" });

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
    setItens(lista); await sync(lista); setNovo({nome:"",indicacao:"",contraind:"",notas:""});
  };
  const remover = async (id) => { const lista=itens.filter(i=>i.id!==id); setItens(lista); await sync(lista); };

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">🌿 Farmácia Natural</div>
        <div style={{background:"rgba(251,191,36,.04)",border:"1px solid rgba(251,191,36,.2)",borderRadius:8,padding:"10px 12px",fontSize:10,lineHeight:1.7,color:"#fde68a"}}>
          <div style={{fontWeight:700,marginBottom:4}}>⚠️ Aviso Legal — Lê antes de usar</div>
          <div>Esta secção é uma ferramenta de <strong>apoio informativo</strong> ao terapeuta. O VitalDoctor e os seus responsáveis <strong>não assumem qualquer responsabilidade</strong> pelo uso, interpretação ou aplicação desta informação.</div>
          <div style={{marginTop:6}}>• Não substitui prescrição médica nem avaliação clínica</div>
          <div>• Não alteres, combines ou suspendas medicação sem consultar o médico prescritor</div>
          <div>• Verifica sempre interações com a medicação actual de cada paciente</div>
          <div>• A responsabilidade pelo que é indicado a cada paciente é exclusivamente do profissional que atende</div>
        </div>
      </div>
      {adminMode && (
        <div className="card">
          <div className="card-t">+ Adicionar produto</div>
          {[["nome","Nome do produto *"],["indicacao","Indicação"],["contraind","Contra-indicações / interações"],["notas","Notas / observações"]].map(([k,ph])=>(
            <textarea key={k} className="inp" rows={k==="nome"?1:2} placeholder={ph} style={{resize:"vertical"}} value={novo[k]} onChange={e=>setNovo(n=>({...n,[k]:e.target.value}))} />
          ))}
          <button className="btn btn-p" onClick={adicionar} disabled={!novo.nome.trim()}>Adicionar</button>
        </div>
      )}
      {itens.length === 0
        ? <div className="al al-i">{adminMode?"Adiciona o primeiro produto acima.":"Conteúdo a ser adicionado pelo admin."}</div>
        : itens.map(item => (
          <div key={item.id} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#00c6b8"}}>{item.nome}</div>
              {adminMode && <button className="chip" onClick={()=>remover(item.id)}>✕</button>}
            </div>
            {item.indicacao && <div style={{fontSize:10,color:"#5a7a9a",marginTop:3}}><strong>Indicação:</strong> {item.indicacao}</div>}
            {item.contraind && <div style={{fontSize:10,color:"#f59e0b",marginTop:2}}><strong>⚠️ Contra-ind.:</strong> {item.contraind}</div>}
            {item.notas && <div style={{fontSize:10,color:"#3d5a7a",marginTop:2}}>{item.notas}</div>}
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


function Assistente({ user }) {
  const [texto, setTexto] = useState("");
  const [sug, setSug] = useState(null);
  const [ouvindo, setOuvindo] = useState(false);

  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

  const analisar = () => {
    if (!texto.trim()) return;
    const palavras = norm(texto).split(/\W+/).filter(p=>p.length>3);
    const scoreEsc = ESCUDOS.map(e => {
      const h = norm(e.nome+" "+e.emocoes);
      return {...e, score: palavras.filter(p=>h.includes(p)).length};
    }).sort((a,b)=>b.score-a.score).filter(e=>e.score>0).slice(0,2);
    const scorePt = PONTOS.map(p => {
      const h = norm((p.aspectos||"")+" "+(p.sintomas||"")+" "+p.nome);
      return {...p, score: palavras.filter(w=>h.includes(w)).length};
    }).sort((a,b)=>b.score-a.score).filter(p=>p.score>0).slice(0,5);
    const afirm = scoreEsc[0] ? AFIRMACOES_ESCUDO[scoreEsc[0].id] : null;
    setSug({ escudos:scoreEsc, pontos:scorePt, afirm, perguntas:PERGUNTAS_ABERTURA.slice(0,3) });
  };

  const ditar = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Reconhecimento de voz não suportado neste browser."); return; }
    const rec = new SR(); rec.lang="pt-PT"; rec.continuous=false; rec.interimResults=false;
    rec.onstart = ()=>setOuvindo(true);
    rec.onresult = e=>{ setTexto(t=>t+" "+e.results[0][0].transcript); setOuvindo(false); };
    rec.onerror = ()=>setOuvindo(false); rec.onend = ()=>setOuvindo(false);
    rec.start();
  };

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">🤖 Assistente do Módulo</div>
        <div className="al al-w" style={{fontSize:10,lineHeight:1.5}}>
          ⚠️ Sugestões com base nas fontes do módulo — <strong>NÃO são respostas definitivas</strong>. O terapeuta é responsável pelo que envia ao paciente. Pode conter erros — verifica sempre. Não substitui julgamento clínico.
        </div>
        <div className="lbl" style={{marginTop:8}}>Cola a mensagem / escreve / dita</div>
        <textarea className="inp" rows={4} style={{resize:"vertical",width:"100%"}} placeholder="Cola aqui o texto da conversa, notas do paciente ou dita por voz..." value={texto} onChange={e=>setTexto(e.target.value)} />
        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <button className="btn btn-p" onClick={analisar} disabled={!texto.trim()}>Analisar</button>
          <button className={`btn ${ouvindo?"btn-d":"btn-s"}`} onClick={ditar}>{ouvindo?"🔴 A ouvir...":"🎤 Voz"}</button>
          <button className="btn btn-s" onClick={()=>{setTexto("");setSug(null);}}>Limpar</button>
        </div>
      </div>
      {sug && <div className="fade">
        {sug.escudos.length===0 && sug.pontos.length===0 && (
          <div className="al al-i">Não encontrei correspondências. Tenta com mais contexto ou palavras-chave do que o paciente sente.</div>
        )}
        {sug.escudos.length>0 && (
          <div className="card">
            <div className="card-t">Escudo(s) prováveis</div>
            {sug.escudos.map(e=>(
              <div key={e.id} style={{marginBottom:6}}>
                <div style={{fontWeight:700,color:"#00c6b8",fontSize:12}}>{e.nome}</div>
                <div style={{fontSize:10,color:"#5a7a9a"}}>{e.emocoes}</div>
              </div>
            ))}
          </div>
        )}
        {sug.pontos.length>0 && (
          <div className="card">
            <div className="card-t">Pontos a explorar</div>
            {sug.pontos.map(p=>(
              <div key={p.id} style={{marginBottom:8,paddingBottom:6,borderBottom:"1px solid #0d1828"}}>
                <div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{p.nome}</div>
                {p.aspectos && <div style={{fontSize:10,color:"#5a7a9a"}}><strong>Ligado a:</strong> {p.aspectos}</div>}
                {p.frase && <div style={{fontSize:10,color:"#00c6b8"}}><strong>Pergunta:</strong> {p.frase}</div>}
              </div>
            ))}
          </div>
        )}
        {sug.perguntas.length>0 && (
          <div className="card">
            <div className="card-t">Perguntas de abertura sugeridas</div>
            {sug.perguntas.map((p,i)=><div key={i} style={{fontSize:10,color:"#5a7a9a",marginBottom:4}}>• {p}</div>)}
          </div>
        )}
        {sug.afirm && (
          <div className="card">
            <div className="card-t">Afirmações sugeridas</div>
            <div style={{fontSize:10,color:"#5a7a9a",marginBottom:3}}><strong>Afirmação:</strong> {sug.afirm.afirmacao}</div>
            <div style={{fontSize:10,color:"#5a7a9a",marginBottom:3}}><strong>Libertação:</strong> {sug.afirm.liberacao}</div>
            <div style={{fontSize:10,color:"#5a7a9a"}}><strong>Cura:</strong> {sug.afirm.cura}</div>
            <div style={{fontSize:9,color:"#2d4a66",marginTop:6}}>Sugestão — verifica se conduz com a verdade e o quadro clínico do paciente.</div>
          </div>
        )}
      </div>}
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

function MiniSite({ user }) {
  const EXEMPLO = {
    nomePratica:"Espaço Bem-Estar", subtitulo:"Terapia Holística e Equilíbrio Emocional",
    bio:"Acompanho pessoas que procuram reequilíbrio emocional e bem-estar. Com uma abordagem acolhedora e personalizada, ajudo cada pessoa a reencontrar a sua harmonia interior, num espaço seguro e sem julgamentos.",
    abordagem:"Trabalho de forma integrativa, combinando escuta ativa, técnicas de relaxamento e ferramentas práticas adaptadas a cada pessoa. Cada sessão é um passo no seu caminho de cura.",
    credenciais:"Terapeuta Certificada · Membro da Associação Profissional",
    cor:"#00c6b8", logo:"", foto:"", horario:"Seg a Sex: 9h–19h · Sáb: 9h–13h",
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
    mostrar_marcacao:true,
  };
  const [cfg, setCfg] = useState(EXEMPLO);
  const [editando, setEditando] = useState(false);
  const [ok, setOk] = useState("");
  const [temConfig, setTemConfig] = useState(false);
  const logoRef = useRef(null);
  const fotoRef = useRef(null);

  useEffect(() => {
    // Se o utilizador já guardou um site, usa o dele; senão mostra o exemplo
    if (user?.config && user.config.nomePratica) {
      setCfg(c => ({ ...EXEMPLO, ...user.config }));
      setTemConfig(true);
    }
  }, [user]);

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
        {linkPublico && <button className="chip" onClick={()=>{navigator.clipboard?.writeText(linkPublico);setOk("Link copiado!");setTimeout(()=>setOk(""),2000);}}>🔗 Link público</button>}
        {editando && <button className="chip" style={{borderColor:"#5c1a1a",color:"#f87171"}} onClick={limparTudo}>🗑️ Limpar tudo</button>}
      </div>

      {editando ? (
        <div>
          <div className="card">
            <div className="card-t">🎨 Marca e Identidade</div>
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
          </div>

          <div className="card">
            <div className="card-t">📖 Apresentação</div>
            <span className="lbl">Bio / Sobre mim</span>
            <textarea className="inp" rows={3} value={cfg.bio} onChange={e=>setCfg({...cfg,bio:e.target.value})} placeholder="Apresente-se aos seus pacientes..." />
            <span className="lbl">Abordagem terapêutica</span>
            <textarea className="inp" rows={2} value={cfg.abordagem} onChange={e=>setCfg({...cfg,abordagem:e.target.value})} placeholder="Como trabalha, a sua filosofia..." />
            <span className="lbl">Credenciais / Formação</span>
            <input className="inp" value={cfg.credenciais} onChange={e=>setCfg({...cfg,credenciais:e.target.value})} placeholder="Ex: Psicóloga · Cédula 12345" />
          </div>

          <div className="card">
            <div className="card-t">💼 Serviços</div>
            {cfg.servicos.map((s,i)=>(
              <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:7}}>
                <div style={{display:"flex",gap:6,marginBottom:5}}>
                  <input className="inp" value={s.nome} onChange={e=>updServico(i,"nome",e.target.value)} placeholder="Nome do serviço" style={{flex:1}} />
                  <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delServico(i)}>✕</button>
                </div>
                <input className="inp mb8" value={s.desc} onChange={e=>updServico(i,"desc",e.target.value)} placeholder="Descrição breve" />
                <div className="g2">
                  <input className="inp" value={s.duracao} onChange={e=>updServico(i,"duracao",e.target.value)} placeholder="60 min" />
                  <input className="inp" value={s.preco} onChange={e=>updServico(i,"preco",e.target.value)} placeholder="€50" />
                </div>
              </div>
            ))}
            <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={addServico}>+ Adicionar serviço</button>
          </div>

          <div className="card">
            <div className="card-t">⭐ Testemunhos</div>
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
          </div>

          {/* Secções de venda */}
          {[
            ["formacoes","🎓 Formações / Workshops",{ nome:"", desc:"", data:"", preco:"", vagas:"" },true],
            ["produtos","🛍️ Produtos à Venda",{ nome:"", desc:"", preco:"" },false],
            ["atividades","📝 Atividades / Inscrições",{ nome:"", desc:"", data:"", preco:"" },true],
          ].map(([lista,titulo,modelo,temData])=>(
            <div className="card" key={lista}>
              <div className="card-t">{titulo}</div>
              {(cfg[lista]||[]).map((it,i)=>(
                <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:7}}>
                  <div style={{display:"flex",gap:6,marginBottom:5}}>
                    <input className="inp" value={it.nome} onChange={e=>updItem(lista,i,"nome",e.target.value)} placeholder="Nome" style={{flex:1}} />
                    <button className="btn btn-d btn-sm" style={{padding:"3px 8px"}} onClick={()=>delItem(lista,i)}>✕</button>
                  </div>
                  <input className="inp mb8" value={it.desc} onChange={e=>updItem(lista,i,"desc",e.target.value)} placeholder="Descrição" />
                  <div className="g2">
                    <input className="inp" value={it.preco} onChange={e=>updItem(lista,i,"preco",e.target.value)} placeholder="€" />
                    {temData
                      ? <input className="inp" value={it.data||""} onChange={e=>updItem(lista,i,"data",e.target.value)} placeholder="Data/Horário" />
                      : <div />}
                  </div>
                  {lista==="formacoes" && <input className="inp" style={{marginTop:6}} value={it.vagas||""} onChange={e=>updItem(lista,i,"vagas",e.target.value)} placeholder="Vagas (ex: 12 vagas)" />}
                </div>
              ))}
              <button className="btn btn-s btn-sm" style={{width:"100%"}} onClick={()=>addItem(lista,modelo)}>+ Adicionar</button>
            </div>
          ))}

          <div className="card">
            <div className="card-t">📞 Contactos e Horário</div>
            <div className="g2">
              <div><span className="lbl">Telefone</span><input className="inp" value={cfg.telefone} onChange={e=>setCfg({...cfg,telefone:e.target.value})} /></div>
              <div><span className="lbl">Email</span><input className="inp" value={cfg.email} onChange={e=>setCfg({...cfg,email:e.target.value})} /></div>
            </div>
            <div className="g2">
              <div><span className="lbl">Instagram</span><input className="inp" value={cfg.instagram} onChange={e=>setCfg({...cfg,instagram:e.target.value})} placeholder="sem @" /></div>
              <div><span className="lbl">Facebook</span><input className="inp" value={cfg.facebook} onChange={e=>setCfg({...cfg,facebook:e.target.value})} /></div>
            </div>
            <span className="lbl">Horário</span>
            <input className="inp" value={cfg.horario} onChange={e=>setCfg({...cfg,horario:e.target.value})} />
          </div>

          <button className="btn btn-p" style={{width:"100%",padding:"12px 0",fontSize:".85rem"}} onClick={salvar}>💾 Guardar Mini-site</button>
        </div>
      ) : (
        <SitePreview cfg={cfg} />
      )}
    </div>
  );
}

// Pré-visualização e página pública partilham o mesmo render
function SitePreview({ cfg }) {
  const cor = cfg.cor || "#00c6b8";
  return (
    <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:12,overflow:"hidden",maxWidth:560,margin:"0 auto"}}>
      {/* Hero */}
      <div style={{padding:"30px 20px",background:`linear-gradient(135deg,${cor}18,#050810)`,textAlign:"center"}}>
        {cfg.logo && <img src={cfg.logo} style={{maxHeight:50,marginBottom:12,objectFit:"contain"}} />}
        {cfg.foto && <img src={cfg.foto} style={{width:88,height:88,borderRadius:"50%",objectFit:"cover",border:`3px solid ${cor}`,marginBottom:12}} />}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.7rem",color:"#dde4f0",marginBottom:4}}>{cfg.nomePratica || "O seu nome / prática"}</div>
        {cfg.subtitulo && <div style={{fontSize:".82rem",color:cor,marginBottom:8,letterSpacing:.5}}>{cfg.subtitulo}</div>}
        {cfg.credenciais && <div style={{fontSize:".66rem",color:"#5a7a9a"}}>{cfg.credenciais}</div>}
      </div>

      <div style={{padding:"18px 18px 30px"}}>
        {cfg.bio && <div style={{marginBottom:18}}>
          <div style={{fontSize:".6rem",color:cor,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Sobre</div>
          <div style={{fontSize:".82rem",color:"#b0c4d8",lineHeight:1.7}}>{cfg.bio}</div>
        </div>}
        {cfg.abordagem && <div style={{marginBottom:18}}>
          <div style={{fontSize:".6rem",color:cor,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Abordagem</div>
          <div style={{fontSize:".78rem",color:"#7a98b8",lineHeight:1.7}}>{cfg.abordagem}</div>
        </div>}

        {cfg.servicos?.length>0 && <div style={{marginBottom:18}}>
          <div style={{fontSize:".6rem",color:cor,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Serviços</div>
          {cfg.servicos.map((s,i)=>(
            <div key={i} style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:8,padding:12,marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
                <span style={{fontSize:".82rem",fontWeight:600,color:"#dde4f0"}}>{s.nome}</span>
                <span style={{fontSize:".82rem",color:cor,fontWeight:700}}>{s.preco}</span>
              </div>
              {s.desc && <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:3}}>{s.desc}</div>}
              {s.duracao && <div style={{fontSize:".64rem",color:"#3d5a7a"}}>⏱ {s.duracao}</div>}
            </div>
          ))}
        </div>}

        {cfg.testemunhos?.length>0 && <div style={{marginBottom:18}}>
          <div style={{fontSize:".6rem",color:cor,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Testemunhos</div>
          {cfg.testemunhos.map((t,i)=>(
            <div key={i} style={{background:`${cor}0a`,borderLeft:`3px solid ${cor}`,borderRadius:"0 8px 8px 0",padding:"10px 12px",marginBottom:7}}>
              <div style={{fontSize:".76rem",color:"#b0c4d8",fontStyle:"italic",lineHeight:1.6}}>"{t.texto}"</div>
              {t.nome && <div style={{fontSize:".64rem",color:cor,marginTop:5}}>— {t.nome}</div>}
            </div>
          ))}
        </div>}

        {/* Secções de venda */}
        {[
          ["formacoes","Formações & Workshops","🎓"],
          ["atividades","Atividades & Inscrições","📝"],
          ["produtos","Produtos","🛍️"],
        ].map(([lista,titulo,icon])=>(
          (cfg[lista]?.length>0) && (
            <div key={lista} style={{marginBottom:18}}>
              <div style={{fontSize:".6rem",color:cor,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{icon} {titulo}</div>
              {cfg[lista].map((it,i)=>{
                const num = (cfg.telefone||"").replace(/[^0-9]/g,"");
                const acao = lista==="produtos"?"comprar":"inscrever-me em";
                const msg = `Olá! Tenho interesse em ${acao} "${it.nome}"${it.preco?` (${it.preco})`:""}.`;
                return (
                  <div key={i} style={{background:"#0a0e18",border:"1px solid #0d1828",borderRadius:8,padding:12,marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
                      <span style={{fontSize:".82rem",fontWeight:600,color:"#dde4f0"}}>{it.nome}</span>
                      {it.preco && <span style={{fontSize:".82rem",color:cor,fontWeight:700}}>{it.preco}</span>}
                    </div>
                    {it.desc && <div style={{fontSize:".7rem",color:"#5a7a9a",marginBottom:5,lineHeight:1.5}}>{it.desc}</div>}
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      {it.data && <span style={{fontSize:".64rem",color:"#3d5a7a"}}>📅 {it.data}</span>}
                      {it.vagas && <span style={{fontSize:".64rem",color:"#3d5a7a"}}>👥 {it.vagas}</span>}
                    </div>
                    {num && <a href={`https://wa.me/${num}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:8,padding:"7px 14px",borderRadius:7,background:cor,color:"#04221f",fontSize:".72rem",fontWeight:700,textDecoration:"none"}}>{lista==="produtos"?"🛒 Comprar":"✋ Inscrever-me"}</a>}
                  </div>
                );
              })}
            </div>
          )
        ))}

        {/* Contactos / CTA */}
        <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>
          {cfg.telefone && <a href={`https://wa.me/${cfg.telefone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer" style={{padding:"9px 16px",borderRadius:8,background:cor,color:"#04221f",fontSize:".76rem",fontWeight:700,textDecoration:"none"}}>📱 Marcar / Contactar</a>}
          {cfg.email && <a href={`mailto:${cfg.email}`} style={{padding:"9px 16px",borderRadius:8,border:`1px solid ${cor}`,color:cor,fontSize:".76rem",textDecoration:"none"}}>✉️ Email</a>}
          {cfg.instagram && <a href={`https://instagram.com/${cfg.instagram}`} target="_blank" rel="noopener noreferrer" style={{padding:"9px 16px",borderRadius:8,border:"1px solid #0d1828",color:"#7a98b8",fontSize:".76rem",textDecoration:"none"}}>Instagram</a>}
        </div>
        {cfg.horario && <div style={{textAlign:"center",fontSize:".68rem",color:"#3d5a7a",marginTop:14}}>🕐 {cfg.horario}</div>}
      </div>
    </div>
  );
}

// Página pública do mini-site (acedida pelo link ?site=slug)
function SitePublico({ slug }) {
  const [cfg, setCfg] = useState(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    sb.from("profiles").select("config").then(({ data }) => {
      const perfil = (data || []).find(p => p.config?.site_slug === slug);
      if (perfil?.config) setCfg(perfil.config); else setErro(true);
    }).catch(() => setErro(true));
  }, [slug]);
  if (erro) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f",color:"#5a7a9a",textAlign:"center",padding:24}}>Página não encontrada.</div>;
  if (!cfg) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f",color:"#3d5a7a"}}>A carregar...</div>;
  return (
    <div style={{minHeight:"100vh",background:"#07090f",padding:"20px 14px"}}>
      <SitePreview cfg={cfg} />
      <div style={{textAlign:"center",fontSize:".58rem",color:"#1a2840",marginTop:16}}>Criado com VitalDoctor</div>
    </div>
  );
}
