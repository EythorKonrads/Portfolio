#!/usr/bin/env bash
# Netlify's build `ignore` command: exit 0 skips the build, anything else
# builds. Skips only when every changed file can't affect the built site.

# A first build can have nothing cached to compare against
if [ -z "$CACHED_COMMIT_REF" ] || [ "$CACHED_COMMIT_REF" = "$COMMIT_REF" ]; then
  exit 1
fi

# If either commit is missing from the clone, git exits 128 and Netlify builds
git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- . \
  ':(exclude)*.md' \
  ':(exclude)docs/' \
  ':(exclude).claude/' \
  ':(exclude).vscode/' \
  ':(exclude).github/' \
  ':(exclude)cypress/' \
  ':(exclude)cypress.config.js' \
  ':(exclude)eslint.config.js' \
  ':(exclude).prettierrc' \
  ':(exclude).prettierignore' \
  ':(exclude).gitignore'
