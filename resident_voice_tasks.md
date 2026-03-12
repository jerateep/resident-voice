# Resident Voice -- Development Task List

## 1. Security (Critical)

### 1.1 Firestore Security Rules

Goal: Prevent users from editing data or bypassing UI by calling API
directly.

Tasks: - Design Firestore rules for: - Boards read access (public) -
Card creation (authenticated anonymous users) - Voting restriction (1
vote per user per card) - Prevent users from: - Editing cards created by
others - Deleting cards - Modifying vote counts directly - Only Admin
can: - Merge cards - Move categories - Delete cards - Close boards

Deliverable: - firestore.rules file - Test cases using Firebase Emulator

------------------------------------------------------------------------

### 1.2 Device Fingerprint Protection

Goal: Prevent users from voting multiple times by logging out and
re-authenticating.

Tasks: - Integrate FingerprintJS - Generate deviceHash - Store
deviceHash in vote record - Validate duplicate device votes

Deliverable: - Device fingerprint service - Vote validation logic

------------------------------------------------------------------------

### 1.3 Rate Limiting (Card Creation)

Goal: Prevent spam card creation.

Tasks: - Add board configuration: - maxCardsPerUser - Track card creator
using: - deviceHash - Before creating a card: - count existing cards by
deviceHash - reject if exceeding limit

Deliverable: - Validation logic - UI message when limit reached

------------------------------------------------------------------------

## 2. Admin Security

### 2.1 Replace Admin PIN

Problem: Admin PIN stored in frontend bundle (Vite).

Tasks: - Remove VITE_ADMIN_PIN - Create admin collection in Firestore

Example: admins uid

-   Implement admin check function

Deliverable: - Admin authentication logic - Firestore rule using
isAdmin()

------------------------------------------------------------------------

### 2.2 Admin Audit Logs

Tasks: Create auditLogs collection

Fields: - action - adminUid - cardId - targetCardId (for merge) -
timestamp

Track actions: - MERGE_CARD - MOVE_CARD - DELETE_CARD - CLOSE_BOARD

Deliverable: - Logging middleware/service

------------------------------------------------------------------------

## 3. Board Lifecycle

Add board status field:

OPEN CLOSED ARCHIVED

Tasks: - Prevent card creation when board closed - Prevent voting when
board closed

Deliverable: - UI status indicator - Backend validation

------------------------------------------------------------------------

## 4. Anti-XSS Protection

Tasks: - Integrate DOMPurify - Sanitize user input before saving -
Sanitize before rendering

Deliverable: - XSS-safe input pipeline

------------------------------------------------------------------------

## 5. Duplicate Issue Detection

Goal: Prevent many similar cards.

Tasks: - Integrate Fuse.js - Compare new card text with existing cards -
Warn user if similarity score \> threshold

Deliverable: - Duplicate suggestion UI

------------------------------------------------------------------------

## 6. Reporting

Implement report page with:

### 6.1 Top Issues

-   Sort by vote count
-   Top 10 cards

### 6.2 Category Summary

Votes grouped by category

### 6.3 Participation Metrics

-   Number of unique voters
-   Total votes

Deliverable: - Report dashboard - Print-friendly view

------------------------------------------------------------------------

## 7. Database Structure Refactor

Recommended collections:

boards id title status maxCardsPerUser createdAt

cards id boardId text category votesCount createdByDevice createdAt

votes id cardId uid deviceHash

auditLogs id action adminUid timestamp

------------------------------------------------------------------------

## 8. UX Improvements

Tasks: - Vote animation feedback - Card sorting options - Top vote -
Newest - Search cards - Mobile UI improvements

------------------------------------------------------------------------

## 9. Deployment

Target: 100 residents Fully free hosting

Tasks: - Configure Firebase free tier - Enable Firestore indexes -
Configure Firebase Hosting

Deliverable: - Production deployment guide

------------------------------------------------------------------------

## 10. Optional Advanced Features

### AI Issue Summarization

Use Azure OpenAI to summarize many cards into main topics.

Example: 50 cards → 5 summarized issues.

Deliverable: - Summarization API - Admin summary view
