package org.finos.vuu.spreadsheet.engine;

/** Notified on the engine's calc thread when a recalculation finishes. */
@FunctionalInterface
public interface RecalcListener {
    void onRecalcComplete(RecalcResult result);
}
