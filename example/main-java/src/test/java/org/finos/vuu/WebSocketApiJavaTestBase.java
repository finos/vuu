package org.finos.vuu;

import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.wsapi.helpers.TestStartUp;
import org.finos.vuu.wsapi.helpers.TestVuuClient;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import scala.jdk.javaapi.OptionConverters;

public abstract class WebSocketApiJavaTestBase {

    protected TestVuuClient vuuClient;
    protected String tokenId;
    protected String sessionId;

    protected Clock clock = new DefaultClock();
    protected LifecycleContainer lifecycle  = new LifecycleContainer(clock);
    protected TableDefContainer tableDefContainer  = new TableDefContainer();

    @Before
    public void setUp() {
        vuuClient = testStartUp();
        tokenId = vuuClient.createAuthToken();
        var sessionOption = OptionConverters.toJava(vuuClient.login(tokenId, "testUser"));
        Assert.assertTrue("login request returns response successfully", sessionOption.isPresent());
        sessionId = sessionOption.get();
    }

    public TestVuuClient testStartUp() {
        var startUp = new TestStartUp(
                this::defineModuleWithTestTables,
                clock,
                lifecycle,
                tableDefContainer);
        return startUp.startServerAndClient();
    }

    public abstract ViewServerModule defineModuleWithTestTables();

    @After
    public void after(){
        lifecycle.stop();
    }
}
