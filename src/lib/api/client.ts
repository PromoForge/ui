import { client } from '@hey-api/client-fetch';
import { PUBLIC_API_URL } from '$env/static/public';

client.setConfig({
  baseUrl: PUBLIC_API_URL,
});

export { client };
