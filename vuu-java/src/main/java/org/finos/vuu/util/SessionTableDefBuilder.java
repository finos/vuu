package org.finos.vuu.util;

import org.finos.vuu.api.Index;
import org.finos.vuu.api.Indices;
import org.finos.vuu.api.Link;
import org.finos.vuu.api.SessionTableDef;
import org.finos.vuu.api.TableDefOptions;
import org.finos.vuu.api.TableVisibility;
import org.finos.vuu.api.VisualLinks;
import org.finos.vuu.core.filter.type.AllowAllPermissionFilter$;
import org.finos.vuu.core.filter.type.PermissionFilter;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.RangeSettings;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.viewport.ViewPort;

import java.util.List;
import java.util.function.BiFunction;

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
    private boolean isEditable = false;
    private BiFunction<ViewPort, TableContainer, PermissionFilter> permissionFunction = (vp, tc) -> AllowAllPermissionFilter$.MODULE$;
    private SortSpec defaultSort = new SortSpecBuilder()
            .build();
    private RangeSettings rangeSettings = RangeSettings.apply();

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
        this.visibility = TableVisibility.PRIVATE();
        return this;
    }

    /**
     * Sets table as public.
     *
     * @return this builder
     */
    public SessionTableDefBuilder withPublicVisibility() {
        this.visibility = TableVisibility.PUBLIC();
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
     * Sets whether the table is editable
     *
     * @param isEditable {@code true} to make the table editable
     * @return this builder
     */
    public SessionTableDefBuilder isEditable(Boolean isEditable) {
        this.isEditable = isEditable;
        return this;
    }

    /**
     * Sets the default SortSpec.
     *
     * @param defaultSort the default SortSpec
     * @return this builder
     */
    public SessionTableDefBuilder defaultSort(SortSpec defaultSort) {
        this.defaultSort = defaultSort;
        return this;
    }

    /**
     * Sets the range settings
     *
     * @param rangeSettings the rangeSettings
     * @return this builder
     */
    public SessionTableDefBuilder rangeSettings(RangeSettings rangeSettings) {
        this.rangeSettings = rangeSettings;
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
                TableDefOptions.apply(
                        toScalaSeq(joinFields),
                        autoSubscribe,
                        VisualLinks.apply(toScala(links)),
                        Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList())),
                        visibility,
                        includeDefaultColumns,
                        isEditable,
                        ScalaFunctionConverter.toScala(permissionFunction),
                        defaultSort,
                        rangeSettings
                )
        );
    }
}
