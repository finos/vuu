# Table interactions with dataSource

`dataSource` is a required prop for `Table`.

## useTable

it is used

- to initialise the rowCount state value with `dataSource.size`
- within tableModel hook
- to build columnMap, using `dataSource.columns`
- within dataSource hook
- whenever tableModel is re-initialised ...
  - handleConfigEditedInSettingsPanel
  - useLayoutEffectSkipFirst, triggered by changes to availableWidth, selectionModel, config
  - applyTableConfigChange, called when calculated column created, column(s) hidden or pinned

dataSource event handlers handled in `useTable`

- onSubscribed
- handleConfigChange, updates tableModel when dataSource "config" event emitted

### useDataSource

dataSource.subscribe, invoken in first setRange call, passing the following parameters

- range
- revealSelected
- selectedKeyValues

dataSource.resume
dataSource.enable

dataSource event handlers

- `resume`
- DataSourceSubscribeCallback, handles:
  - `subscribed`
  - `viewport-update`
  - `viewport=clear`

### useTableModel

Column Operations from Table Menu

- remove columns, directly removes column from dataSource.columns. dataSOuce fires `config` event
- hide column, updates tableModel config to set hidden flag true on columnDescriptor
