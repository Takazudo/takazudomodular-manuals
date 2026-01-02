#!/bin/bash

# Create a Git worktree for topic-based development
# Usage: ./scripts/setup-worktree-env.sh <worktree-name>
#   or:  pnpm run init-worktree <worktree-name>
#
# This script will:
# 1. Create worktrees/<worktree-name> if it doesn't exist
# 2. Setup symbolic links for environment files (if any)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the repository root (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Environment files to link (currently none, but prepared for future)
ENV_FILES=()

# Parse arguments
WORKTREE_NAME="$1"

if [ -z "$WORKTREE_NAME" ]; then
  echo -e "${RED}Error: Worktree name is required${NC}"
  echo "Usage: $0 <worktree-name>"
  echo "Example: $0 issue-2-project-setup"
  exit 1
fi

# Construct worktree path
WORKTREE_PATH="$REPO_ROOT/worktrees/$WORKTREE_NAME"

# Create worktree if it doesn't exist
if [ ! -d "$WORKTREE_PATH" ]; then
  echo -e "${YELLOW}Worktree does not exist. Creating worktree: $WORKTREE_NAME${NC}"
  echo ""

  # Create worktrees directory if it doesn't exist
  mkdir -p "$REPO_ROOT/worktrees"

  # Create the worktree
  cd "$REPO_ROOT"
  git worktree add "worktrees/$WORKTREE_NAME"

  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create worktree${NC}"
    exit 1
  fi

  echo ""
  echo -e "${GREEN}✓ Worktree created successfully${NC}"
  echo ""
else
  echo -e "${GREEN}Worktree already exists: $WORKTREE_NAME${NC}"
  echo "Worktree path: $WORKTREE_PATH"
  echo ""
fi

# Process environment files if any are defined
if [ ${#ENV_FILES[@]} -gt 0 ]; then
  echo -e "${GREEN}Setting up environment files for worktree: $WORKTREE_NAME${NC}"
  echo ""

  # Change to worktree directory
  cd "$WORKTREE_PATH"

  # Process each environment file
  for env_file in "${ENV_FILES[@]}"; do
    SOURCE_FILE="$REPO_ROOT/$env_file"
    TARGET_FILE="$WORKTREE_PATH/$env_file"

    # Check if source file exists
    if [ ! -f "$SOURCE_FILE" ]; then
      echo -e "${YELLOW}⚠ Skipping $env_file (source file not found in repo root)${NC}"
      continue
    fi

    # Check if target already exists
    if [ -L "$TARGET_FILE" ]; then
      # It's already a symlink
      CURRENT_LINK="$(readlink "$TARGET_FILE")"
      if [ "$CURRENT_LINK" = "$SOURCE_FILE" ]; then
        echo -e "${GREEN}✓ $env_file already linked correctly${NC}"
        continue
      else
        echo -e "${YELLOW}⚠ $env_file is a symlink to different location, updating...${NC}"
        rm "$TARGET_FILE"
      fi
    elif [ -f "$TARGET_FILE" ]; then
      # It's a regular file
      echo -e "${YELLOW}⚠ $env_file exists as a regular file, backing up...${NC}"
      mv "$TARGET_FILE" "$TARGET_FILE.backup"
      echo -e "  Backup created: $env_file.backup${NC}"
    fi

    # Create symlink
    ln -s "$SOURCE_FILE" "$TARGET_FILE"
    echo -e "${GREEN}✓ Linked $env_file${NC}"
  done
fi

echo ""
echo -e "${GREEN}Worktree setup complete!${NC}"
echo ""
echo -e "Worktree location: ${YELLOW}$WORKTREE_PATH${NC}"
echo ""
echo "To start working in the worktree:"
echo -e "  ${YELLOW}cd worktrees/$WORKTREE_NAME${NC}"
echo ""
