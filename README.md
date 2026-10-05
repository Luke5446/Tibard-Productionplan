# Tibard-Productionplan

## The cutting room log

Printing a works order pushes its fabric lines (the main cloth and any extra,
a mesh back) to a small shared file, `cutlog.json`, kept in its own GitHub
repo, `Luke5446/Tibard-Cutlog`. The **Cutting** tab reads that file:

- **To cut**: printed works orders not yet marked cut, oldest printed first
  (click the Printed heading to flip the order), with the standard metres
  per line; the search box narrows the list. One printed
  five or more days ago is flagged. The cutting room PC marks a line, or a
  whole works order, cut: the mark is dated that day. Each line has a metres
  box, started at the standard, and a comment box; a figure that differs from
  the standard needs the comment.
- **Cut log**: what was cut and when. Like the Embroidery tab, the lines come
  up for what is typed in the search box (a works order number, a product
  code or a fabric), with the completion date or "in WIP". **Undo** puts a
  line back on To cut.
- **Metres per day**, by fabric.

A line with no fabric or no metres on file is not sent to the cutting room:
it lands on the **Cutting review** tab (between Embroidery and Cutting, with a
badge) for the production manager. Open the works order and put the fabric
right (the ✎ fabric link on the line); where there is no usage on file, type
the metres for the whole line in **Metres cut** on the panel (it saves as you
leave the box) and the cutting room cuts to that figure. The line goes across
on its own. The log follows the works orders: a change to
one that is not yet cut (quantity, fabric, due date) replaces its waiting
lines a moment after the edit, and a works order already cut is left as cut
whatever is changed on it afterwards. **Push to cutting** on the review tab
sends anything still waiting if GitHub was down at the time.

A line the cutting room adjusted on the log carries that figure into the
works order panel and, on completion, into the fabric ledger as the actual
(see FABRIC.md, "The cutting room's figure").

The fabric in work in progress is on the **KPIs** tab: cloth cut and not
completed as at any date, valued at the fabric price the planner holds, for
month end and year end. A line the cutting room marked cut counts at its cut
metres; a live works order line the log never had (printed before the log
began) is taken as cut at standard; a line waiting on the log is still on the
roll and is not WIP. The Sage fabric write-off stays on completion.

Anyone who opens the planner sees the tab (read from GitHub Pages, up to a
minute behind). Writing needs a GitHub token on the PC that writes: the
cutting room's, and the editor's so the push happens on print. A printed
works order deleted in the planner is withdrawn from the list. The token is a
fine-grained one that can write `Tibard-Cutlog` and nothing else, kept in that
browser only (**Set up this PC** on the tab). Every save is a commit, so the
repo's history is the audit trail.

### Setting it up (once)

1. On GitHub, **New repository**: name `Tibard-Cutlog`, public (Pages needs
   it; the file holds works order references, codes and metres only), tick
   **Add a README**. Create it.
2. In that repo, **Settings → Pages**: source "Deploy from a branch", branch
   `main`, folder `/ (root)`. Save. After a minute
   `https://luke5446.github.io/Tibard-Cutlog/` answers.
3. A token: GitHub **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**. Name it "Tibard cutting log",
   expiry one year, **Repository access: Only select repositories →
   Tibard-Cutlog**, **Permissions → Repository permissions → Contents: Read
   and write**. Generate it and copy it (it is shown once).
4. In the planner, Cutting tab, **Set up this PC**: paste the token. Do this
   on the cutting room PC and on the editor's PC (the same token will do).
   The tag changes to "this PC can mark cuts".
5. Print a works order: it appears on the Cutting tab. Works orders printed
   before the token was set come across with **Push to the cutting room**
   (also **Push to cutting** on the Cutting review tab).

A works order due before 29 September 2026, when the log began, is never
pushed: it was cut before there was a list.

The file is created by the first push, so nothing needs adding to the repo by
hand. When the token expires, GitHub emails a week ahead: make a new one and
paste it on both PCs.

## Containers on the water

The stock planner publishes its container purchase orders, with the date each
one lands, at `https://luke5446.github.io/Tibard-Stock-Planner/data.json`. The
planner reads that file on every page load (editor, viewer and warehouse
alike). Under the On POP figure the first container carrying the code is named
with its landing date - blue when Sage already has the PO, grey when it does
not yet, since the PO is raised in Sage only once the goods are on the water -
with every container in the hover. The runway popup lands each container in
its week, so the closing stock there follows the real arrivals. Nothing is
saved and the WOP maths are unchanged: Sage's On POP stays the stock on order.

## Publishing for the team

**Publish for team** writes the editor's state to `data.json` in this repo,
which the viewers and the warehouse page read. With a GitHub token on the
editor's PC it puts the file into the repo itself, through the GitHub API,
and the team sees it within a minute; with no token, or if GitHub refuses,
it downloads `data.json` for the upload-and-commit routine and says why.

Setting the token up, once, on the production manager's PC: on GitHub,
**Settings → Developer settings → Personal access tokens → Fine-grained
tokens → Generate new token**; name it "Tibard production planner", expiry
one year, **Repository access: Only select repositories → Tibard-Productionplan**,
**Permissions → Repository permissions → Contents: Read and write**. Copy it
(shown once), then in the planner header **Set up this PC** and paste it. The
button changes to **Token**; an empty box removes it. This is a different
token from the cutting log's, which can write only `Tibard-Cutlog` and so is
safe on the cutting room PC. A token that can write this repo can change the
page itself, so it stays on the one PC that publishes. Every publish is a
commit, so the repo's history holds every version.

## Where the editor's data is kept

In the browser, in two places at once: `localStorage` and IndexedDB, under the
key `tibard_production`. Every save writes both and a load takes the newer.
localStorage alone is capped at about 5 MB for the whole `luke5446.github.io`
origin, which the costing app shares; once the two apps' data passed that,
every save failed silently and printed or deleted works orders came back on
the next open (30 Sep 2026). IndexedDB has no such cap. If a save reaches
neither store the header shows **NOT SAVED** and the editor is told once -
publish straight away and the work is safe in `data.json`.
