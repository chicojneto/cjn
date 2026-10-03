# Notícias automáticas no BrewBias

## Resultado
Criar uma página **Notícias** integrada ao menu, alimentada automaticamente pelos cinco feeds indicados e exibindo somente título traduzido, resumo próprio, ativos, relevância, fonte, horário e link original.

## Implementação
1. **Dados e segurança**
   - Criar `noticias` com os campos, validações, URL única e índice por data solicitados.
   - Permitir leitura pública e reservar inclusão, alteração e exclusão ao backend.
   - Adicionar estado operacional para trava de execução, progresso e pausa por falhas permanentes da IA.

2. **Coleta automática**
   - Criar `coletar-noticias` para ler os cinco RSS, limpar HTML e ignorar duplicados ou itens com mais de 24 horas.
   - Ordenar os candidatos por data e processar sequencialmente no máximo 30 por execução.
   - Classificar cada item com Lovable AI usando `openai/gpt-6-astra`, com resposta estruturada em português; relevância zero será descartada.
   - Continuar quando um feed falhar, limpar registros com mais de sete dias e impedir execuções simultâneas.
   - Pausar novas chamadas quando créditos ou política bloquearem a IA; limitar retentativas apenas a falhas transitórias.

3. **Agendamento e carga inicial**
   - Agendar a função a cada 20 minutos, totalizando 72 execuções por dia.
   - Executar uma coleta inicial e conferir os registros efetivamente gravados.

4. **Página Notícias**
   - Adicionar `/noticias` e o novo destino na navegação desktop, mobile e busca.
   - Mostrar atualização relativa, filtros por ativo, alternância “Só relevantes” ligada por padrão e lista cronológica.
   - Carregar 30 itens por vez, atualizar a cada cinco minutos, abrir matérias em nova aba e incluir estados de carregamento, erro e vazio.
   - Manter o visual claro atual do BrewBias, sem imagens e sem verde/vermelho; usar âmbar apenas para relevância 3.

## Validação
- Testar a função publicada e inspecionar seus registros.
- Confirmar políticas de acesso e o agendamento.
- Verificar a página em desktop e celular, incluindo filtros, paginação e links externos.
