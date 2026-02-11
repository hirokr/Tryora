# Non-Functional Requirements (NFR) Specification Template

**Project:** Fashion Virtual Try-On Platform  
**Version:** 1.0  
**Date:** February 11, 2026

---

## Introduction

This document provides a structured template for defining non-functional requirements (NFRs), also known as quality attributes or system quality requirements. Unlike functional requirements that describe *what* the system does, NFRs describe *how well* the system performs its functions.

---

## NFR Categories and Template

### 1. Performance Requirements

**Definition:** How fast and efficiently the system responds to user actions and processes data.

**Template:**

```
NFR-PERF-[##]: [Requirement Name]

**Category:** Response Time | Throughput | Capacity | Resource Utilization

**Description:** [What aspect of performance is being measured]

**Metric:** [Quantitative measurement]
- Measurement Point: [Where to measure]
- Target Value: [Specific number with unit]
- Percentile: [p50, p95, p99, max]
- Conditions: [Load, network, data volume]

**Measurement Method:** [How to measure - tool, test scenario]

**Acceptance Criteria:**
- [Specific condition 1]
- [Specific condition 2]

**Priority:** High | Medium | Low

**Rationale:** [Why this target is important]

**Test Scenario:** [How to validate]
```

**Examples:**

---

**NFR-PERF-01: API Response Time**

**Category:** Response Time

**Description:** All API endpoints should respond quickly to ensure a smooth user experience.

**Metric:**
- Measurement Point: Server-side response time (from request received to response sent)
- Target Value: <200ms
- Percentile: p95 (95th percentile)
- Conditions: Under normal load (≤100 concurrent users), excluding file uploads and ML processing

**Measurement Method:** 
- Tool: New Relic APM or DataDog APM
- Test: Load test with Apache JMeter (100 concurrent users, 1000 requests/min)

**Acceptance Criteria:**
- ✅ 95% of API requests complete in ≤200ms
- ✅ 99% of API requests complete in ≤500ms
- ✅ No requests timeout (30s limit)

**Priority:** High

**Rationale:** Users expect instant feedback on actions. Research shows users abandon tasks if responses take >3 seconds.

**Test Scenario:**
```
Given 100 concurrent users are making API requests
When measuring response times over 10 minutes
Then p95 response time should be ≤200ms
And p99 response time should be ≤500ms
```

---

**NFR-PERF-02: Page Load Time**

**Category:** Response Time

**Description:** Web pages should load quickly on typical user connections.

**Metric:**
- Measurement Point: First Contentful Paint (FCP) in browser
- Target Value: <1.5 seconds
- Percentile: p75
- Conditions: 4G connection (simulated throttling), typical page size

**Measurement Method:**
- Tool: Lighthouse CI, WebPageTest
- Network: 4G throttling (4Mbps down, 1Mbps up, 100ms RTT)

**Acceptance Criteria:**
- ✅ FCP <1.5s on 4G connection
- ✅ Time to Interactive (TTI) <3s
- ✅ Lighthouse Performance Score ≥90

**Priority:** High

**Rationale:** Page speed directly impacts user engagement and SEO rankings.

**Test Scenario:**
```
Given a user on a 4G mobile connection
When navigating to the dashboard page
Then First Contentful Paint should occur in <1.5 seconds
And the page should be fully interactive in <3 seconds
```

---

**NFR-PERF-03: Throughput Capacity**

**Category:** Throughput

**Description:** System should handle a specified number of concurrent operations.

**Metric:**
- Measurement Point: Concurrent try-on generations
- Target Value: 50 concurrent jobs
- Percentile: N/A (sustained throughput)
- Conditions: GPU instances running, queue not full

**Measurement Method:**
- Tool: Custom load test script
- Test: Submit 50 try-on requests simultaneously, measure success rate and queue depth

**Acceptance Criteria:**
- ✅ System accepts 50 concurrent try-on requests
- ✅ All jobs complete within 2 minutes
- ✅ 0% job failure rate

**Priority:** Medium

**Rationale:** During peak usage (e.g., after marketing campaign), system must handle burst traffic.

**Test Scenario:**
```
Given the system is running with 3 GPU instances
When 50 users submit try-on requests simultaneously
Then all requests should be queued successfully
And all jobs should complete within 2 minutes
And no jobs should fail due to resource constraints
```

---

### 2. Scalability Requirements

**Definition:** How the system grows and adapts to increasing demands.

**Template:**

