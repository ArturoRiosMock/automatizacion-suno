const fs = require('fs');
const path = './last_row_index.json';

function getLastProcessedRow() {
  if (!fs.existsSync(path)) return 1;
  const data = fs.readFileSync(path, 'utf8');
  const json = JSON.parse(data);
  return json.lastRow;
}

function saveLastProcessedRow(rowNumber) {
  const data = { lastRow: rowNumber };
  fs.writeFileSync(path, JSON.stringify(data));
}

module.exports = {
  getLastProcessedRow,
  saveLastProcessedRow,
};
