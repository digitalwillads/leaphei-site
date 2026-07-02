# Editing the Leap site — for Shane & Ashley

You can now change copy on the site yourself and have it publish automatically.
No software to install — everything happens in your web browser on GitHub.

## The three stages

**Change → Preview → Promote to prod**

| Stage | What it means | Where |
|-------|---------------|-------|
| **Change** | You edit the words on a page | GitHub web editor |
| **Preview** | Your change goes live on the preview site within ~1 minute | https://digitalwillads.github.io/leaphei-site/ |
| **Promote to prod** | Will pushes the approved site to the real **leaphei.com** | Will handles this cutover |

The preview site is your safe sandbox — the public still sees the current
leaphei.com until Will promotes. Edit freely; nothing you do here touches the
live public site.

## How to change copy

1. Go to the repository: **github.com/digitalwillads/leaphei-site**
2. Open the `_pages` folder and click the page you want to edit
   (e.g. `index.html` = homepage, `solutions-relax.html` = the Relax page,
   `about.html`, `faq.html`, etc.). **Always edit files inside `_pages/` —
   not the ones in the top-level folder.**
3. Click the **pencil icon** (top-right of the file) to edit.
4. Change the words between the tags. Edit only the *text*, e.g.:
   `<h2>Your Home Equity. Activated.</h2>` → change `Your Home Equity. Activated.`
   Leave the `<h2>`, `<p>`, `class="..."` bits alone.
5. Scroll down, click **Commit changes**, write a one-line note
   ("Updated Relax headline"), and confirm.
6. Wait ~1 minute, then refresh the preview site. Your change is live there.

## Seeing that it published

Every change runs an automatic build. Click the **Actions** tab in the repo — a
green check means it published; a red X means something in the edit broke the
page (usually a deleted tag). If you see red, undo your last edit and try again,
or send it to Will.

## Want to try a change without touching the shared preview?

Use a branch: when you commit, choose **"Create a new branch and start a pull
request."** That keeps your change separate until someone merges it. For quick
copy tweaks, editing `main` directly is fine.

## Getting access

Ask Will to add your GitHub username as a collaborator on
`digitalwillads/leaphei-site` (Settings → Collaborators). You'll get an email
invite — accept it, and you're in.
