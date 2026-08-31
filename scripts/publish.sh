#!/usr/bin/env bash
# One-shot publish: updates publisher, pushes to GitHub, publishes to the Marketplace.
# Usage: ./scripts/publish.sh <publisher-id> <personal-access-token>
set -euo pipefail

PUBLISHER="${1:?Usage: ./scripts/publish.sh <publisher-id> <pat>}"
PAT="${2:?Usage: ./scripts/publish.sh <publisher-id> <pat>}"
cd "$(dirname "$0")/.."

# Update publisher field if it changed
current=$(node -p "require('./package.json').publisher")
if [[ "$current" != "$PUBLISHER" ]]; then
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    p.publisher = '$PUBLISHER';
    fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
  "
  git add package.json
  git commit -m "Set marketplace publisher to $PUBLISHER"
  git push
fi

VSCE_PAT="$PAT" npx vsce publish

# Verify the listing is live (may take a minute to propagate)
sleep 5
code=$(curl -s -o /dev/null -w "%{http_code}" "https://marketplace.visualstudio.com/publishers/$PUBLISHER")
echo "Publisher page: HTTP $code"
echo "Extension page: https://marketplace.visualstudio.com/items?itemName=$PUBLISHER.quick-open-files"
