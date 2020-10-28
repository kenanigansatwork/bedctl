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
 * GET endpoint
 * @param {GoogleAppsScript.Events.DoGet} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML code of specified web page
 */
const doGet = (e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput => {
    return processGetRequest(e || {});
}

/**
 * Process GET request (call from doGet(e))
 * @param {GoogleAppsScript.Events.DoGet} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} HTML output of specified webpage;
 */
function processGetRequest(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
    // assign default route
    // - route should be string property of the object property "parameter" of the event object (e)
    let defaultRoute = 'home'
    let route = e.parameter.route || defaultRoute;
    
    try {
        switch (route) {
            case 'tests': return runQUnit(e);
            case 'callsheet': return new Omnitool(e).getCallsheetHtmlOutput();
            case 'home': return new Omnitool(e).getHomePage();
            default: return getHomePage();
        }
    } catch(err) {
        Logger.log(err);
        return getHtmlOutput(`<strong>${err.name}</strong>: ${err.message}`);
    }
}

/**
 * CLASS: Omnitool
 */
class Omnitool {
    constructor(e:GoogleAppsScript.Events.DoGet) {
        this.e = e;
    }

    getCallsheetHtmlOutput():GoogleAppsScript.HTML.HtmlOutput {
        return HtmlService.createHtmlOutput('<h1>callsheet</h2>')
            .append(`<pre>${JSON.stringify(this.e,null,4)}<\/pre>`);
    }
    // throw err code:
    // const err = new Error('this error occurred');
    // err.name = 'TypeError';
    // throw err;

    getHomePage():GoogleAppsScript.HTML.HtmlOutput {
        return HtmlService.createHtmlOutput('<h1>Home - bedctl</h2>');
    }
}

/**
 * Runs QUnit unit tests, and returns the results as HtmlOutput
 * @param {GoogleAppsScript.Events.DoGet} e event object of GET request
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML of QUnit tests
 */
function runQUnit(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
    QUnit.helpers(this);

    function testFunctions() {
        testingOmnitoolInitialization();
        testingOmnitoolGetCallsheetMethod();
        testingOmnitoolGetHomePageMethod();
    }

    function testingOmnitoolInitialization() {
        QUnit.test( "omnitool initialization testing", function() {
            let omnitool = new Omnitool({});
            expect(2);
            equal(typeof omnitool,'object','initializes a new object');
            equal(typeof omnitool.e, 'object', 'initializes with an event object (e)');
        });
    }

    function testingOmnitoolGetCallsheetMethod() {
        QUnit.test( "omnitool mehod testing - getCallsheetHtmlOutput", function() {
            let omnitool = new Omnitool({}),
                result = omnitool.getCallsheetHtmlOutput();
            expect(1);
            equal(typeof result,'object','initializes a new object');
        });
    }

    function testingOmnitoolGetHomePageMethod() {
        QUnit.test( "omnitool mehod testing - getHomePage", function() {
            let omnitool = new Omnitool({}),
                result = omnitool.getHomePage();
            expect(1);
            equal(typeof result,'object','initializes a new object');
        });
    }

    QUnit.config({
        title: "QUnit for `bedctl` - Test Suite"
    });
    QUnit.load(testFunctions);
    return QUnit.getHtml();
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
