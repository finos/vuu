"""
Starts the Vuu view server from Python.

Mirrors example/main-java's VuuExampleMain: the same VuuServerConfig, the same
modules (PriceModule, SimulationModule, MetricsModule, AuthNModule), the same
default ports. The only difference is that the JVM is embedded in this Python
process (via JPype) instead of being its own `java` process, so this script is
genuinely constructing and starting the server objects itself.

It also defines its own "Snakes" table module entirely in Python: TickingProvider
implements org.finos.vuu.provider.Provider and the module-factory function
implements scala.Function2, both via JPype's @JImplements proxy support - no
compiled Java/Scala source is needed for this module at all. After the server
starts, sample rows are ticked into Snakes directly from Python.

Usage:
    mvn -pl example/python-integration -am package   # from the repo root, once
    pip install -r requirements.txt
    python start_server.py
"""
import os
import socket
from pathlib import Path

import jpype
import jpype.imports

MODULE_DIR = Path(__file__).resolve().parent.parent  # example/python-integration
REPO_ROOT = MODULE_DIR.parents[1]
CLASSPATH_FILE = MODULE_DIR / "target" / "classpath.txt"

WS_PORT = 8090
HTTPS_PORT = 8443


def _read_classpath() -> list[str]:
    if not CLASSPATH_FILE.exists():
        raise SystemExit(
            f"{CLASSPATH_FILE} not found — build the module first:\n"
            "    mvn -pl example/python-integration -am package"
        )
    return CLASSPATH_FILE.read_text().strip().split(":")


def _local_hostname() -> str:
    return socket.gethostname()


def start_jvm() -> None:
    jpype.startJVM(classpath=_read_classpath())


def main() -> None:
    start_jvm()

    # Imported only after the JVM is up — JPype resolves these against the
    # classpath assembled by `mvn package` (see pom.xml's build-classpath
    # execution).
    from org.finos.toolbox.jmx import MetricsProviderImpl
    from org.finos.toolbox.lifecycle import LifecycleContainer
    from org.finos.toolbox.time import DefaultClock
    from org.finos.vuu.api import ColumnBuilder, TableDefBuilder
    from org.finos.vuu.core import (
        VuuServerConfig,
        VuuServer,
        VuuWebSocketOptions,
        VuuSecurityOptions,
        VuuThreadingOptions,
        VuuClientConnectionOptions,
        VuuJoinTableProviderOptions,
        VuuRpcOptions,
    )
    from org.finos.vuu.core.module import ModuleFactory, TableDefContainer
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

    # --- The "Snakes" table's provider and module-factory function, defined entirely in
    # Python via JPype proxies over the JVM's Provider interface and Function2 trait. ---

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

    metrics = MetricsProviderImpl()
    clock = DefaultClock()
    lifecycle = LifecycleContainer(clock)
    table_def_container = TableDefContainer()

    lifecycle.autoShutdownHook()

    login_token_service = LoginTokenService.apply()

    snakes_module = (
        ModuleFactory.withNamespace("SNAKES", table_def_container)
        .addTable(snakes_table_def, SnakesProviderFactory())
        .asModule()
    )

    cert_path = str(MODULE_DIR / "src/main/resources/certs/cert.pem")
    key_path = str(MODULE_DIR / "src/main/resources/certs/key.pem")

    # Vert.x's StaticHandler (which AbsolutePathWebRoot ultimately feeds) rejects a root
    # starting with '/', despite the class's name — so this has to be relative to the
    # process's current working directory, not an OS-absolute path. Computed via os.path.relpath
    # (rather than hardcoding "vuu-ui/deployed_apps/app-vuu-example" the way the Java/Scala
    # examples do) so this script isn't sensitive to which directory it happens to be launched
    # from, the way VuuExampleMain.java/SimulMain.scala are.
    webroot_abs = REPO_ROOT / "vuu-ui/deployed_apps/app-vuu-example"
    webroot = os.path.relpath(webroot_abs, start=Path.cwd())

    ssl = VuuSSLByCertAndKey(cert_path, key_path, ScalaOption.empty(), VuuSSLCipherSuiteOptions.apply())

    config = (
        VuuServerConfig(
            VuuWebSocketOptions.apply()
            .withUri("websocket")
            .withWsPort(WS_PORT)
            .withSsl(ssl)
            .withBindAddress("0.0.0.0"),
            VuuSecurityOptions.apply().withLoginTokenService(login_token_service),
            VuuThreadingOptions.apply().withTreeThreads(1).withViewPortThreads(1),
            VuuClientConnectionOptions.apply().withHeartbeatEnabled(),
            VuuJoinTableProviderOptions.apply(),
            VuuRpcOptions.apply(),
            ListBuffer().toList(),
            ListBuffer().toList(),
            VuuHttp2ServerFactory.apply(
                VuuHttp2ServerOptions.apply()
                .withWebRoot(AbsolutePathWebRoot(webroot, True))
                .withSsl(ssl)
                .withPort(HTTPS_PORT)
            ),
        )
        .withModule(PriceModule.apply(clock, lifecycle, table_def_container))
        .withModule(SimulationModule.apply(clock, lifecycle, table_def_container))
        .withModule(MetricsModule.apply(clock, lifecycle, metrics, table_def_container))
        .withModule(
            AuthNModule.apply(login_token_service, ScalaOption.empty(), clock, lifecycle, table_def_container)
        )
        .withModule(snakes_module)
    )

    server = VuuServer(config, lifecycle, clock, metrics)

    lifecycle.start()

    # Reach into the live server and drive the Snakes table directly from Python: fetch the
    # TickingProvider that the module-factory function created for it (JPype round-trips this
    # back as the same Python object, not just a generic Java-interface stub) and tick some
    # sample rows in. A plain Python dict is passed straight through — JPype converts it to a
    # java.util.Map automatically at the call boundary.
    snakes_provider = server.providerContainer().getProviderForTable("Snakes").get()
    sample_snakes = [
        {"id": "s1", "name": "Kaa", "type": "Python"},
        {"id": "s2", "name": "Nagini", "type": "Python"},
        {"id": "s3", "name": "Sir Hiss", "type": "Grass snake"},
    ]
    for snake in sample_snakes:
        snakes_provider.tick(snake["id"], snake)

    host = _local_hostname()
    print(
        f"[VUU] Ready — wss://{host}:{WS_PORT}/websocket  https://{host}:{HTTPS_PORT}"
        f"  (ticked {len(sample_snakes)} rows into Snakes)",
        flush=True,
    )

    server.join()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
