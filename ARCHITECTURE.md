# ARCHITECTURE.md

## Overview
**GivenNames** is an experimental app/toolset for collecting, processing, and filtering given names under multiple "not-so-obvious" criteria.  
This document describes the current architecture, data flow, requirements, testing approach, and roadmap.  

---

## Layers

### 1. Acquisition (Engines)
- Engines are responsible for **data acquisition**.  
- Example: `WikipediaCrawler` extracts names from Wikipedia/Wiktionary pages.  
- Other engines may acquire data from different sources (APIs, local files, etc.).  
- Engines inherit from `EngineBase`, which enforces a common contract (`runFromCLI`, config, logging).

### 2. Import
- Once data is acquired, it is passed through **importers**.  
- Importers clean, normalize, and persist data into the database.  
- Metadata is generated (locale, gender, source, etc.) to enrich the imported results.

### 3. Persistence (ORM)
- **GivenNamesORM** is responsible for writing and reading from the database.  
- The database schema supports clustering, metadata, and future semantic relations.  
- Persistence is isolated: other layers should not interact directly with the DB.

### 4. API Service
- Built on **Hono**, served via Node.  
- Exposes the data through a REST API.  
- Provides routes for authentication, user management, and querying names.  
- Can run in HTTP or HTTPS mode depending on configuration.

---

## Data Flow
1. **Seed input**: defined in config or seed files.  
2. **Crawler/Engine**: fetches documents, extracts candidate names.  
3. **Importer**: filters, normalizes, and stores names + metadata.  
4. **ORM**: persists results in the database.  
5. **API Service**: makes the data available to clients.  

---

## Requirements
- Node.js (v18+ recommended).  
- npm as package manager.  
- SQLite as the initial persistence layer.  
- Playwright for crawling, JSDOM for parsing.  

---

## Tests
- Current test suite uses **Jest** (migration to Vitest planned).  
- Tests include:
  - Unit tests for utilities.  
  - Integration tests for API routes.  
  - Crawler/importer tests (limited due to network dependencies).  
- End-to-end tests against live sources (e.g., Wikidata) are included but skipped by default to avoid slowing down the suite.

---

## Roadmap
- O Improve modularity of data acquisition and import pipelines  
- O Consolidate and simplify ORM initialization and usage  
- O Strengthen API coverage and documentation  
- O Prepare lightweight offline datasets for testing/demo  
- O Evolve engine contracts (`runFromCLI` → `run`) when stabilizing V6  

---

## History
- X Introduced unified crawler base (`CrawlerBase`) with browser management  
- X Added initial ORM integration with SQLite  
- X Implemented first API routes and middleware  
- X Created seed-based Wikipedia crawler as proof of concept  
