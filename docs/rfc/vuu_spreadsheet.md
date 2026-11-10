# `Vuu-spreadsheet`: An Excel-like Calculation Engine Driven by Vuu Tables

**Status: Implemented (server side).** `example/vuu-spreadsheet` exists as designed below. All
150 tests pass: engine unit tests, a randomized test against a naive oracle, and an end-to-end
websocket test that sends `editCell` RPCs and checks the viewport row updates.
`mvn -pl example/vuu-spreadsheet exec:exec` starts a server on `wss://localhost:8090/websocket`
and `https://localhost:8443`. The open questions were decided as proposed. The UI section is
still to do. "What actually shipped" at the end lists where the code differs from the original
design.

### Introduction

Vuu tables can already be edited from the UI. When a user edits a cell, `VuuDataSource.editCell`
(`vuu-ui/packages/vuu-data-remote/src/VuuDataSource.ts`) sends an `RPC_REQUEST` with
`rpcName: "editCell"` and params `{ key, column, data }`. On the server,
`EditTableRpcHandler` (`vuu/src/main/scala/org/finos/vuu/net/rpc/sessiontable/EditTableRpcHandler.scala`)
routes that to `editCell(RpcParams)`. `FixSequenceRpcService` in `example/editable` is the simplest
existing implementation: it takes the `key`, `column` and `data` params and writes them straight
back to the table with `processUpdate`.

This module puts a calculation engine between those two steps. What the user types is treated as
spreadsheet input: a literal (`42`, `hello`) or a formula (`=1+2`, `=SUM(A1+C1)`, `=A1*2`). The
engine parses it, records which cells it depends on in a dependency DAG, recalculates the edited
cell and everything downstream of it, and then publishes the computed values back to the Vuu table.
The UI sees the new values through normal viewport updates, the same way it sees any other table
change.

The goal is a small, readable reference: how to put real server-side business logic behind Vuu's
editable tables, written in plain Java against the same APIs `example/main-java` uses.

### Goals

- A new Maven module, `example/vuu-spreadsheet`, written entirely in Java (no Scala sources),
  following the layout and POM shape of `example/main-java`.
- A calculation engine that:
  - parses a practical subset of Excel formula syntax (see "Formula language");
  - models cell dependencies as a **directed acyclic graph** and rejects edits that would create a
    cycle;
  - recalculates only the edited cell and its transitive dependents, in topological order;
  - reports, when a recalculation finishes, exactly which cells changed value.
- The engine has **no dependency on Vuu**. It is a plain Java library inside the module, unit
  tested on its own. A thin adapter layer connects it to Vuu tables.
- Input goes through the standard `editCell` RPC (`EditTableRpcHandler`). No new protocol messages
  and no UI protocol changes.
- Output goes back through the standard table-update path (`DataTable.processUpdate`), so every
  viewport on the sheet (other users included) sees the new values.
- A runnable `main` that starts a Vuu server with the spreadsheet module, like `VuuExampleMain`.

### Non-goals

- Full Excel compatibility. There are no dynamic arrays, named ranges, cross-sheet references, R1C1
  notation, date/time serials, formatting, or volatile functions (`NOW`, `RAND`, `INDIRECT`,
  `OFFSET`).
- Copy/paste with relative-reference adjustment, fill-down, or insert/delete of rows and columns.
- Persistence. Sheet state lives in memory and is lost on restart.
- Multiple sheets per server. The design leaves room for them (see "Future work"), but v1 has one
  sheet.
- Edit sessions (`CreateSessionTableRpcHandler` / `endEditSession`). Edits apply directly to the
  live table, as spreadsheet edits do.

### Module layout

