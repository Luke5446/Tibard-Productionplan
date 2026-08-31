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

### 1. A generic `-B` is correct — a customer suffix is not

An earlier draft of this note argued for a customer-specific suffix. That was
wrong, and the reason matters.

Customers do not buy a narrow range. A hundred customers a week might each order
the same t-shirt with their own logo, which under a customer-suffix scheme means
**a hundred new product codes for one garment**, every week, forever. The product
file already carries ~107,000 items and a lot of dead history; that scheme would
make the problem worse at an accelerating rate, and every code needs setting up
by hand.

So: **one plain code and one branded code per garment**. `CJM0193LL03` and
`CJM0193LL03-B`. Two codes per garment, not one per customer per garment.

Special makes need no suffix — the code is already unique to the job and the
detail lives on the works order.

This does leave a real question, addressed below: if the code no longer says
whose logo it is, what does?

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

## Lining artwork up to the order

With a generic `-B`, the code says *this needs branding* but not *with what*.
That is the gap to close, and it is closed by splitting the question in two:

> **Artwork is a property of the customer. Placement is a property of the order.**

Those are different things with different lifespans, and conflating them is what
makes the current process fragile.

### A logo library, keyed by customer account

Most customers have one logo, some have two or three — a main mark and a
colourway variant. Each entry holds:

| | |
|---|---|
| Customer account | `HAR005`, `FEN001`… — the join key, already in the feed |
| Logo name | "Aramark White/Red" |
| Artwork | the approved file |
| EMB file | digitised stitch file |
| DTF file | print-ready file |
| Default placement | "Left chest as worn" |
| Approved date | what "Approved 26.8.26" is trying to record today |

This must live in the app, not Sage — Sage cannot hold artwork sensibly. The
customer account number is the join, and the feed already carries it.

### Defaults at customer level, overrides at line level

For a repeat customer the placement is nearly always the same. So:

- a `-B` line inherits the customer's default logo and placement automatically
- the order line only needs an instruction when it **differs** from the default
- the emb manager sees plainly which she is looking at: *customer default* or
  *explicit instruction*

This is the part that fixes "staff forget". A forgotten placement is no longer a
missing instruction — it falls back to what that customer always has. Forgetting
becomes harmless instead of invisible.

Where a customer has more than one logo and the line says nothing, the job is
flagged **needs logo selection** rather than guessed at. Visible, not silent —
the same principle as the review buckets in the special makes feed.

### EMB vs DTF

DTF is heat transfer, EMB is embroidery. The method should **not** go in the
product code — `-EMB` and `-DTF` variants would put the code count back up and
the method is not really a property of the garment.

It belongs on the job's **operations**, of which there can be more than one —
confirmed: a customer can have both EMB and DTF on the same product. So a job
carries a list of operations, each with its own method, logo and placement,
rather than a single method field. Where a logo exists in only one
format the method is decided for you. Where it exists in both, the order line or
the emb manager chooses.

If the two are genuinely separate queues with separate capacity — still to
confirm — that is a filter on the emb view, not a different kind of job.

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

- Are EMB and DTF separate queues with separate capacity, or one queue with a
  method attribute? Affects the emb view, not the data model.
- ~~Can one order line need both EMB and DTF?~~ **Yes** — confirmed. A job is
  therefore one-to-many with its operations: a line can carry an embroidered
  chest logo and a printed back. The model must allow several operations per
  job from the start; retrofitting that later would mean reworking every queue
  and every completion state.
- Who owns setting the personalisation flag when a new product is created —
  sales office, or whoever sets up the product record?
- What happens to a job where the emb manager finds the artwork is not approved?
  Needs a blocked state, or it silently stalls.
