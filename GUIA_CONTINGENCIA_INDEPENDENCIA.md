# 🛡️ GUIA DE CONTINGÊNCIA — INDEPENDÊNCIA TOTAL

## OBJETIVO
Você consegue manter, restaurar e vender a app **100% independentemente**, mesmo sem saber programar.

---

## 📋 PARTE 1: INVENTÁRIO DE TUDO QUE VOCÊ PRECISA

### **1.1 CONTAS ONLINE (VOCÊ DEVE TER ACESSO)**

Criar/verificar que VOCÊ é o owner:

| Serviço | Link | O que fazer | Status |
|---------|------|-----------|--------|
| **GitHub** | https://github.com | Conta no seu nome, repositório é seu | ☐ |
| **Supabase** | https://supabase.com | Conta no seu nome, projeto é seu | ☐ |
| **Vercel** | https://vercel.com | Conta no seu nome, app é sua | ☐ |
| **Domínio** | GoDaddy/Namecheap/etc | Domínio registado no seu nome | ☐ |
| **Brevo** | https://www.brevo.com | Conta para email/SMS (se usar) | ☐ |
| **Google Workspace** | https://workspace.google.com | Email profissional (opcional) | ☐ |

**Checklist:**
```
☐ Consegue fazer login em todas as contas acima?
☐ Consegue recuperar passwords se esquecer?
☐ Tem email de recovery configurado?
☐ Tem 2FA (two-factor) ativado (SEGURANÇA)?
```

---

### **1.2 FICHEIROS CRÍTICOS (VOCÊ DEVE TER CÓPIA)**

Descarregar e guardar em 3 locais (HD + nuvem + externo):

```
📁 VITAL_DOCTOR_BACKUP/

├─ 📄 CREDENCIAIS (criptografado!)
│  ├─ supabase_url.txt
│  ├─ supabase_key.txt
│  ├─ brevo_api_key.txt
│  ├─ whatsapp_api_key.txt
│  └─ google_workspace_credentials.json
│
├─ 📄 CÓDIGO
│  ├─ VitalDoctor_SaaS.jsx (código completo)
│  ├─ baseConhecimento.js
│  ├─ protocoloCura.js
│  ├─ mapaCorporal.js
│  ├─ gerarRelatorio.js
│  └─ responsabilidade.js
│
├─ 📄 BASE DE DADOS
│  ├─ backup_bd_completa.sql (dump do Supabase)
│  ├─ estrutura_tabelas.sql
│  └─ dados_exemplo.json
│
├─ 📄 DOCUMENTAÇÃO
│  ├─ ARQUITETURA.md
│  ├─ COMO_DEPLOIAR.md
│  ├─ COMO_RESTAURAR.md
│  ├─ LISTA_CREDENCIAIS.md
│  └─ PROCEDIMENTOS.md
│
└─ 📄 LEGAL
   ├─ TERMOS_SERVICO.md
   ├─ CONTRATO_CLIENTE.md
   ├─ POLITICA_PRIVACIDADE.md
   └─ README_VENDA.md
```

---

## 🔑 PARTE 2: FAZER BACKUP COMPLETO (AGORA!)

### **2.1 BACKUP DO CÓDIGO**

**Já está no GitHub!** Mas faz cópia local:

```bash
# No teu computador:
git clone https://github.com/ricardocorreia211984/VitalDoctor.git

# Guarda em: C:\Users\Ricardo\VITAL_DOCTOR_BACKUP\codigo
# Ou: /Users/ricardo/VITAL_DOCTOR_BACKUP/codigo
```

---

### **2.2 BACKUP DA BASE DE DADOS (SUPABASE)**

**Vai para Supabase SQL Editor:**

```
https://supabase.com/dashboard/project/lrmylsywevawexzcgqzc/sql/new
```

**Copia e cola isto (clica "Run"):**

```sql
-- EXPORT DE TODAS AS TABELAS

-- 1. Estrutura
\d+ profiles
\d+ pacientes
\d+ consultas
\d+ custom_modules
\d+ organizacoes
\d+ minisite_config

-- 2. Dados (sem dados sensíveis)
SELECT * FROM profiles;
SELECT * FROM pacientes;
SELECT * FROM consultas;
SELECT * FROM custom_modules;
SELECT * FROM organizacoes;
```

