# 💼 COMO MANTER A APP SEM SER PROGRAMADOR

## OBJETIVO
Instruções passo-a-passo para você fazer tarefas comuns **sem tocar em código**.

---

## 📋 TAREFAS QUE VOCÊ CONSEGUE FAZER

### **1. ADICIONAR UM NOVO TERAPEUTA**

**Situação:** Um novo cliente quer usar a app.

**Passo-a-passo:**

```
PASSO 1: Abrir a app
├─ https://vital-doctor.vercel.app
└─ Faz login (com tua conta super admin)

PASSO 2: Ir para Painel
├─ Procura no menu: "Administração" ou "Super Admin"
├─ Se não vires, não há painel de admin user
└─ (Vê "Parte 2.2" abaixo - via Supabase)

PASSO 3: Adicionar terapeuta
├─ Clica "Adicionar novo terapeuta"
├─ Preenche:
│  ├─ Nome: [nome do terapeuta]
│  ├─ Email: [email@dele]
│  ├─ Telefone: [número]
│  └─ Especialidade: [o que ele trata]
├─ Clica "Guardar"
└─ Terapeuta recebe email para criar senha

PASSO 4: (Opcional) Dar permissões especiais
├─ Se é método BioMicroHertz:
│  ├─ Vai para Super Admin
│  ├─ Procura o terapeuta
│  ├─ Marca: "Tem acesso ao módulo exclusivo"
│  ├─ Clica "Guardar"
│  └─ Pronto! Consegue usar BioMicroHertz
```

**Se não tiver painel de admin na app (VER 2.2 ABAIXO):**

---

### **2. TAREFAS NO SUPABASE (Para admin técnico)**

#### **2.1 VER QUANTOS CLIENTES TENS**

```
1. Vai para: https://supabase.com/dashboard
2. Entra no projeto: lrmylsywevawexzcgqzc
3. Clica "SQL Editor" (lado esquerdo)
4. Clica "New Query"
5. Cola isto:

SELECT COUNT(*) as total_terapeutas, 
       COUNT(DISTINCT terapeuta_id) as terapeutas_com_pacientes
FROM profiles;

6. Clica "Run" (botão preto)
7. Vê resultado: "total_terapeutas: X"
```

---

#### **2.2 ADICIONAR TERAPEUTA (VIA SUPABASE)**

```
1. Vai para Supabase → SQL Editor
2. Clica "New Query"
3. Cola isto:

INSERT INTO auth.users (
  email,
  email_confirmed_at,
  password_hash,
  raw_user_meta_data
)
VALUES (
  'novo.terapeuta@email.com',
  now(),
  crypt('SenhaTemporaria123!', gen_salt('bf')),
  '{"nome":"João Silva","telefone":"+351912345678"}'
);

4. Muda:
   - 'novo.terapeuta@email.com' → email dele
   - 'SenhaTemporaria123!' → senha temporária
   - "João Silva" → nome dele

5. Clica "Run"
6. Pronto!

(Depois ele consegue fazer login e mudar senha)
```

---

#### **2.3 DAR ACESSO AO MÓDULO BIOMICROHERTZ**

```
1. Vai para Supabase → SQL Editor
2. Clica "New Query"
3. Cola isto:

UPDATE profiles
SET has_exclusive_therapy_access = true
WHERE email = 'novo.terapeuta@email.com';

4. Muda 'novo.terapeuta@email.com' → email dele
5. Clica "Run"
6. Pronto! Ele consegue ver o módulo BioMicroHertz
```

---

#### **2.4 REMOVER ACESSO AO MÓDULO**

```
1. Vai para Supabase → SQL Editor
2. Clica "New Query"
3. Cola isto:

UPDATE profiles
SET has_exclusive_therapy_access = false
WHERE email = 'novo.terapeuta@email.com';

4. Clica "Run"
5. Pronto! Ele já não vê BioMicroHertz
```

---

### **3. FAZER BACKUP DA BD**

**Situação:** Quer guardar cópia da BD para emergência.

