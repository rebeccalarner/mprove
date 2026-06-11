import { ChartTypeEnum } from '#common/enums/chart/chart-type.enum';

export const UI_CHART_TYPES = {
  //
  // data
  //
  sizeField: [ChartTypeEnum.Scatter],
  xField: [
    ChartTypeEnum.Line,
    ChartTypeEnum.Bar,
    ChartTypeEnum.Scatter,
    ChartTypeEnum.Pie
  ],
  yField: [ChartTypeEnum.Pie, ChartTypeEnum.Single],
  yFields: [ChartTypeEnum.Line, ChartTypeEnum.Bar, ChartTypeEnum.Scatter],
  nullableMultiField: [ChartTypeEnum.Scatter],
  multiField: [ChartTypeEnum.Line, ChartTypeEnum.Bar, ChartTypeEnum.Scatter],
  pivotRows: [ChartTypeEnum.PivotTable],
  pivotColumns: [ChartTypeEnum.PivotTable],
  pivotValues: [ChartTypeEnum.PivotTable],
  //
  // options
  //
  format: [ChartTypeEnum.Table, ChartTypeEnum.PivotTable],
  pivot: [ChartTypeEnum.PivotTable],
  xAxisGroup: [ChartTypeEnum.Line, ChartTypeEnum.Bar, ChartTypeEnum.Scatter],
  xAxis: {
    scale: [ChartTypeEnum.Line, ChartTypeEnum.Bar, ChartTypeEnum.Scatter]
  },
  yAxisGroup: [ChartTypeEnum.Line, ChartTypeEnum.Bar, ChartTypeEnum.Scatter],
  yAxis: {
    scale: [ChartTypeEnum.Line, ChartTypeEnum.Bar, ChartTypeEnum.Scatter]
  },
  seriesGroup: [
    ChartTypeEnum.Line,
    ChartTypeEnum.Bar,
    ChartTypeEnum.Scatter,
    ChartTypeEnum.Pie
  ]
};
