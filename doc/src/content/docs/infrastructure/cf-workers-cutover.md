---
title: Cloudflare Workers Cutover Runbook
sidebar_position: 1
---

# Cloudflare Workers Cutover Runbook

Human-only account steps for cutting zmanuals over from Cloudflare Pages to
Cloudflare Workers. Agents cannot perform these steps (they require account
access or deliberate soak-time judgement calls).

**Epic:** [Takazudo/takazudomodular-manuals#211](https://github.com/Takazudo/takazudomodular-manuals/issues/211)
**Sub-issue:** [#220](https://github.com/Takazudo/takazudomodular-manuals/issues/220)
**Relevant files:** `wrangler.toml`, `.github/workflows/main-deploy.yml`

---

## Step 1 — Upgrade `CLOUDFLARE_API_TOKEN` before merging

The existing GitHub repo secret `CLOUDFLARE_API_TOKEN` was created for
Cloudflare **Pages: Edit** scope. The Workers deploy workflow
(`.github/workflows/main-deploy.yml`) requires **Workers: Edit** scope. The
first CI run after merge will **fail with an auth error** unless you do this
first.

**Action:**

1. Go to [Cloudflare dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens).
2. Create a **new** dedicated token (recommended over editing the shared Pages token) with:
   - Permission: **Cloudflare Workers Scripts: Edit** (account-level)
   - Account Resources: your Cloudflare account
3. Go to the GitHub repo → **Settings → Secrets and variables → Actions**.
4. Update `CLOUDFLARE_API_TOKEN` with the new token value.

> **Note:** `CLOUDFLARE_ACCOUNT_ID` is already set and does not need to change.

---

## Step 2 — Merge to `main` (triggers first production deploy)

Once the token is updated, merge the migration PR to `main`.

The CI workflow `.github/workflows/main-deploy.yml` runs automatically on every
push to `main`. It:

1. Builds the zfb static site.
2. Runs `wrangler deploy` (pinned version from `package.json`), which:
   - Creates the `zmanuals` Cloudflare Worker (first deploy bootstraps it).
   - **Auto-attaches** `manuals.takazudomodular.com` as a custom domain (per
     `wrangler.toml` `[[routes]]` block with `custom_domain = true`).

Because `manuals.takazudomodular.com` is a **brand-new hostname** not
previously claimed by any Pages project, there is nothing to detach — the
domain attaches cleanly to the Worker. The old `zmanuals.pages.dev` URL keeps
serving the previous Pages build throughout and does not need to be touched.

> **If CI fails:** check the deploy job logs in GitHub Actions. A 401/403 error
> almost always means Step 1 was not done yet (token still lacks Workers scope).

---

## Step 3 — Verify the live site on `manuals.takazudomodular.com`

After CI turns green, wait a few minutes for DNS to propagate (`dig manuals.takazudomodular.com` should resolve), then verify the following URLs manually:

| Check | URL | Expected |
|---|---|---|
| Home page | `https://manuals.takazudomodular.com/` | Manual index loads |
| Viewer page | `https://manuals.takazudomodular.com/oxi-one-mk2/page/1` | Page 1 renders with image + translation |
| Page image | `https://manuals.takazudomodular.com/oxi-one-mk2/pages/001.png` | PNG image loads (200) |
| Docusaurus docs | `https://manuals.takazudomodular.com/doc/` | Docs site loads |
| Legacy redirect | `https://manuals.takazudomodular.com/manuals/oxi-one-mk2/page/1` | 301 → `/oxi-one-mk2/page/1` |

> The `/manuals/* → /:splat` 301 is served by the Worker itself (built into the
> zfb app at the base path layer), not by `takazudomodular.com`.

---

## Step 4 — Soak window

Let the Worker serve production traffic for a comfortable window (suggested:
**24–72 hours**) before deleting the old Pages project. During soak:

- The old `zmanuals.pages.dev` URL still resolves to the Pages build (harmless).
- If anything goes wrong, see the Rollback note below.

---

## Step 5 — Delete the old Cloudflare Pages project

After the soak window with no issues:

1. Go to [Cloudflare dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages).
2. Open the **`zmanuals`** project.
3. Go to **Settings → General → Danger Zone → Delete project**.
4. Confirm deletion.

> **Important:** The Pages project name is also `zmanuals`. Do not confuse it
> with the Worker of the same name.

---

## Rollback

During the soak window (before deleting the Pages project), you can roll back by
disabling the Worker custom domain attachment:

1. Cloudflare dashboard → **Workers & Pages → zmanuals (Worker)**.
2. Go to **Settings → Domains & Routes**.
3. Remove the `manuals.takazudomodular.com` custom domain from the Worker.
4. The domain detaches and DNS stops pointing to the Worker; traffic drops to
   NXDOMAIN until re-pointed.
5. To serve traffic again from Pages: go to dashboard → **Pages → zmanuals →
   Custom domains → Add**, add `manuals.takazudomodular.com`.

> **Note:** If the Pages custom-domain attach fails because a stale DNS record
> still references the Worker, delete the conflicting DNS record in the
> Cloudflare DNS dashboard for the zone first, then retry the Pages attach.

Once the Pages project is deleted (Step 5), rollback requires re-deploying from
source, which takes longer.

---

## Cross-repo follow-up: zzmod `/manuals/*` redirect

Old `takazudomodular.com/manuals/*` deep links (bookmarks, external references)
must be preserved. A tracking issue has been created in the zzmod repo to add
the redirect rule to `_redirects-pages`:

```
/manuals/* https://manuals.takazudomodular.com/:splat 301
```

**zzmod issue:** [zudolab/zzmod#724](https://github.com/zudolab/zzmod/issues/724)

> Apply this redirect **after** Step 3 (live site verified). Applying it before
> the Worker is live on `manuals.takazudomodular.com` would cause errors for
> anyone hitting `takazudomodular.com/manuals/*`.
