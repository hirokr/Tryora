# app/api

## Purpose
HTTP route definitions and API-level request handling.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Validate input, call services/modules, and return API-safe responses without heavy business logic.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
