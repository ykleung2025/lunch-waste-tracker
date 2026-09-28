# School days 2026–27 — parse check

Source: `樂華天主教小學 2026-2027 校曆表` (`/tmp/daycycle.txt`)  
Output: `school-days-2026-27.json` — **163** D1–D6 recording days  
Range: **2026-09-04 (D1)** → **2027-07-07 (D1)**

## Counts by month

| Month | D-days |
|-------|--------|
| 2026-09 | 18 |
| 2026-10 | 19 |
| 2026-11 | 17 |
| 2026-12 | 15 |
| 2027-01 | 17 |
| 2027-02 | 11 |
| 2027-03 | 12 |
| 2027-04 | 17 |
| 2027-05 | 18 |
| 2027-06 | 16 |
| 2027-07 | 3 |
| **Total** | **163** |

By cycle day: D1=28, D2–D6=27 each.

## Anchors

| Check | Result |
|-------|--------|
| 2026-09-04 D1 … 09-11 D6 | OK |
| 2026-09-15 D1 … 09-18 D4 (13 open day / 14 holiday — no D) | OK |
| 2026-09-21 D5 … 09-25 D3; **09-28 D4, 09-29 D5, 09-30 D6** | OK (see note) |
| 2026-10-16 S excluded | OK |
| 2026-11-12 E excluded | OK |
| 2026-11-27 TD excluded | OK |

**Note on Sep 27:** A stated anchor listed `09-27 D4, 09-28 D5, 09-29 D6`, but the PDF grid (Sun–Sat columns) and weekday map put **Sun 27 blank**, then Mon 28=D4, Tue 29=D5, Wed 30=D6. Existing Google Calendar Sep–Dec JSON matched the PDF. Treated the `09-27` form as a typo.

## vs prior `school-days-2026-27.json` (Sep–Dec)

No discrepancies — prior partial list matched the PDF cell-for-cell. File extended with Jan–Jul 2027.

## Uncertain / judgment calls

1. **2026-11-13 D4\*** — P6 exam window (`12–17/11*`) but cell is `D4`; remarks say P1–5 full day. **Included** (white D day).
2. **Half-day white days** (e.g. 11/11 D3, 3/3 D4, 2/6 D2, 21/6 D4) — marked D, **included** for recording.
3. **PDF month school-day totals** `(21)(20)…` vs counted coded cells differ by ~1 for Nov/Jan/Apr; D/E/S/TD **letters under dates** were followed, not the parenthetical totals.
4. **S / E / TD never consume a D slot** — cycle only advances on white D cells (verified continuous D1→…→D6 through the year).
5. **Jul after 07-07** — only S (結業禮 / 校本活動) then summer; no further D days.

## Excluded categories (not in JSON)

Holidays; **E** exam; **S** special activity; **TD** teacher development; weekends without a D code.
