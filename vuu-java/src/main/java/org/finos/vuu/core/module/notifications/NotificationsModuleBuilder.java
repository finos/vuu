package org.finos.vuu.core.module.notifications;

import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
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
import scala.Function2;
import scala.Function4;

import java.util.Objects;

/**
 * Builder for Notifications {@link ViewServerModule}.
 */
public class NotificationsModuleBuilder {
    private Function2<DataTable, AbstractVuuServer, Provider> providerFunction;
    private Function2<ViewPort, TableContainer, PermissionFilter> permissionFunction;
    private Function4<DataTable, Provider, ProviderContainer, TableContainer, ViewPortDef> viewPortDefFactory;
    private String[] additionalColumns = new String[0];
    private Clock clock;
    private LifecycleContainer lifecycleContainer;
    private TableDefContainer tableDefContainer;

    /**
     * Sets the provider function.
     *
     * @param providerFunction the provider function
     * @return this builder
     */
    public NotificationsModuleBuilder providerFunction(Function2<DataTable, AbstractVuuServer, Provider> providerFunction) {
        Objects.requireNonNull(providerFunction);
        this.providerFunction = providerFunction;
        return this;
    }

    /**
     * Sets the permission function.
     *
     * @param permissionFunction the permission function
     * @return this builder
     */
    public NotificationsModuleBuilder permissionFunction(Function2<ViewPort, TableContainer, PermissionFilter> permissionFunction) {
        Objects.requireNonNull(permissionFunction);
        this.permissionFunction = permissionFunction;
        return this;
    }

    /**
     * Sets the viewport definition factory.
     *
     * @param viewPortDefFactory the viewport definition factory
     * @return this builder
     */
    public NotificationsModuleBuilder viewPortDefFactory(Function4<DataTable, Provider, ProviderContainer, TableContainer, ViewPortDef> viewPortDefFactory) {
        Objects.requireNonNull(viewPortDefFactory);
        this.viewPortDefFactory = viewPortDefFactory;
        return this;
    }

    /**
     * Sets additional columns.
     *
     * @param additionalColumns additional columns
     * @return this builder
     */
    public NotificationsModuleBuilder additionalColumns(String... additionalColumns) {
        Objects.requireNonNull(additionalColumns);
        this.additionalColumns = additionalColumns;
        return this;
    }

    /**
     * Sets the clock.
     *
     * @param clock the clock
     * @return this builder
     */
    public NotificationsModuleBuilder clock(Clock clock) {
        Objects.requireNonNull(clock);
        this.clock = clock;
        return this;
    }

    /**
     * Sets the lifecycle container.
     *
     * @param lifecycleContainer the lifecycle container
     * @return this builder
     */
    public NotificationsModuleBuilder lifecycleContainer(LifecycleContainer lifecycleContainer) {
        Objects.requireNonNull(lifecycleContainer);
        this.lifecycleContainer = lifecycleContainer;
        return this;
    }

    /**
     * Sets the table definition container.
     *
     * @param tableDefContainer the table definition container
     * @return this builder
     */
    public NotificationsModuleBuilder tableDefContainer(TableDefContainer tableDefContainer) {
        Objects.requireNonNull(tableDefContainer);
        this.tableDefContainer = tableDefContainer;
        return this;
    }

    /**
     * Builds {@link ViewServerModule}.
     *
     * @return {@link ViewServerModule}
     */
    public ViewServerModule build() {
        Objects.requireNonNull(providerFunction, "providerFunction is required");
        Objects.requireNonNull(permissionFunction, "permissionFunction is required");
        Objects.requireNonNull(viewPortDefFactory, "viewPortDefFactory is required");
        Objects.requireNonNull(clock, "clock is required");
        Objects.requireNonNull(lifecycleContainer, "lifecycleContainer is required");
        Objects.requireNonNull(tableDefContainer, "tableDefContainer is required");

        return NotificationModule$.MODULE$.apply(
                providerFunction,
                permissionFunction,
                viewPortDefFactory,
                additionalColumns,
                clock,
                lifecycleContainer,
                tableDefContainer
        );
    }
}
