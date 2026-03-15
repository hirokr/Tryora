# app/modules/try_on

## Purpose
Feature modules that package API, schemas, policies, domain logic, and workers by capability.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Treat each feature as a vertical slice with clear boundaries and minimal coupling.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
