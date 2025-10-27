package org.finos.vuu;

import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.net.ViewServerMessage;
import org.finos.vuu.wsapi.helpers.TestStartUp;
import org.finos.vuu.wsapi.helpers.TestVuuClient;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import scala.Option;
import scala.jdk.javaapi.OptionConverters;

import static org.junit.jupiter.api.Assertions.assertTrue;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class WebSocketApiJavaTestBase {

    protected TestVuuClient vuuClient;
    protected String tokenId;
    protected String sessionId;

    protected Clock clock;
    protected LifecycleContainer lifecycle;
    protected TableDefContainer tableDefContainer;

    @BeforeAll
    public void setUp() {
        clock = new DefaultClock();
        lifecycle  = new LifecycleContainer(clock);
        tableDefContainer  = new TableDefContainer();

        vuuClient = testStartUp();
        var sessionOption = OptionConverters.toJava(vuuClient.login("testUser"));
        assertTrue(sessionOption.isPresent(), "login request returns response successfully");
        sessionId = sessionOption.get();
    }

    @AfterAll
    public void after() {
        lifecycle.stop();
    }

    protected abstract ViewServerModule defineModuleWithTestTables();

    protected <BodyType> BodyType assertBodyIsInstanceOf(Option<ViewServerMessage> message, String messageDescription) {
        var messageOptional = OptionConverters.toJava(message);
        assertTrue(messageOptional.isPresent(), messageDescription + " is present");
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
