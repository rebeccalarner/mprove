import { z } from 'zod';

export let zSelectedGiven = z
  .object({
    givenId: z.string(),
    values: z.array(z.string())
  })
  .meta({ id: 'SelectedGiven' });

export type SelectedGiven = z.infer<typeof zSelectedGiven>;
