package org.finos.vuu.net.rpc;

import org.assertj.core.api.Assertions;
import org.finos.vuu.net.LoginRequest;
import org.finos.vuu.net.RpcCall;
import org.finos.vuu.net.RpcResponse;
import org.finos.vuu.net.ViewServerMessage;
import org.finos.vuu.util.ScalaCollectionConverter;
import org.junit.Test;
import scala.Option;
import test.helper.ViewPortTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static test.helper.ViewPortTestUtils.createRandomViewServerMessage;

public class RpcMethodHandlerTest {

    @Test
    public void should_wrap_and_call_java_function_in_method_handler() {
        final TestRpcService rpcService = new TestRpcService();

        final RpcMethodCallResult result = rpcService.rpcFunction(new RpcParams(new Object[]{}, ScalaCollectionConverter.toScala(Collections.emptyMap()), null));

        assertThat(result)
                .isNotNull()
                .isExactlyInstanceOf(RpcMethodSuccess.class)
                .extracting("result").isEqualTo("It Works");
    }

    @Test
    public void should_register_java_function_as_rpc_in_default_handler() {
        final TestRpcService rpcService = new TestRpcService();

        final DefaultRpcHandler defaultRpcHandler = new DefaultRpcHandler();
        defaultRpcHandler.registerRpc("helloWorld", rpcService::rpcFunction);

        RpcCall call = new RpcCall("service", "helloWorld", new Object[]{}, ScalaCollectionConverter.toScala(Collections.emptyMap()));
        Option<ViewServerMessage> response = defaultRpcHandler.processRpcCall(createRandomViewServerMessage(new LoginRequest("token", "user")), call, ViewPortTestUtils.requestContext());

        Assertions.assertThat(response.get().body())
                .isExactlyInstanceOf(RpcResponse.class)
                .isEqualTo(new RpcResponse("helloWorld", "It Works", null));
    }

    static class TestRpcService {
        RpcMethodCallResult rpcFunction(RpcParams params) {
            return new RpcMethodSuccess("It Works");
        }
    }
}
