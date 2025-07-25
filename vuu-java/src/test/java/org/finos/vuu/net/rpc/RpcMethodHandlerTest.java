package org.finos.vuu.net.rpc;

import org.assertj.core.api.Assertions;
import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.LoginRequest;
import org.finos.vuu.net.RpcCall;
import org.finos.vuu.net.RpcResponse;
import org.finos.vuu.net.ViewServerMessage;
import org.finos.vuu.provider.VuuJoinTableProvider;
import org.finos.vuu.util.ScalaCollectionConverter;
import org.junit.Test;
import scala.Option;
import test.helper.ViewPortTestUtils;

import java.util.Collections;

import static test.helper.ViewPortTestUtils.createRandomViewServerMessage;

public class RpcMethodHandlerTest {

    @Test
    public void should_register_java_function_as_rpc_in_default_handler() {
        final TestRpcService rpcService = new TestRpcService();

        Clock clock = new DefaultClock();
        LifecycleContainer lifecycleContainer = new LifecycleContainer(clock);
        MetricsProvider metricsProvider = new MetricsProviderImpl();
        TableContainer tableContainer = new TableContainer(new VuuJoinTableProvider(clock, lifecycleContainer, metricsProvider), metricsProvider, clock);
        final DefaultRpcHandler defaultRpcHandler = new DefaultRpcHandler(tableContainer);
        defaultRpcHandler.registerRpc("helloWorld", rpcService::rpcFunction);

        RpcCall call = new RpcCall("service", "helloWorld", new Object[]{}, ScalaCollectionConverter.toScala(Collections.emptyMap()));
        Option<ViewServerMessage> response = defaultRpcHandler.processRpcCall(createRandomViewServerMessage(new LoginRequest("token", "user")), call, ViewPortTestUtils.requestContext());

        Assertions.assertThat(response.get().body())
                .isExactlyInstanceOf(RpcResponse.class)
                .isEqualTo(new RpcResponse("helloWorld", "It Works", null));
    }

    static class TestRpcService {
        RpcFunctionResult rpcFunction(RpcParams params) {
            return new RpcFunctionSuccess("It Works");
        }
    }
}
