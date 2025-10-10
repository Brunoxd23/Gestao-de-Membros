# 🚀 Guia de Deploy - Sistema CEPPEMBU

Este guia mostra como fazer o deploy do sistema com banco de dados real usando Neon.

## 📋 Pré-requisitos

1. **Conta no Neon** (https://neon.tech) - Banco PostgreSQL gratuito
2. **Conta no Vercel** (https://vercel.com) - Para hospedar a aplicação
3. **Node.js** instalado localmente (para desenvolvimento)

## 🗄️ Passo 1: Configurar Banco de Dados Neon

### 1.1 Criar Projeto no Neon
1. Acesse https://neon.tech
2. Faça login ou crie uma conta
3. Clique em "Create Project"
4. Escolha um nome: `ceppembu-database`
5. Clique em "Create Project"

### 1.2 Obter String de Conexão
1. No dashboard do Neon, vá em "Connection Details"
2. Copie a **Connection String** (começa com `postgresql://`)
3. Guarde essa string - será usada nas variáveis de ambiente

### 1.3 Criar Tabelas
1. No Neon, vá em "SQL Editor"
2. Copie e cole o conteúdo do arquivo `database/schema.sql`
3. Execute o script (botão "Run")
4. Verifique se as tabelas foram criadas

## 🌐 Passo 2: Deploy no Vercel

### 2.1 Preparar o Projeto
1. Certifique-se que todos os arquivos estão no repositório
2. O arquivo `vercel.json` já está configurado

### 2.2 Deploy via GitHub (Recomendado)
1. Faça commit de todos os arquivos:
   ```bash
   git add .
   git commit -m "Sistema CEPPEMBU com banco de dados"
   git push origin main
   ```

2. No Vercel:
   - Acesse https://vercel.com
   - Faça login com GitHub
   - Clique em "New Project"
   - Importe seu repositório
   - Configure as variáveis de ambiente (próximo passo)

### 2.3 Configurar Variáveis de Ambiente
No Vercel, vá em Settings > Environment Variables e adicione:

```
DATABASE_URL=postgresql://sua-string-de-conexao-do-neon
NODE_ENV=production
FRONTEND_URL=https://seu-dominio.vercel.app
```

### 2.4 Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Acesse sua URL (ex: https://ceppembu.vercel.app)

## 🔧 Passo 3: Deploy Alternativo (Railway)

Se preferir usar Railway:

### 3.1 Preparar Railway
1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em "New Project" > "Deploy from GitHub repo"

### 3.2 Configurar Variáveis
No Railway, vá em Variables e adicione:
```
DATABASE_URL=postgresql://sua-string-de-conexao-do-neon
NODE_ENV=production
```

### 3.3 Deploy
1. Railway detectará automaticamente o `railway.json`
2. O deploy começará automaticamente
3. Aguarde completar e acesse a URL fornecida

## 🧪 Passo 4: Testar o Sistema

### 4.1 Verificar Conexão
1. Acesse sua URL de deploy
2. Verifique se aparece "Sistema conectado ao banco de dados!"
3. Se houver erro, verifique as variáveis de ambiente

### 4.2 Testar Funcionalidades
1. **Cadastrar membro**: Preencha o formulário
2. **Listar membros**: Verifique se aparece na lista
3. **Buscar**: Teste a busca por nome
4. **Relatórios**: Acesse e veja os gráficos
5. **Aniversários**: Cadastre alguém com data de nascimento

## 🔒 Passo 5: Configurações de Segurança

### 5.1 Rate Limiting
O sistema já tem rate limiting configurado (100 requests/15min por IP)

### 5.2 HTTPS
Tanto Vercel quanto Railway fornecem HTTPS automaticamente

### 5.3 Backup
Configure backup automático no Neon:
1. No dashboard do Neon
2. Vá em "Backups"
3. Configure backup diário

## 📊 Passo 6: Monitoramento

### 6.1 Logs do Vercel
- Acesse o dashboard do Vercel
- Vá em "Functions" para ver logs
- Monitore erros e performance

### 6.2 Logs do Railway
- No dashboard do Railway
- Vá em "Deployments" > "View Logs"
- Monitore a aplicação

### 6.3 Database Neon
- No dashboard do Neon
- Vá em "Dashboard" para ver métricas
- Monitore uso de CPU, memória e conexões

## 🚨 Solução de Problemas

### Problema: "Erro na conexão com o servidor"
**Solução**: Verifique se a `DATABASE_URL` está correta

### Problema: "Erro interno do servidor"
**Solução**: Verifique os logs no Vercel/Railway

### Problema: Dados não salvam
**Solução**: Verifique se as tabelas foram criadas no Neon

### Problema: Build falha
**Solução**: Verifique se todos os arquivos estão commitados

## 💡 Dicas Importantes

1. **Backup Regular**: Use a função "Exportar Dados" periodicamente
2. **Monitoramento**: Verifique logs regularmente
3. **Atualizações**: Mantenha dependências atualizadas
4. **Segurança**: Nunca commite o arquivo `.env` real

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do deploy
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Entre em contato com o desenvolvedor

---

**🎉 Parabéns! Seu sistema está online e acessível de qualquer lugar!**
