import { Component, Input, OnChanges } from '@angular/core';
import { BaseGridPlugin, type ColumnConfig } from '@toolbox-web/grid';
import type { GridConfig } from '@toolbox-web/grid-angular';
import { ParameterEnum } from '#common/enums/docs/parameter.enum';
import { FieldResultEnum } from '#common/enums/field-result.enum';
import type { MconfigField } from '#common/zod/backend/mconfig-field';
import type { MconfigChart } from '#common/zod/blockml/mconfig-chart';
import { StructQuery } from '#front/app/queries/struct.query';
import { DataService, type QDataRow } from '#front/app/services/data.service';

interface PivotTableRow {
  [key: string]: string | number | null;
}

interface PivotHeaderPart {
  label: string;
  isName: boolean;
}

interface PivotHeaderItem {
  text: string;
  parts: PivotHeaderPart[];
}

interface PivotFieldHeader {
  label: string;
  prefix: string[];
}

class PivotGeneratedHeaderPlugin extends BaseGridPlugin<{
  hasColumnDimensions: boolean;
  measureHeaders: Record<string, PivotFieldHeader>;
  measureLabels: Record<string, string>;
  pivotColumnOrder: Record<string, number>;
  pivotValueFields: string[];
  rowHeaders: PivotFieldHeader[];
}> {
  static override readonly manifest = {
    hookPriority: { processColumns: 100 }
  };

  readonly name = 'mprovePivotGeneratedHeader';

  override processColumns(columns: readonly ColumnConfig[]): ColumnConfig[] {
    let pivotMeasureCount = this.config.pivotValueFields.length;

    let processedColumns = columns.map(column => {
      if (column.field === '__pivotLabel') {
        let width = this.estimateRowGroupHeaderWidth();

        return {
          ...column,
          __originalWidth: width,
          header: this.makeRowGroupHeaderText(),
          headerLabelRenderer: () => this.makeRowGroupHeaderLabel(),
          width: width
        };
      }

      let header = this.makePivotColumnHeader({
        column: column,
        pivotMeasureCount: pivotMeasureCount
      });

      if (!header) {
        return column;
      }

      return {
        ...column,
        __originalWidth: header.width,
        header: header.text,
        headerLabelRenderer: () =>
          this.makePivotColumnHeaderLabel({
            header: header,
            pivotMeasureCount: pivotMeasureCount
          }),
        width: header.width
      };
    });

    return this.sortPivotValueColumns({ columns: processedColumns });
  }

  private sortPivotValueColumns(item: { columns: ColumnConfig[] }) {
    let { columns } = item;

    if (!this.config.hasColumnDimensions) {
      return columns;
    }

    return [...columns].sort((a, b) => {
      let aOrder = this.getPivotValueColumnOrder({ column: a });
      let bOrder = this.getPivotValueColumnOrder({ column: b });

      if (aOrder === bOrder) {
        return (
          this.getPivotValueFieldOrder({ column: a }) -
          this.getPivotValueFieldOrder({ column: b })
        );
      }

      return aOrder - bOrder;
    });
  }

  private getPivotValueFieldOrder(item: { column: ColumnConfig }) {
    let { column } = item;
    let fieldParts = column.field.split('|');
    let valueField = fieldParts[fieldParts.length - 1];
    let order = this.config.pivotValueFields.indexOf(valueField);

    return order === -1 ? 0 : order;
  }

  private getPivotValueColumnOrder(item: { column: ColumnConfig }) {
    let { column } = item;

    if (column.field === '__pivotLabel') {
      return Number.NEGATIVE_INFINITY;
    }

    if (column.field === '__pivotTotal') {
      return Number.POSITIVE_INFINITY;
    }

    let fieldParts = column.field.split('|');
    let valueField = fieldParts[fieldParts.length - 1];
    let isPivotValueColumn =
      this.config.pivotValueFields.indexOf(valueField) > -1;

    if (!isPivotValueColumn || fieldParts.length < 2) {
      return Number.POSITIVE_INFINITY - 1;
    }

    let columnKey = fieldParts.slice(0, -1).join('|');

    return (
      this.config.pivotColumnOrder[columnKey] ?? Number.POSITIVE_INFINITY - 1
    );
  }

  private makePivotColumnHeader(item: {
    column: ColumnConfig;
    pivotMeasureCount: number;
  }) {
    let { column, pivotMeasureCount } = item;
    let fieldParts = column.field.split('|');
    let valueField = fieldParts[fieldParts.length - 1];
    let isPivotValueColumn =
      this.config.pivotValueFields.indexOf(valueField) > -1;
    let measureLabel = this.config.measureLabels[valueField] || valueField;

    if (!isPivotValueColumn) {
      return undefined;
    }

    if (!this.config.hasColumnDimensions) {
      let measureHeader = this.config.measureHeaders[valueField];
      let measurePrefix = measureHeader?.prefix || [];
      let text =
        measurePrefix.length > 0
          ? `${measurePrefix.join(' ')}\n${measureLabel}`
          : measureLabel;
      let width = this.estimateHeaderWidth({
        dimensionLabels: [],
        measureLabel: measureLabel,
        measurePrefix: measurePrefix,
        pivotMeasureCount: 1
      });

      return {
        dimensionLabels: [] as string[],
        measureLabel: measureLabel,
        measurePrefix: measurePrefix,
        text: text,
        width: width
      };
    }

    if (fieldParts.length < 2) {
      return undefined;
    }

    let dimensionLabels = fieldParts.slice(0, -1);
    let text = [measureLabel, ...dimensionLabels].join('\n');
    let width = this.estimateHeaderWidth({
      dimensionLabels: dimensionLabels,
      measureLabel: measureLabel,
      measurePrefix: [],
      pivotMeasureCount: pivotMeasureCount
    });

    return {
      dimensionLabels: dimensionLabels,
      measureLabel: measureLabel,
      measurePrefix: [],
      text: text,
      width: width
    };
  }

  private estimateHeaderWidth(item: {
    dimensionLabels: string[];
    measureLabel: string;
    measurePrefix: string[];
    pivotMeasureCount: number;
  }) {
    let { dimensionLabels, measureLabel, measurePrefix, pivotMeasureCount } =
      item;
    let labels =
      pivotMeasureCount > 1 || dimensionLabels.length > 0
        ? [measureLabel, ...dimensionLabels]
        : [...measurePrefix, ...dimensionLabels, measureLabel];
    let longestLabel = labels.reduce(
      (longest, label) => (label.length > longest.length ? label : longest),
      ''
    );

    return Math.max(96, longestLabel.length * 8 + 48);
  }

  private estimateRowGroupHeaderWidth() {
    let longestLabel = this.config.rowHeaders.reduce((longest, rowHeader) => {
      let labels =
        this.config.rowHeaders.length === 1
          ? [rowHeader.prefix.join(' '), rowHeader.label]
          : [[...rowHeader.prefix, rowHeader.label].join(' ')];
      let label = labels.reduce(
        (longestLine, line) =>
          line.length > longestLine.length ? line : longestLine,
        ''
      );

      return label.length > longest.length ? label : longest;
    }, '');

    return Math.max(200, longestLabel.length * 8 + 56);
  }

  private makePivotColumnHeaderLabel(item: {
    header: {
      dimensionLabels: string[];
      measureLabel: string;
      measurePrefix: string[];
      text: string;
      width: number;
    };
    pivotMeasureCount: number;
  }) {
    let { header, pivotMeasureCount } = item;

    let container = document.createElement('span');
    container.className = 'm-pivot-generated-header';

    if (header.measurePrefix.length > 0) {
      let prefix = document.createElement('span');
      prefix.className = 'm-pivot-column-header-prefix';
      prefix.textContent = header.measurePrefix.join(' ');
      container.appendChild(prefix);
    }

    let measure = document.createElement('span');
    measure.className = 'm-pivot-column-header-measure';
    measure.textContent = header.measureLabel;
    container.appendChild(measure);

    header.dimensionLabels.forEach(dimensionLabel => {
      let dimension = document.createElement('span');
      dimension.className = 'm-pivot-column-header-dimension';
      dimension.textContent = dimensionLabel;
      container.appendChild(dimension);
    });

    return container;
  }

  private makeRowGroupHeaderText() {
    return this.config.rowHeaders
      .map(rowHeader => {
        if (this.config.rowHeaders.length === 1) {
          return rowHeader.prefix.length > 0
            ? `${rowHeader.prefix.join(' ')}\n${rowHeader.label}`
            : rowHeader.label;
        }

        return rowHeader.prefix.length > 0
          ? `${rowHeader.prefix.join(' ')} ${rowHeader.label}`
          : rowHeader.label;
      })
      .join('\n');
  }

  private makeRowGroupHeaderLabel() {
    let container = document.createElement('span');
    container.className = 'm-pivot-row-group-header';

    this.config.rowHeaders.forEach(rowHeader => {
      if (this.config.rowHeaders.length === 1) {
        if (rowHeader.prefix.length > 0) {
          let prefixRow = document.createElement('span');
          prefixRow.className = 'm-pivot-row-group-header-line';

          let prefix = document.createElement('span');
          prefix.className = 'm-pivot-column-header-prefix';
          prefix.textContent = rowHeader.prefix.join(' ');
          prefixRow.appendChild(prefix);

          container.appendChild(prefixRow);
        }

        let labelRow = document.createElement('span');
        labelRow.className = 'm-pivot-row-group-header-line';

        let label = document.createElement('span');
        label.className = 'm-pivot-column-header-measure';
        label.textContent = rowHeader.label;
        labelRow.appendChild(label);

        container.appendChild(labelRow);
        return;
      }

      let row = document.createElement('span');
      row.className = 'm-pivot-row-group-header-line';

      rowHeader.prefix.forEach(rowHeaderPrefix => {
        let prefix = document.createElement('span');
        prefix.className = 'm-pivot-column-header-prefix';
        prefix.style.fontWeight = '400';
        prefix.textContent = `${rowHeaderPrefix} `;
        row.appendChild(prefix);
      });

      let label = document.createElement('span');
      label.className = 'm-pivot-column-header-measure';
      label.textContent = rowHeader.label;
      row.appendChild(label);

      container.appendChild(row);
    });

    return container;
  }
}

