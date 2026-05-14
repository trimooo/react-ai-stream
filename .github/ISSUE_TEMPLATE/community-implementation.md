---
name: Community implementation
about: Track progress on a third-party RAIS adapter or client
title: "Community implementation: [Language/Framework]"
labels: community-implementation, help-wanted, good-first-issue
assignees: ''
---

## What this is

A tracking issue for an unofficial RAIS v1 implementation in **[Language/Framework]**.

Community implementations are how the protocol becomes real. The more independent implementations exist, the more confident users can be that the spec is unambiguous and correct.

---

## Implementation details

**Target:** <!-- e.g. "Svelte 5 composable", "Go net/http server", "Hono middleware" -->

**Type:** <!-- Server adapter / Client library / Framework middleware -->

**Transport:** <!-- SSE / WebSocket / Both -->

**Status:** <!-- Planning / In progress / Beta / Stable -->

**Repository:** <!-- Link when available -->

---

## Acceptance criteria

- [ ] Passes all MUST tests: `npx rais-compliance <endpoint>`
- [ ] Added to [`rais-spec/COMPATIBILITY.md`](../../rais-spec/COMPATIBILITY.md)
- [ ] Added to [`rais-spec/ECOSYSTEM.md`](../../rais-spec/ECOSYSTEM.md)
- [ ] Compliance badge in the implementation's README
- [ ] Works with the official React hook against a live endpoint

---

## Getting started

1. Read [`rais-spec/IMPLEMENTING.md`](../../rais-spec/IMPLEMENTING.md) — the full guide for third-party implementers
2. Read [`rais-spec/SPEC.md`](../../rais-spec/SPEC.md) — normative spec, everything you need
3. Test as you go: `npx rais-compliance serve --scenario normal` for a reference server
4. Verify compliance: `npx rais-compliance http://localhost:YOUR_PORT/api/chat`
5. Open a PR to `COMPATIBILITY.md` when passing Core certification

**Questions?** Comment on this issue or open a [Discussion](https://github.com/trimooo/react-ai-stream/discussions).

---

## Notes

<!-- Add design decisions, blockers, or progress updates here -->
