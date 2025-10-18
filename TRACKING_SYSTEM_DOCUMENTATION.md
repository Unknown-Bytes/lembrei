# 📊 Sistema Completo de Coleta de Dados - Análise Científica

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Novo Schema do Prisma** (schema.prisma)
Criadas 9 tabelas abrangentes para coleta científica de dados:

#### **Survey** (expandido)
- Dados de usuário e dispositivo
- Timestamps detalhados de navegação
- Contadores de uso (doses, alarmes, visualizações)
- Relacionamentos com todas as tabelas

#### **Dose** (novo)
- Informações completas do medicamento
- Frequência e horários
- Contadores de doses tomadas/perdidas
- Histórico completo

#### **DoseHistory** (novo)
- Registro de cada dose tomada/perdida/adiada
- Timestamps e contexto completo
- Atraso em minutos
- Fonte da ação (dashboard, alarm, manual)

#### **NavEvent** (expandido)
- Entrada e saída de cada página
- Duração calculada automaticamente
- Dados técnicos (device, screen, viewport, IP, timezone)
- Profundidade de scroll e contagem de cliques

#### **PageTiming** (novo)
- Tempo detalhado por página
- Métricas de performance (loadTime, timeToInteractive)
- Número de interações
- Máximo de scroll

#### **Interaction** (expandido)
- Todos os tipos de interação (click, input, scroll, hover, focus)
- Posição X/Y dos cliques
- Texto do elemento clicado
- Duração de interações (para hovers)

#### **AlarmInteraction** (novo)
- Todos os eventos de alarmes (triggered, dismissed, snoozed, confirmed, deferred)
- Tempo de resposta em segundos
- Contagem de snoozes
- Estado do dispositivo

#### **Feedback** (novo)
- 5 perguntas avaliadas (1-5)
- Feedback textual
- Tempo para completar
- Categorização e tags

#### **ErrorLog** (novo)
- Captura de erros JavaScript
- Stack traces completos
- Contexto de reprodução
- Severidade e status de resolução

---

### 2. **Enhanced Tracking Service** (lib/services/enhancedTrackingService.ts)

Sistema automático que coleta:

#### **Navegação Automática**
- ✅ Entrada em cada página (timestamp)
- ✅ Saída de cada página (timestamp)
- ✅ Tempo de permanência calculado automaticamente
- ✅ Mudanças de rota em SPAs

#### **Interações do Usuário**
- ✅ Todos os cliques (elemento, texto, posição X/Y)
- ✅ Inputs (tipo, se tem valor, comprimento)
- ✅ Focus e blur em campos
- ✅ Scroll com milestones (25%, 50%, 75%, 90%, 100%)
- ✅ Hovers (com duração)

#### **Performance**
- ✅ Tempo de carregamento da página
- ✅ Time to interactive
- ✅ Dom content loaded
- ✅ Transfer size

#### **Erros**
- ✅ JavaScript errors
- ✅ Unhandled promise rejections
- ✅ Stack traces completos

#### **Sistema de Fila**
- ✅ Eventos em batch (10 por vez)
- ✅ Flush automático a cada 10 segundos
- ✅ Keepalive para beforeunload
- ✅ Fila de até 100 eventos

---

### 3. **APIs Criadas**

#### `/api/feedback` (POST)
- Salva feedback completo no banco
- Mapeia respostas das 6 perguntas
- Calcula tempo de resposta
- Retorna feedbackId

#### `/api/tracking/page-timing` (POST)
- Salva timing detalhado de cada página
- Atualiza contador de pageViews
- Registra interações e scroll depth

#### `/api/tracking` (POST)
- Endpoint principal de tracking
- Processa eventos em lote
- Roteamento por tipo de evento:
  - Navegação → NavEvent
  - Interações → Interaction
  - Alarmes → AlarmInteraction
  - Erros → ErrorLog
  - Genéricos → Interaction

#### `/api/dose-history` (POST)
- Registra cada dose tomada/perdida
- Atualiza contadores de dose
- Atualiza contadores de survey
- Calcula se tomou no horário

---

### 4. **Páginas Atualizadas com Tracking**

#### **feedback/page.tsx**
- ✅ Track quando inicia feedback
- ✅ Track cada pergunta respondida (com tempo)
- ✅ Track submissão completa
- ✅ Envia ao banco de dados via API
- ✅ Backup no localStorage

#### **alarm/page.tsx**
- ✅ Track quando alarme dispara
- ✅ Track confirmação de dose (com tempo de resposta)
- ✅ Track quando adia dose
- ✅ Salva no histórico de doses
- ✅ Calcula response time em segundos

#### **dashboard/page.tsx**
- ✅ Track when dose marked as taken
- ✅ Enhanced tracking integration
- ✅ Salva no histórico via API
- ✅ Registra fonte (dashboard)

---

