
# Plano: Transformacao do Portal em Hub Macroeconomico Profissional

## Visao Geral

Transformar o portal em um **Hub Macroeconomico** de nivel profissional, onde a pagina inicial apresenta uma **visao executiva do cenario macro global** antes de detalhar ativos individuais. O estilo do CheckList atual serve como excelente base - vamos expandir essa estetica "Bloomberg Terminal" para toda a experiencia.

## Arquitetura Proposta

A nova estrutura hierarquica do portal:

```text
+--------------------------------------------------+
|          MACRO PULSE (Header Global)             |
|  DXY | VIX | US10Y | Risk Sentiment | Session    |
+--------------------------------------------------+
|                                                  |
|  +--------------------------------------------+  |
|  |       CENARIO MACRO DO DIA                 |  |
|  |  Resumo executivo com indicadores-chave    |  |
|  |  e direcao predominante dos mercados       |  |
|  +--------------------------------------------+  |
|                                                  |
|  +---------------+  +---------------+            |
|  | ASIA/EUROPA   |  | EUA FUTURES   |            |
|  | Fechamento    |  | Pre-Market    |            |
|  +---------------+  +---------------+            |
|                                                  |
|  +---------------+  +---------------+            |
|  | MOEDAS/DXY    |  | YIELDS/VIX    |            |
|  +---------------+  +---------------+            |
|                                                  |
|  +--------------------------------------------+  |
|  |  ANALISE DE CORRELACOES (CheckList)        |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

## Componentes Novos/Modificados

### 1. MacroPulseBar (Novo)

Uma barra fixa no topo mostrando os indicadores macro mais importantes em tempo real:

- **DXY** com variacao e tendencia
- **VIX** com nivel de alerta (baixo/medio/alto)
- **US10Y** yield atual
- **Risk Sentiment** (Risk-On/Risk-Off/Neutro)
- **Sessao atual** (Asia/Europa/EUA)

### 2. MacroScenarioCard (Novo)

Painel executivo que apresenta:

- **Titulo do dia** (ex: "Mercado em modo Risk-Off apos dados de inflacao")
- **3-5 pontos-chave** do cenario atual
- **Indicadores principais** com semaforo visual (verde/amarelo/vermelho)
- **Correlacoes relevantes** do momento

### 3. Dashboard Reformulado

Reorganizar a pagina inicial com foco macro:

```text
Secao 1: Cenario Macro (MacroScenarioCard)
Secao 2: Mercados Globais (Asia/Europa/Futuros EUA)
Secao 3: Indicadores-Chave (DXY, Yields, VIX, Commodities)
Secao 4: Vies dos Ativos (CheckList compacto)
```

### 4. Estilo Visual Unificado

Expandir o estilo "terminal" do CheckList para todo o portal:

- **Fonte mono** para dados numericos
- **Cores de semaforo** consistentes
- **Cards com bordas sutis** e fundo escuro
- **Headers destacados** com emojis de bandeiras

## Mudancas Tecnicas

### Arquivos a Criar

1. `src/components/dashboard/MacroPulseBar.tsx` - Barra de indicadores globais
2. `src/components/dashboard/MacroScenarioCard.tsx` - Painel executivo do cenario
3. `src/components/dashboard/GlobalMarketsPanel.tsx` - Painel consolidado de mercados

### Arquivos a Modificar

1. `src/pages/Dashboard.tsx` - Reorganizar layout com foco macro
2. `src/components/layout/AppLayout.tsx` - Adicionar MacroPulseBar
3. `src/components/layout/AppSidebar.tsx` - Renomear "Dashboard" para "Cenario Macro"
4. `src/index.css` - Adicionar estilos para novos componentes

### Hook de Dados

Reutilizar `useMarketCorrelations` existente que ja traz todos os dados macro necessarios (DXY, VIX, Yields, mercados globais, etc.)

## Fluxo de Navegacao

```text
Cenario Macro (Home)     -> Visao executiva do dia
       |
       v
   Mercados              -> Cotacoes detalhadas
       |
       v
   Check List            -> Analise de correlacoes completa
       |
       v
   Estrategias           -> Playbooks de operacao
```

## Beneficios

1. **Profissionalismo** - Estetica de terminal financeiro institucional
2. **Contexto primeiro** - Usuario entende o "macro" antes de operar
3. **Decisoes informadas** - Vies e correlacoes sempre visiveis
4. **Consistencia visual** - Design unificado em todo o portal
5. **Eficiencia** - Informacoes-chave sem precisar navegar
