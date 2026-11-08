"""Unit tests for :py:mod:`collectives.utils.vite`."""

import json

from collectives.utils.jinja import helpers_processor
from collectives.utils.vite import (
    is_vite_dev_server_running,
    load_vite_manifest,
    react_island,
    serialize_island_props,
    vite_assets,
)


def test_react_island_rendering():
    """Test rendering of a React island container and safe JSON props."""
    markup = react_island(
        "EventList",
        props={"count": 5, "unsafe": "</script><script>alert(1)&"},
        tag="section",
        class_name="island-wrapper",
    )
    rendered = str(markup)
    assert rendered.startswith(
        '<section class="island-wrapper" data-react-island="EventList">'
    )
    assert "data-island-props>" in rendered
    assert "</script><script>" not in rendered
    assert "\\u003c/script\\u003e" in rendered
    assert "\\u0026" in rendered
    assert rendered.endswith("</section>")


def test_serialize_island_props_roundtrip():
    """Test that serialized props remain valid JSON after escaping."""
    payload = {"title": "Sortie <Alpinisme> & Ski", "items": [1, 2, 3]}
    serialized = serialize_island_props(payload)
    assert "<" not in serialized
    assert ">" not in serialized
    assert "&" not in serialized
    assert json.loads(serialized) == payload


def test_vite_assets_from_manifest(app, tmp_path):
    """Test resolving production JS and CSS bundles from a Vite manifest."""
    manifest_data = {
        "src/main.tsx": {
            "file": "assets/main-abc123.js",
            "src": "src/main.tsx",
            "isEntry": True,
            "css": ["assets/main-def456.css"],
            "imports": ["_vendor-789.js"],
        },
        "_vendor-789.js": {
            "file": "assets/vendor-789.js",
            "css": ["assets/vendor-000.css"],
        },
    }
    manifest_file = tmp_path / "manifest.json"
    manifest_file.write_text(json.dumps(manifest_data), encoding="utf-8")

    with app.test_request_context():
        app.config["VITE_MANIFEST_PATH"] = str(manifest_file)
        app.config["FLASK_ENV"] = "production"
        output = str(vite_assets("src/main.tsx"))

    assert "/static/dist/vite/assets/main-def456.css" in output
    assert "/static/dist/vite/assets/vendor-000.css" in output
    assert (
        '<script type="module" src="/static/dist/vite/assets/main-abc123.js"></script>'
        in output
    )


def test_vite_assets_missing_manifest(app, tmp_path):
    """Test graceful empty output when neither dev server nor manifest is present."""
    missing_path = tmp_path / "nonexistent.json"
    with app.test_request_context():
        app.config["VITE_MANIFEST_PATH"] = str(missing_path)
        app.config["FLASK_ENV"] = "production"
        assert str(vite_assets()) == ""
        assert load_vite_manifest(str(missing_path)) == {}


def test_vite_assets_dev_server_mode(app, monkeypatch):
    """Test emitting Vite HMR client and React Refresh tags in dev mode."""
    monkeypatch.setattr(
        "collectives.utils.vite.is_vite_dev_server_running", lambda url: True
    )
    with app.test_request_context():
        app.config["VITE_DEV_SERVER_URL"] = "http://localhost:5173"
        output = str(vite_assets("src/main.tsx"))

    assert "http://localhost:5173/@react-refresh" in output
    assert "http://localhost:5173/@vite/client" in output
    assert "http://localhost:5173/src/main.tsx" in output


def test_is_vite_dev_server_running_disabled_in_prod(app):
    """Test that production mode never probes the dev server socket."""
    with app.app_context():
        app.debug = False
        app.config["FLASK_ENV"] = "production"
        assert is_vite_dev_server_running("http://localhost:5173") is False


def test_jinja_helpers_registered():
    """Test that react_island and vite_assets are exposed to Jinja templates."""
    helpers = helpers_processor()
    assert helpers["react_island"] is react_island
    assert helpers["vite_assets"] is vite_assets
