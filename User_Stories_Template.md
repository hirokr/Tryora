# User Stories Template with Acceptance Criteria

**Project:** Fashion Virtual Try-On Platform  
**Version:** 1.0  
**Date:** February 11, 2026

---

## User Story Format

### Standard Template

```
As a [type of user],
I want [an action or feature],
So that [benefit or value].

**Acceptance Criteria:** (Gherkin Format)
Given [initial context]
When [action/event]
Then [expected outcome]
And [additional outcome]

**Priority:** [High/Medium/Low]
**Story Points:** [1, 2, 3, 5, 8, 13]
**Sprint:** [Sprint number or backlog]
**Dependencies:** [Other stories or technical requirements]
**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approval
```

---

## Epic 1: User Authentication & Onboarding

### Story 1.1: User Registration

**Story ID:** US-001  
**Title:** User can create an account with email and password

**User Story:**
```
As a new visitor,
I want to register for an account with my email and password,
So that I can save my garments and try-on results.
```

**Acceptance Criteria:**

**Scenario 1: Successful Registration**
```gherkin
Given I am on the registration page
And I am not already registered
When I enter a valid email address "user@example.com"
And I enter a password "SecurePass123!"
And I enter my full name "Jane Doe"
And I check the "I agree to Terms of Service" checkbox
And I click the "Sign Up" button
Then I should see a success message "Check your email to verify your account"
And a verification email should be sent to "user@example.com"
And my account should be created with status "unverified"
```

**Scenario 2: Registration with Existing Email**
```gherkin
Given I am on the registration page
And an account with email "existing@example.com" already exists
When I enter email "existing@example.com"
And I enter a password "SecurePass123!"
And I click "Sign Up"
Then I should see an error message "An account with this email already exists"
And no new account should be created
And I should see a link to "Try logging in or use password reset"
```

**Scenario 3: Registration with Weak Password**
```gherkin
Given I am on the registration page
When I enter email "user@example.com"
And I enter password "weak"
And I click "Sign Up"
Then I should see an error "Password must be at least 8 characters with 1 number and 1 special character"
And the password field should be highlighted in red
And a password strength meter should show "Weak"
```

**Scenario 4: Registration Without Accepting Terms**
```gherkin
Given I am on the registration page
When I fill in all fields correctly
But I do not check the "Terms of Service" checkbox
And I click "Sign Up"
Then I should see an error "You must accept the Terms of Service to continue"
And the checkbox should be highlighted
And no account should be created
```

**Priority:** High  
**Story Points:** 5  
**Sprint:** Sprint 1  
**Dependencies:** None

**Definition of Done:**
- [x] Registration form UI implemented
- [x] Email validation (format check)
- [x] Password strength validation (8+ chars, 1 number, 1 special)
- [x] Terms of Service checkbox required
- [x] Error messages display for all validation failures
- [x] Success message and email sending integration
- [x] Unit tests for validation logic (95% coverage)
- [x] Integration test for registration flow
- [x] E2E test covering happy path and error cases
- [x] Deployed to staging environment
- [x] Product owner sign-off

**Technical Notes:**
- Use `bcrypt` with cost factor 12 for password hashing
- Email validation regex: RFC 5322 compliant
- Store user with `verified: false` flag initially
- Generate verification token (JWT, 24hr expiry)

---

### Story 1.2: Email Verification

**Story ID:** US-002  
**Title:** User can verify email address via verification link

**User Story:**
```
As a newly registered user,
I want to verify my email address by clicking a link,
So that I can prove I own the email and access my account.
```

**Acceptance Criteria:**

**Scenario 1: Verify with Valid Link**
```gherkin
Given I registered with email "user@example.com"
And a verification email was sent to my inbox
When I open the email
And I click the verification link
Then I should be redirected to the login page
And I should see a success message "Email verified! You can now log in."
And my account status should be changed to "verified"
```

**Scenario 2: Verify with Expired Link**
```gherkin
Given I registered 25 hours ago
And the verification link was sent (24hr expiry)
When I click the verification link
Then I should see an error "Verification link expired"
And I should see a button "Resend verification email"
And my account should remain "unverified"
```

