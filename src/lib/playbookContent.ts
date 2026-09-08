// Conteúdo do Playbook. Basta editar/colar os textos aqui.

export interface ProtocoloStep {
  id: string;
  horario: string;
  acao: string;
  detalhe?: string;
}

export interface PlaybookBlock {
  title: string;
  items: string[];
}

// Aba 1 — Protocolo Matinal (tabela horário x ação com checkbox)
export const protocoloMatinal: ProtocoloStep[] = [];

// Aba 2 — Hierarquia de Sinais
export const hierarquiaSinais: PlaybookBlock[] = [];

// Aba 3 — Camada GEX
export const camadaGex: PlaybookBlock[] = [];

// Aba 4 — Configuração por ativo
export const configuracaoPorAtivo: PlaybookBlock[] = [];
