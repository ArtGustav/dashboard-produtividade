# Dashboard de Produtividade

## Objetivo do projeto
Este projeto apresenta um painel web completo para visualizar metricas de produtividade com base em dados salvos no `localStorage`, usando apenas HTML, CSS e JavaScript puro.

## Como rodar
1. Entre na pasta `dashboard-produtividade`.
2. Abra o arquivo `index.html` direto no navegador.
3. O painel carrega os dados do `localStorage` e gera seed automaticamente quando a chave estiver vazia.

## Como trocar a chave CONFIG_STORAGE_KEY (tarefas/protocolos)
1. Abra `assets/js/app.js`.
2. No topo do arquivo, altere:

```js
const CONFIG_STORAGE_KEY = "tarefas";
```

3. Troque para `"protocolos"` (ou outra chave desejada).
4. Recarregue a pagina.

## Funcionalidades
- Leitura de dados do `localStorage` com fallback automatico para seed.
- Normalizacao resiliente dos campos:
  - `status`: aceita `pendente`, `andamento`, `concluido`, `concluida`.
  - `prioridade`: aceita `baixa`, `media`, `média`, `alta`.
  - `data`: aceita `criadaEm` ou `criadoEm`.
- Filtro por periodo: `7 dias`, `30 dias` e `todos`.
- Cards de metricas:
  - Total de itens
  - Pendentes
  - Em andamento
  - Concluidos
  - Alta prioridade
- Graficos com Chart.js via CDN:
  - Pizza por status
  - Barras por prioridade
  - Linha de itens criados por dia
- Atualizacao sem recarregar pagina (destroy/recreate dos graficos).
- Tabela resumida com os 10 itens mais recentes.
- Mensagens amigaveis quando nao ha dados para o filtro atual.
- Layout responsivo com foco visivel nos controles e suporte opcional a dark mode.

## Estrutura das pastas
```text
/dashboard-produtividade
  /assets
    /css/style.css
    /js/app.js
  index.html
  README.md
```

## Proximos passos
- Persistir configuracoes de filtro por usuario.
- Adicionar exportacao de relatorios (CSV/PDF).
- Integrar com backend/API para dados em tempo real.
- Criar autenticacao e permissao por perfil.
