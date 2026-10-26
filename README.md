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

- **Adicionar a uma lista** — bottom sheet reutilizável na tela inicial e nos detalhes, com seleção de listas existentes e criação de nova lista.
- **Listas múltiplas** — cada filme pode estar em mais de uma lista; adicionar novamente é idempotente.
- **Filmes salvos** — grade com todos os títulos presentes em qualquer lista, além da visão de listas individuais.
- **Player customizado** — controles próprios sobre `expo-video`, incluindo progresso, seek por toque, velocidade `1x`/`1.5x`/`2x` e tela cheia.
- **A seguir na Luly** — troca direta para o próximo filme do catálogo sem sair do player.

---

## Stack

| Camada           | Escolha                                                   |
| ---------------- | --------------------------------------------------------- |
| **Runtime**      | Expo SDK 57 · React Native 0.86 · React 19                |
| **Linguagem**    | TypeScript 6                                              |
| **Navegação**    | Expo Router com rotas tipadas e `NativeTabs`              |
| **UI**           | React Native `StyleSheet` · `expo-image` · Material Icons |
| **Tipografia**   | Nunito (`400`–`900`) via `@expo-google-fonts/nunito`      |
| **Persistência** | `expo-sqlite` (API assíncrona) + migrations versionadas   |
| **Playback**     | `expo-video`                                              |
| **Validação**    | Zod                                                       |
| **Animação**     | React Native Reanimated + Worklets                        |
| **Web**          | React Native Web + Metro                                  |
| **Qualidade**    | ESLint + TypeScript                                       |

---

## Arquitetura

```text
src/
├── app/                     # Rotas do Expo Router
│   ├── index.tsx            # Entrada
│   ├── (tabs)/
│   │   ├── inicio.tsx       # Início
│   │   └── minha-lista.tsx  # Listas
│   ├── movie/[id].tsx       # Detalhes do filme
│   ├── list/[id].tsx        # Conteúdo de uma lista
│   └── player/[id].tsx      # Player em tela cheia
├── components/              # Componentes visuais e sheets/modais
├── constants/theme.ts       # Paleta Brand e espaçamentos
├── constants/typography.ts  # Famílias e escala tipográfica Nunito
├── data/movies.ts           # Catálogo mock validado com Zod
├── db/
│   ├── client.ts            # Abertura do banco + usuário demo
│   ├── schema.ts            # DDL e versão do schema
│   └── repositories.ts      # Consultas e mutações por domínio
├── hooks/                   # Tema e color scheme
└── utils/                   # Navegação, formatação e feedback
```

---

## Dados e persistência

### SQLite

O banco `luly.db` é criado por `src/db/client.ts` com:

- `PRAGMA journal_mode = WAL`;
- `PRAGMA foreign_keys = ON`;
- controle de versão por `PRAGMA user_version`;
- usuário demo fixo (`id = 1`), já que ainda não existe login.

Tabelas:

| Tabela          | Função                                         |
| --------------- | ---------------------------------------------- |
| `usuarios`      | Usuário demo do MVP                            |
| `filmes`        | Metadados mínimos para integridade referencial |
| `listas`        | Listas criadas pelo usuário                    |
| `lista_filmes`  | Relação N:N entre listas e filmes              |
| `visualizacoes` | Filmes iniciados/finalizados e nota do usuário |

---

## Como rodar

### Requisitos

- **Node.js** compatível com React Native 0.86 (20.19.4+, 22.13+, 24.3+ ou 25+).
- **npm** (o projeto usa `package-lock.json`).
- **Expo Go** no celular.

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
```

### Scripts

| Comando           | Descrição                            |
| ----------------- | ------------------------------------ |
| `npm start`       | Inicia o servidor de desenvolvimento |
| `npm run android` | Abre no Android                      |
| `npm run ios`     | Abre no iOS                          |
| `npm run web`     | Abre a versão web                    |

---

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
