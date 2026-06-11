import { Component, Input, OnChanges } from '@angular/core';
import type { GridConfig } from '@toolbox-web/grid-angular';
import { FieldResultEnum } from '#common/enums/field-result.enum';
import type { MconfigField } from '#common/zod/backend/mconfig-field';
import type { MconfigChart } from '#common/zod/blockml/mconfig-chart';
import { StructQuery } from '#front/app/queries/struct.query';
import { DataService, type QDataRow } from '#front/app/services/data.service';

interface PivotTableRow {
  [key: string]: string | number | null;
}

@Component({
  standalone: false,
  selector: 'm-chart-pivot-table',
  templateUrl: './chart-pivot-table.component.html'
})
export class ChartPivotTableComponent implements OnChanges {
  private static themeLinkId = 'mprove-toolbox-grid-theme';

  @Input()
  chart: MconfigChart;

  @Input()
  mconfigFields: MconfigField[];

  @Input()
  qData: QDataRow[];

  @Input()
  isFormat: boolean;

  rows: PivotTableRow[] = [];
  gridConfig: GridConfig<PivotTableRow>;
  customStyles: string;

  constructor(
    private dataService: DataService,
    private structQuery: StructQuery
  ) {}

  ngOnChanges() {
    this.rows = this.makeRows();
    this.gridConfig = this.makeGridConfig();
    this.customStyles = this.makeCustomStyles();
    this.setThemeStylesheet();
  }

  private makeRows() {
    return (this.qData || []).map(row => {
      let pivotRow: PivotTableRow = {};
      let pivotValueFieldIds = (this.chart.pivotValues || []).map(
        pivotValue => pivotValue.field
      );

      this.mconfigFields.forEach(field => {
        let cell = row[field.id];
        pivotRow[field.id] =
          pivotValueFieldIds.indexOf(field.id) > -1 || this.isFormat === false
            ? Number(cell?.value)
            : cell?.valueFmt;
      });

      return pivotRow;
    });
  }

  private makeGridConfig(): GridConfig<PivotTableRow> {
    return {
      columns: this.mconfigFields.map(field => ({
        field: field.id,
        header: field.groupLabel
          ? `${field.groupLabel} - ${field.label}`
          : field.label,
        sortable: true,
        resizable: true
      })),
      features: {
        shell: {
          header: {
            visible: this.chart.pivotShowMenu === true
          },
          toolPanel: {
            initialState: 'closed'
          }
        },
        pivot: {
          rowGroupFields: this.chart.pivotRows || [],
          columnGroupFields: this.chart.pivotColumns || [],
          valueFields: (this.chart.pivotValues || []).map(pivotValue => ({
            field: pivotValue.field,
            aggFunc: pivotValue.aggFunc,
            header: pivotValue.label,
            format: (value: number) =>
              this.formatPivotValue(pivotValue.field, value)
          })),
          showTotals: this.chart.pivotShowTotals === true,
          showGrandTotal: this.chart.pivotShowGrandTotal === true,
          defaultExpanded: this.chart.pivotDefaultExpanded === true,
          showToolPanel: this.chart.pivotShowMenu === true
        }
      }
    };
  }

  private formatPivotValue(fieldId: string, value: number) {
    if (this.isFormat === false) {
      return `${value}`;
    }

    let field = this.mconfigFields.find(
      mconfigField => mconfigField.id === fieldId
    );
    let struct = this.structQuery.getValue();

    return this.dataService.d3FormatValue({
      value: value,
      formatNumber:
        field?.formatNumber || struct.mproveConfig.formatNumber || undefined,
      fieldResult: FieldResultEnum.Number,
      currencyPrefix:
        field?.currencyPrefix ||
        struct.mproveConfig.currencyPrefix ||
        undefined,
      currencySuffix:
        field?.currencySuffix ||
        struct.mproveConfig.currencySuffix ||
        undefined,
      thousandsSeparator: struct.mproveConfig.thousandsSeparator
    });
  }

  private makeCustomStyles() {
    return `
      :host {
        --tbw-grid-font-family: 'Montserrat', sans-serif;
      }
    `;
  }

  private setThemeStylesheet() {
    let theme = this.chart.pivotTheme || 'standard';
    let href = `/assets/toolbox-grid-themes/dg-theme-${theme}.css`;

    let link = document.getElementById(
      ChartPivotTableComponent.themeLinkId
    ) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = ChartPivotTableComponent.themeLinkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (link.href !== new URL(href, window.location.origin).href) {
      link.href = href;
    }
  }
}
