# VitalDoctor SaaS 🚀

**A plataforma zero-cost para gestão clínica, agnóstica para qualquer terapia.**

## ✨ O que é?

VitalDoctor é uma aplicação SaaS moderna para terapeutas que oferece:

- ✅ **Dashboard com KPIs** — Vê métricas em tempo real
- ✅ **Módulos Terapêuticos Customizados** — Cria qualquer fluxo de consulta
- ✅ **Lembretes Automáticos** — Email (Brevo, grátis)
- ✅ **WhatsApp Integrado** — 3 opções (Link direto / API / Bot)
- ✅ **Mini-site Editável** — Página pública do terapeuta
- ✅ **Prontuário Eletrônico** — Histórico de pacientes
- ✅ **Relatórios Automáticos** — Gerados com templates
- ✅ **RGPD Completo** — Conformidade legal + exportação de dados
- ✅ **Zero Custos** — Grátis, sem subscrição mensal

## 🎯 Para Quem?

Terapeutas, fisioterapeutas, naturopatas, reflexólogos, reikistas, e qualquer profissional que queira:
- Gestão profissional de pacientes
- Automação de processos
- Zero custos de infraestrutura
- Controlo total dos dados

## 🚀 Start Rápido

### 1. Deploiar

```bash
# Clone o repositório
git clone https://github.com/ricardocorreia211984/VitalDoctor.git

# A app já está pronta em Vercel
# (sincroniza automaticamente)
```

### 2. Criar Conta

1. Vai para: **https://vital-doctor.vercel.app**
2. Clica **"Criar Conta"**
3. Email + senha
4. Pronto!

### 3. Configurar

#### Email (Brevo - Grátis)
```
1. https://www.brevo.com → Cria conta
2. API → Copia chave
3. Painel → Lembretes → Cola chave
```

#### WhatsApp (Escolhe uma opção)

**Opção A: Link Direto (Recomendado)**
```
1. Painel → WhatsApp Integrado
2. Introduce teu número (+351912345678)
3. Pronto!
```

**Opção B: API Oficial**
```
1. https://developers.facebook.com
2. Segue guia em SETUP_WHATSAPP_PRESCRICOES_VIDEO.md
```

**Opção C: Baileys Bot**
```
1. Segue guia técnico em SETUP_WHATSAPP_PRESCRICOES_VIDEO.md
```

## 📖 Documentação Completa

- **[SETUP_WHATSAPP_PRESCRICOES_VIDEO.md](./SETUP_WHATSAPP_PRESCRICOES_VIDEO.md)** — Guia detalhado de todas as integrações
- **[ARQUITETURA.md](./docs/ARQUITETURA.md)** — Como funciona internamente
- **[FAQ.md](./docs/FAQ.md)** — Perguntas frequentes

## 💡 Funcionalidades

### Dashboard
- Consultas este mês
- Pacientes ativos
- Total de consultas
- Consultas hoje
- Histórico recente

### Módulos Terapêuticos
- Criar estrutura customizada
- Seções com ícones e descrições
- Itens com protocolos automáticos
- Fluxo de consulta passo-a-passo
- Relatórios automáticos

### Gestão de Pacientes
- Criar e editar pacientes
- Histórico de consultas
- Documentos anexados
- Notas clínicas

### Integrações
- Email (Brevo)
- WhatsApp (3 opções)
- Google Calendar (em breve)
- Videochamada (em breve)

## 🔐 Segurança & Privacidade

- ✅ RLS (Row Level Security) no Supabase
- ✅ Dados isolados por terapeuta
- ✅ RGPD completo (exportação, direito ao esquecimento)
- ✅ Política de privacidade automática
- ✅ Backups automáticos

## 💰 Custos

| Serviço | Custo | Limite |
|---|---|---|
| **Hosting (Vercel)** | Grátis | Unlimited |
| **Base de Dados (Supabase)** | Grátis | 50K linhas |
| **Email (Brevo)** | Grátis | 300/dia |
| **SMS (Brevo)** | Grátis | 300/mês |
| **WhatsApp (API)** | Grátis | 1000/mês |
| **WhatsApp (Bot)** | Grátis | Unlimited |
| **Total Mensal** | **$0** | |

Concorrentes cobram **$100-300/mês**. VitalDoctor é **100% grátis**.

## 🔧 Stack Técnico

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Autenticação:** Supabase Auth
- **Storage:** Supabase Storage

## 📝 Roadmap

### ✅ Implementado
- Dashboard com KPIs
- Email automático
- WhatsApp (3 opções)
- Módulos customizados
- Mini-site editável
- RGPD

### 🔄 Em Desenvolvimento
- Prescrições digitais assinadas
- Videochamada (Jitsi)
- Documentos profissionais

### 🚀 Planejado
- Email marketing
- Chat em tempo real
- Google Calendar
- App mobile nativa (iOS/Android)
- Analytics avançado

## 🤝 Contribuir

Este é um projeto open-source. Sugestões e PRs são bem-vindas!

## 📧 Suporte

- Email: suportevitaldoctor@gmail.com
- Documentação: Ver [SETUP_WHATSAPP_PRESCRICOES_VIDEO.md](./SETUP_WHATSAPP_PRESCRICOES_VIDEO.md)

## 📄 Licença

MIT License — Livre para usar, modificar e distribuir.

---

**Feito com ❤️ para terapeutas que querem profissionalismo sem custos.**

VitalDoctor © 2026
