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
    let tsFieldItems = group.fieldItems.filter(fieldItem =>
      fieldItem.field.name.endsWith('_ts')
    );

    if (tsFieldItems.length === 1) {
      return;
    }

    let firstFieldItem = group.fieldItems[0];

    let sourceField = findSourceField({
      sourceDef: item.sourceDef,
      fieldItem: firstFieldItem
    });

    let sourceFieldLine = sourceField?.location?.range?.start?.line;

    let line = isDefined(sourceFieldLine) ? sourceFieldLine + 1 : 0;

    item.errors.push(
      new BmError({
        title: ErTitleEnum.BUILD_METRICS_FIELD_GROUP_MUST_HAVE_ONE_TS,
        message: `"${ParameterEnum.BuildMetrics}" "${MPROVE_TAG_FIELD_GROUP}" group "${group.groupName}" must have exactly one field with "_ts" suffix`,
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
