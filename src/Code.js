/**
 *     __             __     __  __              dev: https://script.google.com/macros/s/AKfycbywi--ZtHqUjzcCQcWXvpcbzFHjhGl8H0Epyd5p6hHa/dev
 *    / /_  ___  ____/ /____/ /_/ /        dev-tests: https://script.google.com/macros/s/AKfycbywi--ZtHqUjzcCQcWXvpcbzFHjhGl8H0Epyd5p6hHa/dev?route=tests
 *   / __ \/ _ \/ __  / ___/ __/ /     dev-callsheet: https://script.google.com/macros/s/AKfycbywi--ZtHqUjzcCQcWXvpcbzFHjhGl8H0Epyd5p6hHa/dev?route=callsheet
 *  / /_/ /  __/ /_/ / /__/ /_/ /               prod: https://script.google.com/macros/s/AKfycbyHCsKSaoJji7xnneSo4MTY4jB5j8xrHPnsYnQp2XMdEZF1oyK2/exec
 * /_.___/\___/\__,_/\___/\__/_/      prod-callsheet: https://script.google.com/macros/s/AKfycbyHCsKSaoJji7xnneSo4MTY4jB5j8xrHPnsYnQp2XMdEZF1oyK2/exec?route=callsheet
 *                                        prod-tests: https://script.google.com/macros/s/AKfycbyHCsKSaoJji7xnneSo4MTY4jB5j8xrHPnsYnQp2XMdEZF1oyK2/exec?route=tests
 *                                    spreadsheet-db: https://docs.google.com/spreadsheets/d/17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8/edit#gid=810033239
 *                                        executions: https://script.google.com/home/projects/13LYGFiiS6aAY7auHNST2CTrffKoTx5oL5HSGmFNYMK5IIU4NgOGt7VAU/executions
**/

/**
 * GET endpoint, should return HTML of an interactive webpage
 *
 * @param {HtmlService Event Object} e provided by Google, in the event this webapp's URL is issued a GET request
 * @returns {HtmlService.HtmlOutput} HTML code of an interactive webpage
 */
const doGet = e => new Omnitool(e).getPage(e);
// end doGet(e)

/**
 * POST endpoint, should handle POST request, and send back a response
 *
 * @param {HtmlService Event Object} e event object, should contain details of the POST body
 * @returns {ContentService.textOutput} response to POST request
 */
const doPost = e => new Omnitool(e).handlePostRequest();
// end doPost(e)

/**
 * runQUnitTests()
 *
 * @param {HtmlService Event Object} e event object, should contain details of the POST body
 * @returns {HtmlService HtmlOutput} QUnit unit test results
 */
const runQUnitTests = (e) => {
    QUnit.helpers(this);
    QUnit.urlParams(e.parameter);
    QUnit.config({
        title: "QUnit tests for bedctl - Test suite" // set title of the test page
    });
    QUnit.load(UnitTests.testFunctions);
    return QUnit.getHtml();
} // end runQUnitTests(e)

/**
 * CLASS: Omnitool - should handle which website data to return to `doGet(e)` function
 */
class Omnitool {

    /**
     * get all properties of this object from "data" sheet of database spreadsheet
     *
     * @param {HtmlOutput Event Object} e the event object
     */
    constructor(e) {
        SpreadsheetApp.openById('17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8')
        .getSheetByName('data').getDataRange().getValues()
        .forEach(arr => {
            this[arr[0]] = arr[1];
        });
        this.event = e || {};
    }

    getHtmlOutput(content) {
        let output = HtmlService.createHtmlOutput();
        if (this.useBootSwatchStyles) {
        output.append('<link rel="stylesheet" href="https://bootswatch.com/4/cerulean/bootstrap.min.css">');
        }
        output.append("<div id=\"siteContainer\" class=\"container\">");
        output.append(content);
        output.append("</div>");
        return output;
    }

    getOmnitoolHtmlOutput() {
        return this.getHtmlOutput(`<pre>${JSON.stringify({omnitool: this},null,4)}<\/pre>`);
    }

    getHomeHtmlOutput() {
        return this.getHtmlOutput('<h2>Home</h2>');
    }

    getCallsheetHtmlOutput() {
        let content = '<h2>Callsheet</h2>';
        let amionData = new AmionData();
        content += amionData.getCallsheetTable();
        return this.getHtmlOutput(content);
    }

    handleRoute(route) {
        route = route || this.event.parameter.route || this.defaultRoute;
        switch (route) {
        case "home": return this.getHomeHtmlOutput();
        case "omnitool": return this.getOmnitoolHtmlOutput();
        case "callsheet": return this.getCallsheetHtmlOutput();
        default: throw new Error(`route not handled -- ${route}`);
        }
    }

