# WRLD — The Curriculum for Adulthood

WRLD is a free educational platform teaching practical life skills school doesn't cover — resumes, budgeting, credit, taxes, apartment hunting, mental wellness, and more — through long-form guided Playbooks, sequenced Learning Paths, live Programs, an AI-personalized Assessment, a moderated Community, a Volunteer Hours Tracker, and a full account/role system (Explorer → Mentor → Administrator → Owner).

This is **WRLD Website Version 15.1** — a static HTML/CSS/vanilla-JS frontend (no build step, no framework) backed by a real Supabase project (Postgres + Auth + Storage). See `CLAUDE.md` for the complete, continuously-maintained technical reference (file map, data model, conventions, architecture decisions) — that file is the source of truth for how the codebase actually works; this README is an entry point and a naming/versioning note.

## What changed in Version 15.1

Three targeted revisions on top of V15: the hero illustration was replaced with a transparent-background version (`images/wrld-hero-island-v2.png`) and enlarged, removing the rounded-panel look the old opaque image had; both hero CTA buttons had their emoji removed; and new signups no longer require opening a confirmation email — see `CLAUDE.md`'s "Revision Pass 15.1" entry for full detail, and `SUPABASE_SETUP.md` for the one required Supabase dashboard setting change ("Confirm email" off) this depends on.

## What changed in Version 15

A visual-only redesign: a global navy navigation toolbar (applied site-wide through the existing single shared `renderHeader()`/`renderFooter()` system — no per-page duplication), a new two-column homepage hero built around the supplied island illustration, and refreshed color tokens across the homepage sections. No content, routes, functionality, or database integration changed. Orbit (mascot, launcher, chat panel, response engine) was explicitly out of scope for this pass and was verified byte-for-byte untouched. See `CLAUDE.md`'s "Revision Pass 15" entry for full detail, including the WCAG contrast fixes made while matching the hero background to the illustration's exact sampled color.

## A note on this release's naming

The specification this pass was built from titled the work **"Version 13.1: Production Authentication, Email Workflows, Mentor Management and Playbook UX"** in its heading, while its opening and closing instructions asked for the finished result to be delivered as **"WRLD Website Version 14"** in a ZIP named `WRLD-Website-V14.zip`. Those two labels disagree (the spec's own ZIP-requirements section separately says `WRLD-Website-V13.1.zip`). This release follows the more prominent, repeated instruction — **delivered as Version 14**, in `WRLD-Website-V14.zip` — while internal documentation (this changelog, code comments, migration names) still refers to the underlying work as "the V13.1 pass" or "V14," used interchangeably, since that's the label the spec itself used most consistently in-line. If a single canonical version number needs to be chosen going forward, treat **Version 14** as canonical for anything user-facing (this README, the ZIP filename), and "13.1" as historical/internal shorthand for this specific pass of work.

## What changed in this release

See `VERSION-13.1-CHANGELOG.md` for the complete list. In short: production-ready custom SMTP setup, a dedicated email-verification page with real database-role routing, fixed localhost redirect bugs, distinct signup error messages, every Playbook page reordered (discussion directly under Key Takeaways, completion button directly under discussion, recommendations last) with Playbook questions moved to a real Supabase-backed system, a fully rebuilt mentor-application review workflow (Owner Dashboard) with secure document access and automated emails, CAPTCHA on public auth forms, and a fix for the reported bug where the Owner account was incorrectly redirected away from Mentor Studio.

## Where to start

| If you need to... | Read |
|---|---|
| Understand the whole codebase before changing anything | `CLAUDE.md` |
| Set up Supabase from scratch | `SUPABASE_SETUP.md` |
| Configure custom SMTP for auth emails | `SUPABASE-SMTP-SETUP.md` |
| Fix/configure production redirect URLs | `SUPABASE-REDIRECT-SETUP.md` |
| Set up mentor-application email automation | `EMAIL-AUTOMATION-SETUP.md` |
| Configure CAPTCHA or understand the role/capability model | `AUTH-SECURITY-SETUP.md` |
| Deploy this release | `DEPLOYMENT-GUIDE.md` (this release) or `DEPLOYMENT.md` (original Cloudflare Pages walkthrough) |
| Verify this release before calling it done | `TESTING-CHECKLIST.md` |
| See exactly what changed and why | `VERSION-13.1-CHANGELOG.md` |
| See the original V13 pass's changelog | `CHANGES.md` |

## Quick facts

- **No build step.** Every `.html` file is opened directly; JavaScript is global-scope `<script>` tags loaded in a fixed order (see `CLAUDE.md`'s File Map).
- **Real backend.** Accounts, learner progress, volunteer log, Playbook questions, and mentor applications all live in Postgres via Supabase, not just `localStorage`. Community posts, mentor profiles, live sessions, announcements, and feature toggles are still `localStorage`-only pending a future sync pass (see CLAUDE.md's Outstanding/Roadmap).
- **One Owner, always.** Enforced by a database constraint, not a client-side flag — see `SUPABASE_SETUP.md` step 5 to bootstrap it on a fresh project.
- **Never fabricated content.** WRLD's own copy and this documentation follow the same rule: unbuilt features are labeled "Coming Soon" honestly, never faked with placeholder data.
