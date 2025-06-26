# Módulo de Profissionais - Orkestre

## Visão Geral

O módulo de profissionais foi criado para permitir o cadastro e gerenciamento completo dos profissionais que trabalham no estabelecimento. Cada profissional pode ter seus próprios serviços, horários de trabalho e agendamentos.

## Estrutura de Dados

### Professional (Profissional)
```json
{
  "id": "uuid",
  "establishment_id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "specialty": "string",
  "description": "string (opcional)",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime",
  "services": ["array de Service objects"],
  "working_hours": {
    "monday": {
      "is_active": "boolean",
      "start_time": "time",
      "end_time": "time",
      "lunch_break_start_time": "time",
      "lunch_break_end_time": "time"
    },
    // ... outros dias da semana
  },
  "total_appointments": "number",
  "monthly_appointments": "number",
  "rating": "float"
}
```

## Funcionalidades Implementadas

### 1. Gestão de Profissionais
- ✅ Listagem de profissionais com filtros
- ✅ Cadastro de novos profissionais
- ✅ Edição de profissionais existentes
- ✅ Exclusão de profissionais
- ✅ Ativação/desativação de profissionais

### 2. Configuração de Serviços
- ✅ Atribuição de serviços aos profissionais
- ✅ Múltiplos serviços por profissional
- ✅ Interface visual para seleção de serviços

### 3. Horários de Trabalho
- ✅ Configuração individual por dia da semana
- ✅ Horário de trabalho (início e fim)
- ✅ Horário de almoço configurável
- ✅ Dias ativos/inativos

### 4. Estatísticas e Relatórios
- ✅ Total de agendamentos
- ✅ Agendamentos mensais
- ✅ Receita total
- ✅ Avaliação média
- ✅ Visualização de agendamentos recentes

### 5. Interface do Usuário
- ✅ Cards visuais para cada profissional
- ✅ Formulário multi-abas (dados básicos, serviços, horários)
- ✅ Modal detalhado com todas as informações
- ✅ Filtros de busca e status
- ✅ Ações rápidas (editar, excluir, ativar/desativar)

## APIs Necessárias no Backend

### Profissionais
- `POST /professionals` - Criar profissional
- `GET /professionals/establishment/{id}` - Listar profissionais do estabelecimento
- `GET /professionals/{id}` - Buscar profissional por ID
- `PUT /professionals/{id}` - Atualizar profissional
- `DELETE /professionals/{id}` - Excluir profissional
- `PATCH /professionals/{id}/status` - Ativar/desativar profissional

### Serviços do Profissional
- `GET /professionals/{id}/services` - Buscar serviços do profissional
- `PUT /professionals/{id}/services` - Atualizar serviços do profissional

### Horários de Trabalho
- `GET /professionals/{id}/working-hours` - Buscar horários do profissional
- `PUT /professionals/{id}/working-hours` - Atualizar horários do profissional

### Agendamentos
- `GET /professionals/{id}/appointments` - Buscar agendamentos do profissional
- `GET /professionals/{id}/stats` - Buscar estatísticas do profissional

## Componentes Criados

### 1. ProfessionalsView.js
Componente principal que gerencia toda a interface de profissionais.

**Funcionalidades:**
- Listagem com cards visuais
- Filtros de busca e status
- Modais para criação, edição e detalhes
- Estatísticas do dashboard

### 2. ProfessionalForm.js
Formulário completo para criação e edição de profissionais.

**Funcionalidades:**
- Formulário multi-abas
- Validação de dados
- Seleção de serviços
- Configuração de horários

### 3. ProfessionalCard.js
Card visual para exibir informações resumidas do profissional.

**Funcionalidades:**
- Informações básicas
- Status visual
- Ações rápidas
- Estatísticas resumidas

### 4. ProfessionalDetailsModal.js
Modal detalhado com todas as informações do profissional.

**Funcionalidades:**
- Navegação por abas
- Visão geral com estatísticas
- Lista de serviços
- Horários de trabalho
- Agendamentos recentes

## Serviços

### professionalService.js
Serviço que gerencia todas as chamadas de API relacionadas aos profissionais.

**Métodos implementados:**
- `createProfessional()`
- `getProfessionalsByEstablishment()`
- `getProfessionalById()`
- `updateProfessional()`
- `deleteProfessional()`
- `toggleProfessionalStatus()`
- `getProfessionalServices()`
- `updateProfessionalServices()`
- `getProfessionalWorkingHours()`
- `updateProfessionalWorkingHours()`
- `getProfessionalAppointments()`
- `getProfessionalStats()`

## Integração com Sistema Existente

### 1. Dashboard
- Nova aba "Profissionais" adicionada ao menu principal
- Botão de acesso rápido na visão geral
- Integração com sistema de autenticação existente

### 2. Serviços
- Relacionamento com serviços existentes do estabelecimento
- Múltiplos profissionais podem realizar o mesmo serviço
- Interface para atribuição de serviços

### 3. Agendamentos (Futura Integração)
- Cada agendamento poderá ser vinculado a um profissional
- Validação de disponibilidade baseada nos horários do profissional
- Filtragem de agendamentos por profissional

## Próximos Passos

### Para o Backend:
1. Criar modelo Professional no banco de dados
2. Implementar endpoints de API
3. Relacionar com modelo de agendamentos
4. Implementar validações de horários
5. Criar sistema de estatísticas

### Para o Frontend:
1. Integrar com agendamentos quando disponível
2. Implementar notificações em tempo real
3. Adicionar relatórios mais detalhados
4. Implementar sistema de avaliações
5. Adicionar funcionalidades de agenda por profissional

## Considerações Técnicas

### Performance
- Paginação implementada para grandes volumes de profissionais
- Filtros eficientes para busca
- Carregamento lazy de dados estatísticos

### UX/UI
- Interface responsiva
- Feedback visual imediato
- Confirmações para ações destrutivas
- Estados de loading apropriados

### Validações
- Validação de email e telefone
- Verificação de horários consistentes
- Pelo menos um serviço obrigatório
- Pelo menos um dia de trabalho ativo

Esta implementação fornece uma base sólida para o gerenciamento completo de profissionais, com interface moderna e funcionalidades avançadas, pronta para integração com o backend.
