import { interfaces } from '../../barrels/interfaces';
import { enums } from '../../barrels/enums';
import { constants } from '../../barrels/constants';
import { api } from '../../barrels/api';
import { helper } from '../../barrels/helper';

let func = enums.FuncEnum.SubMakeWith;

export function subMakeWith(item: {
  needsAll: interfaces.VarsSub['needsAll'];
  varsSubSteps: interfaces.ViewPart['varsSubSteps'];
  view: interfaces.View;
}) {
  let { needsAll, varsSubSteps, view } = item;

  let varsInput: interfaces.VarsSub = helper.makeCopy({ needsAll });

  let connection = view.connection;
  let myWith: interfaces.VarsSub['myWith'] = [];
  let table: string;

  if (helper.isDefined(view.table)) {
    if (connection.type === api.ConnectionTypeEnum.BigQuery) {
      table = '`' + view.table + '`';
    } else if (connection.type === api.ConnectionTypeEnum.PostgreSQL) {
      table = view.table;
    }
  } else {
    let derivedSqlArray = view.derived_table.split('\n');

    table = view.name + constants.DERIVED_TABLE_SUFFIX;

    myWith.push(`  ${table} AS (`);
    myWith = myWith.concat(derivedSqlArray.map(s => `    ${s}`));
    myWith.push('  ),');
  }

  let flats: { [s: string]: number } = {};

  myWith.push(`  ${view.name}${constants.VIEW_START_SUFFIX} AS (`);
  myWith.push(`    ${constants.SELECT}`);

  let i = 0;

  Object.keys(needsAll).forEach(fieldName => {
    let field = view.fields.find(viewField => viewField.name === fieldName);

    if (field.fieldClass === api.FieldClassEnum.Dimension) {
      if (helper.isDefined(field.unnest)) {
        flats[field.unnest] = 1;
      }

      // no need to remove ${ } (no singles or doubles exists in _real of view dimensions)
      let sqlSelect = field.sqlReal;
      myWith.push(`      ${sqlSelect} as ${fieldName},`);
      i++;
    }
  });

  if (i === 0) {
    myWith.push(`      1 as ${constants.NO_FIELDS_SELECTED},`);
  }

  // chop
  let lastIndex = myWith.length - 1;
  myWith[lastIndex] = myWith[lastIndex].slice(0, -1);

  myWith.push(`    ${constants.FROM} ${table}`);

  Object.keys(flats).forEach(flat => {
    myWith.push(`      ${flat}`);
  });

  myWith.push('  ),');

  let varsOutput: interfaces.VarsSub = { myWith };

  varsSubSteps.push({ func, varsInput, varsOutput });

  return varsOutput;
}