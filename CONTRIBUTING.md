# Contributing

Thank you for contributing.

## General Style
- Prefer the `@/…` alias according to `tsconfig.json` instead of deep relative paths.
- Add or update tests when changing non-trivial logic.
- Update user-facing docs when behavior changes (README / DOCUMENT).

## Pull Request Flow
1. Create a descriptive branch.
2. Open a concise PR using the template.
3. Ensure `npm test` passes locally.
4. Request review and address feedback.

## Commit Messages
- Use clear, action-oriented messages.
- Example prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Coding Guidelines
- TypeScript preferred for new modules.
- Keep functions cohesive and small; avoid unnecessary coupling.
- Log sensibly; do not commit secrets or credentials.

## Tests
- Place unit/integration/e2e tests under `src/tests/` following existing patterns.
- Aim for fast and deterministic tests; skip network-heavy cases by default and document how to run them.

## Security
- Do not include secrets in code or PR descriptions.
- Report sensitive issues privately if applicable.

## Communication
- Document assumptions and limitations in the PR.
- If something is unclear, state it explicitly rather than guessing.
