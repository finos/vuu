import BaseTable from './table';

export default class Table extends BaseTable {
  constructor({ valueColumns, ...config }) {
    super(config);
    this.valueColumns = valueColumns; // updateableFields ?
  }

  setData(data) {
    const { index } = this;
    for (let i = 0; i < data.length; i++) {
      const [idx, key] = data[i];
      index[key] = idx;
    }

    this.rows = data;
  }

  async loadData(dataUrl) {
    console.log(`import data from ${dataUrl}.js`);
    try {
      const { default: data } = await import(`${dataUrl}`);
      if (data) {
        this.setData(data);
      }
    } catch (e) {
      console.error(`failed to load data from path '${dataUrl}'`, e);
    }
  }

  // async installDataGenerators({createPath, updatePath}){
  //     if (createPath){
  //         const {default:createGenerator} = await import(`${createPath}.mjs`);
  //         this.createRow = createGenerator;
  //     }
  //     if (updatePath){
  //         const {default: updateGenerator} = await import(`${updatePath}.mjs`);
  //         this.updateRow = updateGenerator;
  //     }
  // }
}
