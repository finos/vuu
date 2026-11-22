package org.finos.vuu.spreadsheet.engine;

import java.util.concurrent.CompletableFuture;

/**
 * An edit passed validation and has been applied to the dependency graph.
 *
 * @param seq          the edit sequence number; the matching {@link RecalcResult} carries the same number
 * @param changed      false if the input was identical to what the cells already held, in which case
 *                     nothing is recalculated and listeners are not notified
 * @param recalculated completes with this edit's {@link RecalcResult} once recalculation has finished and
 *                     listeners have been notified. Completes with an empty result if {@code changed} is false.
 */
public record EditAccepted(long seq, boolean changed, CompletableFuture<RecalcResult> recalculated) {
}
