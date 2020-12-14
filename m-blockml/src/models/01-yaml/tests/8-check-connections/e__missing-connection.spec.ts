import { api } from '../../../../barrels/api';
import { helper } from '../../../../barrels/helper';
import { enums } from '../../../../barrels/enums';
import { interfaces } from '../../../../barrels/interfaces';
import { prepareTest } from '../../../../functions/prepare-test';
import { BmError } from '../../../../models/bm-error';
import * as fse from 'fs-extra';

let caller = enums.CallerEnum.BuildYaml;
let func = enums.FuncEnum.CheckConnections;
let testId = 'e__missing-connection';

test(testId, async () => {
  let errors: BmError[];
  let filesAny: any[];

  try {
    let {
      structService,
      structId,
      dataDir,
      fromDir,
      toDir
    } = await prepareTest(caller, func, testId);

    await structService.rebuildStruct({
      dir: dataDir,
      structId: structId,
      connections: [],
      weekStart: api.ProjectWeekStartEnum.Monday
    });

    errors = await helper.readLog(fromDir, enums.LogTypeEnum.Errors);
    filesAny = await helper.readLog(fromDir, enums.LogTypeEnum.FilesAny);
    fse.copySync(fromDir, toDir);
  } catch (e) {
    api.logToConsole(e);
  }

  expect(errors.length).toBe(2);
  expect(filesAny.length).toBe(0);

  expect(errors[0].title).toBe(enums.ErTitleEnum.MISSING_CONNECTION);
  expect(errors[0].lines[0].line).toBe(0);
  expect(errors[1].title).toBe(enums.ErTitleEnum.MISSING_CONNECTION);
  expect(errors[1].lines[0].line).toBe(0);
});
