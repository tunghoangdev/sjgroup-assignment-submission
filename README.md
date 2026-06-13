# SJ Group — Assignment: Location Management & Room Booking System

This project is a technical assessment integrating a **Location Management** system using a **Tree Hierarchy** structure and a **Meeting Room Booking** system.

The project is organized as a **Monorepo** consisting of two parts:

- **`api`** — NestJS service connected to a PostgreSQL database
- **`admin`** — Next.js frontend for administration and user interaction

---

## 🛠️ Tech Stack

### Backend (`/api`)

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM — uses Materialized Path strategy for tree structure management
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger (auto-generated API docs)
- **Package Manager**: Bun / npm

### Frontend (`/admin`)

- **Framework**: Next.js (App Router, Tailwind CSS)
- **State & Data Fetching**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (Radix UI)
- **Form Management**: React Hook Form + Zod
- **Package Manager**: Bun / npm

---

## 🚀 Getting Started (Local Setup)

**Prerequisites:** Node.js v18+ and a running PostgreSQL instance. [Bun](https://bun.sh) or npm are both supported.

### 1. Start the Backend (`/api`)

```bash
cd api
```