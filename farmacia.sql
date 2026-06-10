-- Farmacia Natural: Repertorio de Ervas (usos, contraindicacoes, preparo)
delete from public.config_global where chave = 'farmacia';
insert into public.config_global (chave, valor) values ('farmacia', $$[
{
"id": "e_alcachofra",
"nome": "Alcachofra",
"indicacao": "Tratamento para o Fígado (Chá), Obesidade, Diabete, Pressão Alta",
"contraind": "problemas na vesícula, hepatites, concomitante a anticoagulantes",
"notas": "Nome científico: Cynara scolymus"
},
{
"id": "e_alecrim",
"nome": "Alecrim",
"indicacao": "Melhorar a digestão, Combate o cansaço mental, Melhora a circulação, “antibiótico natural”, … Documentam-se DEZENAS de USOS!!!",
"contraind": "gravidez ou lactação, menores de 12 anos, Problemas de estômago, Epiléticos, Hemorragia, Hipertensão arterial (pressão alta)",
"notas": "Nome científico: Rosmarinus officinalis L | Preparo: INFUSÃO (Punhado de Folhas); obs: Deixar 15 minutos em infusão"
},
{
"id": "e_anis_estrelado",
"nome": "Anis Estrelado",
"indicacao": "Cólicas, Digestivo, Dor de Dente, Previne Resfriados",
"contraind": "gravidez ou lactação, menores de 2 anos (preferível evitar com crianças)",
"notas": "Nome científico: Llicium verum | Preparo: 1) Chá em DECOCÇÃO; 2) Mascar"
},
{
"id": "e_arnica",
"nome": "Arnica",
"indicacao": "Solidago chilensis Meyen (Brasileira), CONTUSÕES, Artrites, Queimaduras superficiais e pouco extensas, Coceiras (picadas de insetos), Compressas - Pomadas",
"contraind": "",
"notas": "Nome científico: Arnica montana L. (europeia)"
},
{
"id": "e_babosa",
"nome": "Babosa",
"indicacao": "Cicatrizante, Picada de Insetos, Tratamento para Cabelo, Fortalecer sistema imunológico, diminuir colesterol, 1",
"contraind": "Ingestão concomitante a medicamentos para pressão alta,, diabetes, cardiopatias e anticoagulantes, Idosos e Grávidas (ingestão), 1 Uso com cuidados",
"notas": "Nome científico: Aloe vera | Preparo: GEL (Tópico) ou Suco"
},
{
"id": "e_boldo_plectranthus_ornatus_codd",
"nome": "Boldo - Plectranthus Ornatus Codd",
"indicacao": "problemas digestivos e dor de estômago, tratamento de dor de dente, distúrbios gengivais,, problemas de pele, Fígado; Fígado, Digestão de Gorduras",
"contraind": "pancreatite, pessoas com pedra na vesícula.; Gravidez, Mulheres em período de amamentação, pessoas com pedra na vesícula…, Doenças Hepáticas, Crianças",
"notas": "Nome científico: Plectranthus barbatus Andrews | Preparo: 1 colher de chá de folhas de boldo secas ou algumas folhas verdes; em 200 ml Água; MÉTODO: INFUSÃO; Nome científico: Aparelho digestivo"
},
{
"id": "e_canela",
"nome": "Canela",
"indicacao": "Aparelho digestivo: azia, indigestão e náusea., respostas ao estresse, controle da diabetes, (antioxidantes)",
"contraind": "(Sempre pelo excesso), alergias, irritação na pele, irritação no estômago, pode agravas problemas hepáticos, hipoglicemia",
"notas": "Nome científico: Prevenir doenças cardiovasculares"
},
{
"id": "e_capim_limão",
"nome": "Capim Limão",
"indicacao": "Melhorar a digestão, Insônia e problemas de Ansiedade, Cólicas estomacais e intestinais",
"contraind": "Se houver fortes dores abdominais sem causa;, Portadores de Pressão Baixa; Concomitante a, medicamentos sedativos",
"notas": "Nome científico: Cymbopogon citratus"
},
{
"id": "e_confrei",
"nome": "Confrei",
"indicacao": "Dores musculares, dores de articulações, Espinhas, contusões sem ruptura de pele, tendinites e dores nas costas, depois colocar o chá em COMPRESSAS no local, NÃO DEVE SER INGERIDO",
"contraind": "NÃO está indicada para uso interno (NÃO INGERIR), Gestantes, Crianças menores de 5 anos, Portadores de Doenças Hepáticas: usar sob supervisão",
"notas": "Nome científico: Symphytum officinalis L | Preparo: médica (Mesmo uso tópico)"
},
{
"id": "e_erva_doce",
"nome": "Erva Doce",
"indicacao": "Efeito Calmante, Má digestão, Dor de cabeça, Cólicas menstruais, Cólicas em Bebês, Inflamações em Geral",
"contraind": "Consumo em excesso",
"notas": "Nome científico: Pimpinella anisum | Preparo: INFUSÃO; 1 colher (de chá) de erva-doce seca; 1 xícara de água."
},
{
"id": "e_guaco",
"nome": "Guaco",
"indicacao": "Mikania laevigata, Ação broncodilatadora, Expectorante, Fluidifica as secreções brônquicas",
"contraind": "“Tem ação sobre veneno de cobra”, doenças hepáticas, crianças com menos de dois anos, hipersensibilidade à cumarina (riscos de, hemorragias), Gestantes",
"notas": "Nome científico: Mikania glomerata | Preparo: INFUSÃO - 5 folhas em infusão - 400 ml água; XAROPE"
},
{
"id": "e_hortelã",
"nome": "Hortelã",
"indicacao": "Melhora a digestão, Previne o câncer, Gripes, resfriados e doenças respiratórias, Mau Hálito, Ansiedade, Stress, Chás, Sucos, Nebulização",
"contraind": "Refluxo grave / Hérnia de hiato, Gravidez - Crianças Menores de 8 anos",
"notas": "Nome científico: Mentha spicata Hortelã-verde , hortelã comum"
},
{
"id": "e_limão_tahiti",
"nome": "Limão (Tahiti)",
"indicacao": "Melhora a digestão., Ajuda a prevenir derrames., Aumenta a absorção do ferro., Aumenta a imunidade., Diminui riscos de doenças cardiovasculares., Diminui os riscos de câncer, Diminui sintomas de doenças respiratórias., SUCO",
"contraind": "Gastrite, Sensibilidade ao Ácido Cítrico",
"notas": "Nome científico: Citrus latifolia"
},
{
"id": "e_louro",
"nome": "Louro",
"indicacao": "Aparelho digestivo, Envelhecimento precoce (Anti Oxidantes), Regulador fluxo menstrual, Anti-inflamatório (Dores de Cabeça e outras tb), TEMPERO",
"contraind": "EXCESSO: sonolência, cólicas, diarreia e dor de cabeça, Gravidez, Mulheres em período de amamentação",
"notas": "Nome científico: Laurus nobilis | Preparo: CHÁ (Folhas Secas: Decocção)"
},
{
"id": "e_manjerona",
"nome": "Manjerona",
"indicacao": "As folhas lembram o Manjericão, mas são bem menores, Problemas Digestivos, ansiedade, depressão e insônia, Controle da Pressão Arterial, Prevenção do mal de Alzheimer, CHÁ, SALADA, TEMPERO",
"contraind": "gestantes, mulheres na lactação, crianças abaixo de 12 anos, pessoas com pressão muito baixa",
"notas": "Nome científico: Origanum majorana"
},
{
"id": "e_manjericão",
"nome": "Manjericão",
"indicacao": "gripes, resfriados e bronquites, ansiedade, depressão e insônia, pressão alta, artrite, CHÁ, SALADA, TEMPERO",
"contraind": "gestantes, mulheres na lactação, crianças abaixo de 12 anos, pessoas com pressão muito baixa",
"notas": "Nome científico: Ocimum basilicum L"
},
{
"id": "e_melissa",
"nome": "Melissa",
"indicacao": "ansiedade e estresse, problemas digestivos (gases), Combate a herpes labial",
"contraind": "Concomitante a medicamentos sedativos; gestantes, devem consultar médico antes do uso",
"notas": "Nome científico: Melissa officinalis L. | Preparo: 1 colher de chá de folhas de MELISSA secas ou algumas; folhas verdes em 200 ml Água; MÉTODO: INFUSÃO"
}
]$$);
