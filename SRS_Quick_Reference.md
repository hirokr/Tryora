# SRS Quick Reference Guide

**Project:** Fashion Virtual Try-On Platform  
**Version:** 1.0  
**Date:** February 11, 2026

---

## Table of Contents

1. [Document Formatting Standards](#document-formatting-standards)
2. [Requirements Numbering Scheme](#requirements-numbering-scheme)
3. [Versioning Convention](#versioning-convention)
4. [Requirement Writing Best Practices](#requirement-writing-best-practices)
5. [Common Terms and Keywords](#common-terms-and-keywords)
6. [Review and Approval Workflow](#review-and-approval-workflow)
7. [Change Management Process](#change-management-process)
8. [Quick Start Checklist](#quick-start-checklist)

---

## Document Formatting Standards

### Font and Typography

| Element | Specification |
|---------|---------------|
| **Body Text** | Arial or Calibri, 11pt, Black |
| **Heading 1** | Arial Bold, 16pt, Black, Uppercase |
| **Heading 2** | Arial Bold, 14pt, Black, Title Case |
| **Heading 3** | Arial Bold, 12pt, Black, Title Case |
| **Code/Technical** | Courier New, 10pt, Monospace |
| **Table Headers** | Arial Bold, 11pt, White on Dark Gray Background |
| **Emphasis** | Bold for key terms, *Italic* for foreign terms |

### Page Layout

- **Margins:** 1 inch (2.54cm) on all sides
- **Line Spacing:** 1.15 for body text, 1.5 for headings
- **Paragraph Spacing:** 6pt after paragraphs
- **Page Numbers:** Bottom center, starting from Introduction (Section 1)
- **Header:** Document title and version (right-aligned)
- **Footer:** Page number (center), Confidential notice (left-aligned if applicable)

### Document Structure

```
Cover Page
├── Title
├── Project Name
├── Version & Date
├── Status
└── Author/Reviewers

Revision History Table
Table of Contents
├── Auto-generated
└── Hyperlinked (in digital formats)

Sections 1-12
├── Each section starts on new page
├── Consistent heading hierarchy
└── Cross-references hyperlinked

Appendices
├── Lettered (A, B, C...)
└── Referenced in main text
```

### Tables

**Standard Table Format:**
```
┌──────────────┬──────────────┬──────────────┐
│ Header 1     │ Header 2     │ Header 3     │
├──────────────┼──────────────┼──────────────┤
│ Data 1       │ Data 2       │ Data 3       │
│ Data 4       │ Data 5       │ Data 6       │
└──────────────┴──────────────┴──────────────┘
```

- **Header Row:** Bold, dark gray background (#4A4A4A), white text
- **Alternating Rows:** White and light gray (#F5F5F5) for readability
- **Borders:** 1pt solid lines
- **Alignment:** Left for text, right for numbers, center for status icons

### Lists

**Bulleted Lists:**
- Use bullet points (•) for unordered lists
- Use sub-bullets (○) for nested items
- Maximum 3 levels of nesting

**Numbered Lists:**
1. Use Arabic numerals (1, 2, 3...) for ordered lists
2. Use letters (a, b, c...) for sub-items
3. Use Roman numerals (i, ii, iii...) for sub-sub-items

### Diagrams and Images

- **Placement:** Centered, with caption below
- **Caption Format:** "Figure X.X: [Description]" (bold figure number)
- **Quality:** Minimum 300 DPI for print, vector format preferred (SVG, PDF)
- **Size:** Fit within margins, max width 6.5 inches
- **References:** "See Figure 3.2" in text with hyperlink

### Code Blocks

```
Code blocks use:
- Courier New font, 10pt
- Light gray background (#F5F5F5)
- 1pt border
- Syntax highlighting if possible (in digital formats)
```

---

## Requirements Numbering Scheme

### Functional Requirements (FR)

**Format:** `FR-[Feature#]-[Requirement#]`

**Examples:**
- `FR-1-01` = First requirement of Feature 1 (User Authentication)
- `FR-1-02` = Second requirement of Feature 1
- `FR-2-01` = First requirement of Feature 2 (Garment Catalog)

**Feature Numbering:**
- Feature 1: User Authentication
- Feature 2: Garment Catalog
- Feature 3: Body Image Management
- Feature 4: Virtual Try-On
- Feature 5: Outfit Management
- Feature 6: Events & Recommendations
- Feature 7: User Preferences
- Feature 8: Dashboard & Navigation

**Requirement Numbering:**
- Sequential within each feature
- Use leading zeros for sorting (01, 02, ..., 99)
- Leave gaps for future insertions (e.g., skip every 5th number)

### Non-Functional Requirements (NFR)

**Format:** `NFR-[Category]-[Number]` or `[Category]-[Number]`

**Categories:**
- `PERF` = Performance
- `SEC` = Security
- `REL` = Reliability
- `AVAIL` = Availability
- `MAINT` = Maintainability
- `PORT` = Portability
- `USAB` = Usability
- `SCAL` = Scalability
- `COMP` = Compliance

**Examples:**
- `PERF-01` = API response time requirement
- `SEC-01` = Password hashing requirement
- `USAB-01` = First-time user onboarding requirement

### Use Case IDs

**Format:** `UC-[Number]`

**Examples:**
- `UC-01` = User Registration
- `UC-02` = User Login
- `UC-06` = Generate Virtual Try-On

**Numbering:**
- Sequential, grouped by epic/feature area
- UC-01 to UC-09: Authentication
- UC-10 to UC-19: Try-On
- UC-20 to UC-29: Catalog
- etc.

### Test Case IDs

**Format:** `TC-[Number]`

**Examples:**
- `TC-001` = User registration with valid data
- `TC-002` = User registration with invalid email

**Numbering:**
- Sequential, aligned with requirement IDs when possible
- TC-001 to TC-019: Authentication tests
- TC-020 to TC-039: Catalog tests
- TC-040 to TC-059: Body image tests
- etc.

### Requirement ID Mapping

| Requirement | Use Case | Test Cases |
|-------------|----------|------------|
| FR-1-01 (User registration) | UC-01 | TC-001, TC-002, TC-003 |
| FR-4-05 (Try-on generation) | UC-06 | TC-068, TC-069, TC-070 |

---

## Versioning Convention

### Semantic Versioning for SRS

**Format:** `MAJOR.MINOR.PATCH`

**Example:** `SRS_FVTP_v1.2.3.pdf`

**Version Components:**

1. **MAJOR (X.0.0):**
   - Significant scope changes
   - Complete re-baseline
   - Major releases (MVP, V2, V3)
   - **Example:** 1.0.0 → 2.0.0 (MVP approved → Phase 2 started)

2. **MINOR (0.X.0):**
   - New features added
   - Significant requirement changes
   - New sections added
   - **Example:** 1.1.0 → 1.2.0 (Added event recommendations feature)

3. **PATCH (0.0.X):**
   - Minor corrections
   - Typo fixes
   - Clarifications
   - Formatting changes
   - **Example:** 1.0.1 → 1.0.2 (Fixed typos, updated dates)

### Document Status Labels

| Status | Description | Usage |
|--------|-------------|-------|
| **Draft** | Work in progress, not yet reviewed | Initial writing, incomplete sections |
| **Review** | Ready for stakeholder review | Complete draft sent to reviewers |
| **Revised** | Changes made based on feedback | Post-review updates |
| **Approved** | Approved by all stakeholders | Ready to become baseline |
| **Baseline** | Official version of record | Active reference for development |
| **Obsolete** | Superseded by newer version | Archived, historical reference only |

### Version History Table Format

| Version | Date | Author | Description of Changes | Approval Status |
|---------|------|--------|------------------------|-----------------|
| 0.1 | 2026-01-15 | Jane Doe | Initial draft | Draft |
| 0.2 | 2026-01-22 | Jane Doe | Added security requirements | Review |
| 0.3 | 2026-01-28 | Jane Doe | Incorporated feedback from engineering team | Revised |
| 1.0 | 2026-02-11 | Jane Doe | Final MVP scope approved | Baseline |
| 1.1 | 2026-03-05 | Jane Doe | Added Phase 2 features (3D viewer) | Draft |

### File Naming Convention

**Format:** `[DocumentType]_[ProjectCode]_v[Version]_[Date].[Extension]`

**Examples:**
- `SRS_FVTP_v1.0_2026-02-11.pdf`
- `SRS_FVTP_v1.2_2026-03-15_DRAFT.docx`
- `RTM_FVTP_v1.0_2026-02-11.xlsx`

**Guidelines:**
- Use underscores (_) to separate components
- Use hyphens (-) in dates (YYYY-MM-DD format)
- Include status label for non-baseline versions (DRAFT, REVIEW)
- Consistent capitalization (all caps for acronyms)

---

## Requirement Writing Best Practices

### The "SHALL" Rule

- **SHALL:** Mandatory requirement (must be implemented)
- **SHOULD:** Recommended requirement (may be skipped with justification)
- **MAY:** Optional requirement (nice-to-have)
- **WILL:** Statement of fact (not a requirement)

**Examples:**
- ✅ "The system SHALL validate email format before registration."
- ✅ "The system SHOULD send confirmation emails within 1 minute."
- ✅ "The system MAY provide social media integration."
- ❌ "The system will be user-friendly." (vague, not testable)

### SMART Criteria for Requirements

**S - Specific:**
❌ "The system should be fast."  
✅ "API response time SHALL be <200ms for 95% of requests."

**M - Measurable:**
❌ "The system should have good uptime."  
✅ "The system SHALL maintain 99.5% uptime per month."

**A - Achievable:**
❌ "Try-on generation SHALL complete in 1 second."  
✅ "Try-on generation SHALL complete in <30 seconds (p95)."

**R - Relevant:**
❌ "The system SHALL support 100 languages." (not relevant to MVP)  
✅ "The system SHALL support English language in MVP."

**T - Testable:**
❌ "The interface should be intuitive."  
✅ "80% of new users SHALL complete first try-on in ≤5 minutes."

### Atomic Requirements

**Each requirement should address ONE thing:**

❌ **Bad (multiple requirements):**
"The system SHALL allow users to upload images, validate file size, and generate thumbnails."

✅ **Good (atomic):**
- FR-2-01: "The system SHALL allow users to upload garment images (JPEG/PNG, max 10MB)."
- FR-2-02: "The system SHALL validate uploaded images (format, size, resolution)."
- FR-2-03: "The system SHALL automatically generate 200x200px thumbnails for uploaded images."

### Avoiding Ambiguity

**Use precise language:**

| Ambiguous | Precise |
|-----------|---------|
| "The system should be fast" | "API response time SHALL be <200ms (p95)" |
| "Support many users" | "Support 500 concurrent users in MVP" |
| "Regular backups" | "Automated daily full backups at 2 AM UTC" |
| "Secure storage" | "AES-256 encryption for data at rest" |
| "Recent data" | "Data from the last 30 days" |

### Requirement Dependencies

**Clearly state prerequisites:**

```
FR-4-01: User can select garments for try-on.
Dependencies: FR-2-01 (Garment upload), FR-3-01 (Body image upload)
```

---

## Common Terms and Keywords

### Glossary Template

**Format:**
```
**Term:** Definition with context

**Example:** Usage in a sentence
```

**Sample Entries:**

**Garment:** A clothing item (top, bottom, dress, outerwear, shoes, or accessory) stored in the user's catalog.  
**Example:** "Users can upload garments to their personal catalog."

**Try-On Result:** An AI-generated image showing a user's body wearing selected garments.  
**Example:** "The try-on result is stored in S3 and displayed to the user."

**Pose Keypoints:** 33 body landmarks (x, y, visibility) detected by MediaPipe for pose estimation.  
**Example:** "Pose keypoints are used to align garments with the user's body."

### Standard Keywords

| Keyword | Meaning | Usage |
|---------|---------|-------|
| **SHALL** | Mandatory | "The system SHALL validate email format." |
| **SHALL NOT** | Prohibition | "Passwords SHALL NOT be stored in plaintext." |
| **SHOULD** | Recommended | "Emails SHOULD be sent within 1 minute." |
| **SHOULD NOT** | Not recommended | "Users SHOULD NOT upload images >10MB." |
| **MAY** | Optional | "Users MAY link outfits to events." |
| **MUST** | Absolute requirement | "All data MUST be encrypted in transit." (Use sparingly) |

### Action Verbs for Requirements

| Category | Verbs |
|----------|-------|
| **Input** | Enter, upload, select, choose, input, provide |
| **Processing** | Validate, verify, process, generate, calculate, transform |
| **Output** | Display, show, send, notify, return, render |
| **Storage** | Store, save, persist, archive, delete, update |
| **Control** | Allow, enable, permit, restrict, prevent, prohibit |

---

## Review and Approval Workflow

### Review Process Flowchart

```
┌─────────────────┐
│ 1. Author Drafts│
│    SRS          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Self-Review  │
│ (Use Checklist) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Submit for   │
│    Peer Review  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 4. Parallel Stakeholder Reviews │
├─────────┬──────────┬────────────┤
│Engineering│ QA     │  Product   │
│  Lead    │  Lead  │   Owner    │
└─────────┴──────────┴────────────┘
         │
         ▼
┌─────────────────┐
│ 5. Consolidate  │
│    Feedback     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Author       │
│    Revises      │
└────────┬────────┘
         │
         ▼
    ┌───────┐
    │Review?│ No
    │  OK?  ├──────► Back to Step 5
    └───┬───┘
        │ Yes
        ▼
┌─────────────────┐
│ 7. Approval     │
│    Sign-off     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 8. Baseline     │
│    (v1.0)       │
└─────────────────┘
```

### Review Roles and Responsibilities

| Role | Focus Area | Deliverable |
|------|------------|-------------|
| **QA Lead** | Testability, completeness, traceability | Reviewed checklist, test strategy notes |
| **Engineering Lead** | Technical feasibility, architecture alignment | Technical risk assessment |
| **Product Owner** | Business value, scope, priorities | Approval for scope and priorities |
| **UX Designer** | Usability requirements, UI specifications | UI/UX sign-off |
| **Security Team** | Security requirements, compliance | Security review report |
| **Legal Team** | Compliance, privacy, terms of service | Legal approval |

### Review Checklist (Short Form)

Before submitting for review:
- [ ] All sections complete (no TBDs without plan)
- [ ] Requirements are SMART (Specific, Measurable, Achievable, Relevant, Testable)
- [ ] Requirements have unique IDs
- [ ] Use cases cover all functional requirements
- [ ] Non-functional requirements are quantitative
- [ ] Glossary defines all technical terms
- [ ] Diagrams are clear and labeled
- [ ] Traceability matrix is complete
- [ ] Document formatted per standards
- [ ] Spell-check and grammar-check passed

---

## Change Management Process

### Change Request Workflow

**Step 1: Identify Change Need**
- Source: Stakeholder feedback, bug reports, new business needs
- Document: What changed, why, impact

**Step 2: Submit Change Request (CR)**
- Fill out Change Request Form (see template below)
- Include: CR ID, date, requestor, description, justification

**Step 3: Impact Analysis**
- Affected requirements
- Affected use cases, test cases, design docs
- Schedule impact
- Cost impact

**Step 4: Review and Approval**
- Change Control Board (CCB) reviews CR
- CCB members: Product Owner, Engineering Lead, QA Lead
- Decision: Approve, Reject, Defer

**Step 5: Implement Change**
- Update SRS with new version number
- Update affected documents (design, test cases)
- Update RTM
- Notify stakeholders

**Step 6: Verify Change**
- Peer review updated sections
- Ensure consistency across documents

### Change Request Template

```
CHANGE REQUEST FORM

CR ID: CR-[YYYY]-[###]
Date: [YYYY-MM-DD]
Requestor: [Name, Role]
Priority: Critical | High | Medium | Low

CHANGE DESCRIPTION:
[What needs to change in the SRS?]

JUSTIFICATION:
[Why is this change needed?]

AFFECTED REQUIREMENTS:
- FR-X-YY
- NFR-ABC-ZZ

IMPACT ANALYSIS:
- Schedule Impact: [+2 weeks, no impact, etc.]
- Cost Impact: [$5,000 for additional testing]
- Risk Impact: [Low, introduces new dependency]

PROPOSED SOLUTION:
[How to implement the change]

CCB DECISION:
☐ Approved
☐ Rejected (Reason: _____________)
☐ Deferred (To: Sprint X)

Approval Signatures:
- Product Owner: _____________ Date: _______
- Engineering Lead: _____________ Date: _______
- QA Lead: _____________ Date: _______
```

### Types of Changes

| Change Type | Version Increment | Approval Required |
|-------------|-------------------|-------------------|
| **Typo/Formatting** | Patch (0.0.X) | Author self-approval |
| **Clarification** | Patch (0.0.X) | Peer review |
| **Minor Requirement Change** | Minor (0.X.0) | CCB approval |
| **New Feature** | Minor (0.X.0) | CCB + stakeholder approval |
| **Scope Change** | Major (X.0.0) | CCB + executive approval |

---

## Quick Start Checklist

### For New SRS Authors

**Day 1: Setup**
- [ ] Copy SRS template
- [ ] Update project name, version, date
- [ ] Set up document structure (TOC, headers, footers)
- [ ] Create glossary spreadsheet

**Week 1: Draft Core Sections**
- [ ] Write Section 1 (Introduction)
- [ ] Write Section 2 (Overall Description)
- [ ] Define user classes and personas
- [ ] List high-level features

**Week 2: Functional Requirements**
- [ ] Organize requirements by feature
- [ ] Assign requirement IDs (FR-X-YY)
- [ ] Write functional requirements (use SHALL)
- [ ] Ensure each requirement is testable

**Week 3: Non-Functional Requirements**
- [ ] Define performance targets
- [ ] Define security requirements
- [ ] Define reliability/availability targets
- [ ] Define usability metrics

**Week 4: Use Cases and Traceability**
- [ ] Write use cases (UC-01, UC-02, ...)
- [ ] Create Requirements Traceability Matrix
- [ ] Link requirements to use cases
- [ ] Plan test cases

**Week 5: Review and Polish**
- [ ] Self-review using checklist
- [ ] Add diagrams (architecture, data model, etc.)
- [ ] Complete glossary
- [ ] Submit for peer review

**Week 6: Finalization**
- [ ] Address review feedback
- [ ] Update RTM
- [ ] Get stakeholder approvals
- [ ] Baseline as v1.0

### Common Mistakes to Avoid

1. ❌ Starting with details before defining scope
   ✅ Start with Introduction and Overall Description first

2. ❌ Writing implementation details in requirements
   ✅ Focus on WHAT, not HOW

3. ❌ Using vague language ("user-friendly", "fast")
   ✅ Use quantitative metrics ("task complete in <5 min")

4. ❌ Forgetting to update RTM when requirements change
   ✅ Update RTM immediately when any requirement changes

5. ❌ Writing requirements in isolation (no stakeholder input)
   ✅ Collaborate with engineering, QA, UX, business early

6. ❌ Mixing functional and non-functional requirements
   ✅ Keep them in separate sections

7. ❌ Skipping use cases ("requirements are enough")
   ✅ Use cases validate requirements and aid understanding

8. ❌ Not reviewing regularly (SRS gets stale)
   ✅ Review and update SRS each sprint or release

---

## Helpful Resources

### Templates Included in This Package

1. **SRS_Template.md** - Full SRS with examples
2. **Requirements_Traceability_Matrix.md** - RTM with sample data
3. **User_Stories_Template.md** - User stories with Gherkin acceptance criteria
4. **NFR_Template.md** - Detailed non-functional requirements template
5. **SRS_Review_Checklist.md** - Comprehensive review checklist
6. **SRS_Quick_Reference.md** - This guide

### External References

- **IEEE Std 830-1998:** IEEE Recommended Practice for Software Requirements Specifications
- **IREB CPRE Syllabus:** International Requirements Engineering Board
- **BABOK Guide:** Business Analysis Body of Knowledge
- **SWEBOK:** Software Engineering Body of Knowledge
- **ISO/IEC 25010:** Systems and software quality models

### Tools

- **Requirements Management:** Jira, Azure DevOps, Helix RM
- **Diagramming:** Lucidchart, Draw.io, Visio
- **Collaboration:** Confluence, Notion, SharePoint
- **Version Control:** Git, SVN
- **Review:** Google Docs (comments), Microsoft Word (track changes)

---

## Contact and Support

**For questions about this SRS:**
- Product Owner: emily.rodriguez@example.com
- Engineering Lead: mike.chen@example.com
- QA Lead: sarah.johnson@example.com

**For SRS template improvements:**
Submit feedback to: srs-feedback@example.com

---

## Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Product Team | Initial quick reference guide |

---

**End of Quick Reference Guide**
