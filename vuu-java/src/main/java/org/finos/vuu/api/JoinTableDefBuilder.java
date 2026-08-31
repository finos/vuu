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
 * Builder for {@link org.finos.vuu.api.JoinTableDef}.
 */
public class JoinTableDefBuilder {
    private String name;
    private TableDef baseTable;
    private Column[] joinColumns = new Column[0];
    private List<JoinTo> joinTos = List.of();
    private JoinTableDefOptions joinTableDefOptions = JoinTableDefOptions.DefaultJoinTableDefOptions();

    /**
     * Sets table name.
     *
     * @param name table name
     * @return this builder
     */
    public JoinTableDefBuilder name(String name) {
        Objects.requireNonNull(name);
        this.name = name;
        return this;
    }

    /**
     * Sets baseTable.
     *
     * @param baseTable baseTable
     * @return this builder
     */
    public JoinTableDefBuilder baseTable(TableDef baseTable) {
        Objects.requireNonNull(baseTable);
        this.baseTable = baseTable;
        return this;
    }

    /**
     * Sets joinTos.
     *
     * @param joinTos joinTos
     * @return this builder
     */
    public JoinTableDefBuilder joinTos(List<JoinTo> joinTos) {
        Objects.requireNonNull(joinTos);
        this.joinTos = joinTos;
        return this;
    }

    /**
     * Sets joinColumns for the table.
     *
     * @param joinColumns columns
     * @return this builder
     */
    public JoinTableDefBuilder joinColumns(Column[] joinColumns) {
        Objects.requireNonNull(joinColumns);
        this.joinColumns = joinColumns;
        return this;
    }

    /**
     * Sets the fields used by join table.
     *
     * @param joinFields column names
     * @return this builder
     */
    public JoinTableDefBuilder joinFields(List<String> joinFields) {
        Objects.requireNonNull(joinFields);
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withJoinFields(toScalaSeq(joinFields));
        return this;
    }

    /**
     * Sets visual links.
     *
     * @param links visual link definitions
     * @return this builder
     */
    public JoinTableDefBuilder links(List<Link> links) {
        Objects.requireNonNull(links);
        var visualLinks = VisualLinks.apply(toScala(links));
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withLinks(visualLinks);
        return this;
    }

    /**
     * Sets the fields that should be indexed.
     *
     * @param indexFields the index field names
     * @return this builder
     */
    public JoinTableDefBuilder indexFields(List<String> indexFields) {
        Objects.requireNonNull(indexFields);
        var indices = Indices.apply(toScalaSeq(indexFields.stream().map(Index::apply).toList()));
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withIndices(indices);
        return this;
    }

    /**
     * Sets table visibility.
     *
     * @param visibility visibility
     * @return this builder
     */
    public JoinTableDefBuilder visibility(TableVisibility visibility) {
        Objects.requireNonNull(visibility);
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withVisibility(visibility);
        return this;
    }

    /**
     * Sets table as private.
     *
     * @return this builder
     */
    public JoinTableDefBuilder withPrivateVisibility() {
       return visibility(TableVisibility.PRIVATE());
    }

    /**
     * Sets table as public.
     *
     * @return this builder
     */
    public JoinTableDefBuilder withPublicVisibility() {
        return visibility(TableVisibility.PUBLIC());
    }

    /**
     * Sets whether to allows edit mode.
     *
     * @param isEditable {@code true} to allow edit mode
     * @return this builder
     */
    public JoinTableDefBuilder isEditable(boolean isEditable) {
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withIsEditable(isEditable);
        return this;
    }

    /**
     * Sets permission filter function.
     *
     * @param permissionFunction permission filter
     * @return this builder
     */
    public JoinTableDefBuilder permissionFunction(BiFunction<ViewPort, TableContainer, PermissionFilter> permissionFunction) {
        Objects.requireNonNull(permissionFunction);
        var function2 = ScalaFunctionConverter.toScala(permissionFunction);
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withPermissionFunction(function2);
        return this;
    }

    /**
     * Sets the default SortSpec.
     *
     * @param defaultSort the default SortSpec
     * @return this builder
     */
    public JoinTableDefBuilder defaultSort(SortSpec defaultSort) {
        Objects.requireNonNull(defaultSort);
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withDefaultSort(defaultSort);
        return this;
    }

    /**
     * Sets the range settings
     *
     * @param rangeSettings the rangeSettings
     * @return this builder
     */
    public JoinTableDefBuilder rangeSettings(RangeSettings rangeSettings) {
        Objects.requireNonNull(rangeSettings);
        this.joinTableDefOptions = (JoinTableDefOptions) joinTableDefOptions.withRangeSettings(rangeSettings);
        return this;
    }

    /**
     * Builds {@link JoinTableDef}.
     *
     * @return {@link JoinTableDef}
     */
    public JoinTableDef build() {
        Objects.requireNonNull(name);
        Objects.requireNonNull(baseTable);
        return new JoinTableDef(
                name,
                joinTableDefOptions,
                baseTable,
                joinColumns,
                toScalaSeq(joinTos)
        );
    }
}
