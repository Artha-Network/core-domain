# Core Domain Schema Reference

Defines Zod-based schema for:
- User
- Deal
- ResolveTicket

These models are the single source of truth for validation
across frontend, backend, and on-chain metadata.

## Schema Synchronization with Supabase

All core-domain models mirror the Supabase schema.

- UserSchema → users table
- DealSchema → deals table
- ResolveTicketSchema → resolve_tickets table

These ensure consistent data validation across backend and frontend.
