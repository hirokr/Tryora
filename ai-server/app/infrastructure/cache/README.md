# app/infrastructure/cache

## Purpose
Implementation details for external systems (DB, cache, queue, storage, vector stores, external APIs).

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Hide vendor-specific details behind clear interfaces used by services/modules.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
