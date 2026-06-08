# VitalDoctor — Contexto do Projecto (colar no início de qualquer conversa Claude)

## Identidade do projecto
- **App:** VitalDoctor — SaaS para terapeutas, gestão de negócio + módulo especializado certificado
- **Repo público:** github.com/ricardocorreia211984/VitalDoctor (branch: main, raiz do repo)
- **Live:** vitaldoctor.netlify.app (Netlify auto-deploy via GitHub)
- **Backend:** Supabase — project ID: lrmylsywevawexzcgqzc
- **Admin email:** ricardocorreia.211984@gmail.com (role: superadmin, acesso vitalício)
- **Stack:** React + Vite, ficheiro principal: VitalDoctor_SaaS.jsx (raiz, ~1578 linhas)
- **Regra crítica:** NUNCA escrever "biomicrohertz", "Regiane Cunha" ou "padrão de ouro" no código/UI

## Ficheiros no repo (raiz)
```
VitalDoctor_SaaS.jsx   — app principal (~1578 linhas, single-file React)
main.jsx               — entry point
index.html             — entry HTML
vite.config.js         — Vite config
package.json           — React 18 + Vite 5 + Supabase JS 2
netlify.toml           — deploy config
mapaCorporal.js        — 27 pontos (S1-S9/C1-C12/M1-M6) por nome de órgão
baseConhecimento.js    — 5 escudos, questionário, afirmações, perguntas
gerarRelatorio.js      — motor de relatórios (regras, sem IA)
protocoloCura.js       — protocolo de cura + REACOES_CURA + AFIRMACOES_ESCUDO
atendimento.js         — fluxo de consultas + MAPEAMENTO_PASSOS (4 mapas)
fichaPaciente.js       — ficha + evolução + monitorização
armazenamento.js       — local-first offline + autosave
backup.js              — backup manual/alerta/automático
responsabilidade.js    — avisos AVISO_GERAL + AVISO_SAUDE + aceitação
supabase_setup.sql     — SQL a correr no Supabase (tabelas + colunas)
hotmart-webhook.ts     — Edge Function Supabase para integração Hotmart
```

## Arquitectura da app (navegação por useState `mod`)
```
Dashboard → Pacientes → Agenda
[se temMod("avancado")] → Atendimento Especializado (ModuloMetodo):
  Separadores: Nova Consulta | Mapeamento | Questionários | Assistente | Farmácia | Infanto | Áudios
[se temMod("minisite")]  → Mini Site
[se isAdmin]             → Painel Admin (⚙️)
```

## Painel Admin — separadores
- **Subscritores:** gerir planos (Trial/Base €10/Pro €18/Elite €23), activar módulos, validade do acesso
- **Conteúdo:** adicionar Farmácia/Infanto/Protocolo/Texto sem código
- **Módulos:** stats de acesso por módulo
- **Hotmart:** URL do webhook + instruções de venda
- **Áudios:** biblioteca de áudios via Google Drive
- **Stats:** contagens e receita estimada

## Integração Hotmart — estado actual
- URL webhook: `https://lrmylsywevawexzcgqzc.supabase.co/functions/v1/hotmart-webhook`
- Ficheiro `hotmart-webhook.ts` criado (deploy no Supabase)
- Activação automática: PURCHASE_APPROVED → módulo "avancado" ON + validade
- Cancelamento: PURCHASE_CANCELED → módulo OFF, plano → trial
- Activação pendente: comprador sem conta → guardado em config_global, activa ao registar

## Módulo Especializado — o que está funcional
- **Nova Consulta:** presencial/online → pré-consulta → tipo (Única/Mapeamento/3 Consultas/Manutenção) → passos guiados
- **Mapeamento:** dados do paciente → Mapa 1 (7 centros vitais) → Mapa 2 (13 pontos de entrada com localização) → Mapa 3 (lateralidade, texto livre) → Mapa 4 (sistemas S1-M6) → escudo → relatório de consciência (por ponto: ligado a / sinais / pergunta ao paciente) + protocolo de cura (com REACOES_CURA) → Imprimir/Copiar/Guardar na ficha
- **Questionários:** questionário dos escudos com pontuação automática + escudo dominante + Imprimir
- **Assistente:** análise por palavras-chave da base de conhecimento → sugere escudo, pontos, perguntas, afirmações + voz (Web Speech API)
- **Farmácia:** admin adiciona produtos, terapeutas veem com aviso de responsabilidade
- **Áudios:** biblioteca via Google Drive

## Permissões
- `temMod(m)`: isAdmin OU (modulos_ativos.includes(m) E validade não expirada)
- Permissões: "avancado" (módulo especializado), "audios", "minisite"
- Admin = isAdmin → sempre acesso a tudo

## Validação
- Cada entrega é validada com esbuild bundle (exit 0 = sem erros)
- Importações relativas: `./mapaCorporal.js`, etc. (resolvidas pelo Vite)

## O que falta construir (por ordem de impacto)
1. **Construtor de formulários** — admin cria questionários/anamnese, gera link para paciente preencher, recebe respostas
2. **Base de conhecimento via upload/texto** — admin cola/escreve conteúdo estruturado para sugestões automáticas
3. **Portal do paciente** — histórico, relatórios activos, protocolo
4. **Agenda completa** — anti-marcações-duplas, salas, profissionais, online/presencial
5. **Mini-site** — página pública editável com marcações
6. **Construtor de módulos** — criar módulo novo sem código (além dos que existem)
7. **Pagamentos directos** — integração Stripe (sem Hotmart, menor comissão)

## Como continuar o projecto
1. Colar ESTE documento no início da conversa Claude
2. Dizer: "Continua o projecto VitalDoctor. Faz o ponto X da lista."
3. Claude pode buscar o ficheiro actual: `curl https://raw.githubusercontent.com/ricardocorreia211984/VitalDoctor/main/VitalDoctor_SaaS.jsx`
4. Cada sessão = uma funcionalidade completa + validada com esbuild

## Deploy (sempre o mesmo processo)
1. Descarregar os ficheiros novos
2. `https://github.com/ricardocorreia211984/VitalDoctor/upload/main`
3. Se o .jsx aparecer como .txt → renomear (abrir no editor GitHub, retirar .txt do nome)
4. Netlify faz deploy automático (~1-2 min)

## Deploy da Edge Function Hotmart
1. Supabase Dashboard → Edge Functions → New Function → nome: `hotmart-webhook`
2. Colar o conteúdo de `hotmart-webhook.ts`
3. Settings → Edge Functions → Secrets → adicionar `HOTMART_WEBHOOK_SECRET` (obteres na Hotmart)
4. Na Hotmart: Ferramentas → Webhooks → Adicionar URL → `https://lrmylsywevawexzcgqzc.supabase.co/functions/v1/hotmart-webhook`

## Supabase (para referência)
- Project ID: lrmylsywevawexzcgqzc
- Publishable key: sb_publishable_pOcM1sN-hhJh9ID8pSt7gA_K2tSDDWL
- SQL editor: https://supabase.com/dashboard/project/lrmylsywevawexzcgqzc/sql/new
- Tabelas: profiles, pacientes, consultas, pagamentos, agenda, audios, config_global
