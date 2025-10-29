package org.finos.vuu;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.VuuClientConnectionOptions;
import org.finos.vuu.core.VuuJoinTableProviderOptions;
import org.finos.vuu.core.VuuSSLByCertAndKey;
import org.finos.vuu.core.VuuSSLCipherSuiteOptions;
import org.finos.vuu.core.VuuSecurityOptions;
import org.finos.vuu.core.VuuServer;
import org.finos.vuu.core.VuuServerConfig;
import org.finos.vuu.core.VuuThreadingOptions;
import org.finos.vuu.core.VuuWebSocketOptions;
import org.finos.vuu.core.auths.VuuUser;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.module.authn.AuthNModule;
import org.finos.vuu.core.module.metrics.MetricsModule;
import org.finos.vuu.core.module.price.PriceModule;
import org.finos.vuu.core.module.simul.SimulationModule;
import org.finos.vuu.core.module.vui.VuiStateModule;
import org.finos.vuu.module.JavaExampleModule;
import org.finos.vuu.net.auth.Authenticator;
import org.finos.vuu.net.auth.LoginTokenService;
import org.finos.vuu.net.http.AbsolutePathWebRoot;
import org.finos.vuu.net.http.VuuHttp2ServerOptions;
import org.finos.vuu.plugin.Plugin;
import org.finos.vuu.state.MemoryBackedVuiStateStore;
import org.finos.vuu.state.VuiStateStore;
import scala.Option;
import scala.util.Left;
import scala.util.Right;

/**
 * Example Java App using Vuu.
 *
 */
public class VuuExampleMain {
    /*
        //to allow self signed certs
        chrome://flags/#allow-insecure-localhost
    */
    public static void main(String[] args) {
        final MetricsProvider metrics = new MetricsProviderImpl();
        final Clock clock = new DefaultClock();
        final LifecycleContainer lifecycle = new LifecycleContainer(clock);
        final TableDefContainer tableDefContainer = new TableDefContainer();

        final VuiStateStore store = new MemoryBackedVuiStateStore(100);

        lifecycle.autoShutdownHook();

        final LoginTokenService loginTokenService = LoginTokenService.apply();

        final Authenticator<scala.collection.immutable.Map<String, Object>> authenticator =
                Authenticator.apply(loginTokenService,
                //Simple happy auth that takes the username from a request map
                v1 -> {
                    var userName = v1.get("username");
                    if (userName.isEmpty()) {
                        return new Left<>("Authentication failed");
                    } else {
                        return new Right<>(VuuUser.apply(String.valueOf(userName.get())));
                    }
                });

        final String webRoot = "vuu-ui/deployed_apps/app-vuu-example";
        final String certPath = "example/main/src/main/resources/certs/cert.pem";
        final String keyPath = "example/main/src/main/resources/certs/key.pem";

        final VuuServerConfig config = new VuuServerConfig(
                VuuHttp2ServerOptions.apply()
                        .withWebRoot(new AbsolutePathWebRoot(webRoot, true))
                        .withSsl(new VuuSSLByCertAndKey(certPath, keyPath, Option.empty(), VuuSSLCipherSuiteOptions.apply()))
                        .withPort(8443),
                VuuWebSocketOptions.apply()
                        .withUri("websocket")
                        .withWsPort(8090)
                        .withSsl(new VuuSSLByCertAndKey(certPath, keyPath, Option.empty(), VuuSSLCipherSuiteOptions.apply()))
                        .withBindAddress("0.0.0.0"),
                VuuSecurityOptions.apply()
                        .withLoginTokenService(loginTokenService),
                VuuThreadingOptions.apply()
                        .withTreeThreads(4)
                        .withViewPortThreads(4),
                VuuClientConnectionOptions.apply()
                        .withHeartbeatEnabled(),
                VuuJoinTableProviderOptions.apply(),
                new scala.collection.mutable.ListBuffer<ViewServerModule>().toList(),
                new scala.collection.mutable.ListBuffer<Plugin>().toList()
        ).withModule(PriceModule.apply(clock, lifecycle, tableDefContainer))
         .withModule(SimulationModule.apply(clock, lifecycle, tableDefContainer))
         .withModule(MetricsModule.apply(clock, lifecycle, metrics, tableDefContainer))
         .withModule(VuiStateModule.apply(store, clock, lifecycle, tableDefContainer))
         .withModule(AuthNModule.apply(authenticator, clock, lifecycle, tableDefContainer))
         //the modules above are scala, the modules below are java...
         .withModule(new JavaExampleModule().create(tableDefContainer, clock))       ;

        final VuuServer vuuServer = new VuuServer(config, lifecycle, clock, metrics);

        lifecycle.start();

        vuuServer.join();
    }
}
