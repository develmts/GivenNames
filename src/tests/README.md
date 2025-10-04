# Jest Tests for GivenNames

This folder contains **unit and integration tests** for the GivenNames modules, written with [Jest](https://jestjs.io/) and [supertest](https://github.com/visionmedia/supertest).

## 📂 Structure

```
src/tests/
├── auth/
│   ├── AuthService.test.ts           # Unit tests for AuthService
│   ├── routesAuth.unit.test.ts       # Routes /auth/* with mocks
│   ├── routesAuth.int.test.ts        # Integration tests against the server
├── users/
│   ├── UserService.test.ts           # Unit tests for UserService
│   ├── routesUsers.unit.test.ts      # Routes /users/* with mocks
│   ├── routesUsers.int.test.ts       # Integration tests against the server
├── middleware/
│   ├── reqLogger.test.ts             # Tests for request logging middleware
│   ├── errorHandler.test.ts          # Tests for error handling middleware
├── utils/
│   ├── makeError.test.ts             # Tests for HttpErrors.makeError helper
├── crawler/
│   └── Crawler.test.ts               # Tests for crawler logic
├── importer/
│   └── Importer.test.ts              # Tests for importer logic
├── sem/
│   └── semImport.test.ts             # Tests for semantic importer
├── utils-core/
│   ├── config.test.ts                # [TODO] Config loader tests
│   ├── logger.test.ts                # [TODO] Logger child tags
│   ├── seedClusters.test.ts          # [TODO] Seeding clusters tests
│   ├── slug.test.ts                  # [TODO] Slug generator tests
```

## 🚀 Setup

Install required dev dependencies:

```bash
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

Initialize Jest for TypeScript:

```bash
npx ts-jest config:init
```

This will generate a `jest.config.js`.

## ▶️ Running tests

From the project root:

```bash
npm test
```

or explicitly with Jest:

```bash
npx jest src/tests --runInBand
```

## 🧪 Notes

- **Unit tests** mock services (`jest.mock`) to isolate logic.  
- **Integration tests** spin up the Hono server in memory and issue real HTTP requests with `supertest`.  
- To run only integration tests:  

  ```bash
  npx jest src/tests --testPathPattern=int
  ```

- To run only unit tests:  

  ```bash
  npx jest src/tests --testPathPattern=unit
  ```

- Some files in `utils-core/` are **placeholders (`it.todo`)** and need proper test implementation later.
