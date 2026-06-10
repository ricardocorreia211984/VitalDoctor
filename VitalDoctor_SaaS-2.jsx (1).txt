import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PONTOS_POR_SISTEMA, PONTOS, getPonto, CENTROS_VITAIS, PONTOS_ENTRADA } from "./mapaCorporal.js";
import { ESCUDOS, QUESTIONARIO_ESCUDOS, ESCALA_QUESTIONARIO, PERGUNTAS_ABERTURA } from "./baseConhecimento.js";
import { MAPEAMENTO_PASSOS, TIPOS_ATENDIMENTO, passosDoTipo } from "./atendimento.js";
import { gerarProtocoloCura, AFIRMACOES_ESCUDO } from "./protocoloCura.js";
import { pontuarEscudos } from "./gerarRelatorio.js";
import { AVISO_SAUDE, jaAceitou, registarAceite } from "./responsabilidade.js";

// ─── SUPABASE ───
const SUPA_URL = "https://lrmylsywevawexzcgqzc.supabase.co";
const SUPA_KEY = "sb_publishable_pOcM1sN-hhJh9ID8pSt7gA_K2tSDDWL";
const sb = createClient(SUPA_URL, SUPA_KEY);

// ─── HELPERS ───
const hoje = () => new Date().toISOString().split("T")[0];
const fmtData = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-PT") : "";
const uid = () => Math.random().toString(36).substr(2, 9);
const tog = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
const HORAS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

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
    onLogin({ ...data.user, ...prof });
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
          {[["🩺","Consultas","metodo","mapeamento"],["📖","Tipos de Consulta","metodo","consulta"],["👥","Pacientes","pacientes",null],["📅","Agenda","agenda",null],["📋","Questionarios","metodo","questionario"],["🌿","Farmacia","metodo","farmacia"]].map(([ic,lb,m,ab]) => (
            <div key={lb} onClick={() => go && go(m,ab)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 11px",background:"#050810",border:"1px solid #0d1828",borderRadius:7,fontSize:11,color:"#b0c4d8",cursor:"pointer"}}>
              <span style={{fontSize:14}}>{ic}</span>{lb}
            </div>
          ))}
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
  const TABS = [["users","👥 Subscritores"],["conteudo","📝 Conteúdo"],["modulos","🧩 Módulos"],["hotmart","💳 Hotmart"],["audio","🎧 Áudios"],["stats","📊 Stats"]];
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

  const NAV = [
    { id:"dashboard", icon:"🏠", label:"Inicio" },
    { id:"pacientes", icon:"👥", label:"Pacientes" },
    { id:"agenda", icon:"📅", label:"Agenda" },
    { id:"mapeamento", icon:"🗺️", label:"Mapear" },
    { id:"ansiedade", icon:"🧠", label:"A&D" },
    { id:"farmacia", icon:"🌿", label:"Farmacia" },
  ];

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
    dashboard:"Dashboard", pacientes:"Pacientes", agenda:"Agenda", metodo:"Atendimento Especializado",
    mapeamento:"Mapeamento Clinico", ansiedade:"Ansiedade e Depressao",
    questionario:"Questionario dos Escudos", farmacia:"Farmacia Natural",
    infanto:"Infanto-Juvenil", minisite:"Mini Site", audios:"Audios",
    admin:"Painel Admin", pesquisa:"Pesquisa Clinica",
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
  if (!user) return <><style>{CSS}</style><Auth onLogin={() => {}} /></>;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
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
            <div className="main-title">{TITULOS[mod] || mod}</div>
            <div style={{fontSize:9,color:"#1a2840"}}>{user.email}</div>
          </div>
          <div className="main-body">
            {mod === "dashboard"    && <Dashboard user={perfil} pacs={pacs} agenda={agenda} go={navegar} />}
            {mod === "pacientes"    && <Pacientes user={perfil} pacs={pacs} setPacs={setPacs} />}
            {mod === "agenda"       && <Agenda user={perfil} pacs={pacs} agenda={agenda} setAgenda={setAgenda} />}
            {mod === "metodo"       && temMod("avancado") && <ModuloMetodo user={perfil} adminMode={isAdmin} initAba={metodoTab} />}
            {mod === "minisite"     && <MiniSite user={perfil} />}
            {mod === "admin"        && isAdmin && <AdminPanel user={perfil} />}
          </div>
        </main>

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
      </div>
    </>
  );
}