```
NFR-SCAL-[##]: [Requirement Name]

**Category:** Horizontal Scaling | Vertical Scaling | Data Scaling | Geographic Scaling

**Description:** [What needs to scale]

**Current Baseline:** [Current capacity]

**Target Capacity:** [Future capacity]

**Scaling Strategy:** [How to achieve scaling]

**Scaling Triggers:** [Metrics that trigger scaling]

**Acceptance Criteria:**
- [Scaling condition 1]
- [Scaling condition 2]

**Priority:** High | Medium | Low

**Rationale:** [Why this scaling is needed]

**Test Scenario:** [How to validate]
```

**Example:**

---

**NFR-SCAL-01: User Growth Scaling**

**Category:** Horizontal Scaling

**Description:** System should support growing user base without performance degradation.

**Current Baseline:** 500 concurrent users (MVP)

**Target Capacity:** 
- Phase 1 (3 months): 2,000 concurrent users
- Phase 2 (6 months): 10,000 concurrent users
- Phase 3 (12 months): 50,000 concurrent users

**Scaling Strategy:**
- Horizontal scaling: Add web/API server instances via auto-scaling groups
- Database: Add read replicas, implement caching layer
- ML service: GPU instance auto-scaling based on queue depth

**Scaling Triggers:**
- Add web server instance when CPU >70% for 5 minutes
- Add API server instance when request queue >100
- Add GPU instance when try-on queue >50 jobs

**Acceptance Criteria:**
- ✅ System auto-scales to handle 2x baseline load
- ✅ Scaling occurs within 5 minutes of trigger
- ✅ No service disruption during scaling events
- ✅ API response time remains <200ms (p95) under scaled load

**Priority:** High

**Rationale:** User growth is expected. System must scale seamlessly to maintain quality of service.

**Test Scenario:**
```
Given the system is running at baseline (500 users)
When simulated load increases to 1000 concurrent users
Then auto-scaling should trigger within 5 minutes
And new instances should be added to handle load
And API response time should remain <200ms (p95)
And no user-facing errors should occur
```

---

### 3. Reliability Requirements

**Definition:** How dependable and consistent the system operates.

**Template:**

```
NFR-REL-[##]: [Requirement Name]

**Category:** Availability | Fault Tolerance | Recoverability | Data Integrity

**Description:** [What aspect of reliability]

**Metric:** [How reliability is measured]

**Target Value:** [Specific reliability target]

**Failure Modes:** [Known ways system can fail]

**Mitigation Strategies:** [How to prevent/recover from failures]

**Acceptance Criteria:**
- [Reliability condition 1]
- [Reliability condition 2]

**Priority:** High | Medium | Low

**Rationale:** [Why this level of reliability is needed]

**Test Scenario:** [How to validate]
```

**Examples:**

---

**NFR-REL-01: System Uptime**

**Category:** Availability

**Description:** System should be available and operational for users at all times, with minimal downtime.

**Metric:** Uptime percentage = (Total Time - Downtime) / Total Time × 100

**Target Value:** 99.5% monthly uptime
- Calculation: 30 days × 24 hours = 720 hours
- Allowed downtime: 3.6 hours per month (0.5%)

**Failure Modes:**
- Hardware failure (server crash)
- Software bugs causing service unavailability
- Database connection failures
- Third-party service outages (AWS)

**Mitigation Strategies:**
- Redundant servers (multi-AZ deployment)
- Health checks and auto-restart (Kubernetes liveness probes)
- Database failover (RDS Multi-AZ)
- Graceful degradation (cache fallbacks)

**Acceptance Criteria:**
- ✅ Uptime ≥99.5% per month (measured by external monitoring)
- ✅ No single point of failure in critical path
- ✅ Automated recovery from transient failures within 5 minutes
- ✅ Planned maintenance <2 hours per month (during off-peak hours)

**Priority:** Critical

**Rationale:** Users depend on the platform for event planning. Downtime impacts user trust and business revenue.

**Test Scenario:**
```
Given the system has been running for 30 days
When calculating uptime based on external monitoring (Pingdom)
Then uptime should be ≥99.5%
And mean time to recovery (MTTR) should be <5 minutes
And no unplanned downtime >30 minutes should occur
```

---

**NFR-REL-02: Data Backup and Recovery**

**Category:** Recoverability

**Description:** System should back up data regularly and enable recovery in case of data loss.

**Metric:** 
- Recovery Point Objective (RPO): Maximum acceptable data loss
- Recovery Time Objective (RTO): Maximum acceptable downtime

**Target Value:**
- RPO: 1 hour (max 1 hour of data loss)
- RTO: 4 hours (restore service within 4 hours)

**Failure Modes:**
- Database corruption
- Accidental data deletion
- Disaster (data center failure)

