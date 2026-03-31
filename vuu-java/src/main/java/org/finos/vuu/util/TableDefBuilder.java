package org.finos.vuu.util;

import org.finos.vuu.api.*;
import org.finos.vuu.core.filter.type.AllowAllPermissionFilter$;
import org.finos.vuu.core.filter.type.PermissionFilter;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.viewport.ViewPort;

import java.util.List;
import java.util.function.BiFunction;

import static org.finos.vuu.util.ScalaCollectionConverter.*;

public class TableDefBuilder {
    private String name;
    private String keyField;
    private Column[] customColumns;
    private List<String> joinFields=List.of();
    private boolean autoSubscribe = false;
    private List<Link> links= List.of();
    private List<String> indexFields;
    private TableVisibility visibility = TableVisibility.PUBLIC();
    private boolean includeDefaultColumns = true;
    private BiFunction<ViewPort, TableContainer, PermissionFilter> permissionFunction = (vp, tc) -> AllowAllPermissionFilter$.MODULE$;
    private SortSpec defaultSort = SortSpec.apply(emptyList());

    public TableDefBuilder name(String name) {
        this.name = name;
        return this;
    }

    public TableDefBuilder keyField(String keyField) {
        this.keyField = keyField;
        return this;
    }

    public TableDefBuilder customColumns(Column[] customColumns) {
        this.customColumns = customColumns;
        return this;
    }

    public TableDefBuilder joinFields(List<String> joinFields) {
        this.joinFields = joinFields;
        return this;
    }

    public TableDefBuilder autosubscribe(Boolean autosubscribe) {
        this.autoSubscribe = autosubscribe;
        return this;
    }

    public TableDefBuilder links(List<Link> links) {
        this.links = links;
        return this;
    }

    public TableDefBuilder indexFields(List<String> indexFields) {
        this.indexFields = indexFields;
        return this;
    }

    public TableDefBuilder visibility(TableVisibility visibility) {
        this.visibility = visibility;
        return this;
    }

    public TableDefBuilder withPrivateVisibility() {
        this.visibility = TableVisibility$.MODULE$.PRIVATE();
        return this;
    }

    public TableDefBuilder withPublicVisibility() {
        this.visibility = TableVisibility$.MODULE$.PUBLIC();
        return this;
    }

    public TableDefBuilder includeDefaultColumns(Boolean includeDefaultColumns) {
        this.includeDefaultColumns = includeDefaultColumns;
        return this;
    }

    public TableDefBuilder permissionFunction(BiFunction<ViewPort, TableContainer, PermissionFilter> permissionFunction) {
        this.permissionFunction = permissionFunction;
        return this;
    }

    public TableDefBuilder defaultSort(SortSpec defaultSort) {
        this.defaultSort = defaultSort;
        return this;
    }

    public TableDef build() {
        return new TableDef(
                name,
                keyField,
                customColumns,
                toScalaSeq(joinFields),
                autoSubscribe,
                VisualLinks.apply(toScala(links)),
                Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList())),
                visibility,
                includeDefaultColumns,
                ScalaFunctionConverter.toScala(permissionFunction),
                defaultSort);
    }
}
