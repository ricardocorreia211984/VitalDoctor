import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
echo "CSS OK"
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
      </div>
    </div>
  );
}
echo "Auth OK"
// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function Dashboard({ user, pacs, agenda }) {
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
          {[["🗺️","Mapeamento"],["🧠","A&D"],["👥","Pacientes"],["📅","Agenda"],["🌿","Farmacia"],["🔍","Pesquisa"]].map(([ic,lb]) => (
            <div key={lb} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 11px",background:"#050810",border:"1px solid #0d1828",borderRadius:7,fontSize:11,color:"#5a7a9a"}}>
              <span style={{fontSize:14}}>{ic}</span>{lb}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
echo "Dashboard OK"
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
  const fotoRef = useRef(null);

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
    const { data: cs } = await sb.from("consultas").select("*").eq("paciente_id", p.id).order("data", { ascending: false });
    const { data: pg } = await sb.from("pagamentos").select("*").eq("paciente_id", p.id).order("data", { ascending: false });
    setConsultas(cs || []);
    setPagamentos(pg || []);
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
        <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFoto} />
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
          <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFoto} />
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
          {[["info","Info"],["consultas","Consultas"],["pagamentos","Pagamentos"],["notas","Notas"]].map(([k,l]) => (
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
echo "Pacientes OK"
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
                <button className="btn btn-d btn-sm" style={{padding:"3px 7px",fontSize:9}} onClick={() => remover(m.id)}>✕</button>
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
              <div><span className="lbl">Hora</span><select className="inp sel" value={nova.hora} onChange={e => setNova({...nova,hora:e.target.value})}>{HORAS.map(h => <option key={h}>{h}</option>)}</select></div>
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
echo "Agenda OK"
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

  useEffect(() => {
    sb.from("profiles").select("*").then(({ data }) => { if (data) setUsers(data); });
    sb.from("audios").select("*").order("ordem").then(({ data }) => { if (data) setAudios(data); });
  }, []);

  const mudarPlano = async (id, plano) => {
    await sb.from("profiles").update({ plano }).eq("id", id);
    setUsers(users.map(u => u.id === id ? { ...u, plano } : u));
  };

  const toggleMod = async (id, mod) => {
    const u = users.find(x => x.id === id);
    const mods = u.modulos_ativos || [];
    const novo = tog(mods, mod);
    await sb.from("profiles").update({ modulos_ativos: novo }).eq("id", id);
    setUsers(users.map(x => x.id === id ? { ...x, modulos_ativos: novo } : x));
  };

  const addAudio = async () => {
    if (!novoAudio.nome || !novoAudio.link_drive) { setErr("Nome e link obrigatorios."); return; }
    const { data } = await sb.from("audios").insert(novoAudio).select().single();
    if (data) { setAudios([...audios, data]); setNovoAudio({ nome:"",descricao:"",link_drive:"",tipo:"meditacao" }); setOk("Audio publicado!"); setTimeout(() => setOk(""), 2000); }
    setErr("");
  };

  const removerAudio = async (id) => {
    await sb.from("audios").delete().eq("id", id);
    setAudios(audios.filter(a => a.id !== id));
  };

  const tornarAdmin = async (id) => {
    await sb.from("profiles").update({ role: "admin" }).eq("id", id);
    setUsers(users.map(u => u.id === id ? { ...u, role: "admin" } : u));
    setOk("Admin atribuido!");
    setTimeout(() => setOk(""), 2000);
  };

  return (
    <div className="fade">
      <div className="card">
        <div className="card-t">Painel Administrador</div>
        <div className="al al-ok" style={{marginBottom:9}}>{user.nome} · Superadmin · Acesso Total</div>
        {ok && <div className="al al-ok">{ok}</div>}
        {err && <div className="al al-d">{err}</div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
          {[["users","Subscritores"],["audio","Audios Drive"],["stats","Stats"]].map(([k,l]) => (
            <button key={k} className={`chip ${aba===k?"on":""}`} onClick={() => setAba(k)}>{l}</button>
          ))}
        </div>

        {aba === "users" && (
          <div>
            <div className="al al-i" style={{marginBottom:9}}>{users.length} subscritor(es)</div>
            {users.map(u => (
              <div key={u.id} className="admin-section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:"#b0c4d8"}}>{u.nome}</div>
                    <div style={{fontSize:9,color:"#2d4a66"}}>{u.email} · {u.role}</div>
                    {u.trial_fim && u.plano === "trial" && <div style={{fontSize:9,color:"#f59e0b"}}>Trial ate: {new Date(u.trial_fim).toLocaleDateString("pt-PT")}</div>}
                  </div>
                  {u.role !== "superadmin" && u.role !== "admin" && (
                    <button className="btn btn-s btn-sm" style={{fontSize:9}} onClick={() => tornarAdmin(u.id)}>Tornar Admin</button>
                  )}
                </div>
                <div className="admin-row">
                  <span style={{fontSize:10,color:"#3d5a7a"}}>Plano</span>
                  <select className="inp sel" value={u.plano||"trial"} onChange={e => mudarPlano(u.id, e.target.value)} style={{width:"auto",padding:"3px 22px 3px 7px",fontSize:10}}>
                    <option value="trial">Trial</option><option value="base">Base €10</option><option value="pro">Pro €18</option><option value="elite">Elite €23</option>
                  </select>
                </div>
                {[["avancado","Modulo Avancado"],["audios","Biblioteca Audios"],["minisite","Mini Site"]].map(([mod,label]) => (
                  <div key={mod} className="admin-row">
                    <span style={{fontSize:10,color:"#3d5a7a"}}>{label}</span>
                    <button className={`tw ${(u.modulos_ativos||[]).includes(mod)?"on":"off"}`} onClick={() => toggleMod(u.id, mod)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {aba === "audio" && (
          <div>
            <div className="al al-i" style={{marginBottom:9}}>Adiciona links do Google Drive (suportevitaldoctor@gmail.com). Ficam disponiveis imediatamente.</div>
            {audios.map((a,i) => (
              <div key={i} style={{background:"#040810",border:"1px solid #0d1828",borderRadius:7,padding:9,marginBottom:5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:11,color:"#b0c4d8"}}>{a.nome}</div>
                    {a.descricao && <div style={{fontSize:9,color:"#2d4a66"}}>{a.descricao}</div>}
                  </div>
                  <button className="btn btn-d btn-sm" style={{fontSize:9}} onClick={() => removerAudio(a.id)}>✕</button>
                </div>
              </div>
            ))}
            <div style={{background:"#050810",border:"1px solid #0d1828",borderRadius:8,padding:11,marginTop:8}}>
              <div className="slbl">Adicionar Audio</div>
              <div className="mb8"><span className="lbl">Nome *</span><input className="inp" placeholder="Ex: Meditacao 21 Dias - Feminino" value={novoAudio.nome} onChange={e => setNovoAudio({...novoAudio,nome:e.target.value})} /></div>
              <div className="mb8"><span className="lbl">Descricao</span><input className="inp" value={novoAudio.descricao} onChange={e => setNovoAudio({...novoAudio,descricao:e.target.value})} /></div>
              <div className="mb8"><span className="lbl">Link Google Drive *</span><input className="inp" placeholder="https://drive.google.com/..." value={novoAudio.link_drive} onChange={e => setNovoAudio({...novoAudio,link_drive:e.target.value})} /></div>
              <button className="btn btn-p" onClick={addAudio}>Publicar Audio</button>
            </div>
          </div>
        )}

        {aba === "stats" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[["Total",users.length],["Trial",users.filter(u=>u.plano==="trial").length],["Base",users.filter(u=>u.plano==="base").length],["Pro",users.filter(u=>u.plano==="pro").length],["Elite",users.filter(u=>u.plano==="elite").length],["Adv.",users.filter(u=>(u.modulos_ativos||[]).includes("avancado")).length]].map(([l,v]) => (
                <div key={l} className="stat"><div className="stat-n">{v}</div><div className="stat-l">{l}</div></div>
              ))}
            </div>
            <div style={{fontSize:11,color:"#5a7a9a"}}>Receita estimada: <strong style={{color:"#10b981"}}>€{(users.filter(u=>u.plano==="base").length*10+users.filter(u=>u.plano==="pro").length*18+users.filter(u=>u.plano==="elite").length*23).toFixed(0)}/mes</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
echo "Admin OK"
// ══════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════
export default function VitalDoctor() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mod, setMod] = useState("dashboard");
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
    // Se for o admin principal, garantir superadmin
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
  const temMod = (m) => isAdmin || (perfil?.modulos_ativos || []).includes(m);

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
      { id:"mapeamento",icon:"🗺️",l:"Mapeamento" },
      { id:"ansiedade",icon:"🧠",l:"Ansiedade e Dep." },
      { id:"questionario",icon:"📋",l:"Quest. Escudos" },
      { id:"farmacia",icon:"🌿",l:"Farmacia Natural" },
      { id:"infanto",icon:"👶",l:"Infanto-Juvenil" },
      { id:"pesquisa",icon:"🔍",l:"Pesquisa Clinica" },
    ]},
    ...(temMod("minisite") ? [{ t:"Pratica", items:[{ id:"minisite",icon:"🌐",l:"Mini Site" }] }] : []),
    ...(temMod("audios") ? [{ t:"Biblioteca", items:[{ id:"audios",icon:"🎧",l:"Audios" }] }] : []),
    ...(isAdmin ? [{ t:"Admin", items:[{ id:"admin",icon:"⚙️",l:"Painel Admin" }] }] : []),
  ];

  const TITULOS = {
    dashboard:"Dashboard", pacientes:"Pacientes", agenda:"Agenda",
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
            <button className="sb-btn" onClick={logout}>Sair</button>
          </div>
        </aside>

        <main className="main">
          <div className="main-hdr">
            <div className="main-title">{TITULOS[mod] || mod}</div>
            <div style={{fontSize:9,color:"#1a2840"}}>{user.email}</div>
          </div>
          <div className="main-body">
            {mod === "dashboard"    && <Dashboard user={perfil} pacs={pacs} agenda={agenda} />}
            {mod === "pacientes"    && <Pacientes user={perfil} pacs={pacs} setPacs={setPacs} />}
            {mod === "agenda"       && <Agenda user={perfil} pacs={pacs} agenda={agenda} setAgenda={setAgenda} />}
            {mod === "mapeamento"   && <Mapeamento user={perfil} />}
            {mod === "ansiedade"    && <ModuloAD user={perfil} />}
            {mod === "questionario" && <Questionario />}
            {mod === "farmacia"     && <Farmacia adminMode={isAdmin} />}
            {mod === "infanto"      && <Infanto />}
            {mod === "pesquisa"     && <Pesquisa />}
            {mod === "audios"       && <ModuloAudios />}
            {mod === "minisite"     && <MiniSite user={perfil} />}
            {mod === "admin"        && isAdmin && <AdminPanel user={perfil} />}
          </div>
        </main>

        <nav className="mob-nav">
          <div className="mob-inner">
            {NAV.map(n => (
              <button key={n.id} className={`mob-btn ${mod === n.id ? "on" : ""}`} onClick={() => setMod(n.id)}>
                <span className="mob-icon">{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

// ── MÓDULOS CLÍNICOS (versões simplificadas funcionais) ──

function Mapeamento({ user }) {
  return <div className="al al-i">Modulo Mapeamento — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
}

function ModuloAD({ user }) {
  return <div className="al al-i">Modulo Ansiedade e Depressao — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
}

function Questionario() {
  return <div className="al al-i">Questionario dos Escudos — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
}

function Farmacia({ adminMode }) {
  return <div className="al al-i">Farmacia Natural — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
}

function Infanto() {
  return <div className="al al-i">Infanto-Juvenil — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
}

function Pesquisa() {
  return <div className="al al-i">Pesquisa Clinica — em construcao nesta versao SaaS. Disponivel na proxima atualizacao.</div>;
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
