# app/shared/middleware

## Purpose
Shared primitives: exceptions, responses, middleware utilities, security helpers, and generic utils.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Store truly cross-module code that should not depend on feature-specific packages.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
