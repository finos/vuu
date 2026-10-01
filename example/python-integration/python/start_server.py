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
starts, SNAKE_COUNT (10,000 by default) procedurally-generated rows are ticked
into Snakes directly from Python, one `.tick()` JPype call per row - about 2s of
startup work at the default count, measured end-to-end (process start to the
"[VUU] Ready" line) against a real JVM.

A "Location" table (keyed by the same snake id, holding x_coordinate/y_coordinate)
and a "SnakeLocations" join table combining Snakes and Location on id are defined
the same way - Location is populated at startup (one row per Snakes row) and
re-ticked once a second on a background thread to simulate movement. Each of
those per-second ticks is itself SNAKE_COUNT individual JPype calls - at the
default of 10,000 that's ~0.4-0.5s measured, so the loop's actual cadence is
closer to ~1.5s than a clean 1Hz; see the loop's own comment below.

Snakes also has an RPC-driven right-click context menu - "Delete Selected Snake(s)"
(a SelectionViewPortMenuItem) that deletes the selected row(s), and a nested
"Convert To..." submenu (a ViewPortMenuFolder) of three more SelectionViewPortMenuItems
that each set the selected row(s)' "type" column to a fixed species (Adder/Black
Mamba/Grass Snake) via a partial RowBuilder update - all defined in Python via
scala.Function2 JPype proxies, attached through a small vuu-java addition
(RpcHandlerBuilder.menu(...)/RpcHandlerWithMenu) since RpcHandler itself has no
abstract methods for JPype's @JImplements to proxy directly.

Usage:
    mvn -pl example/python-integration -am package   # from the repo root, once
    pip install -r requirements.txt
    python start_server.py
