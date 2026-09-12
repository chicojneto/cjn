# Atualização do Mapa Global por horários de Nova York

## Objetivo
Transformar a página Sessões em um painel operacional completo baseado em Nova York, seguindo a tabela enviada e o sistema visual atual do pipsncoffee.

## O que será alterado
- Substituir a visão resumida de horários por uma agenda completa com:
  - Sydney, Tóquio, Londres, B3 e Nova York;
  - Asia, London, NY AM, London Close e NY PM Killzones;
  - overlap Ásia/Londres, Londres/NY, tríplice Londres+B3+NY e London Close+B3+NY;
  - pausa NY Lunch.
- Exibir horários de EDT (UTC-4) e EST (UTC-5), destacando automaticamente a coluna vigente em Nova York.
- Mostrar em cada faixa o foco operacional e a dinâmica de liquidez descritos na referência.
- Identificar dinamicamente o que está ativo agora e o próximo evento, respeitando dias úteis e janelas que atravessam a meia-noite.
- Atualizar a linha do tempo de 24 horas para incluir sessões, killzones e overlaps, com diferenciação visual sem sair da paleta quente existente.
- Manter o mapa e os cards regionais, alinhando os horários principais das regiões às novas referências.
- Usar tabela no desktop e cartões empilhados no celular, sem alargar o conteúdo além do padrão atual.

## Regras visuais
- Marca âmbar somente para atividade atual/destaque principal.
- Verde e vermelho reservados a estados de mercado quando aplicável; killzones e overlaps serão diferenciados por superfície, borda e intensidade neutra/âmbar.
- Números e horários em JetBrains Mono; textos em sentence case; sem gradientes, brilho ou animação decorativa.

## Detalhes técnicos
- Criar uma fonte única de dados para todas as janelas, com horários EDT/EST, categoria, descrição e prioridade.
- Reutilizar a detecção de horário de verão de Nova York já existente.
- Derivar estado ativo, próximo início e conversão para o fuso de visualização a partir dessa fonte única.
- Preservar as regras semanais existentes de fechamento/reabertura do mercado.
- Validar em desktop e mobile, conferindo conteúdo, ausência de sobreposição e atualização do estado atual.
