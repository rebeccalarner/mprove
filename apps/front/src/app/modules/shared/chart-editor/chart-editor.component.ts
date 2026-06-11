import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DEFAULT_CHART_Y_AXIS } from '#common/constants/mconfig-chart';
import {
  EMPTY_MCONFIG_FIELD,
  FORMAT_NUMBER_EXAMPLES
} from '#common/constants/top-front';
import { UI_CHART_TYPES } from '#common/constants/ui-chart-types';
import { ChangeTypeEnum } from '#common/enums/change-type.enum';
import { ChartTypeEnum } from '#common/enums/chart/chart-type.enum';
import { PivotAggEnum } from '#common/enums/chart/pivot-agg.enum';
import { FieldClassEnum } from '#common/enums/field-class.enum';
import { FieldResultEnum } from '#common/enums/field-result.enum';
import { ModelTypeEnum } from '#common/enums/model-type.enum';
import { QueryOperationTypeEnum } from '#common/enums/query-operation-type.enum';
import { isDefined } from '#common/functions/is-defined';
import { isUndefined } from '#common/functions/is-undefined';
import { makeCopy } from '#common/functions/make-copy';
import { setChartSeries } from '#common/functions/set-chart-series';
import type { MconfigField } from '#common/zod/backend/mconfig-field';
import type { ReportX } from '#common/zod/backend/report-x';
import type { MconfigChart } from '#common/zod/blockml/mconfig-chart';
import type { ChartSeriesWithField } from '#common/zod/front/chart-series-with-field';
import type { EventChartDeleteYAxisElement } from '#common/zod/front/event-chart-delete-y-axis-element';
import type { EventChartSeriesElementUpdate } from '#common/zod/front/event-chart-series-element-update';
import type { EventChartToggleSeries } from '#common/zod/front/event-chart-toggle-series';
import type { EventChartToggleYAxisElement } from '#common/zod/front/event-chart-toggle-y-axis-element';
import type { EventChartYAxisElementUpdate } from '#common/zod/front/event-chart-y-axis-element-update';
import type { SeriesPart } from '#common/zod/front/series-part';
import { setValueAndMark } from '#front/app/functions/set-value-and-mark';
import { ChartQuery } from '#front/app/queries/chart.query';
import { StructQuery } from '#front/app/queries/struct.query';
import { ChartService } from '#front/app/services/chart.service';
import { DataService } from '#front/app/services/data.service';
import { FormatNumberService } from '#front/app/services/format-number.service';
import { ReportService } from '#front/app/services/report.service';
import { StructService } from '#front/app/services/struct.service';

@Component({
  standalone: false,
  selector: 'm-chart-editor',
  templateUrl: './chart-editor.component.html'
})
export class ChartEditorComponent implements OnChanges {
  @ViewChild('xFieldSelect', { static: false })
  xFieldSelectElement: NgSelectComponent;

  @ViewChild('yFieldSelect', { static: false })
  yFieldSelectElement: NgSelectComponent;

  @ViewChild('multiFieldSelect', { static: false })
  multiFieldSelectElement: NgSelectComponent;

  @ViewChild('sizeFieldSelect', { static: false })
  sizeFieldSelectElement: NgSelectComponent;

  @HostListener('window:keyup.esc')
  onEscKeyUp() {
    this.xFieldSelectElement?.close();
    this.multiFieldSelectElement?.close();
    this.yFieldSelectElement?.close();
    this.sizeFieldSelectElement?.close();
  }

  chartTypeEnum = ChartTypeEnum;
  chartTypeEnumTable = ChartTypeEnum.Table;
  chartTypeEnumSingle = ChartTypeEnum.Single;
  chartTypeEnumPivotTable = ChartTypeEnum.PivotTable;

  pivotAggList = [
    PivotAggEnum.Sum,
    PivotAggEnum.Avg,
    PivotAggEnum.Count,
    PivotAggEnum.Min,
    PivotAggEnum.Max,
    PivotAggEnum.First,
    PivotAggEnum.Last
  ];

