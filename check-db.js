const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Verificando dados no banco ===\n');

    // 1. Surveys
    const surveys = await prisma.survey.findMany({
      select: {
        id: true,
        userName: true,
        dosesAdded: true,
        totalDosesCreated: true,
        totalAlarmsSet: true,
        totalAlarmsDismissed: true,
        totalDosesTaken: true,
        feedbackCompletedAt: true,
        createdAt: true,
        _count: {
          select: {
            doses: true,
            alarmInteractions: true,
            doseHistory: true,
          }
        }
      }
    });

    console.log('📊 SURVEYS:', surveys.length);
    surveys.forEach((survey, index) => {
      console.log(`\n  Survey ${index + 1}:`);
      console.log(`    ID: ${survey.id}`);
      console.log(`    Nome: ${survey.userName || 'N/A'}`);
      console.log(`    Doses adicionadas: ${survey.dosesAdded}`);
      console.log(`    Total doses criadas: ${survey.totalDosesCreated}`);
      console.log(`    Total alarmes: ${survey.totalAlarmsSet}`);
      console.log(`    Total doses tomadas: ${survey.totalDosesTaken}`);
      console.log(`    Criado em: ${survey.createdAt.toLocaleString('pt-BR')}`);
      console.log(`    Feedback completado: ${survey.feedbackCompletedAt ? survey.feedbackCompletedAt.toLocaleString('pt-BR') : 'Não completado'}`);
      console.log(`    Relacionamentos:`);
      console.log(`      - Doses: ${survey._count.doses}`);
      console.log(`      - Interações de alarme: ${survey._count.alarmInteractions}`);
      console.log(`      - Histórico de doses: ${survey._count.doseHistory}`);
    });

    // 2. Doses
    const doses = await prisma.dose.findMany({
      select: {
        id: true,
        surveyId: true,
        name: true,
        time: true,
        frequency: true,
        selectedDays: true,
        startDate: true,
        endDate: true,
        notes: true,
        createdAt: true,
      }
    });

    console.log('\n\n💊 DOSES:', doses.length);
    doses.forEach((dose, index) => {
      console.log(`\n  Dose ${index + 1}:`);
      console.log(`    ID: ${dose.id}`);
      console.log(`    Survey ID: ${dose.surveyId}`);
      console.log(`    Nome: ${dose.name}`);
      console.log(`    Horário: ${dose.time}`);
      console.log(`    Frequência: ${dose.frequency}`);
      console.log(`    Dias: ${JSON.stringify(dose.selectedDays)}`);
      console.log(`    Período: ${dose.startDate || 'sem início'} até ${dose.endDate || 'sem fim'}`);
      console.log(`    Notas: ${dose.notes || 'N/A'}`);
      console.log(`    Criada em: ${dose.createdAt.toLocaleString('pt-BR')}`);
    });

    // 3. Alarm Interactions
    const alarmInteractions = await prisma.alarmInteraction.findMany({
      select: {
        id: true,
        surveyId: true,
        doseId: true,
        action: true,
        timestamp: true,
        scheduledTime: true,
        actualTime: true,
        responseTime: true,
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log('\n\n🔔 INTERAÇÕES DE ALARME (últimas 10):', alarmInteractions.length);
    alarmInteractions.forEach((interaction, index) => {
      console.log(`\n  Interação ${index + 1}:`);
      console.log(`    Ação: ${interaction.action}`);
      console.log(`    Dose ID: ${interaction.doseId || 'N/A'}`);
      console.log(`    Horário agendado: ${interaction.scheduledTime || 'N/A'}`);
      console.log(`    Horário real: ${interaction.actualTime || 'N/A'}`);
      console.log(`    Tempo de resposta: ${interaction.responseTime || 'N/A'}s`);
      console.log(`    Timestamp: ${interaction.timestamp.toLocaleString('pt-BR')}`);
    });

    // 4. Dose History
    const doseHistory = await prisma.doseHistory.findMany({
      select: {
        id: true,
        surveyId: true,
        doseId: true,
        action: true,
        scheduledTime: true,
        actualTime: true,
        takenOnTime: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log('\n\n📝 HISTÓRICO DE DOSES (últimas 10):', doseHistory.length);
    doseHistory.forEach((history, index) => {
      console.log(`\n  Registro ${index + 1}:`);
      console.log(`    Ação: ${history.action}`);
      console.log(`    Dose ID: ${history.doseId}`);
      console.log(`    Horário agendado: ${history.scheduledTime || 'N/A'}`);
      console.log(`    Horário real: ${history.actualTime || 'N/A'}`);
      console.log(`    Tomada no horário: ${history.takenOnTime ? 'Sim' : 'Não'}`);
      console.log(`    Timestamp: ${history.timestamp.toLocaleString('pt-BR')}`);
    });

    console.log('\n\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
