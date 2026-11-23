<div align="center">

![Imgur](https://i.imgur.com/t7gxBC8.png)

**Dê o play, companheiro.**

<p>
  <img src="https://img.shields.io/badge/Expo-57-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-lightgrey?style=flat-square" alt="Plataformas" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="Licença MIT" />
</p>

</div>

---

## Sobre

**Luly** é um aplicativo de streaming que está em desenvolvimento, com a proposta de facilitar a busca e a organização de filmes. A ideia é permitir que os usuários assistam a filmes, explorem títulos e criem suas próprias listas de favoritos ou de filmes para assistir depois.

---

## Funcionalidades

- **Catálogo via API** — filmes, detalhes e busca vêm do backend; a tela inicial trata indisponibilidade da API com mensagem e opção de tentar novamente.
- **Busca e filtros** — tela de busca com filtro por gênero e ordenação por avaliação, recentes ou A–Z.
- **Adicionar a uma lista** — bottom sheet reutilizável na tela inicial e nos detalhes, com seleção de listas existentes e criação de nova lista.
- **Listas múltiplas** — cada filme pode estar em mais de uma lista; adicionar novamente é idempotente.
- **Filmes salvos** — grade com todos os títulos presentes em qualquer lista, além da visão de listas individuais.
- **Player customizado** — controles próprios sobre `expo-video`, incluindo progresso, seek por toque, avanço/retrocesso de 10s, velocidade `1x`/`1.5x`/`2x` e tela cheia.
- **Tema claro e escuro** — botão de alternância em todas as telas, com preferência persistida e paleta semântica compartilhada.

---

## Stack

| Camada                | Escolha                                                   |
| --------------------- | --------------------------------------------------------- |
| **Runtime**           | Expo SDK 57 · React Native 0.86 · React 19                |
| **Linguagem**         | TypeScript 6                                              |
| **Navegação**         | Expo Router com rotas tipadas e `NativeTabs`              |
| **UI**                | React Native `StyleSheet` · `expo-image` · Material Icons |
| **Tipografia**        | Nunito (`400`–`900`) via `@expo-google-fonts/nunito`      |
| **Persistência local** | `expo-sqlite` (API assíncrona) + migrations versionadas   |
| **Backend**           | Fastify 4 · Drizzle ORM · PostgreSQL (Neon ou local)      |
| **Playback**          | `expo-video`                                              |
| **Validação**         | Zod no app e no backend                                   |
| **Animação**          | React Native Reanimated + Worklets                        |
| **Web**               | React Native Web + Metro                                  |
| **Qualidade**         | ESLint + TypeScript                                       |

---

## Arquitetura

```text
.
├── src/                     # App Expo
│   ├── app/                 # Rotas do Expo Router
│   │   ├── index.tsx        # Entrada
│   │   ├── (tabs)/
│   │   │   ├── inicio.tsx   # Início
│   │   │   ├── buscar.tsx   # Busca
│   │   │   └── minha-lista.tsx
│   │   ├── movie/[id].tsx   # Detalhes do filme
│   │   ├── list/[id].tsx    # Conteúdo de uma lista
│   │   └── player/[id].tsx  # Player em tela cheia
│   ├── components/          # Componentes visuais e sheets/modais
│   ├── constants/           # Tema, tipografia e espaçamentos
│   ├── contexts/            # Tema e autenticação
│   ├── data/movies.ts       # Schemas Zod e tipos do catálogo
│   ├── db/                  # SQLite local
│   │   ├── client.ts        # Abertura do banco + usuário demo
│   │   ├── schema.ts        # DDL e versão do schema
│   │   └── repositories.ts  # Consultas e mutações por domínio
│   ├── hooks/               # Tema, color scheme e catálogo
│   ├── services/            # Cliente HTTP e adapter do catálogo
│   ├── utils/               # Navegação, formatação e feedback
│   └── config.ts            # Resolução da URL da API
├── backend/
│   ├── src/
│   │   ├── index.ts         # Fastify, plugins, rotas e health checks
│   │   ├── config/          # Validação do .env com Zod
│   │   ├── db/              # Client Drizzle, schema, migrate e seed
│   │   ├── middleware/      # Auth, erros e logging
│   │   ├── routes/          # auth, movies, lists, viewings e sync
│   │   ├── schemas/         # Schemas compartilhados
│   │   ├── services/        # Auth, catálogo e Drive
│   │   └── types/           # Tipos do backend
│   ├── drizzle/             # Arquivos SQL de migration
│   ├── scripts/             # Scripts auxiliares de banco
│   ├── drizzle.config.ts
│   └── .env.example
├── app.json                 # Configuração do Expo
├── package.json             # Dependências e scripts do app
└── tsconfig.json
```

---

## Dados e persistência

### SQLite (mobile)

O banco `luly.db` é criado por `src/db/client.ts` com:

- `PRAGMA journal_mode = WAL`;
- `PRAGMA foreign_keys = ON`;
- controle de versão por `PRAGMA user_version`;
- usuário demo fixo (`id = 1`), já que ainda não existe tela de login no app.

Tabelas:

| Tabela          | Função                                                   |
| --------------- | -------------------------------------------------------- |
| `usuarios`      | Usuário demo local do MVP                                |
| `filmes`        | Snapshot JSON do filme retornado pela API (id UUID)      |
| `listas`        | Listas criadas pelo usuário                              |
| `lista_filmes`  | Relação N:N entre listas e filmes                        |
| `visualizacoes` | Filmes iniciados/finalizados e nota do usuário           |


### PostgreSQL (backend)

O backend usa PostgreSQL via Drizzle ORM. Tabelas principais:

| Tabela                     | Função                                      |
| -------------------------- | ------------------------------------------- |
| `users`                    | Usuários e hash de senha                    |
| `movies`                   | Catálogo próprio, com link opcional do Drive |
| `lists`                    | Listas do usuário                           |
| `list_items`               | Relação N:N entre listas e filmes           |
| `viewings`                 | Histórico, finalização e nota               |
| `sync_state`               | Cursor de sincronização por usuário         |
| `outbox`                   | Auditoria de operações de sincronização     |
| `refresh_token_blocklist`  | Revogação de refresh tokens                 |

### Integração atual

- O app mobile consome do backend o catálogo (`GET /movies`) e os detalhes (`GET /movies/:id`).
- Listas, filmes salvos e visualizações permanecem no SQLite local.
- O backend registra as rotas nos prefixos `/auth`, `/movies`, `/lists`, `/viewings` e `/sync`; os health checks ficam na raiz (`/health` e `/health/ready`).
- O backend também expõe rotas de listas, visualizações e sincronização, mas o app mobile atual ainda não as utiliza.
- Em desenvolvimento, o CORS do backend aceita qualquer origem; em produção, a lista é restrita a `luly.app` e subdomínios.
- Sem filmes no banco, a API retorna catálogo vazio; o seed de desenvolvimento popula alguns exemplos.

---

## Como rodar

### Requisitos

| Item | Observação |
| --- | --- |
| **Node.js** | Compatível com React Native 0.86 (20.19.4+, 22.13+, 24.3+ ou 25+). |
| **npm** | O projeto usa `package-lock.json` na raiz e em `backend/`. |
| **Expo Go** | Precisa ser compatível com o SDK 57. |

### 1. Instalar as dependências

Na raiz do projeto:

```bash
npm install
```

Depois, no backend:

```bash
cd backend
npm install
```

### 2. Configurar o backend

Crie o arquivo `.env` a partir do exemplo:

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env` com os valores do seu ambiente.

#### Variáveis de ambiente

| Variável | Observação |
| --- | --- |
| `DATABASE_URL` | Connection string do PostgreSQL/Neon. |
| `JWT_SECRET` | Mínimo de 32 caracteres. Gere com `openssl rand -base64 32`. |


### 3. Iniciar o backend

Sempre execute os comandos do backend dentro da pasta `backend/`, porque o `.env` e o diretório `./drizzle` são resolvidos a partir do diretório atual.

```bash
cd backend
npm run dev
```

Saída esperada:

```text
🚀 Server running at http://0.0.0.0:3333
```

Para parar o servidor, use `Ctrl+C`.

### 4. Iniciar o Expo

Na raiz do projeto:

```bash
npm start
```

O comando executa `expo start` e sobe o Metro/Expo Dev Server. O terminal mostra o QR Code e o endereço do dev server.


### 5. Scripts


| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o Metro/Expo Dev Server para uso com Expo Go. |
| `npm run android` | Executa `expo run:android`; gera/builda o app nativo Android. Requer Android Studio/SDK. |
| `npm run ios` | Executa `expo run:ios`; gera/builda o app nativo iOS. Requer macOS/Xcode. |
| `npm run web` | Inicia a versão web com Metro. |
| `npm run lint` | Executa o ESLint do app. |
| `npm run dev` | Inicia o backend em modo watch com `tsx`. |


## Prints

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://i.imgur.com/Z9K0bDn.jpeg" width="400" height="700" />
      </td>
      <td align="center">
        <img src="https://i.imgur.com/twc6v6T.jpeg" width="400" height="700" />
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://i.imgur.com/rR9jShr.jpeg" width="400" height="700" />
      </td>
      <td>
        <img src="https://i.imgur.com/UObWyfh.jpeg" width="400" height="700" />
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://i.imgur.com/KgNh8Yq.jpeg" width="400" height="700" />
      </td>
      <td>
        <img src="https://i.imgur.com/MVEslIA.jpeg" width="400" height="700" />
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://i.imgur.com/bAqwAca.jpeg" width="400" height="700" />
      </td>
    </tr>
  </table>
</div>

---

<div align="center">

**Feito com Expo & React Native**

</div>
