# Configuração do Google Calendar

Este documento explica como configurar a integração com o Google Calendar no projeto.

## Pré-requisitos

1. Conta Google (Gmail)
2. Acesso ao Google Cloud Console

## Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar projeto" no topo
3. Clique em "Novo Projeto"
4. Dê um nome ao projeto (ex: "Projeto Zero Calendar")
5. Clique em "Criar"

### 2. Habilitar Google Calendar API

1. No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
2. Procure por "Google Calendar API"
3. Clique em "Google Calendar API"
4. Clique em "Ativar"

### 3. Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em "APIs e Serviços" > "Tela de consentimento OAuth"
2. Selecione "Externo" (ou "Interno" se for apenas para sua organização)
3. Preencha as informações obrigatórias:
   - Nome do aplicativo
   - Email de suporte do usuário
   - Email de contato do desenvolvedor
4. Clique em "Salvar e continuar"
5. Na seção "Escopos", clique em "Adicionar ou remover escopos"
6. Selecione `https://www.googleapis.com/auth/calendar`
7. Clique em "Atualizar" e depois "Salvar e continuar"
8. Adicione usuários de teste (se necessário)
9. Clique em "Salvar e continuar" até finalizar

### 4. Criar Credenciais OAuth 2.0

1. No menu lateral, vá em "APIs e Serviços" > "Credenciais"
2. Clique em "Criar credenciais" > "ID do cliente OAuth"
3. Selecione "Aplicativo da Web"
4. Configure:
   - **Nome**: Nome da sua aplicação
   - **Origens JavaScript autorizadas**: 
     - `http://localhost:5173` (para desenvolvimento)
     - `http://localhost:3000` (se usar outra porta)
     - Seu domínio de produção (ex: `https://seu-dominio.com`)
   - **URIs de redirecionamento autorizados**:
     - `http://localhost:5173/app` (para desenvolvimento)
     - `http://localhost:3000/app` (se usar outra porta)
     - `https://seu-dominio.com/app` (produção)
5. Clique em "Criar"
6. **Copie o ID do Cliente** (você precisará dele)

### 5. Configurar Variáveis de Ambiente

1. Crie ou edite o arquivo `.env` na raiz do projeto
2. Adicione a seguinte linha:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

**Importante**: Substitua `seu-client-id-aqui` pelo ID do Cliente que você copiou no passo anterior.

### 6. Reiniciar o Servidor

Após adicionar a variável de ambiente, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Como Usar

1. Acesse o Dashboard (`/app`)
2. Na aba "Agenda", clique em "Conectar Google Calendar"
3. Você será redirecionado para a página de autenticação do Google
4. Faça login e autorize o acesso ao seu calendário
5. Você será redirecionado de volta para o Dashboard
6. Os eventos do Google Calendar aparecerão junto com os atendimentos

## Funcionalidades

- **Visualização**: Eventos do Google Calendar aparecem junto com os atendimentos na agenda diária e semanal
- **Sincronização**: Os eventos são buscados automaticamente quando você muda de data ou visualização
- **Desconexão**: Você pode desconectar a qualquer momento clicando em "Desconectar"

## Notas Importantes

- O token de acesso é armazenado no `localStorage` do navegador
- Para produção, considere implementar refresh tokens para manter a conexão ativa
- A integração atual é somente leitura (visualização de eventos)
- Para criar/editar eventos, será necessário implementar funções adicionais no serviço

## Troubleshooting

### Erro: "Configure VITE_GOOGLE_CLIENT_ID no arquivo .env"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se a variável está escrita corretamente
- Reinicie o servidor após adicionar a variável

### Erro: "redirect_uri_mismatch"
- Verifique se a URI de redirecionamento no Google Cloud Console está correta
- Deve ser exatamente: `http://localhost:5173/app` (ou a porta que você está usando)

### Eventos não aparecem
- Verifique se você está conectado ao Google Calendar
- Verifique se há eventos no período selecionado
- Verifique o console do navegador para erros