**Scenario 3: Resend Verification Email**
```gherkin
Given my verification link expired
And I am on the "Link Expired" page
When I click "Resend verification email"
Then a new verification email should be sent
And I should see "New verification email sent. Please check your inbox."
And the new link should be valid for 24 hours
```

**Scenario 4: Verify Already Verified Account**
```gherkin
Given my email is already verified
When I click an old verification link
Then I should be redirected to the login page
And I should see "Email already verified. Please log in."
```

**Priority:** High  
**Story Points:** 3  
**Sprint:** Sprint 1  
**Dependencies:** US-001 (User Registration)

**Definition of Done:**
- [x] Verification endpoint implemented (`/auth/verify-email/:token`)
- [x] Token validation (check expiry, signature)
- [x] Account status update to `verified`
- [x] Redirect to login with success message
- [x] Resend verification email functionality
- [x] Email template for verification email
- [x] Error handling for expired/invalid tokens
- [x] Unit tests for token generation and validation
- [x] Integration tests for verification flow
- [x] Deployed to staging
- [x] Product owner approval

---

## Epic 2: Virtual Try-On

### Story 2.1: Upload Body Image

**Story ID:** US-010  
**Title:** User can upload a full-body photo for virtual try-on

**User Story:**
```
As a registered user,
I want to upload a full-body photo of myself,
So that I can use it as a base for virtual try-on.
```

**Acceptance Criteria:**

**Scenario 1: Upload Valid Body Image**
```gherkin
Given I am logged in
And I am on the "Upload Body Image" page
When I select a JPEG image "my-photo.jpg" (5MB, 1500x2000px)
And the image shows my full body (head to feet)
And I click "Upload"
Then the system should detect my body pose
And the pose confidence should be >= 70%
And the image should be uploaded to S3
And I should see a success message "Body image uploaded successfully"
And the image should appear in my "Body Images" gallery
```

**Scenario 2: Upload Image Without Clear Pose**
```gherkin
Given I am on the "Upload Body Image" page
When I select an image where only my upper body is visible
And I click "Upload"
Then the system should run pose detection
And the pose confidence should be < 70% (incomplete pose)
And I should see an error "Could not detect full body pose"
And I should see guidance "Please upload a photo showing your full body from head to feet"
And the image should not be saved
```

**Scenario 3: Upload Oversized Image**
```gherkin
Given I am on the "Upload Body Image" page
When I select an image file of 12MB (exceeds 10MB limit)
And I click "Upload"
Then I should see an error "File size exceeds 10MB limit"
And the upload should be prevented
And I should see a tip "Try compressing your image or taking a new photo"
```

**Scenario 4: Upload at Maximum Limit**
```gherkin
Given I already have 5 body images uploaded (maximum limit)
And I am on the "Upload Body Image" page
When I try to upload another image
Then the upload button should be disabled
And I should see a message "You have reached the maximum of 5 body images"
And I should see "Delete an existing image to upload a new one"
```

**Scenario 5: Set Default Body Image**
```gherkin
Given I have uploaded 3 body images
And none are set as default
When I click the "Set as Default" button on image #2
Then image #2 should be marked with a "Default" badge
And any previous default should be unmarked
And image #2 should be auto-selected for new try-on requests
```

**Priority:** High  
**Story Points:** 8  
**Sprint:** Sprint 2  
**Dependencies:** US-001 (User Registration), Infrastructure (S3 setup, MediaPipe integration)

**Definition of Done:**
- [x] File upload UI with drag-and-drop
- [x] Image preview before upload
- [x] File size validation (client-side and server-side)
- [x] Image format validation (JPEG, PNG only)
- [x] Pose detection integration (MediaPipe)
- [x] Pose confidence threshold enforcement (70%)
- [x] S3 upload with presigned URLs
- [x] Pose keypoints stored in database (33 landmarks)
- [x] Thumbnail generation (200x200px)
- [x] Body images gallery UI
- [x] Set default functionality
- [x] Delete body image functionality
- [x] 5-image limit enforcement
- [x] Error messages for all failure cases
- [x] Unit tests for validation logic
- [x] Integration tests for upload flow
- [x] E2E test covering upload and gallery
- [x] Performance: upload completes in <5s (10MB on 3Mbps)
- [x] Deployed to staging
- [x] Product owner approval

