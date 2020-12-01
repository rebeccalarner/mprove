import { helper } from '../../barrels/helper';
import { enums } from '../../barrels/enums';
import { api } from '../../barrels/api';
import { BmError } from '../bm-error';
import { interfaces } from '../../barrels/interfaces';
import { barShared } from '../../barrels/bar-shared';

let func = enums.FuncEnum.CheckDashboardFilterDefaults;

export function checkDashboardFilterDefaults(item: {
  dashboards: interfaces.Dashboard[];
  errors: BmError[];
  structId: string;
  caller: enums.CallerEnum;
}) {
  let { caller, structId } = item;
  helper.log(caller, func, structId, enums.LogTypeEnum.Input, item);

  let newDashboards = barShared.checkVMDFilterDefaults({
    entities: item.dashboards,
    errors: item.errors,
    structId: item.structId,
    caller: item.caller
  });

  helper.log(caller, func, structId, enums.LogTypeEnum.Errors, item.errors);
  helper.log(
    caller,
    func,
    structId,
    enums.LogTypeEnum.Dashboards,
    newDashboards
  );

  return newDashboards;
}
