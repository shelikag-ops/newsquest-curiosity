# NewsQuest: GitHub Pages + Google Sheets

This folder contains the prepared Issue 334 website and Google Apps Script backend. It is not deployed yet. The originals in Downloads are unchanged.

## Connect the Sheet

1. Open the prepared [Issue 334 response Sheet](https://docs.google.com/spreadsheets/d/1-amKnaxDNLdJIOdotYr9UNYt-MdpXdY5zlEkNynU564/edit).
2. Choose Extensions → Apps Script. Copy `newsquest-apps-script.gs` into the editor.
3. Run `setup` once and authorize it. It records the spreadsheet ID and creates Responses, Scores, Wall and Replies tabs. Use a separate Sheet for each issue; Scores is an issue-specific summary.
4. Deploy → New deployment → Web app. Execute as yourself; access Anyone. If your organization disallows this, the administrator must permit it or a different backend is needed.
5. Copy the deployment URL ending in `/exec` into `CONFIG.endpoint` in `index.html`. Never put passwords, tokens or Google service-account credentials into the website.
6. After changing the script, update the deployment to a new version.

## Publish on GitHub

The prepared repository location is `issue-334/` in `shelikag-ops/newsquest-curiosity`. Merge the prepared branch after setting and testing the endpoint. Upload `index.html` and `.nojekyll` to that folder if doing this manually. You may also store this README and the script as source files; Apps Script must still be deployed separately. Inspect existing repository content before replacing any file.

In Settings → Pages, select Deploy from a branch, then the intended branch and root folder (or the repository's existing publishing configuration). GitHub supplies the published website URL.

## What is collected

- Responses: one row per submitted action, including wrong answers, guesses captured at hints/reveal, reflections, robot pitches, questions and replies. Columns include reporter, mission, item, answer, correctness, attempt points, detail, private photo link, event ID, issue, answer time, session and score snapshot.
- Scores: one row per reporter with the highest recorded total for each mission. These are practice points supplied by the browser, not a secure assessment. They can include self-reported answers. Use one issue per Sheet. Same-name reporters share a score row; use distinct nicknames. Device totals are merged by mission maximum, not by question across devices.
- Wall and Replies: questions and replies for review. The public wall is disabled by default; answers still reach the private Sheet. To deliberately show the wall on the public website, set Script Property `ENABLE_PUBLIC_WALL` to `true`. Anyone with the endpoint can then read non-hidden posts and reporter names. Hide checkboxes remove posts from the public wall.
- Photos: stored privately in the owner's NewsQuest uploads Drive folder. Their links appear in Responses.

Only submitted actions are sent; unfinished typing remains on the device. Mission 1's inline quiz is currently empty. The optional Wayground link logs self-reported completion only; actual Wayground attempts and quiz results must be imported separately. Keep those results separate from activity points.

## Analyze easily

Turn on a filter in Responses to compare reporter, mission, item and correctness. Create a pivot table with Reporter and Mission as rows and count of Event ID as the value to compare participation. Filter incorrect answers to identify follow-up topics. Use Scores for current practice totals; do not sum Responses.Points because repeat attempts can earn points already counted in the summary. Response text and Details preserve open-ended thinking for qualitative review.

## Reliability and launch check

The page keeps a local queue and only removes IDs explicitly acknowledged by the server. A network error never counts as a confirmed save. It retries every 30 seconds and when connectivity returns. The server checks event IDs against the Sheet permanently, so retries do not duplicate response rows. Do not clear browser storage while answers are pending. Local storage can fill, particularly with photos; a visible warning then asks the student to keep the page open.

Before sharing with students, use a distinct Test Reporter on the live GitHub Pages URL. Submit one of each answer type and a photo. Confirm each row, timestamp, score and photo link in the Sheet; reload and check for duplicates. Test offline submission followed by reconnection. Switch reporters while an answer is pending and verify attribution. Test the deployed site on the phones/tablets students will use. Cross-origin requests and Google permissions must be verified against the actual deployment; local checks cannot establish that.

The public endpoint accepts anonymous practice submissions; reporter selection is not authentication. Keep the Sheet private and use nicknames if publishing the roster.

References:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/content
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
