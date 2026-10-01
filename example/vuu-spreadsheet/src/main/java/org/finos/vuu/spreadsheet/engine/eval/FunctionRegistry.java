package org.finos.vuu.spreadsheet.engine.eval;

import org.finos.vuu.spreadsheet.engine.eval.functions.Functions;

import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/** Maps function names (case-insensitive) to implementations. */
public final class FunctionRegistry {

    private final Map<String, SpreadsheetFunction> functions = new HashMap<>();

    /** A registry holding the built-in functions. */
    public static FunctionRegistry withBuiltIns() {
        FunctionRegistry registry = new FunctionRegistry();
        Functions.registerAll(registry);
        return registry;
    }

    public FunctionRegistry register(String name, SpreadsheetFunction function) {
        functions.put(name.toUpperCase(Locale.ROOT), function);
        return this;
    }

    public Optional<SpreadsheetFunction> lookup(String name) {
        return Optional.ofNullable(functions.get(name.toUpperCase(Locale.ROOT)));
    }

    public Set<String> names() {
        return Collections.unmodifiableSet(functions.keySet());
    }
}
