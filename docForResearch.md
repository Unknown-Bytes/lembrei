# Documentação de Coleta de Dados - Lembrei App
## Estrutura Completa para Pesquisa

> **Versão:** 1.0  
> **Data:** 17 de Outubro de 2025  
> **Banco de Dados:** PostgreSQL (Neon)  
> **ORM:** Prisma 6.17.1

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Modelo Survey (Participante)](#modelo-survey-participante)
3. [Modelo Dose (Medicamentos)](#modelo-dose-medicamentos)
4. [Modelo DoseHistory (Histórico de Doses)](#modelo-dosehistory-histórico-de-doses)
5. [Modelo NavEvent (Navegação)](#modelo-navevent-navegação)
6. [Modelo PageTiming (Tempo nas Páginas)](#modelo-pagetiming-tempo-nas-páginas)
7. [Modelo Interaction (Interações)](#modelo-interaction-interações)
8. [Modelo AlarmInteraction (Interações com Alarmes)](#modelo-alarminteraction-interações-com-alarmes)
9. [Modelo Feedback (Avaliações)](#modelo-feedback-avaliações)
10. [Modelo ErrorLog (Registro de Erros)](#modelo-errorlog-registro-de-erros)
11. [Relacionamentos e Fluxo de Dados](#relacionamentos-e-fluxo-de-dados)
12. [Métricas Calculadas](#métricas-calculadas)
13. [Privacidade e Anonimização](#privacidade-e-anonimização)

---

## 🎯 Visão Geral

O sistema Lembrei coleta dados abrangentes sobre o comportamento do usuário durante o uso do aplicativo de lembretes de medicação. A estrutura de dados foi projetada para capturar:

- **Jornada do usuário** através do aplicativo
- **Comportamento de adesão** à medicação
- **Interações com alarmes** e notificações
- **Usabilidade e satisfação** através de feedback estruturado
- **Performance e erros** técnicos

Todos os dados estão relacionados a um **Survey** (participante da pesquisa), que funciona como o identificador central de cada sessão de teste.

---

## 📊 Modelo Survey (Participante)

**Tabela:** `Survey`  
**Função:** Representa um participante individual da pesquisa e agrega todas as suas métricas.

### Campos de Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único do survey (ex: `cmgvlqfgg000mve083lh6941v`) |
| `userName` | String? | Nome do usuário. Se for "Testador", é substituído por `testador_[10 primeiros dígitos do ID]` no envio do feedback |
| `deviceInfo` | Json? | Informações do dispositivo/navegador em formato JSON |

### Timestamps de Navegação

Estes campos capturam marcos importantes na jornada do usuário:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `startedAt` | DateTime | Momento que o survey foi criado (primeira interação com o app) |
| `firstDashboardEntryAt` | DateTime? | Primeira vez que acessou o dashboard |
| `secondDashboardEntryAt` | DateTime? | Segunda visita ao dashboard (indica engajamento) |
| `onboardingCompletedAt` | DateTime? | Quando completou o onboarding |
| `firstTimeEnteringDoseCreationArea` | DateTime? | Primeira vez que acessou a área de criação de doses |
| `doseCreationCompletedAt` | DateTime? | Quando completou a criação da primeira dose |
| `firstTimeViewingDosesList` | DateTime? | Primeira visualização da lista de doses |
| `alarmModalAcknowledgedAt` | DateTime? | Quando visualizou/confirmou o primeiro modal de alarme |
| `lastActiveAt` | DateTime | Última atividade (atualizado automaticamente) |

### Contadores de Uso

Métricas quantitativas de uso do aplicativo:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `dosesAdded` | Boolean | Flag indicando se adicionou pelo menos uma dose |
| `totalDosesCreated` | Int | Número total de doses criadas (incrementado a cada nova dose) |
| `totalAlarmsSet` | Int | Número total de alarmes disparados (`alarm_triggered`) |
| `totalAlarmsDismissed` | Int | Alarmes ignorados/dispensados |
| `totalAlarmsSnoozed` | Int | Alarmes adiados (snooze) |
| `totalDosesTaken` | Int | Doses marcadas como tomadas |
| `totalPageViews` | Int | Total de páginas visualizadas |

### Metadados de Sessão

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `appVersion` | String? | Versão do aplicativo |
| `platform` | String? | Plataforma: web, android, ios |
| `timezone` | String? | Fuso horário do usuário |
| `language` | String? | Idioma preferido |
| `userEvents` | Json? | Array de eventos legado (mantido para compatibilidade) |

### Auditoria

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `createdAt` | DateTime | Data de criação do registro |
| `updatedAt` | DateTime | Última atualização |

### Relacionamentos

- `doses` → **Dose[]**: Todas as doses criadas pelo usuário
- `navigationEvents` → **NavEvent[]**: Eventos de navegação
- `userInteractions` → **Interaction[]**: Cliques, scrolls, inputs
- `feedbacks` → **Feedback[]**: Avaliações e feedback textual
- `alarmInteractions` → **AlarmInteraction[]**: Interações com alarmes
- `doseHistory` → **DoseHistory[]**: Histórico de doses tomadas/perdidas
- `pageTimings` → **PageTiming[]**: Tempo gasto em cada página

---

## 💊 Modelo Dose (Medicamentos)

**Tabela:** `Dose`  
**Função:** Representa um medicamento e seu cronograma de administração.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID gerado no cliente (ex: `dose_1760749754145` - timestamp) |
| `surveyId` | String | FK → Survey (cascade delete) |

### Dados do Medicamento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String | Nome do medicamento (ex: "Dipirona", "Omeprazol") |
| `time` | String | Horário da dose no formato HH:mm (ex: "14:00") |
| `notes` | String | Observações do usuário (default: "") |

### Frequência e Recorrência

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `frequency` | String | Tipo de frequência: "daily" ou "weekly" |
| `selectedDays` | Json | Array de dias selecionados para frequência semanal. Ex: `["monday", "wednesday", "friday"]`. Vazio `[]` para frequência diária |

### Período de Validade

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `startDate` | String? | Data de início em formato ISO (ex: "2025-10-17") ou null |
| `endDate` | String? | Data de término em formato ISO ou null (indica uso contínuo) |

### Rastreamento de Uso

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `totalTaken` | Int | Contador de vezes que a dose foi marcada como tomada |
| `totalMissed` | Int | Contador de doses perdidas/não tomadas |
| `lastTakenAt` | DateTime? | Timestamp da última vez que foi tomada |

### Auditoria

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `createdAt` | DateTime | Momento de criação da dose |
| `updatedAt` | DateTime | Última atualização |

### Relacionamentos

- `survey` → **Survey**: Usuário que criou a dose
- `history` → **DoseHistory[]**: Histórico de tomadas
- `alarms` → **AlarmInteraction[]**: Interações com alarmes desta dose

---

## 📝 Modelo DoseHistory (Histórico de Doses)

**Tabela:** `DoseHistory`  
**Função:** Registra cada evento relacionado a uma dose (tomada, perdida, adiada).

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único do registro |
| `surveyId` | String | FK → Survey (cascade delete) |
| `doseId` | String | FK → Dose (cascade delete) |

### Dados do Evento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `action` | String | Tipo de ação: "taken", "missed", "skipped", "snoozed" |
| `timestamp` | DateTime | Momento do registro |
| `scheduledTime` | String? | Hora agendada da dose (ex: "14:00") |
| `actualTime` | String? | Hora real que o usuário marcou como tomada (ex: "14:15") |

### Contexto de Adesão

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `takenOnTime` | Boolean? | Indica se foi tomada no horário (comparação scheduledTime vs actualTime) |
| `delayMinutes` | Int? | Atraso em minutos (positivo = atrasado, negativo = adiantado) |
| `source` | String? | Origem do registro: "dashboard", "alarm", "manual" |

### Metadados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `notes` | String? | Observações adicionais do usuário |
| `metadata` | Json? | Dados extras em formato JSON |

### Índices

- `(surveyId, doseId)`: Busca rápida por histórico de dose específica
- `(timestamp)`: Queries temporais

---

## 🧭 Modelo NavEvent (Navegação)

**Tabela:** `NavEvent`  
**Função:** Registra cada transição entre páginas/rotas do aplicativo.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único |
| `surveyId` | String | FK → Survey (cascade delete) |
| `sessionId` | String? | Identificador da sessão de uso |

### Dados da Navegação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `route` | String | Rota atual (ex: "/sc/dashboard", "/sc/doses/new") |
| `routeFrom` | String? | Rota anterior (de onde veio) |
| `timestamp` | DateTime | Momento que entrou na rota |
| `duration` | Int? | Tempo em milissegundos na rota |
| `exitTimestamp` | DateTime? | Momento que saiu da página |

### Contexto do Dispositivo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `deviceType` | String? | Tipo: "mobile", "desktop", "tablet" |
| `screenSize` | String? | Resolução da tela (ex: "1920x1080") |
| `viewportSize` | String? | Tamanho da viewport (ex: "1200x800") |

### Metadados Técnicos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userAgent` | String? | String completa do user agent do navegador |
| `ipAddress` | String? | Endereço IP (se aplicável) |
| `language` | String? | Idioma do navegador |
| `timezone` | String? | Fuso horário detectado |

### Dados de Comportamento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `scrollDepth` | Int? | Profundidade de scroll (0-100%) |
| `clickCount` | Int? | Número de cliques realizados na página |
| `metadata` | Json? | Metadados extras |

### Índices

- `(surveyId, route)`: Busca por rotas específicas de um usuário
- `(timestamp)`: Análise temporal

---

## ⏱️ Modelo PageTiming (Tempo nas Páginas)

**Tabela:** `PageTiming`  
**Função:** Métricas detalhadas de tempo e performance de cada página.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único |
| `surveyId` | String | FK → Survey (cascade delete) |
| `sessionId` | String | ID da sessão |
| `page` | String | Nome/rota da página |

### Métricas de Tempo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `enteredAt` | DateTime | Momento que entrou na página |
| `exitedAt` | DateTime? | Momento que saiu da página |
| `timeSpent` | Int? | Tempo total na página em milissegundos |

### Performance

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `loadTime` | Int? | Tempo de carregamento em ms |
| `timeToInteractive` | Int? | Tempo até a página ficar interativa (TTI) em ms |

### Comportamento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `interactions` | Int | Número total de interações (default: 0) |
| `scrollDepthMax` | Int? | Profundidade máxima de scroll alcançada (0-100%) |
| `metadata` | Json? | Dados extras |

### Índices

- `(surveyId, page)`: Análise por página
- `(enteredAt)`: Análise temporal

---

## 🖱️ Modelo Interaction (Interações)

**Tabela:** `Interaction`  
**Função:** Captura cada interação do usuário com elementos da interface.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único |
| `surveyId` | String | FK → Survey (cascade delete) |
| `sessionId` | String? | ID da sessão |

### Dados da Interação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | String | Tipo: "click", "input", "scroll", "hover", "focus", "blur" |
| `element` | String | Seletor CSS do elemento (ID ou classe) |
| `elementText` | String? | Texto visível do elemento |
| `page` | String | Página onde ocorreu a interação |
| `value` | String? | Valor associado (ex: texto digitado em input) |

### Contexto Espacial

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `timestamp` | DateTime | Momento da interação |
| `xPosition` | Int? | Coordenada X do clique/interação |
| `yPosition` | Int? | Coordenada Y do clique/interação |
| `duration` | Int? | Duração da interação em ms (para hovers, focus, etc) |

### Metadados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `metadata` | Json? | Dados extras em formato JSON |

### Índices

- `(surveyId, type)`: Análise por tipo de interação
- `(timestamp)`: Análise temporal

---

## 🔔 Modelo AlarmInteraction (Interações com Alarmes)

**Tabela:** `AlarmInteraction`  
**Função:** Registra como o usuário responde aos alarmes de medicação.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único |
| `surveyId` | String | FK → Survey (cascade delete) |
| `doseId` | String? | FK → Dose (set null on delete) - pode ser null se dose foi deletada |

### Dados do Alarme

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `action` | String | Ação realizada: "triggered" (disparado), "dismissed" (ignorado), "snoozed" (adiado), "confirmed" (confirmado tomada), "deferred" (postergar) |
| `timestamp` | DateTime | Momento da interação |

### Métricas de Timing

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `scheduledTime` | String? | Hora agendada do alarme (formato HH:mm, ex: "14:00") |
| `actualTime` | String? | Hora que o usuário interagiu (formato HH:mm) |
| `responseTime` | Int? | Tempo de resposta em segundos (diferença entre trigger e ação) |

### Funcionalidade Snooze

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `snoozeDuration` | Int? | Duração do snooze em minutos (ex: 5, 10, 15) |
| `snoozeCount` | Int | Número de vezes que adiou este alarme (default: 0) |

### Contexto do Dispositivo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `source` | String? | Origem: "notification" (sistema), "modal" (app), "badge" |
| `deviceState` | String? | Estado do dispositivo: "active", "background", "locked" |

### Metadados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `metadata` | Json? | Dados extras (pode incluir dados de dispositivo, navegador, etc) |

### Índices

- `(surveyId, action)`: Análise por tipo de ação
- `(timestamp)`: Análise temporal

---

## 💬 Modelo Feedback (Avaliações)

**Tabela:** `Feedback`  
**Função:** Coleta feedback estruturado e textual dos usuários após completar os objetivos.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único |
| `surveyId` | String | FK → Survey (cascade delete) |

### Perguntas de Avaliação (Escala 1-5)

| Campo | Tipo | Pergunta Correspondente |
|-------|------|------------------------|
| `easeOfUse` | Int? | "O app foi fácil de entender e navegar." |
| `clarityOfInstructions` | Int? | "As instruções para cadastrar e confirmar doses foram claras." |
| `perceivedSpeed` | Int? | "Consegui realizar as tarefas no tempo que esperava sem dificuldades." |
| `confidenceInUse` | Int? | "Senti-me seguro(a) usando o app para registrar meus medicamentos." |
| `intentionToUse` | Int? | "Eu usaria este app para gerenciar minha rotina de medicamentos regularmente." |

**Escala de Avaliação:**
- 1 = Discordo totalmente
- 2 = Discordo parcialmente
- 3 = Neutro
- 4 = Concordo parcialmente
- 5 = Concordo totalmente

### Feedback Textual

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `missingFeatures` | String? | Resposta à pergunta: "Houve alguma funcionalidade ou informação que você sentiu falta enquanto usava o app? Explique." |
| `additionalComments` | String? | Comentários adicionais (se houver campo livre) |

### Métricas Gerais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `overallRating` | Int? | Avaliação geral (1-5 estrelas) |
| `nps` | Int? | Net Promoter Score (0-10): "Quanto você recomendaria este app?" |

### Categorização

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `category` | String? | Categoria: "bug", "suggestion", "praise", "complaint" |
| `tags` | Json? | Array de tags para categorização (ex: `["usability", "design"]`) |

### Contexto Temporal

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `timestamp` | DateTime | Momento do envio do feedback |
| `timeToComplete` | Int? | Tempo para preencher o feedback em milissegundos |

### Metadados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `appVersion` | String? | Versão do app quando feedback foi dado |
| `source` | String? | Origem: "in_app", "email", "external_survey" |
| `contactAllowed` | Boolean | Se usuário permite ser contatado (default: false) |
| `metadata` | Json? | Dados extras |

### Índices

- `(surveyId)`: Busca por usuário
- `(timestamp)`: Análise temporal

---

## ❌ Modelo ErrorLog (Registro de Erros)

**Tabela:** `ErrorLog`  
**Função:** Registra erros técnicos e exceções durante o uso do aplicativo.

### Identificação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (CUID) | Identificador único |
| `surveyId` | String? | FK → Survey (pode ser null se erro antes de ter survey) |

### Dados do Erro

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `errorType` | String | Tipo: "javascript", "api", "network", "validation" |
| `errorMessage` | String | Mensagem de erro |
| `errorStack` | String? (Text) | Stack trace completo do erro |

### Contexto

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `page` | String? | Página/rota onde o erro ocorreu |
| `userAgent` | String? | User agent do navegador |
| `timestamp` | DateTime | Momento do erro |

### Reprodução

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `componentStack` | String? (Text) | React component stack (se aplicável) |
| `userActions` | Json? | Array das últimas ações do usuário antes do erro |

### Gestão

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `severity` | String? | Gravidade: "low", "medium", "high", "critical" |
| `resolved` | Boolean | Se o erro foi resolvido (default: false) |
| `metadata` | Json? | Dados extras |

### Índices

- `(surveyId)`: Erros por usuário
- `(timestamp)`: Análise temporal
- `(errorType)`: Análise por tipo

---

## 🔗 Relacionamentos e Fluxo de Dados

### Hierarquia Principal

```
Survey (Participante)
├── Dose (Medicamentos)
│   ├── DoseHistory (Histórico de doses)
│   └── AlarmInteraction (Interações com alarmes)
├── NavEvent (Navegação)
├── PageTiming (Tempo nas páginas)
├── Interaction (Interações gerais)
├── Feedback (Avaliações)
└── ErrorLog (Erros - opcional)
```

### Fluxo Típico de Dados

1. **Onboarding**
   - Cria `Survey` com `startedAt`
   - Registra `NavEvent` para cada página
   - Captura `Interaction` (cliques, inputs)

2. **Criação de Dose**
   - Cria registro `Dose` vinculado ao `Survey`
   - Atualiza `Survey.totalDosesCreated` (+1)
   - Atualiza `Survey.dosesAdded` = true
   - Registra timestamp `Survey.doseCreationCompletedAt`

3. **Disparo de Alarme**
   - Cria `AlarmInteraction` com action="triggered"
   - Atualiza `Survey.totalAlarmsSet` (+1)

4. **Confirmação de Dose**
   - Cria `AlarmInteraction` com action="confirmed"
   - Cria `DoseHistory` com action="taken"
   - Atualiza `Survey.totalDosesTaken` (+1)
   - Atualiza `Dose.totalTaken` (+1)
   - Atualiza `Dose.lastTakenAt`

5. **Feedback Final**
   - Cria `Feedback` com todas as respostas
   - Se `Survey.userName` == "Testador", substitui por `testador_[10 primeiros dígitos do ID]`
   - Atualiza `Survey.lastActiveAt`

---

## 📈 Métricas Calculadas

### Taxa de Adesão

```
Taxa de Adesão = (totalDosesTaken / totalAlarmsSet) * 100
```

### Tempo Médio de Resposta ao Alarme

```
Média = SUM(AlarmInteraction.responseTime) / COUNT(AlarmInteraction where action='confirmed')
```

### Taxa de Abandono (Snooze)

```
Taxa de Snooze = (totalAlarmsSnoozed / totalAlarmsSet) * 100
```

### Tempo no Onboarding

```
Tempo = onboardingCompletedAt - startedAt
```

### Tempo até Primeira Dose

```
Tempo = doseCreationCompletedAt - startedAt
```

### Engagement Score

```
Score = (totalPageViews * 0.3) + (totalDosesTaken * 0.5) + (existência de feedback * 0.2)
```

### NPS Calculado

```
Promotores = COUNT(Feedback where nps >= 9)
Detratores = COUNT(Feedback where nps <= 6)
NPS = ((Promotores - Detratores) / Total Respondentes) * 100
```

---

## 🔒 Privacidade e Anonimização

### Dados Pessoais Identificáveis (PII)

**Coletados:**
- `userName`: Nome do usuário (anonimizado se "Testador")
- `ipAddress`: Endereço IP (opcional, pode ser omitido)

**Não Coletados:**
- Endereço de email
- Telefone
- CPF ou documentos
- Localização GPS precisa

### Processo de Anonimização

1. **Testadores Anônimos:**
   - Nome "Testador" → `testador_cmgvlqfgg0` (10 primeiros dígitos do Survey ID)
   - Aplicado automaticamente no endpoint `/api/feedback`

2. **IDs Únicos:**
   - Todos os registros usam CUIDs gerados automaticamente
   - Não é possível vincular a identidades reais sem o `userName`

3. **Retention Policy:**
   - Dados mantidos apenas durante período de pesquisa
   - Após conclusão, dados podem ser agregados e anonimizados permanentemente

### Compliance

- ✅ LGPD: Dados coletados apenas para fins de pesquisa
- ✅ Consentimento: Usuário sabe que está participando de teste
- ✅ Minimização: Coleta apenas dados necessários para análise
- ✅ Transparência: Esta documentação descreve todos os dados coletados

---

## 📊 Exemplos de Queries de Análise

### 1. Taxa de Conclusão do Onboarding

```sql
SELECT 
  COUNT(*) as total_surveys,
  COUNT(onboardingCompletedAt) as completed,
  (COUNT(onboardingCompletedAt)::float / COUNT(*) * 100) as completion_rate
FROM Survey;
```

### 2. Tempo Médio no Onboarding

```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (onboardingCompletedAt - startedAt))) / 60 as avg_minutes
FROM Survey
WHERE onboardingCompletedAt IS NOT NULL;
```

### 3. Doses Mais Comuns

```sql
SELECT 
  name,
  COUNT(*) as count
FROM Dose
GROUP BY name
ORDER BY count DESC
LIMIT 10;
```

### 4. Taxa de Resposta a Alarmes

```sql
SELECT 
  s.id,
  s.userName,
  s.totalAlarmsSet,
  s.totalDosesTaken,
  (s.totalDosesTaken::float / NULLIF(s.totalAlarmsSet, 0) * 100) as adherence_rate
FROM Survey s
WHERE s.totalAlarmsSet > 0
ORDER BY adherence_rate DESC;
```

### 5. Feedback por Satisfação

```sql
SELECT 
  ROUND(AVG(easeOfUse), 2) as avg_ease,
  ROUND(AVG(clarityOfInstructions), 2) as avg_clarity,
  ROUND(AVG(perceivedSpeed), 2) as avg_speed,
  ROUND(AVG(confidenceInUse), 2) as avg_confidence,
  ROUND(AVG(intentionToUse), 2) as avg_intention
FROM Feedback;
```

### 6. Distribuição de Tempo de Resposta a Alarmes

```sql
SELECT 
  CASE 
    WHEN responseTime <= 10 THEN '0-10s'
    WHEN responseTime <= 30 THEN '11-30s'
    WHEN responseTime <= 60 THEN '31-60s'
    ELSE '60s+'
  END as response_bucket,
  COUNT(*) as count
FROM AlarmInteraction
WHERE action = 'confirmed' AND responseTime IS NOT NULL
GROUP BY response_bucket
ORDER BY MIN(responseTime);
```

### 7. Jornada do Usuário (Funnel)

```sql
SELECT 
  COUNT(*) as started,
  COUNT(onboardingCompletedAt) as completed_onboarding,
  COUNT(doseCreationCompletedAt) as created_dose,
  COUNT(CASE WHEN totalAlarmsSet > 0 THEN 1 END) as had_alarm,
  COUNT(CASE WHEN totalDosesTaken > 0 THEN 1 END) as took_dose,
  COUNT(CASE WHEN id IN (SELECT surveyId FROM Feedback) THEN 1 END) as gave_feedback
FROM Survey;
```

---

## 🔄 Atualizações de Contadores

### Quando os contadores são incrementados:

| Contador | Quando é Incrementado | Endpoint/Função |
|----------|------------------------|-----------------|
| `totalDosesCreated` | Nova dose criada (upsert detecta createdAt = updatedAt) | `PATCH /api/survey/[id]` |
| `totalAlarmsSet` | Alarme disparado (action="triggered") | `POST /api/tracking` → processAlarmEvent |
| `totalAlarmsDismissed` | Alarme ignorado (action="dismissed") | `POST /api/tracking` → processAlarmEvent |
| `totalAlarmsSnoozed` | Alarme adiado (action="snoozed") | `POST /api/tracking` → processAlarmEvent |
| `totalDosesTaken` | Dose marcada como tomada | `POST /api/dose-history` |
| `totalPageViews` | Nova página visitada | `POST /api/tracking` → processNavigationEvent |

---

## 📦 Exportação de Dados

### Formato Recomendado: JSON + CSV

**Para análise quantitativa:** Exportar tabelas como CSV  
**Para análise qualitativa:** Exportar feedback textual como JSON

### Script de Exportação (Exemplo)

```javascript
// check-db.js (já existente no projeto)
// Pode ser estendido para exportar para arquivos CSV/JSON
```

---

## 📞 Contato para Dúvidas

Para questões sobre esta documentação ou sobre a estrutura de dados:

- **Repositório:** Unknown-Bytes/lembrei
- **Branch:** dev
- **Última Atualização:** 17 de Outubro de 2025

---

## 📝 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2025-10-17 | Documentação inicial completa com todos os modelos |

---

**FIM DA DOCUMENTAÇÃO**
