import { Command, Option } from 'clipanion';

import deepEqual from 'fast-deep-equal';
import { ApiKeyTypeEnum } from '#common/enums/api-key-type.enum';
import { ErEnum } from '#common/enums/er.enum';
import { LogLevelEnum } from '#common/enums/log-level.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { getBuilderUrl } from '#common/functions/get-builder-url';
import { isDefined } from '#common/functions/is-defined';
import { isUndefined } from '#common/functions/is-undefined';
import { mapBmlErrorsToMproveValidationErrors } from '#common/functions/map-bml-errors-to-mprove-validation-errors';
import { ServerError } from '#common/models/server-error';
import type {
  ToBackendSyncRepoRequestPayload,
  ToBackendSyncRepoResponse
} from '#common/zod/to-backend/repos/to-backend-sync-repo';
import { getConfig } from '#mcli/config/get.config';
import { logToConsoleMcli } from '#mcli/functions/log-to-console-mcli';
import { mreq } from '#mcli/functions/mreq';
import { CustomCommand } from '#mcli/models/custom-command';
import { applySyncPayload } from '#node-common/functions/apply-sync-payload';
import { createSimpleGit } from '#node-common/functions/create-simple-git';
import { getChangesToCommit } from '#node-common/functions/get-changes-to-commit';
import { getSyncAppliedChanges } from '#node-common/functions/get-sync-applied-changes';
import { getWorkingTreePayload } from '#node-common/functions/get-sync-files';
import { resetWorkingTreeToHead } from '#node-common/functions/reset-working-tree-to-head';

export class SyncCommand extends CustomCommand {
  static paths = [['sync']];

  static usage = Command.Usage({
    description:
      'Synchronize uncommitted changes in one direction, replacing the destination working tree diff from HEAD',
    examples: [
      [
        'Upload local uncommitted changes to the server working tree',
        'mprove sync --project-id DXYE72ODCP5LWPWH2EXQ --env prod'
      ],
      [
        'Download server uncommitted changes and overwrite the local working tree',
        'mprove sync --project-id DXYE72ODCP5LWPWH2EXQ --env prod --from-server'
      ]
    ]
  });

  projectId = Option.String('--project-id', {
    description: '(required) Project Id'
  });

  env = Option.String('--env', 'prod', {
    description: '(default "prod") Environment'
  });

  localPath = Option.String('--local-path', {
    description:
      '(optional, if not specified then the current working directory is used) Absolute path of local git repository'
  });

  fromServer = Option.Boolean('--from-server', false, {
    description:
      '(default false) if set, then server uncommitted changes overwrite local uncommitted changes'
  });

  getRepo = Option.Boolean('--get-repo', false, {
    description: '(default false), show repo in output'
  });

  getRepoNodes = Option.Boolean('--get-repo-nodes', false, {
    description: '(default false), show repo nodes in output'
  });

  getErrors = Option.Boolean('--get-errors', false, {
    description: '(default false), show validation errors in output'
  });

  json = Option.Boolean('--json', false, {
    description: '(default false)'
  });

  debug = Option.Boolean('--debug', false, {
    description: '(default false) add debug to output'
  });

  envFilePath = Option.String('--env-file-path', {
    description: '(optional) Path to ".env" file'
  });

