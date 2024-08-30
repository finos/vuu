package org.finos.vuu;

import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.net.*;
import org.finos.vuu.viewport.ViewPortRange;
import org.finos.vuu.viewport.ViewPortTable;
import org.junit.Assert;
import org.junit.Test;
import scala.jdk.javaapi.OptionConverters;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.Assert.assertEquals;

//@RunWith(Enclosed.class)
public class PersonRpcHandlerJavaWSApiTest extends WebSocketApiJavaTestBase {

    private final String tableName = "PersonManualMapped";
    private final String moduleName = JavaExampleModule.NAME;

    @Test
    public void type_ahead_requested_for_a_column() {
        var createViewPortRequest = new CreateViewPortRequest(
                new ViewPortTable(tableName, moduleName),
                new ViewPortRange(1, 100),
                new String [] {"Id", "Name"},
                new SortSpec(toScala(List.of())),
                new String[0],
                null,
                new Aggregations[0]
        );
        var requestId =  vuuClient.send(sessionId, tokenId, createViewPortRequest);
        var viewPortCreateResponse = vuuClient.awaitForResponse(requestId);

        var viewPortCreateResponse2 = OptionConverters.toJava(viewPortCreateResponse);
        Assert.assertTrue("view port creation request returns response successfully", viewPortCreateResponse2.isPresent());
        CreateViewPortSuccess responseBody = ((CreateViewPortSuccess) viewPortCreateResponse2.get().body());
        //todo assert type before casting
        //CreateViewPortSuccess responseBody = assertBodyIsInstanceOf(viewPortCreateResponse);
        //RpcResponseNew responseBody = assertBodyIsInstanceOf(viewPortCreateResponse);
        var viewPortId = responseBody.viewPortId();

        //todo type ahead request
    }

    @Override
    public ViewServerModule defineModuleWithTestTables() {
        return new JavaExampleModule().create(new TableDefContainer(), new DefaultClock());
    }
}
