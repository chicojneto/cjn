
# Plano: Reorganizar Análise de Correlações em 3 Colunas

## Objetivo
Reorganizar o painel "Análise de Correlações" (SignalsPanel) para distribuir os 7 ativos em 3 colunas, facilitando a leitura visual.

## Distribuição Proposta

```text
┌─────────────────────────────────────────────────────────────────┐
│  📊 ANÁLISE DE CORRELAÇÕES                                      │
├───────────────────┬───────────────────┬─────────────────────────┤
│  BRASIL           │  EUA              │  FOREX                  │
│                   │                   │                         │
│  WIN (LONG)       │  S&P 500 (SHORT)  │  EUR/USD (NEUTRO)       │
│  • sinal 1        │  • sinal 1        │  • sinal 1              │
│  • sinal 2        │  • sinal 2        │  • sinal 2              │
│                   │                   │                         │
│  WDO (SHORT)      │  NASDAQ (SHORT)   │  GBP/USD (LONG)         │
│  • sinal 1        │  • sinal 1        │  • sinal 1              │
│  • sinal 2        │  • sinal 2        │  • sinal 2              │
│                   │                   │                         │
│  XAU/USD (LONG)   │                   │                         │
│  • sinal 1        │                   │                         │
│  • sinal 2        │                   │                         │
└───────────────────┴───────────────────┴─────────────────────────┘
```

## Agrupamento por Categoria

| Coluna 1 - BRASIL/COMMODITIES | Coluna 2 - ÍNDICES EUA | Coluna 3 - FOREX |
|-------------------------------|------------------------|------------------|
| WIN                           | S&P 500                | EUR/USD          |
| WDO                           | NASDAQ                 | GBP/USD          |
| XAU/USD                       |                        |                  |

## Alteração Técnica

**Arquivo:** `src/components/dashboard/DailyChecklist.tsx`

Modificar o `SignalsPanel` para usar um layout de grid com 3 colunas:

1. Trocar o container `space-y-3` por `grid grid-cols-3 gap-4`
2. Agrupar os ativos em 3 divs separadas:
   - Coluna 1: WIN, WDO, XAU/USD
   - Coluna 2: S&P 500, NASDAQ  
   - Coluna 3: EUR/USD, GBP/USD
3. Adicionar títulos de categoria para cada coluna (opcional)

## Resultado Esperado

- Layout mais limpo e organizado
- Agrupamento lógico por categoria de ativo
- Melhor aproveitamento do espaço horizontal
- Leitura mais fácil das correlações por região/tipo
