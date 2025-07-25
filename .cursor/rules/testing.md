# testing

- verify the needed containers are running before running tests
- if i ask you to run tests for an app, run all available test suites for that app (unit and integration for ./api, e2e for ./webapp)
- if i ask you to run all tests, run all available suites for all apps

before running a test suite for an app,
- read the relevant app's README.md for testing instructions (i.e. api/README.md)
- read the `scripts: {` block of the app's package.json to see which test commands are available
- determine which type of test to run - unit, integration, or e2e

after successfully running a test suite,
- make corrections to the app's README.md (if necessary) fixing commands and instructions for running tests, or test-related info
