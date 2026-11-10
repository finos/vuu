package org.finos.vuu.spreadsheet.engine;

import java.util.List;

/**
 * Everything that changed as a result of one edit (or one batch of edits).
 * <p>
 * Contains the edited cells, every dependent whose value changed, and every cell whose precedents or
 * dependents changed (so a view of the dependency graph can be kept up to date).
 *
 * @param changes sorted by {@link CellRef}
 */
public record RecalcResult(long seq, List<CellChange> changes) {

    public RecalcResult {
        changes = List.copyOf(changes);
    }
}
