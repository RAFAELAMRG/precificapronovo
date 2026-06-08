# Guia de Configuração e Execução — PrecificaPro

Este documento contém todas as instruções necessárias para instalar, configurar e rodar o PrecificaPro em sua máquina local.

---

## Estrutura do Projeto

O projeto está organizado conforme solicitado:
* `/frontend`: Aplicação React + Vite + TailwindCSS v4 + Recharts.
* `/backend`: Servidor REST Node.js + Express + Prisma ORM.
* `/database`: Pasta para organização do Schema Prisma e scripts de persistência.
* `/docs`: Documentações técnicas.

---

## Credenciais para Testes / Demonstração

O banco de dados foi pré-povoado com os seguintes acessos rápidos:

### 1. Perfil Cliente (Vendedor)
* **E-mail:** `joao@vendedor.com`
* **Senha:** `cliente`

### 2. Perfil Administrador Master (SaaS Admin)
* **E-mail:** `admin@precificacao.com`
* **Senha:** `admin`

---

## Como Executar o Sistema

Como o Node.js portátil está instalado localmente na pasta `bin/node/`, você deve usar os seguintes comandos do PowerShell a partir da pasta raiz do projeto (`C:\Users\Pichau\.gemini\antigravity\scratch\marketplace-pricing-saas`):

### 1. Iniciar o Backend (Porta 5000)
Abra uma janela do PowerShell e execute:
```powershell
# Definir o Path local para carregar o Node portátil do projeto
$env:Path = "C:\Users\Pichau\.gemini\antigravity\scratch\marketplace-pricing-saas\bin\node;" + $env:Path

# Acessar a pasta do backend
cd backend

# Iniciar o servidor de desenvolvimento
..\bin\node\npm.cmd run dev
```

O servidor backend estará disponível em: [http://localhost:5000](http://localhost:5000).
Você pode verificar a saúde da API acessando: [http://localhost:5000/api/health](http://localhost:5000/api/health).

### 2. Iniciar o Frontend (Porta 5173 / Vite)
Abra uma segunda janela do PowerShell e execute:
```powershell
# Definir o Path local para carregar o Node portátil do projeto
$env:Path = "C:\Users\Pichau\.gemini\antigravity\scratch\marketplace-pricing-saas\bin\node;" + $env:Path

# Acessar a pasta do frontend
cd frontend

# Iniciar o servidor Vite
..\bin\node\npm.cmd run dev
```

A interface web premium estará disponível em: [http://localhost:5173](http://localhost:5173).

---

## Transição para Banco de Dados PostgreSQL (Produção)

O sistema foi desenvolvido utilizando o **Prisma ORM**, o que torna a transição de banco extremamente simples. Para migrar do SQLite local para um banco PostgreSQL real:

1. **Alterar o arquivo do Schema:**
   Abra `backend/prisma/schema.prisma` e ajuste o bloco `datasource db`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Atualizar a Variável de Conexão:**
   Abra `backend/.env` e substitua a linha da `DATABASE_URL` pela string de conexão do seu PostgreSQL:
   ```env
   DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_BANCO?schema=public"
   ```
3. **Executar a Migração no PostgreSQL:**
   Com o servidor PostgreSQL online, execute o comando de sincronização no PowerShell:
   ```powershell
   $env:Path = "C:\Users\Pichau\.gemini\antigravity\scratch\marketplace-pricing-saas\bin\node;" + $env:Path
   cd backend
   ..\bin\node\npx.cmd prisma migrate dev --name init
   ..\bin\node\npx.cmd prisma db seed
   ```

Isso criará todas as tabelas (companies, users, subscriptions, products, alerts) com os índices de forma 100% automatizada e inserirá os usuários de teste no banco PostgreSQL.
