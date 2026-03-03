# DislexiaEdu

## Current State

O app DislexiaEdu é voltado para alunos com dislexia no ensino superior. Possui as seguintes seções:
- Dashboard com dica do dia e registro de sessões de estudo
- Temporizador Pomodoro
- Notas e Tarefas com armazenamento local
- Glossário com busca
- Configurações de Acessibilidade (fonte OpenDyslexic, tamanho, espaçamento, modo alto contraste)

Backend: Motoko com autenticação, perfil de usuário, sessões de estudo, dicas e glossário.
Componentes Caffeine ativos: authorization.

## Requested Changes (Diff)

### Add
- **Upload de PDF**: Nova seção "Materiais" onde o aluno pode fazer upload de PDFs (apostilas, artigos, etc.) e listá-los com nome, data de upload e possibilidade de download/visualização.
- **Sistema de Recompensas em dinheiro (pontos/créditos)**: Nova seção "Recompensas" onde o aluno acumula pontos por atividades (sessões de estudo, tarefas concluídas, upload de materiais) e pode visualizar seu saldo de pontos, histórico de conquistas e metas. Os pontos representam créditos virtuais no app (sem processamento de pagamento real, pois Stripe é para pagamentos não para recompensas internas).
  - Regras de pontos:
    - Completar uma sessão de estudo Pomodoro: +10 pontos
    - Fazer upload de um PDF: +5 pontos
    - Completar uma tarefa: +15 pontos
  - Exibir ranking de conquistas (bronze, prata, ouro) com base no saldo total de pontos
  - Histórico de transações de pontos

### Modify
- **App.tsx**: Adicionar rotas para "materials" e "rewards"
- **Sidebar**: Adicionar links para as novas seções (Materiais e Recompensas)
- **Backend**: Adicionar funções para gerenciar pontos/recompensas do usuário, metadados de PDFs e eventos de pontos
- **Timer/Tasks**: Integrar eventos de pontos ao completar sessão Pomodoro e tarefas

### Remove
- Nada

## Implementation Plan

1. Selecionar componente `blob-storage` para armazenamento de PDFs
2. Regenerar backend Motoko com:
   - Armazenamento de metadados de PDFs por usuário (nome, blobId, data, tamanho)
   - Sistema de pontos: saldo atual, histórico de transações (tipo de evento, pontos, timestamp)
   - Funções: uploadPdfMetadata, getUserPdfs, deletePdfMetadata, addPoints, getUserPoints, getPointsHistory
3. Implementar frontend:
   - Componente `Materials`: dropzone de PDF com upload via blob-storage, lista de arquivos, download
   - Componente `Rewards`: painel com saldo de pontos, badge de nível (bronze/prata/ouro), histórico de transações
   - Integrar eventos de pontos em Timer (ao completar pomodoro) e Tasks (ao marcar tarefa como concluída)
   - Adicionar novas páginas ao Sidebar e App.tsx
