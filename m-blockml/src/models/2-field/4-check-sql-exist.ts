import { enums } from '../../barrels/enums';
import { interfaces } from '../../barrels/interfaces';
import { helper } from '../../barrels/helper';
import { vmdType } from './_vmd-type';
import { BmError } from '../bm-error';

let func = enums.FuncEnum.CheckSqlExist;

export function checkSqlExist<T extends vmdType>(item: {
  entities: Array<T>;
  errors: BmError[];
  structId: string;
  caller: enums.CallerEnum;
}) {
  let { caller, structId } = item;
  helper.log(caller, func, structId, enums.LogTypeEnum.Input, item);

  let newEntities: T[] = [];

  item.entities.forEach(x => {
    let errorsOnStart = item.errors.length;
    let newFields: interfaces.FieldAny[] = [];

    x.fields.forEach(field => {
      if (field.fieldClass === enums.FieldClassEnum.Filter) {
        if (helper.isDefined(field.sql)) {
          item.errors.push(
            new BmError({
              title: enums.ErTitleEnum.UNEXPECTED_SQL_IN_FILTER,
              message: `parameter "${enums.ParameterEnum.Sql}" can not be used with ${enums.FieldClassEnum.Filter} field`,
              lines: [
                {
                  line: field.sql_line_num,
                  name: x.fileName,
                  path: x.filePath
                }
              ]
            })
          );
          return;
        } else {
          // just for fields deps logic
          field.sql = '';
          field.sql_line_num = 0;
        }
      } else if (
        helper.isUndefined(field.sql) &&
        [
          enums.FieldClassEnum.Dimension,
          enums.FieldClassEnum.Time,
          enums.FieldClassEnum.Measure,
          enums.FieldClassEnum.Calculation
        ].indexOf(field.fieldClass) > -1
      ) {
        item.errors.push(
          new BmError({
            title: enums.ErTitleEnum.MISSING_SQL,
            message: `parameter "${enums.ParameterEnum.Sql}" is required for "${field.fieldClass}"`,
            lines: [
              {
                line: field.name_line_num,
                name: x.fileName,
                path: x.filePath
              }
            ]
          })
        );
        return;
      }

      newFields.push(field);
    });

    let errorsOnEnd = item.errors.length;
    if (errorsOnStart === errorsOnEnd) {
      x.fields = newFields;
      newEntities.push(x);
    }
  });

  helper.log(caller, func, structId, enums.LogTypeEnum.Errors, item.errors);
  helper.log(caller, func, structId, enums.LogTypeEnum.Entities, newEntities);

  return item.entities;
}