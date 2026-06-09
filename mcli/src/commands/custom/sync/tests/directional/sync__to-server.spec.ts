import { expect, test } from 'bun:test';
import assert from 'node:assert/strict';
import retry from 'async-retry';
import fse from 'fs-extra';
import { BRANCH_MAIN, PROJECT_ENV_PROD } from '#common/constants/top';
import { MCLI_E2E_RETRY_OPTIONS } from '#common/constants/top-mcli';
import { ConnectionTypeEnum } from '#common/enums/connection-type.enum';
import { LogLevelEnum } from '#common/enums/log-level.enum';
import { ProjectRemoteTypeEnum } from '#common/enums/project-remote-type.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { makeId } from '#common/functions/make-id';
import type {
  ToBackendSaveFileRequestPayload,
  ToBackendSaveFileResponse
} from '#common/zod/to-backend/files/to-backend-save-file';
import type { ToBackendCloneTestRepoResponse } from '#common/zod/to-backend/test-routes/to-backend-clone-test-repo';
import { getConfig } from '#mcli/config/get.config';
import { getTestLoginToken } from '#mcli/functions/get-test-login-token';
import { logToConsoleMcli } from '#mcli/functions/log-to-console-mcli';
import { makeTestApiKey } from '#mcli/functions/make-test-api-key';
import { mreq } from '#mcli/functions/mreq';
import { prepareTest } from '#mcli/functions/prepare-test';
import type { CustomContext } from '#mcli/models/custom-command';
import { SyncCommand } from '../../sync';

test('normal sync uploads local changes and overwrites server changes', async () => {
  let testId = 'mcli_sync__to-server';
  let isPass = false;
  let context: CustomContext;

  await retry(async () => {
    let item = await prepareSyncTest({ testId: testId });

    let {
      cli,
      mockContext,
      config,
      projectId,
      repoPath,
      userId,
      email,
      password
    } = item;

    context = mockContext as any;

    let loginToken = await getTestLoginToken({
      email: email,
      password: password,
      host: config.mproveCliHost
    });

    await saveServerReadme({
      apiKey: loginToken,
      host: config.mproveCliHost,
      projectId: projectId,
      repoId: userId,
      content: 'server stale content'
    });

    await fse.writeFile(`${repoPath}/README.md`, 'local source content');
    await fse.writeFile(`${repoPath}/sync-local-added.txt`, 'local added');

    let code = await cli.run(
      [
        'sync',
        '--project-id',
        projectId,
        '--env',
        PROJECT_ENV_PROD,
        '--local-path',
        repoPath,
        '--json',
        '--debug'
      ],
      context
    );
    let parsedOutput = JSON.parse(context.stdout.toString());

    assert.equal(code, 0, 'sync exits successfully');
    assert.deepEqual(parsedOutput.appliedChangesOnLocal, []);
    assert.deepEqual(parsedOutput.appliedChangesOnServer, [
      '(modified) README.md',
      '(new) sync-local-added.txt'
    ]);
    assert.equal(parsedOutput.debug.fromServer, false);
    assert.equal(parsedOutput.debug.lastSyncTime, undefined);
    assert.equal(parsedOutput.debug.syncTime, undefined);
    assert.equal(
      hasChangeContent({
        changes: parsedOutput.debug.devChangesToCommit,
        fileName: 'README.md',
        content: 'local source content'
      }),
      true,
      'server diff contains local readme content'
    );
    assert.equal(
      hasChangeContent({
        changes: parsedOutput.debug.devChangesToCommit,
        fileName: 'sync-local-added.txt',
        content: 'local added'
      }),
      true,
      'server diff contains local added file'
    );

    isPass = true;
  }, MCLI_E2E_RETRY_OPTIONS).catch((er: any) => {
    logFailure({ context: context, error: er });
  });

  expect(isPass).toBe(true);
});

