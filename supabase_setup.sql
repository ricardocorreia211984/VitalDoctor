-- =============================================================
--  VitalDoctor — Setup Supabase (correr no SQL Editor)
--  Acrescenta: permissões de módulos + base de conhecimento
--  editável + relatórios. Não apaga nada do que já existe.
-- =============================================================

-- 1) PERMISSÕES DE MÓDULOS por terapeuta -----------------------
--    Guardadas em profiles.modulos como JSONB.
--    Ex.: {"atendimento":true,"relatorios":true,"modulacao":false}
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS modulos jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) BASE DE CONHECIMENTO editável pelo admin ------------------
--    Os "significados" deixam de estar só no código e passam a
--    persistir aqui, para o admin editar sem mexer no código.
CREATE TABLE IF NOT EXISTS base_conhecimento (
  id          text PRIMARY KEY,          -- ex.: "escudo:perda", "ponto:figado"
  tipo        text NOT NULL,             -- "escudo" | "ponto" | "pergunta" | "protocolo"
  nome        text,
  significado text,                      -- o texto que entra no relatório
  dados       jsonb DEFAULT '{}'::jsonb, -- campos extra (escudos, sintomas, etc.)
  atualizado  timestamptz DEFAULT now()
);

-- 3) RELATÓRIOS gerados (ligados ao paciente) ------------------
CREATE TABLE IF NOT EXISTS relatorios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  terapeuta_id uuid,                     -- profiles.id de quem gerou
  consulta_id uuid,                      -- opcional: liga a uma consulta
  conteudo    jsonb NOT NULL,            -- { seccoes:[...], texto:"..." }
  criado      timestamptz DEFAULT now()
);

-- 4) RESPOSTAS de questionários por consulta -------------------
--    Tudo guardado na ficha para cruzamento e evolução.
CREATE TABLE IF NOT EXISTS respostas_consulta (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  consulta_id uuid,
  momento     text NOT NULL,             -- "pre" | "durante" | "pos"
  caminho     text,                      -- "consciente" | "subconsciente" | "estressores"
  dados       jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado      timestamptz DEFAULT now()
);

-- 5) (Opcional) ligar o módulo avançado a um terapeuta ---------
--    Substitua o email pelo do terapeuta a quem quer dar acesso.
-- UPDATE profiles
--   SET modulos = modulos || '{"modulacao":true}'::jsonb
--   WHERE email = 'terapeuta@exemplo.com';

-- 6) ÁUDIOS — campos para meditação de 21 dias e modulações --------
--    (a tabela "audios" já existe; isto só acrescenta colunas)
ALTER TABLE audios ADD COLUMN IF NOT EXISTS categoria text;     -- "meditacao21" | "medos" | ...
ALTER TABLE audios ADD COLUMN IF NOT EXISTS sexo text;          -- "feminino" | "masculino" (NULL = ambos)
ALTER TABLE audios ADD COLUMN IF NOT EXISTS dia int;            -- 1..21 (só para meditacao21)
ALTER TABLE audios ADD COLUMN IF NOT EXISTS titulo text;
ALTER TABLE audios ADD COLUMN IF NOT EXISTS url text;           -- link Drive (gerido pelo admin)

-- 7) FICHA DO PACIENTE — anamnese + foto ---------------------------
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medicacao jsonb DEFAULT '[]'::jsonb;   -- [{nome,dose,vezesDia}]
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS diagnostico jsonb DEFAULT '[]'::jsonb; -- [{condicao,desdeQuando}]
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS queixa_principal text;

-- 8) MAPEAMENTO — pontos codificados (codigo + lado + face) --------
ALTER TABLE mapeamento ADD COLUMN IF NOT EXISTS codigo text;   -- S1..S9 / C1..C12 / M1..M6
ALTER TABLE mapeamento ADD COLUMN IF NOT EXISTS sistema text;  -- Superior | Central | Inferior
ALTER TABLE mapeamento ADD COLUMN IF NOT EXISTS lado text;     -- direito | esquerdo
ALTER TABLE mapeamento ADD COLUMN IF NOT EXISTS face text;     -- frente | costas

-- 9) PREFERÊNCIAS do terapeuta (ex.: modo do protocolo) ------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferencias jsonb DEFAULT '{}'::jsonb; -- {"modoProtocolo":"criadora"}