  pivotThemeList = [
    { value: 'standard', label: 'Standard' },
    { value: 'material', label: 'Material' },
    { value: 'bootstrap', label: 'Bootstrap' },
    { value: 'vibrant', label: 'Vibrant' },
    { value: 'contrast', label: 'Contrast' },
    { value: 'large', label: 'Large' }
  ];

  fieldResultEnum = FieldResultEnum;

  empty = EMPTY_MCONFIG_FIELD.topLabel;

  uiChartTypes = UI_CHART_TYPES;

  formatNumberExamples: any[] = FORMAT_NUMBER_EXAMPLES.map(x => {
    let struct = this.structQuery.getValue();

    x.output = this.dataService.d3FormatValue({
      value: x.input,
      formatNumber: x.id,
      fieldResult: FieldResultEnum.Number,
      currencyPrefix: struct.mproveConfig.currencyPrefix,
      currencySuffix: struct.mproveConfig.currencySuffix,
      thousandsSeparator: struct.mproveConfig.thousandsSeparator
    });

    return x;
  });

  @Input()
  chart: MconfigChart;

  @Input()
  queryId?: string;

  @Input()
  mconfigFields?: MconfigField[];

  @Input()
  seriesParts?: SeriesPart[];

  @Input()
  isReport: boolean;

  @Input()
  report: ReportX;

  dimensionsMeasuresCalculations: MconfigField[];

  numbersDimensionsMeasuresCalculationsPlusEmpty: MconfigField[];
  numbersDimensionsMeasuresCalculations: MconfigField[];

  dimensions: MconfigField[];
  dimensionsPlusEmpty: MconfigField[];

  numbersMeasuresAndCalculations: MconfigField[];
  numbersMeasuresAndCalculationsPlusEmpty: MconfigField[];

  numbersYFields: MconfigField[];

  chartSeriesWithField: ChartSeriesWithField[];

  xFieldResult: FieldResultEnum;

  xFieldForm: FormGroup = this.fb.group({
    xField: [undefined]
  });

  yFieldForm: FormGroup = this.fb.group({
    yField: [undefined]
  });

  sizeFieldForm: FormGroup = this.fb.group({
    sizeField: [undefined]
  });

  multiFieldForm: FormGroup = this.fb.group({
    multiField: [undefined]
  });

  chartOptionsIsExpanded = false;

  xAxisIsExpanded: boolean; // initial set in ngOnChanges
  yAxisIsExpanded = true;
  seriesToggleExpandList: string[] = [];
  yAxisToggleExpandList: number[] = [];

  yAxisIndexList: number[] = [];

  isDebugPivot = true;

