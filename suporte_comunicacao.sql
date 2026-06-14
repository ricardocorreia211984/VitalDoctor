-- ════════════════════════════════════════════════════════════
-- VitalDoctor — Central de Suporte e Comunicação
-- Cola no SQL Editor do Supabase e clica RUN
-- https://supabase.com/dashboard/project/lrmylsywevawexzcgqzc/sql/new
-- ════════════════════════════════════════════════════════════

-- 1. MENSAGENS — subscritor → suporte (dúvidas, comprovativos)
CREATE TABLE IF NOT EXISTS mensagens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  nome        text,
  email       text,
  tipo        text DEFAULT 'duvida',          -- duvida | comprovativo | sugestao
  assunto     text,
  mensagem    text,
  anexo       text,                            -- foto/print em base64 ou link
  estado      text DEFAULT 'novo',             -- novo | lido | resolvido
  resposta    text,                            -- resposta do admin (opcional)
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- O subscritor cria e vê as SUAS mensagens
DROP POLICY IF EXISTS mensagens_owner ON mensagens;
CREATE POLICY mensagens_owner ON mensagens
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- O super admin vê e gere TODAS
DROP POLICY IF EXISTS mensagens_admin ON mensagens;
CREATE POLICY mensagens_admin ON mensagens
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  );

-- 2. AVISOS — admin → todos os subscritores (anúncios, campanhas)
CREATE TABLE IF NOT EXISTS avisos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text,
  corpo       text,
  tipo        text DEFAULT 'info',             -- info | premium | manutencao
  ativo       boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

-- Todos os utilizadores autenticados podem LER avisos activos
DROP POLICY IF EXISTS avisos_leitura ON avisos;
CREATE POLICY avisos_leitura ON avisos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Só o super admin cria/edita/apaga avisos
DROP POLICY IF EXISTS avisos_admin ON avisos;
CREATE POLICY avisos_admin ON avisos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin')
  );

-- Verificação
SELECT 'mensagens' AS tabela, count(*) FROM mensagens
UNION ALL
SELECT 'avisos', count(*) FROM avisos;