**Technical Notes:**
- Use presigned S3 URLs for direct client-to-S3 upload (reduces server load)
- MediaPipe Pose model: Detect 33 keypoints (x, y, visibility)
- Reject if critical keypoints (shoulders, hips, knees) have visibility < 0.5
- Store pose data as JSONB in `body_images.pose_data`
- Generate thumbnail server-side after upload confirmation

---

### Story 2.2: Generate Virtual Try-On

**Story ID:** US-011  
**Title:** User can generate a virtual try-on image

**User Story:**
```
As a user with uploaded body images and garments,
I want to select a garment and generate a virtual try-on image,
So that I can see how the garment would look on me.
```

**Acceptance Criteria:**

**Scenario 1: Generate Try-On (Single Garment)**
```gherkin
Given I am logged in
And I have a body image "body-1.jpg" uploaded
And I have a garment "blue-jacket.jpg" in my catalog
When I go to the "Try-On" page
And I select body image "body-1.jpg"
And I select garment "blue-jacket.jpg"
And I click "Generate Try-On"
Then a try-on job should be queued
And I should see a job ID "job-abc123"
And I should see "Estimated time: ~20 seconds"
And a progress modal should appear
And the modal should show progress updates:
  | "Queued..."
  | "Processing..." (25%)
  | "Generating..." (75%)
  | "Complete!" (100%)
And the generation should complete in <30 seconds (p95)
And I should see the generated try-on image
And the image should show me wearing the blue jacket
```

**Scenario 2: Generate Try-On (Outfit: Top + Bottom)**
```gherkin
Given I have body image "body-1.jpg"
And I have garments "white-shirt.jpg" and "black-jeans.jpg"
When I select both garments for try-on
And I click "Generate Try-On"
Then the system should apply garments in layering order (jeans first, then shirt)
And the generated image should show both garments correctly layered
And the processing time should be <30 seconds
```

**Scenario 3: Try-On Generation Fails**
```gherkin
Given I initiate a try-on generation
When the ML service fails to generate the image (e.g., pose alignment error)
Then the system should retry the job once automatically
And if the retry also fails
Then I should see an error modal "Generation failed. This may be due to unclear pose or garment."
And I should see options:
  | "Try a different body image"
  | "Try a different garment"
  | "Retry with same settings"
And the failed job should be logged for investigation
```

**Scenario 4: Real-Time Progress Updates**
```gherkin
Given I have started a try-on generation
And my WebSocket connection is active
When the job status changes from "queued" to "processing"
Then I should see the progress modal update to "Processing..." within 1 second
And when status changes to "generating"
Then the modal should update to "Generating..." within 1 second
And the progress bar should animate smoothly
```

**Scenario 5: Cancel Try-On During Processing**
```gherkin
Given my try-on job is in "queued" status
And the progress modal is showing
When I click the "Cancel" button
Then the job should be removed from the queue
And the modal should close
And I should return to the garment selection screen
And I should see a message "Try-on cancelled"
```

**Scenario 6: Download Try-On Result**
```gherkin
Given my try-on generation is complete
And the result image is displayed
When I click the "Download" button
Then the image should download as "tryon-2026-02-11-blue-jacket.jpg"
And the image should be 1024x1024px JPEG format
```

**Scenario 7: Quota Enforcement (Free User)**
```gherkin
Given I am a free-tier user
And I have generated 20 try-ons today (daily limit)
When I attempt to generate another try-on
Then I should see an error "Daily try-on limit reached (20/20)"
And I should see "Upgrade to Pro for unlimited try-ons" (call-to-action)
And the generation should not be queued
```

**Priority:** Critical  
**Story Points:** 13  
**Sprint:** Sprint 3-4  
**Dependencies:** US-010 (Body Images), US-020 (Garment Upload), ML Service Integration