    getPage(e) {
        e = e || {parameter: {route: this.defaultRoute}};
        let route = e.parameter.route || this.defaultRoute;
        if (route === 'tests') {
        return runQUnitTests(e.parameter);
        } else {
            try {
                return this.handleRoute(route);
            } catch(err) {
                Logger.log(err);
                return HtmlService.createHtmlOutput(`<p><code>[${err.name}]: ${err.message}<\/code><\/p>`);
            }
        }
    }

    handlePostRequest(e) {
        return ContentService.createTextOutput(`e: ${JSON.stringify(e,null,4)};`);
    }
} // end class Omnitool()

/**
 * CLASS: AmionData - should provide the callsheet data
 */
class AmionData {

    constructor(e) {
        this.eventObject = e || {}; // set default object
        this.url = 'https://amion.com/cgi-bin/ocs';
        this.queryString = {
        loginString: 'Lo=seton+bb16',
        reportCodeString: 'Rep=619tabs-'
        };
        let omnitool = new Omnitool(e);
        this.omnitool = omnitool;
        let thisSpreadsheet = SpreadsheetApp.openById(omnitool.spreadsheetId);
        this.db_spreadsheet = thisSpreadsheet;
        this.includedDivisions = thisSpreadsheet.getSheetByName('includedDivisions').getDataRange().getValues()
            .map(fields => fields[0])
            .filter(str => str !== "");
        this.db_spreadsheet_data = thisSpreadsheet.getSheetByName('amionData').getDataRange().getValues()
    }

    updateSpreadsheetData() {
        this.db_spreadsheet.getSheetByName('amionData').getRange(1, 1, this.db_spreadsheet_data.length, 2).setValues(this.db_spreadsheet_data)
    }

    getUrlFetchCount() {
        return this.db_spreadsheet_data.filter(items => items[0] === 'urlFetchCount')[0][1];
    }

    incrementUrlFetchCount() {
        let newFetchCount = this.getUrlFetchCount() + 1;
        this.db_spreadsheet_data.map(items => {
            let newArr = items;
            if (items[0] === 'urlFetchCount') {
                newArr = [items[0], newFetchCount];
            }
            return newArr;
        });
        this.updateSpreadsheetData();
    }

    getAmionFetchUrl() {
        return `${this.url}?${this.queryString.loginString}&${this.queryString.reportCodeString}`;
    }

    getAmionUrl() {
        return `${this.url}?${this.queryString.loginString}`;
    }

    processNameParts(nameStr) {
        let parts = nameStr.split(/,? /); 
        parts = parts.map(str => str.trim());   // trim whitespace from all array parts
        parts = parts.filter(str => str != ''); // filter out blank strings
        if (!nameStr.includes(",")) {
            if (parts.length === 2) {
                parts = [parts[1], parts[0]];
            } else if (parts.length === 3) {
                parts = [parts[2], parts[0], parts[1]];
            } else {
                let lastName = parts.pop();
                parts = [lastName, ...parts];
            }
        }
        return parts;
    }

    fetchAmionData() {
        try {
            let response = UrlFetchApp.fetch(getAmionFetchUrl());
            if (response.responseCode === 200) {
                return response;
            } else {
                throw new Error('invalid response code -- ' + JSON.stringify(response,null,4));
            }
        } catch(err) {
            Logger.log(err);
            return omnitool.getHtmlOutput(`<p>[${err.name}]: ${err.message} (${err.errno})`);
        }
    }

    fetchMockSampleData() {
        let sampleOutput = {
            "Cardiology STEMI": [["one",1],["two",2],["three",3]],
            "Neurology-StrokeTC": [["one",1],["two",2],["three",3]],
            "OtherService": [["one",1],["two",2],["three",3]]
        };
        return sampleOutput;
    }

    parseAmionData(handler) {
        try {
            return handler();
        } catch(err) {
            throw err;
        }
    }

    parseAmionDataAsTable(handler) {
        handler = handler || this.fetchMockSampleData;
        let amionData
        try {
            amionData = this.parseAmionData(handler);
        } catch(err) {
            Logger.log(err);
            let errData = this.omnitool.getHtmlOutput(`<p>[${err.name}]: ${err.message}`).getContent()
            return `<table>${errData}<\/table>`;
        }

        let output = '<table>';
        for (let prop in amionData) {
            if (!this.includedDivisions.includes(prop)) continue;
            output += `<tr>`
            output += `<th colspan="2">${prop}</th>`
            output += `</tr>`
            for (let key in amionData[prop]) {
                let thisArr = amionData[prop][key];
                output += `<tr>`
                output += `<th>${thisArr[0]}</th>`;
                output += `<td>${thisArr[1]}</td>`;
                output += `</tr>`
            }
        }
        output += '</table>';
        return output;
    }

