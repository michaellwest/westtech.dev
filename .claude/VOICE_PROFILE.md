# Michael West — Voice Profile & Blog Post Guide

Drop this file into the westtech project repo. When writing a new post, share this file with Claude alongside your brain dump or rough notes.

---

## Who You Are (Context for Claude)

Michael West is a longtime Sitecore developer and multi-year Sitecore MVP who has been writing about Sitecore PowerShell Extensions, platform internals, security, and DevOps since ~2012. The blog is technical and practitioner-focused — the audience is developers who are already elbow-deep in the same platforms and problems. No hand-holding on basics.

---

## Voice Characteristics

### Tone

- Dry, understated humor used sparingly. When it lands, it's one or two sentences — never a bit. ("Kittens will cry. Ice cream will melt." is the ceiling.)
- Self-deprecating when appropriate ("The one time I actually read the manual I end up introducing an issue.")
- Matter-of-fact, not excitable. You don't oversell your own work.
- Warm but not chatty. Friendly sign-offs without gushing.

### Pronouns

- **"we/our"** when the work involved a team (team investigation, shared discovery, deployed to a shared system)
- **"I"** when it was your solo dig or personal opinion/recommendation
- Don't mix them carelessly — readers can tell

### Sentence rhythm

- Shorter sentences when listing facts or delivering a punchline
- Longer, flowing sentences when narrating the investigation or explaining reasoning
- Numbered and bulleted lists are fine for breakdowns, but prose carries the story

### What you include that others don't

- What you tried first that didn't work
- The decision you almost made differently, and why you changed your mind
- The disclaimer or caveat _after_ the fact, once you've had more time to think (e.g., the Hangfire post ending with "we actually ended up using Quartz.NET as a separate service")
- Actual numbers when you have them (127,300 blob records, 60GB MDF, 7 hours runtime)

### What you skip / don't do

- Long intros explaining what the technology is — readers already know
- Marketing language or adjectives like "powerful," "seamless," "robust"
- Rhetorical questions used as transitions
- Fake enthusiasm

---

## Post Structure

Posts follow a loose detective story arc. Adapt as needed, but this is the default:

```
1. One-sentence teaser (used on the index page — problem-first, not solution-first)
2. Section: Background / Back Story
   - What triggered the investigation? What were the symptoms?
   - Enough context that a reader knows if this is their problem too
3. Section: Research (optional, use when the path to the answer is interesting)
   - What you checked, what ruled things out, what surprised you
4. Section: The part you care about / The Fix / Resolution
   - The actual answer. Lead with it; explain after.
   - Include relevant code, config, or commands
   - Callout boxes or bold for "Recommendation:" items
5. Brief close
   - "I hope you found this useful." is fine. Keep it short.
   - Include references/links if any
```

Section headers should sound like something you'd actually say, not like a formal document. Examples from real posts:

- "The part you care about"
- "The Fix"
- "The important part"
- "Back Story"
- "Resolution"

---

## Index Page Summaries

These are the one-liners shown on westtech.dev's post listing. Formula: **[what went wrong or what the situation was] — [what the post delivers].**

Examples:

- "Over 60% of a Sitecore database consumed by orphaned blob records — here's what we found and how we fixed it."
- "A Sitecore 10.2.1 cumulative hotfix changed how federated authentication handles roles at sign-in — and took our users' permissions with it."
- "Running Unicorn and Sitecore CLI side-by-side during a staged migration surfaces some subtle compatibility problems worth knowing about."

---

## Frontmatter Format (for westtech.dev)

Posts appear to use a date + tag structure. When producing a post, include a frontmatter block:

```yaml
---
title: "Post Title Here"
date: YYYY-MM-DD
tags: [sitecore, dotnet, security] # use lowercase, use existing tags where possible
summary: "One-sentence index summary."
---
```

Common existing tags: `sitecore`, `dotnet`, `hangfire`, `database`, `security`, `sxa`, `certificates`, `networking`, `serialization`, `unicorn`, `sitecore-cli`, `authentication`, `identity`, `docker`

---

## How to Use This File with Claude

When starting a new post, say something like:

> "Here's my VOICE_PROFILE.md. I want to write a post about [topic]. Here's my brain dump: [paste rough notes, bullet points, whatever you have]. Write a draft."

Claude will handle structure, transitions, and pacing. You review for factual accuracy and whether the voice feels right. Iterate from there.

You can also say:

- "The opening is too formal — make it sound more like the blob records post"
- "Add a disclaimer at the end like the Hangfire post"
- "Pull the summary line for the index page"

---

## Sign-off Patterns

Your posts tend to close one of two ways:

**Warm but brief:**

> "I hope you found this useful. One day you too might be investigating such a rare and peculiar issue. Good luck!"

**Feedback invite:**

> "Give it a try and let me know how it works out for you on your projects. Feedback welcome."

Avoid ending with a summary paragraph that repeats what was just said. End on the last useful thing, then close.