```
PASSO 1: Ir para Supabase
├─ https://supabase.com/dashboard
└─ Projeto: lrmylsywevawexzcgqzc

PASSO 2: Procurar Backups
├─ Menu esquerdo → "Backups"
└─ Clica "Create backup"

PASSO 3: Aguarda (~5 min)
├─ Supabase cria cópia automática
└─ Vê em "Backups" quando terminar

PASSO 4: Download (se possível)
├─ Clica no backup
├─ Clica "Download"
└─ Guarda seguro (HD + externo)

FREQUÊNCIA:
├─ Mínimo: 1x por mês
├─ Ideal: 1x por semana
└─ Essencial se tem clientes pagos
```

---

### **4. VER ACTIVIDADE (Quem fez o quê)**

**Situação:** Quer saber quantas consultas foram feitas este mês.

```
PASSO 1: Supabase → SQL Editor
PASSO 2: New Query
PASSO 3: Cola isto:

-- Consultas este mês
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  COUNT(*) as total_consultas,
  COUNT(DISTINCT terapeuta_id) as terapeutas_ativos
FROM consultas
WHERE created_at >= DATE_TRUNC('month', now())
GROUP BY mes;

PASSO 4: "Run"
PASSO 5: Ve resultado

Resultado exemplo:
mes: June 2026
total_consultas: 47
terapeutas_ativos: 5
```

---

### **5. REINICIALIZAR PASSWORD DE TERAPEUTA**

**Situação:** Terapeuta esqueceu password.

```
OPÇÃO A: Deixar ele usar "Forgot Password"
├─ Ele entra em: https://vital-doctor.vercel.app
├─ Clica "Esqueci a senha"
├─ Escreve o email
├─ Recebe link
├─ Reseta password
└─ Pronto! (Sem você fazer nada)

OPÇÃO B: Você resetar (se precisar)
├─ Vai para Supabase
├─ Authentication → Users
├─ Procura o email
├─ Clica nele
├─ "Reset password"
├─ Sistema envia link
└─ Ele recebe email para resetar
```

---

### **6. DELETAR UM CLIENTE (RGPD - Direito ao Esquecimento)**

**Situação:** Cliente pede para eliminar conta e dados.

```
AVISO: Isto é PERMANENTE! Fazer backup antes.

PASSO 1: Fazer backup (vê acima "3. FAZER BACKUP")

PASSO 2: Ir para Supabase
├─ SQL Editor → New Query
└─ Cola isto:

-- DELETAR UM CLIENTE
DELETE FROM pacientes 
WHERE id = 'ID_DO_CLIENTE';

-- DELETAR DADOS DE CONSULTA DELE
DELETE FROM consultas 
WHERE paciente_id = 'ID_DO_CLIENTE';

PASSO 3: Procurar ID_DO_CLIENTE
├─ Vai para Supabase → Data Editor
├─ Tabela "pacientes"
├─ Procura pelo nome
├─ Copia o ID (começa com UUID)
├─ Volta para SQL
├─ Cola no comando acima

PASSO 4: "Run"
PASSO 5: Pronto!

(Dados deletados, cliente pode pedir comprovativo)
```

---

### **7. ATUALIZAR CREDENCIAIS (Brevo, WhatsApp, etc.)**

**Situação:** Mudaste a chave API do Brevo.

```
PASSO 1: Painel da app
├─ Clica "Painel" → "Clínica"
└─ Scroll para "Lembretes Automáticos" ou "WhatsApp"

PASSO 2: Clicar "Editar" ou "Guardar"
├─ Campo de chave API vazio
├─ Cola a chave nova
└─ Clica "Guardar"

PASSO 3: Pronto!
├─ Credenciais atualizadas
├─ Próximas mensagens usam chave nova
└─ Sem restart necessário
```

---

## ⚠️ TAREFAS QUE PRECISAM PROGRAMADOR

### **Coisas que NÃO consegues fazer sozinho:**