"""
import os
import random
import socket
import threading
import time
from pathlib import Path

import jpype
import jpype.imports

MODULE_DIR = Path(__file__).resolve().parent.parent  # example/python-integration
REPO_ROOT = MODULE_DIR.parents[1]
CLASSPATH_FILE = MODULE_DIR / "target" / "classpath.txt"

WS_PORT = 8090
HTTPS_PORT = 8443
SNAKE_COUNT = 10_000

SNAKE_TYPES = [
    "Python", "Grass snake", "Reticulated python", "Ball python", "Cobra",
    "Anaconda", "Black mamba", "Boa constrictor", "Corn snake", "King cobra",
    "Rattlesnake", "Copperhead", "Cottonmouth", "Adder", "Sidewinder",
    "Milk snake", "Kingsnake", "Rat snake", "Hognose snake", "Bull snake",
    "Taipan",
]

SNAKE_NAMES = [
    "Kaa", "Nagini", "Sir Hiss", "Monty", "Cleo", "Jafar", "Titan", "Venom",
    "Rex", "Slyther", "Basilisk", "Rattles", "Copper", "Marsh", "Zigzag",
    "Dune", "Speedy", "Milky", "Sunny", "Rusty", "Piglet", "Bruiser", "Sting",
]


def _generate_snakes(count: int) -> list[dict]:
    """Procedurally generates `count` Snakes rows (id/name/type/age/weight) - writing 10,000
    rows out by hand isn't practical, unlike the 23-row list this replaced."""
    return [
        {
            "id": f"s{i}",
            "name": f"{random.choice(SNAKE_NAMES)} {i}",
            "type": random.choice(SNAKE_TYPES),
            "age": random.randint(1, 40),
            "weight": round(random.uniform(0.1, 100.0), 2),
        }
        for i in range(1, count + 1)
    ]


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
    from java.util import List as JList
    from org.finos.vuu.api import ColumnBuilder, TableDefBuilder, JoinTableDefBuilder, JoinToBuilder, ViewPortDef
    from org.finos.vuu.core.table import Columns
    from org.finos.vuu.net.rpc import RpcHandlerBuilder
    from org.finos.vuu.viewport import SelectionViewPortMenuItem, ViewPortMenuFolder

    # NoAction (org.finos.vuu.viewport.NoAction) is a plain Scala `object`, not a case class -
    # its singleton instance lives on the MODULE$ static field of its compiler-generated
    # `NoAction$` class. "$" isn't a legal character in a Python identifier, so it can't be
    # named directly in a `from ... import` statement or referenced as `x.MODULE$`; JClass +
    # getattr sidesteps both restrictions.
    NO_ACTION = getattr(jpype.JClass("org.finos.vuu.viewport.NoAction$"), "MODULE$")
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

    # The Snakes table's right-click "Delete Selected Snake(s)" menu item. A
    # SelectionViewPortMenuItem's callback is a plain scala.Function2 - the same SAM shape
    # already proxied above for the provider factories - taking a ViewPortSelection (the
    # selected row keys plus the ViewPort they were selected in) and the calling
    # ClientSessionId, returning a ViewPortAction that's sent back to the client.
    @jpype.JImplements("scala.Function2")
    class DeleteSelectedSnakesAction:
        def __init__(self, table):
            self.table = table

        @jpype.JOverride
        def apply(self, selection, session):
            # selection.selectionKeys() is a scala.collection.immutable.Set[String] - iterated
            # the same way Vuu's own Scala code does when acting on a selection (see
            # EditableTestModule.deleteSelectedRows), via .iterator()/.hasNext()/.next(),
            # rather than relying on Python's iteration protocol working on a Scala collection.
            keys = selection.selectionKeys().iterator()
            while keys.hasNext():
                self.table.processDelete(str(keys.next()))
            return NO_ACTION

    # The nested "Convert To..." submenu's items. Each one's callback sets Snakes' "type"
    # column to a fixed species on every selected row - a *partial* update (only "type" is set
    # on the RowBuilder before processUpdate), which InMemRowDataMerger.mergeWithDefaults merges
    # into each row's existing data rather than replacing it, so id/name/age/weight are left
    # untouched. Same scala.Function2 SAM shape as DeleteSelectedSnakesAction above.
    @jpype.JImplements("scala.Function2")
    class ConvertSnakeTypeAction:
        def __init__(self, table, new_type):
            self.table = table
            self.new_type = new_type

        @jpype.JOverride
        def apply(self, selection, session):
            type_column = self.table.columnForName("type")
            keys = selection.selectionKeys().iterator()
            while keys.hasNext():
                row_builder = self.table.rowBuilder()
                row_builder.setKey(str(keys.next()))
                row_builder.setString(type_column, self.new_type)
                self.table.processUpdate(row_builder.build())
            return NO_ACTION

    # ModuleFactory.addTable's optional third argument - (DataTable, Provider,
    # ProviderContainer, TableContainer) => ViewPortDef, a scala.Function4 - is what the 2-arg
    # overload defaults to ViewPortDef.createDefault(...) for (a plain RpcHandler with no
    # context menu). Providing this instead attaches an RpcHandler with the delete-selected-rows
    # menu item (and the "Convert To..." submenu below) to Snakes specifically, leaving
    # Location/SnakeLocations on the default.
    @jpype.JImplements("scala.Function4")
    class SnakesViewPortDefFactory:
        @jpype.JOverride
        def apply(self, table, provider, provider_container, table_container):
            delete_menu_item = SelectionViewPortMenuItem(
                "Delete Selected Snake(s)",
                "",
                DeleteSelectedSnakesAction(table),
                "DELETE_SELECTED_SNAKES",
            )

            # ViewPortMenuFolder(name, menus: Seq[ViewPortMenu]) - a nested submenu, built
            # directly (rather than via ViewPortMenu.apply(name, menus: ViewPortMenu*)) since
            # Scala varargs are a scala.collection.immutable.Seq at the JVM boundary, not a
            # Python-list-friendly Java array - the same ListBuffer().toList() workaround
            # already used above for Columns.allFromExceptDefaultAnd's varargs.
            convert_to_items = ListBuffer()
            for label, new_type, rpc_suffix in (
                ("Adder", "Adder", "ADDER"),
                ("Black Mamba", "Black mamba", "BLACK_MAMBA"),
                ("Grass Snake", "Grass snake", "GRASS_SNAKE"),
            ):
                convert_to_items.append(
                    SelectionViewPortMenuItem(
                        label, "", ConvertSnakeTypeAction(table, new_type), f"CONVERT_TO_{rpc_suffix}"
                    )
                )
            convert_to_menu = ViewPortMenuFolder("Convert To...", convert_to_items.toList())

            top_level_items = ListBuffer()
            top_level_items.append(delete_menu_item)
            top_level_items.append(convert_to_menu)
            menu = ViewPortMenuFolder("ROOT", top_level_items.toList())

            # RpcHandlerBuilder.menu(...) is a vuu-java addition (RpcHandlerWithMenu) alongside
            # its existing .addRpc(...): RpcHandler itself has no abstract methods (menuItems()
            # already has a default EmptyViewPortMenu body, plus private mutable state), so it
            # isn't a SAM interface JPype's @JImplements can proxy - attaching a menu needs a
            # real subclass, which is what RpcHandlerWithMenu (built by this call) provides.
            rpc_handler = RpcHandlerBuilder().menu(menu).build()
            return ViewPortDef(table.getTableDef().getColumns(), rpc_handler)

    # LocationProviderFactory reuses TickingProvider as-is - it's generic over any table's
    # columns (it dispatches on each column's actual DataType in tick()), so no new provider
    # class is needed for Location's two double columns.
    @jpype.JImplements("scala.Function2")
    class LocationProviderFactory:
        @jpype.JOverride
        def apply(self, table, view_server):
            return TickingProvider(table)

    # ModuleFactory.addJoinTable takes a TableDefContainer => JoinTableDef function (a
    # scala.Function1 proxy, the same shape as the Provider-factory Function2 proxies above)
    # rather than a realized JoinTableDef, because Location isn't registered in the container
    # yet at the point this chain is being built. ModuleFactory.asModule() registers every
    # .addTable(...) call's TableDef into the container before it realizes any
    # .addJoinTable(...) function, so by the time this runs, both "Snakes" and "Location" are
    # resolvable via table_def_container.get("SNAKES", ...).
    @jpype.JImplements("scala.Function1")
    class SnakeLocationsJoinFactory:
        @jpype.JOverride
        def apply(self, table_def_container):
            snakes_td = table_def_container.get("SNAKES", "Snakes")
            location_td = table_def_container.get("SNAKES", "Location")
            # allFromExceptDefaultAnd's excludeColumns is a Scala varargs (String*), which is
            # a scala.collection.immutable.Seq at the JVM boundary - a plain Python str isn't
            # accepted, so it's built via the same ListBuffer().toList() pattern already used
            # below for VuuServerConfig's Scala List arguments.
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

    snakes_table_def = (
        TableDefBuilder()
        .name("Snakes")
        .keyField("id")
        .joinFields(JList.of("id"))
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

    metrics = MetricsProviderImpl()
    clock = DefaultClock()
    lifecycle = LifecycleContainer(clock)
    table_def_container = TableDefContainer()

    lifecycle.autoShutdownHook()

    login_token_service = LoginTokenService.apply()

    snakes_module = (
        ModuleFactory.withNamespace("SNAKES", table_def_container)
        .addTable(snakes_table_def, SnakesProviderFactory(), SnakesViewPortDefFactory())
        .addTable(location_table_def, LocationProviderFactory())
        .addJoinTable(SnakeLocationsJoinFactory())
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
    sample_snakes = _generate_snakes(SNAKE_COUNT)
    for snake in sample_snakes:
        snakes_provider.tick(snake["id"], snake)

    # Location: one row per sample snake, ticked in now for the starting positions and then
    # re-ticked once a second for as long as the process runs, simulating movement. A plain
    # Python daemon thread is enough here - it just calls .tick(...) on a Python object on a
    # timer, which needs no JPype proxying (unlike TickingProvider/the factories above, which
    # proxy actual JVM interfaces) and dies with the process on Ctrl-C/SIGTERM like any other
    # daemon thread.
    location_provider = server.providerContainer().getProviderForTable("Location").get()

    BOUNDS = 100.0  # coordinate space is a 100x100 square
    STEP = 2.0  # max distance a snake moves per tick, in either axis

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
        # A fixed 1s sleep between calls, not "every 1s" - tick_locations() itself is
        # SNAKE_COUNT individual JPype .tick() calls, so each cycle (sleep + tick) takes 1s
        # plus however long those calls take, rather than a clean 1Hz. Measured at ~0.4-0.5s
        # for the default 10,000 rows, so the actual cadence is closer to ~1.5s than 1s.
        while True:
            time.sleep(1)
            tick_locations()

    threading.Thread(target=location_loop, name="location-ticker", daemon=True).start()

    host = _local_hostname()
    print(
        f"[VUU] Ready — wss://{host}:{WS_PORT}/websocket  https://{host}:{HTTPS_PORT}"
        f"  (ticked {len(sample_snakes)} rows into Snakes, {len(positions)} rows into Location)",
        flush=True,
    )

    server.join()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