### 5. **Componentes Adicionados**

#### **TrackingInitializer**
- Inicializa tracking global
- Seta surveyId automaticamente
- Adicionado no layout principal

---

## 📈 DADOS COLETADOS POR CATEGORIA

### **Temporais**
- ⏱️ Tempo em cada página (entrada, saída, duração)
- ⏱️ Tempo para responder cada pergunta de feedback
- ⏱️ Tempo de resposta a alarmes (segundos)
- ⏱️ Atraso em tomar doses (minutos)
- ⏱️ Tempo de carregamento de páginas

### **Comportamentais**
- 👆 Todos os cliques (onde, quando, o quê)
- ⌨️ Interações com inputs
- 📜 Profundidade de scroll em cada página
- 🖱️ Hovers e focus
- 🔄 Fluxo de navegação completo

### **Medicamentos**
- 💊 Quais medicamentos adicionados
- 💊 Quando cada dose foi tomada
- 💊 Doses perdidas vs tomadas
- 💊 Horários programados vs reais
- 💊 Fonte da ação (dashboard, alarm, manual)

### **Alarmes**
- 🔔 Quando dispara
- 🔔 Se confirmou, adiou ou ignorou
- 🔔 Tempo de resposta
- 🔔 Quantos snoozes
- 🔔 Estado do dispositivo

### **Feedback**
- ⭐ 5 avaliações numéricas (1-5)
- 📝 Feedback textual
- ⏱️ Tempo para completar
- 📊 Por pergunta: rating + tempo gasto

### **Técnicos**
- 📱 Device type (mobile/desktop/tablet)
- 📐 Screen resolution e viewport
- 🌐 User agent, IP, idioma, timezone
- 🔧 Performance metrics
- 🐛 Erros e stack traces

---

## 🚀 PRÓXIMOS PASSOS

### Para Usar o Sistema:

1. **Regenerar Prisma Client:**
```bash
npx prisma generate
```

2. **Verificar Migration:**
A migration já foi criada: `20251018005047_add_comprehensive_tracking_tables`

3. **Testar Coleta:**
- Navegar pelas páginas
- Interagir com elementos
- Criar doses
- Responder feedback
- Ver dados no banco

4. **Análise de Dados:**
Use queries Prisma para extrair insights:
- Tempo médio por página
- Taxa de conclusão
- Padrões de uso
- Erros mais comuns
- Medicamentos mais usados

---

## 🎯 COBERTURA COMPLETA

### ✅ O que está sendo coletado:
- [x] Tempo de entrada em TODAS as áreas
- [x] Se visitou cada página
- [x] Doses adicionadas (quais, quando)
- [x] Qual remédio foi adicionado
- [x] Feedback completo (5 perguntas + texto)
- [x] Interações com alarmes (todas)
- [x] Histórico de doses tomadas
- [x] Tempo de permanência em cada página
- [x] Cliques e interações
- [x] Erros e bugs
- [x] Performance metrics
- [x] Device info completo
- [x] Session tracking

### 📊 Dados Prontos para Análise:
- Funil de conversão (onboarding → dose creation)
- Tempo médio por etapa
- Taxa de abandono
- Engagement por página
- Usabilidade (tempo de resposta)
- Bugs e problemas técnicos
- Satisfação do usuário

---

## 💡 INSIGHTS QUE PODEM SER EXTRAÍDOS

1. **User Journey:**
   - Caminho mais comum
   - Onde abandonam
   - Tempo em cada etapa

2. **Usabilidade:**
   - Páginas mais lentas
   - Elementos mais clicados
   - Áreas de confusão (muito tempo)

3. **Engagement:**
   - Quantos completam onboarding
   - Taxa de adição de doses
   - Taxa de resposta a alarmes

4. **Satisfação:**
   - Notas de feedback
   - Comentários textuais
   - Intenção de uso futuro

5. **Técnico:**
   - Erros mais frequentes
   - Performance por device
   - Compatibilidade

---

## 🔍 Como Consultar os Dados

```typescript
// Tempo médio por página
const pageTimings = await prisma.pageTiming.groupBy({
  by: ['page'],
  _avg: { timeSpent: true },
  where: { surveyId: 'xxx' }
});

// Taxa de conclusão de feedback
const feedbackRate = await prisma.feedback.count({
  where: { surveyId: 'xxx' }
}) / await prisma.survey.count();

// Doses mais populares
const topMeds = await prisma.dose.groupBy({
  by: ['medicationName'],
  _count: true,
  orderBy: { _count: { medicationName: 'desc' } }
});

// Erros mais frequentes
const commonErrors = await prisma.errorLog.groupBy({
  by: ['errorMessage'],
  _count: true,
  orderBy: { _count: { errorMessage: 'desc' } }
});
```

---

**Status:** ✅ Sistema completo implementado - Pronto para coleta científica de dados!
