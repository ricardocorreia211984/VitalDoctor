# 🚀 SETUP COMPLETO — WHATSAPP + PRESCRIÇÕES + VIDEOCHAMADA

## ✅ FASES IMPLEMENTADAS

### **FASE 1: Dashboard com KPIs** ✅
- Consultas este mês
- Pacientes ativos
- Total de consultas
- Consultas hoje
- Últimas 5 consultas (histórico)

**Onde:** Painel Clínica (topo)

---

### **FASE 2: Lembretes Automáticos por Email** ✅
- Integração Brevo (grátis)
- 300 emails/dia sem custo
- Botão "Enviar Lembretes de Amanhã"
- Rastreamento de envio

**Setup:**
1. Vai para https://www.brevo.com (cria conta grátis)
2. Menu: API → Chaves de API
3. Copia a chave
4. Cola no painel "Lembretes Automáticos"
5. Clica "Enviar Lembretes"

---

### **FASE 3: WhatsApp Integrado (3 Opções)** ✅

#### **OPÇÃO 1: Link Direto WhatsApp** (Recomendado para começar)

**Como funciona:**
1. Subscritor introduce o seu número (+351912345678)
2. Sistema cria link `wa.me/+351912345678`
3. Paciente clica → Abre WhatsApp automaticamente
4. Conversa começa direto

**Vantagens:**
- ✅ 100% grátis
- ✅ Sem configuração complexa
- ✅ Funciona imediatamente
- ✅ Paciente não precisa de adicionar contato

**Desvantagens:**
- ❌ Sem automação (subscritor clica cada vez)

**Setup:**
1. Painel Clínica → WhatsApp Integrado
2. Escolhe "Link Direto"
3. Introduce o teu número (+351 ...)
4. Clica botões para enviar lembretes

---

#### **OPÇÃO 2: WhatsApp Business API** (Mais profissional)

**Como funciona:**
1. Cria conta em https://developers.facebook.com
2. Configura WhatsApp Business
3. Obtém **Phone ID** e **Access Token**
4. Sistema envia mensagens automaticamente
5. 1000 mensagens/mês grátis

**Vantagens:**
- ✅ Oficial e seguro (Meta)
- ✅ Automático (sem clicar cada vez)
- ✅ 1000 msg/mês grátis
- ✅ Melhor para escala

**Desvantagens:**
- ❌ Setup mais complexo (20-30 min)
- ❌ Precisa de conta Facebook Business

**Setup Passo-a-Passo:**

```
1. Va para https://developers.facebook.com
   Clica "Criar App" → "Business"

2. Adiciona "WhatsApp" à app

3. No menu "WhatsApp" → "Configuração":
   - Clica "Comece"
   - Selecciona o país
   - Escolhe "Tenho um número de telefone" ou "Compro um número"

4. Obtém:
   - Phone ID (exemplo: 119XXXXX)
   - Access Token (exemplo: EAAx...)

5. No Painel VitalDoctor:
   - WhatsApp Integrado → API Oficial
   - Cola Phone ID
   - Cola Access Token
   - Clica "Guardar"

6. Testa:
   - Clica "Enviar WhatsApp" em qualquer paciente
   - Deve receber mensagem

Documentação oficial: 
https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
```

**Estrutura das mensagens automáticas:**
```
"Olá João Silva! 
Confirmação da tua consulta.

Data: 19/06/2026
Hora: 10:00
Local: [informação aqui]

Confirma presença ou avisa-nos se não consegues vir.

VitalDoctor 🙏"
```

---

#### **OPÇÃO 3: Baileys Bot** (100% Grátis, Avançado)

**Como funciona:**
1. Bot automático responde mensagens
2. Sem limits, 100% open-source
3. Deploy em Vercel/Railway (grátis)

**Vantagens:**
- ✅ 100% grátis (sem limits)
- ✅ Bot inteligente (responde automaticamente)
- ✅ Open-source (controlo total)

**Desvantagens:**
- ❌ Setup técnico (requer Node.js)
- ❌ Precisa de servidor sempre online

**Setup:**

