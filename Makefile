.PHONY: dev build check preview gen-api update-api format clean test-e2e test-e2e-up test-e2e-down

dev:
	bun run dev

build:
	bun run build

check:
	bun run check

preview:
	bun run preview

gen-api:
	bunx openapi-ts

update-api:
	git submodule update --remote api
	$(MAKE) gen-api

format:
	bunx prettier --write src/

clean:
	rm -rf build node_modules .svelte-kit

# E2E tests
test-e2e: test-e2e-down test-e2e-up
	bunx playwright test --config e2e/playwright.config.ts; \
	status=$$?; \
	$(MAKE) test-e2e-down; \
	exit $$status

test-e2e-up:
	cd e2e && docker compose up --build -d --wait

test-e2e-down:
	cd e2e && docker compose down -v
