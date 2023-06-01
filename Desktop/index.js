function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("CSV Importer")
    .addItem("Import CSV", "showFileDialog")
    .addToUi();
}

function doGet(e) {
  // Serve HTML content for the web app
  return HtmlService.createHtmlOutputFromFile("Index").setTitle("My Web App");
}

function showFileDialog() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile("Index")
    .setWidth(400)
    .setHeight(350);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Import CSV");
}

function importCSVData(
  sheetId,
  fileUrl,
  columns,
  createNewSheet,
  filterColumnIndex,
  filterType,
  filterValue
) {
  var sheet;
  Logger.log("sheetId: " + sheetId);

  if (!sheetId) {
    throw new Error("Invalid sheet ID");
  }
  if (createNewSheet) {
    // Create a new sheet
    var newSheet = SpreadsheetApp.create("Imported Data Sheet");
    sheet = newSheet.getActiveSheet();
  } else {
    // Use existing sheet by ID
    sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
  }
  var response = UrlFetchApp.fetch(fileUrl);
  var content = response.getContentText();
  var data = Utilities.parseCsv(content);

  // Assuming the first row of CSV contains headers
  var headers = data[0];
  var headerIndexMap = {};
  headers.forEach(function (header, index) {
    headerIndexMap[header] = index;
  });

  var selectedColumns = columns.map(function (column) {
    return headerIndexMap[column];
  });

  var filteredData = data.filter(function (row) {
    // Implement your filtering logic here
    if (filterColumnIndex !== null && filterType && filterValue !== null) {
      var columnIndex = filterColumnIndex;
      var cellValue = row[columnIndex];

      if (filterType === "equals") {
        return cellValue.trim() === filterValue;
      } else if (filterType === "contains") {
        return cellValue.includes(filterValue);
      } else if (filterType === "numeric_gt") {
        return parseInt(cellValue, 10) > parseInt(filterValue, 10);
      } else if (filterType === "numeric_lt") {
        return parseInt(cellValue, 10) < parseInt(filterValue, 10);
      }
    }
    return true;
  });

  // Map selected columns to corresponding indices in the CSV data
  var selectedColumns = columns.map(function (column) {
    return headerIndexMap[column];
  });

  // Prepare data for import
  var importData = data.map(function (row) {
    return selectedColumns.map(function (index) {
      return row[index];
    });
  });

  // Append data to the sheet
  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      importData.length,
      importData[0].length
    )
    .setValues(importData);

  return sheet.getParent().getUrl();
}
