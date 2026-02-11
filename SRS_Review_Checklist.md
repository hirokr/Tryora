# SRS Review Checklist

**Project:** Fashion Virtual Try-On Platform  
**Document Version:** 1.0  
**Review Date:** [To be filled]  
**Reviewer:** [Name and Role]

---

## Instructions

Use this checklist to ensure the Software Requirements Specification (SRS) is complete, consistent, and ready for approval.

- ✅ **Pass:** Requirement met
- ⚠️ **Needs Work:** Incomplete or needs clarification
- ❌ **Fail:** Missing or incorrect
- N/A **Not Applicable:** Not relevant to this project

---

## 1. Document Structure and Format

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 1.1 | Document includes title page with project name, version, date, status | ☐ | |
| 1.2 | Revision history table is present and up-to-date | ☐ | |
| 1.3 | Table of contents is complete with correct page numbers | ☐ | |
| 1.4 | All sections from IEEE 830 standard are included (or justified omissions) | ☐ | |
| 1.5 | Consistent formatting (fonts, headings, numbering) throughout | ☐ | |
| 1.6 | All diagrams are legible and properly labeled | ☐ | |
| 1.7 | Cross-references to other sections/documents are correct | ☐ | |
| 1.8 | Page breaks are appropriate (no orphan headings) | ☐ | |
| 1.9 | Document is version-controlled (Git, SharePoint, etc.) | ☐ | |
| 1.10 | File naming convention follows standards (e.g., SRS_ProjectName_v1.0.docx) | ☐ | |

**Section Score:** ___/10

---

## 2. Introduction Section (Section 1)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 2.1 | Purpose clearly states the SRS objective and intended audience | ☐ | |
| 2.2 | Scope defines what the software will and will not do | ☐ | |
| 2.3 | In-scope and out-of-scope features are explicitly listed | ☐ | |
| 2.4 | Definitions, acronyms, abbreviations are comprehensive | ☐ | |
| 2.5 | All technical terms used in the document are defined | ☐ | |
| 2.6 | References section lists all cited documents (with version numbers) | ☐ | |
| 2.7 | Overview provides a roadmap for the rest of the document | ☐ | |

**Section Score:** ___/7

---

## 3. Overall Description Section (Section 2)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 3.1 | Product perspective explains system context (diagram included if needed) | ☐ | |
| 3.2 | Product functions are summarized at a high level | ☐ | |
| 3.3 | User classes and characteristics are identified with personas | ☐ | |
| 3.4 | Operating environment specifies hardware, OS, network requirements | ☐ | |
| 3.5 | Design and implementation constraints are listed (technical, regulatory, business) | ☐ | |
| 3.6 | Assumptions are clearly stated and reasonable | ☐ | |
| 3.7 | Dependencies on external systems/services are identified | ☐ | |

**Section Score:** ___/7

---

## 4. Functional Requirements (Section 3)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 4.1 | All functional requirements have unique IDs (e.g., FR-1-01) | ☐ | |
| 4.2 | Requirements are organized by feature or subsystem | ☐ | |
| 4.3 | Each requirement uses "SHALL" for mandatory, "SHOULD" for recommended | ☐ | |
| 4.4 | Requirements are specific and testable (not vague like "user-friendly") | ☐ | |
| 4.5 | Requirements include inputs, processing, and outputs where applicable | ☐ | |
| 4.6 | Requirements specify error handling and validation rules | ☐ | |
| 4.7 | Business rules are documented alongside relevant requirements | ☐ | |
| 4.8 | Each requirement is linked to use cases or user stories | ☐ | |
| 4.9 | Priority is assigned to each requirement (High/Medium/Low) | ☐ | |
| 4.10 | No conflicts or contradictions between requirements | ☐ | |

**Section Score:** ___/10

---

## 5. External Interfaces (Section 4)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 5.1 | User interface requirements specify screen layouts and interactions | ☐ | |
| 5.2 | UI mockups or wireframes are referenced or included | ☐ | |
| 5.3 | Accessibility requirements (WCAG level) are specified | ☐ | |
| 5.4 | Hardware interfaces (if any) are described | ☐ | |
| 5.5 | Software interfaces (APIs, databases, external systems) are documented | ☐ | |
| 5.6 | API endpoints, data formats, and protocols are specified | ☐ | |
| 5.7 | Communication interfaces (protocols, data transfer methods) are defined | ☐ | |

**Section Score:** ___/7

---

