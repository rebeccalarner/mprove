import { helper } from '../../barrels/helper';
import { enums } from '../../barrels/enums';
import { api } from '../../barrels/api';
import { BmError } from '../bm-error';
import { interfaces } from '../../barrels/interfaces';
import { constants } from '../../barrels/constants';

let func = enums.FuncEnum.AwcSubstituteRefs;

export function awcSubstituteRefs(item: {
  models: interfaces.Model[];
  errors: BmError[];
  structId: string;
  caller: enums.CallerEnum;
}) {
  let { caller, structId } = item;
  helper.log(caller, func, structId, enums.LogTypeEnum.Input, item);

  item.models.forEach(x => {
    x.sqlAlwaysWhereCalcForceDims = {};
    x.sqlAlwaysWhereCalcDepsAfterSingles = {};
    x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions = {};

    if (helper.isUndefined(x.sql_always_where_calc)) {
      return;
    }

    let sqlAlwaysWhereCalcReal = x.sql_always_where_calc;

    // substitute SINGLE calculations
    let restartSingles = true;

    while (restartSingles) {
      restartSingles = false;

      let reg = api.MyRegex.CAPTURE_SINGLE_REF_G(); // g works because of restart
      let r;

      while ((r = reg.exec(sqlAlwaysWhereCalcReal))) {
        let fieldName = r[1];
        let referenceField = x.fields.find(f => f.name === fieldName);

        switch (true) {
          case referenceField.fieldClass === enums.FieldClassEnum.Calculation: {
            // referenceField.sqlReal
            // ${calc1}   >>>   (${dim2} + ${b.order_items_total} + ${mea1})
            sqlAlwaysWhereCalcReal = api.MyRegex.replaceSingleRefs(
              sqlAlwaysWhereCalcReal,
              fieldName,
              referenceField.sqlReal
            );

            restartSingles = true;
            break;
          }

          case referenceField.fieldClass === enums.FieldClassEnum.Dimension: {
            x.sqlAlwaysWhereCalcDepsAfterSingles[fieldName] =
              x.sql_always_where_calc_line_num;

            if (
              helper.isUndefined(x.sqlAlwaysWhereCalcForceDims[constants.MF])
            ) {
              x.sqlAlwaysWhereCalcForceDims[constants.MF] = {};
            }

            x.sqlAlwaysWhereCalcForceDims[constants.MF][fieldName] =
              x.sql_always_where_calc_line_num;

            break;
          }

          case referenceField.fieldClass === enums.FieldClassEnum.Measure: {
            x.sqlAlwaysWhereCalcDepsAfterSingles[fieldName] =
              x.sql_always_where_calc_line_num;
            break;
          }
        }
      }
    }

    // substitute DOUBLE calculations
    let restart2 = true;

    while (restart2) {
      restart2 = false;

      let reg2 = api.MyRegex.CAPTURE_DOUBLE_REF_G(); // g works because of restart
      let r2;

      while ((r2 = reg2.exec(sqlAlwaysWhereCalcReal))) {
        let asName = r2[1];
        let depName = r2[2];

        let join = x.joins.find(j => j.as === asName);

        let depField = join.view.fields.find(f => f.name === depName);

        switch (true) {
          case depField.fieldClass === enums.FieldClassEnum.Calculation: {
            sqlAlwaysWhereCalcReal = api.MyRegex.replaceAndConvert(
              sqlAlwaysWhereCalcReal,
              depField.sqlReal,
              asName,
              depName
            );

            restart2 = true;
            break;
          }

          case depField.fieldClass === enums.FieldClassEnum.Dimension: {
            if (
              helper.isUndefined(
                x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions[asName]
              )
            ) {
              x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions[asName] = {};
            }
            x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions[asName][depName] =
              x.sql_always_where_calc_line_num;

            if (helper.isUndefined(x.sqlAlwaysWhereCalcForceDims[asName])) {
              x.sqlAlwaysWhereCalcForceDims[asName] = {};
            }
            x.sqlAlwaysWhereCalcForceDims[asName][depName] =
              x.sql_always_where_calc_line_num;

            break;
          }

          case depField.fieldClass === enums.FieldClassEnum.Measure: {
            if (
              helper.isUndefined(
                x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions[asName]
              )
            ) {
              x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions[asName] = {};
            }
            x.sqlAlwaysWhereCalcDoubleDepsAfterSubstitutions[asName][depName] =
              x.sql_always_where_calc_line_num;
            break;
          }
        }
      }
    }

    x.sqlAlwaysWhereCalcReal = sqlAlwaysWhereCalcReal;
  });

  helper.log(caller, func, structId, enums.LogTypeEnum.Errors, item.errors);
  helper.log(caller, func, structId, enums.LogTypeEnum.Models, item.models);

  return item.models;
}
