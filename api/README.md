# SJ Group Assignment — Location & Booking Management System

A room and meeting booking management system built with NestJS, TypeORM, and PostgreSQL.

## 📋 Key Features

- **Location Management**: Supports a self-referencing hierarchical tree structure (Building > Floor > Room > Other). Parent nodes cannot be deleted while child nodes exist.
- **Booking Validation Rules**:
  1. **Department match** — `booked_by` must match the room's `department`.
  2. **Capacity check** — `attendees` must not exceed the room's `capacity`.
  3. **Operating hours** — Booking time is validated against the room's `open_time`.
  4. **Overlap check** — No two bookings can occupy the same room in the same time slot.
- **Rejected Booking History**: All rejected booking attempts are persisted to the database with a `rejected` status and a corresponding `reject_reason`.
- **Infrastructure**: Centralized request logging, global error handling, and HTTP security hardening via Helmet.

---

## 🛠️ Prerequisites

- **Node.js**: `>= 20.x`
- **PostgreSQL**: `>= 14.x` (or via Docker)

---

## 🚀 Setup Guide

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your PostgreSQL connection details:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=sj_assignment
```

> **Note:** Make sure the `sj_assignment` database exists in your PostgreSQL instance before starting the application.

### 3. Seed sample data

```bash
npm run seed
```

### 4. Run the application

Development mode:

```bash
npm run start:dev
```

Production build & run:

```bash
npm run build
npm run start:prod
```

### 5. Run tests

End-to-end tests:

```bash
npm run test:e2e
```

---

## 📖 API Documentation (Swagger)

Interactive API documentation is available via Swagger UI:

- Default URL: `http://localhost:3000/docs`

---

## 🔗 API Reference

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/locations` | Create a new location (Building, Floor, Room, Other) |
| `GET` | `/api/locations` | Retrieve the full location tree |
| `GET` | `/api/locations/:id` | Get location details with its direct children |
| `PATCH` | `/api/locations/:id` | Update location information |
| `DELETE` | `/api/locations/:id` | Delete a location (only allowed if it has no children) |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create a booking (triggers the full validation pipeline) |
| `GET` | `/api/bookings` | List all bookings (supports filtering by `locationId`) |
| `GET` | `/api/bookings/:id` | Get booking details |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel a booking |

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/departments` | List all departments |

---

## 🧪 Postman Collection

A ready-to-use Postman collection is included for quick API testing.

**File:** `SJ_Group_Assignment.postman_collection.json`

### Import instructions

1. Open **Postman**.
2. Click **Import** (top-left).
3. Select the file `SJ_Group_Assignment.postman_collection.json` from the project root.
4. All requests will be available under the **SJ Group Assignment** collection.

### Collection variables

| Variable | Default value | Description |
|----------|--------------|-------------|
| `baseUrl` | `http://localhost:3000` | API base URL |

> Update `baseUrl` in the collection variables if your server runs on a different host or port.