class PivotAlwaysExpandedPlugin extends BaseGridPlugin<{ enabled: boolean }> {
  readonly name = 'mprovePivotAlwaysExpanded';

  override afterRender() {
    if (!this.config.enabled) {
      return;
    }

    let gridElement = this.grid as unknown as HTMLElement;
    let collapsedToggle = gridElement.querySelector(
      '.pivot-group-row .pivot-toggle[aria-label="Expand group"]'
    );

    if (!collapsedToggle) {
      return;
    }

    let pivotPlugin = this.grid.getPluginByName?.('pivot') as
      | { expandAll: () => void }
      | undefined;

    pivotPlugin?.expandAll();
  }
}

class PivotHideGroupTotalsPlugin extends BaseGridPlugin<{ enabled: boolean }> {
  static override readonly manifest = {
    hookPriority: { afterRender: 100 }
  };

  readonly name = 'mprovePivotHideGroupTotals';

  override afterRender() {
    if (!this.config.enabled) {
      return;
    }

    let gridElement = this.grid as unknown as HTMLElement;

    gridElement.querySelectorAll('.pivot-group-row').forEach(rowElement => {
      rowElement.querySelectorAll('.pivot-count').forEach(countElement => {
        countElement.textContent = '';
      });

      rowElement.querySelectorAll('.cell').forEach((cellElement, cellIndex) => {
        if (cellIndex > 0) {
          cellElement.textContent = '';
        }
      });
    });
  }
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

