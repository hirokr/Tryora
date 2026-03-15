# app/config

## Purpose
Application configuration, constants, and environment settings.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Centralize settings loading and defaults so runtime behavior is predictable across environments.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
