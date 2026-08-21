package org.finos.vuu.net.rpc;

import org.assertj.core.api.Assertions;
import org.finos.vuu.util.ScalaCollectionConverter;
import org.junit.jupiter.api.Test;
import test.helper.ViewPortTestUtils;

import java.util.Collections;

public class RpcMethodHandlerTest {

    @Test
    public void should_register_java_function_as_rpc_in_default_handler() {
        final TestRpcService rpcService = new TestRpcService();

        final DefaultRpcHandler$ defaultRpcHandler = DefaultRpcHandler$.MODULE$;
        defaultRpcHandler.registerRpc("helloWorld", rpcService::rpcFunction);

        RpcFunctionResult response = defaultRpcHandler.processRpcRequest("helloWorld", new RpcParams(ScalaCollectionConverter.toScala(Collections.emptyMap()), null, ViewPortTestUtils.requestContext()));

        Assertions.assertThat(response)
                .isExactlyInstanceOf(RpcFunctionSuccess.class);
        Assertions.assertThat(((RpcFunctionSuccess) response).optionalResult().get())
                .isEqualTo("It Works");
    }

    static class TestRpcService {
        RpcFunctionResult rpcFunction(RpcParams params) {
            return new RpcFunctionSuccess("It Works");
        }
    }
}
