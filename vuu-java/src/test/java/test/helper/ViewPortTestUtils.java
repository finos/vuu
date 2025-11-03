package test.helper;

import org.finos.vuu.core.auths.VuuUser;
import org.finos.vuu.net.ClientSessionId;
import org.finos.vuu.net.JsonViewServerMessage;
import org.finos.vuu.net.MessageBody;
import org.finos.vuu.net.RequestContext;
import org.finos.vuu.net.ViewServerMessage;

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
        return new RequestContext("", VuuUser.apply(""),
                new ClientSessionId("", ""), null, "");
    }
}