```
❌ Mudar design/cores da app
❌ Adicionar novas funcionalidades
❌ Corrigir bugs no código
❌ Mudar estrutura da BD
❌ Integrar novos serviços (ex: novo payment gateway)
❌ Otimizar performance
❌ Adicionar relatórios customizados

✅ MAS: Pode pedir-me (ou outro dev) para fazer
   └─ Deixa documentado o que quer
   └─ Prepara orçamento
   └─ Espera desenvolvimento
```

---

## 🔍 TROUBLESHOOTING (Problemas Comuns)

### **"Terapeuta diz que não consegue fazer login"**

```
Solução 1: Email não foi confirmado
├─ Supabase → Authentication → Users
├─ Procura o email
├─ Se diz "unconfirmed", reenviar email:
│  └─ Clicar nome → "Resend confirmation link"
└─ Ele recebe email, clica link, tá feito

Solução 2: Senha incorreta
├─ Dizer para clicar "Esqueci a senha"
├─ Email recebe link
├─ Reseta e consegue entrar

Solução 3: Conta deletada
├─ Criar conta nova (vê "1. ADICIONAR TERAPEUTA")
```

---

### **"App está muito lenta"**

```
Culpa provável: BD tem muitos dados

Solução:
├─ Limpar dados antigos (> 2 anos)
│  └─ SQL: DELETE FROM consultas WHERE created_at < '2024-01-01';
├─ Recriar índices em Supabase
│  └─ Supabase → Database → Indexes → Reindex
└─ Aumentar compute (se persistir)
   └─ Supabase → Settings → Compute

Tempo: 30 min
Custo: Grátis ou +$10/mês (compute)
```

---

### **"Email de lembrete não está a chegar"**

```
Checklist:
☐ Verificar chave Brevo está correta (Painel → Clínica)
☐ Verificar em Brevo: email "sender" está verificado
☐ Verificar em Brevo: conta não atingiu limite diário
☐ Aguardar 5 min (às vezes fica em fila)
☐ Verificar em email do cliente: carpeta SPAM

Se ainda não chegar:
├─ Trocar para SendGrid (alternativa)
└─ Ou: usar WhatsApp em vez de email
```

---

## 📚 DOCUMENTAÇÃO PARA CONSULTAR

Guardar estes ficheiros locais para referência:

```
📁 DOCUMENTACAO/

├─ COMO_MANTER_APP.md (este ficheiro)
├─ COMO_RESTAURAR.md (para emergências)
├─ LISTA_CREDENCIAIS.md (credenciais + senhas)
├─ LISTA_CONTACTOS.md (contactos de suporte)
├─ SQL_QUERIES_UTEIS.md (comandos SQL comuns)
└─ FAQ.md (perguntas frequentes)
```

---

## ✅ CHECKLIST MENSAL

Fazer isto todo o mês para manter app saudável:

```
☐ Fazer backup da BD (Supabase backups)
☐ Verificar número de terapeutas ativos
☐ Verificar número de consultas realizadas
☐ Limpar dados antigos (> 2 anos)
☐ Verificar status de Supabase/Vercel
☐ Atualizar credenciais (se expiradas)
☐ Testar email de lembrete (enviar teste)
☐ Testar WhatsApp (enviar teste)
☐ Ler feedback de clientes
☐ Planejar melhorias (anotar ideias)
```

---

## 🎯 AJUDA PROFISSIONAL

Quando chamar um programador:

```
SITUAÇÃO 1: Quer adicionar funcionalidade nova
Custo: €50-200 (depende complexidade)
Tempo: 1-2 semanas

SITUAÇÃO 2: App com bug
Custo: €20-50 (se simples) ou €100-500 (se complexo)
Tempo: 1-3 dias

SITUAÇÃO 3: Otimização de performance
Custo: €200-500
Tempo: 1-2 semanas

SITUAÇÃO 4: Integração de novo serviço
Custo: €300-1000
Tempo: 2-4 semanas

💡 DICA: Sempre pedir orçamento ANTES de autorizar!
```

---

**Com isto, você consegue manter a app sozinho! 🚀**
