This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Skills Ativas (obrigatórias a cada prompt)

Este projeto usa skills instaladas globalmente em `~/.agents/skills/`. Antes de qualquer tarefa envolvendo código, carregue e aplique:

1. `typescript-best-practices` (`alleneubank/claude-code@typescript-best-practices`) — OBRIGATÓRIA para todo arquivo `.ts`, `.tsx`, `.js`, `tsconfig.json`.
   - Type-first: torne estados ilegais irrepresentáveis (unions discriminadas, branded types/`Opaque`, `as const`, check exaustivo com `never`).
   - Validação runtime com Zod como single source of truth (`z.infer<>`, `safeParse` para input de usuário, `parse` em trust boundaries).
   - Docs: https://skills.sh/alleneubank/claude-code/typescript-best-practices
2. `expo-react-native-typescript` (`mindrally/skills@expo-react-native-typescript`) — OBRIGATÓRIA para todo código Expo/React Native.
   - Functional/declarative, sem classes; componente exportado + subcomponents + helpers + types.
   - `interface` > `type`, sem `enum` (use maps), `strict mode` ligado, componentes funcionais com `interface` e named exports.
   - `SafeAreaProvider`/`SafeAreaView`, Flexbox + `useWindowDimensions`, dark mode `useColorScheme`, `expo-image` (WebP + lazy), `expo-constants` para env.
   - Erros no início com early return, Zod para validação, Jest + Testing Library para testes.
   - Docs: https://skills.sh/mindrally/skills/expo-react-native-typescript

Regra: se a tarefa tocar `.tsx` com React, aplique as duas em conjunto. Nunca use `any` explícito sem justificativa; prefira `unknown` + narrowing/Zod.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
