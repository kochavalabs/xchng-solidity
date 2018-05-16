Contributing to XCHNG
=======

Thank you for taking the time to contribute!
 
Please take some time to review the guidelines below to make sure that your contributions are merged as soon as possible.

## Reporting Issues

If you have found a bug or issue that you would like to report you can use [GitHub issues](http://solidity.readthedocs.io/en/v0.4.23/style-guide.html). On this repository just fill out the issue template and provide the following information:

* A clear and descriptive title to identify the problem.
* If applicable, steps or code to reproduce the issue or demonstrate the problem.
* Context including the network that was being used when this issue was encountered. Ganache? Ropsten?
* Additional details that are relevant.

## Creating Pull Requests (PRs)

If you would like to contribute by making a change to the contract code, documentation, or tests please do so through a pull request.  See ["Fork-a-Repo"](https://help.github.com/articles/fork-a-repo/) for information on how to fork and open a pull request.  In addition please fill in the pull request template and follow the guidelines to ensure that you pull request can be merged as soon as possible:

* Follow the [Solidity](http://solidity.readthedocs.io/en/v0.4.23/style-guide.html) and [JavaScript](https://standardjs.com/) styleguides.
* Include tests if adding new functionality.
* Make sure any changes are well documented.

## Example workflow

1) Make sure your fork is up to date with the main repository:

```
cd xchng-solidity
git fetch upstream
git checkout development
git pull --rebase upstream development
yarn install
```
NOTE: The directory `xchng-solidity` represents your fork's local copy.

2) Branch out from `development` into `fix/some-bug-#123`:
(Postfixing #123 will associate your PR with the issue #123)
```
git checkout -b fix/some-bug-#123
```

3) Make your changes, add your files, commit and push to your fork.

```
git add SomeFile.js
git commit "fix(contract): Fix some bug #123"
git push origin fix/some-bug-#123
```

4) Go to [github.com/kochavalabs/xchng-solidity](https://github.com/kochavalabs/xchng-solidity) in your web browser and issue a new pull request.

5) Maintainers will review your code and possibly ask for changes before your code is pulled in to the main repository. We'll check that all tests pass, review the coding style, and check for general code correctness. If everything is OK, we'll merge your pull request and your code will be part of XCHNG.

