# The Gap — hosting it yourself with Google Sheets

Two files do the work: `the-gap-standalone.html` is the site, `Code.gs` is the
bit that writes into your spreadsheet. Budget about 20 minutes.

---

## 1. Make the spreadsheet

1. Go to **sheets.new**. Name it something like *The Gap — responses*.
2. **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete whatever is in `Code.gs` there, paste in the whole of the `Code.gs`
   file from this folder, and save.

**If the Extensions menu is hidden** (narrow window), there's an easier route:
go to **script.new** instead, paste `Code.gs` there, and set `SHEET_ID` at the
top to your spreadsheet's id — the long string in the sheet's URL between
`/d/` and `/edit`. Everything else below is the same.

## 2. Deploy it

1. In the Apps Script editor, top right: **Deploy → New deployment**.
2. Click the gear next to "Select type" and pick **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. **Deploy**. Google will ask you to authorise it — go through
   *Advanced → Go to (project name)* and allow.
5. Copy the **Web app URL**. It ends in `/exec`.

> "Who has access: Anyone" sounds alarming but only means anyone can *submit* a
> response. Nobody can read your spreadsheet.

## 3. Point the site at it

Open `the-gap-standalone.html` in any text editor. Near the top of the script
block, line reads:

```js
const ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";
```

Replace that with your `/exec` URL, keeping the quotes. Save.

## 4. Put the site online

Easiest option, no account juggling:

1. Go to **app.netlify.com/drop**.
2. Drag `the-gap-standalone.html` onto the page.
3. You get a live URL in about ten seconds. Rename the site in
   *Site settings → Change site name* to something like `thegap-tapmi`.

That URL is what goes on your QR standee.

**GitHub Pages instead:** make a repo, rename the file to `index.html`, push it,
then *Settings → Pages → Deploy from branch → main*. Live in a minute or two.

## 5. Test before you print the QR code

1. Open your live URL, answer all 18 questions as a student.
2. Check the spreadsheet — a new row should appear within a second or two.
3. Open the **research** tab on the site. The shared-store line at the top
   should say *writing to your Google Sheet*.
4. Open the same URL on your phone and answer again. Both rows show up, and
   both devices see the same totals. That's the thing localStorage couldn't do.

If the status line says *not connected*, the ENDPOINT URL is wrong or the
deployment isn't set to "Anyone". Redeploy with **Deploy → Manage deployments →
edit → New version** — a fresh deployment gives a new URL, editing keeps it.

---

## What lands in the sheet

One row per person:

| column | holds |
|---|---|
| `id` | unique response id |
| `timestamp` | when they answered |
| `role` | `campus` or `industry` |
| `email` | filled in if they asked for the report |
| `q1` … `q18` | their pick, `A` or `B` |
| `why_q1` … `why_q18` | what a leader typed where they diverged from campus |

From there it's an ordinary spreadsheet — pivot it, chart it, pull it into the
report however you like.

## Mailing the report afterwards

The script deliberately does not send email, so it never asks for permission to
your Gmail — it only touches the spreadsheet.

To send the report, copy the `email` column out of the sheet and send it from
Gmail yourself, with the addresses in BCC. For the numbers you'll be dealing
with that takes a minute and keeps everyone's address private.

---

## Before the event

- [ ] Replace the sample baseline. The dashboard ships with placeholder data so
      it reads properly when empty — it is labelled, and there's a tick box to
      turn it off. Turn it off once real responses are coming in, and don't
      present those placeholder numbers as findings.
- [ ] Run campus collection a week early so the board isn't empty on the day.
- [ ] Load the live URL on the stall screen and leave the research tab open.
- [ ] Have the QR printed large. People scan from further away than you think.
