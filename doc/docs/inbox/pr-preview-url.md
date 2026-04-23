---
title: PR Preview URL (Cloudflare Pages)
sidebar_position: 60
---

# PR Preview URL (Cloudflare Pages)

Every same-repo pull request gets an automatic Cloudflare Pages preview deployment, plus an opt-in named preview flow for ad-hoc branches. This page documents both flows, their comment markers, and the forked-PR caveat so contributors know what to expect.

## PR preview (automatic)

- Every pull request opened from a branch in this repository gets a preview at:
  - `https://pr-<N>.zmanuals.pages.dev/manuals/oxi-one-mk2/`
  - `<N>` is the pull request number (e.g. PR #42 → `https://pr-42.zmanuals.pages.dev/manuals/oxi-one-mk2/`).
- Deployment runs automatically as the `preview-deploy` job in `.github/workflows/pr-quality-checks.yml` after `build-check` succeeds.
- A bot comment is posted / updated on the PR with the preview URL. The comment contains the marker `<!-- cf-preview-pr -->`, which the workflow uses to find and update the same comment on subsequent pushes.
- A commit status is reported under the context `cloudflare/pr-preview`, so the preview link and its success/failure state are visible directly on the PR's Checks panel.

## Named preview (manual)

- Push any branch matching `preview/*` (for example `preview/visual-spike`) to trigger `.github/workflows/preview-deploy.yml`.
- The resulting preview is published under its Cloudflare Pages branch alias (`https://<branch>.zmanuals.pages.dev/`).
- If the push originated from a branch that has an open PR, the workflow posts / updates a bot comment with the marker `<!-- cf-preview-branch -->`. This keeps named-preview comments separate from the PR auto-preview comment.
- Use this flow for design reviews or ad-hoc previews that do not yet have a PR, or that need a stable URL independent of the PR number.

## Forked PRs do not get a preview

- Pull requests from **forks** do not get a Cloudflare Pages preview. This is intentional.
- GitHub does not expose repository secrets (Cloudflare API token, account ID) to workflows triggered by `pull_request` events from forks, so the deploy step cannot authenticate.
- The `build-check` job still runs for forked PRs (it does not need secrets). Only the `preview-deploy` job is skipped.
- If a fork contribution needs a live preview, a maintainer can push the branch to this repo as `preview/<name>` to run the named-preview flow.

## Build artifact is reused (no double builds)

- `build-check` uploads the built Next.js site as an artifact named `nextjs-build-pr-<N>` (where `<N>` is the PR number).
- `preview-deploy` downloads the same `nextjs-build-pr-<N>` artifact instead of rebuilding. There is exactly one `pnpm build` per PR push.
- If `build-check` fails, `preview-deploy` does not run, so there is no attempt to deploy a broken build.

## Quick reference

| Flow            | Trigger                       | URL                                               | Comment marker             | Commit status           |
| --------------- | ----------------------------- | ------------------------------------------------- | -------------------------- | ----------------------- |
| PR preview      | Same-repo PR opened / updated | `https://pr-<N>.zmanuals.pages.dev/`              | `<!-- cf-preview-pr -->`   | `cloudflare/pr-preview` |
| Named preview   | Push to `preview/*` branch    | `https://<branch>.zmanuals.pages.dev/`            | `<!-- cf-preview-branch -->` | —                       |
| Forked PR       | PR from a fork                | _(no preview — secrets unavailable, by design)_   | —                          | —                       |
