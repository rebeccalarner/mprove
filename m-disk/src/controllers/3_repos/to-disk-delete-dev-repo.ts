import { api } from '../../barrels/api';
import { disk } from '../../barrels/disk';
import { git } from '../../barrels/git';
import { constants } from '../../barrels/constants';
import { interfaces } from '../../barrels/interfaces';

export async function ToDiskDeleteDevRepo(
  request: api.ToDiskDeleteDevRepoRequest
): Promise<api.ToDiskDeleteDevRepoResponse> {
  let requestValid = await api.transformValid({
    classType: api.ToDiskDeleteDevRepoRequest,
    object: request,
    errorMessage: api.ErEnum.M_DISK_WRONG_REQUEST_PARAMS
  });

  let { traceId } = requestValid.info;
  let { organizationId, projectId, devRepoId } = requestValid.payload;

  let orgDir = `${constants.ORGANIZATIONS_PATH}/${organizationId}`;
  let projectDir = `${orgDir}/${projectId}`;
  let devRepoDir = `${projectDir}/${devRepoId}`;

  //

  let isOrgExist = await disk.isPathExist(orgDir);
  if (isOrgExist === false) {
    throw Error(api.ErEnum.M_DISK_ORGANIZATION_IS_NOT_EXIST);
  }

  let isProjectExist = await disk.isPathExist(projectDir);
  if (isProjectExist === false) {
    throw Error(api.ErEnum.M_DISK_PROJECT_IS_NOT_EXIST);
  }

  let isDevRepoExist = await disk.isPathExist(devRepoDir);
  if (isDevRepoExist === false) {
    throw Error(api.ErEnum.M_DISK_REPO_IS_NOT_EXIST);
  }

  //

  await disk.removePath(devRepoDir);

  let response: api.ToDiskDeleteDevRepoResponse = {
    info: {
      status: api.ResponseInfoStatusEnum.Ok,
      traceId: traceId
    },
    payload: {
      organizationId: organizationId,
      projectId: projectId,
      deletedRepoId: devRepoId
    }
  };

  return response;
}
