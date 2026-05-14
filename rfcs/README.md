# RAIS Protocol RFCs

This directory contains Request for Comments (RFC) documents for proposed changes to the RAIS Protocol. The RFC process governs how the protocol evolves.

## Why an RFC process?

RAIS v1 is frozen (see [`rais-spec/STABILITY.md`](../rais-spec/STABILITY.md)). New capabilities require deliberate design, community input, and formal approval before entering the spec. The RFC process is how that happens — transparently, with a written record.

An RFC is not a feature request. It is a complete protocol design proposal that includes motivation, wire format, backward compatibility analysis, and security considerations.

---

## RFC stages

```
DRAFT → REVIEW → ACCEPTED
                       ↘ REJECTED
             ↘ WITHDRAWN
```

| Stage | Meaning |
|-------|---------|
| **Draft** | Author is iterating on the design. Not yet ready for broad feedback. |
| **Review** | Open for community comment. Author is actively responding. Typically 2–4 weeks. |
| **Accepted** | Approved for inclusion in a future protocol version. Implementation work may begin. |
| **Rejected** | Will not be included. Rationale recorded in the RFC. |
| **Withdrawn** | Author withdrew the proposal. May be resubmitted later. |

---

## Submitting an RFC

1. Copy [`0000-template.md`](0000-template.md) to `RAIS-RFC-NNNN-short-title.md` (use the next available number)
2. Fill in all sections — motivation, wire format, backward compatibility, and security are required
3. Open a pull request — this starts the Draft stage
4. Request a move to Review by adding `[REVIEW REQUEST]` to the PR title
5. After the review period, maintainers accept or reject with written rationale

---

## What requires an RFC

**Always requires an RFC:**
- New event types
- New required fields on existing events
- Changes to transport framing
- Changes to abort or reconnect semantics

**Does not require an RFC:**
- New optional fields on existing events (handled via errata)
- Clarifications to existing spec language
- New SDK features (governed by package semver, not the protocol)
- New adapter packages

---

## Active RFCs

| Number | Title | Stage | Author |
|--------|-------|-------|--------|
| [RFC-0001](RAIS-RFC-0001-tool-calls.md) | Tool Call Events | Draft | trimooo |
| [RFC-0002](RAIS-RFC-0002-metadata.md) | Stream Metadata Event | Draft | trimooo |
| [RFC-0003](RAIS-RFC-0003-reasoning.md) | Reasoning / Thinking Events | Draft | trimooo |

---

## Accepted RFCs (in RAIS v1)

RAIS v1 was not developed through an RFC process — it was designed internally. These RFCs document the decisions that were made, retroactively:

_None yet. RFCs are forward-looking from this point._

---

## Rejected / Withdrawn RFCs

_None yet._