```
example/vuu-spreadsheet/
  pom.xml                                    # parent: example; deps: vuu, vuu-java, permission (AuthN), http2-server, logback
                                             # test: junit-jupiter, vuu test-jar; `exec:exec` runs SpreadsheetMain
  src/main/java/org/finos/vuu/spreadsheet/
    SpreadsheetMain.java                     # starts the server (mirrors VuuExampleMain)
    engine/                                  # pure Java, no Vuu imports
      CellRef.java                           # immutable (col, row), parse/format "A1", "$B$2"
      RangeRef.java                          # A1:C3, normalised, expands to CellRefs row-major
      GridBounds.java                        # sheet size; formulas may only reference cells inside it
      CellValue.java                         # sealed: NumberValue, TextValue, BoolValue, ErrorValue, EmptyValue
      ErrorCode.java                         # #DIV/0!, #VALUE!, #REF!, #NAME?, #N/A, #NUM!
      CellFormatter.java                     # CellValue -> display string (the engine needs it for '&')
      CellInput.java                         # parsed user input: Literal | Formula | Clear
      CalculationEngine.java                 # public API; owns cells, graph and the calc thread
      EditAccepted.java                      # (seq, changed) - completes the submitEdit future
      CellChange.java, RecalcResult.java     # what a recalc changed
      RecalcListener.java                    # onRecalcComplete(RecalcResult)
      ast/Expr.java                          # sealed interface; node types are nested records
      parse/
        Lexer.java, Token.java
        Parser.java                          # recursive descent -> Expr
        FormulaParseException.java
      eval/
        Evaluator.java                       # Expr + CellLookup -> CellValue
        CellLookup.java
        Coercions.java                       # Excel-style number/text/bool coercion
        SpreadsheetFunction.java
        FunctionRegistry.java                # name -> SpreadsheetFunction
        functions/Functions.java             # SUM, AVERAGE, MIN, MAX, COUNT, IF, AND, OR, NOT, ABS, ROUND, CONCAT
      graph/
        DependencyGraph.java                 # precedents/dependents, cycle check, topo order of dirty set
        CycleDetectedException.java
    vuu/
      SpreadsheetModule.java                 # tables, providers, rpc handler wiring; owns the engine
      SpreadsheetConfig.java                 # rows, cols, edit timeout
      SheetProvider.java                     # seeds the empty grid; RecalcListener -> Sheet table
      SheetCellsProvider.java                # RecalcListener -> SheetCells table
      SpreadsheetEditRpcHandler.java         # editCell/editRow/deleteCell -> engine
  src/test/java/org/finos/vuu/spreadsheet/
    engine/                                  # parser, evaluation, functions, graph, engine + oracle tests (no Vuu)
    vuu/SpreadsheetWebSocketTest.java        # editCell over a real websocket -> viewport row updates
  src/main/resources/logback.xml
```

The module is added to `<modules>` in `example/pom.xml`.

### Vuu tables

The module is registered under namespace `SPREADSHEET` and defines two tables.

#### `Sheet`: the grid (editable)

| column | type | notes |
|---|---|---|
| `row` | Int | key field. Row number 1..`rows`. The key is its string form (`"1"`, `"2"`, …) |
| `A` … `Z` | String | display value of each cell |

- The grid size comes from config: `vuu.spreadsheet.rows` (default `100`) and
  `vuu.spreadsheet.cols` (default `26`, maximum `26` in v1, so columns are `A`–`Z`).
- `SheetProvider.doStart()` inserts every row with all cell columns empty, so the grid shows up
  in full before anyone types into it.
- Every cell column is a **String** column. A spreadsheet column holds mixed types (numbers, text,
  booleans, errors), but a Vuu column has one type. The engine keeps the typed `CellValue`, and
  the table holds its formatted display string (see "Display formatting"). One downside is that
  sorting a column sorts it as text. That is acceptable for a spreadsheet grid, which is rarely
  sorted.
- The cell columns are declared editable (`addString("A", true)`) and the table is `isEditable(true)`.
  `row` is not editable.
- The viewport uses `SpreadsheetEditRpcHandler`.

#### `SheetCells`: one row per non-empty cell (read-only)

| column | type | notes |
|---|---|---|
| `cellRef` | String | key field, e.g. `"B3"` |
| `col`, `row` | Int | zero-based column index and row number; the default sort, so `A2` comes before `A10` |
| `input` | String | exactly what the user typed, e.g. `=SUM(A1:A3)` or `42` |
| `value` | String | formatted value, the same as the grid shows |
| `valueType` | String | `NUMBER` / `TEXT` / `BOOL` / `ERROR` |
| `precedents` | String | comma-separated refs this cell reads, e.g. `A1,A2,A3` |
| `dependents` | String | comma-separated refs that read this cell |
| `lastCalcSeq` | Long | edit sequence number of the recalc that last changed this cell |

