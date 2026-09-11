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
being out of scope — see the addendum for why that turned out to be straightforward).

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
JPype's `@JImplements` proxy support, ticks three sample rows into it after `lifecycle.start()`,
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
            row_builder.setString(column, value)
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
    .customColumns(ColumnBuilder().addString("type").addString("name").addString("id").build())
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

After `lifecycle.start()`, the sample-data ticking is unchanged from the Java-based version:

```python
snakes_provider = server.providerContainer().getProviderForTable("Snakes").get()
sample_snakes = [
    {"id": "s1", "name": "Kaa", "type": "Python"},
    {"id": "s2", "name": "Nagini", "type": "Python"},
    {"id": "s3", "name": "Sir Hiss", "type": "Grass snake"},
]
for snake in sample_snakes:
    snakes_provider.tick(snake["id"], snake)
```

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
  (still asserts the `[VUU] Ready` line reports ticking 3 rows into `Snakes`); passes unmodified
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