  constructor(
    private fb: FormBuilder,
    private structService: StructService,
    private structQuery: StructQuery,
    private chartQuery: ChartQuery,
    private chartService: ChartService,
    private dataService: DataService,
    private reportService: ReportService,
    private formatNumberService: FormatNumberService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (isUndefined(this.xAxisIsExpanded) && isDefined(this.isReport)) {
      this.xAxisIsExpanded = this.isReport === false;
    }

    this.yAxisIndexList = this.chart.yAxis.map((x, i) => i);

    if (this.isReport === false) {
      this.xFieldResult = this.mconfigFields.find(
        x => x.id === this.chart.xField
      )?.result;

      this.dimensionsMeasuresCalculations = this.mconfigFields.filter(
        x =>
          [
            FieldClassEnum.Dimension,
            FieldClassEnum.Measure,
            FieldClassEnum.Calculation
          ].indexOf(x.fieldClass) > -1
      );

      this.numbersDimensionsMeasuresCalculations = this.mconfigFields.filter(
        x =>
          x.result === FieldResultEnum.Number &&
          [
            FieldClassEnum.Dimension,
            FieldClassEnum.Measure,
            FieldClassEnum.Calculation
          ].indexOf(x.fieldClass) > -1
      );

      this.numbersDimensionsMeasuresCalculationsPlusEmpty = [
        makeCopy(EMPTY_MCONFIG_FIELD),
        ...this.numbersDimensionsMeasuresCalculations
      ];

      this.dimensions = this.mconfigFields.filter(
        x => x.fieldClass === FieldClassEnum.Dimension
      );

      this.dimensionsPlusEmpty = [
        makeCopy(EMPTY_MCONFIG_FIELD),
        ...this.dimensions
      ];

      this.numbersMeasuresAndCalculations = this.mconfigFields.filter(
        x =>
          x.result === FieldResultEnum.Number &&
          (x.fieldClass === FieldClassEnum.Measure ||
            x.fieldClass === FieldClassEnum.Calculation)
      );

      this.numbersMeasuresAndCalculationsPlusEmpty = [
        makeCopy(EMPTY_MCONFIG_FIELD),
        ...this.numbersMeasuresAndCalculations
      ];

      this.numbersYFields =
        this.chart.type === ChartTypeEnum.Scatter
          ? this.numbersDimensionsMeasuresCalculations
          : this.numbersMeasuresAndCalculations;

      setValueAndMark({
        control: this.xFieldForm.controls['xField'],
        value: this.chart.xField
      });

      setValueAndMark({
        control: this.yFieldForm.controls['yField'],
        value: this.chart.yFields.length > 0 ? this.chart.yFields[0] : undefined
      });

      setValueAndMark({
        control: this.sizeFieldForm.controls['sizeField'],
        value: this.chart.sizeField
      });

      setValueAndMark({
        control: this.multiFieldForm.controls['multiField'],
        value: this.chart.multiField
      });

      let seriesCopy = makeCopy(this.chart.series);

      this.chartSeriesWithField = seriesCopy
        .map(x => {
          let yField = this.numbersYFields.find(y => y.id === x.dataField);
          (x as ChartSeriesWithField).field = yField;
          return x as ChartSeriesWithField;
        })
        .sort((a, b) => {
          let sortedIds = this.numbersYFields.map(x => x.id);
          let aIndex = sortedIds.indexOf(a.dataField);
          let bIndex = sortedIds.indexOf(b.dataField);

          return aIndex > bIndex ? 1 : bIndex > aIndex ? -1 : 0;
        });
    } else {
      let seriesCopy = makeCopy(this.chart.series);

      this.chartSeriesWithField = seriesCopy
        .map(x => {
          let seriesPart = this.seriesParts.find(
            sp => sp.seriesRowId === x.dataRowId
          );
          if (isDefined(seriesPart)) {
            (x as ChartSeriesWithField).seriesName = seriesPart.seriesName;
            (x as ChartSeriesWithField).seriesRowName =
              seriesPart.seriesRowName;
            (x as ChartSeriesWithField).isMetric = seriesPart.isMetric;
            (x as ChartSeriesWithField).showMetricsModelName =
              seriesPart.showMetricsModelName;
            (x as ChartSeriesWithField).showMetricsTimeFieldName =
              seriesPart.showMetricsTimeFieldName;
            (x as ChartSeriesWithField).partNodeLabel =
              seriesPart.partNodeLabel;
            (x as ChartSeriesWithField).partFieldLabel =
              seriesPart.partFieldLabel;
            (x as ChartSeriesWithField).timeNodeLabel =
              seriesPart.timeNodeLabel;
            (x as ChartSeriesWithField).timeFieldLabel =
              seriesPart.timeFieldLabel;
            (x as ChartSeriesWithField).topLabel = seriesPart.topLabel;
          }
          return x as ChartSeriesWithField;
        })
        .sort((a, b) =>
          a.dataRowId > b.dataRowId ? 1 : b.dataRowId > a.dataRowId ? -1 : 0
        );
    }
  }

