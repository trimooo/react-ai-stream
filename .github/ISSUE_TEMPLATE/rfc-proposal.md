---
name: RFC proposal (pre-RFC discussion)
about: Discuss a proposed protocol extension before writing a full RFC
title: "RFC discussion: [short title]"
labels: rfc, protocol
assignees: ''
---

## What you want to add

<!-- One paragraph. What event type, field, or behavior do you want to add to the RAIS Protocol? -->

---

## Why RAIS needs this

<!-- What use case does this enable? What cannot be done with RAIS v1 today? -->

---

## Rough wire format idea

```json
{
  "type": "your-event",
  "field": "value"
}
```

<!-- Even a rough sketch helps focus the discussion. -->

---

## Backward compatibility question

How would a RAIS v1 client behave when it receives this new event type? (v1 clients silently ignore unknown types — is that sufficient for your use case, or would v1 clients break?)

---

## Have you checked existing RFCs?

- [ ] I have read [`rfcs/README.md`](../../rfcs/README.md)
- [ ] This is not already covered by [RFC-0001](../../rfcs/RAIS-RFC-0001-tool-calls.md), [RFC-0002](../../rfcs/RAIS-RFC-0002-metadata.md), or [RFC-0003](../../rfcs/RAIS-RFC-0003-reasoning.md)

---

## Next step

If the discussion here reaches rough consensus, the next step is to write a full RFC using the template at [`rfcs/0000-template.md`](../../rfcs/0000-template.md) and open a PR.

Full RFCs require: motivation, complete wire format, backward compat analysis, alternatives considered, security considerations, and open questions.
