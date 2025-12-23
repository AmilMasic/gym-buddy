#!/bin/bash
# Check for CSS classes used in Svelte components but not defined in styles.css
# This catches missing class definitions that would result in unstyled elements.

cd "$(dirname "$0")/.." || exit 1

# Extract gb-* classes from Svelte files
# Filter out Svelte-internal classes and BEM sub-components/modifiers
# We ignore classes starting with gb-[component] as they are defined in component <style>
svelte_classes=$(grep -rhoE 'class="[^"]*"' src --include="*.svelte" | \
  grep -oE 'gb-[a-z0-9-]+' | \
  grep -vE '^gb-(btn|chip|input|select|card|icon-btn|modal|label|text)(-[a-z0-9-]+)*' | \
  sort -u)

# Extract gb-* classes from styles.css
css_classes=$(grep -oE '\.gb-[a-z0-9-]+' styles.css | \
  sed 's/^\.//' | sort -u)

# Find classes in Svelte but not in CSS
missing=$(comm -23 <(echo "$svelte_classes") <(echo "$css_classes"))

if [ -n "$missing" ]; then
  echo "❌ Missing CSS classes (used in Svelte but not defined in styles.css):"
  echo "$missing" | while read -r class; do
    echo "  - $class"
  done
  exit 1
else
  echo "✅ All CSS classes are defined in styles.css"
  exit 0
fi
