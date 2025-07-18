# GitHub CLI Usage

- When running any `gh` (GitHub CLI) command on Ubuntu (including CI and local development), you must set the environment variable `GH_PAGER=cat` to avoid issues with pagers and output pipes.
- Example:
  ```bash
  export GH_PAGER=cat && gh run list
  ```
- This applies to all commands that fetch logs, list runs, or display output that could invoke a pager.
