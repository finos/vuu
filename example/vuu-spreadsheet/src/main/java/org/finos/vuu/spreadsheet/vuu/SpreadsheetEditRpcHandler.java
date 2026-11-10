package org.finos.vuu.spreadsheet.vuu;

import org.finos.vuu.net.RequestContext;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcFunctionFailure;
import org.finos.vuu.net.rpc.RpcFunctionResult;
import org.finos.vuu.net.rpc.RpcFunctionSuccess;
import org.finos.vuu.net.rpc.RpcParams;
import org.finos.vuu.net.rpc.sessiontable.EditTableRpcHandler;
import org.finos.vuu.spreadsheet.engine.CalculationEngine;
import org.finos.vuu.spreadsheet.engine.CellChange;
import org.finos.vuu.spreadsheet.engine.CellFormatter;
import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.CellValue;
import org.finos.vuu.spreadsheet.engine.EditAccepted;
import org.finos.vuu.spreadsheet.engine.RecalcResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import static org.finos.vuu.util.ScalaCollectionConverter.toJava;

/**
 * Routes edits on the {@code Sheet} table into the {@link CalculationEngine}.
 * <p>
 * The handler waits only for the engine to accept or reject the edit (parse errors and circular
 * references come back as {@link RpcFunctionFailure}). The new values reach the table later, when
 * the engine's recalculation completes and {@link SheetProvider} publishes them. The handler never
 * writes to the table itself, so a cell never shows a formula in place of its value.
 * <p>
 * Every call is logged at INFO: what was received and from whom, whether the engine accepted it, and
 * (once recalculation finishes, on the engine's calc thread) which cells changed value as a result.
 * Log lines for one call share a {@code "<rpcName> <requestId>"} prefix so they can be grepped together.
 */
public class SpreadsheetEditRpcHandler extends DefaultRpcHandlerImpl implements EditTableRpcHandler {

    private static final Logger logger = LoggerFactory.getLogger(SpreadsheetEditRpcHandler.class);

    private static final String NOT_SUPPORTED = "Not supported by spreadsheet";

    private final CalculationEngine engine;
    private final Duration editTimeout;

    public SpreadsheetEditRpcHandler(CalculationEngine engine, Duration editTimeout) {
        this.engine = engine;
        this.editTimeout = editTimeout;
        registerEditTableRpcs();
    }

    @Override
    public RpcFunctionResult editCell(RpcParams params) {
        Call call = Call.received("editCell", params);
        Map<String, Object> named = toJava(params.namedParams());
        Object data = named.get("data");
        logger.info("{} received from {}: key={} column={} data={}",
                call, call.caller(), named.get("key"), named.get("column"), quote(asInput(data)));
        try {
            CellRef cell = cellRef(named.get("key"), named.get("column"));
            String input = asInput(data);
            return await(call, cell + " <- " + quote(input), engine.submitEdit(cell, input));
        } catch (IllegalArgumentException e) {
            return reject(call, e.getMessage());
        }
    }

    /** All cells in the row are applied as one atomic edit with a single recalculation. */
    @Override
    @SuppressWarnings("unchecked")
    public RpcFunctionResult editRow(RpcParams params) {
        Call call = Call.received("editRow", params);
        Map<String, Object> named = toJava(params.namedParams());
        Object key = named.get("key");
        logger.info("{} received from {}: key={} data={}", call, call.caller(), key, named.get("data"));
        try {
            Map<String, Object> data = toJava((scala.collection.immutable.Map<String, Object>) named.get("data"));
            Map<CellRef, String> edits = new TreeMap<>();
            data.forEach((column, value) -> {
                if (!column.equals(SpreadsheetModule.ROW_COLUMN)) {
                    edits.put(cellRef(key, column), asInput(value));
                }
            });
            String description = edits.entrySet().stream()
                    .map(e -> e.getKey() + " <- " + quote(e.getValue()))
                    .collect(Collectors.joining(", "));
            return await(call, description, engine.submitEdits(edits));
        } catch (IllegalArgumentException | ClassCastException e) {
            return reject(call, e.getMessage());
        }
    }

    @Override
    public RpcFunctionResult deleteCell(RpcParams params) {
        Call call = Call.received("deleteCell", params);
        Map<String, Object> named = toJava(params.namedParams());
        logger.info("{} received from {}: key={} column={}", call, call.caller(), named.get("key"), named.get("column"));
        try {
            CellRef cell = cellRef(named.get("key"), named.get("column"));
            return await(call, cell + " <- " + quote(null), engine.submitEdit(cell, null));
        } catch (IllegalArgumentException e) {
            return reject(call, e.getMessage());
        }
    }

    @Override
    public RpcFunctionResult deleteRow(RpcParams params) {
        return notSupported("deleteRow", params);
    }

    @Override
    public RpcFunctionResult deleteSelectedRows(RpcParams params) {
        return notSupported("deleteSelectedRows", params);
    }

    @Override
    public RpcFunctionResult addRow(RpcParams params) {
        return notSupported("addRow", params);
    }

