import { forEachSeries } from 'p-iteration';

import { interfaces } from '../../barrels/interfaces';
import { api } from '../../barrels/api';
import { BmError } from '../bm-error';
import { helper } from '../../barrels/helper';
import { enums } from '../../barrels/enums';

let logPack = '1-yaml';
let logFolder = '2-remove-wrong-ext';

export async function removeWrongExt(item: {
  files: api.File[];
  errors: BmError[];
  structId: string;
}): Promise<interfaces.File2[]> {
  let logId = item.structId;
  helper.log(logId, logPack, logFolder, enums.LogEnum.In, item);

  let file2s: interfaces.File2[] = [];

  await forEachSeries(item.files, async (x: api.File) => {
    let fp = {
      path: x.path,
      content: x.content
    };

    let reg = api.MyRegex.CAPTURE_EXT();
    let r = reg.exec(x.name.toLowerCase());

    let ext: any = r ? r[1] : ''; // any

    if (
      [
        api.FileExtensionEnum.View,
        api.FileExtensionEnum.Model,
        api.FileExtensionEnum.Dashboard,
        api.FileExtensionEnum.Vis,
        api.FileExtensionEnum.Udf,
        api.FileExtensionEnum.Md
      ].indexOf(ext) > -1
    ) {
      let f: interfaces.File2 = file2s.find(z => z.name === x.name);

      if (f) {
        f.filePaths.push(fp);
      } else {
        file2s.push({
          name: x.name,
          filePaths: [fp],
          ext: ext
        });
      }
    } else {
      // error e1
      item.errors.push(
        new BmError({
          title: enums.ErTitleEnum.WRONG_FILE_EXTENSION,
          message: `valid BlockML file extensions are: ${api.FileExtensionEnum.View} ${api.FileExtensionEnum.Model} ${api.FileExtensionEnum.Dashboard} ${api.FileExtensionEnum.Vis} ${api.FileExtensionEnum.Udf} ${api.FileExtensionEnum.Md}`,
          lines: [
            {
              line: 0,
              name: x.name,
              path: x.path
            }
          ]
        })
      );
    }
  });

  helper.log(logId, logPack, logFolder, enums.LogEnum.OutFile2s, file2s);
  helper.log(logId, logPack, logFolder, enums.LogEnum.OutErrors, item.errors);

  return file2s;
}
