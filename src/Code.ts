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
  * typescript definitions for QUnit library
  */
declare namespace QUnit {
    let helpers: any,
        config: any,
        load: any,
        getHtml: any,
        test: Function
    interface QUnitTest {
        test(str:string,cb:() => {}):any
    }
};

/**
 * typescript definitions GET request event object
 */
declare interface getRequestEvent {
    parameter: {
        route: string
    };
    parameters: Object;
    queryString: string;
}

/**
 * typescript definitions for globals object
 */
declare interface globals {
    String:any;
}

/**
 * global shared data
 */
const globals = {
    spreadsheetId: '17CMFjobXtUjIASHg75ps3dUhbhhaZNdLsdO5eF18MF8'
}

/**
 * GET endpoint
 * @param {getRequestEvent} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML code of specified web page
 */
const doGet = (e: getRequestEvent): GoogleAppsScript.HTML.HtmlOutput => {
    return processGetRequest(e || {parameter: {route: 'home'},parameters: {route: ['home']}, queryString: 'route=home'});
}

/**
 * Process GET request (call from doGet(e))
 * @param {getRequestEvent} e event object describing GET request parameters
 * @returns {GoogleAppsScript.HTML.HtmlOutput} HTML output of specified webpage;
 */
function processGetRequest(e: getRequestEvent): GoogleAppsScript.HTML.HtmlOutput {
    // assign default route
    // - route should be string property of the object property "parameter" of the event object (e)
    let defaultRoute:string = 'home'
    let route:string = e.parameter.route || defaultRoute;
    
    try {
        switch (route) {
            case 'tests': return runQUnitTests(e);
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
    
    /**
     * constructor for Omnitool class
     * @param {getRequestEvent} e the get request event object
     */
    constructor(e:getRequestEvent) {
        this.e = e;
        this.spreadsheetId = globals.spreadsheetId;
    }

    /**
     * returns basic HtmlOutput that should prepend any returned HtmlOutput
     * @returns {GoogleAppsScript.HTML.HtmlOutput} HtmlOutput shared header
     */
    getHtmlOutput():GoogleAppsScript.HTML.HtmlOutput {
        return HtmlService.createHtmlOutput()
            .append('<link rel="stylesheet" href="https://bootswatch.com/4/cerulean/bootstrap.min.css">');
    }

    /**
     * returns callsheet HtmlOutput
     * @returns {GoogleAppsScript.HTML.HtmlOutput} callsheet HtmlOutput data
     */
    getCallsheetHtmlOutput():GoogleAppsScript.HTML.HtmlOutput {
        let amionData = new AmionData();
        return this.getHtmlOutput()
            .append('<div id="siteContainer" class="container"><h1>callsheet</h2>')
            .append(amionData.getHtmlTableData())
            .append('</div>');
    }

    /**
     * returns home page as HtmlOutput
     * @returns {GoogleAppsScript.HTML.HtmlOutput} home page HtmlOutput data
     */
    getHomePage():GoogleAppsScript.HTML.HtmlOutput {
        return HtmlService.createHtmlOutput('<h1>Home - bedctl</h2>');
    }
}

/**
 * CLASS: AmionData
 */
class AmionData {
    
    requestDateTime: Date;
    url: Object;
    
    spreadsheetId: string;
    doctorNumbers: any;
    includedServices: string[];
    
    getUrl: Function;
    getFetchUrl: Function;
    
    fetchedData: any;
    parsedFetchData: Object[];

    parsedAmionHeaders: string[];

    /**
     * constructor for AmionData class
     * @throws throws error at failure points
     */
    constructor() {

        try {
            this.requestDateTime = new Date;
            this.url = {
                base: 'https://amion.com/cgi-bin/ocs',
                queryString: {
                    loginStr: 'Lo=seton+bb16',
                    reportStr: 'Rpt=619tabs--'
                }
            }
            this.spreadsheetId = globals.spreadsheetId;
            this.doctorNumbers = this.fetchDoctorNumbers();
            this.includedServices = this.fetchIncludedServices();
            
            this.getUrl = function() { return `${this.url.base}?${this.url.queryString.loginStr}`; };
            this.getFetchUrl = function() { return `${this.url.base}?${this.url.queryString.loginStr}&${this.url.queryString.reportStr}`; };
            
            this.fetchedData = this.fetchAmionData();
            this.parsedFetchData = this.parseAmionData();

        } catch(err) {
            Logger.log('amionData.constructor Error: ', err)
            let output = 'amionData.constructor Error: ' + JSON.stringify(err);
            this.fetchedData = output;
        }

    }

    /**
     * fetch and return includedServices from the linked spreadsheet
     * @returns {string[]} single-dimensional array of services to include on the callsheet
     */
    fetchIncludedServices(): string[] {
        let wb = SpreadsheetApp.openById(this.spreadsheetId),
            ws = wb.getSheetByName('includedDivisions'),
            range = ws.getRange(1,1,ws.getLastRow(),1);
        return range.getValues()
            .map(arr => arr[0]);
    }

    /**
     * fetch and return all of the doctor phone number data from the linked spreadsheet
     * @returns {Array<any>} the 2-dimensional data of doctor data
     */
    fetchDoctorNumbers(): Array<any> {
        let dataSheet = SpreadsheetApp.openById(this.spreadsheetId).getSheetByName('doctorNumbers'),
            data = dataSheet.getRange(2,1,dataSheet.getLastRow(),4)
                .getValues();
        return data;
    }
    
    /**
     * fetch and return the amion fetch request data as string
     * @returns {string} the amion fetch request data
     * @throws if fetch fails
     */
    fetchAmionData():string {
        let res:GoogleAppsScript.URL_Fetch.HTTPResponse
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

    /**
     * processed raw fetch data (this.fetchedData) into array of objects
     * @returns {Object[]} raw fetch data as object array
     */
    parseAmionData(): Object[] {
        // return JSON.stringify(this.doctorNumbers.filter(arr => arr[0] !== ""), null, 4);
        let lines: string[] = this.fetchedData.split('\n'),
            recordLines: Array<string[]> = lines.map(arr => arr.split('\t'));
        const headers: string[] = recordLines.shift();
        
        if (!this.parsedAmionHeaders) { this.parsedAmionHeaders = headers; }

        const outputArr: Object[] = [];
        
        for (let k in recordLines) {
            let thisVal: string[] = recordLines[k],
                thisObj:Object = {};
            for (let k2 in thisVal) {
                thisObj[`${headers[k2]}`] = thisVal[k2];
            }
            outputArr.push(thisObj);
        }
        return outputArr;
    }

    /**
     * return array of start date and end date, both as date objects
     * @param {string} dateStr amion data date string
     * @param {string} startTimeStr amion data start time string
     * @param {string} endTimeStr amion data end time string
     * @returns {Array<Date>} date array, index 0 is start date, index 1 is end date
     */
    getDateParts(dateStr,startTimeStr:string,endTimeStr): Date[] {
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

    /**
     * Provided phone number lookup, returns "ERR" if not found
     * @param {string} service specified service
     * @param {string} nameStr name string from data
     */
    getStaffNumber(service:string,nameStr:string): string {
        let nameParts: string[] = this.processNameParts(nameStr),
            [lastName,firstName,...rest] = nameParts,
            serviceResults: Array<string[]> = this.doctorNumbers.filter(arr => arr[0] == service),
            lastNameMatches: Array<string[]> = serviceResults.filter(arr => arr[1] == lastName),
            firstAndLastNameMatches: Array<string[]> = lastNameMatches.filter(arr => arr[2] == firstName),
            firstMatch: string[] = firstAndLastNameMatches[0];
        return firstMatch ? firstMatch[firstMatch.length - 1] : 'ERR';
    }

    /**
     * return string representation of a single Date object
     * @param {Date} date input date object
     */
    getDateStr(date:Date): string {
        function padToTwoWithZeroes(str:string):string {
            let input = str;
            if (str.length >= 2) { return input; };
            while (input.length < 2) { input = "0" + input; }
            return input;
        }
        function getDayOfWeek(idx:number): string {
            const days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];
            return days[idx];
        }
        let HH = padToTwoWithZeroes(date.getHours().toString()),
            MM = padToTwoWithZeroes(date.getMinutes().toString()),
            dayStr = getDayOfWeek(date.getDay());
        //return `${dayStr} ${HH}:${MM}`;
        return `${HH}:${MM}`;
    }

    /**
     * get "callto:" protocol link to specified phone number
     * @param numberStr phone number string from the data
     * @returns {string} HTML link incorporating "callto:" protocol
     */
    getNumberLinkHtml(numberStr:string):string {
        const localAreaCode = '512';
        if (numberStr.length < 10) return numberStr;
        let numberStr2 = numberStr.replace(/[-._]/g,"");
        const areaCode:string = numberStr2.toString().substr(0,3),
              middleNumbers:string = numberStr2.toString().substr(3,3),
              lastNumbers:string = numberStr2.toString().substr(6,4);
        let href:string = "callto: "
        if (areaCode === localAreaCode) {
            href += '9-';
        } else {
            href += '91-';
        }
        href += areaCode + '-' + middleNumbers + '-' + lastNumbers;
        let textNumber:string = `<code>${areaCode}-${middleNumbers}-${lastNumbers}</code>`;
        return `<a href="${href}">${textNumber}<\/a>`;
    }

    /**
     * returns string representation of shift time bounds
     * @param {Date} startDate shift start date
     * @param {Date} endDate shift end date
     * @returns {string} displayed shift range string
     */
    getDateRangeString(startDate:Date,endDate:Date):string {
        return `<code>${this.getDateStr(startDate)} &ndash; ${this.getDateStr(endDate)}</code>`
    }

    /**
     * split and normalize name string
     * @param {string} nameStr string of Provider's full name
     * @returns {string[]} array of strings, index 0 is last name, index 1 is first name
     */
    processNameParts(nameStr:String): string[] {
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

    /**
     * parse shift data for Peri-Natal service
     * @param {Array<string[]>} data shift data
     * @returns {Array<string[]>} parsed shift data
     */
    parseDataPeriNatalOutput(data: Array<string[]>): Array<string[]> {
        let input:Array<any> = data
            .filter((arr:Array<any>): boolean => !arr[1].endsWith('SMCW Maternal-Fetal'));
        return input;
    }

    /**
     * parse shift data for cardiology STEMI service
     * @param {Array<string[]>} data shift data
     * @returns {Array<string[]>} parsed shift data
     */
    parseDataCardsSTEMIOutput(data: Array<string[]>): Array<string[]> {
        let input:Array<any> = data
            .map((arr:Array<string>): Array<string> => {
                let outputArr = arr;
                if (outputArr[0].includes(" SHI")) {
                    outputArr[0] = outputArr[0].replace(/ SHI/,"");
                }
                return arr;
            });
        return input;
    }

    /**
     * parse shift data for Stroke service
     * @param {Array<string[]>} data shift data
     * @returns {Array<string[]>} parsed shift data
     */
    parseDataStrokeOutput(data: Array<any>): Array<string[]> {
        let input:Array<any> = data
            .filter((arr:Array<string>): boolean => arr[0] != 'Sound Telemedicine' && !arr[0].includes('('));
        return input;
    }

    /**
     * parse shift data for Internal Medicine service
     * @param {Array<string[]>} data shift data
     * @returns {Array<string[]>} parsed shift data
     */
    parseDataInternalMedicineOutput(data: Array<string[]>): Array<any> {
        let numbers = {
            SMCA: '5129621642',
            SMCH: '5129319694',
            SMCW: '5126889186',
            SNW: '5129691279',
            DSMCUT: '5122041218',
        }
        let dsmcutItem:Array<string> = ['DSMCUT Hospitalist On Duty']
        let input:Array<any> = data
            .filter((arr:Array<any>): boolean => {
                return !arr[0].includes('Escalation') && !arr[1].includes('Escalation')
                    && !arr[0].includes('WellMed') && !arr[1].includes('WellMed')
                    && !arr[0].includes('HIT ') && !arr[1].includes('HIT ')
                    && !arr[0].includes('SHL ') && !arr[1].includes('SHL ')
                    && !arr[0].startsWith('SSW ') && !arr[1].startsWith('SSW ')
                    && !arr[0].startsWith('DSMC-UT Morning') && !arr[1].startsWith('DSMC-UT Morning')
                    && !arr[0].startsWith('Sound Telemedicine') && !arr[1].startsWith('Sound Telemedicine');
            })
            .map((arr:Array<string>):Array<string> => {
                let output:Array<string> = arr;
                if (output[0].includes('SMCA')) {
                    output[output.length - 1] = this.getNumberLinkHtml(numbers.SMCA);
                } else if (output[0].includes('SMCH')) {
                    output[output.length - 1] = this.getNumberLinkHtml(numbers.SMCH);
                } else if (output[0].includes('SMCW')) {
                    output[output.length - 1] = this.getNumberLinkHtml(numbers.SMCW);
                } else if (output[0].includes('SNW')) {
                    output[output.length - 1] = this.getNumberLinkHtml(numbers.SNW);
                }

                if (output[0] === 'DCMC PCRS Hospitalist') {
                    dsmcutItem.push(output[1]);
                }
                return output;
            });
            dsmcutItem.push('Internal Med Pager');
            dsmcutItem.push(this.getNumberLinkHtml(numbers.DSMCUT));
        input.unshift(dsmcutItem);

        return input;
    }

    /**
     * parse shift data for Critical Care service
     * @param {Array<string[]>} data shift data
     * @returns {Array<string[]>} parsed shift data
     */
    parseDataCriticalCareOutput(data: Array<string[]>): Array<any> {
        let input:Array<any> = data
            .filter((arr:Array<any>): boolean => !arr[0].includes(' Pulmonary Consults'));
        return input;
    }

    /**
     * parse shift data for General Cardiology service
     * @param {Array<string[]>} data shift data
     * @returns {Array<string[]>} parsed shift data
     */
    parseDataCardsSHIOutput(data: Array<string[]>): Array<any> {
        let input:Array<any> = data
            .filter((arr:Array<any>): boolean => !arr[0].includes('EP SHI') && !arr[0].includes('SNW ') && !arr[0].includes('STEMI'));
        return input;
    }

    /**
     * process each service's shift data
     * @param {string} thisService name of the current service to parse
     * @param {Array<Object>} data object array of each shift on the callsheet
     * @returns {Array<string>} parsed data string array of each shift for the specified service
     */
    parseDataToTableOutputArray(thisService: string, data: Array<Object>): Array<string[]> {
        let processedData1: Array<string[]> = data
            .filter((o:Object):boolean => o['Division'] === thisService)
            .map((fields:Object):Array<string> => {
                let staffName = fields['Staff_Name'],
                    shiftName = fields['Shift_Name'],
                    shiftDate = fields['Date'],
                    shiftStartTime = fields['Start_Time'],
                    shiftEndTime = fields['End_Time'],
                    nameParts: String[] = this.processNameParts(staffName),
                    nameStr: string = `${nameParts[1] ? nameParts[1] + " " : ""}${nameParts[0]}`,
                    staffNumber: string;
                if (nameStr.match(/^(Call )?[0-9][0-9-]+$/)) {
                    nameStr = nameStr.replace(/^(Call )/,"");
                    staffNumber = nameStr.replace(/^(Call )/,"").replace(/[-_.,;]/g,"");
                } else {
                    staffNumber = this.getStaffNumber(thisService,staffName);
                }
                let staffNumberLink = this.getNumberLinkHtml(staffNumber),
                    [startDate,endDate]: Date[] = this.getDateParts(shiftDate,shiftStartTime,shiftEndTime),
                    shiftDateStr: string = this.getDateRangeString(startDate,endDate);
                return [
                    shiftName,
                    shiftDateStr,
                    nameStr,
                    staffNumberLink
                ];
            });

        let processedData2: Array<string[]> = processedData1
            .map((fields: Array<any>): Array<any> => {
                let returnFields = fields;
                if (fields[0] === 'DCMC Pediatric Hospital Medicine PCRS 709-3293') {
                    returnFields[0] = "DCMC PCRS Hospitalist";
                    returnFields[2] = "PCRS";
                }
                return returnFields;
            });

        switch (thisService) {
            case "Internal Medicine":       return this.parseDataInternalMedicineOutput(processedData2);
            case "Critical Care/Pulmonary": return this.parseDataCriticalCareOutput(processedData2);
            case "Cardiology SHI":          return this.parseDataCardsSHIOutput(processedData2);
            case "Peri-Natal":              return this.parseDataPeriNatalOutput(processedData2);
            case "Cardiology STEMI":        return this.parseDataCardsSTEMIOutput(processedData2);
            case "Neurology-StrokeTC":      return this.parseDataStrokeOutput(processedData2);
            default:                        return processedData2;
        }
    }

    /**
     * gets the raw stored data
     * @returns {Object[]} the stored callsheet data, array of objects
     */
    getData(): Object[] {
        return this.parsedFetchData;
    }

    /**
     * forms the callsheet data as HTML table
     * @returns {string} HTML table data as string
     */
    getHtmlTableData():string {
        let data = this.getData();
        // begin table HTML
        let output = '<table>';
        for (let k1 in this.includedServices) {
            let thisService:string = this.includedServices[k1];
            let theseObj: any = this.parseDataToTableOutputArray(thisService,data);
            theseObj.sort();
            // adding header row for service
            output += '<tr><th colspan="' + theseObj.length.toString() + '">' + thisService + '</th></tr>';
            for (let k2 in theseObj) {
                let fields = theseObj[k2];
                // adding new row for shift
                output += '<tr>'
                for (let k3 in fields) {
                    let field = fields[k3];
                    // adding each cell for shift
                    output += '<td>' + field + '</td>';
                }
                // end new shift row
                output += '</tr>'
            }
        }
        // end table tag
        output += '</table>';
        return output;
    }
}

/**
 * Runs QUnit unit tests, and returns the results as HtmlOutput
 * @param {GoogleAppsScript.Events.DoGet} e event object of GET request
 * @returns {GoogleAppsScript.HTML.HtmlOutput} contains HTML of QUnit tests
 */
function runQUnitTests(e: getRequestEvent): GoogleAppsScript.HTML.HtmlOutput {
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

    /**
     * test Omnitool initialization
     */
    function testingOmnitoolInitialization() {
        QUnit.test( "omnitool initialization testing", function() {
            let event: getRequestEvent = {parameter: {route: 'home'},parameters: {route: ['home']}, queryString: 'route=home'},
                omnitool: Omnitool = new Omnitool(event),
                correctSpreadsheetId: string = globals.spreadsheetId;
            expect(3);
            equal(typeof omnitool,'object','initializes a new object');
            equal(typeof omnitool.e, 'object', 'initializes with an event object (e)');
            equal(omnitool.spreadsheetId, correctSpreadsheetId, 'initializes with the correct spreadsheetId - ' + correctSpreadsheetId);
        });
    }

    /**
     * test Omnitool method: getCallsheetHtmlOutput
     */
    function testingOmnitoolGetCallsheetMethod() {
        QUnit.test( "omnitool mehod testing - getCallsheetHtmlOutput", function() {
            let omnitool = new Omnitool({}),
                result = omnitool.getCallsheetHtmlOutput();
            expect(1);
            equal(typeof result, 'object', 'initializes a new object');
        });
    }

    /**
     * test Omnitool method: getHomePage
     */
    function testingOmnitoolGetHomePageMethod() {
        QUnit.test( "omnitool mehod testing - getHomePage", function() {
            let omnitool = new Omnitool({}),
                result = omnitool.getHomePage();
            expect(1);
            equal(typeof result, 'object', 'initializes a new object');
        });
    }

    /**
     * test AmionData initialization
     */
    function testingAmionDataInitialization() {
        QUnit.test('amionData initialization testing', function() {
            let amionData = new AmionData(),
                url = 'https://amion.com/cgi-bin/ocs?Lo=seton+bb16',
                fetchUrl = url + '&Rpt=619tabs--',
                correctSpreadsheetId = globals.spreadsheetId;
            expect(7);
            equal(typeof amionData, 'object','initializes a new object');
            equal(amionData.spreadsheetId, correctSpreadsheetId, 'initializes with correct spreadsheetId - ' + correctSpreadsheetId); 
            equal(amionData.getUrl(), url, 'initializes with web url - ' + url);
            equal(amionData.getFetchUrl(), fetchUrl, 'initializes with fetch url - ' + fetchUrl);
            equal(typeof amionData.fetchedData, 'string', 'fetchData property is a string');
            equal(typeof amionData.doctorNumbers, 'object', 'fetchData property is an array object');
            equal(typeof amionData.parsedFetchData, 'object', 'parsedFetchData property is an array object');
        });
    }

    /**
     * test AmionData method: fetchDoctorNumbers
     */
    function testingAmionDataMethodsFetchDoctorNumbers() {
        QUnit.test('amionData method testing - fetchDoctorNumbers()', function() {
            let amionData = new AmionData(),
                result = amionData.fetchDoctorNumbers();
            expect(1);
            equal(typeof result, 'object', 'fetchDoctorNumbers should initialize array object');
        });
    }

    /**
     * test AmionData method: fetchAmionData
     */
    function testingAmionDataMethodsFetchAmionData() {
        QUnit.test('amionData method testing - fetchAmionData()', function() {
            let amionData = new AmionData(),
                result = amionData.fetchAmionData();
            expect(1);
            equal(typeof result, 'string', 'fetchAmionData should initialize new string');
        });
    }

    /**
     * test AmionData method: parseAmionData
     */
    function testingAmionDataMethodsParseData() {
        QUnit.test('amionData method testing - parseData()', function() {
            let amionData = new AmionData(),
                result = amionData.parseAmionData();
            expect(1);
            equal(typeof result, 'object', 'initializes a new object');
        });
    }

    /**
     * test AmionData method: getData
     */
    function testingAmionDataMethodsGetData() {
        QUnit.test('amionData method testing - getData()', function() {
            let amionData = new AmionData(),
                result = amionData.getData();
            expect(1);
            equal(typeof result, 'object', 'initializes a new string');
        });
    }

    /**
     * test AmionData method: getHtmlTableData
     */
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