The grid shows values, not formulas, so it can't show what a cell actually contains. This table
fills that gap, and it makes the DAG visible, which helps when demoing and debugging. Clearing a
cell calls `processDelete` on its row. A cell's row is also rewritten when only its edges change
(for example, `A1` gains the dependent `B2`), so the `dependents` column stays current.

### End-to-end flow

```
UI: user types "=A1+C1" into Sheet row 2, column B
  └─ VuuDataSource.editCell(key="2", column="B", data="=A1+C1")
       └─ RPC_REQUEST editCell  ──►  SpreadsheetEditRpcHandler.editCell(params)
            1. validate: column is a single letter within cols, key ∈ 1..rows (null/"" data = clear)
            2. engine.submitEdit(B2, data).get(timeout)
                 - CellInput.parse(data), on the RPC thread         // FormulaParseException -> RpcFunctionFailure
                 - then, on the calc thread (structural phase):
                 - skip if the input is identical to what B2 holds  // EditAccepted(changed=false), nothing published
                 - resolve precedents {A1, C1}
                 - cycle check against DependencyGraph               // CycleDetectedException -> RpcFunctionFailure
                 - swap precedent edges, store input, seq = ++editSeq
                 - future completes with EditAccepted(seq)
            3. return RpcFunctionSuccess(None)
       (calc thread, continuing)
            4. dirty = {B2} ∪ transitiveDependents(B2)
            5. for cell in topoOrder(dirty): value = evaluate(cell); if value != old -> changed
            6. listeners.onRecalcComplete(RecalcResult(seq, changes))
                 ├─ SheetProvider: group value changes by row -> one Sheet.processUpdate(rowKey, {B: "7", D: "14"}) per row
                 └─ SheetCellsProvider: processUpdate / processDelete for each reported cell
  └─ viewport update ◄─ normal Vuu tick picks up the table changes; UI shows B2 = 7
```

Notes:

- **Validation errors come back on the RPC.** A syntax error, an unknown cell reference outside the
  grid, or a circular reference returns `RpcFunctionFailure` with a readable message
  (`"Circular reference: B2 -> C2 -> B2"`, `"Unexpected token ')' at position 6"`), and the cell
  keeps its previous contents. Excel behaves the same way when it rejects an invalid formula.
- **Evaluation errors do not fail the RPC.** `=1/0` is a valid formula whose value is `#DIV/0!`.
  The error shows in the cell and flows to dependents, as in Excel.
- **The RPC waits only for the structural phase.** That phase is cheap (parse plus graph update), so
  the user learns at once whether the edit was accepted. Recalculation then runs in the
  background, and its results reach the UI through the table.
- **The edited cell itself goes out with the recalc.** The RPC handler never writes the raw `data`
  into the table. The table only ever holds engine output, so there is one writer and a cell can
  never show a formula string in place of its value.
- **Unknown functions** (`=FOO(1)`) parse successfully and evaluate to `#NAME?`, as in Excel.
  Checking function names at parse time would reject formulas that name functions added later.
- `SpreadsheetEditRpcHandler` extends `DefaultRpcHandlerImpl` and implements `EditTableRpcHandler`,
  calling `registerEditTableRpcs()` in its constructor, following `EditRecordRpcHandler` in
  `example/main-java`. `editRow` applies each `(column, data)` pair as a single atomic engine edit
  (one structural phase, one recalc). `deleteCell` is the same as an `editCell` that clears the cell.
  `addRow`, `deleteRow`, `deleteSelectedRows`, `submitForm`, `closeForm` and `undoRowChange` return
  `RpcFunctionFailure("Not supported by spreadsheet")`.

### Formula language

#### Input classification

