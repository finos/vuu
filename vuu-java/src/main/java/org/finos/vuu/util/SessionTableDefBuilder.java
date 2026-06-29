package org.finos.vuu.util;

import org.finos.vuu.api.Index;
import org.finos.vuu.api.Indices;
import org.finos.vuu.api.Link;
import org.finos.vuu.api.SessionTableDef;
import org.finos.vuu.api.TableVisibility;
import org.finos.vuu.api.TableVisibility$;
import org.finos.vuu.api.VisualLinks;
import org.finos.vuu.core.table.Column;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

/**
 * Builder for {@link SessionTableDef}.
 */
public class SessionTableDefBuilder {
    private String name;
    private String keyField;
    private Column[] customColumns = new Column[0];
    private List<String> joinFields = List.of();
    private boolean autoSubscribe = false;
    private List<Link> links = List.of();
    private List<String> indexFields = List.of();
    private TableVisibility visibility = TableVisibility.PUBLIC();
    private boolean includeDefaultColumns = true;

    /**
     * Sets table name.
     *
     * @param name table name
     * @return this builder
     */
    public SessionTableDefBuilder name(String name) {
        this.name = name;
        return this;
    }

    /**
     * Sets the primary key field for the table.
     *
     * @param keyField the field that uniquely identifies records
     * @return this builder
     */
    public SessionTableDefBuilder keyField(String keyField) {
        this.keyField = keyField;
        return this;
    }

    /**
     * Sets columns for the table.
     *
     * @param customColumns columns
     * @return this builder
     */
    public SessionTableDefBuilder customColumns(Column[] customColumns) {
        this.customColumns = customColumns;
        return this;
    }

    /**
     * Sets the fields used by join table.
     *
     * @param joinFields column names
     * @return this builder
     */
    public SessionTableDefBuilder joinFields(List<String> joinFields) {
        this.joinFields = joinFields;
        return this;
    }

    /**
     * Sets autosubscribe flag.
     *
     * @param autoSubscribe {@code true} to enable autosubscribe
     * @return this builder
     */
    public SessionTableDefBuilder autoSubscribe(Boolean autoSubscribe) {
        this.autoSubscribe = autoSubscribe;
        return this;
    }

    /**
     * Sets visual links.
     *
     * @param links visual link definitions
     * @return this builder
     */
    public SessionTableDefBuilder links(List<Link> links) {
        this.links = links;
        return this;
    }

    /**
     * Sets the fields that should be indexed.
     *
     * @param indexFields the index field names
     * @return this builder
     */
    public SessionTableDefBuilder indexFields(List<String> indexFields) {
        this.indexFields = indexFields;
        return this;
    }

    /**
     * Sets table visibility.
     *
     * @param visibility visibility
     * @return this builder
     */
    public SessionTableDefBuilder visibility(TableVisibility visibility) {
        this.visibility = visibility;
        return this;
    }

    /**
     * Sets table as private.
     *
     * @return this builder
     */
    public SessionTableDefBuilder withPrivateVisibility() {
        this.visibility = TableVisibility$.MODULE$.PRIVATE();
        return this;
    }

    /**
     * Sets table as public.
     *
     * @return this builder
     */
    public SessionTableDefBuilder withPublicVisibility() {
        this.visibility = TableVisibility$.MODULE$.PUBLIC();
        return this;
    }

    /**
     * Sets whether default columns should be added to the table.
     *
     * @param includeDefaultColumns {@code true} to include default columns
     * @return this builder
     */
    public SessionTableDefBuilder includeDefaultColumns(Boolean includeDefaultColumns) {
        this.includeDefaultColumns = includeDefaultColumns;
        return this;
    }

    /**
     * Builds {@link SessionTableDef}.
     *
     * @return {@link SessionTableDef}
     */
    public SessionTableDef build() {
        return new SessionTableDef(
                name,
                keyField,
                customColumns,
                toScalaSeq(joinFields),
                autoSubscribe,
                VisualLinks.apply(toScala(links)),
                Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList())),
                visibility,
                includeDefaultColumns);
    }
}
