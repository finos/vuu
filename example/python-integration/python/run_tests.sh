#!/usr/bin/env bash
# Sets up (or reuses) this module's venv and runs the pytest smoke test.
#
# Invoked by Maven's exec-maven-plugin under the "python-tests" profile (see ../pom.xml) -
# not part of the default `mvn test`/`verify`, since it needs network access to pip install
# jpype1/pytest that a default build shouldn't require. Requires the module already packaged
# (`mvn -pl example/python-integration -am package`, or `-Ppython-tests` does this itself via
# the earlier build-classpath execution) so target/classpath.txt exists.
#
# Run directly instead of via Maven with:
#   cd example/python-integration/python && ./run_tests.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d .venv ]; then
    python3 -m venv .venv
fi

.venv/bin/pip install -q -r requirements.txt pytest
.venv/bin/python -m pytest test_start_server.py -v