  getIsValid() {
    let isChartValid = false;

    // if (this.chart.type === ChartTypeEnum.BarVertical) {
    //   isChartValid =
    //     (this.chart.legend === false ||
    //       this.legendTitleForm.controls['legendTitle'].valid) &&
    //     (this.chart.xAxis === false ||
    //       this.chart.showXAxisLabel === false ||
    //       this.xAxisLabelForm.controls['xAxisLabel'].valid) &&
    //     (this.chart.yAxis === false ||
    //       this.chart.showYAxisLabel === false ||
    //       this.yAxisLabelForm.controls['yAxisLabel'].valid) &&
    //     this.yScaleMaxForm.controls['yScaleMax'].valid &&
    //     this.barPaddingForm.controls['barPadding'].valid &&
    //     this.formatNumberDataLabelForm.controls['formatNumberDataLabel']
    //       .valid &&
    //     this.formatNumberYAxisTickForm.controls['formatNumberYAxisTick'].valid;
    // }
    // else {
    isChartValid = true;
    // }

    return isChartValid;
  }

  chartEditorUpdateChart(item: { chartPart: MconfigChart; isCheck: boolean }) {
    let { chartPart, isCheck } = item;

    if (this.isReport === false) {
      let newMconfig = this.structService.makeMconfig();

      newMconfig.chart = Object.assign({}, newMconfig.chart, chartPart);

      newMconfig = setChartSeries({ mconfig: newMconfig });

      let isCheckPass = false;

      if (isCheck === true) {
        let isValid = this.getIsValid();

        if (isValid === true) {
          newMconfig.chart.isValid = true;
          isCheckPass = true;
        }
      }

      if (isCheck === false || isCheckPass === true) {
        // query not changed
        if (newMconfig.modelType === ModelTypeEnum.Malloy) {
          this.chartService.editChart({
            mconfig: newMconfig,
            isDraft: this.chartQuery.getValue().draft,
            chartId: this.chartQuery.getValue().chartId,
            queryOperation: {
              type: QueryOperationTypeEnum.Get,
              timezone: newMconfig.timezone
            }
          });
        } else {
          this.chartService.editChart({
            mconfig: newMconfig,
            isDraft: this.chartQuery.getValue().draft,
            chartId: this.chartQuery.getValue().chartId
          });
        }
      }
    } else {
      let newChart = Object.assign({}, this.report.chart, chartPart);

      if (isCheck === true) {
        let isValid = this.getIsValid();
        if (isValid === true) {
          newChart.isValid = true;

          this.reportService.modifyRows({
            report: this.report,
            changeType: ChangeTypeEnum.EditChart,
            rowChange: undefined,
            rowIds: undefined,
            reportFields: this.report.fields,
            chart: newChart
          });
        }
      } else {
        this.reportService.modifyRows({
          report: this.report,
          changeType: ChangeTypeEnum.EditChart,
          rowChange: undefined,
          rowIds: undefined,
          reportFields: this.report.fields,
          chart: newChart
        });
      }
    }
  }

  xFieldChange() {
    let xField = this.xFieldForm.controls['xField'].value;

    let newChart: MconfigChart = <MconfigChart>{
      xField: xField
    };

    if (
      UI_CHART_TYPES.multiField.indexOf(this.chart.type) > -1 &&
      UI_CHART_TYPES.nullableMultiField.indexOf(this.chart.type) < 0
    ) {
      let newMultiFieldValue = this.dimensions.filter(x => x.id !== xField)[0]
        .id;

      setValueAndMark({
        control: this.multiFieldForm.controls['multiField'],
        value: newMultiFieldValue
      });

      newChart.multiField = newMultiFieldValue;
    }

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  yFieldsIsChecked(id: string) {
    return this.chart.yFields.findIndex(x => x === id) > -1;
  }

  yFieldsOnClick(id: string) {
    let index = this.chart.yFields.findIndex(x => x === id);

    let newChart: MconfigChart = <MconfigChart>{
      yFields:
        index > -1
          ? [
              ...this.chart.yFields.slice(0, index),
              ...this.chart.yFields.slice(index + 1)
            ]
          : [...this.chart.yFields, id]
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: true });
  }

