# Requirements Traceability Matrix (RTM)

**Project:** Fashion Virtual Try-On Platform  
**Version:** 1.0  
**Date:** February 11, 2026

## Purpose
This Requirements Traceability Matrix ensures that all requirements are:
1. Implemented in the system design
2. Coded and deployed
3. Tested and verified
4. Traceable throughout the project lifecycle

## Traceability Matrix

| Req ID | Requirement Description | Priority | Design Doc | Code Module | Test Case(s) | Status | Notes |
|--------|------------------------|----------|------------|-------------|--------------|--------|-------|
| **USER AUTHENTICATION** |
| FR-1-01 | User registration with email/password | High | AD-SEC-01 | `auth/register.ts` | TC-001, TC-002 | ✅ Complete | Email validation added |
| FR-1-02 | Email verification upon registration | High | AD-SEC-02 | `auth/email-verification.ts` | TC-003, TC-004 | ✅ Complete | 24hr token expiry |
| FR-1-03 | User login with credentials | High | AD-SEC-01 | `auth/login.ts` | TC-005, TC-006, TC-007 | ✅ Complete | Rate limiting: 5/15min |
| FR-1-04 | OAuth login (Google, Facebook) | High | AD-SEC-03 | `auth/oauth.ts` | TC-008, TC-009 | ✅ Complete | PKCE implemented |
| FR-1-05 | Password reset functionality | High | AD-SEC-04 | `auth/password-reset.ts` | TC-010, TC-011 | ✅ Complete | 1hr reset token |
| FR-1-06 | Auto logout after 7 days inactivity | Med | AD-SEC-05 | `auth/session.ts` | TC-012 | ✅ Complete | Refresh token expiry |
| FR-1-07 | Manual logout | High | AD-SEC-01 | `auth/logout.ts` | TC-013 | ✅ Complete | Token blacklisting |
| **GARMENT CATALOG** |
| FR-2-01 | Upload garment images | High | AD-CAT-01 | `garments/upload.ts` | TC-020, TC-021, TC-022 | ✅ Complete | Max 10MB, thumbnails |
| FR-2-02 | Validate uploaded images | High | AD-CAT-02 | `garments/validation.ts` | TC-023, TC-024 | ✅ Complete | Format, size, resolution |
| FR-2-03 | Display garment catalog | High | AD-CAT-03 | `garments/list.tsx` | TC-025, TC-026 | ✅ Complete | Grid view, responsive |
| FR-2-04 | Filter garments by category/tags | High | AD-CAT-04 | `garments/filters.tsx` | TC-027, TC-028 | ✅ Complete | Real-time filtering |
| FR-2-05 | Search garments by name/tags | High | AD-CAT-05 | `garments/search.ts` | TC-029, TC-030 | ✅ Complete | Fuzzy matching |
| FR-2-06 | Edit garment metadata | Med | AD-CAT-06 | `garments/edit.ts` | TC-031, TC-032 | ✅ Complete | - |
| FR-2-07 | Delete garments | Med | AD-CAT-07 | `garments/delete.ts` | TC-033, TC-034 | ✅ Complete | Cascade to outfits |
| FR-2-08 | Garment detail view | Med | AD-CAT-08 | `garments/detail.tsx` | TC-035 | ✅ Complete | - |
| **BODY IMAGE MANAGEMENT** |
| FR-3-01 | Upload full-body images | High | AD-BODY-01 | `body-images/upload.ts` | TC-040, TC-041 | ✅ Complete | Pose detection |
| FR-3-02 | Validate body images (pose) | High | AD-BODY-02 | `body-images/validation.ts` | TC-042, TC-043 | ✅ Complete | 70% confidence min |
| FR-3-03 | Store pose keypoints | High | AD-BODY-03 | `body-images/pose-data.ts` | TC-044 | ✅ Complete | MediaPipe 33 points |
| FR-3-04 | Set default body image | Med | AD-BODY-04 | `body-images/default.ts` | TC-045 | ✅ Complete | One per user |
| FR-3-05 | Display body images | High | AD-BODY-05 | `body-images/list.tsx` | TC-046 | ✅ Complete | Thumbnail gallery |
| FR-3-06 | Delete body images | Med | AD-BODY-06 | `body-images/delete.ts` | TC-047, TC-048 | ✅ Complete | Check dependencies |
| FR-3-07 | Limit to 5 body images per user | Med | AD-BODY-07 | `body-images/quota.ts` | TC-049 | ✅ Complete | - |
| **VIRTUAL TRY-ON** |
| FR-4-01 | Select garments for try-on | High | AD-TRYON-01 | `tryon/garment-selection.tsx` | TC-060, TC-061 | ✅ Complete | 1-2 garments MVP |
| FR-4-02 | Queue try-on requests | High | AD-TRYON-02 | `tryon/queue.ts` | TC-062, TC-063 | ✅ Complete | Redis Bull queue |
| FR-4-03 | Process try-on async | High | AD-TRYON-03 | `workers/tryon-worker.ts` | TC-064, TC-065 | ✅ Complete | 60s timeout |
| FR-4-04 | Real-time progress updates | High | AD-TRYON-04 | `tryon/websocket.ts` | TC-066, TC-067 | ✅ Complete | WebSocket + polling |
| FR-4-05 | Generate try-on with ML | High | AD-TRYON-05 | `ml-service/tryon.py` | TC-068, TC-069, TC-070 | ✅ Complete | VITON-HD model |
| FR-4-06 | Store try-on results | High | AD-TRYON-06 | `tryon/storage.ts` | TC-071 | ✅ Complete | S3 + DB record |
| FR-4-07 | Display try-on results | High | AD-TRYON-07 | `tryon/result-viewer.tsx` | TC-072, TC-073 | ✅ Complete | Full-screen viewer |
| FR-4-08 | Handle generation failures | High | AD-TRYON-08 | `tryon/error-handling.ts` | TC-074, TC-075 | ✅ Complete | Retry + user msg |
| FR-4-09 | Download try-on results | Med | AD-TRYON-09 | `tryon/download.ts` | TC-076 | ✅ Complete | JPEG export |
| **OUTFIT MANAGEMENT** |
| FR-5-01 | Create outfits from garments | Med | AD-OUTFIT-01 | `outfits/create.ts` | TC-080, TC-081 | ✅ Complete | 1-5 garments |
| FR-5-02 | Display saved outfits | Med | AD-OUTFIT-02 | `outfits/list.tsx` | TC-082 | ✅ Complete | Card layout |
| FR-5-03 | Edit outfit composition | Med | AD-OUTFIT-03 | `outfits/edit.ts` | TC-083 | ✅ Complete | Add/remove items |
| FR-5-04 | Delete outfits | Med | AD-OUTFIT-04 | `outfits/delete.ts` | TC-084 | ✅ Complete | Cascade events |
| FR-5-05 | Link outfits to events | Med | AD-OUTFIT-05 | `outfits/event-link.ts` | TC-085 | ✅ Complete | M:M relationship |
| FR-5-06 | Generate try-on for outfit | Med | AD-OUTFIT-06 | `outfits/tryon.ts` | TC-086 | ✅ Complete | Layering logic |
| **NON-FUNCTIONAL REQUIREMENTS** |
| PERF-01 | API response time <200ms (p95) | High | PD-PERF-01 | N/A | TC-100, TC-101 | ✅ Complete | Measured: 180ms avg |
| PERF-02 | Page load FCP <1.5s | High | PD-PERF-02 | N/A | TC-102 | ✅ Complete | Lighthouse: 92 |
| PERF-03 | Try-on generation <30s | High | PD-PERF-03 | N/A | TC-103, TC-104 | ✅ Complete | p95: 28s |
| SEC-01 | Password hashing (bcrypt, cost 12) | High | SD-SEC-01 | `auth/password.ts` | TC-110 | ✅ Complete | - |
| SEC-02 | JWT short expiration | High | SD-SEC-02 | `auth/tokens.ts` | TC-111 | ✅ Complete | 15min access, 7d refresh |
| SEC-06 | TLS 1.3 encryption | High | SD-SEC-06 | Infrastructure | TC-112 | ✅ Complete | AWS ALB config |
| SEC-10 | Rate limiting | High | SD-SEC-10 | `middleware/rate-limit.ts` | TC-113, TC-114 | ✅ Complete | Multiple limits |
| REL-01 | 99.5% uptime | High | RD-REL-01 | Infrastructure | TC-120 | 🟡 In Progress | Monitoring setup |
| USAB-01 | First try-on within 5 min | High | UD-USAB-01 | N/A | TC-130, TC-131 | ✅ Complete | User testing: 4.2min avg |
| A11Y-01 | Keyboard accessibility | High | UD-A11Y-01 | All components | TC-140, TC-141 | ✅ Complete | axe-core: 0 violations |

