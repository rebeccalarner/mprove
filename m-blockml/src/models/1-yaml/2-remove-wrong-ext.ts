import { interfaces } from '../../barrels/interfaces';
import { api } from '../../barrels/api';
import { BmError } from '../bm-error';
import { helper } from '../../barrels/helper';
import { enums } from '../../barrels/enums';

let logPack = '1-yaml';
let logFolder = '2-remove-wrong-ext';

export function removeWrongExt(item: {
  files: api.File[];
  errors: BmError[];
  structId: string;
}): interfaces.File2[] {
  let logId = item.structId;
  helper.log(logId, logPack, logFolder, enums.LogEnum.Input, item);

  let file2s: interfaces.File2[] = [];

  item.files.forEach((x: api.File) => {
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
        api.FileExtensionEnum.Visualization,
        api.FileExtensionEnum.Udf,
        api.FileExtensionEnum.Md
      ].indexOf(ext) > -1
    ) {
      let f: interfaces.File2 = file2s.find(z => z.name === x.name);

      if (f) {
        f.pathContents.push(fp);
      } else {
        file2s.push({
          name: x.name,
          pathContents: [fp],
          ext: ext
        });
      }
    } else {
      item.errors.push(
        new BmError({
          title: enums.ErTitleEnum.WRONG_FILE_EXTENSION,
          message: `valid BlockML file extensions are: ${api.FileExtensionEnum.View} ${api.FileExtensionEnum.Model} ${api.FileExtensionEnum.Dashboard} ${api.FileExtensionEnum.Visualization} ${api.FileExtensionEnum.Udf} ${api.FileExtensionEnum.Md}`,
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

  helper.log(logId, logPack, logFolder, enums.LogEnum.File2s, file2s);
  helper.log(logId, logPack, logFolder, enums.LogEnum.Errors, item.errors);

  return file2s;
}