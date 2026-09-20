# EduAI

A full-stack educational assistant platform prototype built as a TypeScript monorepo.

The application combines authentication, classes, teacher-facing workflows, gamification, student experiences, and AI-oriented functionality in a single application architecture.

(note: this code is provided for portfolio review only. Please see the LICENSE file for restrictions on use.)

## Architecture

```text
                    ┌─────────────────┐
                    │    Next.js      │
                    │   Web Client    │
                    └────────┬────────┘
                             │
                       HTTP / WebSocket
                             │
                             ▼
                    ┌─────────────────┐
                    │     Express     │
                    │     Server      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │     Prisma      │
                    └─────────────────┘

                    ┌─────────────────┐
                    │ Shared Packages │
                    └─────────────────┘
```

The project is organized as a pnpm workspace:

```text
apps/
├── web/
└── server/

packages/
└── shared/
```

## Features

The prototype includes:

* User authentication
* Student workflows
* Teacher dashboard
* Classes
* Gamification
* Burnout-related functionality
* Seeded demonstration data
* Loading, error, and empty states
* WebSocket support
* Database persistence
* Shared TypeScript packages

## Tech Stack

### Web

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Zod

### Server

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL
* Better Auth
* WebSockets
* Zod

### Infrastructure

* Docker
* Docker Compose
* pnpm workspaces

## Project Structure

```text
.
├── apps/
│   ├── web/          # Next.js application
│   └── server/       # Express API
│
├── packages/
│   └── shared/       # Shared application code/types
│
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Development

### Prerequisites

* Node.js
* pnpm
* Docker

### Install dependencies

```bash
pnpm install
```

### Start the full development environment

```bash
pnpm dev
```

This starts the application services through Docker Compose.

Individual services can also be started independently:

```bash
pnpm dev:web
pnpm dev:server
pnpm dev:db
```

## Database

Prisma is used for database access and schema management.

Generate the Prisma client:

```bash
pnpm db:generate
```

Push the current schema:

```bash
pnpm db:push
```

Run migrations:

```bash
pnpm db:migrate
```

Open Prisma Studio:

```bash
pnpm db:studio
```

## Engineering Decisions

### Monorepo architecture

The application is split into independently developed web and server applications while allowing shared code to live in a workspace package.

This keeps the frontend and backend boundaries explicit without duplicating common types and utilities.

### Containerized development

PostgreSQL, the API, and the web application can be brought up together through Docker Compose.

The Compose configuration also includes a PostgreSQL healthcheck so dependent services can wait for the database to become available.

### Explicit application states

The frontend was developed with loading, error, and empty states rather than assuming every request succeeds.

This is particularly important for an application with authenticated, role-specific workflows.

## Development History

The application was developed incrementally:

1. Authentication
2. Core application functionality
3. Gamification and classes
4. Teacher dashboard and supporting workflows
5. UX polish, loading/error states, and authentication UX
6. Prototype completion

## Status

Prototype completed.

The repository represents an end-to-end application architecture rather than an isolated frontend demonstration, with the web client, API, database, authentication, shared packages, and containerized development environment working together.
