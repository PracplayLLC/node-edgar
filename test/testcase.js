var tester = require('../index.js');

tester.getCompanyInfo('srg', function(info) {
	//console.log(info);
});

tester.getFilings('srg', 20, function(info) {
	//console.log(info);
});