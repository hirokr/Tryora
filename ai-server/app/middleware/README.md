# app/middleware

## Purpose
Request/response middleware for security, auditing, request identity, and throttling.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Implement cross-cutting behavior once and apply it consistently at app/router boundaries.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
