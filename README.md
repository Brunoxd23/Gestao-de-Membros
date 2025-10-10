# Sistema de Gestão de Membros - CEPPEMBU

Sistema completo para gerenciamento de membros da Comunidade Evangélica Príncipe da Paz (CEPPEMBU) com banco de dados PostgreSQL.

## 🎯 Funcionalidades

### ✅ Cadastro de Membros
- Formulário completo com todos os dados necessários
- Campos: Nome, Email, WhatsApp, Data de Nascimento, Data de Batismo, Endereço, Cidade, Tipo de Membro, Ministério, Observações
- Validação de campos obrigatórios
- **Dados salvos em banco PostgreSQL**

### ✅ Gestão de Membros
- Lista completa de todos os membros cadastrados
- Busca por nome, email ou telefone
- Filtro por tipo (Membro, Visitante, Novo Convertido)
- Edição de dados dos membros
- Exclusão de membros (soft delete)
- **Acesso de qualquer lugar via internet**

### ✅ Sistema de Aniversários
- Visualização de aniversariantes por mês
- Aniversários do dia destacados no dashboard
- Envio automático de parabéns via WhatsApp
- Envio de emails de parabéns personalizados
- **Logs de envio para auditoria**

### ✅ Relatórios
- Dashboard com estatísticas gerais
- Gráficos de membros por tipo
- Gráficos de distribuição por ministério
- Exportação de dados para CSV
- **Relatórios em tempo real**

### ✅ Comunicação
- Integração com WhatsApp para envio de mensagens
- Sistema de envio de emails
- Mensagens personalizadas para aniversários
- Envio em lote para aniversariantes
- **Histórico de comunicações**

## 🚀 Como Usar

### Versão Online (Recomendada)
- **Acesse a URL do sistema** (ex: https://ceppembu.vercel.app)
- **Dados salvos no banco PostgreSQL** (Neon)
- **Acessível de qualquer lugar**
- **Backup automático**

### Versão Local (Desenvolvimento)
- Execute `npm install` para instalar dependências
- Configure o arquivo `.env` com a `DATABASE_URL`
- Execute `npm run dev` para iniciar o servidor
- Acesse http://localhost:3000

### 1. Cadastrar Membros
- Clique em "Cadastrar Membro" no menu
- Preencha os dados obrigatórios (Nome e Tipo)
- Clique em "Cadastrar Membro"

### 2. Gerenciar Membros
- Acesse "Membros" no menu para ver a lista
- Use a busca para encontrar membros específicos
- Use o filtro para separar por tipo
- Clique nos ícones para editar, enviar WhatsApp/email ou excluir

### 3. Aniversários
- Acesse "Aniversários" no menu
- Selecione o mês desejado
- Visualize todos os aniversariantes
- Use os botões para enviar parabéns individualmente
- Use "Envio em Lote" para enviar para todos os aniversariantes do dia

### 4. Relatórios
- Acesse "Relatórios" para ver gráficos e estatísticas
- Use "Exportar Dados" para baixar um arquivo CSV com todos os dados

## 📱 Funcionalidades WhatsApp e Email

### WhatsApp
- Clique no ícone verde do WhatsApp em qualquer membro
- Será aberto o WhatsApp Web com mensagem pré-formatada
- Para aniversários, mensagem especial de parabéns

### Email
- Clique no ícone de email em qualquer membro
- Será aberto o cliente de email padrão com mensagem pré-formatada
- Para aniversários, email especial de parabéns

## 💾 Armazenamento de Dados

### Banco de Dados PostgreSQL (Neon)
- **Dados centralizados** em banco profissional
- **Backup automático** diário
- **Acesso global** de qualquer lugar
- **Escalável** para milhares de membros
- **Seguro** com criptografia

### Versão Offline (LocalStorage)
- Dados salvos no navegador local
- Disponível mesmo offline
- Para backup, use "Exportar Dados"

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5, CSS3, JavaScript**
- **Chart.js** para gráficos
- **Font Awesome** para ícones
- **Design responsivo**

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (via Neon)
- **Rate Limiting** para segurança
- **CORS** configurado

### Deploy
- **Vercel** ou **Railway** para hospedagem
- **Neon** para banco de dados
- **HTTPS** automático
- **CDN** global

## 🎨 Características do Sistema

- **Interface Responsiva**: Funciona em desktop, tablet e celular
- **Design Moderno**: Interface limpa e profissional
- **Fácil de Usar**: Navegação intuitiva
- **Multi-usuário**: Várias pessoas podem usar simultaneamente
- **Profissional**: Sistema robusto e confiável

## 📋 Campos do Formulário

### Obrigatórios
- Nome Completo
- Tipo de Membro (Membro, Visitante, Novo Convertido)

### Opcionais
- Email
- WhatsApp
- Data de Nascimento
- Data de Batismo
- Endereço
- Cidade
- Ministério (Pastor,Louvor, Infantil, Jovens, Senhores, Senhoras, Evangelismo, Diaconia, Outros)
- Observações

## 🚀 Deploy e Configuração

### 1. Banco de Dados (Neon)
1. Acesse https://neon.tech
2. Crie um projeto gratuito
3. Execute o script `database/schema.sql`
4. Copie a connection string

### 2. Hospedagem (Vercel)
1. Faça commit do código no GitHub
2. Importe no Vercel
3. Configure `DATABASE_URL` nas variáveis
4. Deploy automático!

### 3. Acessar
- URL única para toda a equipe
- Dados sincronizados em tempo real
- Backup automático

## 📊 APIs Disponíveis

### Membros
- `GET /api/membros` - Listar membros
- `POST /api/membros` - Criar membro
- `PUT /api/membros/:id` - Atualizar membro
- `DELETE /api/membros/:id` - Excluir membro

### Aniversários
- `GET /api/aniversarios/hoje` - Aniversariantes do dia
- `GET /api/aniversarios/mes/:mes` - Aniversariantes do mês

### Relatórios
- `GET /api/relatorios/tipo-membro` - Por tipo
- `GET /api/relatorios/ministerio` - Por ministério
- `GET /api/relatorios/exportar` - Exportar CSV

## 🔧 Personalização

O sistema pode ser facilmente personalizado:
- Cores e logo da igreja
- Campos adicionais no banco
- Mensagens de WhatsApp e email
- Ministérios específicos
- Relatórios customizados

## 📞 Suporte

Para dúvidas ou sugestões:
- Verifique o arquivo `DEPLOY.md` para configuração
- Consulte os logs do servidor
- Entre em contato com o desenvolvedor

---

**Desenvolvido com ❤️ para a Comunidade Evangélica Príncipe da Paz - CEPPEMBU**

## 📁 Estrutura do Projeto

```
FormsDadosIgreja/
├── public/                 # Frontend (HTML, CSS, JS)
├── config/                 # Configurações do banco
├── database/               # Scripts SQL
├── routes/                 # APIs (membros, aniversários, relatórios)
├── server.js              # Servidor principal
├── package.json           # Dependências
├── vercel.json           # Configuração Vercel
├── railway.json          # Configuração Railway
└── DEPLOY.md             # Guia de deploy
```