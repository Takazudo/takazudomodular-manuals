---
title: PR Preview URL (Cloudflare Workers)
sidebar_position: 60
---

# PR Preview URL (Cloudflare Workers)

> **Migration note:** This page was updated when the site moved from Cloudflare Pages to
> Cloudflare Workers static assets (CF Workers migration, issue #211). The old Pages preview
> URLs (`*.zmanuals.pages.dev`) are no longer used.

Every same-repo pull request gets an automatic Cloudflare Workers preview deployment. This page documents the flow, comment markers, and the forked-PR caveat so contributors know what to expect.

## PR preview (automatic)

- Every pull request opened from a branch in this repository gets a preview at a `*.workers.dev` URL:
  - `https://pr-<N>-zmanuals-<hash>.takazudo.workers.dev/`
  - `<N>` is the pull request number (e.g. PR #42 → a URL with `pr-42-zmanuals-...` in it).
  - The exact URL is captured from `wrangler versions upload --preview-alias pr-<N>` output and posted to the PR as a bot comment.
- Deployment runs automatically as the `preview-deploy` job in `.github/workflows/pr-quality-checks.yml` after the `quality-checks` job (typecheck / lint / format / unit tests) succeeds. The job builds the site itself via the `build-zfb` composite action, so a broken build also fails the deploy.
- A bot comment is posted / updated on the PR with the preview URL and a direct link to the manual. The comment contains the marker `<!-- cf-preview-pr -->`, which the workflow uses to find and update the same comment on subsequent pushes.
- A commit status is reported under the context `cloudflare/pr-preview`, so the preview link and its success/failure state are visible directly on the PR's Checks panel.

## Forked PRs do not get a preview

- Pull requests from **forks** do not get a Cloudflare Workers preview. This is intentional.
- GitHub does not expose repository secrets (Cloudflare API token, account ID) to workflows triggered by `pull_request` events from forks, so the deploy step cannot authenticate.
- The `build-check` and `quality-checks` jobs still run for forked PRs (they do not need secrets). Only the `preview-deploy` job is skipped.
- If a fork contribution needs a live preview, a maintainer can push the branch to this repo as a regular branch to trigger the PR preview flow.

## Build artifact is not persisted on the preview path

The built zfb site is ~880 MB (the manuals carry a lot of media). To avoid churning through the 2 GB Actions storage cap (see issue #175), the preview path does not upload the built artifact:

- `preview-deploy` **builds the site itself** via the `./.github/actions/build-zfb` composite action. This means the site is built twice per same-repo PR (once in `build-check`, once in `preview-deploy`) — accepted as the trade-off for not persisting the artifact. A red build still blocks the deploy: `preview-deploy` `needs: quality-checks`, and its own build step runs before the deploy step.
- `build-check` only uploads the `zfb-build-pr-<N>` artifact when `github.head_ref` starts with `preview/` — i.e. only on the branches where the `page-smoke-crawler` job actually consumes it. On all other PRs nothing is persisted to Actions storage.

## Quick reference

| Flow       | Trigger                       | URL                                                          | Comment marker           | Commit status           |
| ---------- | ----------------------------- | ------------------------------------------------------------ | ------------------------ | ----------------------- |
| PR preview | Same-repo PR opened / updated | `https://pr-<N>-zmanuals-<hash>.takazudo.workers.dev/`      | `<!-- cf-preview-pr -->` | `cloudflare/pr-preview` |
| Forked PR  | PR from a fork                | _(no preview — secrets unavailable, by design)_              | —                        | —                       |
