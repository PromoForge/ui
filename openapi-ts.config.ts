import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'api/openapi/openapiv3.yaml',
  output: {
    path: 'src/lib/api/generated',
    format: 'prettier',
  },
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@hey-api/client-fetch',
  ],
});
