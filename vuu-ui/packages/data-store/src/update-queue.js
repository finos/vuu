/*
    Inserts (and size records) and updates must be batched separately. Because updates are 
    keyed by index position and index positions may be affected by an insert operation, the
    timeline must be preserved. Updates can be coalesced until an insert is received. Then
    the update batch must be closed, to be followed by the insert(s). Similarly, multiple
    inserts, with no interleaved updates, can be batched (with a single size record). The batch
    will be closed as soon as the next update is received. So we alternate between update and
    insert processing, with each transition athe preceeding batch is closed off.
    An append is a simple insert that has no re-indexing implications.  

*/
export default class UpdateQueue {
  constructor() {
    this._queue = [];
  }

  get length() {
    return this._queue.length;
  }

  update(update) {
    //TODO we could also coalesce updates into an insert or rowset, if present
    const batch = this.getCurrentBatch('update');

    const [rowIdx] = update;
    const { updates } = batch;

    for (let i = 0, len = updates.length; i < len; i++) {
      if (updates[i][0] === rowIdx) {
        // we already have an update for this item, update the update...
        let d = updates[i];
        for (let colIdx = 1; colIdx < update.length; colIdx += 2) {
          const pos = d.indexOf(update[colIdx]);
          if (pos === -1) {
            // should check that it is really a colIdx,not a value
            d.push(update[colIdx], update[colIdx + 1]);
          } else {
            d[pos + 1] = update[colIdx + 1];
          }
        }

        return;
      }
    }
    updates.push(update);
  }

  resize(size) {
    const batch = this.getCurrentBatch('size');
    batch.size = size;
  }

  append(row, offset) {
    const batch = this.getCurrentBatch('insert');
    //onsole.log(`UpdateQueue append ${row[0]}`);
    batch.rows.push(row);
    batch.offset = offset;
  }

  replace({ rows, filter, size, range, offset }) {
    const batch = this.getCurrentBatch('rowset');
    batch.rows = rows;
    batch.size = size;
    batch.range = range;
    batch.offset = offset;
    // HM, think we should fire an immediate response for filter change
    batch.filter = filter;
  }

  popAll() {
    const results = this._queue;
    this._queue = [];
    return results;
  }

  getCurrentBatch(type) {
    const q = this._queue;
    const len = q.length;

    let batch = len === 0 || type === 'rowset' ? (q[0] = createBatch(type)) : q[len - 1];

    if (batch.type !== type) {
      // roll size recored into subsequent insert
      if (type === 'insert' && batch.type === 'size') {
        batch.type = 'insert';
        batch.rows = [];
      } else if (type === 'size' && batch.type === 'insert') {
        // that's ok - go ahead and update size on the insert batch
      } else {
        batch = q[len] = createBatch(type);
      }
    }

    return batch;
  }
}

function createBatch(type) {
  switch (type) {
    case 'rowset':
      return { type, rows: [] };
    case 'update':
      return { type, updates: [] };
    case 'insert':
      return { type, rows: [] };
    case 'size':
      return { type };
    default:
      throw Error('Unknown batch type');
  }
}