  rows: PivotTableRow[] = [];
  gridConfig: GridConfig<PivotTableRow>;
  customStyles: string;
  measureListHeader: string;
  showMeasureListHeader: boolean;
  dimensionListHeader: string;
  measureHeaderItems: PivotHeaderItem[] = [];
  dimensionHeaderItems: PivotHeaderItem[] = [];

  constructor(
    private dataService: DataService,
    private structQuery: StructQuery
  ) {}

  ngOnChanges() {
    this.rows = this.makeRows();
    this.measureHeaderItems = this.makeMeasureHeaderItems();
    this.measureListHeader = this.measureHeaderItems
      .map(headerItem => headerItem.text)
      .join(', ');
    this.showMeasureListHeader = this.hasColumnDimensions();
    this.dimensionHeaderItems = this.makeDimensionHeaderItems();
    this.dimensionListHeader = this.dimensionHeaderItems
      .map(headerItem => headerItem.text)
      .join(', ');
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
        let formattedValue = cell?.valueFmt ?? cell?.value;

        pivotRow[field.id] =
          pivotValueFieldIds.indexOf(field.id) > -1
            ? Number(cell?.value)
            : formattedValue;
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
      plugins: [
        new PivotGeneratedHeaderPlugin({
          hasColumnDimensions: this.hasColumnDimensions(),
          measureHeaders: this.makePivotMeasureHeaders(),
          measureLabels: this.makePivotMeasureLabels(),
          pivotColumnOrder: this.makePivotColumnOrder(),
          pivotValueFields: (this.chart.pivotValues || []).map(
            pivotValue => pivotValue.field
          ),
          rowHeaders: (this.chart.pivotRows || []).map(fieldId => {
            let field = this.mconfigFields.find(
              mconfigField => mconfigField.id === fieldId
            );

            return {
              label: field?.label || fieldId,
              prefix: this.getPivotFieldPrefixes({ fieldId: fieldId })
            };
          })
        }),
        new PivotHideGroupTotalsPlugin({
          enabled: (this.chart.pivotRows || []).length > 1
        }),
        new PivotAlwaysExpandedPlugin({
          enabled: (this.chart.pivotRows || []).length > 1
        })
      ],
      features: {
        shell: {
          header: {
            visible: false
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
          showTotals: false,
          showGrandTotal: false,
          defaultExpanded: true,
          showToolPanel: false
        }
      }
    };
  }

