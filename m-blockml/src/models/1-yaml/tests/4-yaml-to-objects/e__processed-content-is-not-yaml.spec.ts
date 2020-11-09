import { Test, TestingModule } from '@nestjs/testing';
import { StructService } from '../../../../services/struct.service';
import { api } from '../../../../barrels/api';
import { enums } from '../../../../barrels/enums';
import * as fse from 'fs-extra';
import { interfaces } from '../../../../barrels/interfaces';

let pack = '1-yaml';
let funcId = '4-yaml-to-objects';
let testId = 'e__processed-content-is-not-yaml';

let structService: StructService;

beforeEach(async () => {
  let moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [],
    providers: [StructService]
  }).compile();

  structService = moduleRef.get<StructService>(StructService);
});

test(testId, async () => {
  let filesAny: any[];
  let errors: interfaces.BmErrorC[];
  try {
    let structId = api.makeStructId();

    await structService.rebuildStruct({
      dir: `src/models/${pack}/data/${funcId}/${testId}`,
      structId: structId,
      projectId: 'p1',
      connections: [],
      weekStart: api.ProjectWeekStartEnum.Monday
    });

    let outFilesAny = fse.readFileSync(
      `src/logs/${structId}/${pack}/${funcId}/${enums.LogEnum.FilesAny.toString()}`
    );

    let outErrors = fse.readFileSync(
      `src/logs/${structId}/${pack}/${funcId}/${enums.LogEnum.Errors.toString()}`
    );

    filesAny = JSON.parse(outFilesAny.toString());

    errors = ((await api.transformValidString({
      classType: interfaces.BmErrorC,
      jsonString: outErrors.toString(),
      errorMessage: api.ErEnum.M_BLOCKML_WRONG_TEST_TRANSFORM_AND_VALIDATE
    })) as unknown) as interfaces.BmErrorC[];
  } catch (e) {
    api.logToConsole(e);
  }

  // no case for PROCESSED_CONTENT_IS_NOT_YAML yet
  expect(filesAny.length).toBe(1);
  expect(errors.length).toBe(0);
});