## 6. Non-Functional Requirements (Section 5)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 6.1 | Performance requirements include quantitative metrics (response time, throughput) | ☐ | |
| 6.2 | Security requirements specify authentication, authorization, encryption | ☐ | |
| 6.3 | Reliability requirements define uptime, MTBF, recovery time | ☐ | |
| 6.4 | Availability targets are specified (e.g., 99.5% uptime) | ☐ | |
| 6.5 | Maintainability requirements address code quality, documentation | ☐ | |
| 6.6 | Portability requirements specify supported platforms | ☐ | |
| 6.7 | Usability requirements are measurable (task completion time, error rate) | ☐ | |
| 6.8 | Scalability requirements define growth targets (users, data volume) | ☐ | |

**Section Score:** ___/8

---

## 7. Data Requirements (Section 6)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 7.1 | Logical data model (ERD or textual description) is included | ☐ | |
| 7.2 | All entities, attributes, and relationships are defined | ☐ | |
| 7.3 | Data dictionary defines each field (type, constraints, description) | ☐ | |
| 7.4 | Data retention and archival policies are specified | ☐ | |
| 7.5 | Data backup and recovery requirements are defined | ☐ | |

**Section Score:** ___/5

---

## 8. Quality Attributes (Section 7)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 8.1 | Quality attributes are defined with measurable targets | ☐ | |
| 8.2 | Acceptance criteria for quality attributes are specified | ☐ | |
| 8.3 | Quality assurance process is outlined | ☐ | |

**Section Score:** ___/3

---

## 9. Compliance Requirements (Section 8)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 9.1 | All relevant regulations are identified (GDPR, CCPA, WCAG, etc.) | ☐ | |
| 9.2 | Compliance requirements are specific and actionable | ☐ | |
| 9.3 | Industry standards (ISO, IEEE) are referenced if applicable | ☐ | |

**Section Score:** ___/3

---

## 10. Use Cases (Section 9)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 10.1 | Use cases follow a standard template (actors, preconditions, main flow, etc.) | ☐ | |
| 10.2 | All functional requirements are covered by at least one use case | ☐ | |
| 10.3 | Alternative flows and exception flows are documented | ☐ | |
| 10.4 | Postconditions (success and failure) are defined | ☐ | |
| 10.5 | Use case diagrams are included (if applicable) | ☐ | |

**Section Score:** ___/5

---

## 11. System Architecture (Section 10)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 11.1 | High-level architecture diagram is included | ☐ | |
| 11.2 | Major components and their responsibilities are described | ☐ | |
| 11.3 | Data flow diagrams illustrate key processes | ☐ | |
| 11.4 | Technology stack is specified | ☐ | |

**Section Score:** ___/4

---

## 12. Risks and Mitigation (Section 11)

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 12.1 | Major project risks are identified | ☐ | |
| 12.2 | Each risk has likelihood and impact assessment | ☐ | |
| 12.3 | Mitigation strategies are defined for each risk | ☐ | |
| 12.4 | Contingency plans are in place for high-severity risks | ☐ | |

**Section Score:** ___/4

---

## 13. Appendices

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 13.1 | Glossary is complete and alphabetically sorted | ☐ | |
| 13.2 | Requirements Traceability Matrix (RTM) is included | ☐ | |
| 13.3 | All requirements are traceable to design, code, and tests | ☐ | |
| 13.4 | Analysis models (state diagrams, sequence diagrams) are included if needed | ☐ | |

**Section Score:** ___/4

---

## 14. Requirements Quality

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 14.1 | **Correct:** Requirements accurately reflect stakeholder needs | ☐ | |
| 14.2 | **Unambiguous:** Each requirement has only one interpretation | ☐ | |
| 14.3 | **Complete:** No missing requirements (TBDs are justified) | ☐ | |
| 14.4 | **Consistent:** No contradictions between requirements | ☐ | |
| 14.5 | **Ranked:** Requirements are prioritized (High/Medium/Low) | ☐ | |
| 14.6 | **Verifiable:** Each requirement can be tested/verified | ☐ | |
| 14.7 | **Modifiable:** Requirements are structured for easy updates | ☐ | |
| 14.8 | **Traceable:** Each requirement has a unique ID and is in the RTM | ☐ | |
| 14.9 | **Feasible:** Requirements are technically and economically achievable | ☐ | |
| 14.10 | **Necessary:** All requirements add value (no gold-plating) | ☐ | |

**Section Score:** ___/10

---

## 15. Stakeholder Review

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 15.1 | Product owner has reviewed and approved scope | ☐ | |
| 15.2 | Engineering lead has reviewed technical feasibility | ☐ | |
| 15.3 | QA lead has reviewed testability of requirements | ☐ | |
| 15.4 | UX designer has reviewed usability requirements | ☐ | |
| 15.5 | Security team has reviewed security requirements | ☐ | |
| 15.6 | Legal team has reviewed compliance requirements | ☐ | |
| 15.7 | All stakeholder feedback has been addressed | ☐ | |

**Section Score:** ___/7

---

## 16. Traceability and Coverage