  private makeMeasureHeaderItems() {
    return (this.chart.pivotValues || [])
      .map(pivotValue => {
        let field = this.mconfigFields.find(
          mconfigField => mconfigField.id === pivotValue.field
        );
        let name = pivotValue.label || field?.label || pivotValue.field;
        let prefixes = field ? [field.topLabel, field.groupLabel] : [];
        let parts = [
          ...prefixes
            .filter(label => !!label)
            .map(label => ({ label: label, isName: false })),
          { label: name, isName: true }
        ];

        return {
          text: parts.map(part => part.label).join(' '),
          parts: parts
        };
      })
      .filter(headerItem => !!headerItem.text);
  }

  private makeDimensionHeaderItems() {
    return (this.chart.pivotColumns || [])
      .map(fieldId => {
        let field = this.mconfigFields.find(
          mconfigField => mconfigField.id === fieldId
        );

        if (!field) {
          return {
            text: fieldId,
            parts: [{ label: fieldId, isName: true }]
          };
        }

        let parts = [
          ...[field.topLabel, field.groupLabel]
            .filter(label => !!label)
            .map(label => ({ label: label, isName: false })),
          { label: field.label, isName: true }
        ];

        return {
          text: parts.map(part => part.label).join(' '),
          parts: parts
        };
      })
      .filter(headerItem => !!headerItem.text);
  }

