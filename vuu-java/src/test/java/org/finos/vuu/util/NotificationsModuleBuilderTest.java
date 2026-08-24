package org.finos.vuu.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.api.ViewPortDef;
import org.finos.vuu.core.AbstractVuuServer;
import org.finos.vuu.core.filter.type.PermissionFilter;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.provider.Provider;
import org.finos.vuu.provider.ProviderContainer;
import org.finos.vuu.viewport.ViewPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import scala.Function2;
import scala.Function4;

class NotificationsModuleBuilderTest {

  private Clock clock;
  private LifecycleContainer lifecycleContainer;
  private TableDefContainer tableDefContainer;

  @BeforeEach
  void setUp() {
    // Simple dummy objects for our containers
    clock =
        new Clock() {
          @Override
          public long now() {
            return 0;
          }

          @Override
          public void sleep(long millis) {}
        };
    lifecycleContainer = new LifecycleContainer(clock);
    tableDefContainer = new TableDefContainer();
  }

  @Test
  void buildWithAllParameters() {
    // 1. Setup dummy functions
    Function2<DataTable, AbstractVuuServer, Provider> dummyProviderFunc = (table, server) -> null;
    Function2<ViewPort, TableContainer, PermissionFilter> dummyPermissionFunc =
        (viewport, container) -> null;
    Function4<DataTable, Provider, ProviderContainer, TableContainer, ViewPortDef>
        dummyViewPortFactory = (table, provider, pContainer, tContainer) -> null;

    String[] additionalCols = new String[] {"extraCol1:string", "extraCol2:double"};

    // 2. Execute Builder
    ViewServerModule module =
        new NotificationsModuleBuilder()
            .providerFunction(dummyProviderFunc)
            .permissionFunction(dummyPermissionFunc)
            .viewPortDefFactory(dummyViewPortFactory)
            .additionalColumns(additionalCols)
            .clock(clock)
            .lifecycleContainer(lifecycleContainer)
            .tableDefContainer(tableDefContainer)
            .build();

    // 3. Assert Core Module Properties
    assertNotNull(module, "Module should not be null");
    assertEquals("NOTIFICATIONS", module.name(), "Module namespace should be NOTIFICATIONS");

    // Assert that the container passed in is the one returned by the module
    assertEquals(
        tableDefContainer,
        module.tableDefContainer(),
        "TableDefContainer should match the injected instance");

    // 4. Assert TableDefs (Scala List interop)
    assertEquals(
        1, module.tableDefs().size(), "Module should contain exactly one table definition");

    TableDef tableDef = module.tableDefs().head(); // Extract the table using Scala's head()
    assertEquals("notifications", tableDef.name(), "Table name should be 'notifications'");
    assertEquals("id", tableDef.keyField(), "Key field should be 'id'");

    // Verify the permission function was passed down into the options
    assertNotNull(tableDef.options(), "Table options should not be null");
    assertNotNull(
        tableDef.options().permissionFunction(),
        "Permission function should have been injected into TableDef");

    // 5. Assert ViewPortDefs
    assertFalse(module.viewPortDefs().isEmpty(), "ViewPortDefs should not be empty");
    // The module factory typically registers the viewport factory under the table name
    assertTrue(
        module.viewPortDefs().contains("notifications"),
        "Should contain a ViewPortDef factory for 'notifications'");

    // 6. Assert static resources and rest services (default behavior check)
    assertTrue(
        module.staticFileResources().isEmpty(),
        "Notifications module should not have static file resources by default");
    assertTrue(
        module.restServicesUnrealized().isEmpty(),
        "Notifications module should not have rest services by default");
  }

  @Test
  void testBuilderChaining() {
    NotificationsModuleBuilder builder = new NotificationsModuleBuilder();

    NotificationsModuleBuilder result1 = builder.clock(clock);
    assertEquals(builder, result1, "Builder should return itself for chaining");

    NotificationsModuleBuilder result2 = builder.additionalColumns(new String[] {"col:string"});
    assertEquals(builder, result2, "Builder should return itself for chaining");

    NotificationsModuleBuilder result3 = builder.lifecycleContainer(lifecycleContainer);
    assertEquals(builder, result3, "Builder should return itself for chaining");

    NotificationsModuleBuilder result4 = builder.tableDefContainer(tableDefContainer);
    assertEquals(builder, result4, "Builder should return itself for chaining");
  }

  @Test
  void buildWithMissingParametersThrowsException() {
    NotificationsModuleBuilder builder = new NotificationsModuleBuilder();
    // Missing all parameters, calling build should throw an exception due to requireNonNull checks
    boolean exceptionThrown = false;
    try {
      builder.build();
    } catch (Exception e) {
      exceptionThrown = true;
    }
    assertTrue(exceptionThrown, "Building without mandatory parameters should throw an exception");
  }
}