**Definition of Done:**
- [x] Try-on request API endpoint (`POST /api/v1/tryon`)
- [x] Garment selection UI (multi-select with preview)
- [x] Body image selection UI
- [x] Job queue implementation (Bull + Redis)
- [x] ML service integration (VITON-HD)
- [x] Progress modal UI with WebSocket updates
- [x] Fallback to polling if WebSocket fails
- [x] Result display UI (full-screen image viewer)
- [x] Download functionality
- [x] Error handling and retry logic
- [x] Cancel functionality
- [x] Daily quota enforcement (20 try-ons for free users)
- [x] Processing time <30s (p95) validated in staging
- [x] Unit tests for job queue logic
- [x] Integration tests for full try-on flow
- [x] Load test: 100 concurrent try-on requests
- [x] E2E test covering happy path and error scenarios
- [x] Deployed to staging
- [x] User testing (n=10) for UX validation
- [x] Product owner approval

**Technical Notes:**
- Use Bull queue with Redis for job management
- Job timeout: 60 seconds (hard limit)
- WebSocket room per user session for real-time updates
- Store result in S3, reference URL in database
- ML service runs on GPU instances (g4dn.xlarge)
- Implement exponential backoff for retries (1s, 2s, 4s)
- Garment layering order: bottom → top → outerwear

---

## Epic 3: Outfit Management

### Story 3.1: Create Outfit from Garments

**Story ID:** US-030  
**Title:** User can create and save an outfit

**User Story:**
```
As a user with multiple garments,
I want to combine them into a saved outfit,
So that I can quickly try on coordinated looks.
```

**Acceptance Criteria:**

**Scenario 1: Create Outfit with Multiple Garments**
```gherkin
Given I have garments "white-shirt", "black-pants", and "brown-shoes" in my catalog
When I go to the "Create Outfit" page
And I select "white-shirt", "black-pants", and "brown-shoes"
And I enter outfit name "Business Casual"
And I click "Save Outfit"
Then the outfit should be saved with 3 garments
And I should see a success message "Outfit 'Business Casual' created"
And the outfit should appear in my "Outfits" list
```

**Scenario 2: Create Outfit Without Name**
```gherkin
Given I am creating an outfit
When I select garments but leave the name field empty
And I click "Save Outfit"
Then the system should auto-generate a name like "Outfit 1"
And the outfit should be saved successfully
```

**Scenario 3: Warning for Unusual Combinations**
```gherkin
Given I am creating an outfit
When I select 2 tops and 0 bottoms
And I click "Save Outfit"
Then I should see a warning "You've selected 2 tops. Is this intentional?"
And I should see options "Save Anyway" or "Go Back"
And if I click "Save Anyway"
Then the outfit should be saved as-is
```

**Scenario 4: Link Outfit to Event**
```gherkin
Given I have an event "Sarah's Wedding" created
And I am creating an outfit
When I select garments for the outfit
And I choose "Sarah's Wedding" from the "Link to Event" dropdown
And I save the outfit
Then the outfit should be linked to "Sarah's Wedding"
And the outfit should appear on the event detail page
```

**Priority:** Medium  
**Story Points:** 5  
**Sprint:** Sprint 4  
**Dependencies:** US-020 (Garment Upload), US-040 (Events)

**Definition of Done:**
- [x] Outfit creation UI (garment multi-select)
- [x] Outfit name input (optional, auto-generate if empty)
- [x] Event linking dropdown
- [x] Validation for unusual combinations (warning, not error)
- [x] Save outfit API (`POST /api/v1/outfits`)
- [x] Outfit list view
- [x] Unit tests for outfit creation logic
- [x] Integration test for outfit CRUD
- [x] E2E test for creating and viewing outfit
- [x] Deployed to staging
- [x] Product owner approval

---

## Non-Functional Requirements as User Stories

### Story NFR-001: Fast API Response Times

**User Story:**
```
As a user,
I want all page interactions to feel fast and responsive,
So that I have a smooth experience without frustrating delays.
```

**Acceptance Criteria:**

**Scenario 1: API Response Time Under Load**
```gherkin
Given the system has 100 concurrent users
When a user makes an API request to list garments
Then the API should respond in <200ms for 95% of requests
And in <500ms for 99% of requests
```

**Scenario 2: Page Load Performance**
```gherkin
Given a user is on a 4G connection
When they navigate to the dashboard page
Then the First Contentful Paint should occur in <1.5 seconds
And the page should be fully interactive (TTI) in <3 seconds
And the Lighthouse performance score should be >= 90
```