**Mitigation Strategies:**
- Automated daily full backups
- Hourly transaction log backups
- Multi-region backup replication
- Quarterly restore testing

**Acceptance Criteria:**
- ✅ Automated backups run daily (verified by monitoring)
- ✅ Backups stored in separate AWS region
- ✅ Restore test completes successfully within RTO
- ✅ Restored data is <1 hour old (meets RPO)

**Priority:** High

**Rationale:** User data (garments, try-ons, outfits) is valuable. Loss would severely damage user trust.

**Test Scenario:**
```
Given a catastrophic database failure occurs
When initiating disaster recovery procedure
Then a backup from <1 hour ago should be available
And full system restoration should complete within 4 hours
And all user data should be intact and consistent
```

---

### 4. Security Requirements

**Definition:** How the system protects data, prevents unauthorized access, and ensures privacy.

**Template:**

```
NFR-SEC-[##]: [Requirement Name]

**Category:** Authentication | Authorization | Data Protection | Network Security | Compliance

**Description:** [What security aspect]

**Threat Model:** [What threats this protects against]

**Security Control:** [Technical implementation]

**Standard/Framework:** [Industry standard followed - OWASP, NIST, etc.]

**Acceptance Criteria:**
- [Security condition 1]
- [Security condition 2]

**Priority:** Critical | High | Medium | Low

**Rationale:** [Why this security measure is needed]

**Test Scenario:** [How to validate]
```

**Examples:**

---

**NFR-SEC-01: Authentication Strength**

**Category:** Authentication

**Description:** User passwords should be securely stored and resistant to brute-force attacks.

**Threat Model:**
- Password cracking (offline attacks if database breached)
- Brute-force login attempts
- Credential stuffing attacks

**Security Control:**
- Password hashing: bcrypt with cost factor ≥12
- Password policy: Minimum 8 characters, at least 1 number, 1 special character
- Rate limiting: Max 5 login attempts per 15 minutes per IP

**Standard/Framework:** OWASP Password Storage Cheat Sheet

**Acceptance Criteria:**
- ✅ All passwords stored as bcrypt hashes (cost factor 12)
- ✅ Plaintext passwords never logged or stored
- ✅ Password policy enforced on registration and password change
- ✅ Rate limiting triggers after 5 failed attempts

**Priority:** Critical

**Rationale:** Password breaches are a common attack vector. Strong hashing protects user accounts even if database is compromised.

**Test Scenario:**
```
Given a user registers with password "Test123!"
Then the password should be stored as a bcrypt hash
And the hash should not be reversible
And attempting 6 login failures should trigger rate limiting
And the user should see "Too many attempts. Try again in 15 minutes."
```

---

**NFR-SEC-02: Data Encryption**

**Category:** Data Protection

**Description:** All sensitive data should be encrypted in transit and at rest.

**Threat Model:**
- Man-in-the-middle attacks (network sniffing)
- Data theft if storage media is compromised
- Unauthorized access to backups

**Security Control:**
- In transit: TLS 1.3 for all HTTPS connections
- At rest: AES-256 encryption for database (RDS encryption) and S3 (SSE-S3)
- Backups: Encrypted snapshots

**Standard/Framework:** NIST SP 800-52 (TLS), FIPS 140-2 (Encryption)

**Acceptance Criteria:**
- ✅ All HTTP connections redirect to HTTPS
- ✅ TLS 1.3 enforced (no fallback to TLS 1.2 or lower)
- ✅ Database encryption enabled and verified
- ✅ S3 bucket encryption enabled
- ✅ SSL Labs test scores A+ for HTTPS configuration

**Priority:** Critical

**Rationale:** Regulatory compliance (GDPR, CCPA) and user trust require strong encryption.

**Test Scenario:**
```
Given a user uploads a body image
Then the image should be transmitted over HTTPS (TLS 1.3)
And the image should be stored encrypted in S3 (SSE-S3)
And database records should be encrypted at rest (RDS encryption)
And SSL Labs test should return grade A+
```

---

### 5. Usability Requirements

**Definition:** How easy and efficient the system is for users to learn and use.

**Template:**

```
NFR-USAB-[##]: [Requirement Name]

**Category:** Learnability | Efficiency | Error Prevention | User Satisfaction

**Description:** [What usability aspect]

**Target Users:** [User class this applies to]

**Metric:** [How usability is measured]

**Target Value:** [Specific usability target]

**Acceptance Criteria:**
- [Usability condition 1]
- [Usability condition 2]

**Priority:** High | Medium | Low

**Rationale:** [Why this usability level is needed]

**Test Scenario:** [How to validate - often user testing]
```

**Examples:**

---

**NFR-USAB-01: Onboarding Efficiency**