```bash
# 1. Criar projeto Node
mkdir vitaldoctor-bot
cd vitaldoctor-bot
npm init -y
npm install @whiskeysockets/baileys axios dotenv

# 2. Criar arquivo "bot.js"
cat > bot.js << 'EOF'
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message?.conversation) {
      const texto = msg.message.conversation;
      const numero = msg.key.remoteJid;

      // Responde com confirmação automática
      if (texto.toLowerCase().includes('consulta')) {
        await sock.sendMessage(numero, {
          text: '✅ Consultamos nossa agenda! Responderemos em breve com a confirmação. Obrigado! 🙏'
        });
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot WhatsApp online!');
    }
  });
}

startBot();
EOF

# 3. Deploy em Vercel
npm install -g vercel
vercel

# 4. Aponta o webhook de VitalDoctor para o bot
# URL: https://seu-dominio.vercel.app/webhook
```

**Deploy em Railway (mais simples):**
```
1. Vai para https://railway.app
2. Novo projeto → Deploy from GitHub
3. Aponta ao teu repo com bot.js
4. Deploy automático
5. Obtém URL pública
```

---

## 🔄 FLUXO COMPLETO (EXEMPLO)

### **Exemplo Real: João Silva agendou consulta para amanhã**

```
PASSO 1: Subscritor vê no Dashboard
├─ "1 consulta agendada para amanhã"
└─ "João Silva - joao@email.com - 912345678"

PASSO 2: Subscritor escolhe método
├─ OPÇÃO A (Link Direto):
│  └─ Clica botão "📱 Chat WhatsApp"
│     → Abre wa.me/+351912345678
│     → Subscritor escreve manualmente
│
├─ OPÇÃO B (API Oficial):
│  └─ Clica "📤 Enviar WhatsApp"
│     → Sistema envia automático
│     → "Confirmação da tua consulta..."
│
└─ OPÇÃO C (Baileys):
   └─ Paciente escreve "Consulta?"
      → Bot responde automático
      → "✅ Consultamos agenda, responderemos..."

PASSO 3: Email também é enviado (Brevo)
└─ Paciente recebe email de confirmação

PASSO 4: Dia da consulta
├─ Se não confirmou: novo lembrete
├─ Se confirmou: pronto!
└─ Após: prescrição + relatório
```

---

## 🔐 SQL PARA EXECUTAR NO SUPABASE

Copia isto e cola no **SQL Editor** do Supabase:

```sql
-- Coluna para rastreamento de lembretes WhatsApp
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS lembrete_whatsapp_enviado TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmado_whatsapp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metodo_contato TEXT DEFAULT 'email';

-- Coluna para prescrições (próxima fase)
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS prescricao JSONB,
ADD COLUMN IF NOT EXISTS prescricao_assinada JSONB,
ADD COLUMN IF NOT EXISTS data_assinatura TIMESTAMPTZ;

-- Coluna para videochamada (próxima fase)
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS link_videochamada TEXT,
ADD COLUMN IF NOT EXISTS tipo_video TEXT;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_consultas_lembrete ON consultas(terapeuta_id, data, lembrete_whatsapp_enviado);
```

---

## 🎯 PRÓXIMAS FASES

### **FASE 4: Prescrições Digitais Assinadas** (Próximo)

**O que vai ter:**
```
✅ Editor de prescrição (customizável)
✅ Assinatura digital do terapeuta (canvas)
✅ PDF automático
✅ Envio por email/WhatsApp
✅ Histórico de prescrições
```

**Exemplo de prescrição:**
```
PRESCRIÇÃO MÉDICA/TERAPÊUTICA

Paciente: João Silva
Data: 19/06/2026
Terapeuta: Ricardo Correia

DIAGNÓSTICO:
└─ Ansiedade + Bloqueio emocional

PROTOCOLO RECOMENDADO:
1. Óleo de Frankincenso
   - Duração: 7 dias
   - Frequência: 3x dia
   
2. Reiki nos chakras
   - 30 min, 2x por semana
   
3. Meditação
   - 15 min diários
   
4. Cristal Turmalina
   - Usar dia e noite

PRÓXIMA CONSULTA: 26/06/2026

[ASSINATURA DIGITAL]
Ricardo Correia
Terapeuta Certificado
```

