# app/domains/3D_generation

## Purpose
Domain-specific capabilities grouped by business problem.

## What This Folder Should Hold
- Code and resources directly related to this folder's responsibility.
- Files with clear module boundaries and minimal hidden side effects.
- Tests or fixtures close to behavior where practical.

## Support Expectations
- Keep each domain module independent, explicit in inputs/outputs, and reusable by API/workers.
- Keep imports stable and explicit (e.g., app.<area>...) to reduce coupling.
- Add documentation when introducing new subfolders or conventions.
