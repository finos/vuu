//TODO neither this file nor filter-data-view belong here - thye are not specific to remote views

import { DataTypes, EventEmitter } from '@vuu-ui/utils';

const logger = console;

export default class BinnedDataSource extends EventEmitter {
  constructor(dataView, column) {
    super();
    this.dataView = dataView;
    this.column = column;
    this.dataCountCallback = null;
  }

  subscribe({ range }, callback) {
    logger.log(`subscribe`);

    this.dataView.subscribeToFilterData(this.column, range, ({ rows, size, range }) => {
      logger.log(`receive rows ${rows.length} of ${size} range ${JSON.stringify(range)}`);

      callback(rows);
    });
  }

  filter(filter) {
    this.dataView.filter(filter, DataTypes.ROW_DATA);
  }

  destroy() {
    logger.log(`<destroy>`);
    this.dataView.unsubscribeFromFilterData(this.column);
  }
}
