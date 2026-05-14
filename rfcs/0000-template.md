# RAIS-RFC-NNNN: Short Title

- **Number:** NNNN
- **Title:** Short Title
- **Status:** Draft
- **Author:** Your Name (GitHub: @username)
- **Created:** YYYY-MM-DD
- **Target version:** RAIS v2.0 (or v1.X)

---

## Summary

One paragraph. What does this RFC propose, in plain language?

---

## Motivation

Why does RAIS need this? What use cases does it enable? What problems does it solve that cannot be solved with RAIS v1?

Include concrete examples of what becomes possible.

---

## Detailed design

### Wire format

Show the exact JSON payload(s):

```json
{"type": "your-event", "field": "value"}
```

Define every field:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"your-event"` | yes | Discriminant |
| `field` | `string` | yes | Description |

### Client behavior

What MUST/SHOULD/MAY clients do when they receive this event?

### Server behavior

What MUST/SHOULD/MAY servers do when emitting this event?

### Sequencing

In what order can this event appear in a stream? Can it appear before `text`? After `done`?

---

## Backward compatibility

### Existing v1 clients

v1 clients MUST silently ignore unrecognized event types (per SPEC.md §8). How does this proposal interact with that requirement?

### Existing v1 servers

v1 servers MUST NOT emit this event type (per SPEC.md §8). What is the migration path for servers that want to adopt this event?

---

## Alternatives considered

What other approaches were evaluated? Why was this design chosen over them?

---

## Security considerations

Does this proposal introduce any new attack surface? Does it affect privacy? Does it interact with the existing abort semantics?

---

## Open questions

List unresolved questions that reviewers should focus on. These should be resolved before the RFC moves to Accepted.

1. Question one?
2. Question two?

---

## References

- Link to relevant discussions, prior art, or existing implementations
