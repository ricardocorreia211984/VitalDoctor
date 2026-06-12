# VITALDOCTOR — DOCUMENTO DE HANDOFF COMPLETO
## Para o assistente de código que vai continuar este projecto

Lê este documento INTEIRO antes de tocar em qualquer linha de código.

---

## 1. O QUE É O PROJECTO

**VitalDoctor** é uma aplicação SaaS de gestão clínica para terapeutas (multi-tenant), em React + Supabase.
O dono do produto (Hikari/Ricardo) trabalha **exclusivamente no telemóvel**, tem pouco conhecimento técnico, e comunica por transcrição de voz (texto imperfeito). Tudo o que entregares tem de ser:
- **Solução completa, nunca parcial** — ele rejeita patches incrementais
- **Ficheiro completo pronto a fazer upload** via interface web do GitHub
- **Instruções passo a passo simples** (não tem CLI, não tem ambiente local)

---

## 2. INFRAESTRUTURA E ACESSOS

| Item | Valor |
|---|---|
| **Repositório GitHub** | https://github.com/ricardocorreia211984/VitalDoctor |
| **Upload de ficheiros** | https://github.com/ricardocorreia211984/VitalDoctor/upload/main |
| **App em produção** | https://vitaldoctor.netlify.app |
| **Deploy** | Netlify auto-deploy a partir do branch `main` do GitHub (cada commit faz redeploy automático em ~1-2 min) |
| **Supabase Project Ref** | `lrmylsywevawexzcgqzc` |
| **Supabase URL** | `https://lrmylsywevawexzcgqzc.supabase.co` |
| **Supabase anon/publishable key** | `sb_publishable_pOcM1sN-hhJh9ID8pSt7gA_K2tSDDWL` (já está no código) |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/lrmylsywevawexzcgqzc |
| **SQL Editor** | https://supabase.com/dashboard/project/lrmylsywevawexzcgqzc/sql/new |
| **Email do Super Admin** | `ricardocorreia.211984@gmail.com` (reconhecido automaticamente no código como superadmin) |
| **Pagamentos** | Hotmart via webhook (Edge Function `hotmart-webhook.ts` no repo — confirmar se está deployed) |

O dono faz alterações SQL colando scripts no SQL Editor do Supabase. Entrega sempre SQL pronto-a-colar.

---

## 3. REGRAS CRÍTICAS DE ANONIMIZAÇÃO (NUNCA VIOLAR)

O módulo principal implementa um método terapêutico proprietário de uma parceira comercial. **É ESTRITAMENTE PROIBIDO** que estas strings apareçam em qualquer código, interface, comentário ou texto visível:

- 🚫 `"BioMicroHertz"` → usar **"Mapeamento Energético Vital"** ou **"Frequência Vital"**
- 🚫 `"Padrão Ouro"` / `"padrão de ouro"` → usar **"Protocolo de Excelência"** ou **"Atendimento Estruturado"**
- 🚫 `"Regiane Cunha"` → remover qualquer referência; usar termos genéricos ("o método", "Atendimento Especializado")

Antes de cada entrega, faz grep por estes termos. Se aparecerem, a entrega é rejeitada.

---

## 4. ARQUITECTURA DO CÓDIGO

### Ficheiros no repositório
```
VitalDoctor_SaaS.jsx     ← FICHEIRO PRINCIPAL (~3.785 linhas, toda a app)
main.jsx                 ← entry point Vite (importa VitalDoctor_SaaS.jsx)
index.html               ← shell HTML
vite.config.js           ← config Vite
netlify.toml             ← config deploy
package.json
mapaCorporal.js          ← dados: pontos corporais, centros vitais, sistemas
baseConhecimento.js      ← dados: ESCUDOS, QUESTIONARIO_ESCUDOS, PERGUNTAS_ABERTURA, CAMINHOS, PROTOCOLO
atendimento.js           ← dados antigos (TIPOS_ATENDIMENTO, passosDoTipo) — JÁ NÃO É USADO no fluxo de consultas (substituído por definições internas no JSX), mas o import ainda existe
protocoloCura.js         ← gerarProtocoloCura, AFIRMACOES_ESCUDO
gerarRelatorio.js        ← pontuarEscudos
responsabilidade.js      ← AVISO_SAUDE, jaAceitou, registarAceite
fichaPaciente.js, modulos.js, backup.js  ← auxiliares
farmacia.sql             ← seed da Farmácia Natural (17 ervas)
infanto.sql              ← seed do módulo infanto-juvenil
supabase_setup.sql       ← schema base
hotmart-webhook.ts       ← Edge Function para activação por pagamento
CONTEXTO_PROJETO.md      ← documento de continuidade anterior
```

