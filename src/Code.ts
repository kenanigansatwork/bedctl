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

declare namespace QUnit {
    let helpers: any,
        config: any,
        load: any,
        getHtml: any,
        qunitTestFunction: () => {
            expect: any,
                equal: any,
                deepEqual: any;
        },
        test: (str:string,cb:() => {}) => {};
};

declare interface getRequestEvent {
    parameter: {
        route: string
    };
    parameters: Object;
    queryString: string;
}

/**
 * GET endpoint
 * @param {getRequestEvent} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML code of specified web page
 */
const doGet = (e: getRequestEvent): GoogleAppsScript.HTML.HtmlOutput => {
    return processGetRequest(e || {});
}

/**
 * Process GET request (call from doGet(e))
 * @param {getRequestEvent} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} HTML output of specified webpage;
 */
function processGetRequest(e: getRequestEvent): GoogleAppsScript.HTML.HtmlOutput {
    // assign default route
    // - route should be string property of the object property "parameter" of the event object (e)
    let defaultRoute = 'home'
    let route = e.parameter.route || defaultRoute;
    
    try {
        switch (route) {
            case 'tests': return runQUnit(e);
            case 'callsheet': return new Omnitool(e).getCallsheetHtmlOutput();
            case 'home': return new Omnitool(e).getHomePage();
            default: return new Omnitool(e).getHomePage();
        }
    } catch(err) {
        Logger.log(err);
        return HtmlService.createHtmlOutput(`<strong>${err.name}</strong>: ${err.message}`);
    }
}

/**
 * CLASS: Omnitool
 */
class Omnitool {
    
    e: object;
    spreadsheetId: string;
    
    constructor(e:any) {
        this.e = e;
        this.spreadsheetId = '17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8';
    }

    getHtmlOutput():GoogleAppsScript.HTML.HtmlOutput {
        return HtmlService.createHtmlOutput()
            .append('<link rel="stylesheet" href="https://bootswatch.com/4/cerulean/bootstrap.min.css">');
    }

    getCallsheetHtmlOutput():GoogleAppsScript.HTML.HtmlOutput {
        let amionData = new AmionData(this.spreadsheetId);
        return this.getHtmlOutput()
            .append('<div id="siteContainer" class="container"><h1>callsheet</h2>')
            .append(amionData.getHtmlTableData())
            .append('</div>');
    }

    getHomePage():GoogleAppsScript.HTML.HtmlOutput {
        return HtmlService.createHtmlOutput('<h1>Home - bedctl</h2>');
    }
}

/**
 * CLASS: AmionData
 */
class AmionData {
    
    url: Object;
    getUrl: Function;
    getFetchUrl: Function;
    fetchData: any;
    doctorNumbers: any;
    spreadsheetId: string;
    parsedFetchData: Object[];
    includedServices: String[];
    requestDateTime: Date;
    headers: String[];

    constructor() {

        this.url = {
            base: 'https://amion.com/cgi-bin/ocs',
            queryString: {
                loginStr: 'Lo=seton+bb16',
                reportStr: 'Rpt=619tabs--'
            }
        }
        this.spreadsheetId = '17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8';
        this.getUrl = function() { return `${this.url.base}?${this.url.queryString.loginStr}`; };
        this.getFetchUrl = function() { return `${this.url.base}?${this.url.queryString.loginStr}&${this.url.queryString.reportStr}`; };
        this.doctorNumbers = this.fetchDoctorNumbers();
        this.includedServices = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName('includedDivisions')
            .getRange(1,1,SpreadsheetApp.openById(this.spreadsheetId).getSheetByName('includedDivisions').getLastRow(),1)
            .getValues()
            .map(arr => arr[0]);
        this.requestDateTime = new Date;

        try {
            this.fetchData = this.fetchAmionData();
            this.parsedFetchData = this.parseData();
        } catch(err) {
            Logger.log('amionData.constructor Error: ', err)
            this.fetchData = 'amionData.constructor Error: ', JSON.stringify(err);
        }
    }