  private makePivotMeasureLabels() {
    let labels: Record<string, string> = {};

    (this.chart.pivotValues || []).forEach(pivotValue => {
      let field = this.mconfigFields.find(
        mconfigField => mconfigField.id === pivotValue.field
      );

      labels[pivotValue.field] =
        pivotValue.label || field?.label || pivotValue.field;
    });

    return labels;
  }

  private makePivotMeasureHeaders() {
    let headers: Record<string, PivotFieldHeader> = {};

    (this.chart.pivotValues || []).forEach(pivotValue => {
      let field = this.mconfigFields.find(
        mconfigField => mconfigField.id === pivotValue.field
      );

      headers[pivotValue.field] = {
        label: pivotValue.label || field?.label || pivotValue.field,
        prefix: this.getPivotFieldPrefixes({ fieldId: pivotValue.field })
      };
    });

    return headers;
  }

  private hasColumnDimensions() {
    return (this.chart.pivotColumns || []).length > 0;
  }

  private makePivotColumnOrder() {
    let order: Record<string, number> = {};
    let pivotColumns = this.chart.pivotColumns || [];

    if (pivotColumns.length === 0) {
      return order;
    }

    this.rows.forEach(row => {
      let columnKey = pivotColumns
        .map(fieldId => String(row[fieldId] ?? ''))
        .join('|');

      if (order[columnKey] === undefined) {
        order[columnKey] = Object.keys(order).length;
      }
    });

    return order;
  }

  private getPivotFieldPrefixes(item: { fieldId: string }) {
    let { fieldId } = item;
    let field = this.mconfigFields.find(
      mconfigField => mconfigField.id === fieldId
    );

    return [field?.topLabel, field?.groupLabel].filter(label => !!label);
  }

  private formatPivotValue(fieldId: string, value: number) {
    let field = this.mconfigFields.find(
      mconfigField => mconfigField.id === fieldId
    );
    let struct = this.structQuery.getValue();
    let fieldThousandsSeparatorTag = field?.mproveTags?.find(
      tag => tag.key === ParameterEnum.ThousandsSeparator
    );
    let thousandsSeparator =
      fieldThousandsSeparatorTag?.value ??
      struct.mproveConfig.thousandsSeparator;
    let formatNumber =
      field?.formatNumber || struct.mproveConfig.formatNumber || undefined;

    if (!formatNumber) {
      return Number(value).toLocaleString().split(',').join(thousandsSeparator);
    }

    return this.dataService.d3FormatValue({
      value: value,
      formatNumber: formatNumber,
      fieldResult: FieldResultEnum.Number,
      currencyPrefix:
        field?.currencyPrefix ||
        struct.mproveConfig.currencyPrefix ||
        undefined,
      currencySuffix:
        field?.currencySuffix ||
        struct.mproveConfig.currencySuffix ||
        undefined,
      thousandsSeparator: thousandsSeparator
    });
  }