### Componentes dentro de VitalDoctor_SaaS.jsx (ordem no ficheiro)
```
TERMOS_APP + TermosModal + AvisoRodape    ← termos legais com scroll obrigatório (1ª sessão; localStorage vd_termos_{uid})
TIPOS_CONSULTA_LOCAL / PASSOS_BASE / getPassosLocal  ← tipos de consulta definidos INTERNAMENTE
Auth                                       ← login/registo Supabase
Dashboard                                  ← acesso rápido (APENAS Pacientes, Agenda, Mini Site + botão Nova Consulta; Admin NUNCA aqui)
Pacientes / Agenda
FormBuilder                                ← construtor de formulários no admin (guarda em config_global, chave "formularios_custom")
AdminPanel                                 ← tabs: users, conteudo, formularios, modulos, hotmart, audio, stats
Mapeamento                                 ← componente ANTIGO de mapeamento (legado, ainda presente)
MatrixSelector                             ← grelha radio estilo Google Forms
gerarRelatorioFiel                         ← gera relatório só com campos preenchidos
EnviarRelatorio                            ← modal pós-guardar: PDF/Imprimir, WhatsApp (wa.me), Copiar
FormPrimeiroAtendimento (form_a)           ← consulta única: Acolhimento→Dados→6 Perguntas→Protocolo
FormMapeamentoGrelha (form_b)              ← grelha completa: 8 passos do protocolo
FormAtendimentoEstruturado (form_c)        ← Monitorização→6 Perguntas→Caminho 1/3→Protocolo
NovaConsulta                               ← menu dos 3 cartões A/B/C
ModuloMetodo                               ← orquestra: aceite→tabs→selecção paciente→formulário→guardar
FormFill / Questionario / FormPublico      ← questionários (FORMS_DEF) + link público (?form=token)
Farmacia / Infanto / Assistente / ModuloAudios / MiniSite
```

### Fluxo da consulta (estado actual — FUNCIONAL)
1. Tab "Atendimento Especializado" → ecrã de aceite (1ª vez) → "Nova Consulta"
2. 3 cartões: **A — 1º Atendimento**, **B — Mapeamento Energético Vital**, **C — Atendimento Estruturado**
3. Clicar num cartão → selecção de paciente (filtrado por `terapeuta_id`, com pesquisa)
4. Formulário guiado passo a passo com barra de progresso
5. "Gerar Relatório e Guardar" → insere em `consultas` → modal EnviarRelatorio (PDF / WhatsApp / Copiar)

---

## 5. BASE DE DADOS (Supabase)

### Tabelas em uso
| Tabela | Conteúdo | Isolamento |
|---|---|---|
| `profiles` | perfis dos utilizadores; `role` = user/admin/superadmin; flags de módulos | id = auth.uid |
| `pacientes` | pacientes de cada terapeuta | `terapeuta_id` |
| `consultas` | consultas guardadas: `paciente_id, paciente_nome, terapeuta_id, tipo, dados_formulario (jsonb), relatorio (text), data` | `terapeuta_id` |
| `agenda` | marcações | `terapeuta_id` |
| `pagamentos` | registos de pagamento manuais | `terapeuta_id` |
| `respostas` | respostas a questionários (inclui links públicos) | `terapeuta_id` |
| `materiais` | conteúdos/biblioteca | global ou por terapeuta |
| `audios` | biblioteca de áudios | global (gerida no admin) |
| `config_global` | chave/valor jsonb — conteúdo no-code: `formularios_custom`, `infanto`, etc. | global |

### REGRA DE OURO DO ISOLAMENTO (já implementada — manter sempre)
1. **RLS activo** em todas as tabelas de dados de pacientes com políticas owner-only (`terapeuta_id = auth.uid()`)
2. **Filtro no código** em TODAS as queries: `.eq("terapeuta_id", user.id)`
3. Ambas as camadas são obrigatórias. Houve uma fuga de dados no passado por falta do filtro no código — já corrigida (8 políticas RLS verificadas).
4. Nenhum terapeuta pode ver pacientes/consultas de outro. NUNCA.

