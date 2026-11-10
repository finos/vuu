package org.finos.vuu.spreadsheet.vuu;

import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.feature.inmem.VuuInMemPlugin;
import org.finos.vuu.net.Aggregations;
import org.finos.vuu.net.CreateViewPortRequest;
import org.finos.vuu.net.CreateViewPortSuccess;
import org.finos.vuu.net.MessageBody;
import org.finos.vuu.net.RpcRequest;
import org.finos.vuu.net.RpcResponseNew;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.net.TableRowUpdates;
import org.finos.vuu.net.ViewServerMessage;
import org.finos.vuu.net.row.RowUpdate;
import org.finos.vuu.net.row.RowUpdateType;
import org.finos.vuu.net.row.RowUpdateType$;
import org.finos.vuu.net.rpc.RpcErrorResult;
import org.finos.vuu.net.rpc.RpcSuccessResult;
import org.finos.vuu.net.rpc.ViewPortContext;
import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.viewport.ViewPortRange;
import org.finos.vuu.viewport.ViewPortTable;
import org.finos.vuu.wsapi.helpers.TestStartUp;
import org.finos.vuu.wsapi.helpers.TestVuuClient;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import scala.jdk.javaapi.OptionConverters;
import scala.reflect.ClassTag;

import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.finos.vuu.util.ScalaCollectionConverter.emptyList;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Drives the spreadsheet through a real websocket, as the UI would: {@code editCell} RPCs in,
 * viewport row updates out.
 * <p>
 * {@link TestVuuClient#awaitForResponse} stashes other messages by request id, which would lose
 * row updates that arrive while waiting for an RPC response. So this test reads every message itself
 * and keeps its own copy of each viewport's rows.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SpreadsheetWebSocketTest {

    private static final List<String> SHEET_COLUMNS = List.of("row", "A", "B", "C", "D", "E");
    private static final List<String> CELLS_COLUMNS = List.of("cellRef", "input", "value", "valueType", "precedents", "dependents");
    private static final Duration AWAIT = Duration.ofSeconds(10);

    private final Clock clock = new DefaultClock();
    private final LifecycleContainer lifecycle = new LifecycleContainer(clock);
    private final TableDefContainer tableDefContainer = new TableDefContainer();
    private final SpreadsheetModule module = new SpreadsheetModule();

    private TestVuuClient vuuClient;
    private String sessionId;

    /** viewPortId -> column names in the order the viewport sends them */
    private final Map<String, List<String>> viewPortColumns = new HashMap<>();
    /** viewPortId -> rowKey -> latest row data */
    private final Map<String, Map<String, Object[]>> viewPortRows = new HashMap<>();

    @BeforeAll
    void setUp() {
        vuuClient = new TestStartUp(this::defineModule, VuuInMemPlugin::new, clock, lifecycle, tableDefContainer)
                .startServerAndClient()._1;
        sessionId = OptionConverters.toJava(vuuClient.login("testUser")).orElseThrow();
    }

    @AfterAll
    void tearDown() {
        lifecycle.stop();
        module.engine().close();
    }

    private ViewServerModule defineModule() {
        return module.create(tableDefContainer, clock, new SpreadsheetConfig(10, 5, Duration.ofSeconds(5)));
    }

    @Test
    void formulasTypedIntoTheGridRecalculateDownstreamCells() {
        String sheet = createViewPort(SpreadsheetModule.SHEET_TABLE, SHEET_COLUMNS);
        String cells = createViewPort(SpreadsheetModule.SHEET_CELLS_TABLE, CELLS_COLUMNS);
        awaitCell(sheet, "10", "A", ""); // the whole empty grid is seeded

        assertSuccess(editCell(sheet, "1", "A", "1"));
        assertSuccess(editCell(sheet, "1", "C", "2"));
        assertSuccess(editCell(sheet, "2", "B", "=SUM(A1+C1)"));
        awaitCell(sheet, "2", "B", "3");

        // Changing a precedent pushes the new value of its dependent to the grid
        assertSuccess(editCell(sheet, "1", "A", "10"));
        awaitCell(sheet, "1", "A", "10");
        awaitCell(sheet, "2", "B", "12");

        // The dependency view shows the formula and its edges
        awaitCell(cells, "B2", "value", "12");
        assertEquals("=SUM(A1+C1)", cell(cells, "B2", "input"));
        assertEquals("A1,C1", cell(cells, "B2", "precedents"));
        assertEquals("B2", cell(cells, "A1", "dependents"));

        // A circular reference is rejected on the RPC and leaves the cell alone
        assertError("Circular reference: A1 -> B2 -> A1", editCell(sheet, "1", "A", "=B2"));
        assertEquals("10", module.engine().inputOf(CellRef.parse("A1")).orElseThrow());
        assertEquals("10", cell(sheet, "1", "A"));

        // Evaluation errors are values, not failures
        assertSuccess(editCell(sheet, "3", "A", "=1/0"));
        awaitCell(sheet, "3", "A", "#DIV/0!");
        awaitCell(cells, "A3", "valueType", "ERROR");

        // Syntax errors are rejected with a position
        assertError("Unexpected end of formula at position 5", editCell(sheet, "3", "A", "=SUM("));
        assertEquals("=1/0", module.engine().inputOf(CellRef.parse("A3")).orElseThrow());

        // Clearing a cell removes it from SheetCells and recalculates its dependents
        assertSuccess(editCell(sheet, "1", "C", ""));
        awaitCell(sheet, "2", "B", "10");
        awaitCell(sheet, "1", "C", "");
    }

    @Test
    void editsOutsideTheSheetAreRejected() {
        String sheet = createViewPort(SpreadsheetModule.SHEET_TABLE, SHEET_COLUMNS);
        assertError("'row' is not an editable column", editCell(sheet, "1", "row", "5"));
        assertError("Cell A11 is outside the sheet (A1:E10)", editCell(sheet, "11", "A", "5"));
        assertError("Cell F1 is outside the sheet at position 1", editCell(sheet, "1", "A", "=F1"));
    }

    @Test
    void unsupportedTableEditsFail() {
        String sheet = createViewPort(SpreadsheetModule.SHEET_TABLE, SHEET_COLUMNS);
        assertError("Not supported by spreadsheet", rpc(sheet, "addRow", Map.of()));
        assertError("Not supported by spreadsheet", rpc(sheet, "deleteRow", Map.of("key", "1")));
    }

    // ---- protocol helpers ------------------------------------------------------------------------

    private RpcResponseNew editCell(String viewPortId, String key, String column, String data) {
        return rpc(viewPortId, "editCell", Map.of("key", key, "column", column, "data", data));
    }

    private RpcResponseNew rpc(String viewPortId, String name, Map<String, Object> params) {
        String requestId = vuuClient.send(sessionId, new RpcRequest(new ViewPortContext(viewPortId), name, toScala(params)));
        return (RpcResponseNew) awaitResponse(requestId).body();
    }

    private String createViewPort(String table, List<String> columns) {
        String requestId = vuuClient.send(sessionId, new CreateViewPortRequest(
                new ViewPortTable(table, SpreadsheetModule.NAME),
                new ViewPortRange(0, 100),
                columns.toArray(new String[0]),
                new SortSpec(emptyList()),
                new String[0],
                null,
                new Aggregations[0]));
        CreateViewPortSuccess success = assertInstanceOf(CreateViewPortSuccess.class, awaitResponse(requestId).body());
        viewPortColumns.put(success.viewPortId(), columns);
        return success.viewPortId();
    }

    private ViewServerMessage awaitResponse(String requestId) {
        long deadline = System.nanoTime() + AWAIT.toNanos();
        while (System.nanoTime() < deadline) {
            ViewServerMessage msg = nextMessage();
            if (requestId.equals(msg.requestId())) return msg;
        }
        return fail("No response to " + requestId);
    }

    /** Reads messages, applying row updates, until the viewport shows {@code expected} in the cell. */
    private void awaitCell(String viewPortId, String rowKey, String column, String expected) {
        long deadline = System.nanoTime() + AWAIT.toNanos();
        while (!expected.equals(cell(viewPortId, rowKey, column))) {
            if (System.nanoTime() > deadline) {
                fail(viewPortId + " " + rowKey + "/" + column + " expected <" + expected + "> but was <" + cell(viewPortId, rowKey, column) + ">");
            }
            nextMessage();
        }
    }

    private Object cell(String viewPortId, String rowKey, String column) {
        Object[] row = viewPortRows.getOrDefault(viewPortId, Map.of()).get(rowKey);
        return row == null ? null : row[viewPortColumns.get(viewPortId).indexOf(column)];
    }

    private ViewServerMessage nextMessage() {
        ViewServerMessage msg = OptionConverters.toJava(vuuClient.awaitForMsg(ClassTag.apply(MessageBody.class)))
                .orElseThrow(() -> new AssertionError("Connection closed"));
        if (msg.body() instanceof TableRowUpdates updates) {
            Arrays.stream(updates.rows())
                    .filter(u -> u.updateType().equals(RowUpdateType$.MODULE$.UPDATE()))
                    .forEach(this::applyRowUpdate);
        }
        return msg;
    }

    private void applyRowUpdate(RowUpdate update) {
        viewPortRows.computeIfAbsent(update.viewPortId(), k -> new HashMap<>()).put(update.rowKey(), update.data());
    }

    private static void assertSuccess(RpcResponseNew response) {
        assertInstanceOf(RpcSuccessResult.class, response.result(), () -> response.rpcName() + " failed: " + response.result());
    }

    private static void assertError(String message, RpcResponseNew response) {
        RpcErrorResult error = assertInstanceOf(RpcErrorResult.class, response.result(), () -> response.rpcName() + " unexpectedly succeeded");
        assertTrue(error.errorMessage().contains(message), () -> "expected <" + message + "> in <" + error.errorMessage() + ">");
    }
}
