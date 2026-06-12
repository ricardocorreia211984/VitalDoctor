import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PONTOS_POR_SISTEMA, PONTOS, getPonto, CENTROS_VITAIS, PONTOS_ENTRADA } from "./mapaCorporal.js";
import { ESCUDOS, QUESTIONARIO_ESCUDOS, ESCALA_QUESTIONARIO, PERGUNTAS_ABERTURA, CAMINHOS, PROTOCOLO } from "./baseConhecimento.js";
import { MAPEAMENTO_PASSOS, TIPOS_ATENDIMENTO, passosDoTipo, MONITORIZACAO } from "./atendimento.js";
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
html,body,#root{height:100%;background:#07090f;color:#dde4f0;font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1a2840;border-radius:3px}
.fade{animation:fd .3s ease}
@keyframes fd{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.app{display:flex;height:100vh;overflow:hidden}
.sb{width:210px;background:#0a0e18;border-right:1px solid #0d1828;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sb-logo{padding:16px 14px 10px;border-bottom:1px solid #0d1828}
.sb-logo-t{font-family:'Cormorant Garamond',serif;font-size:16px;letter-spacing:3px;background:linear-gradient(135deg,#00c6b8,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sb-logo-v{font-size:8px;color:#1a2840;letter-spacing:1px}
.sb-user{padding:10px 14px;border-bottom:1px solid #0d1828}
.sb-user-n{font-size:12px;font-weight:600;color:#b0c4d8}
.sb-user-p{font-size:9px;color:#2d4a66;margin-top:1px}
.sb-nav{flex:1;padding:5px 0}
.sb-sec{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#131e2e;padding:10px 14px 3px}
.sb-item{display:flex;align-items:center;gap:7px;padding:8px 14px;cursor:pointer;transition:all .15s;font-size:11px;color:#2d4a66;border-left:2px solid transparent}
.sb-item:hover{background:rgba(0,198,184,.04);color:#5ae0d8}
.sb-item.on{background:rgba(0,198,184,.06);color:#00c6b8;border-left-color:#00c6b8}
.sb-item-i{font-size:13px;width:16px;text-align:center;flex-shrink:0}
.sb-foot{padding:10px 14px;border-top:1px solid #0d1828;display:flex;flex-direction:column;gap:5px}
.sb-btn{width:100%;padding:6px;background:transparent;border:1px solid #0d1828;border-radius:5px;color:#2d4a66;font-size:10px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;text-align:center}
.sb-btn:hover{border-color:#ef4444;color:#ef4444}
.main{flex:1;overflow-y:auto}
.main-hdr{padding:12px 18px;border-bottom:1px solid #0d1828;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#07090f;z-index:20}
.main-title{font-family:'Cormorant Garamond',serif;font-size:17px;color:#dde4f0}
.main-body{padding:14px 18px;max-width:860px}
.mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#0a0e18;border-top:1px solid #0d1828;z-index:100}
.mob-inner{display:flex;overflow-x:auto;scrollbar-width:none}
.mob-inner::-webkit-scrollbar{display:none}
.mob-btn{flex:1;min-width:54px;padding:7px 3px 5px;border:none;background:transparent;color:#2d4a66;font-size:8px;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:'DM Sans',sans-serif;transition:color .2s}
.mob-btn.on{color:#00c6b8}
.mob-icon{font-size:16px}
@media(max-width:768px){.sb{display:none}.mob-nav{display:block}.main{padding-bottom:60px}.main-body{padding:10px 10px}}
.card{background:#0a0e18;border:1px solid #0d1828;border-radius:10px;padding:14px;margin-bottom:10px}
.card-t{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#00c6b8;margin-bottom:10px;display:flex;align-items:center;gap:5px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:9px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
@media(max-width:500px){.g2{grid-template-columns:1fr}.g3{grid-template-columns:1fr 1fr}}
.inp{width:100%;background:#050810;border:1px solid #0d1828;border-radius:6px;padding:8px 10px;color:#dde4f0;font-family:'DM Sans',sans-serif;font-size:12px;outline:none;transition:border-color .2s;resize:vertical}
.inp:focus{border-color:#00c6b8}
.inp::placeholder{color:#1a2840}
.lbl{font-size:9px;color:#2d4a66;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;display:block}
.sel{appearance:none;cursor:pointer}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}
.slbl{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#1a2840;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #0d1828}
.btn{border:none;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;padding:8px 14px}
.btn-p{background:linear-gradient(135deg,#00c6b8,#009e92);color:#050810;width:100%}
.btn-p:hover{opacity:.9}
.btn-p:disabled{opacity:.5;cursor:not-allowed}
.btn-g{background:linear-gradient(135deg,#f59e0b,#d97706);color:#050810;width:100%}
.btn-s{background:#0a0e18;border:1px solid #0d1828;color:#3d5a7a;width:100%}
.btn-s:hover{border-color:#00c6b8;color:#00c6b8}
.btn-d{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.btn-sm{padding:5px 10px;font-size:10px;width:auto}
.btn-row{display:flex;gap:7px;margin-top:10px}
.btn-row .btn{flex:1;margin:0}
.al{padding:8px 11px;border-radius:6px;border-left:3px solid;margin-bottom:7px;font-size:11px;line-height:1.6}
.al-i{background:rgba(0,198,184,.05);border-color:#00c6b8;color:#5ae0d8}
.al-w{background:rgba(251,191,36,.05);border-color:#fbbf24;color:#fde68a}
.al-d{background:rgba(239,68,68,.06);border-color:#ef4444;color:#fca5a5}
.al-ok{background:rgba(16,185,129,.05);border-color:#10b981;color:#6ee7b7}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.chip{padding:3px 9px;border-radius:12px;border:1px solid #0d1828;background:#050810;font-size:10px;cursor:pointer;transition:all .13s;color:#2d4a66;user-select:none}
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
  const [pagamentos, setPagamentos] = useState([]);
  const [novoPag, setNovoPag] = useState({ descricao:"",valor:"",status:"pago",forma:"MBWay",data:hoje() });
  const [novoCons, setNovoCons] = useState({ data:hoje(),tipo:"Consulta",notas:"" });
  const [load, setLoad] = useState(false);
  const [materiais, setMateriais] = useState([]);
  const [novoMat, setNovoMat] = useState({ nome:"", url:"" });
  const [sala, setSala] = useState("");
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

  const abrirPac = async (p) => {
    setSel(p); setTab("info");
    setSala(`https://meet.jit.si/VitalDoctor-${p.id}`);
    const { data: cs } = await sb.from("consultas").select("*").eq("paciente_id", p.id).order("data", { ascending: false });
    const { data: pg } = await sb.from("pagamentos").select("*").eq("paciente_id", p.id).order("data", { ascending: false });
    const { data: mt } = await sb.from("materiais").select("*").eq("paciente_id", p.id).order("created_at", { ascending: false });
    setConsultas(cs || []);
    setPagamentos(pg || []);
    setMateriais(mt || []);
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
          {[["info","Info"],["consultas","Consultas"],["pagamentos","Pagamentos"],["online","Online"],["notas","Notas"]].map(([k,l]) => (
            <button key={k} className={`chip ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === "info" && (
          <div style={{fontSize:11,color:"#7a8fa8",lineHeight:1.8}}>
            {sel.data_nasc && <div><span style={{color:"#2d4a66"}}>Nascimento:</span> {fmtData(sel.data_nasc)}</div>}
            {sel.forma_pag && <div><span style={{color:"#2d4a66"}}>Pagamento:</span> {sel.forma_pag}</div>}
            {sel.medicacao && <div><span style={{color:"#2d4a66"}}>Medicacao:</span> {sel.medicacao}</div>}
            {sel.alergias && <div><span style={{color:"#2d4a66"}}>Alergias:</span> {sel.alergias}</div>}
          </div>
        )}
        {tab === "consultas" && (
          <div>
            {consultas.map((c,i) => (
              <div key={i} style={{padding:"7px 0",borderBottom:"1px solid #0d1828",fontSize:11,color:"#7a8fa8"}}>
                <strong style={{color:"#b0c4d8"}}>{fmtData(c.data)}</strong> — {c.tipo}
                {c.notas && <div style={{fontSize:10,color:"#3d5a7a"}}>{c.notas}</div>}
              </div>
            ))}
            <div style={{marginTop:10,background:"#050810",border:"1px solid #0d1828",borderRadius:7,padding:10}}>
              <div className="slbl">Adicionar Consulta</div>
              <div className="g2">
                <div><span className="lbl">Data</span><input className="inp" type="date" value={novoCons.data} onChange={e => setNovoCons({...novoCons,data:e.target.value})} /></div>
                <div><span className="lbl">Tipo</span><select className="inp sel" value={novoCons.tipo} onChange={e => setNovoCons({...novoCons,tipo:e.target.value})}><option>Consulta</option><option>Mapeamento</option><option>Pack 1</option><option>Pack 2</option><option>Pack 3</option><option>Seguimento</option></select></div>
              </div>
              <div className="mb8"><span className="lbl">Notas</span><textarea className="inp" rows={2} value={novoCons.notas} onChange={e => setNovoCons({...novoCons,notas:e.target.value})} /></div>
              <button className="btn btn-p btn-sm" style={{width:"100%"}} onClick={addConsulta}>+ Adicionar</button>
            </div>
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
  const [vista, setVista] = useState("semana");
  const [modal, setModal] = useState(false);
  const [semOff, setSemOff] = useState(0);
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
            <button className={`chip ${vista==="semana"?"on":""}`} onClick={() => setVista("semana")}>Semana</button>
            <button className={`chip ${vista==="lista"?"on":""}`} onClick={() => setVista("lista")}>Lista</button>
            <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={() => setModal(true)}>+ Marcacao</button>
          </div>
        </div>
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
  const tornarAdmin = async (id) => {
    await sb.from("profiles").update({ role:"admin" }).eq("id", id);
    setUsers(users.map(u=>u.id===id?{...u,role:"admin"}:u));
    setOk("Admin atribuído!"); setTimeout(()=>setOk(""),2000);
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
  const TABS = [["users","👥 Subscritores"],["conteudo","📝 Conteúdo"],["formularios","🛠️ Formulários"],["modulos","🧩 Módulos"],["hotmart","💳 Hotmart"],["audio","🎧 Áudios"],["stats","📊 Stats"]];
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

      {aba==="users" && (
        <div>
          <div className="al al-i" style={{marginBottom:8,fontSize:10}}>{users.length} contas · Módulo especializado activo: {users.filter(u=>(u.modulos_ativos||[]).includes("avancado")).length}</div>
          {users.map(u=>(
            <div key={u.id} className="admin-section">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:"#b0c4d8"}}>{u.nome}</div>
                  <div style={{fontSize:9,color:"#2d4a66"}}>{u.email} · {u.role}</div>
                </div>
                {u.role!=="superadmin"&&u.role!=="admin"&&<button className="btn btn-s btn-sm" style={{fontSize:9}} onClick={()=>tornarAdmin(u.id)}>Admin</button>}
              </div>
              <div className="admin-row">
                <span style={{fontSize:10,color:"#3d5a7a"}}>Plano</span>
                <select className="inp sel" value={u.plano||"trial"} onChange={e=>mudarPlano(u.id,e.target.value)} style={{width:"auto",padding:"3px 22px 3px 7px",fontSize:10}}>
                  <option value="trial">Trial</option><option value="base">Base €10</option><option value="pro">Pro €18</option><option value="elite">Elite €23</option>
                </select>
              </div>
              {[["avancado","🧠 Módulo Especializado"],["audios","🎧 Áudios"],["minisite","🌐 Mini Site"]].map(([mod,label])=>(
                <div key={mod}>
                  <div className="admin-row">
                    <span style={{fontSize:10,color:"#3d5a7a"}}>{label}</span>
                    <button className={`tw ${(u.modulos_ativos||[]).includes(mod)?"on":"off"}`} onClick={()=>toggleMod(u.id,mod)} />
                  </div>
                  {mod==="avancado"&&(u.modulos_ativos||[]).includes(mod)&&(
                    <div className="admin-row" style={{paddingLeft:10}}>
                      <span style={{fontSize:9,color:"#2d4a66"}}>Válido até (vazio=vitalício)</span>
                      <input type="date" style={{background:"#040810",border:"1px solid #0d1828",borderRadius:4,padding:"2px 6px",fontSize:9,color:"#b0c4d8"}}
                        value={u.preferencias?.modulos_validade?.avancado||""}
                        onChange={e=>setValidade(u.id,"avancado",e.target.value||null)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
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

  const isAdmin = perfil?.role === "admin" || perfil?.role === "superadmin";
  const temMod = (m) => {
    if (isAdmin) return true;
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
    ]},
    ...(temMod("avancado") ? [{ t:"Especializado", items:[{ id:"metodo",icon:"🧠",l:"Atendimento Especializado" }] }] : []),
    ...(temMod("minisite") ? [{ t:"Pratica", items:[{ id:"minisite",icon:"🌐",l:"Mini Site" }] }] : []),
    ...(isAdmin ? [{ t:"Admin", items:[{ id:"admin",icon:"⚙️",l:"Painel Admin" }] }] : []),
  ];

  const TITULOS = {
    dashboard:"Dashboard", pacientes:"Pacientes", agenda:"Agenda",
    metodo:"Atendimento Especializado", minisite:"Mini Site",
    admin:"Painel Admin",
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
  if (!user) return <><style>{CSS}</style><Auth onLogin={(u) => {
    if (u && !jaAceitouTermos(u.id)) setMostrarTermos(true);
  }} /></>;

  return (
    <>
      <style>{CSS}</style>
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
            {mod === "agenda"    && <Agenda user={perfil} pacs={pacs} agenda={agenda} setAgenda={setAgenda} />}
            {mod === "metodo"    && temMod("avancado") && <ModuloMetodo user={perfil} adminMode={isAdmin} initAba={metodoTab} voltar={() => navegar("dashboard")} />}
            {mod === "minisite"  && <MiniSite user={perfil} />}
            {mod === "admin"     && isAdmin && <AdminPanel user={perfil} />}
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
// MAPEAMENTO — com initConsulta para lançar directo dos tipos
// ══════════════════════════════════════════════════════
function Mapeamento({ user, initConsulta }) {
  const [etapa, setEtapa] = useState(initConsulta ? "dados" : "tipo");
  const [tipoSel, setTipoSel] = useState(initConsulta?.tipo || null);
  const [subSel, setSubSel] = useState(initConsulta?.sub || null);
  const [notas, setNotas] = useState({});
  const [caminhoSel, setCaminhoSel] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [escudoScores, setEscudoScores] = useState({});
  const [protocolDur, setProtocolDur] = useState(7);
  const [protocolChecks, setProtocolChecks] = useState([...PROTOCOLO.componentes]);
  const [devolutivaText, setDevolutivaText] = useState("");
  const [dados, setDados] = useState({ nome:"", dataNasc:"", dataAval: new Date().toISOString().slice(0,10), medicacao:"", paciente_id:"" });
  const [face, setFace] = useState("frente");
  const [vitais, setVitais] = useState([]);
  const [entrada, setEntrada] = useState([]);
  const [lateral, setLateral] = useState("");
  const [sel, setSel] = useState([]);
  const [escudo, setEscudo] = useState("");
  const [sexo, setSexo] = useState("feminino");
  const [dias, setDias] = useState(7);
  const [modo, setModo] = useState("criadora");
  const [guia, setGuia] = useState(false);
  const [res, setRes] = useState(null);

  const [pacs, setPacs] = useState([]);
  useEffect(() => { sb.from("pacientes").select("id,nome,data_nasc,medicacao,genero").eq("terapeuta_id", user?.id).order("nome").then(({ data }) => setPacs(data || [])); }, []);
  const matches = (dados.nome.trim().length >= 2 && !dados.paciente_id)
    ? pacs.filter(p => (p.nome || "").toLowerCase().includes(dados.nome.trim().toLowerCase())).slice(0, 6)
    : [];
  const escolherPac = (p) => setDados(d => ({ ...d, paciente_id: p.id, nome: p.nome, dataNasc: p.data_nasc || d.dataNasc, medicacao: p.medicacao || d.medicacao }));
  const iniciarMap = async () => {
    let id = dados.paciente_id;
    if (!id && dados.nome.trim()) {
      const { data } = await sb.from("pacientes").insert({ nome: dados.nome.trim(), data_nasc: dados.dataNasc || null, medicacao: dados.medicacao || null, genero: sexo, terapeuta_id: user?.id }).select().single();
      if (data) { id = data.id; setDados(d => ({ ...d, paciente_id: id })); setPacs(ps => [...ps, data]); }
    }
    const ps = getPassosLocal(tipoSel);
    setEtapa(ps.some(p => p.id === "mapeamento") ? "mapa" : "passos");
  };

  const togLocal = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const add = (p) => setSel(s => [...s, { key: p.id+"-"+face+"-"+Math.random().toString(36).slice(2,7), id:p.id, nome:p.nome, sistema:p.sistema, lado:"direito", face }]);
  const setLado = (k,l) => setSel(s => s.map(x => x.key===k ? {...x,lado:l} : x));
  const rm = (k) => setSel(s => s.filter(x => x.key!==k));
  const sugerir = () => { const c={}; sel.forEach(x=>(getPonto(x.id)?.escudos||[]).forEach(e=>c[e]=(c[e]||0)+1)); const t=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; if(t)setEscudo(t[0]); };
  const gerar = () => setRes(gerarProtocoloCura({ paciente:{nome:dados.nome}, sexo, escudo, protocoloDias:dias, modo, mapeamento: sel.map(x=>({id:x.id,lado:x.lado,face:x.face})) }));

  const imprimir = (txt) => { const w=window.open("","_blank"); w.document.write(`<html><body style="font-family:sans-serif;padding:24px;max-width:700px"><pre style="white-space:pre-wrap;font-size:13px">${txt.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre></body></html>`); w.document.close(); w.print(); };

  const gerarPDFConsulta = ({ paciente: nomePac, dataAval, dataNasc, medicacao, tipo, escudoAtivo, lateralidade, pontos, protocolo, notas }) => {
    const agora = new Date().toLocaleDateString("pt-PT");
    const escudoNome = ESCUDOS.find(e => e.id === escudoAtivo)?.nome || escudoAtivo || "—";
    const pontosHtml = (pontos || []).map(x => {
      const p = getPonto(x.id);
      return `<div style="margin-bottom:12px;padding:10px;background:#f9f9f9;border-left:3px solid #1a6b61;border-radius:4px">
        <strong>${p?.nome || x.id}</strong> <span style="color:#666;font-size:11px">(${x.lado || ""} · ${x.face || ""})</span>
        ${p?.aspectos ? `<div style="margin-top:4px;font-size:12px"><em>Aspecto emocional:</em> ${p.aspectos}</div>` : ""}
        ${p?.sintomas ? `<div style="font-size:12px"><em>Sinais no corpo:</em> ${p.sintomas}</div>` : ""}
        ${p?.frase ? `<div style="font-size:12px;color:#1a6b61"><em>Pergunta terapêutica:</em> "${p.frase}"</div>` : ""}
      </div>`;
    }).join("");
    const protocoloHtml = protocolo ? `<pre style="white-space:pre-wrap;font-size:12px;background:#f0faf9;padding:14px;border-radius:6px;border:1px solid #c0e0dc">${protocolo.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre>` : "";
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8">
      <title>Relatório — ${nomePac}</title>
      <style>
        body{font-family:'Georgia',serif;margin:0;padding:0;color:#1a1a2e}
        .pg{padding:32px 40px;max-width:720px;margin:0 auto}
        .hdr{border-bottom:3px solid #1a6b61;padding-bottom:16px;margin-bottom:24px}
        .logo{font-size:22px;letter-spacing:4px;color:#1a6b61;font-weight:bold}
        .sub{font-size:10px;color:#666;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
        h2{font-size:16px;color:#1a1a2e;margin:0 0 4px}
        .meta{font-size:11px;color:#666;margin-bottom:20px}
        .sec{margin-bottom:24px}
        .sec-t{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1a6b61;border-bottom:1px solid #c0e0dc;padding-bottom:4px;margin-bottom:12px;font-weight:bold}
        .escudo{background:linear-gradient(135deg,#1a6b61,#0d4a42);color:white;padding:12px 18px;border-radius:8px;margin-bottom:16px}
        .escudo-n{font-size:18px;font-weight:bold}
        .escudo-s{font-size:11px;opacity:.8;margin-top:3px}
        .disc{font-size:9px;color:#999;border-top:1px solid #eee;padding-top:12px;margin-top:24px;line-height:1.6}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style>
    </head><body>
    <div class="pg">
      <div class="hdr">
        <div class="logo">VITALDOCTOR</div>
        <div class="sub">Relatório de Atendimento Terapêutico</div>
      </div>
      <h2>${nomePac}</h2>
      <div class="meta">
        Data da avaliação: ${dataAval || agora}
        ${dataNasc ? ` · Nascimento: ${dataNasc}` : ""}
        ${tipo ? ` · Tipo: ${tipo}` : ""}
        ${medicacao ? `<br>Medicação: ${medicacao}` : ""}
      </div>
      ${escudoAtivo ? `<div class="sec">
        <div class="sec-t">Escudo Emocional Identificado</div>
        <div class="escudo">
          <div class="escudo-n">${escudoNome}</div>
          <div class="escudo-s">${lateralidade ? "Lateralidade: " + lateralidade : "Registo de memórias celulares identificado no mapeamento energético"}</div>
        </div>
      </div>` : ""}
      ${pontos?.length ? `<div class="sec"><div class="sec-t">Pontos Identificados no Mapeamento</div>${pontosHtml}</div>` : ""}
      ${protocolo ? `<div class="sec"><div class="sec-t">Protocolo de Cura — Para Aplicar em Casa</div>
        <div style="font-size:11px;color:#666;margin-bottom:8px;font-style:italic">Este protocolo foi elaborado especificamente para si. Siga as orientações do seu terapeuta com regularidade para melhores resultados.</div>
        ${protocoloHtml}
      </div>` : ""}
      ${notas ? `<div class="sec"><div class="sec-t">Notas da Sessão</div><div style="font-size:12px;line-height:1.7">${notas}</div></div>` : ""}
      <div class="disc">
        <strong>Aviso Legal:</strong> Este relatório foi gerado pela aplicação VitalDoctor como ferramenta de apoio ao atendimento terapêutico. Não constitui diagnóstico médico nem substitui avaliação clínica especializada. O conteúdo é da responsabilidade exclusiva do terapeuta que realizou o atendimento. Qualquer alteração de medicação ou tratamento médico deve ser sempre discutida com o médico prescritor.
        <br>VitalDoctor · vitaldoctor.netlify.app · Dados protegidos ao abrigo do RGPD · ${agora}
      </div>
    </div>
    </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };
  const guardar = async () => { if(!res) return; try { await sb.from("consultas").insert({ paciente_id:dados.paciente_id||null, paciente_nome:dados.nome, data_avaliacao:dados.dataAval, data_nascimento:dados.dataNasc||null, medicacao:dados.medicacao||null, tipo:"mapeamento", escudo_ativo:escudo, pontos:sel, centros_vitais:vitais, pontos_entrada:entrada, lateralidade:lateral, protocolo:res.texto, terapeuta_id:user?.id }); alert("Guardado na ficha! ✅"); } catch { alert("Erro ao guardar. Verifica a tabela 'consultas' no Supabase."); } };

  const tipoObj = tipoSel ? (getTipoLocal(tipoSel) || null) : null;
  const subObj = null;
  const passosAtuais = tipoSel ? getPassosLocal(tipoSel) : [];
  const temMapeamento = passosAtuais.some(p => p.id === "mapeamento");
  const podeAvancar = !!tipoObj;

  const guardarGuia = async () => {
    if (!dados.nome.trim()) { alert("Falta o nome do paciente."); return; }
    let id = dados.paciente_id;
    if (!id) {
      const { data } = await sb.from("pacientes").insert({ nome: dados.nome.trim(), data_nasc: dados.dataNasc||null, medicacao: dados.medicacao||null, genero: sexo, terapeuta_id: user?.id }).select().single();
      if (data) id = data.id;
    }
    const resumo = devolutivaText ||
      (`${tipoObj?.nome||""}${subObj?` · ${subObj.nome}`:""}\n\n` +
      passosAtuais.map((p,i)=>`${i+1}. ${p.titulo}`).join("\n") +
      (caminhoSel ? `\n\nCaminho: ${CAMINHOS.find(c=>c.id===caminhoSel)?.nome||""}` : "") +
      (protocolChecks.length ? `\n\nProtocolo (${protocolDur} dias):\n${protocolChecks.map(c=>`• ${c}`).join("\n")}` : "") +
      (notas.protocolo ? `\n\n${notas.protocolo}` : ""));
    try {
      await sb.from("consultas").insert({ paciente_id:id||null, paciente_nome:dados.nome, data_avaliacao:dados.dataAval, data_nascimento:dados.dataNasc||null, medicacao:dados.medicacao||null, tipo:tipoSel, protocolo:resumo, terapeuta_id:user?.id });
      alert("✅ Consulta guardada na ficha!");
      setEtapa("tipo"); setTipoSel(null); setSubSel(null); setStepIdx(0); setNotas({}); setCaminhoSel(null); setEscudoScores({}); setDevolutivaText(""); setProtocolChecks([...PROTOCOLO.componentes]);
    } catch { alert("Erro ao guardar. Verifica a tabela 'consultas'."); }
  };

  // ── ECRÃ: Selecção de tipo (quando initConsulta não existe)
  if (etapa === "tipo") return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Tipo de atendimento</div>
        <div className="al al-i" style={{fontSize:10}}>Escolhe o tipo de consulta. A app mostra o passo a passo para te guiar. Nem todos os tipos usam o mapeamento do corpo.</div>
        {TIPOS_CONSULTA_LOCAL.map(x => (
          <div key={x.id} className="admin-section" style={{cursor:"pointer",borderColor: tipoSel===x.id ? "#00c6b8" : undefined, marginTop:6}} onClick={()=>{setTipoSel(x.id);setSubSel(null);setStepIdx(0);setNotas({});setCaminhoSel(null);setEscudoScores({});setDevolutivaText("");}}>
            <div style={{fontWeight:700,fontSize:12,color:"#b0c4d8"}}>{x.nome}</div>
            <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{x.indicado}</div>
            {x.nota && <div style={{fontSize:9,color:"#2d4a66",marginTop:2}}>{x.nota}</div>}
          </div>
        ))}
      </div>

      {tipoObj?.subconsultas && (
        <div className="card">
          <div className="card-t">Qual sessão?</div>
          {tipoObj.subconsultas.map(sc => (
            <div key={sc.id} className="admin-section" style={{cursor:"pointer",borderColor: subSel===sc.id ? "#00c6b8" : undefined, marginTop:6}} onClick={()=>{setSubSel(sc.id);setStepIdx(0);}}>
              <div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{sc.nome}</div>
              {sc.nota && <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>{sc.nota}</div>}
            </div>
          ))}
        </div>
      )}

      {podeAvancar && (
        <div className="card">
          <div className="card-t">Passo a passo {temMapeamento ? "· inclui mapeamento" : "· sem mapeamento"}</div>
          <ol style={{margin:"0 0 0 16px",padding:0,fontSize:11,color:"#5a7a9a"}}>
            {passosAtuais.map(p => <li key={p.id} style={{marginBottom:6}}><strong style={{color:"#b0c4d8"}}>{p.titulo}</strong>{p.descricao ? ` — ${p.descricao}` : ""}</li>)}
          </ol>
          <button className="btn btn-p" style={{marginTop:10}} onClick={()=>setEtapa("dados")}>Continuar para dados do paciente →</button>
        </div>
      )}
    </div>
  );

  // ── ECRÃ: Passos guiados
  if (etapa === "passos") {
    const passo = passosAtuais[stepIdx];
    const isLast = stepIdx === passosAtuais.length - 1;
    const escDom = ESCUDOS.reduce((best,e)=>((escudoScores[e.id]||0)>(escudoScores[best?.id]||0)?e:best), ESCUDOS[0]);

    const gerarDevolutiva = () => {
      const e = escDom;
      const cam = CAMINHOS.find(c=>c.id===caminhoSel);
      const pNome = dados.nome || "paciente";
      const resps = PERGUNTAS_ABERTURA.map((q,qi)=>notas["q"+qi]?`• ${q}\n  → ${notas["q"+qi]}`:null).filter(Boolean).join("\n");
      const monit = MONITORIZACAO_LOCAL.map((q,qi)=>notas["m"+qi]?`• ${q}\n  → ${notas["m"+qi]}`:null).filter(Boolean).join("\n");
      return `DEVOLUTIVA — ${tipoObj?.nome||""}${subObj?` · ${subObj.nome}`:""}\nPaciente: ${pNome} | Data: ${dados.dataAval||""}\n\n` +
        `ESCUDO DOMINANTE: ${e.nome}\n"${e.sentenca}"\n\nFOCO: ${e.foco}\n\nORIGEM:\n${e.origem}\n\nIMPACTO NO CORPO: ${e.corpo}\n\nORIENTAÇÃO:\n${e.devolutiva}\n\n` +
        (cam?`CAMINHO: ${cam.nome}\n${cam.passos.map(p=>`• ${p}`).join("\n")}\n\n`:"") +
        (resps?`PERGUNTAS DE ABERTURA:\n${resps}\n\n`:"") +
        (monit?`MONITORIZAÇÃO:\n${monit}\n\n`:"") +
        `PROTOCOLO (${protocolDur} dias):\n${protocolChecks.map(c=>`• ${c}`).join("\n")}`;
    };

    // Índice do caminho: 0=consciente, 1=mapeamento/subconsciente, 2=estressores
    const caminhoIdx = CAMINHOS.findIndex(c => c.id === caminhoSel);
    const isCaminhoMapa = caminhoIdx === 1;
    const isCaminhoEstressores = caminhoIdx === 2;

    const avancar = () => {
      // Caminho 2 (Mente Subconsciente) → vai para mapeamento corporal
      if (passo.id === "caminho" && isCaminhoMapa) {
        setEtapa("mapa");
        return;
      }
      if (passo.id==="devolutiva" && !devolutivaText) setDevolutivaText(gerarDevolutiva());
      if (isLast) { guardarGuia(); return; }
      setStepIdx(i=>i+1);
    };

    return (
      <div className="fade">
        <div className="card" style={{paddingBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>{if(stepIdx>0)setStepIdx(i=>i-1);else setEtapa("dados");}}>←</button>
            <div style={{fontSize:11,color:"#5a7a9a",textAlign:"center"}}>
              <strong style={{color:"#b0c4d8"}}>{tipoObj?.nome}{subObj?` · ${subObj.nome}`:""}</strong><br/>
              Passo {stepIdx+1} de {passosAtuais.length}
            </div>
            <div style={{fontSize:10,color:"#00c6b8"}}>{dados.nome||"paciente"}</div>
          </div>
          <div style={{height:4,background:"#1a2a3a",borderRadius:2,marginTop:8}}>
            <div style={{height:4,background:"#00c6b8",borderRadius:2,width:`${((stepIdx+1)/passosAtuais.length)*100}%`,transition:"width .3s"}}/>
          </div>
        </div>

        <div className="card">
          <div className="card-t">🔹 {passo.titulo}</div>
          {passo.descricao && <div style={{fontSize:11,color:"#5a7a9a",marginBottom:10,lineHeight:1.6,padding:"8px 10px",background:"#0d1f2d",borderRadius:8,borderLeft:"3px solid #00c6b8"}}>{passo.descricao}</div>}

          {passo.id==="acolhimento" && (
            <div>
              <div style={{background:"#0d2535",border:"1px solid #1a3a5c",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:10,color:"#5ae0d8",lineHeight:1.6}}>
                💙 "Você está seguro aqui. Vamos juntos olhar para o que precisa ser ouvido."
                <div style={{marginTop:6,color:"#3d7a9a"}}>
                  Observe como o paciente chega. Escuta além das palavras: como está o corpo? A respiração? A energia? Se sentir tensão, conduza uma respiração guiada antes de começar.
                </div>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:11,color:"#b0c4d8",fontWeight:600,marginBottom:6}}>Estado emocional predominante</div>
                <div style={{display:"flex",gap:8}}>
                  {[["ansioso","😰 Ansioso(a)","Caminhos rápidos e práticos · respiração, autocuidado, micro-acções"],["depressivo","😔 Depressivo(a)","Acolhimento e leveza · micro metas, segurança emocional"]].map(([k,l,h])=>(
                    <div key={k} onClick={()=>setNotas(n=>({...n,estado_emocional:k}))}
                      style={{flex:1,cursor:"pointer",padding:"10px 12px",borderRadius:8,border:`2px solid ${notas.estado_emocional===k?"#00c6b8":"#1a2a3a"}`,background:notas.estado_emocional===k?"#0d2535":"#0a1620"}}>
                      <div style={{fontWeight:700,fontSize:12,color:"#dde4f0"}}>{l}</div>
                      <div style={{fontSize:9,color:"#3d5a7a",marginTop:4,lineHeight:1.4}}>{h}</div>
                    </div>
                  ))}
                </div>
              </div>
              {notas.estado_emocional && (
                <div style={{background:"rgba(0,198,184,.06)",border:"1px solid rgba(0,198,184,.2)",borderRadius:7,padding:"8px 12px",fontSize:10,color:"#5ae0d8",marginBottom:8}}>
                  {notas.estado_emocional==="ansioso"
                    ? "⚡ Foco: Ofereça acções simples e imediatas. Respiração, organização de rotina, autocuidado."
                    : "💙 Foco: Acolhimento e leveza emocional. Trabalha com micro metas e devolve a sensação de que é possível continuar."}
                </div>
              )}
              <textarea className="inp" rows={3} placeholder="Notas de acolhimento (como chegou, estado geral, observações)..." value={notas.acolhimento||""} onChange={e=>setNotas(n=>({...n,acolhimento:e.target.value}))} />
            </div>
          )}

          {passo.id==="perguntas" && PERGUNTAS_ABERTURA.map((q,qi)=>(
            <div key={qi} style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"#00c6b8",fontWeight:600,marginBottom:4}}>{qi+1}. {q}</div>
              <textarea className="inp" rows={2} style={{resize:"vertical"}} value={notas["q"+qi]||""} onChange={e=>setNotas(n=>({...n,["q"+qi]:e.target.value}))} placeholder="Resposta / notas..." />
            </div>
          ))}

          {passo.id==="caminho" && <>
            {CAMINHOS.map(c=>(
              <div key={c.id} onClick={()=>setCaminhoSel(c.id)} style={{cursor:"pointer",padding:10,marginBottom:8,borderRadius:8,border:`2px solid ${caminhoSel===c.id?"#00c6b8":"#1a2a3a"}`,background:caminhoSel===c.id?"#0d2535":"#0a1620"}}>
                <div style={{fontWeight:700,fontSize:12,color:"#b0c4d8"}}>{c.nome}</div>
                <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{c.indicado}</div>
                <ul style={{margin:"6px 0 0 16px",padding:0,fontSize:10,color:"#4a7a9b"}}>
                  {c.passos.map((s,si)=><li key={si} style={{marginBottom:2}}>{s}</li>)}
                </ul>
              </div>
            ))}
            {/* Caminho 1: Escudos */}
            {caminhoSel==="consciente" && <div style={{marginTop:10}}>
              <div style={{fontSize:11,color:"#b0c4d8",fontWeight:600,marginBottom:6}}>Pontuação dos Escudos (0–10)</div>
              <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>Apresenta os 5 escudos ao paciente. Pede que pontue de 0 a 10 qual sente mais presente hoje.</div>
              {ESCUDOS.map(e=>(
                <div key={e.id} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:11,color:"#b0c4d8",fontWeight:600}}>{e.nome}</div>
                      <div style={{fontSize:9,color:"#5a7a9a"}}>{e.foco}</div>
                    </div>
                    <input type="number" min={0} max={10} style={{width:52,padding:"4px 6px",background:"#0a1620",border:"1px solid #1a3a5a",borderRadius:6,color:"#00c6b8",fontSize:14,fontWeight:700,textAlign:"center"}} value={escudoScores[e.id]||""} onChange={ev=>setEscudoScores(s=>({...s,[e.id]:Number(ev.target.value)}))} placeholder="0" />
                  </div>
                </div>
              ))}
              {Object.keys(escudoScores).length>0 && <div style={{padding:"8px 10px",background:"#0d2535",borderRadius:8,marginTop:6,fontSize:11}}>
                <span style={{color:"#5a7a9a"}}>Escudo dominante: </span>
                <strong style={{color:"#f59e0b"}}>{escDom?.nome}</strong>
                <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{escDom?.sentenca}</div>
              </div>}
            </div>}

            {/* Caminho 2: Mapeamento Energético → avançar vai para o mapa corporal */}
            {isCaminhoMapa && caminhoSel && (
              <div style={{marginTop:10,padding:"10px 14px",background:"#0d2535",border:"1px solid #1a4a5c",borderRadius:8}}>
                <div style={{fontSize:12,color:"#00c6b8",fontWeight:700,marginBottom:4}}>🗺️ Mapeamento Energético</div>
                <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.6}}>
                  Ao clicar em <strong style={{color:"#b0c4d8"}}>"Próximo"</strong> abrirá o mapeamento corporal completo com os 4 mapas:<br/>
                  <span style={{color:"#4a7a9b"}}>Mapa 1 — Centros Vitais · Mapa 2 — Zonas de Impacto · Mapa 3 — Lateralidade · Mapa 4 — Sistemas</span>
                </div>
                <div style={{fontSize:10,color:"#2d4a66",marginTop:6}}>
                  Ideal para: 2ª consulta · Pacientes que já conhecem a técnica · Aceder à raiz profunda do sintoma
                </div>
              </div>
            )}

            {/* Caminho 3: Estressores e Gatilhos */}
            {isCaminhoEstressores && caminhoSel && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:11,color:"#b0c4d8",fontWeight:600,marginBottom:8}}>🔥 Perguntas dos Estressores Ativos</div>
                <div style={{fontSize:10,color:"#5a7a9a",marginBottom:10,lineHeight:1.5}}>
                  Regista as respostas do paciente. Este caminho permite reconhecer padrões e mostrar que fazer o mesmo trará os mesmos resultados.
                </div>
                {[
                  ["e1","1. Quem do seu convívio atual mais te estressa ou altera o teu humor?"],
                  ["e2","2. O que essa pessoa faz ou diz que mais te desestabiliza?"],
                  ["e3","3. Que situações te tiram do foco?"],
                  ["e4","4. Já existiu alguém no passado com esse mesmo papel?"],
                  ["e5","5. O que essas pessoas tinham em comum?"]
                ].map(([k, q]) => (
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:"#00c6b8",fontWeight:600,marginBottom:4}}>{q}</div>
                    <textarea className="inp" rows={2} style={{resize:"vertical"}} value={notas[k]||""} onChange={e=>setNotas(n=>({...n,[k]:e.target.value}))} placeholder="Resposta do paciente..." />
                  </div>
                ))}
              </div>
            )}
          </>}

          {passo.id==="monitorizacao" && MONITORIZACAO_LOCAL.map((q,qi)=>(
            <div key={qi} style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#00c6b8",fontWeight:600,marginBottom:4}}>{q}</div>
              <textarea className="inp" rows={2} style={{resize:"vertical"}} value={notas["m"+qi]||""} onChange={e=>setNotas(n=>({...n,["m"+qi]:e.target.value}))} placeholder="Resposta..." />
            </div>
          ))}

          {passo.id==="devolutiva" && <>
            {!devolutivaText && <button className="btn btn-p" style={{marginBottom:8}} onClick={()=>setDevolutivaText(gerarDevolutiva())}>✨ Gerar devolutiva automática</button>}
            <textarea className="inp" rows={12} style={{resize:"vertical",fontSize:11,lineHeight:1.6}} value={devolutivaText} onChange={e=>setDevolutivaText(e.target.value)} placeholder="A devolutiva aparece aqui após gerar. Podes editar à vontade antes de guardar." />
            {devolutivaText && <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
              <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>navigator.clipboard?.writeText(devolutivaText)}>📋 Copiar texto</button>
              <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={()=>gerarPDFConsulta({paciente:dados.nome,dataAval:dados.dataAval,dataNasc:dados.dataNasc,medicacao:dados.medicacao,tipo:tipoSel,escudoAtivo:Object.entries(escudoScores).sort((a,b)=>b[1]-a[1])[0]?.[0],pontos:[],protocolo:devolutivaText})}>🖨️ Gerar PDF</button>
            </div>}
          </>}

          {passo.id==="protocolo" && <>
            <div style={{background:"rgba(0,198,184,.04)",border:"1px solid rgba(0,198,184,.15)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:11,color:"#5ae0d8",lineHeight:1.6}}>
              🏠 <strong>Protocolo de Cura em Casa</strong> — Este é o trabalho que o paciente vai realizar entre sessões. Define com cuidado: é o que sustenta a transformação fora do consultório.
            </div>
            <div className="lbl">Duração do protocolo</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {PROTOCOLO.duracoes.map(d=>(
                <button key={d} className={`chip ${protocolDur===d?"on":""}`} onClick={()=>setProtocolDur(d)}>{d} dias</button>
              ))}
            </div>
            <div className="lbl">Componentes incluídos</div>
            {PROTOCOLO.componentes.map((c,ci)=>(
              <label key={ci} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer",padding:"8px 10px",background:protocolChecks.includes(c)?"#0d2535":"#050810",border:`1px solid ${protocolChecks.includes(c)?"#1a4a5c":"#0d1828"}`,borderRadius:7,transition:"all .15s"}}>
                <input type="checkbox" checked={protocolChecks.includes(c)} onChange={ev=>{if(ev.target.checked)setProtocolChecks(p=>[...p,c]);else setProtocolChecks(p=>p.filter(x=>x!==c));}} style={{accentColor:"#00c6b8"}} />
                <span style={{fontSize:11,color:protocolChecks.includes(c)?"#b0c4d8":"#3d5a7a"}}>{c}</span>
              </label>
            ))}
            <div style={{marginTop:8}}>
              <span className="lbl">Notas personalizadas do protocolo</span>
              <textarea className="inp" rows={4} placeholder="Áudio específico a enviar · Alimentos a incluir/retirar · Exercícios de respiração · Afirmações · Práticas diárias..." value={notas.protocolo||""} onChange={e=>setNotas(n=>({...n,protocolo:e.target.value}))} />
            </div>
            {protocolChecks.length > 0 && (
              <div style={{marginTop:10,background:"#061020",border:"1px solid #1a3a5c",borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:"#00c6b8",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Protocolo de {protocolDur} dias — {dados.nome || "paciente"}</div>
                {protocolChecks.map((c,i) => <div key={i} style={{fontSize:11,color:"#5a7a9a",marginBottom:3}}>✓ {c}</div>)}
                {notas.protocolo && <div style={{fontSize:11,color:"#5a7a9a",marginTop:6,borderTop:"1px solid #0d1828",paddingTop:6}}>{notas.protocolo}</div>}
              </div>
            )}
          </>}
        </div>

        <div className="card" style={{display:"flex",gap:8}}>
          {stepIdx>0 && <button className="btn btn-s" style={{flex:1}} onClick={()=>setStepIdx(i=>i-1)}>← Anterior</button>}
          <button className="btn btn-p" style={{flex:2}} onClick={avancar}>
            {isLast ? "💾 Guardar consulta na ficha" : `Próximo: ${passosAtuais[stepIdx+1]?.titulo} →`}
          </button>
        </div>
      </div>
    );
  }

  // ── ECRÃ: Dados do paciente
  if (etapa === "dados") return (
    <div className="fade">
      <div className="card">
        <button className="btn btn-s btn-sm" style={{width:"auto",marginBottom:6}} onClick={()=>setEtapa("tipo")}>← {tipoObj?.nome || "Tipo"}</button>
        <div className="card-t">Dados do Paciente</div>
        {tipoObj && (
          <div style={{background:"#0d2535",border:"1px solid #1a3a5c",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:12,color:"#00c6b8"}}>{tipoObj.nome}{subObj?` · ${subObj.nome}`:""}</div>
            <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{passosAtuais.length} passos · {temMapeamento?"inclui mapeamento":"sem mapeamento"}</div>
          </div>
        )}
        <div className="al al-i" style={{fontSize:10}}>Preenche os dados antes de iniciar.</div>
        <div className="lbl" style={{marginTop:8}}>Nome completo *</div>
        <input className="inp" value={dados.nome} onChange={e=>setDados(d=>({...d,nome:e.target.value,paciente_id:""}))} placeholder="Escreve o nome para procurar ou criar..." />
        {matches.length > 0 && (
          <div style={{border:"1px solid #1a3a5c",borderRadius:7,marginTop:3,overflow:"hidden"}}>
            {matches.map(p => (
              <div key={p.id} onClick={()=>escolherPac(p)} style={{padding:"7px 10px",cursor:"pointer",borderBottom:"1px solid #0d1828",fontSize:12,color:"#b0c4d8"}}>
                👤 {p.nome}{p.data_nasc ? <span style={{color:"#2d4a66"}}> · {fmtData(p.data_nasc)}</span> : null}
              </div>
            ))}
          </div>
        )}
        {dados.paciente_id && <div style={{fontSize:10,color:"#00c6b8",marginTop:3}}>✓ Paciente registado — dados preenchidos automaticamente.</div>}
        {!dados.paciente_id && dados.nome.trim().length >= 2 && matches.length === 0 && <div style={{fontSize:10,color:"#f59e0b",marginTop:3}}>Novo paciente — será registado ao iniciar.</div>}
        <div className="lbl">Data de nascimento</div>
        <input className="inp" type="date" value={dados.dataNasc} onChange={e=>setDados(d=>({...d,dataNasc:e.target.value}))} />
        <div className="lbl">Data da avaliação</div>
        <input className="inp" type="date" value={dados.dataAval} onChange={e=>setDados(d=>({...d,dataAval:e.target.value}))} />
        <div className="lbl">Medicação (qual · dose · vezes/dia)</div>
        <textarea className="inp" rows={2} style={{resize:"vertical"}} value={dados.medicacao} onChange={e=>setDados(d=>({...d,medicacao:e.target.value}))} placeholder="Ex: Sertralina 50mg 1x/dia · Deixa em branco se não toma" />
        <button className="btn btn-p" style={{marginTop:8}} onClick={iniciarMap} disabled={!dados.nome.trim()}>{temMapeamento ? "Iniciar mapeamento →" : "Seguir passo a passo →"}</button>
      </div>
    </div>
  );

  // ── ECRÃ: Mapeamento corporal
  return (
    <div className="fade">
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div className="card-t">Mapeamento — {dados.nome}</div>
          <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>{setEtapa("dados");setRes(null);}}>← Dados</button>
        </div>
        <div style={{fontSize:9,color:"#2d4a66"}}>{dados.dataAval}{dados.medicacao ? ` · Medicação: ${dados.medicacao}` : " · Sem medicação"}</div>
        <button className="btn btn-s btn-sm" style={{width:"auto",marginTop:6}} onClick={()=>setGuia(g=>!g)}>{guia?"Ocultar guia":"Ver guia dos 4 mapas"}</button>
        {guia && <div style={{marginTop:8,fontSize:11,color:"#5a7a9a",lineHeight:1.5}}>{MAPEAMENTO_PASSOS.map(p=><div key={p.n} style={{marginBottom:5}}><strong>{p.titulo}:</strong> {p.texto}</div>)}</div>}
      </div>

      <div className="card">
        <div className="lbl">Face a registar</div>
        <div style={{display:"flex",gap:6}}>{["frente","costas"].map(f=><button key={f} className={`chip ${face===f?"on":""}`} onClick={()=>setFace(f)}>{f}</button>)}</div>
      </div>

      <div className="card">
        <div className="card-t">Mapa 1 — Centros vitais</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>Mão na orelha do lado a investigar → apalpar os 7 centros até sentir a vibração diferente. Toca no que travou.</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{CENTROS_VITAIS.map(c=><button key={c.id} className={`chip ${vitais.includes(c.id)?"on":""}`} onClick={()=>togLocal(vitais,setVitais,c.id)}>{c.nome}</button>)}</div>
      </div>

      <div className="card">
        <div className="card-t">Mapa 2 — Pontos de entrada ({entrada.length}/13)</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>Mover a mão para o centro que travou → percorrer os 13 pontos até travar.</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {PONTOS_ENTRADA.flatMap(z=>z.bilateral
            ?[{key:z.id+"-D",label:z.nome+" Dir",loc:z.localizacao+" (dir)"},
              {key:z.id+"-E",label:z.nome+" Esq",loc:z.localizacao+" (esq)"}]
            :[{key:z.id,label:z.nome,loc:z.localizacao}]
          ).map(o=>(
            <div key={o.key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <button className={`chip ${entrada.includes(o.key)?"on":""}`} onClick={()=>togLocal(entrada,setEntrada,o.key)}>{o.label}</button>
              <span style={{fontSize:8,color:"#2d4a66",textAlign:"center",maxWidth:80,lineHeight:1.2}}>{o.loc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-t">Mapa 3 — Lateralidade</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>Manter a mão no ponto do Mapa 2 → deslizar a outra à volta do tronco e pernas até travar.</div>
        <input className="inp" placeholder="Ex: coxa esquerda · parte interna · costas" value={lateral} onChange={e=>setLateral(e.target.value)} />
      </div>

      <div className="card">
        <div className="card-t">Mapa 4 — Sistemas (face: {face})</div>
        {["Superior","Central","Inferior"].map(sis=>(
          <div key={sis} style={{marginBottom:10}}>
            <div className="lbl" style={{marginBottom:4}}>{sis}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{PONTOS_POR_SISTEMA[sis].map(p=><button key={p.id} className="chip" onClick={()=>add(p)}>{p.nome} +</button>)}</div>
          </div>
        ))}
      </div>

      {sel.length>0 && <div className="card">
        <div className="card-t">Pontos detetados ({sel.length})</div>
        {sel.map(x=>(
          <div key={x.key} className="agenda-row" style={{alignItems:"center",gap:5}}>
            <div style={{flex:1,fontSize:11,color:"#b0c4d8"}}>{x.nome} <span style={{color:"#2d4a66"}}>· {x.face}</span></div>
            <button className={`chip ${x.lado==="direito"?"on":""}`} onClick={()=>setLado(x.key,"direito")}>Dir</button>
            <button className={`chip ${x.lado==="esquerdo"?"on":""}`} onClick={()=>setLado(x.key,"esquerdo")}>Esq</button>
            <button className="chip" onClick={()=>rm(x.key)}>✕</button>
          </div>
        ))}
      </div>}

      <div className="card">
        <div className="card-t">Escudo ativo</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>{ESCUDOS.map(e=><button key={e.id} className={`chip ${escudo===e.id?"on":""}`} onClick={()=>setEscudo(e.id)}>{e.nome}</button>)}</div>
        <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={sugerir} disabled={!sel.length}>Sugerir pelo mapeamento</button>
      </div>

      <div className="card">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div className="lbl">Sexo</div><div style={{display:"flex",gap:5}}>{["feminino","masculino"].map(s=><button key={s} className={`chip ${sexo===s?"on":""}`} onClick={()=>setSexo(s)}>{s}</button>)}</div></div>
          <div><div className="lbl">Dias</div><div style={{display:"flex",gap:5}}>{[7,15].map(d=><button key={d} className={`chip ${dias===d?"on":""}`} onClick={()=>setDias(d)}>{d}</button>)}</div></div>
        </div>
        <div style={{marginTop:8}}><div className="lbl">Modo</div><div style={{display:"flex",gap:5}}>
          <button className={`chip ${modo==="criadora"?"on":""}`} onClick={()=>setModo("criadora")}>Lados juntos</button>
          <button className={`chip ${modo==="separados"?"on":""}`} onClick={()=>setModo("separados")}>Lados separados</button>
        </div></div>
      </div>

      <button className="btn btn-p" onClick={gerar} disabled={!sel.length||!escudo}>Gerar relatório + protocolo</button>
      {(!sel.length||!escudo) && <div style={{fontSize:10,color:"#2d4a66",textAlign:"center",marginTop:5}}>Seleciona pelo menos 1 ponto e o escudo ativo.</div>}

      {res && <>
        <div className="card" style={{marginTop:10}}>
          <div className="card-t">Relatório de consciência</div>
          <div style={{fontSize:10,color:"#5a7a9a",marginBottom:6}}>
            <strong style={{color:"#b0c4d8"}}>{dados.nome}</strong> · {dados.dataAval}
            {dados.dataNasc ? ` · DN: ${dados.dataNasc}` : ""}
          </div>
          <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>
            Escudo: <strong style={{color:"#00c6b8"}}>{ESCUDOS.find(e=>e.id===escudo)?.nome}</strong>
            {lateral ? ` · Lateralidade: ${lateral}` : ""}
            {vitais.length ? ` · Centros: ${vitais.map(id=>CENTROS_VITAIS.find(c=>c.id===id)?.nome).join(", ")}` : ""}
          </div>
          {dados.medicacao && <div className="al al-w" style={{fontSize:9,marginBottom:8}}>⚠️ Medicação: {dados.medicacao}</div>}
          {sel.map(x=>{ const p=getPonto(x.id); return (
            <div key={x.key} style={{marginBottom:9,paddingBottom:8,borderBottom:"1px solid #0d1828"}}>
              <div style={{fontWeight:700,fontSize:11,color:"#b0c4d8"}}>{p?.nome} <span style={{color:"#2d4a66",fontWeight:400}}>· {x.lado} · {x.face}</span></div>
              {p?.aspectos && <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}><strong>Ligado a:</strong> {p.aspectos}</div>}
              {p?.sintomas && <div style={{fontSize:10,color:"#5a7a9a"}}><strong>Sinais no corpo:</strong> {p.sintomas}</div>}
              {p?.frase && <div style={{fontSize:10,color:"#00c6b8",marginTop:2}}><strong>Pergunta ao paciente:</strong> {p.frase}</div>}
            </div>
          );})}
          <div style={{fontSize:9,color:"#2d4a66"}}>Leitura de apoio à consciência do paciente. Não substitui avaliação médica.</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>navigator.clipboard?.writeText(`Relatório — ${dados.nome} · ${dados.dataAval}\nEscudo: ${ESCUDOS.find(e=>e.id===escudo)?.nome}\n`+sel.map(x=>{const p=getPonto(x.id);return`\n${p?.nome} (${x.lado}/${x.face})\n• ${p?.aspectos}\n• Sinais: ${p?.sintomas}\n• Pergunta: ${p?.frase}`;}).join("\n"))}>Copiar</button>
            <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={()=>gerarPDFConsulta({paciente:dados.nome,dataAval:dados.dataAval,dataNasc:dados.dataNasc,medicacao:dados.medicacao,tipo:tipoSel,escudoAtivo:escudo,lateralidade:lateral,pontos:sel,protocolo:res?.texto})}>🖨️ Gerar PDF Completo</button>
            <button className="btn btn-p btn-sm" style={{width:"auto"}} onClick={guardar}>💾 Guardar na ficha</button>
          </div>
        </div>
        <div className="card" style={{marginTop:10}}>
          <div className="card-t">{res.titulo}</div>
          <pre style={{whiteSpace:"pre-wrap",fontSize:11,color:"#b0c4d8",fontFamily:"inherit",margin:0}}>{res.texto}</pre>
          <button className="btn btn-s btn-sm" style={{width:"auto",marginTop:8}} onClick={()=>navigator.clipboard?.writeText(res.texto)}>Copiar protocolo</button>
        </div>
      </>}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// NOVA CONSULTA — Selecção de tipo + lançar fluxo guiado
// ══════════════════════════════════════════════════════
function NovaConsulta({ user, onIniciar }) {
  const [subPendente, setSubPendente] = useState(null); // id do tipo que aguarda sub-selecção
  const [formato, setFormato] = useState("");

  const handleClickTipo = (x) => {
    if (x.subconsultas) {
      // Pack: mostrar selector inline antes de lançar
      setSubPendente(subPendente === x.id ? null : x.id);
    } else {
      // Tipo simples: lançar directamente
      onIniciar && onIniciar(x.id, null);
    }
  };

  return (
    <div className="fade">
      {/* Formato */}
      <div className="card">
        <div className="card-t">Formato da consulta</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["presencial", "🏢 Presencial"], ["online", "💻 Online"]].map(([k, l]) => (
            <button key={k} className={`chip ${formato === k ? "on" : ""}`}
              onClick={() => setFormato(k)} style={{ padding: "7px 16px", fontSize: 11 }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tipos */}
      <div className="card">
        <div className="card-t">Toca para iniciar a consulta</div>
        {TIPOS_CONSULTA_LOCAL.map(x => (
          <div key={x.id}>
            <div
              onClick={() => handleClickTipo(x)}
              style={{
                cursor: "pointer", padding: "14px 16px", marginBottom: x.subconsultas && subPendente === x.id ? 0 : 8,
                borderRadius: x.subconsultas && subPendente === x.id ? "9px 9px 0 0" : 9,
                border: `2px solid ${subPendente === x.id ? "#00c6b8" : "#0d1828"}`,
                background: subPendente === x.id ? "#0d2535" : "#050810",
                transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#dde4f0" }}>{x.nome}</div>
                <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4, lineHeight: 1.5 }}>{x.indicado}</div>
                {x.nota && <div style={{ fontSize: 10, color: "#2d4a66", marginTop: 3 }}>{x.nota}</div>}
              </div>
              <div style={{
                marginLeft: 12, width: 32, height: 32, borderRadius: "50%",
                background: x.subconsultas ? "#1a2a3a" : "linear-gradient(135deg,#00c6b8,#009e92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: x.subconsultas ? 14 : 16, flexShrink: 0
              }}>
                {x.subconsultas ? (subPendente === x.id ? "▲" : "▼") : "▶"}
              </div>
            </div>

            {/* Selector de sessão inline para packs */}
            {x.subconsultas && subPendente === x.id && (
              <div style={{
                border: "2px solid #00c6b8", borderTop: "none", borderRadius: "0 0 9px 9px",
                background: "#061020", padding: "10px 14px 14px", marginBottom: 8
              }}>
                <div style={{ fontSize: 10, color: "#00c6b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Escolhe a sessão do pack
                </div>
                {x.subconsultas.map(sc => (
                  <div key={sc.id}
                    onClick={() => { onIniciar && onIniciar(x.id, sc.id); setSubPendente(null); }}
                    style={{
                      cursor: "pointer", padding: "10px 12px", marginBottom: 6, borderRadius: 7,
                      border: "1px solid #1a3a5c", background: "#0a1e2e",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all .15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#00c6b8"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3a5c"}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#b0c4d8" }}>{sc.nome}</div>
                      {sc.nota && <div style={{ fontSize: 10, color: "#5a7a9a", marginTop: 2 }}>{sc.nota}</div>}
                    </div>
                    <span style={{ color: "#00c6b8", fontSize: 16 }}>▶</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MÓDULO MÉTODO — orquestra tabs + liga NovaConsulta → Mapeamento
// ══════════════════════════════════════════════════════
function ModuloMetodo({ user, adminMode, initAba, voltar }) {
  const [aceite, setAceite] = useState(jaAceitou(user?.id, "metodo"));
  const [aba, setAba] = useState(initAba || "consulta");
  const [qForm, setQForm] = useState(null);
  const [consultaAtiva, setConsultaAtiva] = useState(null); // { tipo, sub }

  const iniciarConsulta = (tipo, sub) => {
    setConsultaAtiva({ tipo, sub: sub || null });
    setAba("mapeamento");
  };

  const voltarSeleccao = () => {
    setConsultaAtiva(null);
    setAba("consulta");
  };

  if (!aceite) return (
    <div className="fade" style={{maxWidth:560,margin:"0 auto",padding:"8px 0"}}>
      {/* Header profissional */}
      <div style={{background:"linear-gradient(135deg,#0a1e2e,#061428)",border:"1px solid #1a3a5c",borderRadius:14,padding:"28px 24px",marginBottom:12,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:10}}>🧠</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#dde4f0",marginBottom:6,letterSpacing:1}}>
          Módulo de Atendimento Especializado
        </div>
        <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.7,maxWidth:380,margin:"0 auto"}}>
          Ferramenta de apoio a terapeutas certificados para conduzir atendimentos estruturados com protocolos guiados, mapeamento emocional e geração de relatórios de consciência.
        </div>
      </div>

      {/* O que inclui */}
      <div className="card" style={{marginBottom:10}}>
        <div className="card-t">O que este módulo inclui</div>
        {[
          ["🩺","Consultas Guiadas","Passo a passo para cada tipo de atendimento — do acolhimento ao protocolo final"],
          ["🗺️","Mapeamento Energético","4 mapas corporais com identificação de escudos, sistemas e temporalidade do conflito"],
          ["📋","Questionários","Escudos Emocionais, Medos, Pré/Pós-Consulta — enviáveis por WhatsApp"],
          ["📄","Relatório de Consciência","Geração automática da devolutiva e protocolo de cura para o paciente"],
          ["🌿","Farmácia Natural","Base de conhecimento de apoio (validada pelo terapeuta)"],
          ["👶","Atendimento Infanto-Juvenil","Protocolos adaptados por faixa etária com fichas específicas"],
        ].map(([ic,t,d]) => (
          <div key={t} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid #0d1828"}}>
            <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
            <div>
              <div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{t}</div>
              <div style={{fontSize:10,color:"#3d5a7a",marginTop:2,lineHeight:1.5}}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso de responsabilidade */}
      <div style={{background:"rgba(251,191,36,.04)",border:"1px solid rgba(251,191,36,.18)",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:11,color:"#fbbf24",marginBottom:8}}>⚠️ Aviso Obrigatório — Lê antes de continuar</div>
        {[
          "Este módulo é uma ferramenta de apoio. Não substitui a tua formação certificada, o teu estudo contínuo nem o teu julgamento clínico.",
          "Podes cometer erros. A responsabilidade pelo que indicares ao paciente é exclusivamente tua.",
          "Não emite diagnósticos médicos. Qualquer orientação terapêutica deve ser validada com o teu conhecimento e formação.",
          "Em caso de crise do paciente ou risco para si ou para outros, encaminha imediatamente para serviços de saúde adequados.",
          "O conteúdo deste módulo é propriedade intelectual protegida. O acesso é pessoal e intransmissível.",
        ].map((p,i) => (
          <div key={i} style={{fontSize:11,color:"#fde68a",marginBottom:5,lineHeight:1.6,paddingLeft:14,position:"relative"}}>
            <span style={{position:"absolute",left:0,color:"#f59e0b"}}>•</span>{p}
          </div>
        ))}
      </div>

      <button className="btn btn-p" style={{padding:"13px 0",fontSize:13}}
        onClick={() => { registarAceite(user?.id, "metodo"); setAceite(true); }}>
        ✅ Compreendi e assumo a responsabilidade profissional
      </button>
      <div style={{fontSize:9,color:"#1a2840",textAlign:"center",marginTop:8}}>
        Esta confirmação fica registada. Podes rever os Termos de Utilização completos nas definições.
      </div>
    </div>
  );

  const tabs = [
    ["consulta",    "🩺 Nova Consulta"],
    ["mapeamento",  "📋 Consulta Activa"],
    ["questionario","📋 Questionários"],
    ["assistente",  "🤖 Assistente"],
    ["farmacia",    "🌿 Farmácia"],
    ["infanto",     "👶 Infanto"],
    ["audios",      "🎧 Áudios"],
  ];

  return (
    <div className="fade">
      <div className="card">
        {voltar && (
          <button className="btn btn-s btn-sm" style={{ width: "auto", marginBottom: 8 }} onClick={voltar}>
            ← Voltar
          </button>
        )}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tabs.map(([k, l]) => (
            <button key={k}
              className={`chip ${aba === k ? "on" : ""}`}
              onClick={() => { if (k === "consulta") voltarSeleccao(); else setAba(k); }}>
              {l}
              {k === "mapeamento" && consultaAtiva && (
                <span style={{ marginLeft: 5, width: 6, height: 6, borderRadius: "50%", background: "#00c6b8", display: "inline-block", verticalAlign: "middle" }} />
              )}
            </button>
          ))}
        </div>
      </div>
      {aba === "consulta"     && <NovaConsulta user={user} onIniciar={iniciarConsulta} />}
      {aba === "mapeamento"   && <Mapeamento user={user} initConsulta={consultaAtiva} />}
      {aba === "questionario" && <Questionario user={user} initForm={qForm} />}
      {aba === "assistente"   && <Assistente user={user} />}
      {aba === "farmacia"     && <Farmacia adminMode={adminMode} />}
      {aba === "infanto"      && <Infanto adminMode={adminMode} ir={(ab, fk) => { if (fk) setQForm(fk); setAba(ab); }} />}
      {aba === "audios"       && <ModuloAudios />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// QUESTIONÁRIOS
// ══════════════════════════════════════════════════════
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
    titulo: "Questionário dos Medos",
    descricao: "Mapear os medos activos. Escala: 1 = Pouco · 2 = Às vezes · 3 = Muito presente.",
    escala: [1, 2, 3],
    blocos: [
      { titulo: "Medos de Relacionamento e Vínculo", perguntas: [
        { id: "md1", q: "Tenho medo de ser abandonado(a) ou rejeitado(a).", tipo: "escala" },
        { id: "md2", q: "Tenho medo de não ser amado(a) ou aceite como sou.", tipo: "escala" },
        { id: "md3", q: "Tenho medo de perder alguém que amo.", tipo: "escala" },
        { id: "md4", q: "Tenho medo de confiar plenamente nas pessoas.", tipo: "escala" },
        { id: "md5", q: "Tenho medo de me comprometer numa relação.", tipo: "escala" },
        { id: "md6", q: "Tenho medo de ficar sozinho(a) para sempre.", tipo: "escala" },
      ]},
      { titulo: "Medos de Valor e Desempenho", perguntas: [
        { id: "md7", q: "Tenho medo de falhar ou cometer erros graves.", tipo: "escala" },
        { id: "md8", q: "Tenho medo de não ser suficientemente capaz.", tipo: "escala" },
        { id: "md9", q: "Tenho medo de ser julgado(a) ou criticado(a).", tipo: "escala" },
        { id: "md10", q: "Tenho medo de não realizar os meus sonhos.", tipo: "escala" },
        { id: "md11", q: "Tenho medo de decepcionar as pessoas importantes para mim.", tipo: "escala" },
        { id: "md12", q: "Tenho medo de perder o emprego ou segurança financeira.", tipo: "escala" },
      ]},
      { titulo: "Medos Existenciais e de Mudança", perguntas: [
        { id: "md13", q: "Tenho medo da morte (minha ou de quem amo).", tipo: "escala" },
        { id: "md14", q: "Tenho medo do desconhecido e das mudanças.", tipo: "escala" },
        { id: "md15", q: "Tenho medo de perder o controlo da minha vida.", tipo: "escala" },
        { id: "md16", q: "Tenho medo de não ter recursos suficientes.", tipo: "escala" },
        { id: "md17", q: "Tenho medo de adoecer gravemente.", tipo: "escala" },
        { id: "md18", q: "Tenho medo de não ser suficiente para as pessoas que amo.", tipo: "escala" },
      ]},
      { titulo: "Exploração Profunda", perguntas: [
        { id: "md19", q: "Qual é o maior medo que carregas há mais tempo?", tipo: "texto" },
        { id: "md20", q: "Quando este medo apareceu pela primeira vez na tua vida?", tipo: "texto" },
        { id: "md21", q: "Como este medo te impede de agir ou avançar hoje?", tipo: "texto" },
        { id: "md22", q: "O que aconteceria de pior se este medo se concretizasse?", tipo: "texto" },
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
                <div style={{ marginTop: 5, fontSize: 10, color: "#5a7a9a" }}>
                  {(getForm(r.questionario)?.blocos || []).flatMap(b => b.perguntas).map(p => (
                    <div key={p.id} style={{ marginBottom: 3 }}><strong style={{ color: "#7a98b8" }}>{p.q}</strong> — {String(r.respostas[p.id] ?? "—")}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
                const f = getAllForms ? getAllForms().find(x => x.key === qKey) : FORMS_DEF.find(x => x.key === qKey);
                return f ? (
                  <button key={qKey} className="btn btn-s" style={{ flex: 1, minWidth: 140 }}
                    onClick={() => ir && ir("questionario", qKey)}>
                    📋 {f.titulo}
                  </button>
                ) : null;
              })}
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
  useEffect(() => { sb.from("audios").select("*").eq("ativo", true).order("ordem").then(({ data }) => { if (data) setAudios(data); }); }, []);
  if (!audios.length) return <div className="al al-i">Sem audios disponiveis. O administrador ira adicionar em breve.</div>;
  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Biblioteca de Audios</div>
        {audios.map((a, i) => (
          <div key={i} style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:11,marginBottom:7}}>
            <div style={{fontWeight:600,fontSize:12,color:"#b0c4d8",marginBottom:3}}>{a.nome}</div>
            {a.descricao && <div style={{fontSize:10,color:"#3d5a7a",marginBottom:6}}>{a.descricao}</div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {a.link_drive && <a href={a.link_drive} target="_blank" rel="noopener noreferrer" className="btn btn-p btn-sm" style={{width:"auto",textDecoration:"none"}}>Ouvir / Descarregar</a>}
              {a.link_drive && <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={() => { navigator.clipboard.writeText(a.link_drive); setCopied(a.nome); setTimeout(() => setCopied(""), 2000); }}>{copied === a.nome ? "Copiado" : "Copiar link"}</button>}
              {a.link_drive && <button className="btn btn-sm" style={{background:"#25D36618",border:"1px solid #25D36640",color:"#25D366",width:"auto"}} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(a.nome + "\n" + a.link_drive)}`)}>WhatsApp</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniSite({ user }) {
  const [cfg, setCfg] = useState({ nomePratica:"", bio:"", cor:"#00c6b8", horario:"Seg-Sex: 9h-18h", telefone:"", email:"", instagram:"", servicos:[] });
  const [editando, setEditando] = useState(false);
  const [ok, setOk] = useState("");
  useEffect(() => { if (user?.config) setCfg({ ...cfg, ...user.config }); }, [user]);
  const salvar = async () => {
    await sb.from("profiles").update({ config: cfg }).eq("id", user.id);
    setOk("Guardado!"); setTimeout(() => setOk(""), 2000);
  };
  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Mini Site</div>
        {ok && <div className="al al-ok">{ok}</div>}
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <button className={`chip ${!editando?"on":""}`} onClick={() => setEditando(false)}>Ver</button>
          <button className={`chip ${editando?"on":""}`} onClick={() => setEditando(true)}>Editar</button>
        </div>
        {editando ? (
          <>
            <div className="mb8"><span className="lbl">Nome da Pratica</span><input className="inp" value={cfg.nomePratica} onChange={e => setCfg({...cfg,nomePratica:e.target.value})} /></div>
            <div className="mb8"><span className="lbl">Bio</span><textarea className="inp" rows={3} value={cfg.bio} onChange={e => setCfg({...cfg,bio:e.target.value})} /></div>
            <div className="g2">
              <div><span className="lbl">Cor</span><input type="color" className="inp" value={cfg.cor} onChange={e => setCfg({...cfg,cor:e.target.value})} style={{height:36,padding:2}} /></div>
              <div><span className="lbl">Horario</span><input className="inp" value={cfg.horario} onChange={e => setCfg({...cfg,horario:e.target.value})} /></div>
            </div>
            <div className="g2">
              <div><span className="lbl">Telefone</span><input className="inp" value={cfg.telefone} onChange={e => setCfg({...cfg,telefone:e.target.value})} /></div>
              <div><span className="lbl">Instagram</span><input className="inp" value={cfg.instagram} onChange={e => setCfg({...cfg,instagram:e.target.value})} /></div>
            </div>
            <button className="btn btn-p" style={{marginTop:8}} onClick={salvar}>Guardar</button>
          </>
        ) : (
          <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,overflow:"hidden"}}>
            <div style={{padding:18,background:"linear-gradient(135deg,#0d1828,#050810)",textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:cfg.cor,marginBottom:5}}>{cfg.nomePratica || "O teu consultorio"}</div>
              <div style={{fontSize:11,color:"#4a6a8a",lineHeight:1.6}}>{cfg.bio || "A tua apresentacao aparecera aqui."}</div>
            </div>
            <div style={{padding:"12px 14px",fontSize:11,color:"#4a6a8a"}}>
              {cfg.horario && <div>Horario: {cfg.horario}</div>}
              {cfg.telefone && <div>Tel: {cfg.telefone}</div>}
              {cfg.instagram && <div>Instagram: @{cfg.instagram}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
