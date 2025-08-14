package org.finos.vuu;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.*;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.module.authn.AuthNModule;
import org.finos.vuu.core.module.metrics.MetricsModule;
import org.finos.vuu.core.module.price.PriceModule;
import org.finos.vuu.core.module.simul.SimulationModule;
import org.finos.vuu.core.module.vui.VuiStateModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.net.AlwaysHappyLoginValidator;
import org.finos.vuu.net.Authenticator;
import org.finos.vuu.net.LoggedInTokenValidator;
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator;
import org.finos.vuu.net.http.AbsolutePathWebRoot;
import org.finos.vuu.net.http.VuuHttp2ServerOptions;
import org.finos.vuu.plugin.Plugin;
import org.finos.vuu.state.MemoryBackedVuiStateStore;
import org.finos.vuu.state.VuiStateStore;
import scala.Option;

/**
 * Example Java App using Vuu.
 *
 */
public class VuuExampleMain
{
    /*
        //to allow self signed certs
        chrome://flags/#allow-insecure-localhost
    */
    public static void main( String[] args )
    {
        final MetricsProvider metrics = new MetricsProviderImpl();
        final Clock clock = new DefaultClock();
        final LifecycleContainer lifecycle = new LifecycleContainer(clock);
        final TableDefContainer tableDefContainer = new TableDefContainer();

        final VuiStateStore store = new MemoryBackedVuiStateStore(100);

        lifecycle.autoShutdownHook();

        final Authenticator authenticator = new AlwaysHappyAuthenticator();
        final LoggedInTokenValidator loginTokenValidator = new LoggedInTokenValidator();

        final String webRoot = "vuu-ui/deployed_apps/app-vuu-example";
        final String certPath = "example/main/src/main/resources/certs/cert.pem";
        final String keyPath = "example/main/src/main/resources/certs/key.pem";

        final VuuServerConfig config = new VuuServerConfig(
                VuuHttp2ServerOptions.apply()
                        .withWebRoot(new AbsolutePathWebRoot(webRoot, true))
                        .withSsl(certPath, keyPath)
                        .withPort(8443),
                VuuWebSocketOptions.apply()
                        .withUri("websocket")
                        .withWsPort(8090)
                        .withWss(certPath, keyPath, Option.apply(null))
                        .withBindAddress("0.0.0.0"),
                VuuSecurityOptions.apply()
                        .withAuthenticator(authenticator)
                        .withLoginValidator(new AlwaysHappyLoginValidator()),
                VuuThreadingOptions.apply()
                        .withTreeThreads(4)
                        .withViewPortThreads(4),
                VuuClientConnectionOptions.apply()
                        .withHeartbeat(),
                new scala.collection.mutable.ListBuffer<ViewServerModule>().toList(),
                new scala.collection.mutable.ListBuffer<Plugin>().toList()
        ).withModule(PriceModule.apply(clock, lifecycle, tableDefContainer))
         .withModule(SimulationModule.apply(clock, lifecycle, tableDefContainer))
         .withModule(MetricsModule.apply(clock, lifecycle, metrics, tableDefContainer))
         .withModule(VuiStateModule.apply(store, clock, lifecycle, tableDefContainer))
         .withModule(AuthNModule.apply(authenticator, loginTokenValidator, clock, lifecycle, tableDefContainer))
         //the modules above are scala, the modules below are java...
         .withModule(new JavaExampleModule().create(tableDefContainer, clock))       ;

        final VuuServer vuuServer = new VuuServer(config, lifecycle, clock, metrics);

        lifecycle.start();

        vuuServer.join();
    }
}
