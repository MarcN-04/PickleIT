---
name: docker-workflow
description: Use this skill before running any install, test, lint, or dev command in PickleIT. All commands must go through Docker — never run npm or node directly on the host.
---
## Rules
- Dev server: docker compose up
- Run tests: docker compose run --rm app npm test
- Watch mode: docker compose run --rm app npm run test:watch
- Lint: docker compose run --rm app npm run lint
- Install a package: docker compose run --rm app npm install <package>
- Rebuild after package.json changes: docker compose build
- Run a single test: docker compose run --rm app npm test -- -t "test name"

node_modules lives in a named Docker volume — never written to the host.
The dev server runs on port 3001 inside the container but maps to port 3000 on the host.
