package org.finos.vuu.util;

import org.finos.vuu.api.JoinSpec;
import org.finos.vuu.api.JoinTo;
import org.finos.vuu.api.JoinType;
import org.finos.vuu.api.LeftOuterJoin$;
import org.finos.vuu.api.TableDef;

import java.util.Objects;

public class JoinToBuilder {

    private TableDef table;
    private String leftKey;
    private String rightKey;
    private JoinType joinType = LeftOuterJoin$.MODULE$;

    /**
     * Sets table.
     *
     * @param table tableDef
     * @return this builder
     */
    public JoinToBuilder table(TableDef table) {
        Objects.requireNonNull(table);
        this.table = table;
        return this;
    }

    /**
     * Sets leftKey.
     *
     * @param leftKey name
     * @return this builder
     */
    public JoinToBuilder leftKey(String leftKey) {
        Objects.requireNonNull(leftKey);
        this.leftKey = leftKey;
        return this;
    }

    /**
     * Sets table.
     *
     * @param rightKey name
     * @return this builder
     */
    public JoinToBuilder rightKey(String rightKey) {
        Objects.requireNonNull(rightKey);
        this.rightKey = rightKey;
        return this;
    }

    /**
     * Sets joinType.
     *
     * @param joinType joinType
     * @return this builder
     */
    public JoinToBuilder joinType(JoinType joinType) {
        Objects.requireNonNull(joinType);
        this.joinType = joinType;
        return this;
    }

    /**
     * Builds {@link JoinTo}.
     *
     * @return {@link JoinTo}
     */
    public JoinTo build() {
        Objects.requireNonNull(table);
        Objects.requireNonNull(leftKey);
        Objects.requireNonNull(rightKey);
        return new JoinTo(
                table,
                JoinSpec.apply(
                        leftKey,
                        rightKey,
                        joinType
                )
        );
    }

}
