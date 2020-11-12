import { api } from '../../../../barrels/api';
import { enums } from '../../../../barrels/enums';
import { prepareTest } from '../../../../functions/prepare-test';
import { helper } from '../../../../barrels/helper';

let pack = '1-yaml';
let func = '1-collect-files';
let testId = 'v__files-length';

test(testId, async () => {
  let files: api.File[];

  try {
    let { structService, structId, dataDir, logPath } = await prepareTest(
      pack,
      func,
      testId
    );

    await structService.rebuildStruct({
      dir: dataDir,
      structId: structId,
      projectId: 'p1',
      connections: [],
      weekStart: api.ProjectWeekStartEnum.Monday
    });

    files = await helper.readLog(logPath, enums.LogEnum.Files);
  } catch (e) {
    api.logToConsole(e);
  }

  expect(files.length).toBe(5);
});
