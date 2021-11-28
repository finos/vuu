/*
  See UpdateQueue
*/
//TODO does this belong in view ?
import { DataTypes, EventEmitter } from '@vuu-ui/utils';

export default class UpdateQueue extends EventEmitter {
  // just until we get typings sorted ...
  constructor() {
    super();
    this._queue = null;
    this.length = 0;
  }
  // not the right name
  update(updates, dataType = DataTypes.ROW_DATA) {
    this.emit(dataType, { updates });
  }

  // just until we get the typing sorted
  getCurrentBatch() {}

  resize(size) {
    console.log(`localUpdateQueue resize ${JSON.stringify(size)}`);
  }

  append(row, offset) {
    console.log(`localUpdateQueue append ${JSON.stringify(row)} offset ${offset}`);
  }

  replace(message) {
    this.emit(DataTypes.ROW_DATA, message);
  }

  popAll() {
    console.log(`localUpdateQueue popAll`);
    return undefined; // for typescript, until we sort types for UpdateQueue
  }
}
