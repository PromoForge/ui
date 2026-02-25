import type { Application } from "$lib/api/generated/types.gen";

export type Environment = NonNullable<Application["environment"]>;
