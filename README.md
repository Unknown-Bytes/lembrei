# Lembrei! - Gerador de Usuários de Teste

Uma aplicação Next.js que gera automaticamente usuários de teste aleatórios com credenciais únicas e registra-os no Supabase.

## 🎯 Funcionalidades

- **Geração Automática de Usuários**: Cria usuários únicos com nomes e emails brasileiros realistas
- **Integração com Supabase**: Registra usuários diretamente no banco de dados Supabase
- **Credenciais Seguras**: Gera senhas fortes de 12 caracteres automaticamente
- **Interface em Português**: Toda a experiência do usuário em português brasileiro
- **Design Responsivo**: Interface moderna e responsiva com gradientes atraentes

## 🚀 Começando

### Instalação

```bash
npm install
# ou
yarn install
```

### Servidor de Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📊 Como Funciona

### Fluxo do Usuário

1. **Página Inicial** (`/`): Botão "Começar" com design limpo e centralizado
2. **Página de Registro** (`/register`): Botão "Vamos lá!" que:
   - Gera um usuário aleatório
   - Registra no Supabase
   - Armazena dados localmente
3. **Página do Usuário** (`/usuario`): Exibe informações completas:
   - Nome completo
   - Email
   - Senha gerada
   - ID único
   - Data de criação
   - Botões para copiar informações

### Dados Gerados

Cada usuário recebe:
- **Nome Completo**: Combinação aleatória de nomes e sobrenomes brasileiros
- **Email**: Formato `nome.sobrenome1234@dominio.com.br`
- **Senha**: 12 caracteres com letras, números e símbolos
- **ID Único**: Timestamp + código aleatório
- **Data de Criação**: Timestamp da geração

## 🗂️ Estrutura do Projeto

```
/app
  /usuario         - Página de exibição do usuário
  /register        - Página de geração e registro
  page.tsx         - Página inicial
  layout.tsx       - Layout raiz

/lib
  types.ts         - Interfaces TypeScript
  userGenerator.ts - Gerador de usuários aleatórios
  supabase.ts      - Cliente Supabase
```

## 🔧 Componentes Principais

### Gerador de Usuários

Gera usuários brasileiros realistas:

```typescript
const user = generateRandomUser()
// Retorna: { id, email, password, firstName, lastName, fullName, createdAt }
```

### Integração com Supabase

Registra usuários automaticamente:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: randomUser.email,
  password: randomUser.password,
  options: {
    data: {
      first_name: randomUser.firstName,
      last_name: randomUser.lastName,
      full_name: randomUser.fullName,
      user_id: randomUser.id,
    },
  },
});
```

## 🎨 Design

- **Esquema de Cores**: Gradiente teal (`#80C2BA` para branco)
- **Tipografia**: Cabeçalhos em negrito, texto limpo
- **Animações**: Transições suaves e efeitos de hover
- **Responsivo**: Design mobile-first

## 🔄 Reset de Funcionalidade

O botão "Criar Novo Usuário" na página do usuário:
- Remove dados locais
- Redireciona para a página inicial
- Permite gerar um novo usuário

## 🛠️ Tecnologias

- **Next.js 15.5.4** - Framework React
- **React 19.1.0** - Biblioteca UI
- **TypeScript** - Segurança de tipos
- **Tailwind CSS 4** - Estilização
- **Supabase** - Backend e autenticação

## 📝 Notas

- Todos os usuários são registrados no Supabase automaticamente
- Credenciais são geradas aleatoriamente e armazenadas localmente
- Interface completamente em português brasileiro
- Dados podem ser copiados com um clique

## 🚀 Deploy

Deploy no [Vercel](https://vercel.com):

```bash
npm run build
```

A aplicação é completamente estática e pode ser hospedada em qualquer plataforma que suporte Next.js.

## 📄 Licença

© 2025 Lembrei!. Todos os direitos reservados.