### Permissões e Super Admin
- O email `ricardocorreia.211984@gmail.com` é forçado a `role = superadmin` no login (código)
- Sidebar só mostra "Painel Admin" se `isAdmin`
- Render do AdminPanel: `{mod === "admin" && isAdmin && <AdminPanel/>}`
- O módulo especializado fica oculto/bloqueado por defeito; o admin concede acesso por subscritor (tab Módulos do AdminPanel, com datas de expiração via `temMod()`)

---

## 6. O MÉTODO TERAPÊUTICO (conteúdo que a app implementa)

A app guia o terapeuta pelo protocolo do método da parceira. Documentos-fonte estão no conhecimento do projecto (PDFs). Resumo do que JÁ está implementado e tem de se manter fiel:

### Consulta Única (form_a)
- Acolhimento: identificar estado emocional → **ansioso** (caminhos rápidos/práticos) ou **depressivo** (acolhimento, micro-metas)
- Recolha de dados: nome, idade, profissão, quadro clínico, medicação
- **6 Perguntas do Poder**: Quem é você hoje? / Já passou por isso antes? / 3 piores momentos da vida? / Quantas crises por semana? / Sintomas principais? / Foco da consulta hoje?
- Indicação terapêutica + técnicas (Audioterapia Frequencial, Libertação consciente, Memória celular, Ressignificação) + Protocolo de cura para casa

### Mapeamento (form_b) — grelha estilo Google Forms, colunas FRENTE.Drt./FRENTE.Esq./COSTAS.Esq./COSTAS.Drt.
1. **Energia Vital** (centros: Coronário, Laríngeo, Cardíaco, Plexo, Plexo Solar, Esplénico...)
2. **Zona de Impacto** (13 pontos: topo cabeça, ombros, costelas, mãos, ancas, joelhos, pés)
3. **Lateralidade**: Esq = trauma racionalizado (ansiedade/burnout) · Drt = trauma emocionalizado (depressão/luto)
4. **Sistemas**: Superior (9: Epífise, Hipotálamo, Hipófise, Amígdalas, Paratireoide, Timo, Gl. Salivares, Tireoide, Esófago) · Central (12: Vasos Linfáticos, Int. Grosso, Coração, Brônquios, Alvéolos, Int. Delgado, Baço, Fígado, Estômago, Duodeno, Vesícula, Pâncreas) · Inferior (6: Gl. Mamárias, Útero/Próstata, Suprarrenais, Testículos/Ovários, Rins, Bexiga)
5. **Escudo Ativo**: Desproteção, Desvalorização, Impotência, Sobrevivência, Perda
6. **Tempo do Conflito**: Transgeracional / Gestacional / Pós-parto + especificação
7. **Devolutiva** ao paciente

### Atendimento Estruturado (form_c) — 3 Caminhos
- Monitorização (crises desde a última sessão, o que mudou)
- 6 Perguntas do Poder
- **Caminho 1** — Mente Consciente: pontuar 5 escudos 0-10, escudo dominante automático
- **Caminho 2** — Mente Subconsciente: remete para o Mapeamento (form_b)
- **Caminho 3** — Estressores Ativos: 5 perguntas (quem estressa, o que desestabiliza, situações que tiram o foco, padrão do passado, o que tinham em comum)
- Protocolo de cura 7 ou 15 dias

### Pack de 3 Consultas (estrutura do método)
- C1: Mente Consciente + escudos + protocolo 7 dias
- C2: revisão + mapeamento + áudio 7/15 dias
- C3: checklists + autocuidado + 7 meditações de encerramento

### Questionários (FORMS_DEF, completos)
Pré-Consulta (6 blocos/18 perguntas), Pós-Consulta (3/12), Escudos Emocionais (de baseConhecimento.js, escala 1-3), Medos (4 blocos/22), Anamnese da Criança (5/15), Ficha para Pais (6/23), Ficha para Professores (5/20). Todos enviáveis por link público/WhatsApp ou preenchíveis na app.