**Category:** Learnability

**Description:** New users should be able to generate their first try-on quickly without confusion.

**Target Users:** First-time users (no prior experience with platform)

**Metric:** Time to complete first try-on task

**Target Value:** 
- 80% of users complete task in ≤5 minutes
- Without assistance (no help docs or support)

**Acceptance Criteria:**
- ✅ User testing with 10 new users shows ≥8 complete task in ≤5 min
- ✅ No critical usability issues found (Nielsen severity rating 3-4)
- ✅ Average user satisfaction score ≥4.0/5.0

**Priority:** High

**Rationale:** First impressions matter. If users struggle initially, they may abandon the platform.

**Test Scenario:**
```
Given 10 new users with no prior platform knowledge
When asked to "upload a photo and try on a jacket"
Then at least 8 users should complete the task in ≤5 minutes
And they should not require hints or help documentation
And post-task survey should show satisfaction ≥4.0/5.0
```

---

**NFR-USAB-02: Error Message Clarity**

**Category:** Error Prevention & Recovery

**Description:** Error messages should help users understand what went wrong and how to fix it.

**Target Users:** All users

**Metric:** Error message comprehension rate

**Target Value:** 90% of users understand error and know next steps

**Acceptance Criteria:**
- ✅ Error messages written in plain language (no technical jargon)
- ✅ Errors include actionable next steps
- ✅ User testing shows 9/10 users can resolve errors independently

**Priority:** Medium

**Rationale:** Clear errors reduce support tickets and user frustration.

**Test Scenario:**
```
Given a user uploads an image with poor pose detection
When the system rejects the image
Then the error message should state:
  "Could not detect full body pose. Please upload a photo showing your full body from head to feet."
And 90% of users should understand they need a different photo
```

---

### 6. Maintainability Requirements

**Definition:** How easily the system can be modified, debugged, and updated.

**Template:**

```
NFR-MAINT-[##]: [Requirement Name]

**Category:** Modularity | Testability | Analyzability | Modifiability

**Description:** [What maintainability aspect]

**Metric:** [How maintainability is measured]

**Target Value:** [Specific maintainability target]

**Acceptance Criteria:**
- [Maintainability condition 1]
- [Maintainability condition 2]

**Priority:** High | Medium | Low

**Rationale:** [Why this maintainability level is needed]

**Test Scenario:** [How to validate]
```

**Example:**

---

**NFR-MAINT-01: Code Test Coverage**

**Category:** Testability

**Description:** Code should have comprehensive automated tests to enable safe refactoring and regression detection.

**Metric:** Code coverage percentage (line coverage)

**Target Value:** 
- Overall: ≥80%
- Critical modules (auth, payments): ≥90%

**Acceptance Criteria:**
- ✅ All new code has accompanying tests (enforced in code review)
- ✅ CI/CD pipeline runs tests on every commit
- ✅ Coverage reports generated and tracked over time
- ✅ Coverage does not decrease from baseline

**Priority:** High

**Rationale:** High test coverage reduces bugs in production and enables confident refactoring.

**Test Scenario:**
```
Given a pull request with new code
When the CI/CD pipeline runs
Then code coverage should be ≥80% overall
And coverage for modified files should be ≥85%
And no critical modules should have coverage <90%
And the PR should be blocked if coverage decreases
```

---

### 7. Portability Requirements

**Definition:** How easily the system can be transferred to different environments or platforms.

**Template:**

```
NFR-PORT-[##]: [Requirement Name]

**Category:** Installability | Replaceability | Adaptability

**Description:** [What portability aspect]

**Target Environments:** [Where system should be portable to]

**Portability Constraint:** [Dependencies that limit portability]

**Acceptance Criteria:**
- [Portability condition 1]
- [Portability condition 2]

**Priority:** High | Medium | Low

**Rationale:** [Why portability is needed]

**Test Scenario:** [How to validate]
```

**Example:**

---

**NFR-PORT-01: Environment Portability**

**Category:** Installability

**Description:** Application should deploy identically across dev, staging, and production environments.

**Target Environments:**
- Local development (Docker Compose)
- Staging (AWS ECS)
- Production (AWS ECS)

**Portability Constraint:**
- Depends on Docker runtime
- Configuration via environment variables (12-factor app)

**Acceptance Criteria:**
- ✅ Same Docker images used in all environments
- ✅ Environment-specific config via .env files (not code changes)
- ✅ Deployment scripts work across all environments
- ✅ Zero manual configuration steps

**Priority:** High

**Rationale:** Environment consistency reduces "works on my machine" bugs and simplifies deployments.

