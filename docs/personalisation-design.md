# Personalisation (EMB / DTF): design thinking

Status: **discussion note, nothing built.** Captured so the special makes work
now underway does not paint us into a corner.

## The problem, stated plainly

Personalisation is a **process step**, not a product type. It can apply to any
of three sources:

| Source | Who gets it ready |
|---|---|
| Special make | Production — manufactured in house |
| Stock item | Warehouse — picked |
| Bought-in item | Warehouse — picked |

Today it runs on a Google sheet plus a manual Excel emb works order, emailed
with artwork. Same shape as the special makes process this project is replacing,
and the same failure modes: re-keying, no single source of truth, and no way to
see the whole queue.

## Why "does this need emb?" is currently unanswerable from the data

Three signals exist and none of them are reliable:

| Signal | Why it fails |
|---|---|
| `LOGOAPPLICATION` charge line | Staff forget to add it. A forgotten charge line means an invisible emb job |
| Free-text logo notes | Inconsistent wording; no structural link to the garment line |
| Which line does the logo apply to? | Nothing connects them. Not every line on an order is personalised |

The last one is the killer. On order `0000114816`, line 1 is a bib apron and
line 2 is `LOGOAPPLICATION — Maldon Salt Logo Centre Bib in White`. A human
reads that instantly. Nothing in the data says line 2 belongs to line 1 rather
than to some other line on the same order.

## On the branded code idea

The instinct — plain code vs branded code — is right, and for the right reason:
**it moves the decision from a per-order action to a per-product attribute.**
Staff cannot forget to flag personalisation if choosing the product already
says so. That is a structural fix, not a training fix, and it is the single
biggest thing on the table.

Two refinements.

### 1. Prefer a customer-specific suffix over a generic `-B`

`CJM0193LL03-B` says "branded" but not **branded for whom**. If two customers
both order that garment with their own logos, both lines carry `-B`, and:

- stock of `-B` is meaningless — one customer's branded stock cannot fill
  another's order
- the works order still has to carry the logo, so the code has not actually
  identified the job

The existing product file already solves this. `FENAP0534173` (Fenwick),
`WAGHTM016015` (Wagamama), `OHCJSMOXFORD4401S`, `CICJM01935803` — customer is
already encoded in the code for branded and special work. Extending that
convention to branded stock and bought-in items is consistent with what the
business already does, and each code is then a genuinely distinct product.

The cost is honest: more codes, and a setup step per customer/product pairing.
A generic `-B` is fewer codes but pushes identification back onto the works
order, which is where the ambiguity already lives.

Reasonable middle ground: customer suffix for anything repeating or held,
generic `-B` for true one-offs that will never sit in stock.

### 2. The suffix must not be the machine-readable mechanism

Whatever the naming convention, the **flag that systems read should be an
analysis code on the stock item** — `Personalisation: EMB / DTF / NONE` —
exactly like the stock-held flag this project already relies on.

This is not theoretical. The manufacturer field on these same records already
contains `StanleyStella` **and** `Stanley/Stella`; `Sols` **and** `SOL'S`;
`B&C` **and** `B & C Collection`; `Shoes For Crews` **and** `Shoes for Crews`.
That is what happens to a free-text convention over time. A naming convention
parsed by string matching will decay the same way. An analysis code will not:
it is a dropdown, it is queryable, and this project has already proved the
pattern works.

So: suffix for humans, analysis code for machines. Both, not either.

## The workflow question

> "The bit I struggle to figure out is how to have the app for the production
> manager to make the in house products and then this somehow gets to the emb
> manager when it needs its personalisation."

The struggle comes from thinking of it as a **handoff between two systems**. It
is easier as **one job record that moves through stages**.

### One job per sales order line

The `LineKey` built for special makes (`TIB-32036196` / `OH-32036228`) is
already the right identifier. It is permanent, unique across both companies, and
one per order line. That is the spine — the special makes work is not a
side project, it is the foundation.

Each job carries: source (make / pick / buy in), personalisation (EMB / DTF /
none), logo reference, quantity, promised date, customer, company.

### Stages, not handoffs

```
                 ┌─ source: make ──→ [PRODUCTION]  ─┐
sales order line ├─ source: stock ─→ [WAREHOUSE]   ─┼→ [EMB / DTF] → [DESPATCH]
                 └─ source: buy in →  [WAREHOUSE]  ─┘        ↑
                                                     skipped if personalisation = none
```

Nobody emails anybody. When production marks a works order complete, that job's
stage advances and it appears on the emb manager's list. The Google sheet and
the emailed works order both disappear because there is nothing left for them
to carry.

### Each role filters the same list

| Role | Sees |
|---|---|
| Production manager | Jobs at *to make* — raises works orders (stock buffer + special makes) |
| Warehouse | Jobs at *to pick*, including plain stock needed for an emb job |
| Emb manager | Jobs at *to personalise* — **plus** a forward view of what is still in manufacture or awaiting pick |

That forward view matters and is worth building deliberately. If the emb manager
only sees work once it lands on her bench, she cannot plan capacity, order
threads or prepare artwork. She should see what is coming and roughly when.

## What I would not do yet

**Do not change Sage stock transactions in the first pass.** Today branded goods
are not booked out as plain and back in as branded. Introducing `-B` codes with
real stock movements would make Sage accurate, but it is a genuine operational
change — new transactions, new discipline, retraining three teams.

Doing that *and* building the app at once is how this stalls. Get visibility
first: one list, correct routing, everyone seeing the same thing. Then decide
whether Sage transactions should follow. The app does not need Sage to be
accurate in order to be useful; it needs Sage to be **unambiguous about intent**,
which is what the analysis code delivers.

## Sequencing

1. **Finish special makes** — the sheet is done; the app tab is next. This
   proves the LineKey/dedupe spine on the smallest, best-understood case.
2. **Add the personalisation analysis code** in Sage, and start setting it on
   products as they come up. No app change needed; it just starts accumulating.
3. **Extend the feed** to every order line needing personalisation, whatever the
   source — the query already reads both companies and all order lines; it is a
   filter change, not a rewrite.
4. **Add stages and the emb view.**
5. **Then** revisit whether Sage should carry branded stock properly.

Steps 1 and 2 can run in parallel and neither blocks the other.

## Open questions

- Is EMB vs DTF a routing difference (different queue, different capacity) or
  just an attribute on the job? Guessing routing, but worth confirming.
- Can one order line need both EMB and DTF?
- Who owns setting the personalisation flag when a new product is created —
  sales office, or whoever sets up the product record?
- What happens to a job where the emb manager finds the artwork is not approved?
  Needs a blocked state, or it silently stalls.