**Zero custos:** Canvas + PDF.js (grátis)

---

### **FASE 5: Videochamada Integrada** (Depois)

**Opções:**
1. **Jitsi Meet** (grátis, self-hosted)
2. **Google Meet** (grátis, integrado)

**O que vai ter:**
```
✅ Botão "Iniciar Videochamada"
✅ Link gerado automaticamente
✅ Histórico de chamadas
✅ Gravação opcional (Jitsi)
```

**Exemplo:**
```
Painel Terapeuta:
└─ "Iniciar Videochamada com João"
   ├─ Cria link automático: https://jitsi.example.com/vitaldoctor/joao123
   ├─ Envia para paciente por WhatsApp/Email
   ├─ Paciente clica
   ├─ Videoconferência começa
   └─ Sistema grava se ativado
```

---

### **FASE 6: Documentos Assinados Digitalmente** (Depois)

**O que vai ter:**
```
✅ Termo de Consentimento Informado
✅ Contrato de Serviços
✅ Política de Privacidade (auto-gerada)
✅ Recibo de Consulta
✅ Assinatura digital do paciente
```

---

## 🔗 INTEGRAÇÕES GRÁTIS

| Ferramenta | Uso | Custo | Limite |
|---|---|---|---|
| **Brevo** | Email + SMS | Grátis | 300 emails/dia, 300 SMS/mês |
| **WhatsApp API** | Mensagens | Grátis | 1000 msg/mês (depois 0.5¢ por msg) |
| **Baileys** | Bot WhatsApp | Grátis | Unlimited |
| **Jitsi** | Videochamada | Grátis | Unlimited |
| **Google Meet** | Videochamada | Grátis | 60 min (3+ pessoas) |
| **Canvas/PDF.js** | Assinatura | Grátis | Unlimited |
| **Supabase** | Base de dados | Grátis | 50K linhas |
| **Vercel** | Hosting | Grátis | Unlimited |

**TOTAL CUSTOS PERMANENTES: $0 (zero)**

---

## 📱 TESTE AGORA

1. **Upload** do arquivo para GitHub
2. **Deploy** no Vercel (automático)
3. **Entra** no painel Clínica
4. **Testa:**
   - ✅ Dashboard carrega
   - ✅ Lembretes funcionam
   - ✅ WhatsApp link funciona

---

## 🆘 TROUBLESHOOTING

### **Brevo — Erro ao enviar email**
```
Problema: "Erro: Verifica a chave API"
Solução:
1. Vai para brevo.com
2. Menu: Configurações → SMTP & API
3. Copia a chave (não a antiga)
4. Cola novamente no painel
```

### **WhatsApp — Mensagem não chegou**
```
Problema: "Erro ao enviar WhatsApp"
Solução (API):
1. Verifica se o numero tem o código país (+351)
2. Confirma que a conta está ativa (não suspensa)
3. Aguarda 24h (novo número precisa verificação)
```

### **Armazenamento — Chaves não guardadas**
```
Problema: "Chave desaparece ao recarregar"
Solução:
1. Verifica se localStorage está ativado (não estás em Incógnito)
2. Clica "Guardar" explicitamente
3. Abre DevTools (F12) → Application → Local Storage
```

---

## 🎓 PRÓXIMAS REUNIÕES

**Reunião Hoje:**
- ✅ Dashboard implementado
- ✅ WhatsApp 3 opções
- ✅ Lembretes por email
- ❌ Prescrições assinadas (próxima fase)
- ❌ Videochamada (próxima fase)

**Próxima Semana:**
- ✅ Prescrições digitais assinadas
- ✅ Videochamada Jitsi
- ✅ Documentos (termo, contrato, recibo)

---

**Mais dúvidas? Contacta: suportevitaldoctor@gmail.com**

VitalDoctor © 2026 - Zero custos, máxima qualidade 🚀
