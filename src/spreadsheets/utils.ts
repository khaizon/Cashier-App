interface CategoryRow {
  category: string;
  palette1: string;
  palette2: string;
  palette3: string;
  id: number;
  img: string;
  title: string;
  price: number;
}

/** convert range values [[col names], [row1], [row2], ...]
 *  to an array of Category Items
 *  */

const processExcelResult = (rangeValues: Array<Array<string>>): Array<CategoryItem> => {
  const columnNames: Array<string> = rangeValues[0];

  const inputRows: Array<CategoryRow> = rangeValues.slice(1).map((row) => {
    const currRow: CategoryRow = columnNames.reduce((acc, columnName, n) => {
      let value: string | number = row[n];
      if (columnName === 'price') {
        value = parseFloat(value);
      }
      return { ...acc, [columnName]: value };
    }, {} as CategoryRow);
    return currRow;
  });

  const result: Array<CategoryItem> = inputRows.reduce((acc: Array<CategoryItem>, row) => {
    const { category, palette1, palette2, palette3, ...item } = row;
    const existingCategory = acc.find((item) => item.category === category);

    if (existingCategory) {
      existingCategory.items.push(item);
    } else {
      const newCategory: CategoryItem = {
        category,
        palette1,
        palette2,
        palette3,
        items: [item],
      };
      acc.push(newCategory);
    }
    return acc;
  }, []);
  return result;
};

/** API call to google spreadsheets  */
export const googleAPIGetRangeValues = async (sheetName: string, callback: (items: CategoryItem[]) => void) => {
  let response;
  try {
    // Fetch first 10 files
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
      range: `${sheetName}!A:H`,
    });
  } catch (err) {
    console.log(err);
    return;
  }
  const range = response.result;
  if (!range || !range.values || range.values.length === 0) {
    console.log('empty result');
    return;
  }
  callback(processExcelResult(range.values));
};

export default googleAPIGetRangeValues;
