/**
 *     __             __     __  __              dev: https://script.google.com/macros/s/AKfycbywi--ZtHqUjzcCQcWXvpcbzFHjhGl8H0Epyd5p6hHa/dev
 *    / /_  ___  ____/ /____/ /_/ /        dev-tests: https://script.google.com/macros/s/AKfycbywi--ZtHqUjzcCQcWXvpcbzFHjhGl8H0Epyd5p6hHa/dev?route=tests
 *   / __ \/ _ \/ __  / ___/ __/ /     dev-callsheet: https://script.google.com/macros/s/AKfycbywi--ZtHqUjzcCQcWXvpcbzFHjhGl8H0Epyd5p6hHa/dev?route=callsheet
 *  / /_/ /  __/ /_/ / /__/ /_/ /               prod: https://script.google.com/macros/s/AKfycbyHCsKSaoJji7xnneSo4MTY4jB5j8xrHPnsYnQp2XMdEZF1oyK2/exec
 * /_.___/\___/\__,_/\___/\__/_/      prod-callsheet: https://script.google.com/macros/s/AKfycbyHCsKSaoJji7xnneSo4MTY4jB5j8xrHPnsYnQp2XMdEZF1oyK2/exec?route=callsheet
 *                                        prod-tests: https://script.google.com/macros/s/AKfycbyHCsKSaoJji7xnneSo4MTY4jB5j8xrHPnsYnQp2XMdEZF1oyK2/exec?route=tests
 *                                    spreadsheet-db: https://docs.google.com/spreadsheets/d/17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8/edit#gid=810033239
 *                                        executions: https://script.google.com/home/projects/13LYGFiiS6aAY7auHNST2CTrffKoTx5oL5HSGmFNYMK5IIU4NgOGt7VAU/executions
 */

/**
 * Runs QUnit unit tests, and returns the results as HtmlOutput
 * @param {GoogleAppsScript.Events.DoGet} e event object of GET request
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML of QUnit tests
 */
const runQUnit = (e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput => {
    QUnit.helpers(this);

    function testFunctions() {
        testingCalculateAmountAndQty();
    }

    function testingCalculateAmountAndQty(){
       QUnit.test( "calculateAmountAndQty testing", function() {
          expect(7);
          equal( calculateAmountAndQty(10,2000), 20000, "Test for quantity : 10 and amount : 2000 sp output is 20000" );
          equal( calculateAmountAndQty("printer",2000), 0, "Test for quantity : printer and amount : 2000 so output is 0" );
          equal( calculateAmountAndQty(10,"mouse"), 0, "Test for quantity : 10 and amount : mouse so output is 0" );
          equal( calculateAmountAndQty(10,null), 0, "Test for quantity : 10 and amount : null so output is 0" );
          equal( calculateAmountAndQty(null,2000), 0, "Test for quantity : null and amount : 2000 so output is 0" );
          equal( calculateAmountAndQty(undefined,2000), 0, "Test for quantity : undefined and amount : 2000 so output is 0" );
          equal( calculateAmountAndQty(10,undefined), 0, "Test for quantity : 10 and amount : undefined so output is 0" );
       });
    }

    QUnit.config({
        title: "QUnit for `bedctl` - Test Suite"
    });
    QUnit.load(testFunctions);
    return QUnit.getHtml();
};

/**
 * GET endpoint
 * @param {GoogleAppsScript.Events.DoGet} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML code of specified web page
 */
const doGet = (e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput => {
    e = e || {parameter:{},parameters:{},queryString:''};
    return runQUnit(e);
}

/**
 * test function, used for QUnit boilerplate test suite
 * @param {number} quantity how many quantities of items
 * @param {number} amount how many items in each quantity
 * @returns {number} product of the inputs
 */
function calculateAmountAndQty(quantity: number, amount: number):number {
    if(!quantity || typeof (quantity) == 'undefined' || isNaN(quantity))
    { quantity=0; }
    if(!amount || typeof (amount) == 'undefined' || isNaN(amount))
    { amount=0; }
    return (quantity * amount);
}

/**
 * # QUnit Resources
 *
 * - QUnit Library Code:                           MxL38OxqIK-B73jyDTvCe-OBao7QLBR4j
 * - "How to test Google Apps Script using Qunit": https://www.tothenew.com/blog/how-to-test-google-apps-script-using-qunit/
 * - qUnit home:                                   https://qunitjs.com/
 * - qUnit home - main methods:                    https://api.qunitjs.com/QUnit/
 * - qUnit home - assertions:                      https://api.qunitjs.com/assert/
 * - CDN JS:                                       https://code.jquery.com/qunit/qunit-2.11.3.js
 * - CDN CSS:                                      https://code.jquery.com/qunit/qunit-2.11.3.css
 * - qUnit NPM:                                    `npm install --save-dev qunit`
 */