    fetchDoctorNumbers(): Array<any> {
        let dataSheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName('doctorNumbers'),
            data = dataSheet.getRange(2,1,dataSheet.getLastRow(),dataSheet.getLastColumn())
                .getValues();
        return data;
    }
    
    fetchAmionData():string {
        let res
        try {
            res = UrlFetchApp.fetch(this.getFetchUrl());
            if (res.getResponseCode() === 200) {
                return res.getContentText();
            } else {
                const err = new Error('amionData.fetchAmionData Error: response code was not 200 -- ' + JSON.stringify(res));
                throw err;
            }
        } catch(err) {
            Logger.log('amionData.fetchAmionData Error: ', err)
            throw err;
        }
    }

    parseData(): Object[] {
        // return JSON.stringify(this.doctorNumbers.filter(arr => arr[0] !== ""), null, 4);
        let lines = this.fetchData.split('\n');
        lines = lines.map(arr => arr.split('\t'));
        const headers: String[] = lines.shift();
        if (!this.headers) this.headers = headers;
        const outputArr:Object[] = [];
        for (let k in lines) {
            let thisVal: String[] = lines[k],
                thisObj:Object = {};
            for (let k2 in thisVal) {
                let thisValVal:String =  thisVal[k2],
                    thisHeader:String = headers[k2]
                thisObj[`${thisHeader}`] = thisValVal;
                if (thisHeader === 'Staff_Name')  {
                    thisObj[`${thisHeader}_Parts`] = this.processNameParts(thisValVal);
                }
            }
            outputArr.push(thisObj);
        }
        return outputArr;
    }

    parseFilteredData(): Object[] {
        return this.parseData().filter(thisObj => this.includedServices.includes(thisObj['Division']));
    }

    getData(): Object[] {
        return this.parseFilteredData();
    }

    getDateParts(dateStr,startTimeStr:string,endTimeStr) {
        let startHH = parseInt(startTimeStr.substring(0,2)),
            startMM = parseInt(startTimeStr.substring(2,4)),
            endHH = parseInt(endTimeStr.substring(0,2)),
            endMM = parseInt(endTimeStr.substring(2,4));
        let startDateYY = parseInt("20" + dateStr.split('-')[2]),
            startDateM = parseInt(dateStr.split('-')[1]),
            startDateD = parseInt(dateStr.split('-')[0]);

        let startDate = new Date(startDateYY,startDateM,startDateD,startHH,startMM,0,0);
        
        let endDateYY = startDateYY,
            endDateM = startDateM,
            endDateD = (startHH < endHH) ? startDateD : startDateD + 1;

        let endDate = new Date(endDateYY,endDateM,endDateD,endHH,endMM,0,0);
        return [startDate,endDate];
    }

    getStaffNumber(service,nameStr): String {
        let nameParts = this.processNameParts(nameStr);
        let [lastName,firstName,...rest] = nameParts;
        let result;
        result = this.doctorNumbers.filter(arr => arr[0] == service;);
        let result2 = result.filter(arr => arr[1] == lastName);
        let result3 = result2.filter(arr => arr[2] == firstName)[0];
        let output = result3 ? result3[result3.length - 1] : 'ERR';
        if (output === 'ERR') {
            
        }
        return output;
    }

    getDateStr(date:Date) {
        function padToTwoWithZeroes(str) {
            let input = str.toString();
            if (str.length >= 2) { return input; };
            while (input.length < 2) {
                input = "0" + input;
            }
            return input;
        }

        let days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'],
            HH = padToTwoWithZeroes(date.getHours()),
            MM = padToTwoWithZeroes(date.getMinutes()),
            dayStr = days[date.getDay()];
        return `${dayStr} ${HH}:${MM}`;
    }