**Resultado:** Copia tudo, cola num ficheiro `.sql` e guarda.

---

### **2.3 BACKUP DAS CREDENCIAIS**

**Criar arquivo CREDENCIAIS.txt (CRIPTOGRAFADO!):**

```
⚠️ GUARDAR EM LOCAL SUPER SEGURO!
(Não no GitHub, não no email, não em nuvem pública)

SUPABASE:
├─ Project Ref: lrmylsywevawexzcgqzc
├─ URL: https://lrmylsywevawexzcgqzc.supabase.co
├─ Public Key: sb_publishable_pOcM1sN-hhJh9ID8pSt7gA_K2tSDDWL
├─ Service Role Key: [CONFIDENCIAL - guarda seguro]
└─ Database Password: [CONFIDENCIAL - guarda seguro]

VERCEL:
├─ Project: VitalDoctor
├─ Team: ricardocorreia211984
└─ Deployment Token: [CONFIDENCIAL]

BREVO (EMAIL):
├─ API Key: [CONFIDENCIAL]
└─ Sender Email: noreply@vitaldoctor.app

WHATSAPP:
├─ API Key: [CONFIDENCIAL]
├─ Phone ID: [CONFIDENCIAL]
└─ Access Token: [CONFIDENCIAL]

GOOGLE WORKSPACE (se usar):
├─ Email: ricardo@vitaldoctor.app
├─ App Password: [CONFIDENCIAL]
└─ Recovery Codes: [CONFIDENCIAL]
```

**Como criptografar:**
- Windows: 7-Zip (criptografia AES-256)
- Mac: Disk Utility (criar imagem criptografada)
- Linux: `gpg --symmetric ficheiro.txt`

---

## 🔄 PARTE 3: COMO RESTAURAR SE CAIR TUDO

### **3.1 SE SUPABASE CAIR (BD fica offline)**

**Situação:** Base de dados não responde, clientes não conseguem aceder.

**O que fazer:**

```
PASSO 1: Procura alternativas rápidas
├─ Espera 30 min (Supabase costuma resolver sozinho)
└─ Ve status: https://status.supabase.com

PASSO 2: Se não voltar em 1h, tira a BD do backup
├─ Vai para: https://railway.app (alternativa rápida)
├─ New Project → PostgreSQL
├─ Restaura o SQL dump que guardou
├─ Tempo: 20-30 minutos
└─ Pronto!

PASSO 3: Atualiza credenciais na app
├─ Vai para Vercel
├─ Environment Variables
├─ Troca SUPABASE_URL para nova BD
├─ Troca SUPABASE_KEY
├─ Redeploy (automático)
└─ Pronto!

TEMPO TOTAL: ~1h (com backup organizado)
CUSTO: ~$5 em Railway (por mês, depois volta a Supabase)
```

---

### **3.2 SE VERCEL CAIR (App não faz deploy)**

**Situação:** Código não consegue fazer update, ou app fica offline.

**O que fazer:**

```
PASSO 1: Procura alternativas
├─ Ve status: https://www.vercel-status.com
└─ Se está down, espera

PASSO 2: Se não voltar, faz deploy noutro lugar
├─ Opção A: Railway.app (fácil)
│  └─ Pull código do GitHub
│  └─ Deploy automático
│  └─ Tempo: 5 min
│
├─ Opção B: Fly.io (escalável)
│  └─ Deploy em Docker
│  └─ Tempo: 15 min
│
└─ Opção C: Netlify (também grátis)
   └─ Conecta GitHub
   └─ Deploy automático
   └─ Tempo: 5 min

TEMPO TOTAL: 5-15 minutos
CUSTO: Grátis (nas alternativas)
```

---

### **3.3 SE EMAIL/SMS FALHAR (Brevo cai)**

**Situação:** Clientes não recebem lembretes por email.

**O que fazer:**

```
PASSO 1: Procura alternativa rápida
├─ Opção A: SendGrid (grátis 100/dia)
│  └─ Cria conta
│  └─ Obtém API key
│  └─ Atualiza código (10 minutos)
│
├─ Opção B: Resend (mais fácil)
│  └─ Cria conta
│  └─ Obtém API key
│  └─ Atualiza código (10 minutos)
│
└─ Opção C: SMTP próprio (mais técnico)
   └─ Usa Gmail/Outlook SMTP
   └─ Requer menos config

TEMPO TOTAL: 10-20 minutos
CUSTO: Grátis (no início)
```

