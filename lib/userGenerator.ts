import type { RandomUser } from './types';

const firstNames = [
  'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
  'Igor', 'Julia', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Rafaela',
  'Sofia', 'Thiago', 'Valentina', 'William', 'Beatriz', 'Diego', 'Isabela', 'João',
  'Laura', 'Miguel', 'Natalia', 'Rafael', 'Camila', 'Felipe', 'Amanda', 'Gustavo'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida',
  'Nascimento', 'Araújo', 'Melo', 'Barbosa', 'Cardoso', 'Correia', 'Dias', 'Fernandes',
  'Freitas', 'Gonçalves', 'Lopes', 'Mendes', 'Moreira', 'Nunes', 'Pinto', 'Ramos'
];

const domains = [
  'teste.com.br', 'exemplo.com.br', 'demo.com.br', 'amostra.com.br',
  'trial.com.br', 'preview.com.br', 'prototipo.com.br', 'experimento.com.br'
];

function generateRandomId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateRandomUser(customName?: string): RandomUser {
  // Use custom name if provided, otherwise use "Testador" as default
  const useDefaultName = !customName || customName.trim() === '';
  const firstName = useDefaultName ? 'Testador' : customName.split(' ')[0];
  const lastName = useDefaultName ? '' : (customName.split(' ').slice(1).join(' ') || getRandomElement(lastNames));
  const domain = getRandomElement(domains);
  const randomNum = Math.floor(Math.random() * 9999);
  
  const fullName = useDefaultName ? 'Testador' : customName.trim();
  const email = `${firstName.toLowerCase()}${lastName ? '.' + lastName.toLowerCase() : ''}${randomNum}@${domain}`;
  const password = generateRandomPassword();
  
  return {
    id: generateRandomId(),
    email,
    password,
    firstName,
    lastName: lastName || '',
    fullName,
    createdAt: new Date().toISOString(),
  };
}