    getNumberLinkHtml(numberStr:string):string {
        const localAreaCode = '512';
        if (numberStr.length < 10) return numberStr;
        let numberStr2 = numberStr.replace(/[-._]/g,"");
        const areaCode = numberStr2.toString().substr(0,3);
        const middleNumbers = numberStr2.toString().substr(3,3);
        const lastNumbers = numberStr2.toString().substr(6,4);
        let href = "callto: "
        if (areaCode === localAreaCode) {
            href += '9-';
        } else {
            href += '91-';
        }
        href += areaCode + '-' + middleNumbers + '-' + lastNumbers;
        let textNumber = `${areaCode}-${middleNumbers}-${lastNumbers}`;
        return `<a href="${href}">${textNumber}<\/a>`;
    }

    parseDataToTableOutputArray(thisService,data) {
        let processedData1 = data
            .filter(o => o['Division'] == thisService)
            .map((fields) => {
                const {,Staff_Name,,Staff_Bid,Shift_Name,,,Date,Start_Time,End_Time} = fields;
                let nameParts: String[] = this.processNameParts(Staff_Name);
                let nameStr: String = `${nameParts[1]?nameParts[1]+" ":""}${nameParts[0]}`;
                let staffNumber: String;
                if (nameStr.match(/^(Call )?[0-9][0-9-]+$/)) {
                    nameStr = nameStr.replace(/^(Call )/,"");
                    staffNumber = nameStr.replace(/^(Call )/,"").replace(/[-_.,;]/g,"");
                } else {
                    staffNumber = this.getStaffNumber(thisService,Staff_Name);
                }
                let staffNumberLink = this.getNumberLinkHtml(staffNumber);
                let [startDate,endDate]: Date[] = this.getDateParts(Date,Start_Time,End_Time);
                let shiftDateStr: String = `${this.getDateStr(startDate)} &ndash; ${this.getDateStr(endDate)}`;
                let returnVal: Array<any> = [
                    Shift_Name,
                    shiftDateStr,
                    nameStr,
                    staffNumberLink
                ];
                return returnVal;
            });

        let processedData2 = processedData1
            .map(fields => {
                let returnFields = fields;
                if (fields[0] === 'DCMC Pediatric Hospital Medicine PCRS 709-3293') {
                    returnFields[0] = "DCMC PCRS Hospitalist";
                    returnFields[2] = "PCRS";
                }
                return returnFields;
            });
        return processedData1;
    }

    getHtmlTableData():string {
        //return `<table><tr><th>fetchData<\/th><td>${this.getData()}<\/td><\/tr><\/table>`;
        let data = this.getData();
        //return `<pre>${JSON.stringify(data,null,4)}<\/pre>`;
        let output = '<table>';
        for (let k1 in this.includedServices) {
            let thisService = this.includedServices[k1];
            let theseObj: any = this.parseDataToTableOutputArray(thisService,data);
            theseObj.sort();
            output += '<tr><th colspan="' + theseObj.length.toString() + '">' + thisService + '</th></tr>';
            for (let k2 in theseObj) {
                let fields = theseObj[k2];
                output += '<tr>'
                for (let k3 in fields) {
                    let field = fields[k3];
                    output += '<td>' + field + '</td>';
                }
                output += '</tr>'
            }
        }
        output += '</table>';
        return output;
    }

