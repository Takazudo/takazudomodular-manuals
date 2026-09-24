# ZUDO_DEPS_PINS

Provenance for artifacts vendored or generated from first-party (takazudo/zudolab) upstreams.
Updated by /dev-bump-zudo-deps on every sync — keep `pinned:` accurate.

## zudo-doc

- repo: zudolab/zudo-doc
- what: one scaffold script re-copied from the create-zudo-doc 5.27.0 base template during the zudo-doc bump. The rest of the doc scaffold was left as-is (most of it is on the template-drift allowlist).
- files: doc/scripts/setup-doc-skill.sh
- source: packages/create-zudo-doc/templates/base/scripts/setup-doc-skill.sh
- track: releases
- pinned: 50cbd5c6c9e5a795d72a74a855e105e4939d4eab (v5.27.0)
- updated: 2026-09-25
- sync: copy `templates/base/scripts/setup-doc-skill.sh` from the installed `create-zudo-doc` package over `doc/scripts/setup-doc-skill.sh`
- notes: This file has no project-local edits. The skill name is derived from the package name at runtime. Do not overwrite `doc/zfb.config.ts`, `doc/src/config/settings.ts`, or allowlisted stubs from the template. Other scaffold files are not covered by this pin.
