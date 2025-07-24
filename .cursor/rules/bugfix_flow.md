# bugfix flow

- retrieve bugs from reported github issues
- create a fix branch from main
- write a failing test for the bug (unit, integration, or e2e)
- run all tests in docker containers
- fix the bug, commit with fix: message
- check container logs for debugging
- ensure all tests pass locally and in CI
- open a pull request for review

## troubleshooting
- if tests fail, check logs and rerun
- if bug is not reproducible, check seed data and environment