    processNameParts(nameStr:String): String[] {
        let parts = nameStr.split(/,? /g); 
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
}

/**
 * Runs QUnit unit tests, and returns the results as HtmlOutput
 * @param {GoogleAppsScript.Events.DoGet} e event object of GET request
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML of QUnit tests
 */
function runQUnit(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
    QUnit.helpers(this);

    QUnit.config({
        title: "QUnit for `bedctl` - Test Suite"
    });
    QUnit.load(testFunctions);
    return QUnit.getHtml();

    function testFunctions() {
        testingOmnitoolInitialization();
        testingOmnitoolGetCallsheetMethod();
        testingOmnitoolGetHomePageMethod();
        testingAmionDataInitialization();
        testingAmionDataMethodsFetchDoctorNumbers();
        testingAmionDataMethodsFetchAmionData();
        testingAmionDataMethodsParseData();
        testingAmionDataMethodsGetData();
        testingAmionDataMethodsGetHtmlTableData();
        testingAmionDataMethodsprocessNameParts();
    }

    function testingOmnitoolInitialization() {
        QUnit.test( "omnitool initialization testing", function() {
            let omnitool = new Omnitool({}),
                correctSpreadsheetId = '17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8';
            expect(3);
            equal(typeof omnitool,'object','initializes a new object');
            equal(typeof omnitool.e, 'object', 'initializes with an event object (e)');
            equal(omnitool.spreadsheetId, correctSpreadsheetId, 'initializes with the correct spreadsheetId - ' + correctSpreadsheetId);
        });
    }

    function testingOmnitoolGetCallsheetMethod() {
        QUnit.test( "omnitool mehod testing - getCallsheetHtmlOutput", function() {
            let omnitool = new Omnitool({}),
                result = omnitool.getCallsheetHtmlOutput();
            expect(1);
            equal(typeof result, 'object', 'initializes a new object');
        });
    }

    function testingOmnitoolGetHomePageMethod() {
        QUnit.test( "omnitool mehod testing - getHomePage", function() {
            let omnitool = new Omnitool({}),
                result = omnitool.getHomePage();
            expect(1);
            equal(typeof result, 'object', 'initializes a new object');
        });
    }

    function testingAmionDataInitialization() {
        QUnit.test('amionData initialization testing', function() {
            let amionData = new AmionData(),
                url = 'https://amion.com/cgi-bin/ocs?Lo=seton+bb16',
                fetchUrl = url + '&Rpt=619tabs--',
                correctSpreadsheetId = '17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8';
            expect(7);
            equal(typeof amionData, 'object','initializes a new object');
            equal(amionData.spreadsheetId, correctSpreadsheetId, 'initializes with correct spreadsheetId - ' + correctSpreadsheetId); 
            equal(amionData.getUrl(), url, 'initializes with web url - ' + url);
            equal(amionData.getFetchUrl(), fetchUrl, 'initializes with fetch url - ' + fetchUrl);
            equal(typeof amionData.fetchData, 'string', 'fetchData property is a string');
            equal(typeof amionData.doctorNumbers, 'object', 'fetchData property is an array object');
            equal(typeof amionData.parsedFetchData, 'object', 'parsedFetchData property is an array object');
        });
    }

    function testingAmionDataMethodsFetchDoctorNumbers() {
        QUnit.test('amionData method testing - fetchDoctorNumbers()', function() {
            let amionData = new AmionData(),
                result = amionData.fetchDoctorNumbers();
            expect(1);
            equal(typeof result, 'object', 'fetchDoctorNumbers should initialize array object');
        });
    }

    function testingAmionDataMethodsFetchAmionData() {
        QUnit.test('amionData method testing - fetchAmionData()', function() {
            let amionData = new AmionData(),
                result = amionData.fetchAmionData();
            expect(1);
            equal(typeof result, 'string', 'fetchAmionData should initialize new string');
        });
    }

    function testingAmionDataMethodsParseData() {
        QUnit.test('amionData method testing - parseData()', function() {
            let amionData = new AmionData(),
                result = amionData.parseData();
            expect(1);
            equal(typeof result, 'object', 'initializes a new object');
        });
    }

    function testingAmionDataMethodsGetData() {
        QUnit.test('amionData method testing - getData()', function() {
            let amionData = new AmionData(),
                result = amionData.getData();
            expect(1);
            equal(typeof result, 'object', 'initializes a new string');
        });
    }

    function testingAmionDataMethodsGetHtmlTableData() {
        QUnit.test('amionData method testing - getHtmlTableData()', function() {
            let amionData = new AmionData(),
                amionDataGetData = amionData.getData(),
                result = amionData.getHtmlTableData();
            expect(1);
            equal(typeof result, 'string', 'initializes a new string');
        });
    }


    /**
     * test AmionData helperFunction -- processNameParts(nameStr)
     */
    function testingAmionDataMethodsprocessNameParts() {
        let amionData = new AmionData(),
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
        QUnit.test("amionData method testing -- processNameParts(nameStr)", function() {
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
    } // end testingAmionDataMethodsprocessNameParts()

    
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
