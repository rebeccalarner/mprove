import { interfaces } from '../../barrels/interfaces';
import { helper } from '../../barrels/helper';
import { enums } from '../../barrels/enums';
import { constants } from '../../barrels/constants';
import { api } from '../../barrels/api';

let func = enums.FuncEnum.MakeNeedsDoubles;

export function makeNeedsDoubles(item: {
  selected: interfaces.VarsSql['selected'];
  filters: interfaces.VarsSql['filters'];
  varsSqlElements: interfaces.Report['varsSqlElements'];
  model: interfaces.Model;
}) {
  let { selected, filters, varsSqlElements, model } = item;

  let varsSqlInput: interfaces.VarsSql = helper.makeCopy({
    selected,
    filters
  });

  let needsDoubles: interfaces.VarsSql['needsDoubles'] = {};

  let whereDoubleDeps: { [s: string]: number } = {};
  let whereCalcDoubleDeps: { [s: string]: number } = {};
  let whereCalcDeps: { [s: string]: number } = {};

  // pick double deps from sqlAlwaysWhere
  Object.keys(model.sqlAlwaysWhereDoubleDepsAfterSingles).forEach(as => {
    Object.keys(model.sqlAlwaysWhereDoubleDepsAfterSingles[as]).forEach(dep => {
      let f = `${as}.${dep}`;
      whereDoubleDeps[f] = 1;
    });
  });

  // pick double deps from sqlAlwaysWhereCalc
  Object.keys(model.sqlAlwaysWhereCalcDoubleDepsAfterSingles).forEach(as => {
    Object.keys(model.sqlAlwaysWhereCalcDoubleDepsAfterSingles[as]).forEach(
      dep => {
        let f = `${as}.${dep}`;
        whereCalcDoubleDeps[f] = 1;
      }
    );
  });

  // pick deps from sqlAlwaysWhereCalc
  Object.keys(model.sqlAlwaysWhereCalcDepsAfterSingles).forEach(dep => {
    let f = `${constants.MF}.${dep}`;
    whereCalcDeps[f] = 1;
  });

  // unique
  let elements = [
    ...new Set([
      ...Object.keys(selected),
      ...Object.keys(filters),
      ...Object.keys(whereDoubleDeps),
      ...Object.keys(whereCalcDoubleDeps),
      ...Object.keys(whereCalcDeps)
    ])
  ];

  elements.forEach(element => {
    let reg = api.MyRegex.CAPTURE_DOUBLE_REF_WITHOUT_BRACKETS_G();
    let r = reg.exec(element);

    let aName = r[1];
    let fName = r[2];

    if (!needsDoubles[aName]) {
      needsDoubles[aName] = {};
    }
    needsDoubles[aName][fName] = 1;
  });

  if (needsDoubles[constants.MF]) {
    // pick deps for all model fields
    Object.keys(needsDoubles[constants.MF]).forEach(fieldName => {
      Object.keys(model.fieldsDepsAfterSingles[fieldName]).forEach(dep => {
        needsDoubles[constants.MF][dep] = 1;
      });
    });

    // pick double deps for all model fields
    Object.keys(needsDoubles[constants.MF]).forEach(fieldName => {
      Object.keys(model.fieldsDoubleDepsAfterSingles[fieldName]).forEach(
        alias => {
          Object.keys(
            model.fieldsDoubleDepsAfterSingles[fieldName][alias]
          ).forEach(dep => {
            if (!needsDoubles[alias]) {
              needsDoubles[alias] = {};
            }
            needsDoubles[alias][dep] = 1;
          });
        }
      );
    });
  }

  // pick deps for all view fields
  Object.keys(needsDoubles)
    .filter(a => a !== constants.MF)
    .forEach(asName => {
      Object.keys(needsDoubles[asName]).forEach(fieldName => {
        let join = model.joins.find(j => j.as === asName);

        Object.keys(join.view.fieldsDepsAfterSingles[fieldName]).forEach(
          dep => {
            needsDoubles[asName][dep] = 1;
          }
        );
      });
    });

  let output: interfaces.VarsSql = { needsDoubles };

  varsSqlElements.push({
    func: func,
    varsSqlInput: varsSqlInput,
    varsSqlOutput: output
  });

  return output;
}