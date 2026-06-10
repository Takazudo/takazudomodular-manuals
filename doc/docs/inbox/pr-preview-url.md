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
- Deployment runs automatically as the `preview-deploy` job in `.github/workflows/pr-quality-checks.yml` after the `quality-checks` job (typecheck / lint / format / unit tests) succeeds. The job builds the site itself, so a broken build also fails the deploy.
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

## Build artifact is no longer persisted on the preview path

The built zfb site is ~880 MB (the manuals carry a lot of media). Persisting it as an Actions artifact on every PR churned through the 2 GB Actions storage cap (see issue #175), so the preview path no longer uploads it:

- `preview-deploy` **builds the site itself** via the `./.github/actions/build-zfb` composite action instead of downloading an artifact. This means the site is built twice per same-repo PR (once in `build-check`, once in `preview-deploy`) — accepted as the trade-off for not persisting the artifact. A red build still blocks the deploy: `preview-deploy` `needs: quality-checks`, and its own build step runs before the deploy step.
- `build-check` only uploads the `zfb-build-pr-<N>` artifact when `github.head_ref` starts with `preview/` — i.e. only on the branches where the `e2e-smoke-tests` job actually consumes it. On all other PRs nothing is persisted to Actions storage.
- The production path (`main-deploy.yml`) was merged into a single `build-and-deploy` job for the same reason: no artifact is uploaded/downloaded, and the build step gates the deploy step.

## Quick reference

| Flow            | Trigger                       | URL                                               | Comment marker             | Commit status           |
| --------------- | ----------------------------- | ------------------------------------------------- | -------------------------- | ----------------------- |
| PR preview      | Same-repo PR opened / updated | `https://pr-<N>.zmanuals.pages.dev/`              | `<!-- cf-preview-pr -->`   | `cloudflare/pr-preview` |
| Named preview   | Push to `preview/*` branch    | `https://<branch>.zmanuals.pages.dev/`            | `<!-- cf-preview-branch -->` | —                       |
| Forked PR       | PR from a fork                | _(no preview — secrets unavailable, by design)_   | —                          | —                       |
