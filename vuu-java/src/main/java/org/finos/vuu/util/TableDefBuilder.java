package org.finos.vuu.util;

import org.finos.vuu.api.*;
import org.finos.vuu.core.filter.type.PermissionFilter;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.viewport.ViewPort;
import scala.Function2;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class TableDefBuilder {
    private String name;
    private String keyField;
    private Column[] customColumns;
    private List<String> joinFields;
    private Boolean autoSubscribe;
    private List<Link> links;
    private List<String> indexFields;
    private TableVisibility visibility;
    private Boolean includeDefaultColumns;
    private Function2<ViewPort, TableContainer, PermissionFilter> permissionFunction;
    private SortSpec defaultSort;

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

    public TableDefBuilder permissionFunction(Function2<ViewPort, TableContainer, PermissionFilter> permissionFunction) {
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
                new VisualLinks(toScala(links)),
                Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList())),
                visibility,
                includeDefaultColumns,
                permissionFunction,
                defaultSort);
    }
}
