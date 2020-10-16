import { api } from '../barrels/api';
import { disk } from '../barrels/disk';
import { git } from '../barrels/git';
import { constants } from '../barrels/constants';
import { transformAndValidate } from 'class-transformer-validator';

export async function ToDiskGetRepoCatalogNodes(
  request: api.ToDiskGetRepoCatalogNodesRequest
): Promise<api.ToDiskGetRepoCatalogNodesResponse> {
  let requestValid = await transformAndValidate(
    api.ToDiskGetRepoCatalogNodesRequest,
    request
  );
  let { traceId } = requestValid.info;
  let { organizationId, projectId, repoId, branch } = requestValid.payload;

  let orgDir = `${constants.ORGANIZATIONS_PATH}/${organizationId}`;
  let projectDir = `${orgDir}/${projectId}`;
  let repoDir = `${projectDir}/${repoId}`;

  //

  let isOrgExist = await disk.isPathExist(orgDir);
  if (isOrgExist === false) {
    throw Error(api.ErEnum.M_DISK_ORGANIZATION_IS_NOT_EXIST);
  }

  let isProjectExist = await disk.isPathExist(projectDir);
  if (isProjectExist === false) {
    throw Error(api.ErEnum.M_DISK_PROJECT_IS_NOT_EXIST);
  }

  let isRepoExist = await disk.isPathExist(repoDir);
  if (isRepoExist === false) {
    throw Error(api.ErEnum.M_DISK_REPO_IS_NOT_EXIST);
  }

  let isBranchExist = await git.isLocalBranchExist({
    repoDir: repoDir,
    branch: branch
  });
  if (isBranchExist === false) {
    throw Error(api.ErEnum.M_DISK_BRANCH_IS_NOT_EXIST);
  }

  await git.checkoutBranch({
    repoDir: repoDir,
    branchName: branch
  });

  //

  let itemCatalog = <api.ItemCatalog>await disk.getRepoCatalogNodesAndFiles({
    projectId: projectId,
    projectDir: projectDir,
    repoId: repoId,
    readFiles: false
  });

  let response = {
    info: {
      status: api.ToDiskResponseInfoStatusEnum.Ok,
      traceId: traceId
    },
    payload: {
      nodes: itemCatalog.nodes
    }
  };

  return response;
}
