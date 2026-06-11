import { z } from 'zod';
import { PivotAggEnum } from '#common/enums/chart/pivot-agg.enum';

export let zFileChartDataPivotValue = z
  .object({
    field: z.string().nullish(),
    field_line_num: z.number().nullish(),
    aggregate: z.enum(PivotAggEnum).nullish(),
    aggregate_line_num: z.number().nullish(),
    label: z.string().nullish(),
    label_line_num: z.number().nullish()
  })
  .meta({ id: 'FileChartDataPivotValue' });

export type FileChartDataPivotValue = z.infer<typeof zFileChartDataPivotValue>;
