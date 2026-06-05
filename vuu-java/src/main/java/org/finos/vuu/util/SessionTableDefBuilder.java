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

public class SessionTableDefBuilder {
    private String name;
    private String keyField;
    private Column[] customColumns = new Column[0];
    private List<String> joinFields = List.of();
    private boolean autoSubscribe = false;
    private List<Link> links = List.of();
    private List<String> indexFields = List.of();

    public SessionTableDefBuilder name(String name) {
        this.name = name;
        return this;
    }

    public SessionTableDefBuilder keyField(String keyField) {
        this.keyField = keyField;
        return this;
    }

    public SessionTableDefBuilder customColumns(Column[] customColumns) {
        this.customColumns = customColumns;
        return this;
    }

    public SessionTableDefBuilder joinFields(List<String> joinFields) {
        this.joinFields = joinFields;
        return this;
    }

    public SessionTableDefBuilder autoSubscribe(Boolean autoSubscribe) {
        this.autoSubscribe = autoSubscribe;
        return this;
    }

    public SessionTableDefBuilder links(List<Link> links) {
        this.links = links;
        return this;
    }

    public SessionTableDefBuilder indexFields(List<String> indexFields) {
        this.indexFields = indexFields;
        return this;
    }

    public SessionTableDef build() {
        return new SessionTableDef(
                name,
                keyField,
                customColumns,
                toScalaSeq(joinFields),
                autoSubscribe,
                VisualLinks.apply(toScala(links)),
                Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList())));
    }
}
