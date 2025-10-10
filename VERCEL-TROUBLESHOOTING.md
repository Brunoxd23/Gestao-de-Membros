# 🔧 Troubleshooting - Deploy Vercel

## ❌ Problemas Comuns e Soluções

### 1. **Erro de Build**
```
Build Failed
```

**Soluções:**
- ✅ Verifique se todas as dependências estão no `package.json`
- ✅ Confirme que o `server.js` existe na raiz
- ✅ Teste localmente: `npm install && npm start`

### 2. **Erro de Variáveis de Ambiente**
```
DATABASE_URL not found
```

**Soluções:**
- ✅ No painel do Vercel: **Settings** → **Environment Variables**
- ✅ Adicione: `DATABASE_URL` = sua URL do Neon
- ✅ Adicione: `NODE_ENV` = `production`

### 3. **Erro 500 - Internal Server Error**
```
Application Error
```

**Soluções:**
- ✅ Verifique os logs no painel do Vercel
- ✅ Confirme se o banco Neon está ativo
- ✅ Teste a conexão com o banco localmente

### 4. **Erro de Rota**
```
404 - Page Not Found
```

**Soluções:**
- ✅ Verifique se o `vercel.json` está correto
- ✅ Confirme que todas as rotas estão no `server.js`
- ✅ Teste as rotas localmente

## 🚀 Passo a Passo para Deploy

### **1. Preparação**
```bash
# 1. Commit e push
git add .
git commit -m "feat: prepara para deploy Vercel"
git push origin main
```

### **2. Configuração no Vercel**
1. **Acesse:** [vercel.com](https://vercel.com)
2. **Login** com GitHub
3. **New Project** → **Import Git Repository**
4. **Selecione:** `Brunoxd23/Gest-o-de-Membros`

### **3. Configurações do Projeto**
- **Framework Preset:** Other
- **Root Directory:** `.` (deixe vazio)
- **Build Command:** `npm install` (deixe vazio se não tiver build)
- **Output Directory:** `.` (deixe vazio)

### **4. Variáveis de Ambiente**
No painel do Vercel:
```
DATABASE_URL = postgresql://usuario:senha@host:porta/database
NODE_ENV = production
```

### **5. Deploy**
- Clique em **"Deploy"**
- Aguarde o build (2-3 minutos)
- Acesse a URL gerada

## 🔍 Verificações Importantes

### **Antes do Deploy:**
- [ ] `server.js` na raiz do projeto
- [ ] `package.json` com todas as dependências
- [ ] `vercel.json` configurado
- [ ] Banco Neon funcionando
- [ ] Teste local funcionando

### **Durante o Deploy:**
- [ ] Build não apresenta erros
- [ ] Variáveis de ambiente configuradas
- [ ] Logs não mostram erros críticos

### **Após o Deploy:**
- [ ] Site carrega na URL
- [ ] Todas as rotas funcionam
- [ ] Banco conecta corretamente
- [ ] Responsivo no mobile

## 📞 Suporte

Se ainda não funcionar:

1. **Verifique os logs** no painel do Vercel
2. **Teste localmente** primeiro
3. **Confirme o banco** Neon está ativo
4. **Verifique as variáveis** de ambiente

## 🎯 URLs Esperadas

Após deploy bem-sucedido:
- `https://seu-projeto.vercel.app/` → Dashboard
- `https://seu-projeto.vercel.app/membros` → Membros
- `https://seu-projeto.vercel.app/cadastrar-membro` → Cadastro
- `https://seu-projeto.vercel.app/relatorios` → Relatórios
- `https://seu-projeto.vercel.app/aniversarios` → Aniversários

---

**💡 Dica:** Se der erro, sempre verifique os logs no painel do Vercel primeiro!
