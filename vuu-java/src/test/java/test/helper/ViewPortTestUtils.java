package test.helper;

import org.finos.vuu.net.*;

import java.util.Random;

public class ViewPortTestUtils {

    public static ViewServerMessage createRandomViewServerMessage(MessageBody messageBody) {
        final Random random = new Random();

        return new JsonViewServerMessage("req_id_" + random.nextInt(),
                "session_id_" + random.nextInt(),
                "msg_id_" + random.nextInt(),
                "username_" + random.nextInt(),
                messageBody,
                "MODULE");
    }

    public static RequestContext requestContext() {
        return new RequestContext("", new ClientSessionId("", ""), null, "");
    }
}
