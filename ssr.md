# CSE471: System Analysis and Design
## Assignment on Functional Requirements
## Proposed Project Title: Tryora

**Group No: 08, CSE471 Lab Section: 01, Spring 2026**

| SL | ID | Name |
|----|----|------|
| 1 | 22299082 | Hirok Roy Rahul |
| 2 | 22299059 | Toha Nahin |
| 3 | 22101463 | Md. Mustafizur Rahman Minhaz |
| 4 | 22101453 | Abdullah Al Jubayer |

**Submission Date:**

---

## Project Overview

A web application that lets users create a personalized 3D avatar from full-body photos and dress it according to an event-based wardrobe system.

**Tech Stack:**
- **Language:** Typescript, JavaScript
- **Framework:** Next.js 16, Express.js
- **Styling:** TailwindCSS
- **3D Engine:** Three.js (@react-three/fiber)
- **Database:** PostgreSQL (Relational DB), Redis (key-value cache)
- **ORM:** Prisma
- **Deployment:** Vercel (Frontend), Railway (API),
- **External APIs:**
  - Serper API: Google shopping search
  - Nodemailer API: For Sending Notifications and Reminders.
  - Uploadthings: Blob Storage
  - Openrouter: LLM Reasonings
  - Pixazo: 3D model creating
  - Claid: Image editing, Image tryon generation

## User Roles

1. **User:** Primary role; can upload photos for avatar generation, browse scraped wardrobes, customize outfits, and export renders.
2. **Worker (System):** An automated background role that crawls fashion sites, parses product metadata, and updates the vector database.
---

## Functional Requirements

| SL | Common Workflows |
|----|-----------------|
| 1 | User Authentication & session management: Users can create an account by providing basic details such as name, email, phone number, and password. | Users can create an account by providing basic details such as name, email, phone number, and password. |
| 2 | Market Discovery & Search: The system automatically scrapes local fashion sites (like openclaw.ai) and stores products with semantic embeddings. Users can search for items using natural language (e.g., "red dress for Eid") | The system automatically scrapes local fashion sites (like openclaw.ai) and stores products with semantic embeddings. Users can search for items using natural language (e.g., 'red dress for Eid'). |

---

## Module 1

| Member | Feature Description |
|--------|--------------------|
| 1 | **Photo Upload & 3D Avatar Generation:** Generate a 3D model of the images | 
| 2 | **Market Parsing Dress Discovery:** Develops the Playwright-powered scraping service for myclaw.ai to extract titles, prices, and images for the database. | 
| 3 | **Budget Filter & Price Display:** Creates the price-range slider and "Best Value" badge logic to filter products by BDT cost tiers. |
| 4 | **Trending & Popular Items Carousel:** Builds the Redis-backed tracking system to display the most-viewed and most-saved items at the top of the wardrobe. |

---

## Module 2

| Member | Feature Description |
|--------|--------------------
| 1 | **Real-Time Dress Fitting:** Develops the 3D mesh overlay system to pin dress models to the avatar skeleton using bone parenting and morph targets. |
| 2 | **Body Measurement Based Size Recommendation:** Maps MediaPipe landmark ratios to brand-specific size charts to suggest S/M/L/XL fits. | 
| 3 | **Event-Based Filtering & Recommendations:** Implements the context-aware selector (Wedding, Eid, etc.) that re-ranks products based on event suitability. |  
| 4 | **Color & Pattern Variant Switcher:** Creates the UI and logic to swap material textures on the 3D model when different color variants are selected. | 

---

## Module 3

| Member | Feature Description |
|--------|--------------------|
| 1 | **Interactive Body-Part Selection:** Implements 3D raycasting zones on the avatar, allowing users to click body parts to browse specific accessories. |
| 1 | **Render Export High-Quality Images:** Builds the WebGL canvas capture system to generate 2K social-ready images with custom backdrops. | 
| 2 | **Outfit Save & Wishlist:** Develops the PostgreSQL storage logic to save full outfit configurations, including avatar parameters and applied items. |
| 2 | **Side-by-Side Outfit Comparison:** Provides a split-screen view rendering two independent 3D contexts to compare price, event suitability, and style between two different outfits | 
| 3 | **Outfit Share via Link:** Creates the read-only sharing route and Open Graph metadata generator for rich previews on WhatsApp/social media. |
| 3 | **Avatar Pose Selector:** Integrates preset animation clips (walking, sitting, standing) so users can preview the outfit in motion. | 
| 4 | **Offline Mode Cached Wardrobe:** Sets up the Service Worker (PWA-lite) to cache the catalog and saved outfits for use without an internet connection. | 
| 4 | **Accessibility Mode:** Ensures WCAG compliance with keyboard navigation, screen reader ARIA labels, and reduced motion settings. | 