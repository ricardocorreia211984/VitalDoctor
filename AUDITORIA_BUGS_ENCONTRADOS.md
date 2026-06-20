# 🚨 AUDITORIA DE BUGS - VitalDoctor SaaS

**Data:** 20 Jun 2026  
**Status:** EM PROGRESSO  
**Prioridade:** CRÍTICA (Reunião hoje à noite)

---

## ✅ BUGS CORRIGIDOS

### BUG #1: Criar Módulo Terapêutico não funcionava
**Severidade:** 🔴 CRÍTICA  
**Problema:** Botão "➕ Criar Módulo" sem onClick e formulário não controlado  
**Sintoma:** Utilizador clica mas nada acontece  
**Causa:** 
- Inputs sem `value` e `onChange`
- Selects sem `value` e `onChange`  
- Botão sem `onClick`
- Sem states para guardar valores
- Sem função para processar formulário

**Solução Implementada:**
✅ Adicionado state `novoModulo`
✅ Adicionado state `modulesTerapeuticos` (array dinâmico)
✅ Implementada função `criarModuloTerapeutico()`
✅ Todos os inputs agora controlados com `onChange`
✅ Botão com `onClick={criarModuloTerapeutico}`
✅ Validação de nome obrigatório
✅ Array dinâmico mostra novos módulos criados

**Status:** ✅ CORRIGIDO

---

## 🔴 BUGS PENDENTES (Procurados mas não confirmados)

### Possível BUG #2: Áudios como toggle separado
**Status:** REMOVIDO (pedido do utilizador)  
Os áudios agora só fazem parte do módulo Ansiedade & Depressão

### Possível BUG #3: Mini Site Trial 14 dias
**Status:** Implementado mas não testado em produção  
Necessário testar: Countdown, Subscrição, Desativação

### Possível BUG #4: Segurança RLS
**Observação:** 159 queries Supabase encontradas  
**Verificado:** Filtros `.eq("terapeuta_id", user.id)` presentes  
**Recomendação:** Auditar TODAS as queries antes de lançamento

---

## 📋 CHECKLIST DE TESTES URGENTES

### Antes da reunião de hoje (CRÍTICO):

- [ ] **1. Criar Módulo Terapêutico - TESTE AGORA!**
  - [ ] Super Admin → 📚 Módulos Terapêuticos
  - [ ] Clica ✏️ Editar
  - [ ] Preenche: Nome = "Reiki", Emoji = "✨"
  - [ ] Visibilidade = Escondido
  - [ ] Exclusividade = Público
  - [ ] Modelo = Trial 14d
  - [ ] Clica ➕ Criar Módulo
  - [ ] **DEVE**: Aparecer na lista "Módulos Terapêuticos"

- [ ] **2. Toggle Funcionalidades (Subscritores)**
  - [ ] Super Admin → 👥 Utilizadores
  - [ ] Expande subscritor
  - [ ] Toggle 🧠 Módulo Especializado ON/OFF - funciona?
  - [ ] Toggle 🌐 Mini Site ON/OFF - funciona?

- [ ] **3. Painel de Subscritores**
  - [ ] Filtros (Todos/Trial/Base/Pro/Elite) funcionam?
  - [ ] Pesquisa por nome/email funciona?
  - [ ] Dados atualizam em tempo real?

- [ ] **4. Dashboard do Subscritor**
  - [ ] Menu lateral (7 opções) aparece?
  - [ ] Cada opção abre conteúdo certo?
  - [ ] VER/EDITAR funciona?

- [ ] **5. Módulo Especializado (Elite)**
  - [ ] 🧠 Ansiedade & Depressão aparece para Elite?
  - [ ] Menu: Nova Consulta, Questionários, etc funciona?
  - [ ] **NÃO** aparecem seções "super admin"?

- [ ] **6. Mini Site**
  - [ ] Trial 14d countdown aparece?
  - [ ] Link compartilhável funciona?

- [ ] **7. Segurança RLS**
  - [ ] Subscritor A não vê dados de Subscritor B?
  - [ ] Paciente A não vê paciente B?

---

## 📊 ESTRUTURA DE TESTES

```
TESTE MANUAL EM STAGING:
1. Limpar localStorage
2. Fazer login como Super Admin
3. Testar cada funcionalidade
4. Verificar console para erros
5. Testar com diferentes browsers/mobile
```

---

## 📈 PRÓXIMAS AÇÕES

1. **IMEDIATO:** Executar checklist de testes
2. **Se houver falhas:** Corrigir conforme encontra
3. **Antes de upload:** Validar build com esbuild
4. **Deploy:** Fazer upload no GitHub + Vercel
5. **Validação em produção:** Testar na live URL

