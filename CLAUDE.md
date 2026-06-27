# Projeto: [Hub Request Plan api + front]

## Visão geral
Esse é um projeto nextjs fullstack, vamos precisar dividir o front do backend, vamos começar criando a API separada na pasta, o projeto agora será um monorepo com build independente 

- A api será desenvolvida dentro da pasta : C:\Users\wagner.gomes\RequestHub-api-front\API e deveser totalmente independente, inclusive o build.

## Stack
- APIREST
- TypeScript
- Prisma ORM (com POSTGRES)
- Zod (para validação de todos os dados trafegados)
- BetterAuth para autenticação
- resend para envio de emails
- Docker (Dokcer file da aplicação)

## Estrutura da API 

- dentro da pasta src vamos trabalhar com os seguintes módulos:
    - Routes
    - Controllers
    - Services
    - Pasta lib

Todas a entradas e retornos devem  ser tipadas e validadas com zod


## Atenticação

- Segue abaixo o retorno sobre as alterações de autenticação de deverá ser feita na API :

![alt text](image.png)


## Observabilidade

- Sobre observabilidade, segue os popntos que precisamos ajustar na nova API:
![alt text](image-1.png)

- Sobre observabilidade, vamos descartar tudo que foi feito na API anterior e refazer do zero.

- Para observabilidade , vamos usar Grafana, vamos discutir esse ponto.


## Comandos
- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run test` — testes

## Convenções de código
- Componentes em PascalCase, arquivos kebab-case
- Server Components por padrão; usar `"use client"` só quando necessário
- Imports absolutos com alias `@/`
- Sempre tipar retornos de funções exportadas
- Não usar `any`

## Workflow
- Branch principal: `main`
- Sempre criar branch para features: `feat/nome-da-feature`
- Commits no padrão Conventional Commits (`feat:`, `fix:`, `chore:`)

## Regras importantes para o Claude
- NÃO commitar arquivos `.env*` (já estão no `.gitignore`)
- Sempre que criar uma rota nova, adicionar tipagem nos params/searchParams
- Preferir editar arquivos existentes a criar novos
- Se uma tarefa não estiver clara, perguntar antes de codar
- Sempre inserir paginação nas rotas
## Paginas da aplicação
