# python-integration

Starts the Vuu view server from Python, with the JVM embedded in the Python process
([JPype](https://jpype.readthedocs.io/)). `python/start_server.py` builds the same
`VuuServerConfig` and wires up the same modules (`PriceModule`, `SimulationModule`,
`MetricsModule`, `AuthNModule`) as `example/main-java`'s `VuuExampleMain` — it's the same
server startup sequence, called from Python instead of Java.

It also defines its own "Snakes" table — entirely in Python, no compiled Java/Scala at all.
`start_server.py` builds the table (`type`/`name`/`id`, all strings) via the same
`TableDefBuilder`/`ColumnBuilder` API the Java examples use, and implements the provider
(`TickingProvider` — a `Provider` whose rows are ticked in by direct method call rather than a
background thread, the Python equivalent of vuu's test-only `MockProvider`) and the
module-factory function as JPype `@JImplements` proxies over `org.finos.vuu.provider.Provider`
and `scala.Function2`. After `lifecycle.start()`, it fetches that same provider back from the
live server (`server.providerContainer().getProviderForTable("Snakes")` — JPype round-trips it
as the identical Python object, not a generic stub) and ticks sample rows into it, passing plain
Python `dict`s straight through (JPype converts them to `java.util.Map` automatically).

See [`docs/rfc/python_integration_example.md`](../../docs/rfc/python_integration_example.md)
for the design.

## Running

From the repo root, build this module and its dependencies (this generates
`target/classpath.txt`, which `start_server.py` reads):

```
./mvnw -pl example/python-integration -am package
```

Then, from `example/python-integration/python`, create a virtualenv and install into it
(`.venv/` is gitignored — each checkout creates its own):

```
python3 -m venv .venv
source .venv/bin/activate      # .venv\Scripts\activate on Windows
pip install -r requirements.txt
python start_server.py
```

This starts the same websocket (`wss://localhost:8090/websocket`) and HTTPS
(`https://localhost:8443`) endpoints as the other example apps, using the same throwaway
dev cert as `example/main` / `example/main-java`, plus a `Snakes` table pre-populated with
three sample rows ticked in from Python at startup. `Ctrl-C` stops it.

Requires a JDK matching the one the rest of the repo builds against (JDK 17+) — JPype
embeds whatever JVM it finds via `JAVA_HOME`.

## Testing

With the venv above active:

```
pip install pytest
pytest test_start_server.py
```

Not run as part of the default Maven build (it needs the module already packaged and
`jpype1` installed). It starts the server as a subprocess, waits for it to report ready,
confirms the websocket port is accepting connections, then sends it `SIGTERM` and checks
it shuts down cleanly via the JVM's own shutdown-hook path.
