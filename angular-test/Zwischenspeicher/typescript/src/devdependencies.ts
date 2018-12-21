var dev$;
/* develblock:start */
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
var dev$ = require('jquery')((new JSDOM('')).window);
/* develblock:end */
export default dev$;