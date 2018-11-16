const config = require('./repositories.json');
const fs = require('fs');
const process = require('child_process');
const url = require('url');
const path = require('path');

const branchName = 'dev/2';

const remoteBranch = 'master';

/**
 * TODO:
 *
 * * Error checking on each of the git commands
 * * Returning to a safe state
 * * Remote branch name can be something else besides "master"
 * * Make branch name dynamic
 * * Check for collisions of branch name
 * * Include a decent commit message
 */
config.repositories.forEach(repository => {
  console.log(repository);
  const firstSlash = repository.indexOf('/');
  const dot = repository.indexOf('.', firstSlash);
  const directory = repository.substring(firstSlash + 1, dot);
  const fullPath = path.join('repositories', directory);

  if (!fs.existsSync(fullPath)) {
    // TODO `repository` variable can be exploited, need to validate
    let result = process.execSync(
      `git clone ${repository}`,
      {
        cwd: 'repositories',
      },
    );
  }

  const execSync = (command) => {
    return process.execSync(
      command,
      {
        cwd: fullPath,
      },
    ).toString().trim();
  };

  // From https://stackoverflow.com/questions/5139290/how-to-check-if-theres-nothing-to-be-committed-in-the-current-branch
  let output = execSync(`git status --porcelain`);
  if (output.length !== 0) {
    console.log(`${fullPath} is not clean`);
    return;
  }

  // Check git branch status
  let branch = execSync(`git rev-parse --abbrev-ref HEAD`);
  if (branch !== remoteBranch) {
    // console.log(`${repository} is not on branch: ${remoteBranch}`);
    // TODO check errors
    execSync(`git checkout ${remoteBranch}`);
  }

  // TODO check errors
  execSync(`git pull --rebase`);

  execSync(`git checkout -b ${branchName} ${remoteBranch}`);

  // Copy files
  config.files.forEach(file => {
    fs.copyFileSync(file, path.join(fullPath, file));
  });

  // Add files
  execSync(`git add .`);

  // Commit files
  const commitMessage = `dotfiles: sync with template repository`;

  execSync(`git commit -m '${commitMessage}'`);

  execSync(`git push --set-upstream origin ${branchName}`);
  const pullRequestUrl = execSync(`hub pull-request --no-edit`);
  console.log(pullRequestUrl);
  console.log();
})
