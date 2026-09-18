# `example/python-integration` — Starting the Vuu Server from Python

**Status: Implemented.** `example/python-integration` exists as designed below and has been
verified end-to-end against a real JVM: `mvn package` produces `target/classpath.txt`,
`python/start_server.py` starts the JVM via JPype, builds the `VuuServerConfig`, registers all
four modules, and both `wss://localhost:8090/websocket` (TCP connect) and
`https://localhost:8443` (HTTP 200 via the webroot) come up; `Ctrl-C`/`SIGTERM` runs the JVM's
shutdown hooks and exits via `pytest`'s smoke test. See "What actually shipped" below — one part of
the design (the webroot path) had to change from what was originally proposed here. See the
addendum below for the `Snakes` table extension — also implemented and verified end-to-end, now
entirely in Python (superseding this doc's original "Non-goals" line about a Python provider API
being out of scope — see the addendum for why that turned out to be straightforward). A second
addendum below extends `Snakes` further with a `Location` table and a `SnakeLocations` join table —
both defined in Python, demonstrating Vuu's join-table API from a JPype script. **Status:
Implemented and verified end-to-end** — see the addendum for the one API mismatch (a Scala varargs
parameter) found only by actually running it. A third addendum adds a right-click "Delete Selected
Snake(s)" menu item to `Snakes`, backed by an RPC handler defined in Python — **Status: Implemented
and verified end-to-end**, including one small, reusable addition to `vuu-java` (see the addendum
for why attaching a menu needed that, where a plain JPype proxy did not suffice).

### Introduction

The `example/` tree already shows the same view-server startup sequence from two languages:
`example/main` (`SimulMain.scala`) builds a `VuuServerConfig`, wires in `PriceModule`,
`SimulationModule`, `MetricsModule` and `AuthNModule`, then calls `lifecycle.start()` /
`vuuServer.join()`; `example/main-java` (`VuuExampleMain.java`) does the identical thing from Java,
proving the config/module API is plain-Java-callable (no Scala-only syntax required at the call
site — `.apply()` factories and `.withX(...)` fluent builders instead of case-class copy syntax or
implicits).

This module adds a third: the same startup sequence, called from Python, with the JVM embedded
*inside* the Python process rather than launched as a separate process. The goal is to show that
Vuu's server API is directly usable from Python today, without needing a REST/websocket layer in
front of it or a hand-written Java shim — the same public classes `VuuExampleMain.java` calls are
called directly from Python.

### Goals

- Reproduce `VuuExampleMain.java`'s startup sequence — same modules (`PriceModule`,
  `SimulationModule`, `MetricsModule`, `AuthNModule`), same config shape, same default ports
  (`8090` wss, `8443` https) — but driven from a Python script.