  async execute() {
    if (isUndefined(this.context.config)) {
      this.context.config = getConfig(this.envFilePath);
    }

    this.projectId = this.projectId || this.context.config.mproveCliProjectId;

    if (isUndefined(this.projectId)) {
      let serverError = new ServerError({
        message: ErEnum.MCLI_PROJECT_ID_IS_NOT_DEFINED,
        originalError: null
      });
      throw serverError;
    }

    let repoDir = isDefined(this.localPath) ? this.localPath : process.cwd();

    let git = createSimpleGit({ baseDir: repoDir });

    let branchSummary = await git.branch();
    let currentBranchName = branchSummary.current;

    let logResult = await git.log(['-1']);
    let lastCommit = logResult.latest?.hash;

    let statusResult = await git.status();
    let localPayload =
      this.fromServer === true
        ? { changedFiles: [], deletedFiles: [] }
        : await getWorkingTreePayload({
            repoDir: repoDir,
            statusResult: statusResult
          });

    let changedFiles = localPayload.changedFiles;
    let deletedFiles = localPayload.deletedFiles;

    let apiKey = this.context.config.mproveCliApiKey;

    let repoId = apiKey.startsWith(`${ApiKeyTypeEnum.SK}-`)
      ? apiKey.split('-')[2].toLowerCase()
      : apiKey.split('-')[2];

    let syncRepoReqPayload: ToBackendSyncRepoRequestPayload;
    if (this.fromServer === true) {
      syncRepoReqPayload = {
        direction: 'from-server',
        projectId: this.projectId,
        repoId: repoId,
        branchId: currentBranchName,
        envId: this.env,
        lastCommit: lastCommit
      };
    } else {
      syncRepoReqPayload = {
        direction: 'to-server',
        projectId: this.projectId,
        repoId: repoId,
        branchId: currentBranchName,
        envId: this.env,
        lastCommit: lastCommit,
        changedFiles: changedFiles,
        deletedFiles: deletedFiles
      };
    }

    let syncRepoResp = await mreq<ToBackendSyncRepoResponse>({
      apiKey: this.context.config.mproveCliApiKey,
      pathInfoName: ToBackendRequestInfoNameEnum.ToBackendSyncRepo,
      payload: syncRepoReqPayload,
      host: this.context.config.mproveCliHost
    });

    let appliedChangesOnLocal: string[] = [];
    let appliedChangesOnServer: string[] = [];

    if (syncRepoResp.payload.direction === 'from-server') {
      appliedChangesOnLocal = await getSyncAppliedChanges({
        repoDir: repoDir,
        changedFiles: syncRepoResp.payload.changedFiles,
        deletedFiles: syncRepoResp.payload.deletedFiles,
        statusResult: statusResult
      });
      await resetWorkingTreeToHead({
        repoDir: repoDir,
        statusResult: statusResult
      });
      await applySyncPayload({
        repoDir: repoDir,
        changedFiles: syncRepoResp.payload.changedFiles,
        deletedFiles: syncRepoResp.payload.deletedFiles
      });
    } else {
      appliedChangesOnServer = syncRepoResp.payload.appliedChangesOnServer;
    }

    //

    let localChangesToCommit = await getChangesToCommit({
      repoDir: repoDir,
      addContent: true,
      expandRenamed: true
    });

    let devChangesToCommit = syncRepoResp.payload.repo.changesToCommit;
    let syncSuccess = deepEqual(localChangesToCommit, devChangesToCommit);

    if (syncSuccess === false) {
      logToConsoleMcli({
        log: {
          localChangesToCommit: localChangesToCommit,
          devChangesToCommit: devChangesToCommit
        },
        logLevel: LogLevelEnum.Info,
        context: this.context,
        isJson: this.json
      });

      let serverError = new ServerError({
        message: ErEnum.MCLI_SYNC_FAILED
      });
      throw serverError;
    }

    let builderUrl = getBuilderUrl({
      host: this.context.config.mproveCliHost,
      orgId: syncRepoResp.payload.repo.orgId,
      projectId: this.projectId,
      repoId: syncRepoResp.payload.repo.repoId,
      branch: currentBranchName,
      env: this.env
    });

    let log: any = {
      message: `Sync completed`,
      appliedChangesOnLocal: appliedChangesOnLocal,
      appliedChangesOnServer: appliedChangesOnServer,
      validationErrorsTotal: syncRepoResp.payload.struct.errors.length
    };

    if (this.getRepo === true) {
      let repo = syncRepoResp.payload.repo;

      if (this.getRepoNodes === false) {
        delete repo.nodes;
      }

      delete repo.changesToCommit;
      delete repo.changesToPush;

      log.repo = repo;
    }

    if (this.getErrors === true) {
      log.validationErrors = mapBmlErrorsToMproveValidationErrors({
        errors: syncRepoResp.payload.struct.errors
      });
    }

    if (this.debug === true) {
      log.debug = {
        fromServer: this.fromServer,
        changedFiles: changedFiles,
        deletedFiles: deletedFiles,
        responseChangedFiles:
          syncRepoResp.payload.direction === 'from-server'
            ? syncRepoResp.payload.changedFiles
            : [],
        responseDeletedFiles:
          syncRepoResp.payload.direction === 'from-server'
            ? syncRepoResp.payload.deletedFiles
            : [],
        localChangesToCommit: localChangesToCommit,
        devChangesToCommit: devChangesToCommit,
        needValidate: syncRepoResp.payload.needValidate,
        structId: syncRepoResp.payload.struct.structId
      };
    }

    log.url = builderUrl;

    logToConsoleMcli({
      log: log,
      logLevel: LogLevelEnum.Info,
      context: this.context,
      isJson: this.json
    });
  }
}