**Test Scenario:**
```
Given a Docker image built for production
When deployed to staging environment with staging .env file
Then the application should run identically to production
And no code changes should be required
And all features should function correctly
```

---

### 8. Compliance Requirements

**Definition:** How the system adheres to regulations, standards, and legal requirements.

**Template:**

```
NFR-COMP-[##]: [Requirement Name]

**Category:** Legal Compliance | Industry Standards | Accessibility Standards

**Regulation/Standard:** [Specific regulation or standard]

**Scope:** [What parts of system are affected]

**Requirements:** [Specific compliance requirements]

**Acceptance Criteria:**
- [Compliance condition 1]
- [Compliance condition 2]

**Priority:** Critical | High | Medium | Low

**Rationale:** [Why compliance is mandatory]

**Test Scenario:** [How to validate]
```

**Example:**

---

**NFR-COMP-01: GDPR Compliance**

**Category:** Legal Compliance

**Regulation/Standard:** EU General Data Protection Regulation (GDPR)

**Scope:** All users with EU IP addresses or EU citizenship

**Requirements:**
- Right to access: Users can download all their data
- Right to deletion: Users can delete their account and all data
- Right to portability: Data export in machine-readable format (JSON)
- Consent: Users must opt-in to data collection
- Data breach notification: Report breaches within 72 hours

**Acceptance Criteria:**
- ✅ "Export my data" feature implemented (FR-7-06)
- ✅ "Delete my account" feature implemented (FR-7-05)
- ✅ Privacy policy clearly states data usage
- ✅ Cookie consent banner shown to EU users
- ✅ Data breach response plan documented

**Priority:** Critical (Legal requirement)

**Rationale:** Non-compliance can result in fines up to 4% of annual revenue or €20 million.

**Test Scenario:**
```
Given a user with an EU IP address
When they request to export their data
Then they should receive a JSON file within 24 hours
And the file should contain all their personal data
And when they request account deletion
Then all their data should be permanently deleted within 30 days
```

---

## NFR Measurement and Tracking

### Continuous Monitoring

**Performance Dashboard:**
- Real-time metrics: API response time, error rate, throughput
- Alerts: Trigger when thresholds exceeded
- Historical trends: Track performance over time

**Quality Metrics:**
- Code coverage: Tracked in CI/CD
- Security vulnerabilities: Weekly scans
- Accessibility: Automated axe-core tests

**User Satisfaction:**
- NPS surveys: Quarterly
- Support ticket volume: Weekly review
- User testing: Before each major release

### NFR Testing Strategy

| NFR Category | Testing Method | Frequency | Tool |
|--------------|----------------|-----------|------|
| Performance | Load testing | Weekly | JMeter, k6 |
| Scalability | Stress testing | Monthly | JMeter |
| Reliability | Chaos engineering | Quarterly | Chaos Monkey |
| Security | Pen testing | Annually | OWASP ZAP, Burp Suite |
| Usability | User testing | Before releases | UserTesting.com |
| Accessibility | Automated scan | Every build | axe-core |
| Compliance | Audit | Annually | Third-party auditor |

---

## NFR Prioritization Matrix

| Priority | Criteria | Examples |
|----------|----------|----------|
| **Critical** | Legal requirement, system-breaking if not met | Security, GDPR compliance, uptime |
| **High** | Major user impact, competitive differentiator | Performance, usability, scalability |
| **Medium** | Improves quality but not essential for MVP | Maintainability, advanced analytics |
| **Low** | Nice-to-have, future enhancement | Multi-language support, dark mode |

---

## Common NFR Anti-Patterns to Avoid

❌ **Vague Requirements:** "System should be fast" → ✅ "API response time <200ms (p95)"  
❌ **Untestable Requirements:** "Code should be clean" → ✅ "Code coverage ≥80%"  
❌ **Unrealistic Targets:** "100% uptime" → ✅ "99.5% uptime (3.6 hours downtime/month)"  
❌ **Missing Measurement Method:** No specification of how to measure → ✅ Specify tools and test scenarios  
❌ **Ignoring Tradeoffs:** Maximizing all NFRs → ✅ Prioritize and accept reasonable tradeoffs

---

## NFR Review Checklist

Before finalizing NFRs, verify:
- [ ] Each NFR has a unique ID
- [ ] Metrics are quantitative and measurable
- [ ] Target values are specific (not ranges like "between 100-200ms")
- [ ] Measurement methods are defined
- [ ] Acceptance criteria are testable
- [ ] Priority is assigned based on business impact
- [ ] Rationale explains why the target is important
- [ ] Test scenarios describe how to validate

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Engineering Team | Initial NFR template and examples |
