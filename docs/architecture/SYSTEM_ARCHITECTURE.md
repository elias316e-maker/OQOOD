# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API
# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

S# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI# OQOOD System Architecture

Version: 1.0

Status: Draft

---

# 1. Purpose

This document defines the official software architecture of the OQOOD Platform.

It establishes the architectural principles, system layers, responsibilities, and interactions that all engineering work must follow.

---

# 2. Architecture Principles

- Modular
- Enterprise Ready
- Cloud Native
- API First
- Security by Design
- AI Ready
- Multi-Tenant
- Event Driven
- Highly Maintainable

---

# 3. High-Level Architecture

```
                    Users
                      │
                      ▼
           Next.js Web Platform
                      │
                      ▼
          Server Actions / REST APIs
                      │
                      ▼
              Business Services
                      │
                      ▼
              Repository Layer
                      │
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# 4. System Layers

## Presentation Layer

Responsibilities

- User Interface
- Forms
- Validation Feedback
- Dashboards
- Navigation

Technology

- Next.js
- React
- TypeScript

---

## Application Layer

Responsibilities

- Server Actions
- REST APIs
- Authentication
- Authorization

---

## Business Layer

Responsibilities

- Business Rules
- Workflows
- Validation
- Transactions

Examples

Opportunity Service

Project Service

Supplier Service

Contract Service

---

## Repository Layer

Responsibilities

- Database Access

No business rules.

Only persistence.

---

## Database Layer

Responsibilities

- Store Data
- Indexes
- Constraints
- Transactions

Technology

PostgreSQL

---

# 5. Multi-Tenant Architecture

Each company owns its own Workspace.

Workspace

↓

Projects

↓

Users

↓

Suppliers

↓

RFQs

↓

Contracts

↓

Documents

↓

Audit Logs

Every business record belongs to one Workspace.

Data isolation is mandatory.

---

# 6. Folder Structure

apps/

platform/

admin/

supplier/

packages/

database/

ui/

auth/

types/

notifications/

workflow/

ai/

docs/

---

# 7. Backend Structure

src/

app/

components/

lib/

server/

repositories/

services/

actions/

validations/

types/

---

# 8. Data Flow

User

↓

Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database

---

# 9. Error Flow

Database Error

↓

Repository

↓

Service

↓

API

↓

UI

↓

User Friendly Message

---

# 10. Authentication

Better Auth

Session Based

RBAC

Workspace Isolation

---

# 11. Authorization

Permission Based

Role Based

Workspace Based

---

# 12. Logging

Every important action generates an Audit Log.

Examples

Opportunity Created

Supplier Invited

Offer Submitted

Award Approved

Contract Signed

---

# 13. Storage

Cloud Object Storage

Documents

Drawings

Contracts

BOQ Attachments

Images

Certificates

---

# 14. Notifications

Email

In-App

WhatsApp (Future)

SMS (Future)

---

# 15. AI Layer

AI Assistant

RFQ Generation

Supplier Recommendation

Offer Analysis

Contract Review

Risk Detection

Knowledge Search

---

# 16. Integrations

SAP

Oracle

Microsoft

Qiwa

Nafath

ZATCA

Muqawil

---

# 17. Deployment

Frontend

Vercel

Database

PostgreSQL

Storage

Cloud Object Storage

Monitoring

Sentry

Analytics

PostHog

---

# 18. Scalability Goals

100,000 Companies

5,000,000 Opportunities

100,000,000 Documents

Enterprise Ready

---

# 19. Architecture Rule

No UI component accesses Prisma directly.

All database operations must pass through:

Repository

↓

Service

↓

Action/API

↓

UI
