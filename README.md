# Project Summary & Architecture: High-Concurrency Flash Sale Engine

## Overview

A distributed, multi-node cloud architecture designed to handle massive traffic spikes and limited inventory during flash sales.

### Objectives

- Process thousands of concurrent checkout requests.
- Prevent cascading system failures.
- Eliminate database connection exhaustion.
- Guarantee zero inventory overselling.

---

# Technology Stack

| Component | Technology |
|-----------|------------|
| Infrastructure | Docker Compose (isolated virtual network bridge) |
| Gateway / Load Balancer | Traefik |
| API & Workers | Node.js |
| Database | PostgreSQL |
| Cache & Queue | Redis + BullMQ |

---

# Architecture Flow

The system is organized into four logical tiers.

## 1. Ingestion Tier

- Traefik serves as the entry point.
- Terminates incoming traffic.
- Distributes requests using round-robin load balancing.
- Routes traffic across multiple stateless Node.js API containers.

---

## 2. Caching Tier (The Guard)

This layer protects downstream services from overload.

### Responsibilities

- Inventory validation
- Anti-spam protection
- Fast request rejection

### Redis Operations

- `DECRBY` for atomic inventory reservation
- `SADD` for duplicate/spam detection

### Behavior

- Reject requests immediately if inventory becomes negative.
- Reject repeated requests from the same user.
- Prevent unnecessary database traffic.

---

## 3. Queueing Tier (The Buffer)

Validated requests are asynchronously queued.

### Queue

- Redis-backed BullMQ

### Flow

1. API validates request.
2. Pushes a job into BullMQ.
3. Immediately returns:

```http
202 Accepted
```

```json
{
  "job_id": "job_123cd45",
  "status": "processing"
}
```

This frees API connections quickly and prevents blocking under heavy load.

---

## 4. Persistence Tier (The Workers)

Background workers consume jobs from BullMQ and persist orders.

### Database

- PostgreSQL

### Connection Strategy

- Strict connection pool limit:
  - **Maximum: 20 connections**

### Concurrency Strategy

Instead of optimistic locking with retries, workers rely entirely on PostgreSQL native atomic updates using row-level locks.

Benefits:

- No optimistic lock starvation
- No retry storms
- Safe concurrent order processing
- Zero overselling

---

# API Contracts

## Checkout

### Endpoint

```http
POST /api/checkout
```

### Request

```json
{
  "product_id": "UUID",
  "user_id": "UUID"
}
```

### Response

```http
202 Accepted
```

```json
{
  "job_id": "job_123cd45",
  "status": "processing"
}
```

---

## Order Status

### Endpoint

```http
GET /api/checkout/status/:job_id
```

### Response

```http
200 OK
```

```json
{
  "job_id": "job_123cd45",
  "status": "COMPLETED",
  "order_id": "UUID"
}
```

---

# Performance & Load Testing

The system was validated locally using **Artillery**.

## Test Configuration

- **Concurrent requests:** 10,000
- **Duration:** 10 seconds

## Results

| Metric | Result |
|---------|--------|
| Total Requests | 10,000 |
| Accepted Orders | 1000 |
| Rejected by Guard Layer | 9,000 |
| Overselling | 0 |
| Server Crashes | 0 |

---

# High-Level Architecture

```text
                 Clients
                    │
                    ▼
             ┌────────────┐
             │  Traefik   │
             └─────┬──────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
  Node API     Node API     Node API
      │            │            │
      └────────────┼────────────┘
                   ▼
          Redis Guard Layer
      (DECRBY + SADD Validation)
                   │
         Valid Requests Only
                   ▼
          BullMQ Message Queue
                   │
          Background Workers
                   │
         PostgreSQL (20 Pool)
                   │
                   ▼
             Orders Persisted
```

---

# Key Design Principles

- Stateless API services
- Horizontal scalability
- In-memory validation
- Asynchronous processing
- Limited database connections
- Native PostgreSQL concurrency control
- Zero inventory overselling
- Graceful handling of extreme traffic spikes