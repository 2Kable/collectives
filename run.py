#! /usr/bin/env python
import argparse
import atexit
import logging
import os
import signal
import subprocess
import sys
import threading

# Auto-switch to .venv python if running outside the virtual environment
venv_python = os.path.abspath(
    os.path.join(os.path.dirname(__file__), ".venv", "bin", "python")
)
if (
    os.path.exists(venv_python)
    and not os.environ.get("_COLLECTIVES_VENV_SWITCHED")
    and not os.path.samefile(sys.executable, venv_python)
):
    os.environ["_COLLECTIVES_VENV_SWITCHED"] = "1"
    os.execv(venv_python, [venv_python, *sys.argv])

import collectives  # noqa: E402


class ColoredLogFormatter(logging.Formatter):
    """Format log records with ANSI colors for log levels."""

    LEVEL_COLORS = {
        logging.DEBUG: "\033[36m",  # Cyan
        logging.INFO: "\033[32m",  # Green
        logging.WARNING: "\033[33m",  # Yellow
        logging.ERROR: "\033[31m",  # Red
        logging.CRITICAL: "\033[1;31m",  # Bold Red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.LEVEL_COLORS.get(record.levelno, "")
        orig_levelname = record.levelname
        if color:
            record.levelname = f"{color}{orig_levelname:<8}{self.RESET}"
        formatted = super().format(record)
        record.levelname = orig_levelname
        return formatted


class PrefixedStream:
    """Wraps a text stream to prefix each line with a colored service tag."""

    def __init__(self, stream, prefix: str):
        self._stream = stream
        self._prefix = prefix
        self._at_line_start = True

    def write(self, data) -> int:
        # If passed bytes, pass straight through to self._stream so text streams
        # raise TypeError as expected by callers like click._is_binary_writer.
        if isinstance(data, (bytes, bytearray)):
            return self._stream.write(data)
        if not data:
            return 0
        lines = data.splitlines(keepends=True)
        for line in lines:
            if self._at_line_start and line.strip():
                self._stream.write(self._prefix)
                self._at_line_start = False
            self._stream.write(line)
            if line.endswith(("\n", "\r")):
                self._at_line_start = True
        return len(data)

    def flush(self):
        self._stream.flush()

    def fileno(self):
        return self._stream.fileno()

    def isatty(self):
        return getattr(self._stream, "isatty", lambda: False)()

    def __getattr__(self, name):
        return getattr(self._stream, name)


def configure_colored_logging():
    """Apply colored formatter to any console log handlers."""
    for handler in logging.getLogger().handlers:
        if isinstance(handler, logging.StreamHandler):
            fmt = (
                handler.formatter._fmt
                if handler.formatter
                else "%(asctime)s %(levelname)s %(name)s : %(message)s"
            )
            handler.setFormatter(ColoredLogFormatter(fmt))


def start_vite_dev_server(out_stream=sys.stdout) -> subprocess.Popen:
    """Start Vite dev server in a new process group and stream colorized logs."""
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    env = {**os.environ, "FORCE_COLOR": "1"}
    proc = subprocess.Popen(
        ["npm", "--prefix", frontend_dir, "run", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        start_new_session=True,
        env=env,
    )

    prefix = "\033[1;36m[vite]\033[0m "

    def _stream_output():
        if not proc.stdout:
            return
        for line in iter(proc.stdout.readline, b""):
            decoded = line.decode("utf-8", errors="replace")
            if decoded.strip():
                out_stream.write(f"{prefix}{decoded}")
            else:
                out_stream.write(decoded)
            out_stream.flush()

    thread = threading.Thread(target=_stream_output, daemon=True)
    thread.start()

    def _cleanup():
        if proc.poll() is None:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            except OSError:
                pass

    atexit.register(_cleanup)
    return proc


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collectives development server")
    parser.add_argument(
        "--vite",
        action="store_true",
        help="Start the Vite development server in parallel with Flask",
    )
    args, _ = parser.parse_known_args()

    raw_stdout = sys.stdout
    if args.vite:
        flask_prefix = "\033[1;32m[flask]\033[0m "
        sys.stdout = PrefixedStream(sys.stdout, flask_prefix)
        sys.stderr = PrefixedStream(sys.stderr, flask_prefix)

    # Systematic upgrade of the db
    os.environ["FLASK_APP"] = "collectives:create_app"
    # Debug must be known when the config is loaded (cookies over plain HTTP,
    # mock payment API): app.run(debug=True) only sets it after create_app()
    os.environ["FLASK_DEBUG"] = "1"
    subprocess.run([sys.executable, "-m", "flask", "db", "upgrade"], check=True)

    # In debug mode, Werkzeug spawns a child worker with WERKZEUG_RUN_MAIN="true".
    # Only launch Vite once in the supervisor (outer) process so it stays alive
    # across Flask reloads.
    if args.vite and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        print("Starting Vite development server (npm --prefix frontend run dev)...")
        start_vite_dev_server(out_stream=raw_stdout)

    app = collectives.create_app()
    configure_colored_logging()
    app.run(debug=True)
