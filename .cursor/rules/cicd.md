# ci/cd

- builds run in github actions (see ./github/workflows/)
- commit and push to trigger builds
- when builds fail, check the output to find the root cause
  - if the fix is simple, move directly onto implementing it, pushing the fix, and monitoring the build again, repeating as necessary
  - if the fix is unknown or complex, do not automatically try to implement a fix
  - if the root cause is a simple, clear issue (e.g., missing file, wrong path, or config), the assistant must immediately implement the fix, commit, and push without prompting the user, then monitor the build and repeat if another fix is needed. Do not prompt the user for confirmation at any step in this loop.
