"""Helpers for integrating Vite-built React islands into Jinja templates."""

import html
import json
import os
import socket
from urllib.parse import urlparse

from flask import current_app, url_for
from markupsafe import Markup

DEFAULT_VITE_ENTRY = "src/main.tsx"
"""Default Vite entry point relative to the ``frontend/`` directory."""

ISLAND_ATTRIBUTE = "data-react-island"
"""HTML data attribute identifying a React island mount point."""

ISLAND_PROPS_ATTRIBUTE = "data-island-props"
"""HTML data attribute identifying the JSON props script inside an island."""

VITE_STATIC_PREFIX = "dist/vite/"
"""Prefix under ``collectives/static/`` where Vite production assets are emitted."""

DEV_SERVER_SOCKET_TIMEOUT = 0.05
"""Timeout in seconds when probing the local Vite development server."""


def is_vite_dev_server_running(dev_server_url: str) -> bool:
    """Check whether the local Vite development server is reachable.

    Only probes when the Flask application is in debug or development mode so
    that production and test requests never incur a socket check.

    Args:
        dev_server_url: Base URL of the Vite dev server (e.g. ``http://localhost:5173``).

    Returns:
        True if the app is in development/debug mode and the Vite server port is open.
    """
    is_dev = current_app.debug or current_app.config.get("FLASK_ENV") == "development"
    if not is_dev or not dev_server_url:
        return False

    parsed = urlparse(dev_server_url)
    if not parsed.hostname or not parsed.port:
        return False

    try:
        with socket.create_connection(
            (parsed.hostname, parsed.port), timeout=DEV_SERVER_SOCKET_TIMEOUT
        ):
            return True
    except OSError:
        return False


def load_vite_manifest(manifest_path: str) -> dict:
    """Load and parse the Vite production ``manifest.json`` file.

    Args:
        manifest_path: Absolute path to ``.vite/manifest.json``.

    Returns:
        Parsed manifest dictionary, or an empty dict if the file does not exist.
    """
    if not manifest_path or not os.path.isfile(manifest_path):
        return {}

    try:
        with open(manifest_path, encoding="utf-8") as manifest_file:
            return json.load(manifest_file)
    except (OSError, json.JSONDecodeError):
        current_app.logger.warning(
            "Failed to read Vite manifest at %s", manifest_path, exc_info=True
        )
        return {}


def _dev_server_tags(dev_server_url: str, entry: str) -> Markup:
    """Build HTML script tags pointing at the live Vite HMR dev server.

    Args:
        dev_server_url: Base URL of the Vite dev server.
        entry: Entry module path relative to ``frontend/``.

    Returns:
        Markup containing the React Fast Refresh preamble and module scripts.
    """
    base = dev_server_url.rstrip("/")
    entry_path = entry.lstrip("/")
    return Markup(
        f'<script type="module">'
        f'import RefreshRuntime from "{base}/@react-refresh";'
        f"RefreshRuntime.injectIntoGlobalHook(window);"
        f"window.$RefreshReg$ = () => {{}};"
        f"window.$RefreshSig$ = () => (type) => type;"
        f"window.__vite_plugin_react_preamble_installed__ = true;"
        f"</script>\n"
        f'<script type="module" src="{base}/@vite/client"></script>\n'
        f'<script type="module" src="{base}/{entry_path}"></script>'
    )


def _collect_manifest_css(manifest: dict, entry_key: str, visited: set) -> list[str]:
    """Recursively collect CSS files from a manifest entry and its static imports.

    Args:
        manifest: Parsed Vite manifest dictionary.
        entry_key: Current manifest chunk key.
        visited: Set of already visited chunk keys to prevent cycles.

    Returns:
        Ordered list of CSS file paths relative to ``dist/vite/``.
    """
    if entry_key in visited or entry_key not in manifest:
        return []

    visited.add(entry_key)
    chunk = manifest[entry_key]
    css_files = list(chunk.get("css", []))

    for imported_key in chunk.get("imports", []):
        for css_file in _collect_manifest_css(manifest, imported_key, visited):
            if css_file not in css_files:
                css_files.append(css_file)

    return css_files


def vite_assets(entry: str = DEFAULT_VITE_ENTRY) -> Markup:
    """Render ``<link>`` and ``<script>`` tags for a Vite entry point.

    In development mode with a running Vite server, emits HMR scripts pointing
    at ``VITE_DEV_SERVER_URL``. Otherwise, resolves hashed production bundles
    from ``VITE_MANIFEST_PATH``. If neither is available, returns an empty
    ``Markup`` so legacy Jinja pages continue to render without error.

    Args:
        entry: Entry module path relative to ``frontend/`` (default ``src/main.tsx``).

    Returns:
        Safe HTML ``Markup`` with the required stylesheet and module script tags.
    """
    dev_server_url = current_app.config.get("VITE_DEV_SERVER_URL", "")
    if is_vite_dev_server_running(dev_server_url):
        return _dev_server_tags(dev_server_url, entry)

    manifest_path = current_app.config.get("VITE_MANIFEST_PATH", "")
    manifest = load_vite_manifest(manifest_path)
    if entry not in manifest:
        return Markup("")

    entry_chunk = manifest[entry]
    tags = []

    for css_file in _collect_manifest_css(manifest, entry, set()):
        css_url = url_for("static", filename=f"{VITE_STATIC_PREFIX}{css_file}")
        tags.append(
            f'<link rel="stylesheet" href="{html.escape(css_url, quote=True)}">'
        )

    js_file = entry_chunk.get("file")
    if js_file:
        js_url = url_for("static", filename=f"{VITE_STATIC_PREFIX}{js_file}")
        tags.append(
            f'<script type="module" src="{html.escape(js_url, quote=True)}"></script>'
        )

    return Markup("\n".join(tags))


def serialize_island_props(props: dict | None) -> str:
    """Serialize an island props dictionary to HTML-safe JSON.

    Escapes ``<``, ``>``, and ``&`` as Unicode escape sequences so that user
    content containing ``</script>`` or HTML tags cannot break out of the
    inline ``<script type="application/json">`` block.

    Args:
        props: Dictionary of serializable props for the React component.

    Returns:
        HTML-safe JSON string.
    """
    raw_json = json.dumps(props or {})
    return (
        raw_json.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
    )


def react_island(
    name: str,
    props: dict | None = None,
    tag: str = "div",
    class_name: str = "",
) -> Markup:
    """Render a DOM mount container for a React island with embedded JSON props.

    Args:
        name: Registered name of the React island (e.g. ``"EventList"``).
        props: JSON-serializable props dictionary passed to the React component.
        tag: HTML wrapper tag name (default ``"div"``).
        class_name: Optional CSS class names applied to the wrapper element.

    Returns:
        Safe HTML ``Markup`` representing the island container and props payload.
    """
    escaped_tag = html.escape(tag, quote=True)
    escaped_name = html.escape(name, quote=True)
    class_attr = f' class="{html.escape(class_name, quote=True)}"' if class_name else ""
    json_payload = serialize_island_props(props)

    return Markup(
        f'<{escaped_tag}{class_attr} {ISLAND_ATTRIBUTE}="{escaped_name}">'
        f'<script type="application/json" {ISLAND_PROPS_ATTRIBUTE}>'
        f"{json_payload}"
        f"</script>"
        f"</{escaped_tag}>"
    )
