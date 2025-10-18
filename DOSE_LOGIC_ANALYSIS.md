# Análise da Lógica de Doses - Problemas Identificados

## Data: 17/10/2025

## Problemas Identificados:

### 1. **Duplicação de Fonte de Dados**
**Localização:** `dashboard/page.tsx`, `doses/page.tsx`, `doses/new/page.tsx`

**Problema:**
- As doses estão sendo carregadas de DUAS fontes diferentes:
  1. `surveyData.doses` (Context API)
  2. `localStorage.getItem('doses')` (localStorage direto)

**Código Problemático:**
```tsx
// dashboard/page.tsx linha 133-143
const dosesFromContext = JSON.parse(dosesFromContextStr);

if (dosesFromContext.length === 0) {
  const dosesRaw = localStorage.getItem('doses') || '[]';
  const parsedDoses = JSON.parse(dosesRaw);
  setDoses(parsedDoses);
} else {
  setDoses(dosesFromContext);
}
```

**Consequência:**
- Sincronização inconsistente entre Context e localStorage
- Doses podem aparecer em um lugar mas não em outro
- Estado desatualizado quando navegando entre páginas

---

### 2. **Atualização Assíncrona Incompleta**
**Localização:** `doses/new/page.tsx` linha 76

**Problema:**
- Quando uma nova dose é salva, ela é adicionada ao localStorage ANTES de atualizar o Context
- O Context é atualizado através de `updateSurveyData({ doses: doses })`
- Mas a API só é chamada depois (try/catch)

**Código:**
```tsx
localStorage.setItem("doses", JSON.stringify(doses)); // Salva no localStorage

// Depois...
updateSurveyData({ 
  dosesAdded: true,
  doses: doses  // Tenta sincronizar com Context
});

// E depois ainda...
await fetch(`/api/survey/${surveyData.surveyId}`, {
  // Salva no servidor
});
```

**Consequência:**
- Race condition entre localStorage, Context e API
- Se o Context não atualizar rápido, o dashboard pode não mostrar a nova dose

---

### 3. **getTodaysDoses Calculado Incorretamente**
**Localização:** `dashboard/page.tsx` e `doses/page.tsx`

**Problema:**
- A função `getTodaysDoses` está como `useMemo` mas depende apenas de `doses`
- Não considera mudanças em `takenDoses` para re-calcular
- Os dias da semana estão em inglês (`'sunday', 'monday'`, etc.) mas pode haver inconsistência

**Código:**
```tsx
const getTodaysDoses = useMemo(() => {
  const today = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
  
  return doses.filter(dose => {
    if (dose.frequency === 'daily') {
      return true;
    } else if (dose.frequency === 'weekly') {
      return dose.selectedDays.includes(dayOfWeek);
    }
    return false;
  });
}, [doses]); // Falta considerar a data atual!
```

**Consequência:**
- Se a página carregar à meia-noite, as doses podem não atualizar para o novo dia
- Filtro de dias da semana pode falhar se os `selectedDays` estiverem em formato diferente

---

### 4. **Lógica de Alarme com Dependências Problemáticas**
**Localização:** `dashboard/page.tsx` linha 166-210

**Problema:**
- O useEffect do alarme tem dependências inconsistentes
- Adiciona `getTodaysDoses` e `takenDoses` arrays completos nas dependências
- Isso causa re-renders infinitos

**Código:**
```tsx
useEffect(() => {
  // ... lógica do alarme
}, [surveyData?.dosesAdded, hasVisitedDosesList, takenDoses.length, doses.length, getTodaysDoses.length, router, getTodaysDoses, takenDoses]);
//                                                                                                               ^^^^^^^^^^^^^^^^ ^^^^^^^^^^
//                                                                                                               PROBLEMA: arrays nas deps
```

**Consequência:**
- Countdown resetando constantemente
- Alarme não disparando corretamente
- Performance ruim com re-renders excessivos

---

### 5. **Falta de Validação de Data/Período**
**Localização:** `doses/new/page.tsx`

**Problema:**
- Doses podem ter `startDate` e `endDate` mas não há validação se a dose está ativa hoje
- A lógica de `getTodaysDoses` não considera se a dose já passou do `endDate`

**Código:**
```tsx
const getTodaysDoses = useMemo(() => {
  // ... código que filtra por frequency e selectedDays
  // MAS NÃO verifica se hoje está entre startDate e endDate!
}, [doses]);
```

**Consequência:**
- Doses expiradas podem aparecer como ativas
- Doses futuras podem aparecer antes da data de início

---

## Soluções Propostas:

### Solução 1: Fonte Única de Verdade (Single Source of Truth)
```tsx
// Usar APENAS o Context como fonte
// O localStorage serve apenas para persistência, não para leitura

// Em SurveyContext.tsx
const loadSurveyData = async () => {
  const dosesRaw = localStorage.getItem('doses') || '[]';
  const doses = JSON.parse(dosesRaw);
  
  setSurveyData({
    // ...
    doses: doses, // Carrega do localStorage pro Context
  });
};

// Em todos os componentes
const doses = surveyData?.doses || []; // Lê APENAS do Context
```

### Solução 2: Sincronização Atômica
```tsx
// Em doses/new/page.tsx
const handleSave = async () => {
  const newDose = { /* ... */ };
  const updatedDoses = [...(surveyData?.doses || []), newDose];
  
  // 1. Atualiza Context (fonte única)
  updateSurveyData({ 
    dosesAdded: true,
    doses: updatedDoses 
  });
  
  // 2. Persiste no localStorage (dentro do updateSurveyData)
  // 3. Salva na API em background
  
  router.push('/sc/dashboard');
};
```

### Solução 3: getTodaysDoses Correto
```tsx
const getTodaysDoses = useMemo(() => {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // "2025-10-17"
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  
  return doses.filter(dose => {
    // Verifica período de validade
    if (dose.startDate && today < dose.startDate) return false;
    if (dose.endDate && today > dose.endDate) return false;
    
    // Verifica frequência
    if (dose.frequency === 'daily') return true;
    if (dose.frequency === 'weekly') {
      return dose.selectedDays.map(d => d.toLowerCase()).includes(dayOfWeek);
    }
    return false;
  });
}, [doses, new Date().toDateString()]); // Re-calcula a cada dia
```

### Solução 4: Alarme com Dependências Fixas
```tsx
useEffect(() => {
  // ... lógica do alarme
}, [
  surveyData?.dosesAdded, 
  hasVisitedDosesList, 
  takenDoses.length,     // Apenas o length
  doses.length,          // Apenas o length
  getTodaysDoses.length, // Apenas o length
  router
  // NÃO inclui arrays completos
]);
```

---

## Próximos Passos:

1. ✅ **Documentar problemas** (este arquivo)
2. ⏳ Implementar fonte única de verdade (Context como principal)
3. ⏳ Corrigir getTodaysDoses para considerar datas
4. ⏳ Simplificar dependências do useEffect do alarme
5. ⏳ Adicionar logging para debug
6. ⏳ Testar fluxo completo: criar dose → ver no dashboard → marcar como tomada → alarme

---

## Testes Necessários:

- [ ] Criar dose e verificar se aparece no dashboard imediatamente
- [ ] Navegar entre páginas e verificar se doses persistem
- [ ] Marcar dose como tomada e verificar se progresso atualiza
- [ ] Verificar se alarme dispara após completar objetivos
- [ ] Testar doses com frequência semanal em diferentes dias
- [ ] Testar doses com período (startDate/endDate)
- [ ] Verificar comportamento à meia-noite (mudança de dia)
