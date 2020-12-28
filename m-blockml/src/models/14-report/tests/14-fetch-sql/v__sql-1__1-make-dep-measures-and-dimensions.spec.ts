import { api } from '../../../../barrels/api';
import { enums } from '../../../../barrels/enums';
import { interfaces } from '../../../../barrels/interfaces';
import { helper } from '../../../../barrels/helper';
import { prepareTest } from '../../../../functions/prepare-test';
import { BmError } from '../../../../models/bm-error';
import * as fse from 'fs-extra';

let caller = enums.CallerEnum.BuildDashboardReport;
let func = enums.FuncEnum.FetchSql;
let dataDirPart = 'v__sql-1';
let testId = 'v__sql-1__1-make-dep-measures-and-dimensions';

test(testId, async () => {
  let errors: BmError[];
  let entDashboards: interfaces.Dashboard[];

  try {
    let {
      structService,
      traceId,
      structId,
      dataDir,
      fromDir,
      toDir
    } = await prepareTest(caller, func, testId);

    let connection: api.ProjectConnection = {
      name: 'c1',
      type: api.ConnectionTypeEnum.BigQuery
    };

    let dataDirArray = dataDir.split('/');
    dataDirArray[dataDirArray.length - 1] = dataDirPart;
    let newDataDir = dataDirArray.join('/');

    await structService.rebuildStruct({
      traceId: traceId,
      dir: newDataDir,
      structId: structId,
      connections: [connection],
      weekStart: api.ProjectWeekStartEnum.Monday
    });

    errors = await helper.readLog(fromDir, enums.LogTypeEnum.Errors);
    entDashboards = await helper.readLog(fromDir, enums.LogTypeEnum.Entities);
    fse.copySync(fromDir, toDir);
  } catch (e) {
    api.logToConsole(e);
  }

  expect(errors.length).toBe(0);
  expect(entDashboards.length).toBe(1);

  expect(
    entDashboards[0].reports[0].varsSqlSteps.find(
      x => x.func === enums.FuncEnum.MakeDepMeasuresAndDimensions
    )
  ).toEqual({
    func: enums.FuncEnum.MakeDepMeasuresAndDimensions,
    varsInput: {
      select: ['mf.calc3'],
      filters: {}
    },
    varsOutput: {
      depMeasures: {
        mf: {
          mea1: 1
        },
        b: {
          mea1: 1
        }
      },
      depDimensions: {
        mf: {
          dim6: 1,
          dim8: 1
        },
        b: {
          dim6: 1,
          dim8: 1
        }
      }
    }
  });
});