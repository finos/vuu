package org.finos.vuu;

import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.net.*;
import org.finos.vuu.net.rpc.RpcNames;
import org.finos.vuu.viewport.ViewPortRange;
import org.finos.vuu.viewport.ViewPortTable;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Map;

import static org.finos.vuu.util.ScalaCollectionConverter.toJava;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class PersonRpcHandlerWSApiTest extends WebSocketApiJavaTestBase {

    private final String tableName = "PersonManualMapped";
    private final String[] columnNames = new String[]{"Id", "Name", "Account"};
    private final String moduleName = JavaExampleModule.NAME;

    @Test
    public void type_ahead_request_for_a_column() {

        var viewPortId = createViewPort();

        var typeAheadRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                RpcNames.UniqueFieldValuesRpc(),
                toScala(Map.of(
                        "table", tableName,
                        "module", moduleName,
                        "column", "Name"
                ))
        );

        var requestId = vuuClient.send(sessionId, typeAheadRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Typeahead Request response");
        assertEquals("getUniqueFieldValues", responseBody.rpcName());

        assertTrue(responseBody.result() instanceof RpcSuccessResult, "Response contains Successful result");
        var result = (RpcSuccessResult) responseBody.result();
        var data = toJava((scala.collection.immutable.List<String>) result.data());
        assertEquals(List.of("Adam", "Natalie"), data);

        assertTrue(responseBody.action() instanceof NoneAction, "Response contains no action");
    }

    @Test
    public void custom_rpc_request_getAccountId() {
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "GetAccountId",
                toScala(Map.of(
                        "rowKey", "uniqueId1"
                ))
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "GetAccountId Request response");
        assertEquals("GetAccountId", responseBody.rpcName());

        assertTrue(responseBody.result() instanceof RpcSuccessResult, "Response contains Successful result");
        var result = (RpcSuccessResult) responseBody.result();
        assertEquals(56440, result.data());

        assertTrue(responseBody.action() instanceof NoneAction, "Response contains no action");
    }

    @Test
    public void custom_rpc_request_updateName() {
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "UpdateName",
                toScala(Map.of(
                        "Id", "uniqueId1",
                        "Name", "Chris"
                ))
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "UpdateName Request response");
        assertEquals("UpdateName", responseBody.rpcName());

        assertTrue(responseBody.result() instanceof RpcSuccessResult, "Response contains Successful result");
        assertTrue(responseBody.action() instanceof NoneAction, "Response contains no action");
    }


    @Test
    public void custom_rpc_request_that_does_not_exist() {
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "DoesNotExist",
                null
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "DoesNotExist Request response");
        assertEquals("DoesNotExist", responseBody.rpcName());

        assertTrue(responseBody.result() instanceof RpcErrorResult, "Response contains error result");
        var result = (RpcErrorResult) responseBody.result();
        assertEquals("Could not find rpcMethodHandler DoesNotExist", result.errorMessage());

        assertTrue(responseBody.action() instanceof ShowNotificationAction, "Response contains show notification action");
        var action = (ShowNotificationAction) responseBody.action();
        assertEquals("Error", action.notificationType());
        assertEquals("Failed to process DoesNotExist request", action.title());
        assertEquals("Could not find rpcMethodHandler DoesNotExist", action.message());

    }

    private String createViewPort() {
        var createViewPortRequest = new CreateViewPortRequest(
                new ViewPortTable(tableName, moduleName),
                new ViewPortRange(1, 100),
                columnNames,
                new SortSpec(toScala(List.of())),
                new String[0],
                null,
                new Aggregations[0]
        );

        var viewPortRequestId = vuuClient.send(sessionId, createViewPortRequest);
        var viewPortCreateResponse = vuuClient.awaitForResponse(viewPortRequestId);

        CreateViewPortSuccess responseBody = assertBodyIsInstanceOf(viewPortCreateResponse, "View port create response");
        var viewportId =  responseBody.viewPortId();
        waitForData(1);
        return viewportId;
    }

    @Override
    public ViewServerModule defineModuleWithTestTables() {
        return new JavaExampleModule().create(new TableDefContainer(), new DefaultClock());
    }

}
