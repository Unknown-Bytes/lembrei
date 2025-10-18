# 🚀 GUIA DE SETUP DO SISTEMA DE TRACKING

## ⚠️ IMPORTANTE - Execute os comandos abaixo para ativar o sistema

### 1. Feche todos os processos do Node/Prisma
Feche o terminal atual e abra um novo.

### 2. Regenere o Prisma Client
```powershell
npx prisma generate
```

**Se der erro EPERM (permissão):**
- Feche o VS Code completamente
- Abra o VS Code novamente
- Execute o comando novamente

### 3. Verifique o Schema
```powershell
npx prisma format
```

### 4. Verifique a Migration
```powershell
npx prisma migrate status
```

### 5. Se precisar aplicar migrations pendentes
```powershell
npx prisma migrate deploy
```

### 6. Execute o Typecheck
```powershell
npm run typecheck
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

Após regenerar o Prisma Client, verifique:

- [ ] `npx prisma generate` executou sem erros
- [ ] Não há erros de compilação TypeScript
- [ ] As seguintes tabelas existem no banco:
  - [ ] Survey (atualizada)
  - [ ] Dose (nova)
  - [ ] DoseHistory (nova)
  - [ ] NavEvent (atualizada)
  - [ ] PageTiming (nova)
  - [ ] Interaction (atualizada)
  - [ ] AlarmInteraction (nova)
  - [ ] Feedback (nova)
  - [ ] ErrorLog (nova)

---

## 🧪 TESTANDO O SISTEMA

### Teste 1: Tracking Automático
1. Acesse qualquer página do app
2. Navegue entre páginas
3. Clique em elementos
4. Role a página
5. Verifique no banco a tabela `NavEvent` e `Interaction`

### Teste 2: Feedback
1. Complete o fluxo e chegue ao feedback
2. Responda as perguntas
3. Envie o feedback
4. Verifique na tabela `Feedback`

### Teste 3: Alarmes
1. Configure uma dose
2. Aguarde o alarme aparecer
3. Confirme ou adie
4. Verifique na tabela `AlarmInteraction` e `DoseHistory`

### Teste 4: Doses
1. Crie uma dose
2. Marque como tomada no dashboard
3. Verifique nas tabelas `Dose` e `DoseHistory`

### Teste 5: Page Timing
1. Entre em qualquer página
2. Interaja por alguns segundos
3. Saia da página
4. Verifique na tabela `PageTiming`

---

## 🔍 QUERIES DE TESTE

Execute no Prisma Studio (`npx prisma studio`) ou via código:

### Ver todas as navegações
```typescript
const navEvents = await prisma.navEvent.findMany({
  where: { surveyId: 'SEU_SURVEY_ID' },
  orderBy: { timestamp: 'desc' },
  take: 10
});
```

### Ver tempo médio por página
```typescript
const avgTime = await prisma.pageTiming.groupBy({
  by: ['page'],
  _avg: { timeSpent: true },
  where: { surveyId: 'SEU_SURVEY_ID' }
});
```

### Ver histórico de doses
```typescript
const doseHistory = await prisma.doseHistory.findMany({
  where: { surveyId: 'SEU_SURVEY_ID' },
  include: { dose: true },
  orderBy: { timestamp: 'desc' }
});
```

### Ver feedbacks
```typescript
const feedbacks = await prisma.feedback.findMany({
  where: { surveyId: 'SEU_SURVEY_ID' }
});
```

### Ver interações com alarmes
```typescript
const alarms = await prisma.alarmInteraction.findMany({
  where: { surveyId: 'SEU_SURVEY_ID' },
  include: { dose: true },
  orderBy: { timestamp: 'desc' }
});
```

---

## 📊 DASHBOARDS SUGERIDOS

### 1. User Journey
- Sequência de páginas visitadas
- Tempo em cada página
- Onde abandona

### 2. Engagement
- Total de interações
- Páginas mais visitadas
- Tempo total de sessão

### 3. Medicamentos
- Doses criadas vs tomadas
- Taxa de adesão
- Horários mais comuns

### 4. Alarmes
- Taxa de resposta
- Tempo médio de resposta
- Taxa de snooze

### 5. Satisfação
- Média das avaliações
- Feedback textual
- Intenção de uso

---

## 🐛 TROUBLESHOOTING

### Erro: "Property X does not exist on type PrismaClient"
**Solução:** Execute `npx prisma generate`

### Erro: "EPERM: operation not permitted"
**Solução:** 
1. Feche VS Code completamente
2. Mate todos os processos node.exe no Task Manager
3. Abra VS Code novamente
4. Execute `npx prisma generate`

### Erro: "Drift detected"
**Solução:**
```powershell
npx prisma migrate reset --force
npx prisma generate
```

### Migration não aplicada
**Solução:**
```powershell
npx prisma migrate deploy
```

---

## 📈 PRÓXIMOS PASSOS

1. **Visualização de Dados:**
   - Criar dashboard admin
   - Gráficos com Chart.js ou Recharts
   - Exportação para CSV/Excel

2. **Análise Avançada:**
   - Cohort analysis
   - Funnel analysis
   - A/B testing framework

3. **Alertas:**
   - Detecção de erros críticos
   - Alertas de abandono
   - Notificações de baixa adesão

4. **Privacy:**
   - Anonimização de dados sensíveis
   - GDPR compliance
   - Data retention policies

---

**Status:** ✅ Sistema implementado - Aguardando regeneração do Prisma Client
