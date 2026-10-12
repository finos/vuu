package org.finos.vuu.net.rpc;

import org.finos.vuu.viewport.NoAction$;
import org.finos.vuu.viewport.SelectionViewPortMenuItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("RpcHandlerBuilder Unit Tests")
class RpcHandlerBuilderTest {

    private RpcHandlerBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new RpcHandlerBuilder();
    }

    @Nested
    @DisplayName("Without a menu")
    class WithoutMenuTests {

        @Test
        @DisplayName("Should build a handler exposing no menu items")
        void shouldExposeNoMenuItemsByDefault() {
            RpcHandler result = builder.build();

            assertNotNull(result);
            assertTrue(result.menuMap().isEmpty());
        }
    }

    @Nested
    @DisplayName("With a menu")
    class WithMenuTests {

        @Test
        @DisplayName("Should build a handler exposing the configured selection menu item")
        void shouldExposeConfiguredMenuItem() {
            SelectionViewPortMenuItem menuItem = new SelectionViewPortMenuItem(
                    "Delete Selected", "", (selection, session) -> NoAction$.MODULE$, "DELETE_SELECTED"
            );

            RpcHandler result = builder.menu(menuItem).build();

            assertNotNull(result);
            assertEquals(1, result.menuMap().size());
            assertTrue(result.menuMap().contains("DELETE_SELECTED"));
            assertSame(menuItem, result.menuMap().apply("DELETE_SELECTED"));
        }
    }

    @Nested
    @DisplayName("Combined with registered RPCs")
    class CombinedWithRpcsTests {

        @Test
        @DisplayName("Should build a handler with both a menu and a registered RPC")
        void shouldExposeBothMenuAndRpc() {
            SelectionViewPortMenuItem menuItem = new SelectionViewPortMenuItem(
                    "Delete Selected", "", (selection, session) -> NoAction$.MODULE$, "DELETE_SELECTED"
            );

            RpcHandler result = builder
                    .menu(menuItem)
                    .addRpc("SOME_RPC", params -> new RpcFunctionSuccess())
                    .build();

            assertFalse(result.menuMap().isEmpty());
            assertEquals(RpcFunctionSuccess.class,
                    result.processRpcRequest("SOME_RPC", null).getClass());
        }
    }
}