    getCallsheetTable() {
        let requestDateTime = new Date();
        let callsheetData = '';
        callsheetData += '<dl>';
        callsheetData += '<dt>request time</dt><dd>' + requestDateTime + '</dd>';
        callsheetData += `<dt>go to Amion.com</dt><dd><a href="${this.getAmionUrl()}" target="_blank">link</a>`
        callsheetData += '</dl>';
        try {
            callsheetData += this.parseAmionDataAsTable(this.fetchMockSampleData);
        } catch(err) {
            Logger.log(err);
            return this.omnitool.getHtmlOutput(`<p>[${err.name}]: ${err.message}`).getContent();
        }
        return callsheetData;
    }
} // end class AmionData()

/**
 * CLASS: UnitTests
 */
class UnitTests {
    
    /**
     * test functions to include on QUnit Unit Testing. load with: `QUnit.load(UnitTests.testFunctions)`
     */
    static testFunctions() {
        UnitTests.testingOmnitoolInitialization();
        UnitTests.testingOmnitoolGetHtmlOutput();
        UnitTests.testingOmnitoolGetOmnitoolHtmlOutput();
        UnitTests.testingOmnitoolGetHomeHtmlOutput();
        UnitTests.testingOmnitoolHandleRoute();
        UnitTests.testingOmnitoolGetPage();
        UnitTests.testingOmnitoolHandlePostRequest();
        UnitTests.testingAmionDataClassInitialization();
        UnitTests.testingAmionDataClassHelperFunctions();
    } // end testFunctions()

    /**
     * test Omnitool initialization
     */
    static testingOmnitoolInitialization() {
        let omnitool = new Omnitool(),
            thisSpreadsheetId = '17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8',
            siteTitle = 'bedctl',
            defaultRoute = 'tests',
            useBootSwatchStyles = true;
        QUnit.test("Omnitool Initialization testing", function() {
            expect(7);
            equal(typeof omnitool, 'object', "should initialize as new object");
            equal(typeof omnitool.event, 'object', "should initialize with event object");
            equal(omnitool.siteTitle, siteTitle, "should have site title - " + siteTitle);
            equal(omnitool.spreadsheetId, thisSpreadsheetId, "should initialize with correct spreadsheet ID -- " + thisSpreadsheetId);
            equal(omnitool.defaultRoute, defaultRoute, "should initialize with default route -- " + defaultRoute);
            equal(typeof omnitool.useBootSwatchStyles, 'boolean', "should have bootswatchStyles boolean -- " + useBootSwatchStyles);
            equal(omnitool.useBootSwatchStyles, useBootSwatchStyles, "should have bootswatchStyles -- " + useBootSwatchStyles);
        });
    } // end testingOmnitoolInitialization()
    
    /**
     * test Omnitool helperFunction -- getHtmlOutput()
     */
    static testingOmnitoolGetHtmlOutput() {
        let omnitool = new Omnitool();
        QUnit.test( "Omnitool getHtmlOutput method tests", function() {
            expect(1);
            equal(typeof omnitool.getHtmlOutput(), "object", "method (getHtmlOutput()) returns object");
        });
    } // end testingOmnitoolGetHtmlOutput()

    /**
     * test Omnitool helperFunction -- getOmnitoolHtmlOutput()
     */
    static testingOmnitoolGetOmnitoolHtmlOutput() {
        let omnitool = new Omnitool();
        QUnit.test( "Omnitool getOmnitoolHtmlOutput method tests", function() {
            expect(1);
            equal(typeof omnitool.getOmnitoolHtmlOutput(), "object", "method (getOmnitoolHtmlOutput()) returns object");
        });
    } // end testingOmnitoolGetOmnitoolHtmlOutput()

    /**
     * test Omnitool helperFunction -- getHomeHtmlOutput()
     */
    static testingOmnitoolGetHomeHtmlOutput() {
        let omnitool = new Omnitool();
        QUnit.test( "Omnitool getHomeHtmlOutput method tests", function() {
            expect(1);
            equal(typeof omnitool.getHomeHtmlOutput(), "object", "method (getHomeHtmlOutput()) returns object");
        });
    }  // end testingOmnitoolGetHomeHtmlOutput()

    /**
     * test Omnitool helperFunction -- handleRoute(route)
     */
    static testingOmnitoolHandleRoute() {
        let omnitool = new Omnitool();
        QUnit.test( "Omnitool handleRoute method tests", function() {
            expect(1);
            equal(typeof omnitool.handleRoute('home'), "object", "method (handleRoute(route)) returns object");
        });
    } // end testingOmnitoolHandleRoute()