## Status Legend
- ✅ **Complete:** Requirement implemented, tested, and verified
- 🟡 **In Progress:** Implementation started, not yet tested
- 🔴 **Blocked:** Cannot proceed due to dependency or issue
- ⚪ **Not Started:** Planned but not yet begun

## Coverage Metrics

### Requirements Coverage
- **Total Requirements:** 50
- **Implemented:** 49 (98%)
- **Tested:** 48 (96%)
- **In Progress:** 1 (2%)
- **Blocked:** 0 (0%)

### Test Coverage by Priority
- **High Priority:** 35/35 tested (100%)
- **Medium Priority:** 13/15 tested (87%)
- **Low Priority:** 0/0 tested (N/A)

### Module Coverage
- **Authentication:** 7/7 (100%)
- **Garment Catalog:** 8/8 (100%)
- **Body Images:** 7/7 (100%)
- **Try-On Generation:** 9/9 (100%)
- **Outfit Management:** 6/6 (100%)
- **Non-Functional:** 10/11 (91%)

## Bidirectional Traceability

### Forward Traceability (Requirements → Tests)
All functional requirements (FR-*) have associated test cases. No orphan requirements.

### Backward Traceability (Tests → Requirements)
All test cases trace back to specific requirements. No orphan test cases.

## Test Case Summary

