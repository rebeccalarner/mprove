import { api } from '../../../../barrels/api';
import { helper } from '../../../../barrels/helper';
import { enums } from '../../../../barrels/enums';
import { interfaces } from '../../../../barrels/interfaces';
import { prepareTest } from '../../../../functions/prepare-test';
import { BmError } from '../../../../models/bm-error';
import * as fse from 'fs-extra';

let caller = enums.CallerEnum.BuildYaml;
let func = enums.FuncEnum.CheckTopValues;
let testId = 'e__wrong-hidden';

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
      projectId: 'p1',
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

  expect(errors[0].title).toBe(enums.ErTitleEnum.WRONG_HIDDEN);
  expect(errors[0].lines[0].line).toBe(2);
  expect(errors[1].title).toBe(enums.ErTitleEnum.WRONG_HIDDEN);
  expect(errors[1].lines[0].line).toBe(2);
});
