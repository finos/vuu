"""
Smoke test for start_server.py.

Not run as part of the default Maven build — needs the module already packaged
(`mvn -pl example/python-integration -am package`) and jpype1 installed. Run
directly with pytest from this directory once those are in place:

    pytest test_start_server.py
"""
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent / "start_server.py"
WS_PORT = 8090

READY_TIMEOUT_S = 90
SHUTDOWN_TIMEOUT_S = 30

# The JVM's own SIGTERM handling runs registered shutdown hooks (including
# lifecycle.autoShutdownHook()) and then exits with 128 + signal number — this
# is the JVM's normal signal-shutdown convention, not a crash.
SIGTERM_EXIT_CODE = 143


def _wait_for_ready_line(proc: subprocess.Popen) -> str | None:
    deadline = time.monotonic() + READY_TIMEOUT_S
    while time.monotonic() < deadline:
        line = proc.stdout.readline()
        if not line:
            if proc.poll() is not None:
                return None
            continue
        if "[VUU] Ready" in line:
            return line
    return None


def test_server_starts_and_shuts_down_cleanly():
    proc = subprocess.Popen(
        [sys.executable, str(SCRIPT)],
        cwd=SCRIPT.parent,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    try:
        ready_line = _wait_for_ready_line(proc)
        assert ready_line is not None, "server did not print its [VUU] Ready line in time"
        assert "ticked 23 rows into Snakes" in ready_line, (
            "server did not report ticking sample data into the Snakes table"
        )

        with socket.create_connection(("127.0.0.1", WS_PORT), timeout=5):
            pass  # websocket port is accepting connections

        proc.terminate()
        try:
            returncode = proc.wait(timeout=SHUTDOWN_TIMEOUT_S)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=10)
            pytest.fail("server did not shut down within the timeout after SIGTERM")

        assert returncode == SIGTERM_EXIT_CODE
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=10)