// ── MÓDULOS CLÍNICOS ──

function Mapeamento({ user }) {
  const [etapa, setEtapa] = useState("dados");
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
  useEffect(() => { sb.from("pacientes").select("id,nome,data_nasc,medicacao,genero").order("nome").then(({ data }) => setPacs(data || [])); }, []);
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
    setEtapa("mapa");
  };

  const tog = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const add = (p) => setSel(s => [...s, { key: p.id+"-"+face+"-"+Math.random().toString(36).slice(2,7), id:p.id, nome:p.nome, sistema:p.sistema, lado:"direito", face }]);
  const setLado = (k,l) => setSel(s => s.map(x => x.key===k ? {...x,lado:l} : x));
  const rm = (k) => setSel(s => s.filter(x => x.key!==k));
  const sugerir = () => { const c={}; sel.forEach(x=>(getPonto(x.id)?.escudos||[]).forEach(e=>c[e]=(c[e]||0)+1)); const t=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; if(t)setEscudo(t[0]); };
  const gerar = () => setRes(gerarProtocoloCura({ paciente:{nome:dados.nome}, sexo, escudo, protocoloDias:dias, modo, mapeamento: sel.map(x=>({id:x.id,lado:x.lado,face:x.face})) }));

  const imprimir = (txt) => { const w=window.open("","_blank"); w.document.write(`<html><body style="font-family:sans-serif;padding:24px;max-width:700px"><pre style="white-space:pre-wrap;font-size:13px">${txt.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre></body></html>`); w.document.close(); w.print(); };
  const guardar = async () => { if(!res) return; try { await sb.from("consultas").insert({ paciente_id:dados.paciente_id||null, paciente_nome:dados.nome, data_avaliacao:dados.dataAval, data_nascimento:dados.dataNasc||null, medicacao:dados.medicacao||null, tipo:"mapeamento", escudo_ativo:escudo, pontos:sel, centros_vitais:vitais, pontos_entrada:entrada, lateralidade:lateral, protocolo:res.texto, terapeuta_id:user?.id }); alert("Guardado na ficha! ✅"); } catch { alert("Erro ao guardar. Verifica a tabela 'consultas' no Supabase."); } };

  if (etapa === "dados") return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Dados do Paciente</div>
        <div className="al al-i" style={{fontSize:10}}>Preenche os dados antes de iniciar o mapeamento (seguindo o protocolo da consulta).</div>
        <div className="lbl" style={{marginTop:8}}>Nome completo (baptismo) *</div>
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
        <button className="btn btn-p" style={{marginTop:8}} onClick={iniciarMap} disabled={!dados.nome.trim()}>Iniciar mapeamento →</button>
      </div>
    </div>
  );

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
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{CENTROS_VITAIS.map(c=><button key={c.id} className={`chip ${vitais.includes(c.id)?"on":""}`} onClick={()=>tog(vitais,setVitais,c.id)}>{c.nome}</button>)}</div>
      </div>

      <div className="card">
        <div className="card-t">Mapa 2 — Pontos de entrada ({entrada.length}/13)</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>Mover a mão para o centro que travou → percorrer os 13 pontos até travar. Localização indicada abaixo de cada botão.</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {PONTOS_ENTRADA.flatMap(z=>z.bilateral
            ?[{key:z.id+"-D",label:z.nome+" Dir",loc:z.localizacao+" (dir)"},
              {key:z.id+"-E",label:z.nome+" Esq",loc:z.localizacao+" (esq)"}]
            :[{key:z.id,label:z.nome,loc:z.localizacao}]
          ).map(o=>(
            <div key={o.key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <button className={`chip ${entrada.includes(o.key)?"on":""}`} onClick={()=>tog(entrada,setEntrada,o.key)}>{o.label}</button>
              <span style={{fontSize:8,color:"#2d4a66",textAlign:"center",maxWidth:80,lineHeight:1.2}}>{o.loc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-t">Mapa 3 — Lateralidade</div>
        <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8}}>Manter a mão no ponto do Mapa 2 → deslizar a outra à volta do tronco e pernas (sem braços) até travar. Escreve o local exato e o lado.</div>
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
            <button className="btn btn-s btn-sm" style={{width:"auto"}} onClick={()=>imprimir(`RELATÓRIO DE CONSCIÊNCIA\n${dados.nome} · ${dados.dataAval}${dados.dataNasc?` · DN: ${dados.dataNasc}`:""}\nEscudo: ${ESCUDOS.find(e=>e.id===escudo)?.nome}\nLateralidade: ${lateral}\n${dados.medicacao?`Medicação: ${dados.medicacao}\n`:""}\n`+sel.map(x=>{const p=getPonto(x.id);return`${p?.nome} (${x.lado}/${x.face})\nLigado a: ${p?.aspectos}\nSinais: ${p?.sintomas}\nPergunta: ${p?.frase}\n`;}).join("\n"))}>🖨️ Imprimir</button>
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

function ModuloAD({ user }) {
  return <div className="al al-i">Modulo Ansiedade e Depressao — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
}

// ══════════════════════════════════════════════════════
// QUESTIONÁRIOS — motor genérico (preencher · guardar · enviar · receber)
// ══════════════════════════════════════════════════════
const FORMS_DEF = [
  {
    key: "escudos",
    titulo: "Questionário dos Escudos",
    descricao: "Para cada afirmação: 1 = pouco · 2 = às vezes · 3 = muito.",
    escala: [1, 2, 3],
    blocos: QUESTIONARIO_ESCUDOS.map(b => ({ titulo: b.titulo, perguntas: b.afirmacoes.map((a, i) => ({ id: b.blocoId + "_" + i, q: a, tipo: "escala" })) })),
  },
  {
    key: "pre_consulta",
    titulo: "Ficha de Pré-Consulta",
    descricao: "Preenche antes da primeira consulta.",
    blocos: [
      { titulo: "Motivo", perguntas: [
        { id: "motivo", q: "Qual o principal motivo que o traz à consulta?", tipo: "texto" },
        { id: "tempo", q: "Há quanto tempo sente isto?", tipo: "texto" },
      ] },
      { titulo: "Saúde", perguntas: [
        { id: "medicacao", q: "Toma alguma medicação? Qual e que dose?", tipo: "texto" },
        { id: "acompanhamento", q: "Tem acompanhamento médico ou psicológico atual?", tipo: "sim_nao" },
        { id: "sono", q: "Como está o seu sono?", tipo: "escolha", opcoes: ["Bom", "Irregular", "Mau"] },
      ] },
      { titulo: "Objetivo", perguntas: [
        { id: "objetivo", q: "O que gostaria de alcançar com o acompanhamento?", tipo: "texto" },
      ] },
    ],
  },
  {
    key: "pos_consulta",
    titulo: "Questionário Pós-Consulta",
    descricao: "Feedback após a sessão.",
    blocos: [
      { titulo: "Após a sessão", perguntas: [
        { id: "estado", q: "Como se sente após a sessão?", tipo: "escolha", opcoes: ["Muito melhor", "Melhor", "Igual", "Pior"] },
        { id: "sensacoes", q: "Que sensações físicas ou emocionais notou?", tipo: "texto" },
        { id: "partilha", q: "Algo que queira partilhar com o terapeuta?", tipo: "texto" },
      ] },
    ],
  },
];
const getForm = (k) => FORMS_DEF.find(f => f.key === k);

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

function Questionario({ user }) {
  const [formKey, setFormKey] = useState("escudos");
  const [pacId, setPacId] = useState("");
  const [val, setVal] = useState({});
  const [pacs, setPacs] = useState([]);
  const [recebidas, setRecebidas] = useState([]);
  const [ver, setVer] = useState(null);
  const form = getForm(formKey);

  const carregar = () => {
    sb.from("pacientes").select("id,nome,telefone").order("nome").then(({ data }) => setPacs(data || []));
    sb.from("respostas").select("*").order("created_at", { ascending: false }).then(({ data }) => setRecebidas(data || []));
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
          {FORMS_DEF.map(f => <button key={f.key} className={`chip ${formKey === f.key ? "on" : ""}`} onClick={() => escolherForm(f.key)}>{f.titulo}</button>)}
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
        <div className="al al-w" style={{fontSize:10,lineHeight:1.5}}>
          Este conteúdo é criado e curado pelo terapeuta/admin, que assume total responsabilidade. Verifica sempre a compatibilidade com o quadro clínico e a medicação de cada paciente. Não substitui prescrição médica.
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

function Infanto() {
  const LC = "vd_infanto";
  const [itens, setItens] = useState(() => { try { return JSON.parse(localStorage.getItem(LC)||"[]"); } catch { return []; } });
  const [novo, setNovo] = useState({ titulo:"", descricao:"", faixaEtaria:"", notas:"" });

  useEffect(() => {
    sb.from("config_global").select("valor").eq("chave","infanto").single()
      .then(({data:d}) => { if(d?.valor){ const v=Array.isArray(d.valor)?d.valor:JSON.parse(d.valor); setItens(v); localStorage.setItem(LC,JSON.stringify(v)); } })
      .catch(()=>{});
  }, []);

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">👶 Infanto-Juvenil</div>
        <div className="al al-i" style={{fontSize:10}}>Conteúdos e protocolos para atendimento infanto-juvenil. A carregar pelo administrador.</div>
        {itens.length === 0
          ? <div style={{fontSize:10,color:"#2d4a66",marginTop:8}}>Sem conteúdos ainda. O admin pode adicionar via Painel Admin.</div>
          : itens.map(item => (
            <div key={item.id} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid #0d1828"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#00c6b8"}}>{item.titulo} {item.faixaEtaria && <span style={{color:"#2d4a66",fontWeight:400}}>· {item.faixaEtaria}</span>}</div>
              {item.descricao && <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{item.descricao}</div>}
              {item.notas && <div style={{fontSize:10,color:"#3d5a7a",marginTop:2}}>{item.notas}</div>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

function Pesquisa() {
  return <div className="al al-i">Pesquisa Clinica — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
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
          ⚠️ Sugestões com base nas fontes do módulo — <strong>NÃO são respostas definitivas</strong>. O terapeuta é responsável pelo que envia ao paciente. Pode conter erros — verifica sempre. Não substitui julgamento clínico. Em sinais de crise: encaminhar imediatamente para acompanhamento profissional.
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

function NovaConsulta({ user }) {
  const [formato, setFormato] = useState("");
  const [tipo, setTipo] = useState("");
  const [pre, setPre] = useState("");
  const t = TIPOS_ATENDIMENTO.find(x => x.id === tipo);
  const passos = tipo ? passosDoTipo(tipo) : [];
  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Tipos de Consulta</div>
        <div className="lbl">Formato</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[["presencial", "Presencial"], ["online", "Online"]].map(([k, l]) => <button key={k} className={`chip ${formato === k ? "on" : ""}`} onClick={() => setFormato(k)}>{l}</button>)}
        </div>
        <div className="lbl">Ficha de pré-consulta</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {[["enviada", "Já enviada/preenchida"], ["agora", "Preencher agora"]].map(([k, l]) => <button key={k} className={`chip ${pre === k ? "on" : ""}`} onClick={() => setPre(k)}>{l}</button>)}
        </div>
        {pre === "agora" && <div className="al al-i" style={{ fontSize: 10 }}>Usa o separador "Questionários" para preencher a pré-consulta ou qualquer outro questionário — é flexível.</div>}
      </div>

      <div className="card">
        <div className="card-t">Tipo de consulta</div>
        {TIPOS_ATENDIMENTO.map(x => (
          <div key={x.id} className="admin-section" style={{ cursor: "pointer", borderColor: tipo === x.id ? "#00c6b8" : undefined }} onClick={() => setTipo(x.id)}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#b0c4d8" }}>{x.nome}</div>
            <div style={{ fontSize: 10, color: "#5a7a9a", marginTop: 2 }}>{x.indicado}</div>
            {x.nota && <div style={{ fontSize: 9, color: "#2d4a66", marginTop: 2 }}>{x.nota}</div>}
          </div>
        ))}
      </div>

      {t && (
        <div className="card">
          <div className="card-t">Passos — {t.nome}{formato ? ` (${formato})` : ""}</div>
          {t.subconsultas
            ? t.subconsultas.map(sc => (
                <div key={sc.id} style={{ marginBottom: 9 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, color: "#00c6b8" }}>{sc.nome}</div>
                  <div style={{ fontSize: 10, color: "#5a7a9a" }}>{sc.nota}</div>
                  <ol style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 10, color: "#5a7a9a" }}>
                    {passosDoTipo(t.id, sc.id).map(p => <li key={p.id} style={{ marginBottom: 2 }}>{p.titulo}</li>)}
                  </ol>
                </div>
              ))
            : <ol style={{ margin: "0 0 0 16px", padding: 0, fontSize: 11, color: "#5a7a9a" }}>
                {passos.map(p => <li key={p.id} style={{ marginBottom: 6 }}><strong style={{ color: "#b0c4d8" }}>{p.titulo}</strong> — {p.descricao}</li>)}
              </ol>}
          {!t.subconsultas && t.id === "mapeamento" && <div className="al al-i" style={{ marginTop: 8, fontSize: 10 }}>Faz o mapeamento no separador "Mapeamento" e gera o protocolo de cura.</div>}
        </div>
      )}
    </div>
  );
}

function ModuloMetodo({ user, adminMode, initAba }) {
  const [aceite, setAceite] = useState(jaAceitou(user?.id, "metodo"));
  const [aba, setAba] = useState(initAba || "consulta");
  if (!aceite) return (
    <div className="fade">
      <div className="card">
        <div className="card-t">{AVISO_SAUDE.titulo}</div>
        <div className="al al-w" style={{ marginBottom: 9, lineHeight: 1.6, fontSize: 11 }}>
          {AVISO_SAUDE.pontos.map((p, i) => <div key={i} style={{ marginBottom: 5 }}>• {p}</div>)}
        </div>
        <div style={{ fontSize: 11, color: "#5a7a9a", marginBottom: 10 }}>{AVISO_SAUDE.rodape}</div>
        <button className="btn btn-p" onClick={() => { registarAceite(user?.id, "metodo"); setAceite(true); }}>Li e aceito — sou responsável</button>
      </div>
    </div>
  );
  const tabs = [["consulta","📖 Tipos de Consulta"],["mapeamento","🩺 Consultas"],["questionario","📋 Questionários"],["assistente","🤖 Assistente"],["farmacia","🌿 Farmácia"],["infanto","👶 Infanto"],["audios","🎧 Áudios"]];
  return (
    <div className="fade">
      <div className="card">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tabs.map(([k, l]) => <button key={k} className={`chip ${aba === k ? "on" : ""}`} onClick={() => setAba(k)}>{l}</button>)}
        </div>
      </div>
      {aba === "consulta"     && <NovaConsulta user={user} />}
      {aba === "mapeamento"   && <Mapeamento user={user} />}
      {aba === "questionario" && <Questionario user={user} />}
      {aba === "assistente"   && <Assistente user={user} />}
      {aba === "farmacia"     && <Farmacia adminMode={adminMode} />}
      {aba === "infanto"      && <Infanto />}
      {aba === "audios"       && <ModuloAudios />}
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