| user types | stored as |
|---|---|
| `""` or null | clear the cell |
| starts with `=` | formula: the rest is parsed as an expression |
| parses as a number (`42`, `-3.5`, `1e3`, `12%`) | `NumberValue` (`12%` becomes `0.12`) |
| `TRUE` / `FALSE` (case-insensitive) | `BoolValue` |
| starts with `'` | `TextValue` of the rest (Excel's "force text" prefix) |
| anything else | `TextValue` |

#### Grammar (lowest to highest precedence)

```
formula     := '=' comparison EOF
comparison  := concat ( ( '=' | '<>' | '<' | '>' | '<=' | '>=' ) concat )*
concat      := additive ( '&' additive )*
additive    := multiplicative ( ( '+' | '-' ) multiplicative )*
multiplicative := power ( ( '*' | '/' ) power )*
power       := unary ( '^' unary )*                 -- left-associative, as in Excel
unary       := ( '+' | '-' ) unary | percent
percent     := primary '%'*
primary     := NUMBER | STRING | TRUE | FALSE
             | CELLREF ( ':' CELLREF )?             -- A1, $A$1, A1:C3 ($ accepted and ignored in v1)
             | FUNCNAME '(' ( comparison ( ',' comparison )* )? ')'
             | '(' comparison ')'
STRING      := '"' ( [^"] | '""' )* '"'
```

- Unary minus binds tighter than `^`, so `=-2^2` is `4`, which matches Excel (and differs from maths
  convention). The test suite pins this down.
- Function names and cell references are case-insensitive (`=sum(a1:a3)` works).
- Whitespace between tokens is ignored.
- A range may appear only as a function argument. A bare range anywhere else (`=A1:A3+1`)
  evaluates to `#VALUE!`.

#### Functions (v1)

| function | behaviour |
|---|---|
| `SUM(args…)` | sum of numbers; range args skip text, bools and empties; direct args are coerced |
| `AVERAGE(args…)` | as `SUM` / count of numbers; `#DIV/0!` if there are none |
| `MIN`, `MAX` | over numbers; `0` if there are none (Excel behaviour) |
| `COUNT(args…)` | count of numeric values |
| `IF(cond, then, [else])` | lazy: only the chosen branch is evaluated; `else` defaults to `FALSE` |
| `AND`, `OR`, `NOT` | boolean logic with Excel coercion |
| `ABS(x)`, `ROUND(x, digits)` | `ROUND` uses half-away-from-zero, like Excel |
| `CONCAT(args…)` | text concatenation; ranges flatten in row-major order |

Both of the user's examples are valid. `=SUM(A1+C1)` is `SUM` over one argument, the expression
`A1+C1`. `=SUM(A1,C1)` and `=SUM(A1:C1)` also work (the last one also includes `B1`).

Functions implement a single interface:

```java
public interface SpreadsheetFunction {
    CellValue apply(List<Expr> args, EvalContext ctx);   // gets unevaluated args so IF can be lazy
}
```

Adding a function means one class plus one `FunctionRegistry` entry.

#### Values, coercion and errors

- In arithmetic, `EmptyValue` counts as `0`, text that parses as a number is coerced (`="3"+1` = `4`),
  other text gives `#VALUE!`, and `TRUE`/`FALSE` count as `1`/`0`.
- In `&` and `CONCAT`, numbers use their display format and empty counts as `""`.
- Comparisons: numbers < text < booleans across types, as in Excel. Text comparison ignores case.
- Errors propagate. Any operator or function (except `IF` on an unevaluated branch) that receives an
  `ErrorValue` returns that error. The first error in left-to-right argument order wins.
- A reference to a cell outside the configured grid is rejected at parse time. The engine never
  produces `#REF!` for it.
- Division by zero gives `#DIV/0!`. A non-finite arithmetic result (overflow, `NaN`) gives `#NUM!`.

#### Display formatting (`CellFormatter`)

- Numbers: integral values within ±1e15 show with no decimal point (`3`, not `3.0`). Other values
  show up to 10 significant digits with trailing zeros stripped, and switch to scientific notation
  when the absolute value is below 1e-9 or at least 1e15.
- Booleans show as `TRUE` / `FALSE`. Errors show as their code (`#DIV/0!`). Empty shows as `""`.

### Calculation engine

#### Public API

```java
public final class CalculationEngine implements AutoCloseable {
    public CalculationEngine(GridBounds bounds, FunctionRegistry functions);

    public void addListener(RecalcListener listener);

    /** Validates and applies the edit on the calc thread. The future fails with
     *  FormulaParseException / CycleDetectedException / IllegalArgumentException if the edit is rejected;
     *  otherwise completes once the graph is updated. Recalc and listener notification follow asynchronously. */
    public CompletableFuture<EditAccepted> submitEdit(CellRef cell, String rawInput);
    public CompletableFuture<EditAccepted> submitEdits(Map<CellRef, String> rawInputs);  // atomic batch

    /** Snapshot reads, safe from any thread. */
    public CellValue valueOf(CellRef cell);
    public Optional<String> inputOf(CellRef cell);

    /** Test hook: blocks until every edit submitted so far has been recalculated and published. */
    public void awaitQuiescence(Duration timeout);
}
```

#### Threading model

- One **single-threaded executor** (the "calc thread", named `vuu-spreadsheet-calc`) owns all
  mutable engine state: the cell map, the `DependencyGraph` and the edit sequence counter. Every
  mutation runs on it, so the engine needs no locks and edits apply in a strict total order.
- Parsing happens on the calling (RPC) thread before submission, because it needs no engine state.
  Cycle checking needs the graph, so it runs on the calc thread. The RPC thread blocks on the
  returned future with a timeout (default 5 s, config `vuu.spreadsheet.editTimeoutMs`). On timeout
  the RPC returns failure, but the edit may still apply later. This is documented, and it is
  acceptable for an example.
- Each accepted edit starts one recalc on the calc thread right after its structural phase. Edits
  that arrive during a recalc queue behind it. v1 does not coalesce them, which keeps the design
  simple and makes results deterministic.
- `valueOf` / `inputOf` read from an immutable snapshot map (`volatile Map<CellRef, CellState>`),
  which the calc thread replaces at the end of each recalc.
- Listeners run on the calc thread. `SheetProvider` and `SheetCellsProvider` call `processUpdate` directly.
  `InMemDataTable.update` synchronises on its data map and merges partial rows
  (`inMemRowDataMerger.mergeLeftToRight`), so the publisher can send only the changed columns of a
  row.

#### Dependency graph

```java
final class DependencyGraph {
    Map<CellRef, Set<CellRef>> precedents;   // cell -> cells it reads
    Map<CellRef, Set<CellRef>> dependents;   // cell -> cells that read it

    /** Throws CycleDetectedException (with the cycle path) without mutating anything. */
    void setPrecedents(CellRef cell, Set<CellRef> newPrecedents);

    /** Cell plus all transitive dependents, in topological order (Kahn's algorithm on the induced subgraph). */
    List<CellRef> recalcOrder(CellRef changed);
    List<CellRef> recalcOrder(Collection<CellRef> changed);   // for batch edits
}
```

- **Edges.** A formula's precedents are every `CellRefExpr` in its AST plus every cell of every
  `RangeExpr`, expanded. Precedents may be empty cells. Referencing an empty cell creates an edge,
  so typing into that cell later updates the formula. Literal cells have no precedents.
- **Cycle check.** Giving cell `X` a new precedent `P` closes a cycle exactly when `P` already depends
  on `X`, i.e. `P` is *downstream* of `X`. So the graph runs an iterative DFS from `X` along
  *dependent* edges (as they would be after the change, which matters for batch edits) and fails if
  it reaches any of `X`'s new precedents. The graph records the path for the error message and does
  not mutate. A self-reference (`=A1` in `A1`) is the length-1 case. Walking downstream rather than
  upstream keeps the common case cheap: a formula added at the end of a chain has no dependents yet,
  so the walk stops at once. This check keeps the graph acyclic
  at all times, so `recalcOrder` never has to handle cycles.
- **Dirty set and ordering.** `recalcOrder(X)` collects `X` and its transitive dependents with a
  BFS over `dependents`, then topologically sorts that set using only in-set edges. Ties break by
  `CellRef` order (column, then row), which makes results deterministic and testable.
- **Evaluation.** Cells are evaluated in that order. Each cell reads its precedents' values from the
  in-progress working map, so by the time a cell is evaluated, every precedent in the dirty set
  already has its new value. A cell counts as *changed* only if its new `CellValue` differs from
  its old one (`equals`). Only changed cells go into `RecalcResult`, plus the edited cell itself,
  which is always included because its input changed (`SheetCells.input` must update). Dependents are still evaluated
  even when a precedent's value did not change, which keeps v1 simple (see "Future work" for
  early cut-off).