    @Override
    public RpcFunctionResult submitForm(RpcParams params) {
        return notSupported("submitForm", params);
    }

    @Override
    public RpcFunctionResult closeForm(RpcParams params) {
        return notSupported("closeForm", params);
    }

    @Override
    public RpcFunctionResult undoRowChange(RpcParams params) {
        return notSupported("undoRowChange", params);
    }

    private RpcFunctionResult notSupported(String rpcName, RpcParams params) {
        Call call = Call.received(rpcName, params);
        logger.info("{} received from {}: params={}", call, call.caller(), toJava(params.namedParams()));
        return reject(call, NOT_SUPPORTED);
    }

    private RpcFunctionResult await(Call call, String description, CompletableFuture<EditAccepted> edit) {
        try {
            EditAccepted accepted = edit.get(editTimeout.toMillis(), TimeUnit.MILLISECONDS);
            logAccepted(call, description, accepted);
            return new RpcFunctionSuccess();
        } catch (ExecutionException e) {
            return reject(call, e.getCause().getMessage());
        } catch (TimeoutException e) {
            // The edit is still queued and may yet be applied; keep logging what happens to it.
            logger.warn("{} timed out after {}ms waiting for the calculation engine: {} may still be applied",
                    call, editTimeout.toMillis(), description);
            edit.whenComplete((accepted, error) -> {
                if (error != null) logger.info("{} rejected after timing out: {}", call, error.getMessage());
                else logAccepted(call, description, accepted);
            });
            return new RpcFunctionFailure("Timed out waiting for the calculation engine");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("{} interrupted while waiting for the calculation engine: {}", call, description);
            return new RpcFunctionFailure("Interrupted");
        }
    }

    private static void logAccepted(Call call, String description, EditAccepted accepted) {
        if (!accepted.changed()) {
            logger.info("{} no change: {} is what the sheet already holds", call, description);
            return;
        }
        logger.info("{} accepted as edit #{}: {}", call, accepted.seq(), description);
        accepted.recalculated().whenComplete((result, error) -> {
            if (error != null) logger.error("{} edit #{} failed to recalculate", call, accepted.seq(), error);
            else logEffect(call, result);
        });
    }

    /** Runs on the engine's calc thread once the tables have been updated. */
    private static void logEffect(Call call, RecalcResult result) {
        String valueChanges = result.changes().stream()
                .filter(CellChange::valueChanged)
                .map(c -> c.ref() + ": " + display(c.previousValue()) + " -> " + display(c.value()))
                .collect(Collectors.joining(", "));
        String edgeOnly = result.changes().stream()
                .filter(c -> !c.valueChanged())
                .map(c -> c.ref().toString())
                .collect(Collectors.joining(", "));
        logger.info("{} edit #{} recalculated: {}{}",
                call,
                result.seq(),
                valueChanges.isEmpty() ? "no values changed" : valueChanges,
                edgeOnly.isEmpty() ? "" : "; value unchanged but input or dependencies updated for " + edgeOnly);
    }

    private static RpcFunctionResult reject(Call call, String reason) {
        logger.info("{} rejected: {}", call, reason);
        return new RpcFunctionFailure(reason);
    }

    /** The row key is the row number; the column name is the column letter. */
    private CellRef cellRef(Object key, Object column) {
        if (!(key instanceof String rowKey) || !(column instanceof String columnName)) {
            throw new IllegalArgumentException("Expected string 'key' and 'column' params");
        }
        int row;
        try {
            row = Integer.parseInt(rowKey);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Unknown row '" + rowKey + "'");
        }
        // Only the single-letter cell columns are editable; "row" must not be read as the cell ROW1
        if (!columnName.matches("[A-Z]")) {
            throw new IllegalArgumentException("'" + columnName + "' is not an editable column");
        }
        CellRef cell = new CellRef(CellRef.columnIndex(columnName), row);
        engine.bounds().check(cell);
        return cell;
    }

    /** Cells are String columns, but tolerate other types in case a client sends a number. */
    private static String asInput(Object data) {
        return data == null ? null : data.toString();
    }

    private static String quote(String input) {
        return input == null || input.isEmpty() ? "<clear>" : "\"" + input + "\"";
    }

    private static String display(CellValue value) {
        return value instanceof CellValue.EmptyValue ? "<empty>" : CellFormatter.format(value);
    }

    /** Identifies one RPC call in the log. */
    private record Call(String rpcName, String requestId, String caller) {

        static Call received(String rpcName, RpcParams params) {
            RequestContext ctx = params.ctx();
            if (ctx == null) return new Call(rpcName, "-", "unknown caller");
            String viewPort = params.viewPort() == null ? "-" : params.viewPort().id();
            return new Call(rpcName, ctx.requestId(),
                    "user=" + ctx.user().name() + " session=" + ctx.session().sessionId() + " viewport=" + viewPort);
        }

        @Override
        public String toString() {
            return rpcName + " " + requestId;
        }
    }
}
