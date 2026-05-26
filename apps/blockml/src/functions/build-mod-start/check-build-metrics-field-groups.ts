import { type SourceDef as MalloySourceDef } from '@malloydata/malloy';
import type { ConfigService } from '@nestjs/config';
import type { BlockmlConfig } from '#blockml/config/blockml-config';
import { BmError } from '#blockml/models/bm-error';
import { MPROVE_TAG_FIELD_GROUP } from '#common/constants/top';
import { ParameterEnum } from '#common/enums/docs/parameter.enum';
import type { CallerEnum } from '#common/enums/special/caller.enum';
import { ErTitleEnum } from '#common/enums/special/er-title.enum';
import { FuncEnum } from '#common/enums/special/func.enum';
import { LogTypeEnum } from '#common/enums/special/log-type.enum';
import { isDefined } from '#common/functions/is-defined';
import { isUndefined } from '#common/functions/is-undefined';
import { parseTags } from '#common/functions/parse-tags';
import type { FileMod } from '#common/zod/blockml/internal/file-mod';
import { type FieldItem, getFieldItems } from '../extra/get-field-items';
import { log } from '../extra/log';

let func = FuncEnum.CheckBuildMetricsFieldGroups;

export function checkBuildMetricsFieldGroups(
  item: {
    mods: FileMod[];
    errors: BmError[];
    structId: string;
    caller: CallerEnum;
  },
  cs: ConfigService<BlockmlConfig>
) {
  let { caller, structId } = item;
  log(cs, caller, func, structId, LogTypeEnum.Input, item);

  let newMods: FileMod[] = [];

  item.mods.forEach(mod => {
    let errorsOnStart = item.errors.length;
    let malloyModel = mod.malloyModel;
    let source = mod.source;
    let valueWithSourceInfo = mod.valueWithSourceInfo;

    if (
      isUndefined(malloyModel) ||
      isUndefined(source) ||
      isUndefined(valueWithSourceInfo)
    ) {
      return;
    }
    let malloyModelDef = malloyModel._modelDef;
    let sourceDef = malloyModelDef.contents[source] as MalloySourceDef;

    checkModBuildMetricsFieldGroups({
      sourceDef: sourceDef,
      fieldItems: getFieldItems(valueWithSourceInfo),
      fileName: mod.fileName,
      filePath: mod.filePath,
      errors: item.errors
    });

    if (errorsOnStart === item.errors.length) {
      newMods.push(mod);
    }
  });

  log(cs, caller, func, structId, LogTypeEnum.Errors, item.errors);
  log(cs, caller, func, structId, LogTypeEnum.Mods, newMods);

  return newMods;
}

function checkModBuildMetricsFieldGroups(item: {
  sourceDef: MalloySourceDef;
  fieldItems: FieldItem[];
  fileName: string;
  filePath: string;
  errors: BmError[];
}) {
  let groups: { groupName: string; fieldItems: FieldItem[] }[] = [];

  item.fieldItems.forEach(fieldItem => {
    let tagsResult = parseTags({
      inputs:
        fieldItem.field.annotations?.map(annotation => annotation.value) || []
    });

    let fieldGroupTag = tagsResult.mproveTags.find(
      tag => tag.key === MPROVE_TAG_FIELD_GROUP
    );

    let buildMetricsTag = tagsResult.mproveTags.find(
      tag => tag.key === ParameterEnum.BuildMetrics
    );

    if (isUndefined(fieldGroupTag) || isUndefined(buildMetricsTag)) {
      return;
    }

    if (isUndefined(fieldGroupTag.value)) {
      return;
    }

    let groupIndex = groups.findIndex(g => g.groupName === fieldGroupTag.value);

    if (groupIndex < 0) {
      groups.push({
        groupName: fieldGroupTag.value,
        fieldItems: [fieldItem]
      });
    } else {
      groups[groupIndex].fieldItems.push(fieldItem);
    }
  });

  groups.forEach(group => {
    checkGroupSuffix({
      sourceDef: item.sourceDef,
      fieldItems: group.fieldItems,
      groupName: group.groupName,
      suffix: '_ts',
      title: ErTitleEnum.BUILD_METRICS_FIELD_GROUP_MISSING_FIELD_WITH_TS_SUFFIX,
      fileName: item.fileName,
      filePath: item.filePath,
      errors: item.errors
    });

    checkGroupSuffix({
      sourceDef: item.sourceDef,
      fieldItems: group.fieldItems,
      groupName: group.groupName,
      suffix: '_t',
      title: ErTitleEnum.BUILD_METRICS_FIELD_GROUP_MISSING_FIELD_WITH_T_SUFFIX,
      fileName: item.fileName,
      filePath: item.filePath,
      errors: item.errors
    });

    checkGroupTimeframes({
      sourceDef: item.sourceDef,
      fieldItems: group.fieldItems,
      groupName: group.groupName,
      fileName: item.fileName,
      filePath: item.filePath,
      errors: item.errors
    });
  });
}

