import path from 'node:path';
import fse from 'fs-extra';
import pIteration from 'p-iteration';
import type { StatusResult } from 'simple-git';

const { forEachSeries } = pIteration;

import { createSimpleGit } from './create-simple-git';
import { validatePathUnderDir } from './validate-path-under-dir';

export async function resetWorkingTreeToHead(item: {
  repoDir: string;
  statusResult?: StatusResult;
}) {
  let { repoDir, statusResult } = item;

  let git = createSimpleGit({ baseDir: repoDir });
  let status = statusResult ?? (await git.status());
  let untrackedPaths = [...status.not_added].sort((a, b) => a.localeCompare(b));

  await git.reset(['--hard', 'HEAD']);

  await forEachSeries(untrackedPaths, async (untrackedPath: string) => {
    let filePath = validatePathUnderDir({
      fullPath: path.resolve(repoDir, untrackedPath),
      allowedDir: repoDir,
      displayPath: untrackedPath
    });

    await fse.remove(filePath);
  });
}
