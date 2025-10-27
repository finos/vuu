package org.finos.vuu;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.TestFriendlyClock;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.provider.MockProvider;
import org.finos.vuu.test.VuuServerTestCase;
import org.finos.vuu.viewport.ViewPort;
import org.scalatest.Ignore;
import scala.collection.immutable.Seq;

import java.util.Arrays;
import java.util.stream.Collectors;

import static scala.jdk.javaapi.CollectionConverters.asScala;

public class JavaTestExample extends VuuServerTestCase {

    public static Seq<ViewServerModule> toScalaSeq(ViewServerModule... modules){
        return new scala.collection.mutable.ListBuffer<ViewServerModule>().addAll(asScala(Arrays.stream(modules).collect(Collectors.toList()))).toSeq();
    }


    @Ignore
    public void testVuuServerFunctionality() throws Exception{

        final MetricsProvider metrics = new MetricsProviderImpl();
        final Clock clock = new TestFriendlyClock(1000000000000L);
        final LifecycleContainer lifecycle = new LifecycleContainer(clock);
        final TableDefContainer tableDefContainer = new TableDefContainer();

        final ViewServerModule module = new JavaExampleModule().create(tableDefContainer, clock);

        withVuuServer(toScalaSeq(module), (vuuServer) -> {

            vuuServer.login("test");

            ViewPort viewport = vuuServer.createViewPort(JavaExampleModule.NAME, "myTable");

            MockProvider provider = vuuServer.getProvider(JavaExampleModule.NAME, "myTable");

//            provider.tick("123", Map.of("id", "123", "foo", "bar", "myInt", 123));
//
//            Seq<ViewPortUpdate> updates = combineQs(viewport);
//
//            assertVpEq(updates, () -> asList(
//                    asList("id", "foo", "myInt"),
//                    asList("123", "bar", 123)
//            ));

          return null;
        }, clock, lifecycle, metrics);
    }

}
