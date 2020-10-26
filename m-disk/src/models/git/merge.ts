import * as nodegit from 'nodegit';
import { api } from '../../barrels/api';
import { interfaces } from '../../barrels/interfaces';
import { getRepoStatus } from './get-repo-status';

export async function merge(item: {
  projectId: string;
  projectDir: string;
  repoId: string;
  repoDir: string;
  userAlias: string;
  branch: string;
  theirBranch: string;
  isTheirBranchRemote: boolean;
}) {
  let gitRepo = <nodegit.Repository>await nodegit.Repository.open(item.repoDir);

  // try fast forward

  let signature = nodegit.Signature.now(item.userAlias, `${item.userAlias}@`);
  await gitRepo.mergeBranches(
    item.branch,
    // `origin/${item.branch}`,
    item.theirBranch,
    signature,
    nodegit.Merge.PREFERENCE.FASTFORWARD_ONLY
  );

  let { repoStatus, currentBranch, conflicts } = <interfaces.ItemStatus>(
    await getRepoStatus({
      projectId: item.projectId,
      projectDir: item.projectDir,
      repoId: item.repoId,
      repoDir: item.repoDir
    })
  );

  if (repoStatus === api.RepoStatusEnum.Ok) {
    return;
  }

  // force

  let ourCommit = <nodegit.Commit>(
    await gitRepo.getReferenceCommit(`refs/heads/${item.branch}`)
  );

  let theirStr =
    item.isTheirBranchRemote === true
      ? `refs/remotes/${item.theirBranch}`
      : `refs/heads/${item.theirBranch}`;

  let theirCommit = <nodegit.Commit>await gitRepo.getReferenceCommit(theirStr);
  let theirRef = <nodegit.Reference>await gitRepo.getReference(theirStr);

  let theirAnnotatedCommit = <nodegit.AnnotatedCommit>(
    await nodegit.AnnotatedCommit.fromRef(gitRepo, theirRef)
  );

  await nodegit.Merge.merge(gitRepo, theirAnnotatedCommit, null, {
    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
  });

  let index = <nodegit.Index>await gitRepo.refreshIndex();

  if (index.hasConflicts()) {
    // merge contains conflicting changes

    await index.addAll(null, null);

    await (<any>index.write()); // wrong @types - method is async

    await index.writeTree();
  } else {
    // merge is clean
  }

  let oid = <nodegit.Oid>await index.writeTreeTo(gitRepo);

  let author = nodegit.Signature.now(item.userAlias, `${item.userAlias}@`);
  let committer = nodegit.Signature.now(item.userAlias, `${item.userAlias}@`);

  let message = `merge ${item.theirBranch} to ${item.branch}`;

  let commitOid = <nodegit.Oid>(
    await gitRepo.createCommit('HEAD', author, committer, message, oid, [
      ourCommit,
      theirCommit
    ])
  );

  let commit = <nodegit.Commit>await gitRepo.getCommit(commitOid);

  await nodegit.Reset.reset(gitRepo, commit, nodegit.Reset.TYPE.HARD, null);
}