- Embed the JVM in the Python process (via [JPype](https://jpype.readthedocs.io/)) rather than
  shelling out to `java`, so Python is genuinely constructing and starting the server objects, not
  just launching another process and waiting on it.
- Keep the Maven module itself minimal: it exists to resolve and expose a classpath, not to host
  new Java/Scala source. No new server-side behaviour is introduced.
- `Ctrl-C` in the Python process cleanly stops the server (JVM shutdown hook runs, process exits).

### Non-goals

- A Python API for defining tables, providers or RPC handlers. This module only starts the
  existing example modules; writing a Vuu *provider* from Python is a plausible follow-on but is
  out of scope here. **(Superseded — see the `Snakes` addendum below, which does exactly this via
  JPype `@JImplements` proxies, with no Python-specific API added to vuu itself: it's just JPype
  proxying the same `Provider`/`Function2` interfaces the Java examples already implement.)**
- Publishing a `pip`-installable package. The Python side stays a plain script in this module,
  matching how `example/main-java` is a runnable example rather than a published artifact.
- Choosing between JPype/Py4J/subprocess in general — JPype was selected for this module because
  it mirrors `VuuExampleMain.java` most directly (in-process calls into the same objects, no extra
  gateway process). A subprocess- or Py4J-based module remains possible as a separate example later
  if a use case needs Python and the JVM in separate processes.

### Design

#### Module layout

```
example/python-integration/
  pom.xml
  src/main/resources/certs/cert.pem        # same dev self-signed cert used by main/main-java
  src/main/resources/certs/key.pem
  python/
    requirements.txt                       # jpype1
    start_server.py                        # the JPype driver
  README.md                                # how to build + run
```

No `src/main/java` or `src/main/scala` is needed. `PriceModule`, `SimulationModule`,
`MetricsModule` and `AuthNModule` already exist (in `example/price`, `example/order`,
`vuu`, and `example/permission` respectively) and are exactly what `VuuExampleMain.java` uses —
this module only needs to *depend on* them and hand their resolved jars to Python.

#### `pom.xml`

A child of `example` (`<parent>` = `org.finos.vuu:example`), `<packaging>pom</packaging>` — there's
no Java/Scala source to compile, so a `jar` packaging would just produce an empty jar. Dependencies
mirror `example/main-java/pom.xml`:

```xml
<dependencies>
    <dependency><groupId>org.finos.vuu</groupId><artifactId>vuu</artifactId></dependency>
    <dependency><groupId>org.finos.vuu</groupId><artifactId>vuu-java</artifactId></dependency>
    <dependency><groupId>org.finos.vuu</groupId><artifactId>price</artifactId></dependency>
    <dependency><groupId>org.finos.vuu</groupId><artifactId>order</artifactId></dependency>
    <dependency><groupId>org.finos.vuu</groupId><artifactId>permission</artifactId></dependency>
    <dependency><groupId>ch.qos.logback</groupId><artifactId>logback-classic</artifactId></dependency>
</dependencies>
```

To give Python a classpath, bind `maven-dependency-plugin`'s `build-classpath` goal to the
`package` phase, writing the resolved jar paths (from the local `.m2` repo, no copying needed) to
`target/classpath.txt`:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-dependency-plugin</artifactId>
    <executions>
        <execution>
            <goals><goal>build-classpath</goal></goals>
            <configuration>
                <outputFile>${project.build.directory}/classpath.txt</outputFile>
            </configuration>
        </execution>
    </executions>
</plugin>
```

This was chosen over a `maven-shade-plugin` uber-jar (used elsewhere in the repo by `benchmark`):
JPype's `classpath=` accepts a list of jar paths directly, so there's no need to merge jars into
one, and it sidesteps shade's `META-INF/services` merge concerns for Netty/Logback. `mvn -pl
example/python-integration -am package` is enough to produce `target/classpath.txt`.

#### Certs and webroot

`VuuExampleMain.java` hardcodes its cert/webroot paths as strings relative to the repo root (e.g.
`"example/main/src/main/resources/certs/cert.pem"`), which only works if the process is launched
from the repo root. Since `start_server.py` knows its own location, it resolves these paths off
`Path(__file__)` instead, so the script works regardless of the caller's working directory:

- `cert.pem` / `key.pem`: copied into this module at `src/main/resources/certs/` (same throwaway
  dev cert already used by `example/main` and `example/main-java` — not a secret).
- webroot: reused from `vuu-ui/deployed_apps/app-vuu-example`, same as `example/main-java`.

> **Correction (found during implementation):** the webroot can't be resolved to an OS-absolute
> path the way the certs are. `AbsolutePathWebRoot`'s path ultimately reaches Vert.x's
> `StaticHandler`, which rejects any root starting with `/` (`IllegalArgumentException: root
> cannot start with '/'`) — the class's name notwithstanding. This is why `VuuExampleMain.java` /
> `SimulMain.scala` hardcode `"vuu-ui/deployed_apps/app-vuu-example"` as a plain relative string:
> they only work because they assume the process is launched from the repo root. `start_server.py`
> keeps the "don't assume the caller's cwd" property from the rest of this design by computing the
> webroot with `os.path.relpath(webroot_abs, start=Path.cwd())` instead of leaving it as an
> absolute path — relative-to-cwd either way, but derived from `Path(__file__)` rather than
> hardcoded, so it still works when launched from a directory other than the repo root.

#### `start_server.py`

Mirrors `VuuExampleMain.java` line-for-line: read the classpath file, start the JVM, import the
same classes, build the same `VuuServerConfig`, start the same modules, join.

```python
import os
import jpype
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent.parent   # example/python-integration
REPO_ROOT = MODULE_DIR.parents[1]

def start_jvm() -> None:
    classpath = (MODULE_DIR / "target" / "classpath.txt").read_text().strip().split(":")
    jpype.startJVM(classpath=classpath)

def main() -> None:
    start_jvm()

    # Imported after the JVM is up — JPype resolves these against the classpath above.
    from org.finos.toolbox.jmx import MetricsProviderImpl
    from org.finos.toolbox.lifecycle import LifecycleContainer
    from org.finos.toolbox.time import DefaultClock
    from org.finos.vuu.core import (
        VuuServerConfig, VuuServer, VuuWebSocketOptions, VuuSecurityOptions,
        VuuThreadingOptions, VuuClientConnectionOptions,
        VuuJoinTableProviderOptions, VuuRpcOptions,
    )
    from org.finos.vuu.core.module import TableDefContainer
    from org.finos.vuu.core.module.authn import AuthNModule
    from org.finos.vuu.core.module.metrics import MetricsModule
    from org.finos.vuu.core.module.price import PriceModule
    from org.finos.vuu.core.module.simul import SimulationModule
    from org.finos.vuu.http2.server import VuuHttp2ServerFactory
    from org.finos.vuu.http2.server.config import AbsolutePathWebRoot, VuuHttp2ServerOptions
    from org.finos.vuu.net.auth import LoginTokenService
    from org.finos.vuu.net.ssl import VuuSSLByCertAndKey, VuuSSLCipherSuiteOptions
    from scala import Option as ScalaOption
    from scala.collection.mutable import ListBuffer

    metrics = MetricsProviderImpl()
    clock = DefaultClock()
    lifecycle = LifecycleContainer(clock)
    table_def_container = TableDefContainer()
    lifecycle.autoShutdownHook()

    login_token_service = LoginTokenService.apply()

    cert_path = str(MODULE_DIR / "src/main/resources/certs/cert.pem")
    key_path = str(MODULE_DIR / "src/main/resources/certs/key.pem")
    webroot = os.path.relpath(REPO_ROOT / "vuu-ui/deployed_apps/app-vuu-example", start=Path.cwd())
    ssl = VuuSSLByCertAndKey(cert_path, key_path, ScalaOption.empty(), VuuSSLCipherSuiteOptions.apply())

    config = VuuServerConfig(
        VuuWebSocketOptions.apply().withUri("websocket").withWsPort(8090)
            .withSsl(ssl).withBindAddress("0.0.0.0"),
        VuuSecurityOptions.apply().withLoginTokenService(login_token_service),
        VuuThreadingOptions.apply().withTreeThreads(4).withViewPortThreads(4),
        VuuClientConnectionOptions.apply().withHeartbeatEnabled(),
        VuuJoinTableProviderOptions.apply(),
        VuuRpcOptions.apply(),
        ListBuffer().toList(),
        ListBuffer().toList(),
        VuuHttp2ServerFactory.apply(
            VuuHttp2ServerOptions.apply()
                .withWebRoot(AbsolutePathWebRoot(webroot, True))
                .withSsl(ssl)
                .withPort(8443)
        ),
    ).withModule(PriceModule.apply(clock, lifecycle, table_def_container)) \
     .withModule(SimulationModule.apply(clock, lifecycle, table_def_container)) \
     .withModule(MetricsModule.apply(clock, lifecycle, metrics, table_def_container)) \
     .withModule(AuthNModule.apply(login_token_service, ScalaOption.empty(), clock, lifecycle, table_def_container))

    server = VuuServer(config, lifecycle, clock, metrics)
    lifecycle.start()
    print("[VUU] Ready — wss://localhost:8090/websocket  https://localhost:8443")
    server.join()

if __name__ == "__main__":
    main()
```

#### Running it

```
mvn -pl example/python-integration -am package
cd example/python-integration/python
pip install -r requirements.txt
python start_server.py
```

### Open questions / risks — resolved during implementation

These were the parts of the design that needed confirming against real JPype behaviour rather than
just read off the Java source. All were checked directly against a built classpath and a running
JVM (`jpype1==1.7.1`, Temurin JDK 26) before `start_server.py` was written in its final form:

1. **Scala static forwarders.** Confirmed — `VuuWebSocketOptions.apply()`,
   `VuuSSLCipherSuiteOptions.apply()`, and the rest of the `.apply()`/`.withX(...)` chain used above
   all resolve and call correctly from JPype exactly as they do from Java.
2. **`scala.collection.mutable.ListBuffer` from JPype.** Confirmed — `ListBuffer()` then `.toList()`
   works with no special handling.
3. **`scala.Option.empty()`.** Confirmed — resolves to `None` and is accepted everywhere the config
   API expects an `Option`.
4. **`Ctrl-C` / shutdown behaviour.** No special JPype interrupt mode was needed. HotSpot installs
   its own `SIGTERM`/`SIGINT` handlers regardless of whether it was started via the `java` binary or
   embedded via JNI (same OS process either way), so sending the Python process `SIGTERM` (or
   `Ctrl-C`) runs the registered shutdown hooks (`lifecycle.autoShutdownHook()`) and the process
   exits with **143** (128 + `SIGTERM`) — the JVM's normal signal-shutdown exit code, not a crash.
   This is what `test_start_server.py` asserts.
5. **JDK requirement.** Confirmed working against JDK 26 (newer than the `maven.compiler.release=17`
   the repo targets) — noted in the README as needing JDK 17+, matched to whatever `JAVA_HOME` /
   `jpype.getDefaultJVMPath()` resolves to.
6. **New finding, not anticipated above:** `AbsolutePathWebRoot`'s path is fed to Vert.x's
   `StaticHandler`, which throws `IllegalArgumentException: root cannot start with '/'` for an
   OS-absolute path — see the correction under "Certs and webroot" above. This only surfaced by
   actually starting the server end-to-end and checking the HTTPS port; a build/import-level check
   wouldn't have caught it.

The fallback considered here — a small Java helper class in this module hiding Scala-interop edge
cases behind a plain-Java API, the role `vuu-java`'s builders play elsewhere — turned out not to be
needed: every call in `start_server.py` is a direct JPype call into the existing Scala/Java API.

### Testing strategy

A `pytest` smoke test (`python/test_start_server.py`, not run as part of the default Maven build)
that: starts the server in a subprocess running `start_server.py`, waits for the "Ready" line on
stdout, opens a plain TCP connection to `localhost:8090` to confirm the port is listening, then
sends `SIGTERM` and asserts the process exits with code 143 (the JVM's shutdown-hook exit code —
see point 4 above), within a timeout. This checks the module stays runnable without needing a full
websocket handshake/TLS client in the test. Passes in ~3.5s once the classpath is warm.

### Files

**New:**
- `example/python-integration/pom.xml`
- `example/python-integration/src/main/resources/certs/cert.pem`, `key.pem`
- `example/python-integration/python/requirements.txt`
- `example/python-integration/python/start_server.py`
- `example/python-integration/python/test_start_server.py`
- `example/python-integration/README.md`

**Changed:**
- `example/pom.xml` — added `<module>python-integration</module>`

### Scope

One Maven module with no compiled sources (pom + resources + plugin config) plus a ~140-line
Python script and a pytest smoke test. Comparable in size to `example/main-java`; smaller than any
module with real Scala/Java source, since all server-side behaviour is reused from existing
modules.

## Addendum: `Snakes` — a custom table and provider, defined entirely in Python

**Status: Implemented.** No Java/Scala source anywhere in this module — `pom.xml` is back to bare
`packaging=pom`. `start_server.py` builds the `Snakes` table and implements its provider directly
against the JVM's `org.finos.vuu.provider.Provider` interface and `scala.Function2` trait via
JPype's `@JImplements` proxy support, ticks 23 sample rows into it after `lifecycle.start()`,
and reports it in its `[VUU] Ready` line — which `test_start_server.py` asserts on.

**Revision note:** this addendum originally shipped as compiled Java (`SnakesModule extends
DefaultModule`, `TickingProvider implements Provider`, described in the version of this section
below the "Superseded" marker) — implemented, built, and verified end-to-end. It was then replaced
with this all-Python version. The Java version isn't wrong, and the "Open questions" list from the
base design already anticipated needing a Java helper if Scala interop got in the way — it's kept
below for reference since it's a legitimate alternative shape for this same feature, not a design
that failed.

### Motivation

The base module above only starts the *existing* example modules (`PriceModule` etc.) — it proves
Python can drive the server's lifecycle, but not that Python can define and drive a table of its
own. This addendum adds a small custom table (`Snakes`) with a manually-driven provider — both
defined in Python — and extends `start_server.py` to tick sample rows into it after the server
starts.

### Design

Everything lives in `start_server.py`, inside `main()`, defined after `start_jvm()` (so the Java
types the `@JImplements` decorators reference are already resolvable) and before the config is
built:

```python
from org.finos.vuu.api import ColumnBuilder, TableDefBuilder
from org.finos.vuu.core.module import ModuleFactory, TableDefContainer

@jpype.JImplements("org.finos.vuu.provider.Provider")
class TickingProvider:
    """A Provider whose rows are ticked in by direct method call rather than a
    background thread - the Python equivalent of vuu's test-only MockProvider."""

    def __init__(self, table):
        self.table = table

    @jpype.JOverride
    def subscribe(self, key):
        pass

    @jpype.JOverride
    def doStart(self):
        pass

    @jpype.JOverride
    def doStop(self):
        pass

    @jpype.JOverride
    def doInitialize(self):
        pass

    @jpype.JOverride
    def doDestroy(self):
        pass

    @jpype.JOverride
    def lifecycleId(self):
        return f"TickingProvider-{self.table.name()}"

    def tick(self, key, row):
        row_builder = self.table.rowBuilder()
        row_builder.setKey(key)
        for column_name, value in row.items():
            column = self.table.columnForName(column_name)
            # column.dataType() is a java.lang.Class - primitive types (int, double, ...)
            # report their primitive name from getName(); anything else (String, ...) falls
            # through to setString.
            type_name = str(column.dataType().getName())
            if type_name == "int":
                row_builder.setInt(column, int(value))
            elif type_name == "double":
                row_builder.setDouble(column, float(value))
            elif type_name == "long":
                row_builder.setLong(column, int(value))
            elif type_name == "boolean":
                row_builder.setBoolean(column, bool(value))
            else:
                row_builder.setString(column, str(value))
        self.table.processUpdate(row_builder.build())

@jpype.JImplements("scala.Function2")
class SnakesProviderFactory:
    @jpype.JOverride
    def apply(self, table, view_server):
        return TickingProvider(table)

snakes_table_def = (
    TableDefBuilder()
    .name("Snakes")
    .keyField("id")
    .customColumns(
        ColumnBuilder()
        .addString("type")
        .addString("name")
        .addString("id")
        .addInt("age")
        .addDouble("weight")
        .build()
    )
    .build()
)

snakes_module = (
    ModuleFactory.withNamespace("SNAKES", table_def_container)
    .addTable(snakes_table_def, SnakesProviderFactory())
    .asModule()
)
```

> **Branch note:** `TableDefBuilder` lives at `org.finos.vuu.api.TableDefBuilder` here — it moved
> from `org.finos.vuu.util` (the package used when this addendum was first implemented, still
> reflected in the "Superseded" Java version below) sometime in the 26 commits between where that
> work happened and `issue_2415_python_integration`. Found by actually running `start_server.py`
> on this branch (`ClassNotFoundException: org.finos.vuu.util.TableDefBuilder`), not by reading
> source — worth remembering as a reason to re-verify JPype-dependent scripts like this one after
> a rebase, even when nothing about the *design* changed.

`snakes_module` then joins the same `.withModule(...)` chain as the existing four modules. Two
things make this possible without any Java at all:

- `Provider` (`org.finos.vuu.provider.Provider`) is a Scala trait with only abstract methods
  (`subscribe`, `doStart`, `doStop`, `doInitialize`, `doDestroy`, `lifecycleId` — the last from a
  `val` in the parent `LifecycleEnabled` trait, which compiles to an abstract getter) — at the
  bytecode level that's a plain Java interface, so JPype's `@JImplements` can proxy it directly.
  `ModuleFactory.addTable`'s second parameter is `(DataTable, AbstractVuuServer) => Provider`
  (`scala.Function2`), which is likewise a single-abstract-method (`apply`) interface at the
  bytecode level — the same reason a plain Java lambda already works there in
  `example/main-java`'s `JavaExampleModule.java`.
- `TableDefBuilder`, `ColumnBuilder`, and `ModuleFactory` are ordinary classes/objects (the first
  two are plain Java, in `vuu-java`; `ModuleFactory` is a Scala `object` called via its static
  forwarder, exactly like `VuuServerConfig`'s `.apply()` calls elsewhere in this script) — no
  proxying needed, just direct calls, same as everything else in `start_server.py`.

`Snakes` has five columns, not all strings: `type`/`name`/`id` are `String`, `age` is `int`, and
`weight` is `double` (`ColumnBuilder().addInt("age")` / `.addDouble("weight")`). `tick()` handles
this generically rather than hardcoding which of `Snakes`' columns are which type: for each
`(column_name, value)` pair in the row dict, it looks up the column via `columnForName` and reads
its actual `DataType` back — `column.dataType()` is a `java.lang.Class`, and for primitive column
types that's the *primitive* `Class` object (`classOf[Int]`/`classOf[Double]` compile to `int`/
`double`, not the boxed `java.lang.Integer`/`java.lang.Double`), so `.getName()` gives back the
short primitive name (`"int"`, `"double"`, `"long"`, `"boolean"`) to dispatch on, falling through
to `setString` for anything else (`"java.lang.String"`, in `Snakes`' case). This means `tick()`
works for any table shape passed to `TickingProvider`, not just the specific column set `Snakes`
happens to have today.

After `lifecycle.start()`, the sample-data ticking now exercises all three types:

```python
snakes_provider = server.providerContainer().getProviderForTable("Snakes").get()
sample_snakes = [
    {"id": "s1", "name": "Kaa", "type": "Python", "age": 40, "weight": 91.5},
    {"id": "s2", "name": "Nagini", "type": "Python", "age": 15, "weight": 22.3},
    {"id": "s3", "name": "Sir Hiss", "type": "Grass snake", "age": 3, "weight": 0.4},
    # ...20 more, s4-s23, covering a spread of species/ages/weights
]
for snake in sample_snakes:
    snakes_provider.tick(snake["id"], snake)
```

The `int`/`float` values in the sample dicts pass straight through as Python's native numeric
types — `tick()`'s `int(value)`/`float(value)` calls are just defensive casts, not doing any real
conversion work here, since JPype already accepts a Python `int`/`float` directly wherever
`RowBuilder.setInt`/`.setDouble` expect a primitive `int`/`double` argument.

The important detail here — checked explicitly, not assumed — is that `getProviderForTable(...)`
hands back the **same Python `TickingProvider` object** the factory created, not a generic
Java-interface stub: JPype's proxy mechanism keeps a reference back to the originating Python
object, so calling `.tick(...)` (a plain Python method, not part of the `Provider` interface) on
the round-tripped reference works with no cast and no special handling. A raw Python `dict` passed
to `tick()` converts to `java.util.Map` automatically at the call boundary, same as the Java
version found.

### Validation

Checked directly against a running JVM (`jpype1==1.7.1`, Temurin JDK 26), first as a standalone
spike (`@JImplements(Provider)`/`@JImplements(Function2)` classes, `ModuleFactory` calls, no server)
and then with a full server start using this module, both before committing this version:

- `@jpype.JImplements("org.finos.vuu.provider.Provider")` and
  `@jpype.JImplements("scala.Function2")` both proxy successfully; `ModuleFactory.withNamespace(...)
  .addTable(tableDef, factory).asModule()` builds a `ViewServerModule` from pure Python with no
  errors.
- A full server start with this module works: log confirms `Creating table Snakes`, `Loading
  provider for table Snakes...`, and the JVM side sees it as a genuine proxy
  (`Initializing class jdk.proxy2.$Proxy6 TickingProvider-Snakes` — `jdk.proxy2.$ProxyN` is the
  JDK's own dynamic proxy class, confirming `Provider` really did resolve as an interface here).
- `server.providerContainer().getProviderForTable("Snakes").get() is factory.created` — **`True`**.
  The round-tripped object is identical to the one Python created, confirmed with Python's `is`.
- Calling `.tick(...)` on that round-tripped object works, and separately, ticking directly on the
  original never-round-tripped reference also works — both land in the table (`table.pullRow(...)`
  read back the correct values for all three columns).
- Both `wss://…:8090/websocket` (TCP connect) and `https://…:8443` (HTTP 200) came up with the
  module included, and the process shut down cleanly on `SIGTERM` with no leftover process, same as
  the base module and the earlier Java version of this addendum.
- **`age`/`weight` (int/double columns) added later:** re-checked separately, since "no exception
  was thrown" isn't proof the typed dispatch in `tick()` actually did the right thing. A standalone
  run printed `column.dataType().getName()` for each column while ticking (`id`/`name`/`type` →
  `java.lang.String`, `age` → `int`, `weight` → `double`, confirming the primitive-vs-boxed
  `Class` distinction the dispatch logic relies on), then read the row back: `table.pullRow("s1")`
  returned `age` as a `java.lang.Integer` (`40`) and `weight` as a `java.lang.Double` (`91.5`) —
  the correct boxed types and the correct values, not just non-crashing ones.

### Files

**New:** none — no Java/Scala source at all for this feature.

**Changed:**
- `example/python-integration/pom.xml` — reverted to bare `packaging=pom` (no source to compile).
- `example/python-integration/python/start_server.py` — `TickingProvider`/`SnakesProviderFactory`
  defined as JPype proxies, `Snakes` table built via `TableDefBuilder`/`ColumnBuilder`, module
  built via `ModuleFactory` and added to the `.withModule(...)` chain, sample data ticked in after
  `lifecycle.start()`. No `target/classes` classpath entry needed (nothing of this module's own
  compiles to a `.class` file any more).
- `example/python-integration/python/test_start_server.py` — unchanged from the Java version
  (still asserts the `[VUU] Ready` line reports ticking 23 rows into `Snakes`); passes unmodified
  since the observable behaviour is identical.
- `example/python-integration/README.md` — describes the table/provider as Python-defined.

### Scope

Zero Java/Scala files. A ~70-line addition to `start_server.py` (the two `@JImplements` classes,
the table-def build, and the module build) replacing what was previously two small Java files plus
a `target/classes` classpath entry. Net effect: smaller diff, and the module stays a pure
classpath-resolution `pom` throughout, which was the base design's original stated goal ("Keep the
Maven module itself minimal... No new server-side behaviour is introduced" — true again now that
"server-side behaviour" lives in the Python driver instead of compiled bytecode).

---

<details>
<summary>Superseded: the original Java-based version of this addendum (kept for reference)</summary>

This was implemented, built with `mvn -pl example/python-integration -am package`
(`packaging=jar`), and verified end-to-end before being replaced with the Python version above.

#### `SnakesModule` (Java, extends `DefaultModule`)

`example/python-integration/src/main/java/org/finos/vuu/module/SnakesModule.java`, structured
exactly like `example/main-java`'s `JavaExampleModule`
(`ModuleFactory.withNamespace(...).addTable(...).asModule()`), but with one table:

```java
package org.finos.vuu.module;

import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.core.module.DefaultModule;
import org.finos.vuu.core.module.ModuleFactory;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.snake.TickingProvider;
import org.finos.vuu.util.TableDefBuilder;

public class SnakesModule extends DefaultModule {

    public static final String NAME = "SNAKES";

    public ViewServerModule create(final TableDefContainer tableDefContainer, Clock clock) {
        return ModuleFactory.withNamespace(NAME, tableDefContainer)
                .addTable(new TableDefBuilder()
                                .name("Snakes")
                                .keyField("id")
                                .customColumns(new ColumnBuilder()
                                        .addString("type")
                                        .addString("name")
                                        .addString("id")
                                        .build())
                                .build(),
                        (table, vs) -> new TickingProvider(table)
                )
                .asModule();
    }
}
```

#### `TickingProvider` (Java, "looks like `MockProvider`")

`example/python-integration/src/main/java/org/finos/vuu/snake/TickingProvider.java`:

```java
package org.finos.vuu.snake;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.provider.Provider;

import java.util.Map;

public class TickingProvider implements Provider {

    private final DataTable table;

    public TickingProvider(DataTable table) {
        this.table = table;
    }

    public void tick(String key, Map<String, String> row) {
        var rowBuilder = table.rowBuilder();
        rowBuilder.setKey(key);
        for (Map.Entry<String, String> entry : row.entrySet()) {
            var column = table.columnForName(entry.getKey());
            rowBuilder.setString(column, entry.getValue());
        }
        table.processUpdate(rowBuilder.build());
    }

    @Override public void subscribe(String key) {}
    @Override public void doStart() {}
    @Override public void doStop() {}
    @Override public void doInitialize() {}
    @Override public void doDestroy() {}

    @Override
    public String lifecycleId() {
        return "TickingProvider-" + table.name();
    }
}
```

`start_server.py` imported `SnakesModule` and added `target/classes` to its JPype classpath
(alongside `target/classpath.txt`) since `build-classpath` only resolves dependencies, not this
module's own compiled output — that classpath change is what the Python version above no longer
needs.

</details>

## Addendum 2: `Location` and `SnakeLocations` — a ticking join table, defined entirely in Python

**Status: Implemented.** Built and run end-to-end against a real JVM (`jpype1==1.7.1`, Temurin JDK
17 via `JAVA_HOME`): the server starts with `Location` and `SnakeLocations` registered alongside
`Snakes`, both tables populate correctly, and a debug tap confirmed `SnakeLocations` returns live
`Snakes` columns (e.g. `name`) joined against changing `Location` coordinates once a second — see
"Validation" below. One design detail below had to change from what was originally proposed — a
Scala varargs parameter rejected a plain Python `str` — found only by actually running it, the same
way the base design's webroot correction was found. `test_start_server.py` was extended and passes.

### Motivation

The `Snakes` addendum proved Python can define a plain table and a manually-driven provider. It
doesn't touch two things a realistic Vuu module needs: a **join table** (the composed view most UIs
actually subscribe to) and a provider that **ticks on its own schedule** rather than being driven
once by a fixed sample list. This addendum adds both, built on top of `Snakes`:

- A new `Location` table — keyed by the same `id` as `Snakes` — holding each snake's current
  `x_coordinate`/`y_coordinate`.
- A `SnakeLocations` join table combining `Snakes` and `Location` on `id`, exposing every `Snakes`
  column plus the two coordinate columns — the thing a client would actually subscribe to, to see
  snakes moving around in real time.
- `Location` is populated with one row per existing sample snake at startup, then a background loop
  ticks new coordinates into it once a second for as long as the server runs, simulating movement.

Everything here is Python-only, same as `Snakes`: `Location`'s `TableDef` and provider reuse the
same `TableDefBuilder`/`ColumnBuilder`/`TickingProvider` shapes the `Snakes` addendum already
established, and `SnakeLocations`' `JoinTableDef` is built via `vuu-java`'s
`JoinTableDefBuilder`/`JoinToBuilder` — Java classes, but plain builders with no Scala-only syntax,
callable from JPype the same way `TableDefBuilder`/`ColumnBuilder` already are.

### Goals

- `Location` table (namespace `SNAKES`, alongside `Snakes`): key field `id`, columns `id` (string,
  matching a `Snakes.id`), `x_coordinate` (double), `y_coordinate` (double).
- `Location` populated with one row per `sample_snakes` entry immediately at startup (same moment
  `Snakes`' sample rows are ticked in), then a per-second background loop nudges every row's
  coordinates, for the life of the process.
- `SnakeLocations` join table: base table `Snakes`, joined to `Location` on `id` (`LeftOuterJoin` —
  the only join type Vuu has, and the right one here since every snake always has a location),
  exposing all of `Snakes`' columns plus `x_coordinate`/`y_coordinate`.
- Both `Location` (table + provider) and `SnakeLocations` (join table) defined in `start_server.py`
  — no new compiled Java/Scala, no new Maven dependency (`JoinTableDefBuilder`/`JoinToBuilder`
  already come from `vuu-java`, already on this module's classpath).

### Non-goals

- Realistic movement physics. A small bounded random walk per tick is enough to demonstrate live
  values flowing through the join to a subscribed viewport — not a goal in itself here.
- A new join type or multi-level join (joining a join table to another table). `SnakeLocations` is
  a single, terminal `LeftOuterJoin` between two base tables.
- Registering the per-second tick loop with `LifecycleContainer` as a first-class `Provider`
  lifecycle (the way `SimulatedPricesProvider`'s `LifeCycleRunner` does on the Scala side, per
  `example/price/src/main/scala/org/finos/vuu/provider/simulation/SimulatedPricesProvider.scala`).
  A plain Python daemon thread is enough for an example script; see "Open questions" below for why
  this is believed sufficient rather than proven.

### Design

All additions live in `start_server.py`'s `main()`, in two places: the new table/provider/join
definitions go immediately after the existing `Snakes` definitions (before `snakes_module` is
built, since `Location` and `SnakeLocations` join `snakes_module`'s own `.addTable`/`.addJoinTable`
chain); the population-and-tick-loop code goes where the `Snakes` sample data is ticked in today,
right after `lifecycle.start()`.

#### New imports

```python
import random
import threading
import time

from org.finos.vuu.api import ColumnBuilder, TableDefBuilder, JoinTableDefBuilder, JoinToBuilder
from org.finos.vuu.core.table import Columns
from java.util import List as JList
```

`Columns` (`org.finos.vuu.core.table.Columns`) is the same Scala `object` `SimulationModule` uses
to build a join table's `joinColumns` (`Columns.allFrom(...)` / `Columns.allFromExceptDefaultAnd(...)`)
— a static forwarder call, exactly like the `.apply()`/`ModuleFactory.withNamespace(...)` calls
already confirmed working from JPype in the base design's "Open questions" section.

#### `Location`'s `TableDef`

Same `TableDefBuilder` shape `Snakes` already uses, plus `.joinFields(...)` so `id` is exposed as a
joinable field — `Snakes`' existing `TableDefBuilder` chain needs the same addition, since a join
needs the key field declared on *both* sides (mirroring `PriceModule`'s `prices` table and
`SimulationModule`'s `instruments` table, which both declare `joinFields = List("ric")` before
`SimulationModule` joins them):

```python
snakes_table_def = (
    TableDefBuilder()
    .name("Snakes")
    .keyField("id")
    .joinFields(JList.of("id"))                      # new — exposes "id" as a join key
    .customColumns(
        ColumnBuilder()
        .addString("type")
        .addString("name")
        .addString("id")
        .addInt("age")
        .addDouble("weight")
        .build()
    )
    .build()
)

location_table_def = (
    TableDefBuilder()
    .name("Location")
    .keyField("id")
    .joinFields(JList.of("id"))
    .customColumns(
        ColumnBuilder()
        .addString("id")
        .addDouble("x_coordinate")
        .addDouble("y_coordinate")
        .build()
    )
    .build()
)
```

#### `Location`'s provider

No new provider class needed — `TickingProvider` (already defined for `Snakes`, see the addendum
above) is generic over any table's columns (it dispatches on each column's actual `DataType` in
`tick()`), so it works unchanged for `Location`'s two `double` columns. Only a new factory closure
is needed, since `ModuleFactory.addTable`'s second argument is per-table:

```python
@jpype.JImplements("scala.Function2")
class LocationProviderFactory:
    @jpype.JOverride
    def apply(self, table, view_server):
        return TickingProvider(table)
```

#### `SnakeLocations`' `JoinTableDef`

`ModuleFactory.addJoinTable` takes a `TableDefContainer => JoinTableDef` function (`scala.Function1`)
rather than a realized `JoinTableDef` — the same reason `addTable`'s provider argument is a factory
function rather than a `Provider` instance: at the point this chain is being built, `Location` isn't
registered in the container yet. `ModuleFactory.asModule()` (see
`vuu/src/main/scala/org/finos/vuu/core/module/ModuleFactory.scala`) registers every `.addTable(...)`
call's `TableDef` into the container *before* it realizes any `.addJoinTable(...)` function, so by
the time this closure runs, `table_def_container.get("SNAKES", "Snakes")` and `.get("SNAKES",
"Location")` both resolve — same pattern `SimulationModule` uses to reach `PriceModule`'s `prices`
table via `tableDefs.get(PriceModule.NAME, "prices")`:

```python
@jpype.JImplements("scala.Function1")
class SnakeLocationsJoinFactory:
    @jpype.JOverride
    def apply(self, table_def_container):
        snakes_td = table_def_container.get("SNAKES", "Snakes")
        location_td = table_def_container.get("SNAKES", "Location")
        # allFromExceptDefaultAnd's excludeColumns is a Scala varargs (String*), which is a
        # scala.collection.immutable.Seq at the JVM boundary - a plain Python str isn't
        # accepted (see "Open questions" below), so it's built via the same
        # ListBuffer().toList() pattern already used elsewhere in this script for Scala List
        # arguments.
        exclude_columns = ListBuffer()
        exclude_columns.append("id")
        join_columns = list(Columns.allFrom(snakes_td)) + list(
            Columns.allFromExceptDefaultAnd(location_td, exclude_columns.toList())
        )
        return (
            JoinTableDefBuilder()
            .name("SnakeLocations")
            .baseTable(snakes_td)
            .joinColumns(join_columns)
            .joinTos(JList.of(
                JoinToBuilder().table(location_td).leftKey("id").rightKey("id").build()
            ))
            .build()
        )
```

`Columns.allFrom(snakes_td)` pulls in all of `Snakes`' columns; `Columns.allFromExceptDefaultAnd
(location_td, ...)` pulls in `Location`'s columns except the default columns and `id` itself (`id`
is already coming from the `Snakes` side — this is exactly the `excludeColumns` pattern
`SimulationModule` uses to avoid a duplicate `ric` column when joining `instruments`/`prices`).
`JoinToBuilder` defaults `joinType` to `LeftOuterJoin`, so it doesn't need to be set explicitly.

#### Registering both with the module

```python
snakes_module = (
    ModuleFactory.withNamespace("SNAKES", table_def_container)
    .addTable(snakes_table_def, SnakesProviderFactory())
    .addTable(location_table_def, LocationProviderFactory())
    .addJoinTable(SnakeLocationsJoinFactory())
    .asModule()
)
```

#### Populating `Location` at startup and ticking it every second

Placed right after `lifecycle.start()`, alongside the existing `Snakes` sample-data ticking:

```python
snakes_provider = server.providerContainer().getProviderForTable("Snakes").get()
sample_snakes = [
    {"id": "s1", "name": "Kaa", "type": "Python", "age": 40, "weight": 91.5},
    # ...as today
]
for snake in sample_snakes:
    snakes_provider.tick(snake["id"], snake)

location_provider = server.providerContainer().getProviderForTable("Location").get()

BOUNDS = 100.0   # coordinate space is a 100x100 square
STEP = 2.0       # max distance a snake moves per tick, in either axis

positions = {
    snake["id"]: {"x": random.uniform(0, BOUNDS), "y": random.uniform(0, BOUNDS)}
    for snake in sample_snakes
}

def tick_locations() -> None:
    for snake_id, pos in positions.items():
        pos["x"] = min(max(pos["x"] + random.uniform(-STEP, STEP), 0.0), BOUNDS)
        pos["y"] = min(max(pos["y"] + random.uniform(-STEP, STEP), 0.0), BOUNDS)
        location_provider.tick(
            snake_id, {"id": snake_id, "x_coordinate": pos["x"], "y_coordinate": pos["y"]}
        )

tick_locations()  # populate Location with starting positions before reporting ready

def location_loop() -> None:
    while True:
        time.sleep(1)
        tick_locations()

threading.Thread(target=location_loop, name="location-ticker", daemon=True).start()
```

The `[VUU] Ready` line should also report `Location`'s initial population, mirroring how it already
reports `Snakes`':

```python
print(
    f"[VUU] Ready — wss://{host}:{WS_PORT}/websocket  https://{host}:{HTTPS_PORT}"
    f"  (ticked {len(sample_snakes)} rows into Snakes, {len(positions)} rows into Location)",
    flush=True,
)
```

A plain `threading.Thread(daemon=True)` is used rather than any JVM-side scheduler — the loop only
needs to call `.tick(...)` on a Python object once a second, which needs no JPype proxying at all
(unlike `TickingProvider`/the two factories above, which proxy actual JVM interfaces). This mirrors
the base design's approach of doing as little through JPype as the goal requires: `LifeCycleRunner`
(what `SimulatedPricesProvider` uses on the Scala side, in
`example/price/src/main/scala/org/finos/vuu/provider/simulation/SimulatedPricesProvider.scala`) is
a JVM-side background-thread abstraction that plain Python `threading` already provides directly.

### Open questions / risks — resolved during implementation

All checked directly against a running JVM (`jpype1==1.7.1`, Temurin JDK 17) before this addendum
was finalized, the same way the `Snakes` addendum's own open questions were resolved:

1. **`scala.Function1` via `@jpype.JImplements`.** Confirmed — proxies exactly as cleanly as
   `Provider`/`scala.Function2` did for `Snakes`, for the same reason (single-abstract-method
   interface at the bytecode level). `ModuleFactory.addJoinTable(SnakeLocationsJoinFactory())`
   builds and runs with no proxy errors.
2. **`Column[]` from a Python `list`.** Confirmed — `.joinColumns(join_columns)`, where
   `join_columns` is a plain Python `list` built from `list(...) + list(...)` on two JPype array
   results, auto-converts to the Java `Column[]` parameter with no explicit `jpype.JArray(Column)`
   wrapper needed.
3. **`java.util.List.of(...)` for `.joinTos(...)`.** Confirmed working as written
   (`JList.of(JoinToBuilder()....build())`); not separately re-tried with a bare Python list.
4. **Cross-table resolution via `TableDefContainer.get`.** Confirmed — log output showed `Creating
   table Location` followed by `Creating joinTable SnakeLocations` and `Adding joinDef for
   SnakeLocations` with no errors, i.e. `table_def_container.get("SNAKES", "Location")` resolved
   correctly inside `SnakeLocationsJoinFactory.apply` once `Location` had been added via
   `.addTable` earlier in the same chain, exactly as `ModuleFactory.asModule()`'s realization order
   predicted.
5. **End-to-end confirmation the join actually ticks live.** Confirmed — see "Validation" below.
6. **Daemon-thread shutdown behaviour.** Confirmed — `test_start_server.py`'s existing SIGTERM/exit
   code 143 assertion still passes with `location_loop`'s background thread running; it doesn't
   block interpreter exit or leave the process hanging.
7. **New finding, not anticipated above:** `Columns.allFromExceptDefaultAnd(table, excludeColumns:
   String*)`'s varargs parameter is a `scala.collection.immutable.Seq` at the JVM boundary, not a
   bare `String` — calling it as `Columns.allFromExceptDefaultAnd(location_td, "id")` (as originally
   sketched above) fails with `TypeError: No matching overloads found for *static*
   Columns.allFromExceptDefaultAnd(TableDef,str)`. Fixed by building the exclusion list the same way
   this script already builds `VuuServerConfig`'s Scala `List` arguments —
   `ListBuffer().append("id").toList()` — and passing that instead. This only surfaced by actually
   calling it; nothing about the Java-visible method signature (`Columns.allFromExceptDefaultAnd
   (TableDef, Seq)`, per `javap`-equivalent inspection) makes the varargs-vs-Seq distinction obvious
   from Python.

### Validation

Checked directly against a running JVM (`jpype1==1.7.1`, Temurin JDK 17), first with a full server
start and then with a short-lived debug tap added temporarily to `start_server.py` (not part of the
final diff) that read `SnakeLocations` back directly via `server.tableContainer().getTable
("SnakeLocations").pullRow("s1")`:

- Server start log confirms `Creating table Location`, `Loading provider for table Location...`,
  `Creating joinTable SnakeLocations`, `Adding joinDef for SnakeLocations`, and
  `Initializing class jdk.proxy2.$ProxyN TickingProvider-Location` (the same JDK dynamic-proxy
  confirmation used to validate `Snakes`' provider) — no exceptions anywhere in the chain.
- `[VUU] Ready` reports `ticked 23 rows into Snakes, 23 rows into Location`, confirming both
  tables' startup population ran.
- The debug tap's `pullRow("s1")` read back `name='Kaa'` (from `Snakes`, via the base-table side of
  the join) alongside `x_coordinate`/`y_coordinate` (from `Location`) in the same row, and the
  coordinate values changed across four reads one second apart — direct confirmation the join
  reflects `Location`'s per-second ticks live, joined against the correct `Snakes` row by `id`, not
  just that the module built without exceptions.
- `wss://…:8090/websocket` accepted a plain TCP connect with the new module included, same as the
  base design and the `Snakes` addendum.
- `test_start_server.py`'s existing subprocess smoke test (extended with an assertion on the
  `Location` row count in the `Ready` line) passed: the process starts, reports ready, accepts a
  websocket TCP connection, and exits with code 143 on `SIGTERM` — confirming the new background
  tick thread doesn't change the process's clean-shutdown behaviour.

