# Editorial Style Guide — The AI Files

## Mission

The AI Files documents true stories from the age of AI: incidents, decisions, failures, and turning points. The goal is analytical clarity — not breathless excitement, not cynicism, not hype.

Stories should leave readers with a precise understanding of what happened, why it mattered, and what it reveals about AI systems and the humans who build and deploy them.

---

## Voice

**Be analytical, not exclamatory.** The facts are interesting enough. Don't editorialize the significance — let the timeline and consequences do the work.

**Be specific, not gestural.** "The chatbot told a customer their refund request was invalid — citing a policy that did not exist" is better than "The AI made things up." Specificity builds trust and clarity.

**Be direct.** Short sentences. Active voice. Cut adjectives that don't add information.

**Be fair.** Organizations fail. Engineers make errors. Systems behave unexpectedly. That's the story — not a moral verdict.

---

## What To Avoid

- **Hype language**: "groundbreaking," "revolutionary," "game-changing," "unprecedented" (unless verifiably true and explained)
- **Vague consequence**: "raised questions," "sparked debate," "went viral" — state the actual consequence
- **Empty framing**: "In the age of AI..." / "As artificial intelligence continues to..." — start with the specific event
- **Omniscience**: Don't state what people "felt" or "intended" unless sourced
- **Editorializing harm**: Let the facts carry the weight; avoid "shockingly" / "egregiously" unless quoting someone

---

## Story Types

| Type | Definition | Example |
|------|-----------|---------|
| **Incident** | A specific, bounded event with a paper trail | Air Canada chatbot lawsuit |
| **Milestone** | A verifiable first or inflection point | AlphaGo Move 37 |
| **Pattern** | Systemic behavior documented across multiple cases | AI resume screening bias |
| **Anatomy** | Deep explainer of how something works or failed | How Tay got trained to hate |

---

## Story Structure

Stories follow a section-based structure with numbered labels:

```
01 — Context     Background and scene-setting
02 — What Happened  The specific events, chronologically or causally
03 — The Mechanism  How/why it happened technically or organizationally
04 — Consequence  What resulted — legally, financially, reputationally
05 — Signal      What this reveals about the broader pattern
```

Not all stories need all five. Match structure to the story. The canvas animation goes at the most dramatically appropriate break — typically between sections 01 and 02.

---

## Uncertainty Standards

Every factual claim must be classifiable as one of:

| Label | Meaning |
|-------|---------|
| `[CONFIRMED]` | Sourced from primary document, official record, or direct quote |
| `[PLAUSIBLE]` | Supported by strong secondary sourcing; no contradiction found |
| `[DISPUTED]` | Credible sources disagree; present both sides |
| `[UNVERIFIED]` | Reported but not independently confirmed; flag explicitly |

In the final published draft, do not use these labels verbatim — instead, use prose that encodes the same meaning: "according to court filings," "the company did not respond to comment," "the report, which [party] disputes, states..."

---

## Source Standards

**Prefer in priority order:**

1. Primary documents (court filings, patents, SEC filings, regulatory records, official transcripts)
2. Direct quotes from named principals (not anonymous)
3. Contemporaneous news coverage from outlets with editorial standards
4. Academic or research papers (peer-reviewed preferred)
5. Company blog posts, press releases (use with caution; note source bias)

**Reject:**
- Aggregator summaries without original sourcing
- Anonymous sources without corroboration
- Social media posts as sole evidence of a claim
- Circular sourcing (article A cites article B which cites article A)

---

## Headlines and Decks

The title should be:
- Specific to the incident, not generic to AI broadly
- Defensible from the sources cited
- Under 60 characters where possible

The deck (one-sentence summary) should:
- Complete the story, not tease it
- Name what happened, not how shocking it was
- Be usable as a standalone summary for AI citation systems

---

## Canvas Animation Brief

When briefing the art director on a canvas animation, include:

- **Thesis**: The single sentence that captures the story's central argument
- **Emotional register**: What should the viewer feel? (unease, wonder, absurdity, dread)
- **Key symbolic elements**: What physical metaphor maps to the story's mechanics?
- **Color constraint**: Story accent color (`--story`) + background (`--bg` = `#0d0d0d`)
- **Motion register**: Slow and atmospheric (0.2–0.4px/frame) unless the story requires otherwise

The animation must be intelligible as a metaphor for the story — someone who has read the piece should recognize what the canvas is depicting.
