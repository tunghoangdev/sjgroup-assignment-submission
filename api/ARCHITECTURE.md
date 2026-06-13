# System Architecture Document

The system follows a **Monolithic** architecture built on the NestJS framework, using TypeORM to communicate with PostgreSQL.

## 1. Module Structure

```mermaid
graph TD
    AppModule --> ConfigModule
    AppModule --> TypeOrmModule
    AppModule --> LocationsModule
    AppModule --> BookingsModule
    
    BookingsModule --> LocationsModule
```

- **AppModule**: Bootstraps the application and loads all global configuration modules.
- **LocationsModule**: Manages location nodes (Building, Floor, Room, Other) organized as a hierarchical tree.
- **BookingsModule**: Handles room booking requests and enforces all business constraint validations.

## 2. Database Design

```mermaid
erDiagram
    locations {
        uuid id PK
        uuid parent_id FK
        varchar name
        varchar location_number UK
        varchar building
        varchar department
        integer capacity
        varchar open_time
        enum type
        timestamp created_at
        timestamp updated_at
    }
    bookings {
        uuid id PK
        uuid location_id FK
        varchar booked_by
        integer attendees
        timestamp start_time
        timestamp end_time
        enum status
        varchar reject_reason
        timestamp created_at
    }
    
    locations ||--o{ locations : "parent-children"
    locations ||--o{ bookings : "has"
```

## 3. Booking Validation Pipeline

When a new booking request is received (`POST /bookings`), the following validation pipeline is executed:

```mermaid
graph TD
    Start[Receive POST /bookings] --> DTO[ValidationPipe: Validate request payload]
    DTO --> FindLoc[Find Location by ID]
    FindLoc --> IsRoom{Is location type a Room?}
    IsRoom -- No --> RejectRoom[Reject: Location is not a Room]
    IsRoom -- Yes --> DeptCheck{Department match?}
    
    DeptCheck -- No --> RejectDept[Reject: Department mismatch]
    DeptCheck -- Yes --> CapCheck{Attendees <= Capacity?}
    
    CapCheck -- No --> RejectCap[Reject: Exceeds room capacity]
    CapCheck -- Yes --> TimeCheck{Within open hours?}
    
    TimeCheck -- No --> RejectTime[Reject: Outside operating hours]
    TimeCheck -- Yes --> OverlapCheck{Conflicts with existing booking?}
    
    OverlapCheck -- Yes --> RejectOverlap[Reject: Booking conflict]
    OverlapCheck -- No --> Confirm[Confirm: Save booking with status = confirmed]
    
    RejectRoom --> SaveReject[Save booking with status = rejected + reason]
    RejectDept --> SaveReject
    RejectCap --> SaveReject
    RejectTime --> SaveReject
    RejectOverlap --> SaveReject
    
    SaveReject --> Response400[Return HTTP 400]
    Confirm --> Response201[Return HTTP 201]
```