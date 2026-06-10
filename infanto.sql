-- Carregar conteudo Infanto-Juvenil (a app le isto automaticamente)
delete from public.config_global where chave = 'infanto';
insert into public.config_global (chave, valor) values ('infanto', $$[
{
"id": "f02",
"titulo": "0 a 2 anos — Vínculo e comunicação não verbal",
"faixaEtaria": "0-2 anos",
"descricao": "Comunicação quase toda não verbal (olhar, choro, sorriso); desenvolvimento do apego e ansiedade de separação (6-9 meses). Abordagem: focar no vínculo pais-bebé, observar a interação, usar estímulos sensoriais suaves e orientar os pais sobre rotinas previsíveis e segurança emocional.",
"notas": "Sinais de alerta: falta de contacto visual, ausência de resposta a estímulos, dificuldade no vínculo. Ansiedade: difícil de acalmar, reações exageradas a ruídos/luz. Depressão: pouco interesse em explorar, choro apático. Tempo ideal: 40 min (foco do bebé 5 min). Palavra-chave: Rejeição."
},
{
"id": "f34",
"titulo": "3 a 4 anos — Imaginário ativo e afirmação de vontades",
"faixaEtaria": "3-4 anos",
"descricao": "Linguagem mais estruturada (muitos porquês), jogos simbólicos, emoções complexas (vergonha, ciúme), birras e teste de limites. Abordagem: trabalhar ao nível lúdico (bonecos, histórias, desenhos), ajudar a nomear emoções com cartões, orientar os pais sobre limites saudáveis e consistência.",
"notas": "Sinais de alerta: atraso na fala, falta de jogo simbólico, agressividade extrema. Ansiedade: medos exagerados, evitação do novo. Depressão: apatia, alterações de sono, comportamentos regressivos. Tempo ideal: 40 min (foco 10 min). Palavra-chave: Imposição e controlo."
},
{
"id": "f57",
"titulo": "5 a 7 anos — Curiosidade e raciocínio inicial",
"faixaEtaria": "5-7 anos",
"descricao": "Interesse por regras e rotinas, pensamento lógico ligado ao concreto, empatia a surgir, frustrações ainda intensas. Abordagem: jogos estruturados (tabuleiro, puzzles), reconhecimento emocional com escalas visuais ou diários, orientar os pais sobre reforço positivo (elogiar o esforço).",
"notas": "Sinais de alerta: regressões, dificuldade em socializar ou em lidar com regras. Ansiedade: queixas físicas antes da escola, medo de errar, evitação de grupos. Depressão: fadiga, desinteresse, irritabilidade. Tempo ideal: 40 min (foco 15 min). Palavra-chave: Comparação e partilha."
},
{
"id": "f810",
"titulo": "8 a 10 anos — Comparação social e busca por aprovação",
"faixaEtaria": "8-10 anos",
"descricao": "Importância dos amigos e do grupo, comparação com os outros, interesse por desafios. Abordagem: explorar autoestima (listas de pontos fortes e conquistas), usar histórias para trabalhar valores e emoções, envolver os pais no reforço positivo e na autonomia.",
"notas": "Sinais de alerta: retraimento, medo de falhar, agressividade. Ansiedade: preocupação com desempenho, medo de rejeição, evitação. Depressão: isolamento, mudanças de apetite, pensamentos negativos persistentes. Tempo ideal: 40 min (foco 20 min). Palavra-chave: Comparação, insegurança e medo. Atenção à linguagem não verbal."
},
{
"id": "f1214",
"titulo": "12 a 14 anos — Adolescência inicial e busca por identidade",
"faixaEtaria": "12-14 anos",
"descricao": "Instabilidade emocional (hormonal), forte influência do grupo, questionamento da autoridade, preocupação com aparência e aceitação. Abordagem: criar vínculo e confiança (escutar mais do que falar, validar sem julgar), usar temas do universo adolescente, ensinar autorregulação (respiração, arte, música).",
"notas": "Sinais de alerta: isolamento, automutilação, preocupação excessiva com peso/aparência. Ansiedade: crises antes de eventos sociais/provas, evitação. Depressão: irritabilidade persistente, desinteresse, alterações de sono/alimentação. Tempo ideal: 50 min (foco 30 min). Palavra-chave: Imposição e rejeição."
},
{
"id": "f1516",
"titulo": "15 a 16 anos — Rumo à independência",
"faixaEtaria": "15-16 anos",
"descricao": "Foco no futuro (estudos, carreira), desejo de independência com necessidade de suporte, gestão de tempo e stress, conflitos familiares. Abordagem: organizar metas e responsabilidades (planos semanais), mentoria emocional, orientar os pais a apoiar sem sobrecarregar.",
"notas": "Sinais de alerta: ansiedade/depressão significativa, uso de substâncias, isolamento prolongado. Ansiedade: crises de pânico, medo de fracassar, perfecionismo/procrastinação. Depressão: sensação de vazio, abandono de metas. Tempo ideal: 60 min (foco 60 min com dinâmicas). Palavra-chave: Insegurança e incerteza."
},
{
"id": "ferramentas",
"titulo": "Abordagens e ferramentas terapêuticas",
"faixaEtaria": "Todas as idades",
"descricao": "Terapia lúdica (jogos, contar histórias, bonecos); TCC adaptada (pensar-sentir-agir); mindfulness e relaxamento (exercícios curtos). Ferramentas: caixa de areia e miniaturas, cartas de emoções, apps educativos e criativos para adolescentes.",
"notas": "Elaborar um plano terapêutico por caso (ex.: bebé com dificuldade de vínculo; criança com medo escolar; adolescente com baixa autoestima e isolamento)."
},
{
"id": "pais",
"titulo": "Processo colaborativo com os pais",
"faixaEtaria": "Todas as idades",
"descricao": "Envolver os pais de forma ativa e positiva. Comunicação acessível e não culpabilizante; explicar o papel deles no desenvolvimento emocional; enviar tarefas simples para casa (ler histórias, brincadeiras); os pais como modelos de regulação emocional.",
"notas": "Demonstrar resultados: mostrar como mudanças no comportamento dos pais impactam positivamente a criança."
}
]$$);
