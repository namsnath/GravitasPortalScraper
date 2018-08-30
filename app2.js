const express = require('express');
const bodyParser = require("body-parser");
const Promise = require('bluebird');
const request = require('request-promise');

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = express.Router();


function spawnThingy(params) {
	return new Promise((resolve, reject) => {
		var USERNAME = params['username']
		var PASSWORD = params['password']
		//var event = 

		var spawn = require("child_process").spawn;
		var process = spawn("python", ["./seleniumScraper.py"]);
		var data = [USERNAME, PASSWORD];

		var jsonStr = "";
		var jsonObj = null;

		process.stdout.on('data', function(data) {
	    	jsonStr += data.toString();
		});
		process.stderr.on('data', function(data) {
		    // console.log('stderr: ' + data);
		    if (process) {
	    		//res.send("Failed");
	    		process.kill();
	    		return reject("Failed");
	    		//return "error";
		    }
		    // process.kill('SIGHUP'); // This exits Node itself on Windows GGWP Node
		    //Here is where the error output goes
		});
		process.on('exit', function(code, signal) {
			if(code == 0)
			{
				//data = JSON.parse(jsonStr);
				//resStr = ""
				//res.send(data);
				//res.send(jsonStr);
				
			}	
		});
		process.on('close', function(code) {
		    //console.log('closing code: ' + code);
		    // console.log(jsonStr);
				jsonStr = jsonStr.replace(/'/g, '"');
				var data = JSON.parse(jsonStr);
				// console.log(data);
				//params['success': ]
				return resolve(data);
		    //Here you can get the exit code of the script
		});

		process.stdin.write(JSON.stringify(data));
		process.stdin.end();
	});
}

function makeHTML(params) {
	var html = '<html><head> <style> table {border: 1px solid black; border-spacing: 5px;} td {border: 1px solid black; padding: 15px; text-align: left;}' 
	+ 'th {border: 1px solid black; padding: 15px;} </style> </head> <body> <table> <tr> <th>Event</th> <th>Paid</th> <th>Pending</th> </tr> <tr> <td>ClickBait</td> <td>' 
	+ params['CB'][0] +'</td> <td>' + params['CB'][1] +'</td> </tr> <tr> <td>Laser Tag</td> <td>' + params['LT'][0] +'</td> <td>' 
	+ params['LT'][1] +'</td> </tr> <tr> <td>SUBG</td> <td>' + params['SUBG'][0] +'</td> <td>' + params['SUBG'][1] +'</td> </tr> <tr> <td>Under The Hood</td> <td>' 
	+ params['UTH'][0] +'</td> <td>' + params['UTH'][1] +'</td> </tr> </table> </body> </html>';

	return html;
}

app.get('/', (req, res, next) => {
	var data = [
		['bhavbhuti.nathwani2017@vitstudent.ac.in', '9898696163', 'SUBG', '', '', ''],
		['saurav.baid2017@vitstudent.ac.in', '9080658117', 'Laser Tag', '', '', ''],
		['ayush.bishnoi2017@vitstudent.ac.in', '9650421154', 'Clickbait', '', '', ''],
		['sonal.bhatia2017@vitstudent.ac.in', '9717040661', 'UTH', '', '', '']
	];
	//console.log(data);

	var promises = [null, null, null, null]

	promises[0] = spawnThingy({'username': data[0][0], 'password': data[0][1], 'event': data[0][2]})
	.then((resp) => {
		data[0][3] = resp['success'];
		data[0][4] = resp['pending'];
		data[0][5] = resp['data'];
		console.log(data[0][2] + ": Paid = " + resp["success"] + " Pending = " + resp["pending"])
		return Promise.resolve(resp);
	});
	
	promises[1] = spawnThingy({'username': data[1][0], 'password': data[1][1], 'event': data[1][2]})
	.then((resp) => {
		data[1][3] = resp['success'];
		data[1][4] = resp['pending'];
		data[1][5] = resp['data'];
		console.log(data[1][2] + ": Paid = " + resp["success"] + " Pending = " + resp["pending"])
		return Promise.resolve(resp);
	});
	
	promises[2] = spawnThingy({'username': data[2][0], 'password': data[2][1], 'event': data[2][2]})
	.then((resp) => {
		data[2][3] = resp['success'];
		data[2][4] = resp['pending'];
		data[2][5] = resp['data'];
		console.log(data[2][2] + ": Paid = " + resp["success"] + " Pending = " + resp["pending"])
		return Promise.resolve(resp);
	});

	promises[3] = spawnThingy({'username': data[3][0], 'password': data[3][1], 'event': data[3][2]})
	.then((resp) => {
		data[3][3] = resp['success'];
		data[3][4] = resp['pending'];
		data[3][5] = resp['data'];
		console.log(data[3][2] + ": Paid = " + resp["success"] + " Pending = " + resp["pending"])
		return Promise.resolve(resp);
	});
	
	Promise.all(promises).then(function() {
		var params = {
			'CB': [data[2][3], data[2][4]],
			'SUBG': [data[0][3], data[0][4]],
			'UTH': [data[3][3], data[3][4]],
			'LT': [data[1][3], data[1][4]]
		};

		var html = makeHTML(params);
		res.send(html);
		//console.log(data);

	});

	/*spawnThingy({'username': data[0][0], 'password': data[0][1]})
	.then(function (resp) {
		//res.send(resp);
		var obj = JSON.parse(resp);
		data[0][3] = obj['success'];
		data[0][4] = obj['pending'];
		console.log(obj);
		return new Promise.resolve(obj);
		//return obj;
	}).then(function (resp) {
		spawnThingy({'username': data[1][0], 'password': data[1][1]})
	}).then(function (resp) {
		var obj = JSON.parse(resp);
		data[1][3] = obj['success'];
		data[1][4] = obj['pending'];
		console.log(obj);
		return new Promise.resolve(obj);
	}).then(function (resp) {
		spawnThingy({'username': data[2][0], 'password': data[2][1]})
	}).then(function (resp) {
		var obj = JSON.parse(resp);
		data[2][3] = obj['success'];
		data[2][4] = obj['pending'];
		console.log(obj);
		return new Promise.resolve(obj);
	}).then(function (resp) {
		spawnThingy({'username': data[3][0], 'password': data[3][1]})
	}).then(function (resp) {
		var obj = JSON.parse(resp);
		data[3][3] = obj['success'];
		data[3][4] = obj['pending'];
		console.log(obj);
		return new Promise.resolve(obj);
	}).then(function(resp) {
		console.log(data);
		var respstr = data[0][2] + ": Paid = " + data[0][3] + ", Pending = " + data[0][4] + "\n";
		respstr += data[1][2] + ": Paid = " + data[1][3] + ", Pending = " + data[1][4] + "\n";
		respstr += data[2][2] + ": Paid = " + data[2][3] + ", Pending = " + data[2][4] + "\n";
		respstr += data[3][2] + ": Paid = " + data[3][3] + ", Pending = " + data[3][4] + "\n";
		//res.send(respstr);
	})
	.catch((err) => res.send(err));
	//console.log(dat);*/
});

app.post('/', (req, res, next) => {
	var params = {};
	params['username'] = req.body["username"];		// bhavbhuti.nathwani2017@vitstudent.ac.in
	params['password'] = req.body["password"];	// 9898696163
	var dat = spawnThingy(params);
	console.log(dat);
});

app.listen(port, () => {
	console.log("Server listening on port " + port)
});