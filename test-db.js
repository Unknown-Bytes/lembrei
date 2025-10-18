// Script de teste rápido para verificar a conexão com o banco
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...\n');
    
    // Tentar criar um survey de teste
    const survey = await prisma.survey.create({
      data: {
        userName: 'Teste de Conexão',
        dosesAdded: false,
      },
    });
    
    console.log('✅ Survey criado com sucesso!');
    console.log('📝 ID:', survey.id);
    console.log('👤 Nome:', survey.userName);
    console.log('📅 Criado em:', survey.createdAt);
    
    // Buscar o survey criado
    const foundSurvey = await prisma.survey.findUnique({
      where: { id: survey.id },
    });
    
    console.log('\n✅ Survey encontrado no banco!');
    console.log('📄 Dados:', JSON.stringify(foundSurvey, null, 2));
    
    // Tentar atualizar com doses
    const testDoses = [
      {
        id: 'dose_test_1',
        name: 'Paracetamol',
        time: '08:00',
        notes: 'Tomar com água',
        frequency: 'daily',
        selectedDays: [],
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
    ];
    
    const updated = await prisma.survey.update({
      where: { id: survey.id },
      data: {
        doses: testDoses,
        dosesAdded: true,
        userEvents: [
          {
            type: 'test_event',
            at: new Date().toISOString(),
          },
        ],
      },
    });
    
    console.log('\n✅ Survey atualizado com doses!');
    console.log('💊 Doses salvas:', updated.doses);
    console.log('📊 Eventos:', updated.userEvents);
    
    // Limpar o teste
    await prisma.survey.delete({
      where: { id: survey.id },
    });
    
    console.log('\n🧹 Survey de teste deletado');
    console.log('\n✨ Todos os testes passaram! O banco está funcionando corretamente.');
    
  } catch (error) {
    console.error('\n❌ Erro ao testar o banco:', error);
    console.error('\n📋 Detalhes do erro:');
    console.error('   Mensagem:', error.message);
    if (error.code) console.error('   Código:', error.code);
    if (error.meta) console.error('   Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
