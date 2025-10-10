# 🚀 Deploy no Vercel - CEPPEMBU

## 📋 Pré-requisitos

1. **Conta no Vercel** - [vercel.com](https://vercel.com)
2. **Conta no Neon** - [neon.tech](https://neon.tech)
3. **Repositório no GitHub** - ✅ Já configurado

## 🔧 Configuração

### 1. **Variáveis de Ambiente**

No painel do Vercel, adicione as seguintes variáveis:

```bash
DATABASE_URL=postgresql://usuario:senha@host:porta/database
NODE_ENV=production
```

### 2. **Importar Projeto**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Conecte sua conta do GitHub
4. Selecione o repositório **"Gest-o-de-Membros"**
5. Clique em **"Import"**

### 3. **Configurações do Deploy**

- **Framework Preset:** Other
- **Root Directory:** `.` (raiz do projeto)
- **Build Command:** `npm install`
- **Output Directory:** `.` (não necessário para Node.js)

## 🎯 URLs do Sistema

Após o deploy, seu sistema estará disponível em:

- **Dashboard:** `https://seu-projeto.vercel.app/`
- **Cadastrar Membro:** `https://seu-projeto.vercel.app/cadastrar-membro`
- **Membros:** `https://seu-projeto.vercel.app/membros`
- **Relatórios:** `https://seu-projeto.vercel.app/relatorios`
- **Aniversários:** `https://seu-projeto.vercel.app/aniversarios`

## 🔒 Segurança

O sistema já inclui:
- ✅ **Helmet.js** - Headers de segurança
- ✅ **CORS** configurado
- ✅ **Rate Limiting** ativo
- ✅ **Content Security Policy** configurado

## 📱 Recursos

- ✅ **Responsivo** - Funciona em mobile e desktop
- ✅ **PWA Ready** - Pode ser instalado como app
- ✅ **SEO Otimizado** - Meta tags configuradas
- ✅ **Favicon** - Logo da igreja como ícone

## 🎨 Branding

- **Logo:** `logo.jpg` (favicon automático)
- **Cores:** Marrom e dourado (tema da igreja)
- **Fonte:** Font Awesome icons
- **Gráficos:** Chart.js modernos

## 🚀 Deploy Automático

Após configurar, cada push para `main` fará deploy automático!

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs no painel do Vercel
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro

---

**CEPPEMBU - Comunidade Evangélica Príncipe da Paz** 🕊️
