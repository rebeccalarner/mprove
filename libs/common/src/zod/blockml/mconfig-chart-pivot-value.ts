import { z } from 'zod';
import { PivotAggEnum } from '#common/enums/chart/pivot-agg.enum';

export let zMconfigChartPivotValue = z
  .object({
    field: z.string(),
    aggFunc: z.enum(PivotAggEnum),
    label: z.string().nullish()
  })
  .meta({ id: 'MconfigChartPivotValue' });

export type MconfigChartPivotValue = z.infer<typeof zMconfigChartPivotValue>;
