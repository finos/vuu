package org.finos.vuu.api;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.provider.Provider;
import org.finos.vuu.provider.ProviderContainer;
import scala.Function4;

public class ViewPortDefHelper {
    private ViewPortDefHelper() {
    }

    public static Function4<DataTable, Provider, ProviderContainer, TableContainer, ViewPortDef> createDefaultViewPOrtDef() {
        return (t, p, pc, tc) -> ViewPortDef.createDefault(t.getTableDef().getColumns());
    }
}
