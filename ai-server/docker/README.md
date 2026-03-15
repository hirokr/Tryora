# docker

## Purpose
Container build definitions for app and worker runtimes.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Keep runtime images reproducible and aligned with deployment environments.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