  private makeCustomStyles() {
    let isMultiRowGroup = (this.chart.pivotRows || []).length > 1;

    return `
      :host {
        --tbw-grid-font-family: 'Montserrat', sans-serif;
      }

      .header-row .cell,
      .data-grid-row .cell {
        border-right: 1px solid var(--tbw-color-border, #d1d5db);
        border-bottom: 1px solid var(--tbw-color-border, #d1d5db);
        padding-left: 20px;
      }

      .header-row .cell {
        font-size: 16px;
        padding-top: 8px;
        padding-bottom: 8px;
      }

      .header-row .cell:first-child,
      .data-grid-row .cell:first-child {
        border-left: 1px solid var(--tbw-color-border, #d1d5db);
      }

      .header-row .cell {
        border-top: 1px solid var(--tbw-color-border, #d1d5db);
      }

      .pivot-group-row .cell:not(:first-child),
      .pivot-leaf-row .cell:not(:first-child),
      .pivot-grand-total-row .cell:not(:first-child) {
        justify-content: flex-end;
        text-align: right;
      }

      .header,
      .pivot-group-row,
      .pivot-group-row:hover {
        background: transparent !important;
      }

      .header-row,
      .data-grid-row,
      .pivot-group-row,
      .pivot-leaf-row,
      .pivot-grand-total-row {
        width: fit-content;
        min-width: 100%;
      }

      .header-row .cell:first-child,
      .header-row .cell:first-child:hover {
        background: #cdecfe !important;
      }

      .header-row .cell:not(:first-child),
      .header-row .cell:not(:first-child):hover {
        background: #b6e1bc !important;
      }

      .pivot-group-row .cell,
      .pivot-group-row:hover .cell {
        background: var(--tbw-pivot-group-bg, var(--tbw-color-row-alt)) !important;
      }

      .tbw-scroll-area,
      .faux-vscroll {
        scrollbar-color: transparent transparent;
        scrollbar-width: thin;
      }

      .faux-vscroll {
        background: transparent !important;
        height: calc(100% - 62px);
        margin-top: 62px;
        width: 8px;
      }

      .faux-vscroll-spacer {
        background: transparent !important;
      }

      .tbw-scroll-area:hover,
      .tbw-grid-root:hover .faux-vscroll,
      .faux-vscroll:hover,
      .tbw-scroll-area:focus-within,
      .tbw-grid-root:focus-within .faux-vscroll,
      .faux-vscroll:focus-within {
        scrollbar-color: var(--tbw-color-border, #d1d5db) transparent;
      }

      .tbw-scroll-area::-webkit-scrollbar,
      .faux-vscroll::-webkit-scrollbar {
        height: 8px;
        width: 8px;
      }

      .tbw-scroll-area::-webkit-scrollbar-thumb,
      .faux-vscroll::-webkit-scrollbar-thumb {
        background: transparent;
      }

      .tbw-scroll-area:hover::-webkit-scrollbar-thumb,
      .tbw-grid-root:hover .faux-vscroll::-webkit-scrollbar-thumb,
      .faux-vscroll:hover::-webkit-scrollbar-thumb,
      .tbw-scroll-area:focus-within::-webkit-scrollbar-thumb,
      .tbw-grid-root:focus-within .faux-vscroll::-webkit-scrollbar-thumb,
      .faux-vscroll:focus-within::-webkit-scrollbar-thumb {
        background: var(--tbw-color-border, #d1d5db);
      }

      .tbw-scroll-area::-webkit-scrollbar-track,
      .faux-vscroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .m-pivot-generated-header {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        font-family: 'Montserrat', sans-serif;
        justify-content: center;
        font-size: 16px;
        line-height: 1.35;
        min-width: max-content;
        text-align: left;
      }

      .m-pivot-row-group-header {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        font-family: 'Montserrat', sans-serif;
        justify-content: center;
        font-size: 16px;
        line-height: 1.35;
        text-align: left;
      }

      .m-pivot-row-group-header-line {
        display: block;
      }

      .header-row .cell[data-field='__pivotLabel'] {
        display: flex;
        gap: 0;
      }

      .header-row .cell[data-field='__pivotLabel'] > .sort-indicator {
        flex: 0 0 1.25em;
        margin-left: 0.25em;
      }

      .m-pivot-column-header-prefix {
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        font-weight: 400;
      }

      .m-pivot-column-header-measure {
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
      }

      .m-pivot-column-header-dimension {
        font-family: 'Montserrat', sans-serif;
        font-weight: 400;
      }

      ${
        isMultiRowGroup
          ? `
            .pivot-group-row .pivot-toggle {
              display: none;
            }

            .pivot-group-row .pivot-label {
              margin-left: 20px;
            }

            .pivot-group-row .pivot-count {
              display: none;
            }

            .pivot-group-row .cell:not(:first-child) {
              color: transparent;
            }
          `
          : ''
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