async function prepareSyncTest(item: { testId: string }) {
  let { testId } = item;
  let config = getConfig();
  let repoPath = `${config.mproveCliTestReposPath}/${testId}`;
  let orgId = `t${testId}`;

  await mreq<ToBackendCloneTestRepoResponse>({
    pathInfoName: ToBackendRequestInfoNameEnum.ToBackendCloneTestRepo,
    payload: {
      orgId: orgId,
      testId: testId
    },
    host: config.mproveCliHost
  });

  let projectId = makeId();
  let userId = makeId();
  let email = `${testId}@example.com`;
  let password = '123123';
  let apiKey = makeTestApiKey({ testId: testId, userId: userId });
  let projectName = testId;

  let { cli, mockContext } = await prepareTest({
    command: SyncCommand,
    config: config,
    deletePack: {
      emails: [email],
      orgIds: [orgId],
      projectIds: [projectId],
      projectNames: [projectName]
    },
    seedPack: {
      users: [
        {
          userId: userId,
          email: email,
          password: password,
          isEmailVerified: true,
          apiKey: apiKey
        }
      ],
      orgs: [
        {
          orgId: orgId,
          ownerEmail: email,
          name: testId
        }
      ],
      projects: [
        {
          orgId: orgId,
          projectId: projectId,
          name: projectName,
          defaultBranch: BRANCH_MAIN,
          remoteType: ProjectRemoteTypeEnum.GitClone,
          gitUrl: config.mproveCliTestDevSourceGitUrl,
          publicKey: fse
            .readFileSync(config.mproveCliTestPublicKeyPath)
            .toString(),
          privateKeyEncrypted: fse
            .readFileSync(config.mproveCliTestPrivateKeyEncryptedPath)
            .toString(),
          passPhrase: config.mproveCliTestPassPhrase
        }
      ],
      members: [
        {
          memberId: userId,
          email: email,
          projectId: projectId,
          isAdmin: true,
          isEditor: true,
          isExplorer: true
        }
      ],
      connections: [
        {
          projectId: projectId,
          connectionId: 'c1_postgres',
          envId: PROJECT_ENV_PROD,
          type: ConnectionTypeEnum.PostgreSQL,
          options: {
            postgres: {
              host: 'dwh-postgres',
              port: 5436,
              database: 'p_db',
              username: config.mproveCliTestDwhPostgresUser,
              password: config.mproveCliTestDwhPostgresPassword,
              isSSL: false
            }
          }
        }
      ]
    },
    apiKey: apiKey
  });

  return {
    cli: cli,
    mockContext: mockContext,
    config: config,
    projectId: projectId,
    repoPath: repoPath,
    userId: userId,
    email: email,
    password: password
  };
}

async function saveServerReadme(item: {
  apiKey: string;
  host: string;
  projectId: string;
  repoId: string;
  content: string;
}) {
  let { apiKey, host, projectId, repoId, content } = item;
  let payload: ToBackendSaveFileRequestPayload = {
    projectId: projectId,
    repoId: repoId,
    branchId: BRANCH_MAIN,
    envId: PROJECT_ENV_PROD,
    fileNodeId: `${projectId}/readme.md`,
    content: content
  };

  await mreq<ToBackendSaveFileResponse>({
    apiKey: apiKey,
    pathInfoName: ToBackendRequestInfoNameEnum.ToBackendSaveFile,
    payload: payload,
    host: host
  });
}

function hasChangeContent(item: {
  changes: any[];
  fileName: string;
  content: string;
}) {
  let { changes, fileName, content } = item;
  let change = changes.find(x => x.fileName === fileName);

  return change?.content === content;
}

function logFailure(item: { context: CustomContext; error: any }) {
  let { context, error } = item;
  if (context) {
    console.log(context.stdout.toString());
    console.log(context.stderr.toString());
  }

  logToConsoleMcli({
    log: error,
    logLevel: LogLevelEnum.Error,
    context: undefined,
    isJson: false
  });
}
