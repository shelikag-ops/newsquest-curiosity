# NewsQuest Map Hunt, Issue 340

`index.html` is the homework page (borders only, no place names). Kids drop 20 pins, type their name, team and an email address, and press **Submit my pins**. The page sends the pins to a Google Apps Script backend, which:

- scores each pin (3 points within 100 km, 2 within 400 km, 1 within 1,000 km; big targets like seas get extra room),
- saves the submission to the Google Sheet **NewsQuest Map Hunt 340 - Responses** (tabs: Submissions, Pins),
- emails a score report to the address the child typed,
- shows the score and a pin-by-pin breakdown on the page.

The answer key lives only in the Apps Script, not in the web page.

## How it's connected

- Backend: the Apps Script project **NewsQuest Map Hunt 340** in the host's Google account (script.google.com), deployed as a web app (Execute as: me, Access: Anyone). The page's `ENDPOINT` points at that web app.
- Results go to the host's private Google Sheet, NewsQuest Map Hunt 340 - Responses.
- The script (with the answer key) is kept out of this public repository on purpose. A copy is in "Stay Curious/NewsQuest tools/map-hunt-340" on the host's computer.
- If you change the script, use Deploy → Manage deployments → Edit → New version so the same link keeps working.

Score emails come from the host's Gmail account (free accounts can send about 100 a day). Each submission is emailed once; pressing Submit again with the same pins doesn't send a second email.

## Link

https://shelikag-ops.github.io/newsquest-curiosity/map-hunt-340/