function checkGroupSuffix(item: {
  sourceDef: MalloySourceDef;
  fieldItems: FieldItem[];
  groupName: string;
  suffix: string;
  title: ErTitleEnum;
  fileName: string;
  filePath: string;
  errors: BmError[];
}) {
  let suffixFieldItems = item.fieldItems.filter(fieldItem =>
    fieldItem.field.name.endsWith(item.suffix)
  );

  if (suffixFieldItems.length === 1) {
    return;
  }

  let firstFieldItem = item.fieldItems[0];

  let sourceField = findSourceField({
    sourceDef: item.sourceDef,
    fieldItem: firstFieldItem
  });

  let sourceFieldLine = sourceField?.location?.range?.start?.line;

  let line = isDefined(sourceFieldLine) ? sourceFieldLine + 1 : 0;

  item.errors.push(
    new BmError({
      title: item.title,
      message: `"${ParameterEnum.BuildMetrics}" "${MPROVE_TAG_FIELD_GROUP}" group "${item.groupName}" must have exactly one field with "${item.suffix}" suffix`,
      lines: [
        {
          line: line,
          name: item.fileName,
          path: item.filePath
        }
      ]
    })
  );
}

type FieldWithTimeframe = FieldItem['field'] & {
  type: {
    timeframe?: string;
  };
};

type MalloySourceExpression = {
  node: string;
  units?: string;
  e?: {
    node: string;
    path?: string[];
  };
};

type MalloySourceField = {
  e?: MalloySourceExpression;
  location?: {
    range?: {
      start?: {
        line?: number;
      };
    };
  };
};

function checkGroupTimeframes(item: {
  sourceDef: MalloySourceDef;
  fieldItems: FieldItem[];
  groupName: string;
  fileName: string;
  filePath: string;
  errors: BmError[];
}) {
  item.fieldItems.forEach(fieldItem => {
    let field = fieldItem.field as FieldWithTimeframe;
    let timeframe = field.type.timeframe;

    if (isUndefined(timeframe)) {
      return;
    }

    let sourceField = findSourceField({
      sourceDef: item.sourceDef,
      fieldItem: fieldItem
    }) as MalloySourceField;

    let sourceExpression = sourceField?.e;

    let sourceExpressionFieldPath =
      sourceExpression?.node === 'trunc' &&
      sourceExpression.units === timeframe &&
      sourceExpression.e?.node === 'field'
        ? sourceExpression.e.path
        : undefined;

    let baseFieldName = sourceExpressionFieldPath?.at(-1);
    let baseFieldNameEndsWithT = baseFieldName?.endsWith('_t') === true;

    if (baseFieldNameEndsWithT) {
      return;
    }

    let sourceFieldLine = sourceField?.location?.range?.start?.line;

    let line = isDefined(sourceFieldLine) ? sourceFieldLine + 1 : 0;

    item.errors.push(
      new BmError({
        title:
          ErTitleEnum.BUILD_METRICS_TIMEFRAME_FIELD_MUST_USE_FIELD_WITH_T_SUFFIX,
        message: `"${ParameterEnum.BuildMetrics}" "${MPROVE_TAG_FIELD_GROUP}" group "${item.groupName}" timeframe field "${fieldItem.field.name}" must be based on a field with "_t" suffix`,
        lines: [
          {
            line: line,
            name: item.fileName,
            path: item.filePath
          }
        ]
      })
    );
  });
}

function findSourceField(item: {
  sourceDef: MalloySourceDef;
  fieldItem: FieldItem;
}) {
  let fields: any[] = item.sourceDef.fields;

  item.fieldItem.path.forEach(fieldPath => {
    let parent = fields.find(
      pField =>
        (pField.as === fieldPath || pField.name === fieldPath) &&
        isDefined(pField?.fields)
    );

    let parentIsDefined = isDefined(parent);

    if (parentIsDefined) {
      fields = parent.fields;
    }
  });

  return fields.find(
    field =>
      field.as === item.fieldItem.field.name ||
      field.name === item.fieldItem.field.name
  );
}