### Testing strategy

`test_start_server.py`'s existing smoke test was extended with one assertion: that the `[VUU] Ready`
line also reports `23 rows into Location`, alongside the pre-existing assertion for `Snakes`' 23
rows. Live-update correctness (coordinates actually changing once a second through the join) was
checked manually via the debug tap described under "Validation" rather than added to the subprocess
smoke test, consistent with that test's existing scope (port-listening and clean-shutdown checks,
not data-correctness checks).

### Files

**Changed only** — no new files, same as the `Snakes` addendum:
- `example/python-integration/python/start_server.py` — `Location` `TableDef` + `joinFields` added
  to `Snakes`, `LocationProviderFactory`, `SnakeLocationsJoinFactory`, both tables/the join table
  added to `snakes_module`'s builder chain, `Location` populated and ticked every second via a
  daemon thread, `[VUU] Ready` line updated.
- `example/python-integration/python/test_start_server.py` — updated assertion for the `Ready` line.
- `example/python-integration/README.md` — describes `Location`/`SnakeLocations`.

### Scope

An estimated ~70–90 line addition to `start_server.py` (two new table-def/provider-factory blocks,
one join-table factory, and the population/tick-loop code), no new Maven module, no new dependency.
Comparable in size to the `Snakes` addendum itself.

