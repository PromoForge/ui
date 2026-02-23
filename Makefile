.PHONY: dev build check preview gen-api update-api format clean

dev:
	bun run dev

build:
	bun run build

check:
	bun run check

preview:
	bun run preview

gen-api:
	bunx openapi-typescript api/openapi/openapiv3.yaml -o src/lib/api/v1.d.ts

update-api:
	git submodule update --remote api
	$(MAKE) gen-api

format:
	bunx prettier --write src/

clean:
	rm -rf build node_modules .svelte-kit
