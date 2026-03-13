# Resident Voice — Bug Fix & Improvement Tasks

## Context
React + Firebase (Firestore) app: `App.jsx` is a single-file component (~958 lines).  
Stack: React, Vite, Tailwind CSS, Firebase Auth/Firestore, FingerprintJS, DOMPurify, Fuse.js, Lucide React.

---

## Task 1 — Fix: `searchQuery` missing from `useMemo` dependency array (Bug)

**File:** `src/App.jsx`  
**Priority:** High

**Problem:**  
The `displayCards` `useMemo` hook filters cards by `searchQuery` but `searchQuery` is not listed in the dependency array. This means the filtered result will not re-compute when the user types in the search box — search appears broken.

**Current code (line ~500–523):**
```js
const displayCards = useMemo(() => {
  let rootCards = cards.filter(c => !c.parentId);

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    rootCards = rootCards.filter(c =>
      (c.text && c.text.toLowerCase().includes(query)) ||
      (c.author && c.author.toLowerCase().includes(query))
    );
  }
  // ...
}, [cards, sortBy]); // ← searchQuery is missing here
```

**Fix:** Add `searchQuery` to the dependency array:
```js
}, [cards, sortBy, searchQuery]);
```

---

## Task 2 — Fix: Vote button has no disabled/loading state (UX Bug)

**File:** `src/App.jsx`  
**Priority:** High

**Problem:**  
`votingCards` Set is used to track in-progress votes, but the ThumbsUp `<button>` is never disabled while the async call is pending. Users can spam-click and trigger multiple Firestore writes.

**Current code (line ~824):**
```jsx
<button onClick={() => toggleLike(card)} ...>
  <ThumbsUp ... />
</button>
```

**Fix:** Disable the button and show a subtle loading indicator when the card is in `votingCards`:
```jsx
<button
  onClick={() => toggleLike(card)}
  disabled={votingCards.has(card.id)}
  className={`p-1.5 transition-colors bg-slate-50 rounded-lg border border-slate-100 relative group
    ${votingCards.has(card.id) ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-400 hover:text-emerald-600'}`}
>
  <ThumbsUp className={`w-3.5 h-3.5 ${card.likedBy?.includes(user?.uid) ? 'fill-current text-emerald-500' : ''}`} />
</button>
```

---

## Task 3 — Fix: `maxCardsPerUser` not set when creating a board (Bug)

**File:** `src/App.jsx`  
**Priority:** Medium

**Problem:**  
`addCard` reads `currentBoard?.maxCardsPerUser` (line ~324) with a fallback of `3`, but `addBoard` never writes this field to Firestore. Every board silently uses the hardcoded default of 3.

**Current `addBoard` (line ~463–475):**
```js
await setDoc(doc(db, 'boards', bid), {
  id: bid,
  name: newBoardName,
  maxVotes: newMaxVotes,
  status: 'open',
  createdAt: Date.now()
  // maxCardsPerUser is never set
});
```

**Fix:**
1. Add a `newMaxCardsPerUser` state variable (default: `3`).
2. Add a number input next to the board creation form for this value (label: "จำนวนข้อเสนอสูงสุดต่อเครื่อง").
3. Include `maxCardsPerUser: newMaxCardsPerUser` in the `setDoc` call.
4. Reset `newMaxCardsPerUser` to `3` after creating the board.

---

## Task 4 — Fix: Duplicate warning text not truncated (UX Bug)

**File:** `src/App.jsx`  
**Priority:** Low

**Problem:**  
The duplicate warning renders the full text of the similar card (line ~617). If an existing card has a very long message, this breaks the layout.

**Current code:**
```jsx
<p className="text-xs text-amber-700 mt-1 line-clamp-2">"{duplicateWarning.text}" (โดย {duplicateWarning.author})</p>
```

**Fix:** Truncate `duplicateWarning.text` to a max of 80 characters before rendering:
```jsx
<p className="text-xs text-amber-700 mt-1 line-clamp-2">
  "{duplicateWarning.text?.length > 80 ? duplicateWarning.text.substring(0, 80) + '...' : duplicateWarning.text}"
  (โดย {duplicateWarning.author})
</p>
```

---

## Task 5 — Improvement: Show Admin login button on mobile (UX)

**File:** `src/App.jsx`  
**Priority:** Medium

**Problem:**  
The Admin sign-in and Print buttons use `hidden md:flex` — they are completely invisible on mobile screens. Admin cannot sign in or print from a phone.

**Current code (line ~549–562):**
```jsx
<button className="hidden md:flex items-center gap-2 ...">
  {isAdmin ? 'สิทธิ์ผู้ดูแลระบบ: เปิดใช้งาน' : 'เข้าสู่ระบบด้วย Google'}
</button>
<button className="hidden md:flex items-center gap-2 ...">
  <Printer ... /> พิมพ์รายงาน
</button>
```

**Fix:** Move both buttons into the mobile layout. Options:
- Remove `hidden md:flex` and allow wrapping, OR
- Add a collapsed "more actions" dropdown/menu on mobile that contains these buttons.

Recommended approach: Change `hidden md:flex` → `flex` and let the navbar wrap on small screens using `flex-wrap` (already present on the parent `div`).

---

## Task 6 — Improvement: Add `totalVotes` cap display consistency (Logic)

**File:** `src/App.jsx`  
**Priority:** Medium

**Problem:**  
`totalVotes` on a card = parent votes + all children votes (computed in `displayCards`). But the vote limit check in `toggleLike` uses only `card.votes` (parent only), not `totalVotes`. This means:
- Display shows `totalVotes/maxLimit` (combined)
- Enforcement checks `card.votes` (parent only)

A card can visually appear "full" but still accept votes on the parent, or vice versa.

**Fix:** In `toggleLike`, calculate `totalVotes` the same way as `displayCards` does before checking the limit:
```js
const children = cards.filter(c => c.parentId === card.id);
const totalVotes = (card.votes || 0) + children.reduce((sum, c) => sum + (c.votes || 0), 0);
const limit = currentBoard?.maxVotes || 10;

if (!hasLiked && totalVotes >= limit) {
  alert(`ไม่สามารถโหวตได้: ข้อเสนอนี้ได้รับโหวตเต็มจำนวนแล้ว (สูงสุด ${limit} โหวต)`);
  return;
}
```

Note: `cards` array is available in the component scope, so this is safe to reference inside `toggleLike`.

---

## Summary Table

| # | Task | File | Priority | Type |
|---|------|------|----------|------|
| 1 | Add `searchQuery` to `useMemo` deps | `App.jsx` | 🔴 High | Bug |
| 2 | Disable vote button while pending | `App.jsx` | 🔴 High | Bug |
| 3 | Add `maxCardsPerUser` to `addBoard` | `App.jsx` | 🟡 Medium | Bug |
| 4 | Truncate duplicate warning text | `App.jsx` | 🟢 Low | UX |
| 5 | Show Admin/Print button on mobile | `App.jsx` | 🟡 Medium | UX |
| 6 | Fix vote cap check to use `totalVotes` | `App.jsx` | 🟡 Medium | Logic |