| # | Criteria | Status | Comments |
|---|----------|--------|----------|
| 16.1 | All functional requirements are traced to design documents | ☐ | |
| 16.2 | All functional requirements are traced to test cases | ☐ | |
| 16.3 | All test cases are traced back to requirements (no orphan tests) | ☐ | |
| 16.4 | Requirements coverage is ≥95% (justified gaps documented) | ☐ | |
| 16.5 | Bi-directional traceability is maintained (forward and backward) | ☐ | |

**Section Score:** ___/5

---

## 17. Common SRS Pitfalls (Avoid These!)

| # | Pitfall | Checked | Found Issues? |
|---|---------|---------|---------------|
| 17.1 | Vague requirements (e.g., "system should be fast") | ☐ | |
| 17.2 | Design details in requirements (e.g., "use PostgreSQL") | ☐ | |
| 17.3 | Missing error handling scenarios | ☐ | |
| 17.4 | Unrealistic performance targets | ☐ | |
| 17.5 | Security as an afterthought (not integrated) | ☐ | |
| 17.6 | No user acceptance criteria | ☐ | |
| 17.7 | Incomplete non-functional requirements | ☐ | |
| 17.8 | Missing edge cases and boundary conditions | ☐ | |
| 17.9 | Conflicting requirements not resolved | ☐ | |
| 17.10 | "TBD" placeholders without resolution plan | ☐ | |

---

## Overall Assessment

### Scoring Summary

| Section | Score | Max | Percentage |
|---------|-------|-----|------------|
| 1. Document Structure | ___/10 | 10 | ___% |
| 2. Introduction | ___/7 | 7 | ___% |
| 3. Overall Description | ___/7 | 7 | ___% |
| 4. Functional Requirements | ___/10 | 10 | ___% |
| 5. External Interfaces | ___/7 | 7 | ___% |
| 6. Non-Functional Requirements | ___/8 | 8 | ___% |
| 7. Data Requirements | ___/5 | 5 | ___% |
| 8. Quality Attributes | ___/3 | 3 | ___% |
| 9. Compliance | ___/3 | 3 | ___% |
| 10. Use Cases | ___/5 | 5 | ___% |
| 11. System Architecture | ___/4 | 4 | ___% |
| 12. Risks and Mitigation | ___/4 | 4 | ___% |
| 13. Appendices | ___/4 | 4 | ___% |
| 14. Requirements Quality | ___/10 | 10 | ___% |
| 15. Stakeholder Review | ___/7 | 7 | ___% |
| 16. Traceability | ___/5 | 5 | ___% |
| **TOTAL** | **___/99** | **99** | **___%** |

### Quality Gates

- **≥90% (89+/99):** ✅ **Excellent** - Ready for approval
- **80-89% (79-88/99):** ⚠️ **Good** - Minor revisions needed
- **70-79% (69-78/99):** ⚠️ **Acceptable** - Moderate revisions required
- **<70% (<69/99):** ❌ **Needs Significant Work** - Major revisions required

### Recommendation

☐ **Approve** - SRS is complete and ready for baseline  
☐ **Approve with Minor Changes** - Address comments and re-submit  
☐ **Revise and Re-submit** - Significant issues must be resolved  
☐ **Reject** - Does not meet minimum quality standards

---

## Action Items

| # | Issue | Section | Assigned To | Due Date | Status |
|---|-------|---------|-------------|----------|--------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

---

## Reviewer Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **QA Lead** | | | |
| **Engineering Lead** | | | |
| **Product Owner** | | | |
| **Project Manager** | | | |

---

## Revision Log for this Checklist

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | QA Team | Initial checklist for FVTP project |

---

## Tips for Effective SRS Review

1. **Review in Phases:** Don't try to review the entire document in one sitting
   - Phase 1: Structure and completeness (Sections 1-2)
   - Phase 2: Functional requirements (Section 3)
   - Phase 3: Non-functional and data (Sections 5-7)
   - Phase 4: Traceability and consistency (Section 16)

2. **Use Multiple Reviewers:** Different perspectives catch different issues
   - Technical reviewer: Feasibility and design implications
   - QA reviewer: Testability and completeness
   - Business reviewer: Alignment with business goals

3. **Focus on Testability:** For each requirement, ask "How will we test this?"

4. **Challenge Assumptions:** Verify that assumptions are documented and reasonable

5. **Check for Conflicts:** Look for contradictions between requirements

6. **Validate Against Use Cases:** Ensure all use cases are supported by requirements

7. **Review Traceability:** Confirm RTM is complete and accurate

8. **Consider Edge Cases:** Look for missing error handling and boundary conditions

9. **Assess Risks:** Ensure major technical and business risks are identified

10. **Get Stakeholder Buy-In:** Ensure all key stakeholders have reviewed and approved
