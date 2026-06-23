# 🎨 Design Document
**Nisreen Birthday Quiz — UI/UX Spec**

---

## Design Philosophy

> Fun, fast, and personal. Every screen should feel like a celebration, not a form.

The quiz is designed to feel like a **mobile game** — not a survey. Interactions are instant, feedback is expressive, and the whole experience wraps up in under 3 minutes.

---

## Visual Identity

| Attribute | Decision | Rationale |
|-----------|----------|-----------|
| Primary color | Purple `#7F77DD` | Festive, energetic, gender-neutral |
| Success color | Green `#639922` | Clear positive feedback |
| Error color | Red `#E24B4A` | Clear negative feedback |
| Typography | System sans-serif | Fast to load, native feel |
| Corner radius | 12px (cards), 8px (buttons) | Friendly, modern |
| Border style | 0.5px subtle | Clean, not heavy |

---

## Screen Flow

```
[ Start Screen ]
      ↓
  Press "Start"
      ↓
[ Question Screen ] ×10
  → Select answer
  → Show feedback (correct / wrong + fun fact)
  → Press "Next"
      ↓
[ Score Screen ]
  → Show final score
  → Show emoji reaction
  → Review all answers
  → Option to replay
```

---

## Screen Breakdown

### 1. Start Screen

- Birthday emoji row (decorative, sets the mood)
- Title: *"Happy Birthday, Nisreen!"*
- Subtitle: short instructions
- Info card: rules summary
- CTA button: `🕹️ Start the Quiz`

**Tone:** Warm, welcoming, celebratory

---

### 2. Question Screen

**Header:**
- Progress bar (fills as questions are answered)
- Question counter: `Question X / 10`
- Live score: `⭐ N`

**Body:**
- Question card with clear, readable text
- 4 answer buttons — letter-coded (A / B / C / D)

**After selection:**
- Correct option highlights green
- Wrong selection highlights red
- Feedback box appears with fun fact
- "Next →" button becomes visible

**States:**

| State | Visual |
|-------|--------|
| Default | Neutral border, subtle hover |
| Selected (correct) | Green background + green letter badge |
| Selected (wrong) | Red background + red letter badge |
| Correct (revealed) | Always highlighted green |
| Disabled | No hover, no cursor pointer |

---

### 3. Score Screen

**Structure:**
- Emoji confetti row (reacts to score)
- Score circle: big number + "out of 10"
- Score title + subtitle (changes by performance tier)
- Shareable result box (copy/paste friendly)
- Answer review list (✅ / ❌ per question)
- Replay button

**Score Tiers:**

| Score | Title | Confetti |
|-------|-------|----------|
| 10/10 | Perfect Score! 🏆 | 🎉🎊🎂🎈🏆 |
| 7–9 | Great job! You know her well 💛 | 🎉🎊🎂🎈 |
| 4–6 | Not bad! You know some stuff 😄 | 🎂🎈🎁 |
| 0–3 | Oops! Get to know Nisreen better 😅 | ☕😄🎁 |

---

## Interaction Principles

- **Instant feedback** — no loading, no delays
- **No going back** — once an answer is selected, locked in (adds stakes)
- **Always visible progress** — bar + counter reduce anxiety
- **Expressive but not loud** — color feedback without animations that distract

---

## Mobile Considerations

- Single-column layout throughout
- Tap targets minimum 44px height
- Font sizes: 16px body, 22px headings (no squinting)
- No horizontal scrolling
- Tested mental model: works with one thumb

---

## Accessibility Notes

- Color is never the only signal (✅ ❌ icons supplement color)
- Sufficient contrast on all text/background combinations
- Buttons are native `<button>` elements (keyboard + screen reader friendly)
- No auto-advancing — user controls all transitions

---

## Content Guidelines

Questions should be:
- **Specific to Nisreen** — not generic "what's her favorite color" trivia
- **Light-hearted** — no sensitive topics
- **Slightly opinionated** — the fun is in the debate
- **Team-appropriate** — safe for a workplace setting

Each question includes a **fun fact** shown after answering — this is what makes people laugh and react, so write these with personality.

---

*Document version: 1.0 — Birthday Edition 🎂*