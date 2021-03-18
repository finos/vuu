//package io.venuu.vuu.net.http
//
//import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
//import org.eclipse.jetty.alpn.ALPN
//import org.eclipse.jetty.alpn.server.ALPNServerConnectionFactory
//import org.eclipse.jetty.http2.HTTP2Cipher
//import org.eclipse.jetty.http2.server.{HTTP2CServerConnectionFactory, HTTP2ServerConnectionFactory}
//import org.eclipse.jetty.jmx.MBeanContainer
//import org.eclipse.jetty.server._
//import org.eclipse.jetty.server.handler.ResourceHandler
//import org.eclipse.jetty.util.ssl.SslContextFactory
//
//import java.lang.management.ManagementFactory
//
///**
// * Created by chris on 12/11/2015.
// */
//class JettyHttp2Server(val httpPort: Int, val httpsPort: Int, webRoot: String)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled{
//
//  private val server: Server = new Server
//
//  lifecycle(this)
//
//  override def doStart(): Unit = {
//    server.start
//    //server.join
//
//  }
//
//  def join(): Unit = {
//    server.join()
//  }
//
//  override def doStop(): Unit = {
//    server.stop()
//  }
//
//  override def doInitialize(): Unit = {
//
//    val mbContainer: MBeanContainer = new MBeanContainer(ManagementFactory.getPlatformMBeanServer)
//    server.addBean(mbContainer)
//
//
//    val resource_handler = new ResourceHandler();
//    // Configure the ResourceHandler. Setting the resource base indicates where the files should be served out of.
//    // In this example it is the current directory but it can be configured to anything that the jvm has access to.
//    resource_handler.setDirectoriesListed(true);
//    resource_handler.setWelcomeFiles(Array( "index.html" ));
//    resource_handler.setResourceBase(webRoot )//"src/main/resources/www")
//
//
//    ALPN.debug=true;
//
//    //val context: ServletContextHandler = new ServletContextHandler(server, "/", ServletContextHandler.SESSIONS)
//
//
//
//    //    context.setResourceBase("src/main/resources/www")
//    //    context.addFilter(classOf[PushSessionCacheFilter], "/*", EnumSet.of(DispatcherType.REQUEST))
//    //    context.addFilter(classOf[PushedTilesFilter], "/*", EnumSet.of(DispatcherType.REQUEST))
//    //    context.addServlet(new ServletHolder(servlet), "/test/*")
//    //    context.addServlet(classOf[DefaultServlet], "/").setInitParameter("maxCacheSize", "81920")
//    //    server.setHandler(context)
//    server.setHandler(resource_handler)
//
//    val http_config: HttpConfiguration = new HttpConfiguration
//    http_config.setSecureScheme("https")
//    http_config.setSecurePort(8443)
//    http_config.setSendXPoweredBy(true)
//    http_config.setSendServerVersion(true)
//
//    val http: ServerConnector = new ServerConnector(server, new HttpConnectionFactory(http_config), new HTTP2CServerConnectionFactory(http_config))
//
//    http.setPort(8080)
//    server.addConnector(http)
//
//    //val jetty_distro: String = System.getProperty("jetty.distro", "../../jetty-distribution/target/distribution")
//    val sslContextFactory: SslContextFactory = new SslContextFactory()
//    //keystore needs to be in root of project dir
//    sslContextFactory.setKeyStorePath("keystore")
//    sslContextFactory.setKeyStorePassword("whitebox")
//    sslContextFactory.setKeyManagerPassword("whitebox")
//    sslContextFactory.setCipherComparator(new HTTP2Cipher.CipherComparator)
//
//    val https_config: HttpConfiguration = new HttpConfiguration(http_config)
//
//    https_config.addCustomizer(new SecureRequestCustomizer)
//    val h2: HTTP2ServerConnectionFactory = new HTTP2ServerConnectionFactory(https_config)
//
//    //NegotiatingServerConnectionFactory.checkProtocolNegotiationAvailable
//
//    val alpn: ALPNServerConnectionFactory = new ALPNServerConnectionFactory
//    alpn.setDefaultProtocol(http.getDefaultProtocol)
//    val ssl: SslConnectionFactory = new SslConnectionFactory(sslContextFactory, alpn.getProtocol)
//    val http2Connector: ServerConnector = new ServerConnector(server, ssl, alpn, h2, new HttpConnectionFactory(https_config))
//    http2Connector.setPort(8443)
//    server.addConnector(http2Connector)
//
//  }
//
//  override def doDestroy(): Unit = {
//    server.destroy()
//
//  }
//
//  override val lifecycleId: String = "httpServer"
//}