**Priority:** High  
**Story Points:** N/A (Continuous)  
**Sprint:** All Sprints

**Definition of Done:**
- [x] New Relic APM monitoring configured
- [x] Performance budgets set in CI/CD
- [x] Lighthouse CI integrated
- [x] Weekly performance reports generated
- [x] Performance regression alerts configured

---

### Story NFR-002: Accessible Interface

**User Story:**
```
As a user with disabilities,
I want to use the platform with assistive technologies,
So that I can access all features equally.
```

**Acceptance Criteria:**

**Scenario 1: Keyboard Navigation**
```gherkin
Given I am a keyboard-only user
When I navigate the garment catalog page
Then I should be able to tab through all interactive elements
And focus indicators should be clearly visible
And I should be able to activate buttons with Enter or Space
And I should be able to open dropdowns and select options with keyboard
```

**Scenario 2: Screen Reader Compatibility**
```gherkin
Given I am using a screen reader (NVDA or JAWS)
When I navigate the try-on page
Then all images should have descriptive alt text
And form fields should have associated labels
And error messages should be announced
And page headings should be properly structured (h1 → h2 → h3)
```

**Scenario 3: Color Contrast**
```gherkin
Given I have low vision
When I view any page on the platform
Then all text should have a contrast ratio of at least 4.5:1 (WCAG AA)
And interactive elements should not rely on color alone
```

**Priority:** High  
**Story Points:** N/A (Continuous)  
**Sprint:** All Sprints

**Definition of Done:**
- [x] axe-core automated tests in CI/CD (0 violations)
- [x] Manual WCAG AA audit completed
- [x] All images have alt text
- [x] All forms have proper labels
- [x] Keyboard navigation tested
- [x] Screen reader tested (NVDA + JAWS)
- [x] Color contrast validated
- [x] Accessibility statement published

---

## User Story Workflow

### Story Lifecycle States

1. **Backlog:** Story identified, not yet prioritized
2. **Ready:** Story refined, acceptance criteria defined, ready for sprint planning
3. **In Progress:** Development started
4. **Code Review:** Implementation complete, awaiting peer review
5. **Testing:** QA testing in progress
6. **Done:** All acceptance criteria met, deployed to production

### Story Refinement Checklist

Before a story is marked "Ready":
- [ ] User story follows "As a... I want... So that..." format
- [ ] Acceptance criteria written in Gherkin (Given/When/Then)
- [ ] All scenarios identified (happy path + edge cases)
- [ ] Story points estimated by team
- [ ] Dependencies identified
- [ ] Definition of Done tailored to story
- [ ] Technical notes documented (if applicable)
- [ ] Priority assigned
- [ ] Product owner reviewed and approved

### Story Review Template

**Review Questions:**
1. Does this story deliver user value?
2. Can it be completed in one sprint?
3. Are acceptance criteria testable?
4. Are there any missing scenarios?
5. Are dependencies clear and manageable?
6. Is the Definition of Done achievable?

---

## Gherkin Best Practices

### Do's ✅
- Use business language, not technical jargon
- Keep scenarios focused (one behavior per scenario)
- Use "And" to chain multiple conditions or outcomes
- Use tables for data-driven scenarios
- Write from the user's perspective

### Don'ts ❌
- Don't write UI implementation details in scenarios
- Don't make scenarios too long (>10 steps = split it)
- Don't mix multiple user flows in one scenario
- Don't use ambiguous terms ("some", "many", "should work")

### Example: Data-Driven Scenario

```gherkin
Scenario Outline: Upload images of various formats
  Given I am on the upload page
  When I upload a file "<filename>" of format "<format>" and size "<size>MB"
  Then I should see "<result>"

  Examples:
    | filename        | format | size | result                    |
    | photo.jpg       | JPEG   | 3    | Upload successful         |
    | photo.png       | PNG    | 5    | Upload successful         |
    | photo.gif       | GIF    | 2    | Error: GIF not supported  |
    | largephoto.jpg  | JPEG   | 12   | Error: File exceeds 10MB  |
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Product Team | Initial user stories for MVP |
| 0.9 | 2026-02-05 | Product Team | Draft stories for review |
