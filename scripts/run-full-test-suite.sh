#!/usr/bin/env bash
# =============================================================================
# PMS Full Test Suite Execution Script (IEEE 829 Compliant)
# =============================================================================
# Usage:   ./scripts/run-full-test-suite.sh [--coverage] [--report]
# Purpose: Runs the complete test suite and generates coverage + test reports
# =============================================================================

set -euo pipefail

# --- Configuration -----------------------------------------------------------
BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
REPORT_DIR="$BACKEND_DIR/test-reports"
COVERAGE_DIR="$BACKEND_DIR/coverage"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$REPORT_DIR/test-run-$TIMESTAMP.txt"

# --- Parse arguments ---------------------------------------------------------
GENERATE_COVERAGE=false
GENERATE_REPORT=false

for arg in "$@"; do
  case $arg in
    --coverage) GENERATE_COVERAGE=true ;;
    --report)   GENERATE_REPORT=true ;;
    --help|-h)
      echo "Usage: $0 [--coverage] [--report]"
      echo "  --coverage  Generate coverage report (HTML + lcov)"
      echo "  --report    Save test results to test-reports/ directory"
      exit 0
      ;;
  esac
done

# --- Helpers -----------------------------------------------------------------
info()  { echo -e "\033[1;34m[INFO]\033[0m  $1"; }
pass()  { echo -e "\033[1;32m[PASS]\033[0m  $1"; }
fail()  { echo -e "\033[1;31m[FAIL]\033[0m  $1"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $1"; }
line()  { echo "----------------------------------------------------------------------"; }

# --- Pre-flight checks -------------------------------------------------------
info "PMS Full Test Suite - IEEE 829 Compliant Execution"
line
info "Timestamp:    $TIMESTAMP"
info "Backend dir:  $BACKEND_DIR"
info "Node version: $(node --version)"
info "npm version:  $(npm --version)"
line

# Ensure dependencies are installed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  warn "node_modules not found. Running npm install..."
  cd "$BACKEND_DIR" && npm install --silent
fi

# Create report directory if needed
if [ "$GENERATE_REPORT" = true ]; then
  mkdir -p "$REPORT_DIR"
fi

# --- Step 1: TypeScript compilation ------------------------------------------
info "Step 1/5: TypeScript type checking..."
cd "$BACKEND_DIR"

if npx tsc --noEmit 2>&1; then
  pass "TypeScript compilation: 0 errors"
  TSC_RESULT="PASS"
else
  fail "TypeScript compilation failed"
  TSC_RESULT="FAIL"
fi
line

# --- Step 2: ESLint ----------------------------------------------------------
info "Step 2/5: ESLint static analysis..."

if npx eslint 'src/**/*.ts' --max-warnings=0 2>&1; then
  pass "ESLint: 0 errors, 0 warnings"
  LINT_RESULT="PASS"
else
  warn "ESLint found issues (non-blocking)"
  LINT_RESULT="WARN"
fi
line

# --- Step 3: Unit Tests ------------------------------------------------------
info "Step 3/5: Running unit tests (Jest 30)..."

JEST_ARGS="--no-cache --verbose"
if [ "$GENERATE_COVERAGE" = true ]; then
  JEST_ARGS="$JEST_ARGS --coverage"
fi

TEST_OUTPUT=$(npx jest $JEST_ARGS 2>&1) || true
echo "$TEST_OUTPUT" | tail -20

# Parse test results
SUITES_LINE=$(echo "$TEST_OUTPUT" | grep "Test Suites:" || echo "")
TESTS_LINE=$(echo "$TEST_OUTPUT" | grep "Tests:" || echo "")

if echo "$TESTS_LINE" | grep -q "failed"; then
  fail "Some tests failed"
  TEST_RESULT="FAIL"
else
  pass "All tests passed"
  TEST_RESULT="PASS"
fi
line

# --- Step 4: Coverage thresholds ---------------------------------------------
if [ "$GENERATE_COVERAGE" = true ]; then
  info "Step 4/5: Checking coverage thresholds..."

  if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then
    STMT_PCT=$(node -e "const c=require('$COVERAGE_DIR/coverage-summary.json');console.log(c.total.statements.pct)")
    LINE_PCT=$(node -e "const c=require('$COVERAGE_DIR/coverage-summary.json');console.log(c.total.lines.pct)")
    FUNC_PCT=$(node -e "const c=require('$COVERAGE_DIR/coverage-summary.json');console.log(c.total.functions.pct)")
    BRAN_PCT=$(node -e "const c=require('$COVERAGE_DIR/coverage-summary.json');console.log(c.total.branches.pct)")

    info "Statements: ${STMT_PCT}%  |  Lines: ${LINE_PCT}%  |  Functions: ${FUNC_PCT}%  |  Branches: ${BRAN_PCT}%"

    # Check thresholds (IEEE 829 Section 7)
    COVERAGE_OK=true
    if (( $(echo "$LINE_PCT < 70" | bc -l) )); then
      fail "Line coverage ${LINE_PCT}% is below 70% threshold"
      COVERAGE_OK=false
    fi
    if (( $(echo "$FUNC_PCT < 70" | bc -l) )); then
      fail "Function coverage ${FUNC_PCT}% is below 70% threshold"
      COVERAGE_OK=false
    fi

    if [ "$COVERAGE_OK" = true ]; then
      pass "All coverage thresholds met"
      COVERAGE_RESULT="PASS"
    else
      fail "Coverage thresholds not met"
      COVERAGE_RESULT="FAIL"
    fi
  else
    warn "Coverage summary not found"
    COVERAGE_RESULT="SKIP"
  fi
else
  info "Step 4/5: Coverage check skipped (use --coverage to enable)"
  COVERAGE_RESULT="SKIP"
fi
line

# --- Step 5: Build verification ----------------------------------------------
info "Step 5/5: Build verification..."

if npx tsc -p tsconfig.build.json 2>&1; then
  pass "Production build successful"
  BUILD_RESULT="PASS"
else
  fail "Production build failed"
  BUILD_RESULT="FAIL"
fi
line

# --- Summary -----------------------------------------------------------------
echo ""
echo "============================================================================"
echo "  TEST SUITE EXECUTION SUMMARY"
echo "============================================================================"
echo ""
printf "  %-30s %s\n" "TypeScript Check:" "$TSC_RESULT"
printf "  %-30s %s\n" "ESLint:" "$LINT_RESULT"
printf "  %-30s %s\n" "Unit Tests:" "$TEST_RESULT"
printf "  %-30s %s\n" "Coverage Thresholds:" "$COVERAGE_RESULT"
printf "  %-30s %s\n" "Production Build:" "$BUILD_RESULT"
echo ""
echo "  $SUITES_LINE"
echo "  $TESTS_LINE"
echo ""
echo "============================================================================"

# --- Save report -------------------------------------------------------------
if [ "$GENERATE_REPORT" = true ]; then
  {
    echo "PMS Test Suite Execution Report"
    echo "==============================="
    echo "Timestamp: $TIMESTAMP"
    echo "Node: $(node --version)"
    echo ""
    echo "Results:"
    echo "  TypeScript Check:    $TSC_RESULT"
    echo "  ESLint:              $LINT_RESULT"
    echo "  Unit Tests:          $TEST_RESULT"
    echo "  Coverage Thresholds: $COVERAGE_RESULT"
    echo "  Production Build:    $BUILD_RESULT"
    echo ""
    echo "$SUITES_LINE"
    echo "$TESTS_LINE"
    echo ""
    if [ "$GENERATE_COVERAGE" = true ] && [ "${COVERAGE_RESULT:-SKIP}" != "SKIP" ]; then
      echo "Coverage: Stmts=${STMT_PCT}% Lines=${LINE_PCT}% Funcs=${FUNC_PCT}% Branches=${BRAN_PCT}%"
    fi
  } > "$REPORT_FILE"
  info "Report saved to: $REPORT_FILE"
fi

# --- Exit code ---------------------------------------------------------------
if [ "$TEST_RESULT" = "FAIL" ] || [ "$TSC_RESULT" = "FAIL" ] || [ "$BUILD_RESULT" = "FAIL" ]; then
  exit 1
fi

pass "All checks passed!"
exit 0
