package org.finos.vuu.spreadsheet;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.VuuClientConnectionOptions;
import org.finos.vuu.core.VuuJoinTableProviderOptions;
import org.finos.vuu.core.VuuRpcOptions;
import org.finos.vuu.core.VuuSecurityOptions;
import org.finos.vuu.core.VuuServer;
import org.finos.vuu.core.VuuServerConfig;
import org.finos.vuu.core.VuuThreadingOptions;
import org.finos.vuu.core.VuuWebSocketOptions;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.module.authn.AuthNModule;
import org.finos.vuu.core.module.metrics.MetricsModule;
import org.finos.vuu.http2.server.VuuHttp2ServerFactory;
import org.finos.vuu.http2.server.config.AbsolutePathWebRoot;
import org.finos.vuu.http2.server.config.VuuHttp2ServerOptions;
import org.finos.vuu.net.auth.LoginTokenService;
import org.finos.vuu.net.ssl.VuuSSLByCertAndKey;
import org.finos.vuu.net.ssl.VuuSSLCipherSuiteOptions;
import org.finos.vuu.plugin.Plugin;
import org.finos.vuu.spreadsheet.vuu.SpreadsheetModule;
import scala.Option;

/**
 * Starts a Vuu server hosting the SPREADSHEET module. Run from the repository root
 * ({@code mvn -pl example/vuu-spreadsheet exec:exec} sets that up), as paths are relative to it.
 */
public class SpreadsheetMain {

    public static void main(String[] args) {
        final MetricsProvider metrics = new MetricsProviderImpl();
        final Clock clock = new DefaultClock();
        final LifecycleContainer lifecycle = new LifecycleContainer(clock);
        final TableDefContainer tableDefContainer = new TableDefContainer();

        lifecycle.autoShutdownHook();

        final LoginTokenService loginTokenService = LoginTokenService.apply();

        final String webRoot = "vuu-ui/deployed_apps/app-vuu-example";
        final String certPath = "example/main/src/main/resources/certs/cert.pem";
        final String keyPath = "example/main/src/main/resources/certs/key.pem";

        final VuuServerConfig config = new VuuServerConfig(
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
                VuuRpcOptions.apply(),
                new scala.collection.mutable.ListBuffer<ViewServerModule>().toList(),
                new scala.collection.mutable.ListBuffer<Plugin>().toList(),
                VuuHttp2ServerFactory.apply(VuuHttp2ServerOptions.apply()
                        .withWebRoot(new AbsolutePathWebRoot(webRoot, true))
                        .withSsl(new VuuSSLByCertAndKey(certPath, keyPath, Option.empty(), VuuSSLCipherSuiteOptions.apply()))
                        .withPort(8443))
        ).withModule(MetricsModule.apply(clock, lifecycle, metrics, tableDefContainer))
                .withModule(AuthNModule.apply(loginTokenService, Option.empty(), clock, lifecycle, tableDefContainer))
                .withModule(new SpreadsheetModule().create(tableDefContainer, clock));

        final VuuServer vuuServer = new VuuServer(config, lifecycle, clock, metrics);

        lifecycle.start();

        vuuServer.join();
    }
}