  pivotRowsIsChecked(id: string) {
    return (this.chart.pivotRows || []).findIndex(x => x === id) > -1;
  }

  pivotRowsOnClick(id: string) {
    let pivotRows = this.chart.pivotRows || [];
    let index = pivotRows.findIndex(x => x === id);

    let newPivotRows =
      index > -1
        ? [...pivotRows.slice(0, index), ...pivotRows.slice(index + 1)]
        : [...pivotRows, id];

    let newChart: MconfigChart = <MconfigChart>{
      pivotRows: newPivotRows,
      pivotColumns: (this.chart.pivotColumns || []).filter(x => x !== id)
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: true });
  }

  pivotColumnsIsChecked(id: string) {
    return (this.chart.pivotColumns || []).findIndex(x => x === id) > -1;
  }

  pivotColumnsOnClick(id: string) {
    let pivotColumns = this.chart.pivotColumns || [];
    let index = pivotColumns.findIndex(x => x === id);

    let newPivotColumns =
      index > -1
        ? [...pivotColumns.slice(0, index), ...pivotColumns.slice(index + 1)]
        : [...pivotColumns, id];

    let newChart: MconfigChart = <MconfigChart>{
      pivotRows: (this.chart.pivotRows || []).filter(x => x !== id),
      pivotColumns: newPivotColumns
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: true });
  }

  pivotValuesIsChecked(id: string) {
    return (this.chart.pivotValues || []).findIndex(x => x.field === id) > -1;
  }

  pivotValuesOnClick(id: string) {
    let pivotValues = this.chart.pivotValues || [];
    let index = pivotValues.findIndex(x => x.field === id);

    let newChart: MconfigChart = <MconfigChart>{
      pivotValues:
        index > -1
          ? [...pivotValues.slice(0, index), ...pivotValues.slice(index + 1)]
          : [
              ...pivotValues,
              { field: id, aggFunc: PivotAggEnum.Sum, label: undefined }
            ]
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: true });
  }

  pivotValueAggChange(id: string, aggFunc: PivotAggEnum) {
    let newChart: MconfigChart = <MconfigChart>{
      pivotValues: (this.chart.pivotValues || []).map(pivotValue =>
        pivotValue.field === id
          ? Object.assign({}, pivotValue, { aggFunc: aggFunc })
          : pivotValue
      )
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: true });
  }

  getPivotValueAgg(id: string) {
    return (
      (this.chart.pivotValues || []).find(pivotValue => pivotValue.field === id)
        ?.aggFunc || PivotAggEnum.Sum
    );
  }

  yFieldChange() {
    let yField = this.yFieldForm.controls['yField'].value;

    let newChart: MconfigChart = <MconfigChart>{
      yFields: [yField]
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  sizeFieldChange() {
    let sizeField = this.sizeFieldForm.controls['sizeField'].value;

    let newChart: MconfigChart = <MconfigChart>{
      sizeField: sizeField
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  multiFieldChange() {
    let multiField = this.multiFieldForm.controls['multiField'].value;

    let newChart: MconfigChart = <MconfigChart>{
      multiField: multiField
    };

    if (UI_CHART_TYPES.nullableMultiField.indexOf(this.chart.type) < 0) {
      let newXFieldValue = this.dimensions.filter(x => x.id !== multiField)[0]
        .id;

      setValueAndMark({
        control: this.xFieldForm.controls['xField'],
        value: newXFieldValue
      });

      newChart.xField = newXFieldValue;
    }

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  toggleFormat() {
    let newChart: MconfigChart = <MconfigChart>{
      format: !this.chart.format
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  togglePivotShowTotals() {
    let newChart: MconfigChart = <MconfigChart>{
      pivotShowTotals: !this.chart.pivotShowTotals
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  togglePivotShowGrandTotal() {
    let newChart: MconfigChart = <MconfigChart>{
      pivotShowGrandTotal: !this.chart.pivotShowGrandTotal
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  togglePivotDefaultExpanded() {
    let newChart: MconfigChart = <MconfigChart>{
      pivotDefaultExpanded: !this.chart.pivotDefaultExpanded
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  togglePivotShowMenu() {
    let newChart: MconfigChart = <MconfigChart>{
      pivotShowMenu: !this.chart.pivotShowMenu
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  pivotThemeChange(event: Event) {
    let pivotTheme = (event.target as HTMLSelectElement).value;

    let newChart: MconfigChart = <MconfigChart>{
      pivotTheme: pivotTheme
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  chartToggleSeries(eventToggleSeries: EventChartToggleSeries) {
    let { seriesDataField, seriesDataRowId } = eventToggleSeries;

    let id = isDefined(seriesDataField) ? seriesDataField : seriesDataRowId;

    if (this.seriesToggleExpandList.indexOf(id) > -1) {
      this.seriesToggleExpandList = this.seriesToggleExpandList.filter(
        x => x !== id
      );
    } else {
      this.seriesToggleExpandList = [...this.seriesToggleExpandList, id];
    }
  }

  chartSeriesElementUpdate(eventSeriesUpdate: EventChartSeriesElementUpdate) {
    let newChart: MconfigChart = <MconfigChart>{
      series: this.chart.series.map(s => {
        let newSeriesElement =
          (this.isReport === true &&
            eventSeriesUpdate.seriesDataRowId === s.dataRowId) ||
          (this.isReport === false &&
            eventSeriesUpdate.seriesDataField === s.dataField)
            ? Object.assign({}, s, eventSeriesUpdate.seriesPart)
            : s;

        return newSeriesElement;
      })
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  toggleChartOptions() {
    this.chartOptionsIsExpanded = !this.chartOptionsIsExpanded;
  }

  toggleXAxis() {
    this.xAxisIsExpanded = !this.xAxisIsExpanded;
  }

  toggleXAxisScale() {
    let newChart: MconfigChart = <MconfigChart>{
      xAxis: {
        scale: !this.chart.xAxis.scale
      }
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  toggleYAxis() {
    this.yAxisIsExpanded = !this.yAxisIsExpanded;
  }

  addYAxis() {
    this.yAxisIsExpanded = true;

    let newYAxis = makeCopy(DEFAULT_CHART_Y_AXIS);

    let newChart: MconfigChart = <MconfigChart>{
      yAxis: [...this.chart.yAxis, newYAxis]
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  chartToggleYAxisElement(event: EventChartToggleYAxisElement) {
    let { yAxisIndex } = event;

    if (this.yAxisToggleExpandList.indexOf(yAxisIndex) > -1) {
      this.yAxisToggleExpandList = this.yAxisToggleExpandList.filter(
        x => x !== yAxisIndex
      );
    } else {
      this.yAxisToggleExpandList = [...this.yAxisToggleExpandList, yAxisIndex];
    }
  }

  chartDeleteYAxisElement(event: EventChartDeleteYAxisElement) {
    let { yAxisIndex } = event;

    let newChart: MconfigChart = <MconfigChart>{
      yAxis: this.chart.yAxis.filter((x, i) => i !== yAxisIndex)
    };

    this.yAxisToggleExpandList = [];

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }

  chartYAxisElementUpdate(event: EventChartYAxisElementUpdate) {
    let newChart: MconfigChart = <MconfigChart>{
      yAxis: this.chart.yAxis.map((y, i) => {
        let newYAxisElement =
          event.yAxisIndex === i ? Object.assign({}, y, event.yAxisPart) : y;

        return newYAxisElement;
      })
    };

    this.chartEditorUpdateChart({ chartPart: newChart, isCheck: false });
  }
}