## Addendum 3: an RPC-driven "Delete Selected Snake(s)" right-click menu, defined in Python

**Status: Implemented.** Built and verified end-to-end against a real JVM: right-clicking a
selection on `Snakes` now offers a "Delete Selected Snake(s)" menu item whose Python-implemented
callback deletes the selected row(s) via `table.processDelete(key)`. Unlike the two addenda above,
this one needed a small, reusable addition to `vuu-java` (not just calls into existing API) — see
"Design" and "Open questions" below for why, and why it was kept general rather than Snakes-shaped.

**Revision note:** an alternative design was also built and verified along the way — a small
compiled Java class (`SnakesRpcService`, matching `example/permission`'s `PermissionsRpcService`
shape) living inside `example/python-integration` itself, touching nothing outside the module.
It worked identically (same live-JVM validation, same result). It was tried specifically to answer
"does this need to touch `vuu-java` at all?", and was then rolled back in favour of the version
described below — kept 100% Python (bar the JVM interop this addendum's own "Design" section
explains is unavoidable), on the view that a small, general, reusable addition to `vuu-java` (a
module that already exists to bridge Scala-only shapes for Java/JPype callers) was preferable to
a table-specific compiled class inside the example. Both are legitimate, verified designs; this is
the one in the current diff.

### Motivation

