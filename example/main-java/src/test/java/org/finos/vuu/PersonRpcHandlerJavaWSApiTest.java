package org.finos.vuu;

import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.net.*;
import org.finos.vuu.viewport.ViewPortRange;
import org.finos.vuu.viewport.ViewPortTable;
import org.junit.Test;
import scala.Option;
import scala.jdk.javaapi.OptionConverters;

import java.util.List;
import java.util.Map;

import static org.finos.vuu.util.ScalaCollectionConverter.toJava;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

//@RunWith(Enclosed.class)
public class PersonRpcHandlerJavaWSApiTest extends WebSocketApiJavaTestBase {

    private final String tableName = "PersonManualMapped";
    private final String[] columnNames =  new String[]{"Id", "Name", "Account"};
    private final String moduleName = JavaExampleModule.NAME;

    @Test
    public void type_ahead_requested_for_a_column() {
        var viewPortId = createViewPort();

        var columnName = "Name";
        var typeAheadRequest = new RpcRequest(
                new ViewPortContext(viewPortId),
                RpcNames.UniqueFieldValuesRpc(),
                toScala(Map.of(
                        "table", tableName,
                        "module", moduleName,
                        "column", columnName
                ))
        );

        var typeAheadRequestId = vuuClient.send(sessionId, tokenId, typeAheadRequest);
        var typeAheadResponse = vuuClient.awaitForResponse(typeAheadRequestId);

        RpcResponseNew responseBody = assertBodyIsInstanceOf(typeAheadResponse, "Typeahead Request response");
        assertEquals("getUniqueFieldValues", responseBody.rpcName());

        assertTrue("Response contains Successful result", responseBody.result() instanceof RpcSuccessResult);
        RpcSuccessResult result = (RpcSuccessResult) responseBody.result();

        var data =  toJava((scala.collection.immutable.List<String>) result.data());
        assertEquals(List.of("Adam", "Natalie"), data);
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

        var viewPortRequestId = vuuClient.send(sessionId, tokenId, createViewPortRequest);
        var viewPortCreateResponse = vuuClient.awaitForResponse(viewPortRequestId);

        CreateViewPortSuccess responseBody = assertBodyIsInstanceOf(viewPortCreateResponse, "View port create response");
        return responseBody.viewPortId();
    }

    private <BodyType> BodyType assertBodyIsInstanceOf(Option<ViewServerMessage> message, String messageDescription) {
        var messageOptional = OptionConverters.toJava(message);
        assertTrue(messageDescription + " is present", messageOptional.isPresent());
        return ((BodyType) messageOptional.get().body());
    }

    @Override
    public ViewServerModule defineModuleWithTestTables() {
        return new JavaExampleModule().create(new TableDefContainer(), new DefaultClock());
    }
}
