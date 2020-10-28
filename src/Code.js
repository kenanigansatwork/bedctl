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
 * @param {Event} e event object describing GET request parameters
 * @returns {HtmlOutput} contains HTML code of specified web page
 */
const doGet = e => HtmlService.createHtmlOutput("<h1>bedctl</h1>");

