import { api } from '../../../../barrels/api';
import { enums } from '../../../../barrels/enums';
import { interfaces } from '../../../../barrels/interfaces';
import { helper } from '../../../../barrels/helper';
import { prepareTest } from '../../../../functions/prepare-test';
import { BmError } from '../../../../models/bm-error';
import * as fse from 'fs-extra';

let caller = enums.CallerEnum.BuildReport;
let func = enums.FuncEnum.CheckSelectForceDims;
let testId = 'v__1';

test(testId, async () => {
  let errors: BmError[];
  let dashboards: interfaces.Dashboard[];

  try {
    let {
      structService,
      structId,
      dataDir,
      fromDir,
      toDir
    } = await prepareTest(caller, func, testId);

    let connection: api.ProjectConnection = {
      name: 'c1',
      type: api.ConnectionTypeEnum.BigQuery
    };

    await structService.rebuildStruct({
      dir: dataDir,
      structId: structId,
      projectId: 'p1',
      connections: [connection],
      weekStart: api.ProjectWeekStartEnum.Monday
    });

    errors = await helper.readLog(fromDir, enums.LogTypeEnum.Errors);
    dashboards = await helper.readLog(fromDir, enums.LogTypeEnum.Ds);
    fse.copySync(fromDir, toDir);
  } catch (e) {
    api.logToConsole(e);
  }

  expect(errors.length).toBe(0);
  expect(dashboards.length).toBe(1);

  expect(dashboards[0].reports[0].selectWithForceDims).toStrictEqual([
    'a.calc1',
    'mf.calc10',
    'a.dim1',
    'mf.dim10'
  ]);
});
