package org.finos.vuu;

import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.net.ViewServerMessage;
import org.finos.vuu.wsapi.helpers.TestStartUp;
import org.finos.vuu.wsapi.helpers.TestVuuClient;
import org.junit.Assert;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import scala.Option;
import scala.jdk.javaapi.OptionConverters;

import static org.junit.Assert.assertTrue;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class WebSocketApiJavaTestBase {

    protected TestVuuClient vuuClient;
    protected String tokenId;
    protected String sessionId;

    protected Clock clock = new DefaultClock();
    protected LifecycleContainer lifecycle  = new LifecycleContainer(clock);
    protected TableDefContainer tableDefContainer  = new TableDefContainer();

    @BeforeAll
    public void setUp() {
        vuuClient = testStartUp();
        tokenId = vuuClient.createAuthToken();
        var sessionOption = OptionConverters.toJava(vuuClient.login(tokenId, "testUser"));
        Assert.assertTrue("login request returns response successfully", sessionOption.isPresent());
        sessionId = sessionOption.get();
    }

    @AfterAll
    public void after() {
        lifecycle.stop();
    }

    protected abstract ViewServerModule defineModuleWithTestTables();

    protected <BodyType> BodyType assertBodyIsInstanceOf(Option<ViewServerMessage> message, String messageDescription) {
        var messageOptional = OptionConverters.toJava(message);
        assertTrue(messageDescription + " is present", messageOptional.isPresent());
        return ((BodyType) messageOptional.get().body());
    }

    private TestVuuClient testStartUp() {
        var startUp = new TestStartUp(
                this::defineModuleWithTestTables,
                clock,
                lifecycle,
                tableDefContainer);
        return startUp.startServerAndClient();
    }
}