    /**
     * test Omnitool helperFunction -- getPage(e)
     */
    static testingOmnitoolGetPage() {
        let omnitool = new Omnitool(),
            defaultEventObj = {parameter: {route: 'home'}};
        QUnit.test( "Omnitool getPage method tests", function() {
            expect(1);
            equal(typeof omnitool.getPage(defaultEventObj), "object", "method (getPage(e)) returns object");
        });
    } // end testingOmnitoolGetPage()

    /**
     * test Omnitool helperFunction -- handlePostRequest(e)
     */
    static testingOmnitoolHandlePostRequest() {
        let omnitool = new Omnitool();
        QUnit.test( "Omnitool handlePostRequest method tests", function() {
            expect(1);
            equal(typeof omnitool.handlePostRequest(), "object", "method (handlePostRequest(e)) returns object");
        });
    } // end testingOmnitoolHandlePostRequest()

    /**
     * test AmionData initialization
     */
    static testingAmionDataClassInitialization() {
        let amionData = new AmionData(),
            omnitool = new Omnitool(),
            correctFetchUrl = 'https://amion.com/cgi-bin/ocs?Lo=seton+bb16&Rep=619tabs-',
            correctUrl = 'https://amion.com/cgi-bin/ocs?Lo=seton+bb16',
            getCallsheetDataReturnValue = amionData.getCallsheetTable(),
            targetSpreadsheet = SpreadsheetApp.openById(omnitool.spreadsheetId),
            includeDivisions = targetSpreadsheet.getSheetByName('includedDivisions').getDataRange().getValues().map(fields => fields[0]);
        QUnit.test( "AmionData Initialization testing", function() {
            expect(13);
            equal(amionData.url, 'https://amion.com/cgi-bin/ocs', "should instantiate with URL");
            equal(typeof amionData.queryString, typeof {}, "should instantiate object");
            equal(typeof amionData.eventObject, typeof {}, 'amionData.eventObject should contain eventObject');
            equal(typeof amionData.parseAmionDataAsTable(amionData.fetchMockSampleData), 'string', "parseAmionDataAsTable() method should return a string");
            equal(typeof getCallsheetDataReturnValue, 'string', "getCallsheetTable() method should return a string");
            equal((getCallsheetDataReturnValue.includes('<table>') && getCallsheetDataReturnValue.includes('</table>')), true, "getCallsheetTable() method should return a string containing HTML Table");
            equal(typeof amionData.db_spreadsheet, typeof targetSpreadsheet, '"db_spreadsheet" property opens specified db_spreadysheet_id -- type is equal');
            equal(amionData.queryString.loginString, 'Lo=seton+bb16', "should instantiate with login string key equal to \"seton bb16\" URL encoded");
            equal(amionData.queryString.reportCodeString, 'Rep=619tabs-', "should instantiate with report code string key equal to \"619tabs-\" URL encoded");
            equal(amionData.getAmionFetchUrl(), correctFetchUrl, "should instantiate with full fetch URL as -> " + correctFetchUrl);
            equal(amionData.getAmionUrl(), correctUrl, "should instantiate with full Amion URL as -> " + correctUrl);
            deepEqual(amionData.db_spreadsheet, targetSpreadsheet, '"db_spreadsheet" property opens specified db_spreadysheet_id -- deepEquals');
            deepEqual(amionData.includedDivisions, includeDivisions, `included divisions are as expected: ${JSON.stringify(amionData.includedDivisions)}`);
        });
    } // end testingAmionDataClassInitialization()

    /**
     * test AmionData helperFunction -- processNameParts(nameStr)
     */
    static testingAmionDataClassHelperFunctions() {
        let amionData = new AmionData(),
            omnitool = new Omnitool(),
            lastName = "Dait",
            firstName = "Kenneth",
            middleInitial = "P.",
            testNames = [
                "Kenneth Dait:2",
                "Dait, Kenneth:2",
                "Kenneth P. Dait:3",
                "Dait, Kenneth P.:3",
                "Kenneth    Dait:2",
                "Kenneth P.    Dait:3"
            ];
        QUnit.test("AmionData Helper Method -- processNameParts(nameStr) -- testing", function() {
            expect(testNames.length * 3 + testNames.filter(str => str.includes(middleInitial)).length);
            for (let nameStr of testNames) {
                let name = nameStr.split(":")[0];
                let nameLength = nameStr.split(":")[1];
                let result = amionData.processNameParts(name);
                equal(result.length, nameLength, `process name ("${name}") into ${nameLength} parts : ${JSON.stringify(result)}`);
                equal(result[0], lastName, `field one of parts (of: ${name}) should be "${lastName}"`);
                equal(result[1], firstName, `field two of parts (of: ${name}) should be "${firstName}"`);
                if (nameLength > 2) {
                    equal(result[2], middleInitial, `field three of parts (of: ${name}) should be "${middleInitial}"`);
                }
            }
        });
    } // end testingAmionDataClassHelperFunctions()

} // end class UnitTests()

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