---

## 📞 PARTE 4: PLANO DE SUPORTE (SEM PROGRAMADOR)

### **4.1 PROBLEMAS COMUNS E SOLUÇÕES**

#### **"A app está lenta"**

```
Culpa: Supabase base de dados lenta
Solução:
1. Limpar tabelas antigas (eliminar consultas > 2 anos)
2. Recriar índices em Supabase
3. Aumentar compute (Supabase paga +$10/mês)
Tempo: 30 min
Custo: Grátis ou +$10/mês
```

#### **"Pacientes não conseguem fazer login"**

```
Culpa: RLS (permissões) bloqueadas
Solução:
1. Ver em Supabase → Authentication → Users
2. Verificar se email está confirmado
3. Se não, reenviar confirmation email
Tempo: 5 min
Custo: Grátis
```

#### **"Não consigo ver dados de um paciente"**

```
Culpa: Isolamento de dados (RLS)
Solução:
1. Verificar se terapeuta está associado ao paciente
2. Verificar terapeuta_id no Supabase
3. Se erro, atualizar manualmente
Tempo: 10 min
Custo: Grátis
```

#### **"Email não está a chegar"**

```
Culpa: Brevo credenciais erradas
Solução:
1. Verificar chave API em Brevo
2. Verificar email "sender" está verificado
3. Atualizar no painel da app
Tempo: 5 min
Custo: Grátis
```

#### **"WhatsApp não envia mensagens"**

```
Culpa: Token WhatsApp expirou
Solução:
1. Ir para Meta Developers
2. Regenerar Access Token
3. Atualizar no painel da app
Tempo: 5 min
Custo: Grátis
```

---

### **4.2 CONTACTOS DE EMERGÊNCIA**

Guardar estes contactos num documento:

```
SUPABASE:
├─ Support: https://supabase.com/support
├─ Status: https://status.supabase.com
└─ Docs: https://supabase.com/docs

VERCEL:
├─ Support: https://vercel.com/support
├─ Status: https://www.vercel-status.com
└─ Docs: https://vercel.com/docs

BREVO:
├─ Support: https://www.brevo.com/support
├─ Status: https://www.brevo.com/status
└─ Docs: https://developers.brevo.com/docs

GITHUB:
├─ Support: https://github.com/support
├─ Docs: https://docs.github.com
└─ Community: https://github.com/orgs/community

WHATSAPP:
├─ Support: https://developers.facebook.com/support
└─ Docs: https://developers.facebook.com/docs/whatsapp
```

---

## ✅ PARTE 5: CHECKLIST DE INDEPENDÊNCIA

```
CREDENCIAIS:
☐ GitHub: Você é owner do repo
☐ Supabase: Sua conta, acesso total
☐ Vercel: Sua conta, acesso total
☐ Domínio: No seu nome
☐ Email: Conta seu ou da empresa
☐ Credenciais: Guardadas seguras

BACKUPS:
☐ Código: No seu GitHub
☐ BD: SQL dump guardado (3 locais)
☐ Credenciais: Arquivo criptografado
☐ Documentação: Guardada completa

CONHECIMENTO:
☐ Sabe como fazer login em todas contas
☐ Sabe onde estão backups
☐ Tem procedimentos escritos
☐ Tem contactos de emergência
☐ Entende fluxo de restauração

LEGAL:
☐ Termos de Serviço preparados
☐ Contrato de cliente pronto
☐ Política de privacidade configurada
☐ SLA (limites de responsabilidade) definido
```

---

## 🎯 PRÓXIMOS PASSOS

### **Hoje:**
```
1. Criar pasta VITAL_DOCTOR_BACKUP no teu computador
2. Guardar código (git clone)
3. Guardar credenciais (criptografadas)
4. Fazer SQL dump da BD
5. Guardar documentação
```

### **Esta semana:**
```
1. Testar restauração (simular falha)
2. Documentar tudo
3. Treinar alguém (se houver)
4. Garantir acesso a tudo
```

### **Antes de vender:**
```
1. Testar plano de contingência
2. Ter suporte identificado
3. Ter SLA definido
4. Ter documentação cliente
5. Ter contato de emergência
```

---

**Quando tiver tudo isto feito, você está 100% independente! 🎯**