### Infanto-Juvenil
5 faixas etárias (0-2, 3-4, 5-7, 8-11, 12-17) com características, abordagem, sinais de alerta, tempo de consulta, escudo-chave e botões para os questionários da faixa.

---

## 7. REGRAS DE TRABALHO (o dono exige)

1. **Validar SEMPRE com esbuild antes de entregar**: `esbuild VitalDoctor_SaaS.jsx --platform=browser --jsx=automatic` → tem de dar exit 0, zero erros. Erros comuns no passado: declarações duplicadas, chavetas desequilibradas, aspas mal fechadas em JSX.
2. **Entregar o ficheiro COMPLETO** — nunca instruções de "substitui a linha X". Ele faz upload do ficheiro inteiro pelo browser.
3. **Não apagar o que funciona** — alterações cirúrgicas; preservar todos os componentes existentes.
4. **Termos legais e avisos**: a app tem TERMOS_APP (modal com scroll obrigatório na 1ª sessão), AvisoRodape global, aviso legal na Farmácia, e ecrã de aceite no módulo especializado. Manter. A app deve sempre comunicar que é ferramenta de apoio, pode conter erros, não substitui formação/médico, e que a responsabilidade é do terapeuta.
5. **Acesso Rápido do Dashboard**: APENAS funcionalidades universais (Pacientes, Agenda, Mini Site, botão Nova Consulta). O Painel Admin NUNCA aparece aí — só na sidebar e apenas para admin.
6. **Português europeu** em toda a interface.

---

## 8. ESTADO ACTUAL E PENDENTES

### ✅ Feito e funcional (commit mais recente no GitHub, 3.785 linhas)
- 3 formulários de consulta guiados (A/B/C) fiéis ao protocolo
- Relatório fiel + modal PDF/WhatsApp/Copiar + cópia na ficha (`consultas`)
- Isolamento de dados completo (RLS + filtros)
- Termos legais, avisos, ecrã de aceite do módulo
- FormBuilder no admin, questionários completos, Infanto por idades
- Admin: subscritores, conteúdo, módulos com expiração, Hotmart, áudios, stats

### 🔧 Pendentes (por ordem de prioridade)
1. **Testar em produção** o fluxo completo dos 3 formulários (o dono ainda não confirmou que funciona após o último deploy)
2. Linha do tempo do paciente (histórico de consultas visível na ficha)
3. Iniciar consulta directamente da agenda
4. Templates de WhatsApp configuráveis no admin
5. **Module Builder** — criar módulos completos sem código (arquitectura JSON: tipos_consulta, questionarios, conhecimento, permissão, visibilidade)
6. Dashboard financeiro real, mensagens em massa, exportar CSV
7. Editor do mini-site, pesquisa global, notas rápidas
8. Portal do paciente (link único, histórico, documentos)
9. Confirmar deploy do `hotmart-webhook.ts` (Edge Function) e dos seeds `farmacia.sql`/`infanto.sql`
10. Arquitectura de clínicas/organizações (tabela `organizacoes`, org_id em profiles) — desenhada, não deployed
11. Preços a finalizar: Solo €15/mês, tiers Clinic S/M/L

### ⚠️ Frustrações conhecidas do dono (evitar repetir)
- Recebeu demasiadas vezes "correções" que não resolviam o fluxo de consulta completo — a causa raiz era a dependência do `atendimento.js` externo, já eliminada (definições internas no JSX)
- Não quer ver o mapeamento como única consulta funcional — TODOS os tipos têm de abrir um fluxo guiado completo
- Exige autonomia total no painel admin (no-code) para não depender de programadores

---

## 9. CHECKLIST DE CADA ENTREGA

```
[ ] grep -i "biomicrohertz\|regiane\|padrão ouro\|padrao ouro" → 0 resultados
[ ] esbuild → exit 0, 0 erros
[ ] Todas as queries de dados de pacientes têm .eq("terapeuta_id", user.id)
[ ] Nada do que funcionava foi removido
[ ] Ficheiro completo entregue + instrução: upload em
    https://github.com/ricardocorreia211984/VitalDoctor/upload/main
[ ] Se houver SQL: script completo pronto a colar no SQL Editor
```

Boa sorte. O dono sabe exactamente o que quer — lê os documentos do método no conhecimento do projecto e implementa fiel, completo e validado à primeira.