- **Ranges.** In v1, ranges are expanded into individual edges. The grid is at most 26 × `rows`,
  so `=SUM(A1:Z1000)` creates 26,000 edges, which is acceptable at example scale. See "Future work"
  for range nodes.
- **Clearing a cell.** The cell's precedent edges are removed. Its *dependent* edges stay, because
  other formulas still reference it, and they recalculate against `EmptyValue`. The cell leaves the
  cell map once it is empty and has no dependents.

### Configuration

`SpreadsheetConfig.fromSystemProperties()` reads these JVM system properties (defaults shown).
Tests build a `SpreadsheetConfig` directly.

```
-Dvuu.spreadsheet.rows=100
-Dvuu.spreadsheet.cols=26            # 1..26
-Dvuu.spreadsheet.editTimeoutMs=5000
```

### UI

No UI protocol changes are needed. To make the grid editable in the example app, the `Sheet`
table's column configs set `editable: true` and `serverDataType: "string"` for `A`–`Z` (the UI
reads this in `vuu-utils/src/column-utils.ts`). The `row` column is read-only and pinned left.
Suggested order of work:

1. A showcase example under `vuu-ui/showcase/src/examples/` alongside
   `Table/Editing.examples.tsx`, pointing at `SPREADSHEET/Sheet` and `SPREADSHEET/SheetCells`
   side by side.
