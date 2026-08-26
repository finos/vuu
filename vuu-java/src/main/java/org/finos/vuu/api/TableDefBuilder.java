package org.finos.vuu.api;

import org.finos.vuu.core.filter.type.PermissionFilter;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.RangeSettings;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.util.ScalaFunctionConverter;
import org.finos.vuu.viewport.ViewPort;

import java.util.List;
import java.util.Objects;
import java.util.function.BiFunction;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

/**
 * Builder for {@link TableDef}.
 */
public class TableDefBuilder {
    private String name;
    private String keyField;
    private Column[] customColumns = new Column[0];
    private TableDefOptions tableDefOptions = TableDefOptions.DefaultTableDefOptions();

    /**
     * Sets table name.
     *
     * @param name table name
     * @return this builder
     */
    public TableDefBuilder name(String name) {
        Objects.requireNonNull(name);
        this.name = name;
        return this;
    }


    /**
     * Sets the primary key field for the table.
     *
     * @param keyField the field that uniquely identifies records
     * @return this builder
     */
    public TableDefBuilder keyField(String keyField) {
        Objects.requireNonNull(keyField);
        this.keyField = keyField;
        return this;
    }

    /**
     * Sets columns for the table.
     *
     * @param customColumns columns
     * @return this builder
     */
    public TableDefBuilder customColumns(Column[] customColumns) {
        Objects.requireNonNull(customColumns);
        this.customColumns = customColumns;
        return this;
    }

    /**
     * Sets the fields used by join table.
     *
     * @param joinFields column names
     * @return this builder
     */
    public TableDefBuilder joinFields(List<String> joinFields) {
        Objects.requireNonNull(joinFields);
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withJoinFields(toScalaSeq(joinFields));
        return this;
    }

    /**
     * Sets autoSubscribe flag.
     *
     * @param autoSubscribe {@code true} to enable autoSubscribe
     * @return this builder
     */
    public TableDefBuilder autoSubscribe(boolean autoSubscribe) {
        this.tableDefOptions = tableDefOptions.withAutoSubscribe(autoSubscribe);
        return this;
    }

    /**
     * Sets visual links.
     *
     * @param links visual link definitions
     * @return this builder
     */
    public TableDefBuilder links(List<Link> links) {
        Objects.requireNonNull(links);
        var visualLinks = VisualLinks.apply(toScala(links));
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withLinks(visualLinks);
        return this;
    }

    /**
     * Sets the fields that should be indexed.
     *
     * @param indexFields the index field names
     * @return this builder
     */
    public TableDefBuilder indexFields(List<String> indexFields) {
        Objects.requireNonNull(indexFields);
        var indices = Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList()));
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withIndices(indices);
        return this;
    }

    /**
     * Sets table visibility.
     *
     * @param visibility visibility
     * @return this builder
     */
    public TableDefBuilder visibility(TableVisibility visibility) {
        Objects.requireNonNull(visibility);
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withVisibility(visibility);
        return this;
    }

    /**
     * Sets table as private.
     *
     * @return this builder
     */
    public TableDefBuilder withPrivateVisibility() {
        return visibility(TableVisibility.PRIVATE());
    }

    /**
     * Sets table as public.
     *
     * @return this builder
     */
    public TableDefBuilder withPublicVisibility() {
        return visibility(TableVisibility.PUBLIC());
    }

    /**
     * Sets whether default columns should be added to the table.
     *
     * @param includeDefaultColumns {@code true} to include default columns
     * @return this builder
     */
    public TableDefBuilder includeDefaultColumns(boolean includeDefaultColumns) {
        this.tableDefOptions = tableDefOptions.withIncludeDefaultColumns(includeDefaultColumns);
        return this;
    }

    /**
     * Sets whether to allows edit mode.
     *
     * @param isEditable {@code true} to allow edit mode
     * @return this builder
     */
    public TableDefBuilder isEditable(boolean isEditable) {
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withIsEditable(isEditable);
        return this;
    }

    /**
     * Sets permission filter function.
     *
     * @param permissionFunction permission filter
     * @return this builder
     */
    public TableDefBuilder permissionFunction(BiFunction<ViewPort, TableContainer, PermissionFilter> permissionFunction) {
        Objects.requireNonNull(permissionFunction);
        var function2 = ScalaFunctionConverter.toScala(permissionFunction);
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withPermissionFunction(function2);
        return this;
    }

    /**
     * Sets the default SortSpec.
     *
     * @param defaultSort the default SortSpec
     * @return this builder
     */
    public TableDefBuilder defaultSort(SortSpec defaultSort) {
        Objects.requireNonNull(defaultSort);
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withDefaultSort(defaultSort);
        return this;
    }

    /**
     * Sets the range settings
     *
     * @param rangeSettings the rangeSettings
     * @return this builder
     */
    public TableDefBuilder rangeSettings(RangeSettings rangeSettings) {
        Objects.requireNonNull(rangeSettings);
        this.tableDefOptions = (TableDefOptions) tableDefOptions.withRangeSettings(rangeSettings);
        return this;
    }

    /**
     * Builds {@link TableDef}.
     *
     * @return {@link TableDef}
     */
    public TableDef build() {
        Objects.requireNonNull(name);
        Objects.requireNonNull(keyField);
        return new TableDef(
                name,
                keyField,
                customColumns,
                tableDefOptions
        );
    }

}
