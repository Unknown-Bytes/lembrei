# 🧪 QA Checklist - Lembrei App
## Checklist Completo Antes do Deploy da Pesquisa

**Data:** 17 de Outubro de 2025  
**Versão:** 1.0  
**Testador:** _______________

---

## 📋 Índice

1. [Setup e Configuração](#setup-e-configuração)
2. [Fluxo de Onboarding](#fluxo-de-onboarding)
3. [Criação de Doses](#criação-de-doses)
4. [Dashboard e Visualização](#dashboard-e-visualização)
5. [Sistema de Alarmes](#sistema-de-alarmes)
6. [Feedback e Pesquisa](#feedback-e-pesquisa)
7. [Coleta de Dados](#coleta-de-dados)
8. [Performance e UX](#performance-e-ux)
9. [Testes de Borda](#testes-de-borda)
10. [Verificação Final](#verificação-final)

---

## ✅ Setup e Configuração

### Ambiente
- [ ] Banco de dados conectado (PostgreSQL/Neon)
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Prisma Client gerado corretamente
- [ ] Dev server inicia sem erros (`npm run dev`)
- [ ] Console sem erros críticos

### Dependências
- [ ] Node modules instalados
- [ ] Prisma versão 6.17.1+
- [ ] Next.js rodando corretamente

---

## 🎯 Fluxo de Onboarding

### Página Inicial (/register)
- [ ] Carrega corretamente
- [ ] Campo de nome visível e funcional
- [ ] Placeholder adequado
- [ ] Validação de campo vazio
- [ ] Botão "Começar" funcional
- [ ] Navegação para /onboarding1

### Tracking
- [ ] Survey criado no banco ao iniciar
- [ ] `startedAt` registrado corretamente
- [ ] `userName` salvo no banco
- [ ] NavEvent registrado

### Onboarding - Tela 1 (/onboarding1)
- [ ] Título e descrição claros
- [ ] Ilustração/ícone visível
- [ ] Botão "Continuar" funcional
- [ ] Navegação para /onboarding2

### Onboarding - Tela 2 (/onboarding2)
- [ ] Conteúdo renderizado corretamente
- [ ] Botão "Continuar" funcional
- [ ] Navegação para /onboarding3

### Onboarding - Tela 3 (/onboarding3)
- [ ] Informações apresentadas claramente
- [ ] Botão "Continuar" funcional
- [ ] Navegação para /onboarding4

### Onboarding - Tela 4 (/onboarding4)
- [ ] Tela final do onboarding
- [ ] Botão "Ir para Dashboard" funcional
- [ ] Navegação para /sc/dashboard
- [ ] `onboardingCompletedAt` registrado no banco

---

## 💊 Criação de Doses

### Acesso à Criação
- [ ] Botão "Adicionar Dose" visível no dashboard
- [ ] Navegação para /sc/doses/new
- [ ] `firstTimeEnteringDoseCreationArea` registrado (primeira vez)

### Formulário de Dose
- [ ] **Campo Nome:** 
  - [ ] Visível e editável
  - [ ] Placeholder adequado
  - [ ] Validação de campo vazio
  
- [ ] **Campo Horário:**
  - [ ] Input de time (HH:mm)
  - [ ] Validação de formato
  - [ ] Aceita horários válidos (00:00 - 23:59)

- [ ] **Frequência:**
  - [ ] Opção "Diária" selecionável
  - [ ] Opção "Semanal" selecionável
  - [ ] Seleção de dias da semana (se semanal)
  - [ ] Múltiplos dias selecionáveis

- [ ] **Período (Datas):**
  - [ ] Campo "Data de Início" (opcional)
  - [ ] Campo "Data de Término" (opcional)
  - [ ] Validação: término >= início

- [ ] **Notas:**
  - [ ] Campo de texto livre
  - [ ] Aceita texto longo
  - [ ] Opcional

### Salvamento
- [ ] Botão "Salvar Dose" funcional
- [ ] Loading/feedback visual ao salvar
- [ ] Dose salva no Context imediatamente
- [ ] Dose salva no banco (PostgreSQL)
- [ ] ID gerado corretamente (dose_timestamp)
- [ ] `totalDosesCreated` incrementado
- [ ] `dosesAdded` = true
- [ ] `doseCreationCompletedAt` registrado
- [ ] Redirecionamento para /sc/dashboard

### Validações
- [ ] Não permite salvar sem nome
- [ ] Não permite salvar sem horário
- [ ] Não permite salvar sem frequência
- [ ] Mensagens de erro claras

---

## 📊 Dashboard e Visualização

### Acesso ao Dashboard (/sc/dashboard)
- [ ] Carrega corretamente
- [ ] `firstDashboardEntryAt` registrado (primeira vez)
- [ ] `secondDashboardEntryAt` registrado (segunda vez)

### Visualização de Doses
- [ ] Lista de doses renderizada
- [ ] Doses de hoje visíveis (getTodaysDoses)
- [ ] Validação de `startDate` funciona
- [ ] Validação de `endDate` funciona
- [ ] Doses fora do período não aparecem
- [ ] Frequência semanal respeitada (dia correto)
- [ ] Frequência diária mostra todos os dias

### Informações da Dose
- [ ] Nome do medicamento visível
- [ ] Horário formatado (HH:mm)
- [ ] Ícone/status adequado
- [ ] Botão "Marcar como Tomada" visível

### Marcar Dose como Tomada (Dashboard)
- [ ] Botão funcional
- [ ] Dose marcada visualmente
- [ ] Persiste no localStorage (`takenDoses_YYYY-MM-DD`)
- [ ] DoseHistory criado no banco
- [ ] `totalDosesTaken` incrementado
- [ ] Não permite marcar duas vezes no mesmo dia

### Botões de Ação
- [ ] "Adicionar Dose" navega para /sc/doses/new
- [ ] "Ver Todas as Doses" navega para /sc/doses
- [ ] "Completar Objetivos" funcional (se aplicável)

---

## 🔔 Sistema de Alarmes

### Disparo de Alarme
- [ ] Alarme dispara no horário configurado
- [ ] Som/notificação (se implementado)
- [ ] Modal de alarme abre automaticamente
- [ ] Navegação para /sc/alarm
- [ ] `currentAlarm` salvo no localStorage
- [ ] AlarmInteraction criada (action="triggered")
- [ ] `totalAlarmsSet` incrementado

### Modal/Página de Alarme (/sc/alarm)
- [ ] Carrega corretamente
- [ ] Nome da dose visível
- [ ] Horário visível
- [ ] Ícone/ilustração adequado

### Ações no Alarme
- [ ] **Confirmar Dose Tomada:**
  - [ ] Botão funcional
  - [ ] AlarmInteraction criada (action="confirmed")
  - [ ] DoseHistory criada (action="taken", source="alarm")
  - [ ] `totalDosesTaken` incrementado
  - [ ] `responseTime` calculado corretamente
  - [ ] Dose marcada no localStorage
  - [ ] `currentAlarm` removido
  - [ ] Navegação para /sc/feedback

- [ ] **Adiar/Snooze:**
  - [ ] Botão funcional (se implementado)
  - [ ] AlarmInteraction criada (action="snoozed")
  - [ ] `totalAlarmsSnoozed` incrementado
  - [ ] Alarme reagenda corretamente

- [ ] **Dispensar/Ignorar:**
  - [ ] Botão funcional (se implementado)
  - [ ] AlarmInteraction criada (action="dismissed")
  - [ ] `totalAlarmsDismissed` incrementado

### Validações
- [ ] Não quebra se `currentAlarm` não existir
- [ ] Redireciona para dashboard se sem alarme
- [ ] Não causa loop infinito (useEffect)

---

## 💬 Feedback e Pesquisa

### Acesso ao Feedback (/sc/feedback)
- [ ] Carrega após confirmar dose
- [ ] Carrega via navegação direta (se permitido)

### Tela de Introdução
- [ ] Mensagem de parabéns visível
- [ ] Contexto da pesquisa claro
- [ ] Botão "Começar Perguntas" funcional
- [ ] Transição suave

### Perguntas de Avaliação (1-5)

#### Pergunta 1: Facilidade de uso
- [ ] Texto da pergunta claro
- [ ] Escala 1-5 visível (ou estrelas)
- [ ] Seleção funcional
- [ ] Feedback visual da seleção
- [ ] Avança automaticamente

#### Pergunta 2: Clareza das instruções
- [ ] Texto claro
- [ ] Escala funcional
- [ ] Avança corretamente

#### Pergunta 3: Rapidez percebida
- [ ] Texto claro
- [ ] Escala funcional
- [ ] Avança corretamente

#### Pergunta 4: Confiança no uso
- [ ] Texto claro
- [ ] Escala funcional
- [ ] Avança corretamente

#### Pergunta 5: Intenção de uso futuro
- [ ] Texto claro
- [ ] Escala funcional
- [ ] Avança corretamente

### Pergunta 6: Feedback Textual
- [ ] Campo de texto visível
- [ ] Aceita texto longo
- [ ] Placeholder adequado
- [ ] Opcional (pode deixar em branco)

### Barra de Progresso
- [ ] Visível durante perguntas
- [ ] Atualiza corretamente (1/6, 2/6, etc)
- [ ] Animação suave

### Envio do Feedback
- [ ] Botão "Enviar" visível
- [ ] Não permite enviar sem responder obrigatórias
- [ ] Loading/feedback visual
- [ ] Feedback salvo no banco
- [ ] `feedbackCompletedAt` registrado
- [ ] Se userName="Testador" → anonimizado
- [ ] `timeToComplete` calculado
- [ ] Salvo no localStorage (backup)

### Tela de Conclusão
- [ ] Mensagem de agradecimento
- [ ] Redirecionamento para dashboard (3s)
- [ ] Possível pular redirecionamento

---

## 📊 Coleta de Dados

### Survey (Participante)
- [ ] Survey criado ao iniciar
- [ ] `id` (CUID) único
- [ ] `userName` salvo corretamente
- [ ] `startedAt` registrado
- [ ] `onboardingCompletedAt` registrado
- [ ] `doseCreationCompletedAt` registrado
- [ ] `feedbackCompletedAt` registrado
- [ ] Timestamps corretos (timezone)

### Contadores
- [ ] `totalDosesCreated` incrementa ao criar dose
- [ ] `totalAlarmsSet` incrementa ao disparar alarme
- [ ] `totalAlarmsDismissed` incrementa corretamente
- [ ] `totalAlarmsSnoozed` incrementa corretamente
- [ ] `totalDosesTaken` incrementa ao marcar como tomada
- [ ] `dosesAdded` = true após primeira dose

### Doses
- [ ] Dose criada no banco
- [ ] Relacionada ao Survey correto (surveyId)
- [ ] Campos salvos corretamente:
  - [ ] name
  - [ ] time
  - [ ] frequency
  - [ ] selectedDays (JSON)
  - [ ] startDate/endDate
  - [ ] notes
- [ ] `createdAt` e `updatedAt` corretos

### DoseHistory
- [ ] Registro criado ao marcar dose
- [ ] `action` = "taken"
- [ ] `scheduledTime` correto
- [ ] `actualTime` correto
- [ ] `takenOnTime` calculado (boolean)
- [ ] `source` = "alarm" ou "dashboard"
- [ ] Timestamp correto

### AlarmInteraction
- [ ] Registro criado ao disparar alarme
- [ ] `action` = "triggered"
- [ ] `scheduledTime` correto
- [ ] Registro ao confirmar
- [ ] `action` = "confirmed"
- [ ] `responseTime` calculado (segundos)
- [ ] Relacionado à dose correta (doseId)

### Feedback
- [ ] Registro criado ao enviar
- [ ] Todas as respostas salvas (1-5)
- [ ] Feedback textual salvo (pergunta 6)
- [ ] `timestamp` correto
- [ ] `timeToComplete` registrado
- [ ] Relacionado ao Survey correto

### NavEvent
- [ ] Registrado ao navegar
- [ ] `route` e `routeFrom` corretos
- [ ] `timestamp` correto
- [ ] `deviceType` detectado

### Interaction
- [ ] Cliques registrados
- [ ] Tipo de interação correto
- [ ] Elemento identificado
- [ ] Página correta

---

## ⚡ Performance e UX

### Carregamento
- [ ] Páginas carregam em < 2s
- [ ] Sem flash de conteúdo não estilizado (FOUC)
- [ ] Loading states adequados
- [ ] Animações suaves

### Responsividade
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Orientação landscape funcional

### Navegação
- [ ] Botões de voltar funcionam
- [ ] Navegação do navegador funciona
- [ ] Sem quebras ao usar back/forward
- [ ] URLs amigáveis

### Feedback Visual
- [ ] Botões têm hover states
- [ ] Botões têm active states
- [ ] Loading spinners onde necessário
- [ ] Mensagens de sucesso/erro
- [ ] Transições suaves

### Acessibilidade
- [ ] Contraste adequado (WCAG AA)
- [ ] Navegação por teclado funcional
- [ ] Labels em inputs
- [ ] Foco visível
- [ ] Texto legível

---

## 🔍 Testes de Borda

### Dados Vazios
- [ ] Dashboard sem doses não quebra
- [ ] Feedback sem survey não quebra
- [ ] Alarme sem dose não quebra

### Dados Inválidos
- [ ] Nome muito longo (100+ caracteres)
- [ ] Horário inválido (25:00)
- [ ] Datas inválidas (31/02/2025)
- [ ] Caracteres especiais no nome

### Múltiplas Doses
- [ ] 5+ doses criadas sem problemas
- [ ] 10+ doses no dashboard renderizam bem
- [ ] Performance mantida com muitas doses

### Timezone
- [ ] Horários salvos corretamente
- [ ] Comparações de data funcionam
- [ ] Doses de hoje calculadas corretamente

### LocalStorage
- [ ] Funciona se localStorage vazio
- [ ] Funciona se localStorage corrompido
- [ ] Sincroniza corretamente com banco

### Conexão
- [ ] Funciona offline (localStorage)
- [ ] Sincroniza ao voltar online
- [ ] Mensagens de erro se API falhar

### Navegação Fora de Ordem
- [ ] Acessar /sc/alarm sem alarme → redireciona
- [ ] Acessar /sc/feedback sem completar objetivos (se restrito)
- [ ] Voltar após enviar feedback

---

## ✅ Verificação Final

### Banco de Dados
- [ ] **Executar:** `node check-db.js`
- [ ] Surveys criados corretamente
- [ ] Doses relacionadas aos surveys
- [ ] Contadores atualizados
- [ ] AlarmInteractions registradas
- [ ] DoseHistory registrada
- [ ] Feedback registrado
- [ ] Timestamps corretos

### Console/Logs
- [ ] Sem erros no console do navegador
- [ ] Sem erros no terminal do servidor
- [ ] Logs de tracking visíveis (se debug)
- [ ] Sem warnings críticos

### Migrations
- [ ] Todas as migrations aplicadas
- [ ] Schema em sync com banco
- [ ] `npx prisma migrate status` = "up to date"

### Código
- [ ] Sem código comentado desnecessário
- [ ] Sem console.logs de debug excessivos
- [ ] Sem TODOs críticos
- [ ] Sem @ts-ignore desnecessários

### Documentação
- [ ] README atualizado
- [ ] docForResearch.md completo
- [ ] .env.example atualizado
- [ ] Comentários adequados no código

---

## 📝 Cenário de Teste Completo (E2E)

### Teste Usuário Novo (Happy Path)

1. [ ] Acessar `http://localhost:3000`
2. [ ] Preencher nome: "Testador QA"
3. [ ] Clicar "Começar"
4. [ ] Completar onboarding (4 telas)
5. [ ] Chegar ao dashboard vazio
6. [ ] Clicar "Adicionar Dose"
7. [ ] Preencher:
   - Nome: "Paracetamol"
   - Horário: "14:30"
   - Frequência: Diária
   - Notas: "Tomar com água"
8. [ ] Salvar dose
9. [ ] Voltar ao dashboard
10. [ ] Ver dose listada
11. [ ] Marcar dose como tomada no dashboard
12. [ ] Criar alarme para daqui a 1 minuto
13. [ ] Aguardar alarme disparar
14. [ ] Confirmar dose no alarme
15. [ ] Preencher feedback (todas as perguntas)
16. [ ] Enviar feedback
17. [ ] Executar `node check-db.js`
18. [ ] Verificar todos os dados salvos

### Teste Múltiplas Doses

1. [ ] Criar 3 doses diferentes
2. [ ] Horários diferentes
3. [ ] Frequências mistas (diária + semanal)
4. [ ] Verificar todas aparecem no dashboard
5. [ ] Marcar 2 doses como tomadas
6. [ ] Verificar contadores corretos

### Teste Fluxo de Alarme Completo

1. [ ] Criar dose para daqui a 2 minutos
2. [ ] Aguardar alarme
3. [ ] Verificar modal/página abre
4. [ ] Verificar dados da dose
5. [ ] Confirmar dose
6. [ ] Verificar redirecionamento
7. [ ] Completar feedback
8. [ ] Verificar banco de dados

---

## 🐛 Bugs Encontrados

| # | Descrição | Severidade | Status | Notas |
|---|-----------|------------|--------|-------|
| 1 |           | Alta/Média/Baixa | 🔴/🟡/🟢 |       |
| 2 |           |            |        |       |
| 3 |           |            |        |       |

**Severidade:**
- 🔴 Alta: Bloqueia uso / perda de dados
- 🟡 Média: UX ruim / funcionalidade limitada
- 🟢 Baixa: Cosmético / edge case

---

## ✅ Aprovação para Deploy

### Checklist Mínimo (Bloqueadores)
- [ ] Sem erros críticos no console
- [ ] Dados salvando no banco corretamente
- [ ] Onboarding completo funciona
- [ ] Criação de dose funciona
- [ ] Alarme dispara e confirma dose
- [ ] Feedback salva corretamente
- [ ] Contadores atualizando
- [ ] Responsivo em mobile

### Aprovação Final

**Testado por:** _______________  
**Data:** ___ / ___ / _____  
**Status:** ⬜ Aprovado para deploy | ⬜ Requer correções

**Observações:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 📞 Suporte

**Repositório:** Unknown-Bytes/lembrei  
**Branch para deploy:** main  
**Branch de desenvolvimento:** dev

---

**FIM DO QA CHECKLIST**
