package org.finos.vuu;

import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.net.Aggregations;
import org.finos.vuu.net.CreateViewPortRequest;
import org.finos.vuu.net.CreateViewPortSuccess;
import org.finos.vuu.net.RpcRequest;
import org.finos.vuu.net.RpcResponseNew;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.net.rpc.RpcErrorResult;
import org.finos.vuu.net.rpc.RpcNames;
import org.finos.vuu.net.rpc.RpcSuccessResult;
import org.finos.vuu.net.rpc.ViewPortContext;
import org.finos.vuu.net.ui.NoneAction$;
import org.finos.vuu.net.ui.NotificationType;
import org.finos.vuu.net.ui.ShowNotificationAction;
import org.finos.vuu.viewport.ViewPortRange;
import org.finos.vuu.viewport.ViewPortTable;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.finos.vuu.util.ScalaCollectionConverter.emptyList;
import static org.finos.vuu.util.ScalaCollectionConverter.toJava;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

public class PersonRpcHandlerWSApiTest extends WebSocketApiJavaTestBase {

    private final String tableName = "PersonManualMapped";
    private final String[] columnNames = new String[]{"id", "name", "account"};
    private final String moduleName = JavaExampleModule.NAME;

    @Test
    public void type_ahead_request_for_a_column() {

        var viewPortId = createViewPort();

        var typeAheadRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                RpcNames.UniqueFieldValuesRpc(),
                toScala(Map.of(
                        "column", "name"
                ))
        );

        var requestId = vuuClient.send(sessionId, typeAheadRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Typeahead Request response");
        assertEquals("getUniqueFieldValues", responseBody.rpcName());

        assertInstanceOf(RpcSuccessResult.class, responseBody.result(), "Response contains Successful result");
        var result = (RpcSuccessResult) responseBody.result();
        var data = toJava((scala.collection.immutable.List<?>) result.data());
        assertEquals(List.of("Adam", "Natalie"), data);

        assertEquals(NoneAction$.MODULE$, responseBody.action(), "Response contains no action");
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

        assertInstanceOf(RpcSuccessResult.class, responseBody.result(), "Response contains Successful result");
        var result = (RpcSuccessResult) responseBody.result();
        assertEquals(56440, result.data());

        assertEquals(NoneAction$.MODULE$, responseBody.action(), "Response contains no action");
    }

    @Test
    public void custom_rpc_request_updateName() {
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "UpdateName",
                toScala(Map.of(
                        "id", "uniqueId1",
                        "name", "Chris"
                ))
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "UpdateName Request response");
        assertEquals("UpdateName", responseBody.rpcName());

        assertInstanceOf(RpcSuccessResult.class, responseBody.result(), "Response contains Successful result");
        assertEquals(NoneAction$.MODULE$, responseBody.action(), "Response contains no action");
    }

    @Test
    public void custom_rpc_request_deleteRow() {
        // test rpc registered in UpdateRecordRpcHandler (EditTableRpcHandler) works
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "deleteRow",
                toScala(Map.of())
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Request response");
        assertEquals("deleteRow", responseBody.rpcName());
        assertInstanceOf(RpcErrorResult.class, responseBody.result()); // default implementation in EditSessionRpcHandler
    }

    @Test
    public void custom_rpc_request_closeForm() {
        // test rpc registered in UpdateRecordRpcHandler (EditTableRpcHandler) works
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "closeForm",
                toScala(Map.of())
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Request response");
        assertEquals("closeForm", responseBody.rpcName());
        assertInstanceOf(RpcSuccessResult.class, responseBody.result());
    }

    @Test
    public void custom_rpc_request_endEditSession() {
        // test rpc registered in UpdateRecordRpcHandler (EndEditSessionRpcHandler) works
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "endEditSession",
                toScala(Map.of())
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Request response");
        assertEquals("endEditSession", responseBody.rpcName());
        assertInstanceOf(RpcSuccessResult.class, responseBody.result());
    }

    @Test
    public void custom_rpc_request_getUniqueFieldValues() {
        // test rpc registered in UpdateRecordRpcHandler (DefaultRpcHandler) works
        var viewPortId = createViewPort();

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "getUniqueFieldValues",
                toScala(Map.of("column", "id"))
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Request response");
        assertEquals("getUniqueFieldValues", responseBody.rpcName());
        assertInstanceOf(RpcSuccessResult.class, responseBody.result());
    }

    @Test
    public void table2_custom_rpc_request_createSessionTable() {
        // test rpc registered in EditPersonRecordRpcHandler (CreateSessionTableRpcHandlerImpl) works
        var viewPortId = createViewPort("PersonManualMapped2");

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "createSessionTable",
                toScala(Map.of("sessionType", "export"))
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Request response");
        assertEquals("createSessionTable", responseBody.rpcName());
        assertInstanceOf(RpcSuccessResult.class, responseBody.result());
    }

    @Test
    public void table2_custom_rpc_request_getUniqueFieldValues() {
        // test rpc registered in EditPersonRecordRpcHandler (DefaultRpcHandler) works
        var viewPortId = createViewPort("PersonManualMapped2");

        var rpcRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                "getUniqueFieldValues",
                toScala(Map.of("column", "id"))
        );

        var requestId = vuuClient.send(sessionId, rpcRequest);
        var response = vuuClient.awaitForResponse(requestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(response, "Request response");
        assertEquals("getUniqueFieldValues", responseBody.rpcName());
        assertInstanceOf(RpcSuccessResult.class, responseBody.result());
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

        assertInstanceOf(RpcErrorResult.class, responseBody.result(), "Response contains error result");
        var result = (RpcErrorResult) responseBody.result();
        assertEquals("Could not find rpcMethodHandler DoesNotExist", result.errorMessage());

        assertInstanceOf(ShowNotificationAction.class, responseBody.action(), "Response contains show notification action");
        var action = (ShowNotificationAction) responseBody.action();
        assertEquals(NotificationType.ERROR(), action.notificationType());
        assertEquals("Failed to process DoesNotExist request", action.title());
        assertEquals("Could not find rpcMethodHandler DoesNotExist", action.message());

    }

    private String createViewPort() {
        return createViewPort(tableName);
    }

    private String createViewPort(String tableName) {
        var createViewPortRequest = new CreateViewPortRequest(
                new ViewPortTable(tableName, moduleName),
                new ViewPortRange(1, 100),
                columnNames,
                new SortSpec(emptyList()),
                new String[0],
                null,
                new Aggregations[0]
        );

        var viewPortRequestId = vuuClient.send(sessionId, createViewPortRequest);
        var viewPortCreateResponse = vuuClient.awaitForResponse(viewPortRequestId);

        CreateViewPortSuccess responseBody = assertBodyIsInstanceOf(viewPortCreateResponse, "View port create response");
        var viewportId = responseBody.viewPortId();

        waitForData(viewportId, 1);
        return viewportId;
    }

    @Override
    public ViewServerModule defineModuleWithTestTables() {
        return new JavaExampleModule().create(new TableDefContainer(), new DefaultClock());
    }

}
