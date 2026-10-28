# ZUDO_DEPS_PINS

Provenance for artifacts vendored or generated from first-party (takazudo/zudolab) upstreams.
Updated by /dev-bump-zudo-deps on every sync — keep `pinned:` accurate.

## zudo-doc

- repo: zudolab/zudo-doc
- what: one scaffold script verified byte-identical to the create-zudo-doc 9.1.0 base template. The doc migration removes obsolete, unreachable scaffold copies; remaining intentional template differences are recorded in doc/.template-drift-allowlist.
- files: doc/scripts/setup-doc-skill.sh
- source: packages/create-zudo-doc/templates/base/scripts/setup-doc-skill.sh
- track: releases
- pinned: f264a9331025cc7a94ce1bb4def1c5d8b8ffaf29 (v9.1.0)
- updated: 2026-10-29
- sync: copy `templates/base/scripts/setup-doc-skill.sh` from the installed `create-zudo-doc` package over `doc/scripts/setup-doc-skill.sh`
- notes: This file has no project-local edits. The skill name is derived from the package name at runtime. Do not overwrite `doc/zfb.config.ts`, `doc/src/config/settings.ts`, or allowlisted stubs from the template. Other scaffold files are not covered by this pin.