2. A `Sheet` feature in `app-vuu-example` if the showcase proves out.

The UI part is a follow-on to the server work. The server side is complete and testable without it.

### Testing

**Engine unit tests** (JUnit 5, no Vuu):

- *Lexer/Parser:* precedence table (`=1+2*3` → 7, `=(1+2)*3` → 9, `=-2^2` → 4, `=2^3^2` → 64,
  `=10%` → 0.1, `="a"&"b"` → `ab`, `=1<2` → TRUE); string escapes (`="say ""hi"""`); absolute refs
  (`=$A$1`); case insensitivity; each malformed input returns a positioned error message.
- *Evaluator:* every function in the table above, including empty/text/bool/error arguments;
  coercion rules; error propagation; lazy `IF` (`=IF(TRUE,1,1/0)` → 1).
- *DependencyGraph:* self-cycle; 2-cycle; long cycle through a range; a rejected edit leaves the
  graph unchanged; diamond (`B1=A1, C1=A1, D1=B1+C1`) evaluates `D1` exactly once, after `B1` and
  `C1`; deterministic tie-break order.
- *CalculationEngine:* the scenario below end to end; clearing a referenced cell; a batch edit
  gives one `RecalcResult`; only changed cells are reported (changing `A1` from `=1+1` to `2`
  reports only `A1`'s input change, not its dependents); retyping identical input publishes nothing
  (open question 2).
  Property test: 400 random edits on a 4×4 grid, for 5 seeds. After each edit, every cell is
  checked against a naive oracle that recomputes each cell recursively from scratch. The published
  `RecalcResult`s are also replayed into a copy of the grid, the same way `SheetProvider` applies
  them, which proves that publishing only the changed cells is enough.

**Vuu integration test** (`SpreadsheetWebSocketTest`, using the `vuu` test-jar's `TestStartUp` /
`TestVuuClient`, like `example/main-java`'s `PersonRpcHandlerWSApiTest`). It opens viewports on
`Sheet` and `SheetCells` and checks the values that arrive in `TableRowUpdates`:

```
editCell(key="1", column="A", data="1")        -> Sheet row 1: A="1"
editCell(key="1", column="C", data="2")        -> Sheet row 1: C="2"
editCell(key="2", column="B", data="=SUM(A1+C1)") -> Sheet row 2: B="3"
editCell(key="1", column="A", data="10")       -> Sheet row 2: B="12"  (downstream recalc published)
editCell(key="1", column="A", data="=B2")      -> RpcFunctionFailure("Circular reference: A1 -> B2 -> A1"), A1 still "10"
editCell(key="3", column="A", data="=1/0")     -> RpcFunctionSuccess; Sheet row 3: A="#DIV/0!"
editCell(key="3", column="A", data="=SUM(")    -> RpcFunctionFailure(parse error), A3 still "#DIV/0!"
SheetCells row "B2": input="=SUM(A1+C1)", precedents="A1,C1", value="12"
```

### Open questions

All four were decided as proposed.

1. **Formula visibility in the grid editor.** When the user starts editing `B2`, the inline editor
   is prefilled with the displayed value (`12`), not the formula (`=SUM(A1+C1)`). Excel shows the
   formula. There are three options: (a) accept it for v1 and point users at `SheetCells`;
   (b) add hidden `A_input`…`Z_input` columns to `Sheet` and have the UI editor prefill from them
   (needs a small UI change); (c) a formula bar in the showcase example, bound to the selected cell
   through `SheetCells`. **Proposal: (a) for v1, (c) as the UI follow-on.**
2. **Unchanged edits.** If a user retypes the same input, should anything be published? Proposal:
   the structural phase compares the new input with the stored one, and skips the recalc and
   notification when they match.
3. **Multi-user semantics.** Every user shares one sheet (the table is not per-session), and the
   last edit wins. Is that the intended demo, or should each session get its own sheet (a
   session table)? Proposal: one shared sheet, since seeing another user's edits ripple through
   is the more convincing demo.
4. **Number column option.** Should the `Sheet` table offer typed Double columns for sheets
   known to be all-numeric? Proposal: no. It complicates the adapter and fights the mixed-type
   nature of spreadsheets.

### Future work

- **Early cut-off:** skip evaluating a dependent when none of its precedents changed value. The
  dirty set becomes "changed so far" and is walked in topological order.
- **Range nodes:** represent `A1:A1000` as one graph node with interval-based lookup, in place of
  1,000 edges.
- **Coalescing:** fold edits queued behind an in-flight recalc into one recalc.
- **Multiple sheets:** a `SheetRef` in `CellRef` (`Sheet2!A1`), one Vuu table per sheet, and
  shared engine and graph.
- **Copy/paste with relative reference adjustment**, which needs `$` absolute-ref semantics to
  matter.
- **Persistence:** snapshot the `(cellRef, input)` pairs and replay them through `submitEdits` on
  startup.

### What actually shipped

Where the code differs from the design above, and why:

- **Publishing is done by the providers.** There is no separate `VuuTablePublisher`.
  `SheetProvider` and `SheetCellsProvider` each implement `RecalcListener` and register with the
  engine in `doStart()`, after the grid is seeded. In Vuu, providers are the components that write
  to tables, so this also removes the need to hand `DataTable`s to a third object.
- **`CellFormatter` lives in `engine/`,** because the evaluator needs number-to-text formatting for
  `&` and `CONCAT`.
- **Configuration uses system properties, not Typesafe Config.** It is three values, and this
  avoids adding a dependency.
- **`SheetCells` has `col`/`row` columns**, so its default sort is sheet order (`A2` before `A10`).
  Sorting the `cellRef` text would put `A10` before `A2`.
- **The cycle check walks downstream, not upstream.** The first version walked precedent edges from
  the new precedents. A 50,000-cell chain test exposed O(n²) behaviour (83 s). Walking dependents
  from the edited cell gives the same answers and the same messages, and the test drops to about 0.1 s.
- **Bare unknown names** (`=foo`) parse to a `NameExpr` and evaluate to `#NAME?`, as unknown
  function calls do. Excel handles both cases the same way.
- **An operand error takes priority over a failed coercion:** `="hello"+(1/0)` is `#DIV/0!`, not
  `#VALUE!`.
- **The edit handler matches column names strictly.** It accepts only a single letter `A`–`Z`. The
  first version built `column + row` and parsed it as a reference, which read an edit to the `row`
  column, row 1, as cell `ROW1`. The websocket test caught this.
- **The websocket test runs its own message loop.** `TestVuuClient.awaitForResponse` stores
  every non-matching message in a map keyed by request id. Row updates that arrive while the test
  waits for an RPC response can overwrite each other there and be lost. So the test reads every
  message itself, keeps each viewport's rows, and matches RPC responses by request id.
- **Every call to the RPC handler is logged at INFO.** Each call logs what was received and from
  whom (user, session, viewport), then whether it was accepted, rejected (with the reason), a no-op
  or timed out. Once recalculation finishes, it logs which cells changed value and what they changed
  from, e.g. `editCell REQ-16 edit #4 recalculated: A1: 1 -> 10, B2: 3 -> 12`. All lines for one call
  share the prefix `<rpcName> <requestId>`. To support this, `EditAccepted` carries a `recalculated`
  future that completes with that edit's `RecalcResult`, and `CellChange` carries `previousValue`.
