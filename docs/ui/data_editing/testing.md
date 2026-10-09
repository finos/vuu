# Testing

## Without a server

`LocalDataSourceProvider` from `@vuu-ui/vuu-data-test` supplies data sources
that implement session tables, the edit RPCs (`editCell`, `addRow`,
`deleteSelectedRows`) and `endEditSession` in the browser. Wrap your component
in it to develop and test editing without a Vuu server:

```tsx
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

<LocalDataSourceProvider>
  <InstrumentEditor />
</LocalDataSourceProvider>
```

The showcase examples under DataEditing all run this way.

## Simulating server rejection

To test error paths, wrap the data source so its session data source rejects
some calls. For example, to reject new rows (see `withServerCheck` in the
showcase's `EditForms.examples.tsx`):

```ts
const rejectExchangeXXX = (sessionDataSource: DataSource) => {
  const addRow = sessionDataSource.addRow?.bind(sessionDataSource);
  if (addRow) {
    sessionDataSource.addRow = async (rowData = {}): Promise<RpcResult> =>
      rowData.exchange === "XXX"
        ? { type: "ERROR_RESULT", errorMessage: "Exchange XXX is not accepted" }
        : addRow(rowData);
  }
  return sessionDataSource;
};

const withServerCheck = (dataSource: DataSource): DataSource => {
  const createSessionDataSource =
    dataSource.createSessionDataSource?.bind(dataSource);
  if (createSessionDataSource) {
    dataSource.createSessionDataSource = async (...args) => {
      const sessionDataSource = await createSessionDataSource(...args);
      return sessionDataSource
        ? rejectExchangeXXX(sessionDataSource as DataSource)
        : sessionDataSource;
    };
  }
  return dataSource;
};
```

New rows are added to the session table, so it's the session data source's
`addRow` that is wrapped. Create the wrapped data source once (for example in
`useMemo`).

## Test IDs

The pattern components take a `testId` suffix and add it to the `data-testid`
of their parts, for example `edit-table${testId}`, `toggle-edit${testId}`,
`edit-button${testId}` and `new-button${testId}`. Use a different suffix for
each instance on a page.

## Unit tests

The package's own Vitest tests in `packages/vuu-data-editing/test/` show how
to drive an `EditSession` and the form hooks directly, for example
`EditSession.lifecycle.test.ts` and `edit-form.test.tsx`.
