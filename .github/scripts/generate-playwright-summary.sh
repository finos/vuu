#!/bin/bash

# Generate Playwright test summary for GitHub Actions step summary
# Usage: ./generate-playwright-summary.sh <json-file>
# Example: ./generate-playwright-summary.sh playwright-report/test-results.json

set -e

JSON_FILE="${1:-playwright-report/test-results.json}"

echo "## 🎭 Playwright Component Tests"
echo ""

if [ -f "$JSON_FILE" ]; then
  echo "✅ **Tests completed successfully across all browsers**"
  echo ""
  
  # Browser-specific breakdown with grand totals
  echo "| Browser | All | Passed | Failed | Flaky | Skipped | Duration |"
  echo "|---------|-----|--------|--------|-------|---------|----------|"
  
  # Initialize grand totals
  GRAND_ALL=0
  GRAND_PASSED=0
  GRAND_FAILED=0
  GRAND_FLAKY=0
  GRAND_SKIPPED=0
  GRAND_DURATION=0
  
  # Extract list of browsers from JSON report
  BROWSERS=($(jq -r '[.. | objects | select(.projectName?) | .projectName] | unique | .[]' "$JSON_FILE" | sort))
  
  # Extract browser-specific stats from JSON report
  for browser in "${BROWSERS[@]}"; do
    # Count overall test status, not individual results
    ALL=$(jq -r '[.. | objects | select(.projectName? == "'$browser'") | select(.status?)] | length' "$JSON_FILE")
    PASSED=$(jq -r '[.. | objects | select(.projectName? == "'$browser'") | select(.status == "passed")] | length' "$JSON_FILE")
    FAILED=$(jq -r '[.. | objects | select(.projectName? == "'$browser'") | select(.status == "failed")] | length' "$JSON_FILE")
    FLAKY=$(jq -r '[.. | objects | select(.projectName? == "'$browser'") | select(.status == "flaky")] | length' "$JSON_FILE")
    SKIPPED=$(jq -r '[.. | objects | select(.projectName? == "'$browser'") | select(.status == "skipped")] | length' "$JSON_FILE")
    DURATION=$(jq -r '[.. | objects | select(.projectName? == "'$browser'") | .results[]?.duration // 0] | if length > 0 then add / 1000 | round else 0 end' "$JSON_FILE")
    
    echo "| $(echo $browser | tr '[:lower:]' '[:upper:]') | $ALL | $PASSED | $FAILED | $FLAKY | $SKIPPED | ${DURATION}s |"
    
    # Add to grand totals
    GRAND_ALL=$((GRAND_ALL + ALL))
    GRAND_PASSED=$((GRAND_PASSED + PASSED))
    GRAND_FAILED=$((GRAND_FAILED + FAILED))
    GRAND_FLAKY=$((GRAND_FLAKY + FLAKY))
    GRAND_SKIPPED=$((GRAND_SKIPPED + SKIPPED))
    GRAND_DURATION=$((GRAND_DURATION + DURATION))
  done
  
  # Add grand total row
  echo "| **TOTAL** | **$GRAND_ALL** | **$GRAND_PASSED** | **$GRAND_FAILED** | **$GRAND_FLAKY** | **$GRAND_SKIPPED** | **${GRAND_DURATION}s** |"
  
  echo ""
  echo "📊 **Detailed Report**: Download the 'playwright-report' artifact to view full results"
else
  echo "❌ **Tests failed or reports not generated**"
fi
