# App de Entregas — Coletivo de Entregadores

Aplicativo full-stack para controle simples de entregas de bicicleta/moto, voltado para coletivos de entregadores. Construído com [Nuxt 4](https://nuxt.com) + [Nuxt UI](https://ui.nuxt.com).

## Stack

- **Framework:** Nuxt 4.6 + Vue 3 + TypeScript
- **UI:** Nuxt UI 4.12 (componentes prontos, tema personalizável)
- **Banco de dados:** SQLite nativo do Node.js (`node:sqlite`) — leve, sem dependências nativas extras
- **Autenticação:** sessões criptografadas em cookie + senhas com `bcryptjs`
- **Geocodificação:** Nominatim (OpenStreetMap) + distância por fórmula de Haversine

## Funcionalidades

- Primeira execução configura o coletivo, escolhe cores e cria o usuário administrador.
- Dois perfis: **admin** (gerencia entregadores, configurações e entregas) e **entregador** (aceita/executa entregas).
- Cores do coletivo definem o tema da aplicação em tempo real.
- Cálculo automático do valor da entrega por distância e categoria de volume.
- Taxa da plataforma (coletivo) adicionada ao valor cobrado do cliente.
- Controle de raio de entrega a partir do endereço-base do coletivo.
- Fluxo de status: pendente → atribuída → em andamento → entregue.
- Visão de ganhos para o entregador.

## Regras de negócio

### Preço da entrega

```
preço = (preço base + distância km × preço por km) × fator de volume
valor cliente = preço + taxa da plataforma
```

- **Preço base:** valor fixo configurado pelo admin.
- **Preço por km:** multiplicador configurado pelo admin.
- **Categorias de volume:** cada categoria tem um fator que aumenta/diminui o preço (ex.: pequeno = 1, médio = 1.5, grande = 2).
- **Taxa da plataforma:** pode ser percentual sobre o preço ou valor fixo, configurável pelo admin.

### Raio de entrega

O endereço de destino é geocodificado e só é aceito se estiver dentro do raio máximo configurado a partir do endereço-base do coletivo.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz (opcional em desenvolvimento):

```env
# Banco de dados (caminho local; o prefixo file: é opcional)
NUXT_DATABASE_URL=file:server/database.sqlite

# Segredo da sessão (mínimo 32 caracteres)
NUXT_SESSION_PASSWORD=uma-senha-forte-e-longa-de-pelo-menos-32-caracteres
```

> Em desenvolvimento, o Nuxt usa uma senha padrão de sessão se `NUXT_SESSION_PASSWORD` não for definida. **Nunca use o padrão em produção.**

## Primeiros passos

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Acesse `http://localhost:3000`. Na primeira vez, o sistema pede:

1. Nome do coletivo
2. Cores do tema (primária e neutra)
3. Dados do administrador (nome, e-mail e senha)

Após o setup, faça login com o admin para cadastrar entregadores e configurar preços.

## Scripts úteis

```bash
pnpm dev      # servidor de desenvolvimento
pnpm build    # build para produção
pnpm preview  # preview do build de produção
pnpm lint     # lint com ESLint
pnpm typecheck # checagem de tipos TypeScript
```

## Estrutura de pastas relevante

- `app/pages/` — páginas (setup, login, admin, entregador)
- `app/composables/` — `useAuth.ts`, `useCollective.ts`
- `app/middleware/` — controle de acesso e setup
- `app/plugins/theme.client.ts` — aplica as cores do coletivo no cliente
- `server/utils/db.ts` — conexão libsql, migrations e mapeadores
- `server/utils/auth.ts` — sessões e guards de perfil
- `server/utils/pricing.ts` — cálculo de preço e taxa
- `server/utils/geocode.ts` — geocodificação e distância
- `server/api/` — endpoints da API

## Produção

1. Defina `NUXT_DATABASE_URL` para o caminho do SQLite (ex.: `file:server/database.sqlite`).
2. Defina `NUXT_SESSION_PASSWORD` com pelo menos 32 caracteres.
3. Execute `pnpm build` e inicie o processo com `node .output/server/index.mjs`.

Consulte a [documentação de deploy do Nuxt](https://nuxt.com/docs/getting-started/deployment) para mais detalhes.