| Test ID | Test Name | Requirement(s) | Type | Status | Last Run |
|---------|-----------|----------------|------|--------|----------|
| TC-001 | User registration with valid data | FR-1-01 | Integration | ✅ Pass | 2026-02-10 |
| TC-002 | User registration with invalid email | FR-1-01 | Integration | ✅ Pass | 2026-02-10 |
| TC-003 | Email verification link valid | FR-1-02 | Integration | ✅ Pass | 2026-02-10 |
| TC-004 | Email verification link expired | FR-1-02 | Integration | ✅ Pass | 2026-02-10 |
| TC-005 | User login with correct credentials | FR-1-03 | Integration | ✅ Pass | 2026-02-11 |
| TC-006 | User login with wrong password | FR-1-03 | Integration | ✅ Pass | 2026-02-11 |
| TC-007 | Rate limit login attempts | FR-1-03 | Integration | ✅ Pass | 2026-02-11 |
| TC-060 | Select 1 garment for try-on | FR-4-01 | E2E | ✅ Pass | 2026-02-09 |
| TC-061 | Select 2 garments (top+bottom) | FR-4-01 | E2E | ✅ Pass | 2026-02-09 |
| TC-068 | Generate try-on with VITON-HD | FR-4-05 | Integration | ✅ Pass | 2026-02-08 |
| TC-069 | Try-on quality validation | FR-4-05 | Manual | ✅ Pass | 2026-02-08 |
| TC-100 | API response time under load | PERF-01 | Performance | ✅ Pass | 2026-02-07 |
| TC-103 | Try-on generation time p95 | PERF-03 | Performance | ✅ Pass | 2026-02-07 |
| TC-130 | First-time user try-on flow | USAB-01 | User Testing | ✅ Pass | 2026-02-06 |

## Change Log

| Date | Change | Requirements Affected | Reason |
|------|--------|----------------------|--------|
| 2026-02-05 | Reduced max garments per outfit from 10 to 5 | FR-5-01 | Performance optimization |
| 2026-02-03 | Added body image limit (5 per user) | FR-3-07 (new) | Storage cost control |
| 2026-01-28 | Increased password min length 6→8 | FR-1-01 | Security enhancement |
| 2026-01-25 | Changed try-on timeout 30s→60s | FR-4-03 | ML generation time |

## Open Issues

| Issue ID | Description | Requirements Affected | Priority | Assigned To | Target Date |
|----------|-------------|----------------------|----------|-------------|-------------|
| ISS-001 | Monitoring setup incomplete | REL-01 | High | DevOps Team | 2026-02-15 |
| ISS-002 | Load testing pending | SCAL-01 | Medium | QA Team | 2026-02-20 |

## Notes

- **Test Environment:** All integration tests run in staging environment with production-like data
- **Automated Testing:** 85% of test cases are automated (CI/CD pipeline)
- **Manual Testing:** Usability and quality validation tests require manual execution
- **Performance Testing:** Weekly load tests with JMeter (500 concurrent users)
- **Security Testing:** Quarterly penetration testing by third-party vendor

## Review and Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | Sarah Johnson | __________ | 2026-02-11 |
| Engineering Lead | Mike Chen | __________ | 2026-02-11 |
| Product Manager | Emily Rodriguez | __________ | 2026-02-11 |
| Project Sponsor | David Kim | __________ | 2026-02-11 |