`Snakes` so far only reacts to Python calling `.tick(...)` on it directly — nothing a client can
trigger itself. Vuu's per-table RPC mechanism (right-click context menus, backed by an
`RpcHandler`) is how a real client-driven action reaches a table, and `SelectionViewPortMenuItem`
(an action over the client's current row selection) is the most common shape of it — a "cancel
selected orders" or, here, "delete selected rows" menu item, the same shape
`example/permission`'s `PermissionsRpcService` already uses for `Add`/`Remove Permission`. This
addendum adds exactly that to `Snakes`, entirely in Python, extending the pattern the
`Snakes`/`Location`/`SnakeLocations` addenda already established for tables, providers and join
tables.

### Goals

- A right-click context menu item on `Snakes`, "Delete Selected Snake(s)", that deletes every
  currently-selected row from `Snakes` via `table.processDelete(key)` when clicked.
- The menu item's callback function defined in Python, the same way `Snakes`' provider is: a JPype
  proxy over the relevant Scala single-abstract-method (SAM) interface, not compiled Java/Scala.
- `Location`/`SnakeLocations` untouched — this is `Snakes`-specific, wired through the same
  `ModuleFactory.addTable(...)` call `Snakes` already uses, via its optional third argument.

### Non-goals

- Deleting the corresponding `Location` row, or otherwise reconciling `Location`'s per-second tick
  loop with `Snakes` deletions. A deleted snake's `Location` row keeps being ticked (it just no
  longer appears via `SnakeLocations`, since the join follows `Snakes`' row set) — harmless for an
  example script, and cleaning it up is a separate concern from adding the menu item itself.
- Any menu item shape other than `SelectionViewPortMenuItem` (`TableViewPortMenuItem`,
  `CellViewPortMenuItem`, `RowViewPortMenuItem` all exist in the same file but aren't needed here).
- Undo, confirmation dialogs, or any other UX around the delete — the menu item's `ViewPortAction`
  return value supports an `OpenDialogViewPortAction` for this kind of thing, but a plain delete
  (returning `NoAction`) is all this addendum asks for.

### Design

#### Why this needed a `vuu-java` addition, not just Python

`SelectionViewPortMenuItem`'s callback (`func: (ViewPortSelection, ClientSessionId) =>
ViewPortAction`) is a plain `scala.Function2` — the exact SAM shape already proxied from Python for
`SnakesProviderFactory`/`LocationProviderFactory` via `@jpype.JImplements("scala.Function2")`. And
`ModuleFactory.addTable`'s optional third argument, `(DataTable, Provider, ProviderContainer,
TableContainer) => ViewPortDef` (what the two-arg overload defaults to
`ViewPortDef.createDefault(...)` for), is a `scala.Function4` — same story, same JPype pattern.

Attaching a *menu* to a table, however, means overriding `RpcHandler.menuItems()` on a concrete
`RpcHandler` instance — and `menuItems()` already has a default body (`EmptyViewPortMenu`), so it
isn't something a bare interface proxy can be asked to "implement" the way `Provider`'s genuinely
abstract methods are. Checked directly against the compiled bytecode (`javap -p` on
`RpcHandler.class`):

```
public interface org.finos.vuu.net.rpc.RpcHandler extends com.typesafe.scalalogging.StrictLogging {
  public abstract java.lang.String rpcNotSupportedMsg();
  public abstract void org$finos$vuu$net$rpc$RpcHandler$_setter_$rpcNotSupportedMsg_$eq(java.lang.String);
  public default org.finos.vuu.viewport.ViewPortMenu menuItems();
  public abstract java.util.concurrent.ConcurrentHashMap ...rpcHandlerMap();
  public abstract void ..._setter_$...rpcHandlerMap_$eq(java.util.concurrent.ConcurrentHashMap);
  ...
}
```

`RpcHandler` genuinely is a plain Java `interface` at the bytecode level, so a JPype
`@jpype.JImplements` proxy *can* technically be constructed — but doing so means also implementing
the abstract getter/setter pairs backing the trait's private fields, whose names are
Scala-compiler-mangled (`org$finos$vuu$net$rpc$RpcHandler$_setter_$...`, `$` and all) — not
writable as a normal Python `def`, only via `setattr(cls, "...$...", fn)` on an otherwise-illegal
identifier, reimplementing Scala trait-initialization plumbing that's really an implementation
detail of how `RpcHandler` happens to compile today. Not something to depend on surviving a Scala
compiler upgrade — ruled out as too fragile, in favour of subclassing `DefaultRpcHandlerImpl` in a
real JVM language instead (the way every existing table in the repo that attaches a menu already
does — `PermissionsRpcService`, `EditPersonRecordRpcHandler`, etc.). `vuu-java`'s existing
`RpcHandlerBuilder` (used for registering named RPCs, e.g. in `example/main-java`'s
`JavaExampleModule`) has no equivalent for menus at all.

The fix, mirroring how `vuu-java` already bridges other Scala-only shapes for Java/JPype callers
(`JoinTableDefBuilder`/`JoinToBuilder` for join tables), is a small addition to `vuu-java` itself:

**New: `vuu-java/src/main/java/org/finos/vuu/net/rpc/RpcHandlerWithMenu.java`**

```java
package org.finos.vuu.net.rpc;

import org.finos.vuu.viewport.ViewPortMenu;

public class RpcHandlerWithMenu extends DefaultRpcHandlerImpl {
    private final ViewPortMenu menu;

    public RpcHandlerWithMenu(ViewPortMenu menu) {
        this.menu = menu;
    }

    @Override
    public ViewPortMenu menuItems() {
        return menu;
    }
}
```

**Changed: `RpcHandlerBuilder`** gets a `.menu(ViewPortMenu)` method alongside its existing
`.addRpc(...)`, and `.build()` picks `RpcHandlerWithMenu` over `DefaultRpcHandler.apply()` when a
menu was configured:

```java
public RpcHandlerBuilder menu(ViewPortMenu menu) {
    this.menu = menu;
    return this;
}

public RpcHandler build() {
    RpcHandler rpcHandler = (menu != null) ? new RpcHandlerWithMenu(menu) : DefaultRpcHandler.apply();
    rpcs.forEach(rpcHandler::registerRpc);
    return rpcHandler;
}
```

This is deliberately general (any `ViewPortMenu`, not a `Snakes`-specific type), kept in `vuu-java`
rather than `example/python-integration`, consistent with `vuu-java` already being "Java-friendly
builders over Scala-only shapes" and not specific to any one example. `SelectionViewPortMenuItem`
is itself a `ViewPortMenuItem`/`ViewPortMenu` (sealed trait hierarchy), so a single item can be
passed to `.menu(...)` directly with no need to wrap it via `ViewPortMenu.apply(...)`.

#### Python side — `start_server.py`

New imports:

```python
from org.finos.vuu.api import ColumnBuilder, TableDefBuilder, JoinTableDefBuilder, JoinToBuilder, ViewPortDef
from org.finos.vuu.net.rpc import RpcHandlerBuilder
from org.finos.vuu.viewport import SelectionViewPortMenuItem
```

`ViewPortAction`'s `NoAction` case (returned by a delete action that doesn't need to tell the
client anything else) is a plain Scala `object`, not a case class — its singleton lives on the
`MODULE$` static field of the compiler-generated `NoAction$` class. `$` isn't a legal character in
a Python identifier, so `from ... import NoAction$` and `x.MODULE$` are both unwritable; `JClass` +
`getattr` sidesteps both:

```python
NO_ACTION = getattr(jpype.JClass("org.finos.vuu.viewport.NoAction$"), "MODULE$")
```

The callback itself, proxied the same way `SnakesProviderFactory` already is:

```python
@jpype.JImplements("scala.Function2")
class DeleteSelectedSnakesAction:
    def __init__(self, table):
        self.table = table

    @jpype.JOverride
    def apply(self, selection, session):
        # selection.selectionKeys() is a scala.collection.immutable.Set[String] - iterated the
        # same way Vuu's own Scala code does when acting on a selection (see
        # EditableTestModule.deleteSelectedRows), via .iterator()/.hasNext()/.next(), rather
        # than relying on Python's iteration protocol working on a Scala collection.
        keys = selection.selectionKeys().iterator()
        while keys.hasNext():
            self.table.processDelete(str(keys.next()))
        return NO_ACTION
```

And the `ModuleFactory.addTable` third argument that wires it onto `Snakes` specifically:

```python
@jpype.JImplements("scala.Function4")
class SnakesViewPortDefFactory:
    @jpype.JOverride
    def apply(self, table, provider, provider_container, table_container):
        delete_menu_item = SelectionViewPortMenuItem(
            "Delete Selected Snake(s)", "", DeleteSelectedSnakesAction(table), "DELETE_SELECTED_SNAKES"
        )
        rpc_handler = RpcHandlerBuilder().menu(delete_menu_item).build()
        return ViewPortDef(table.getTableDef().getColumns(), rpc_handler)
```

```python
snakes_module = (
    ModuleFactory.withNamespace("SNAKES", table_def_container)
    .addTable(snakes_table_def, SnakesProviderFactory(), SnakesViewPortDefFactory())
    .addTable(location_table_def, LocationProviderFactory())
    .addJoinTable(SnakeLocationsJoinFactory())
    .asModule()
)
```

`Location`'s `addTable` call is left on the two-arg overload — it gets the default `ViewPortDef`
(no menu), exactly as before.

### Open questions / risks — resolved during implementation

All checked directly against a running JVM (`jpype1==1.7.1`, Temurin JDK 17) before this addendum
was finalized:

1. **`scala.Function4` via `@jpype.JImplements`.** Confirmed — proxies the same way
   `Function2`/`Function1` already do (single-abstract-method interface at the bytecode level,
   regardless of arity). `SnakesViewPortDefFactory` builds and runs with no proxy errors.
2. **`NoAction$.MODULE$` access from Python.** Confirmed — `getattr(jpype.JClass("org.finos.vuu.
   viewport.NoAction$"), "MODULE$")` resolves the singleton and can be returned from the
   `Function2` callback with no error.
3. **`SelectionViewPortMenuItem`'s direct constructor call from Python.** Confirmed —
   `SelectionViewPortMenuItem(name, filter, callback_instance, rpcName)` (a 4-arg case-class
   constructor call) works exactly like `TableDefBuilder`/other direct-construction calls
   elsewhere in this script.
4. **`RpcHandlerWithMenu`/`RpcHandlerBuilder.menu(...)`.** Confirmed both in isolation (a new
   `RpcHandlerBuilderTest` in `vuu-java`, asserting the built handler's `menuMap()` contains the
   configured item under its `rpcName`) and end-to-end (see "Validation" below).
5. **Iterating `selection.selectionKeys()` from Python.** Confirmed — `scala.collection.immutable.
   Set[String]` doesn't implement `java.lang.Iterable`, so plain Python `for key in
   selection.selectionKeys()` isn't expected to work; `.iterator()`/`.hasNext()`/`.next()` (the
   same idiom `EditableTestModule.deleteSelectedRows` uses in Scala) does.
6. **Whether `RpcHandler` could be proxied directly instead of adding `RpcHandlerWithMenu`.**
   Resolved by reading the actual compiled bytecode (`javap`, see "Design" above) — it technically
   can be constructed as a bare JPype proxy, but only by implementing Scala-mangled private-field
   accessors, judged too fragile to ship (see "Design").

No other API mismatches were found this time (unlike the join-table addendum's `Columns.
allFromExceptDefaultAnd` varargs surprise) — every other call worked as designed on the first run
against a live JVM.

### Validation

Checked directly against a running JVM, with a short-lived debug tap added temporarily to
`start_server.py` (not part of the final diff, deleted after use) that, ~1s after startup:

- Called `SnakesViewPortDefFactory().apply(snakes_table, None, None, None)` directly against the
  live `Snakes` `DataTable` (the other three arguments are unused by the factory, so `None` is
  fine) and inspected the resulting `ViewPortDef`'s `service().menuMap()`: confirmed it
  `.contains("DELETE_SELECTED_SNAKES")` and that the mapped item's `.name()` is `"Delete Selected
  Snake(s)"`.
- Read `snakes_table.pullRow("s5")` beforehand (`RowWithData` — the row exists).
- Built a `ViewPortSelection` wrapping just `"s5"`'s key (via the same `ListBuffer().toList()`
  pattern already used elsewhere in this script for Scala collection arguments, then `.toSet()`)
  with `None` for the `ViewPortSelection`'s `viewPort` field and for the callback's
  `ClientSessionId` parameter — both safe to omit here since the callback never touches either —
  and called the menu item's `func()` on it directly.
- Read `snakes_table.pullRow("s5")` again afterward: `EmptyRowData$` — the row is gone. Direct
  confirmation the menu item's callback actually deletes from the live table, not just that it
  builds without exceptions.
- `vuu-java`'s full test suite (910+ tests, including the new `RpcHandlerBuilderTest`'s three
  cases) and the existing `test_start_server.py` smoke test both still pass unmodified.
- The alternative compiled-Java-in-example design (see "Revision note" above) was checked
  identically — same debug tap, same `RowWithData` → `EmptyRowData$` result — before being rolled
  back in favour of this version.

### Testing strategy

- **`vuu-java/src/test/java/org/finos/vuu/net/rpc/RpcHandlerBuilderTest.java`** (new): unit tests
  for `RpcHandlerBuilder.menu(...)` in isolation — a handler built with no menu exposes an empty
  `menuMap()`; one built with a `SelectionViewPortMenuItem` exposes it under its `rpcName`; a
  handler combining `.menu(...)` and `.addRpc(...)` exposes both. Mirrors the existing
  `JoinToBuilderTest`/`JoinTableDefBuilderTest` style for `vuu-java` builder tests.
- End-to-end correctness (the callback actually deleting from a live table, reached via the same
  path a real client's right-click would use) was checked manually via the debug tap described
  under "Validation" rather than added to `test_start_server.py`'s subprocess smoke test — building
  a genuine `ViewPort`/client selection from a smoke test would need a real websocket client, which
  is out of that test's existing scope (port-listening and clean-shutdown checks only).

### Files

**New:**
- `vuu-java/src/main/java/org/finos/vuu/net/rpc/RpcHandlerWithMenu.java`
- `vuu-java/src/test/java/org/finos/vuu/net/rpc/RpcHandlerBuilderTest.java`

**Changed:**
- `vuu-java/src/main/java/org/finos/vuu/net/rpc/RpcHandlerBuilder.java` — added `.menu(ViewPortMenu)`.
- `example/python-integration/python/start_server.py` — `DeleteSelectedSnakesAction`,
  `SnakesViewPortDefFactory`, the `NoAction` singleton lookup, and `Snakes`' `addTable` call
  switched to the 3-arg overload.
- `example/python-integration/README.md` — describes the new menu item.

**Considered, built, verified, then not used (see "Revision note" above):**
- A compiled `example/python-integration/src/main/java/org/finos/vuu/module/SnakesRpcService.java`
  (with `pom.xml` `packaging` switched to `jar` to compile it) — a working alternative that kept
  `vuu-java` untouched at the cost of adding compiled Java inside the example module. Not part of
  the current diff; `pom.xml` stays `packaging=pom`.

### Scope

A ~50-line addition to `start_server.py` plus a small, general-purpose `vuu-java` addition (one new
~20-line class, one new builder method, one new test file) — the only addendum so far that touches
code outside `example/python-integration`, because the gap it closes (attaching a `ViewPortMenu`
without subclassing a concrete JVM class) belongs in the shared Java-interop layer, not the example.
