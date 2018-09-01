const express = require('express');
const bodyParser = require("body-parser");
const Promise = require('bluebird');
const request = require('request-promise');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const zlib = require('zlib');

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Models
const User = require(path.join(__dirname, 'models', 'User'));

// Routes


// Mongo setup
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/Gravitas", { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB Instance");
});

//const router = express.Router();


// Data
const seleniumScraper = './utilities/seleniumScraper.py';

var html;
var cachedSUBG, cachedLT, cachedCB, cachedUTH;
var dataSUBG, dataLT, dataCB, dataUTH;

var data = [
		['bhavbhuti.nathwani2017@vitstudent.ac.in', '9898696163', 'SUBG', '', '', ''],
		['saurav.baid2017@vitstudent.ac.in', '9080658117', 'Laser Tag', '', '', ''],
		['ayush.bishnoi2017@vitstudent.ac.in', '9650421154', 'Clickbait', '', '', ''],
		['sonal.bhatia2017@vitstudent.ac.in', '9717040661', 'UTH', '', '', '']
	];

var counts = {
	'SUBG': {},
	'Clickbait': {},
	'Laser Tag': {},
	'UTH': {}
};

var datanew = [
	{
		'event': 'Clickbait',
		'un': 'ayush.bishnoi2017@vitstudent.ac.in',
		'pw': '9650421154',
	},
	{
		'event': 'Laser Tag',
		'un': 'saurav.baid2017@vitstudent.ac.in',
		'pw': '9080658117',
	}, 
	{
		'event': 'SUBG',
		'un': 'bhavbhuti.nathwani2017@vitstudent.ac.in',
		'pw': '9898696163',
	}, 
	{
		'event': 'Under The Hood',
		'un': 'sonal.bhatia2017@vitstudent.ac.in',
		'pw': '9717040661',
	}
];

cron.schedule('*/10 * * * *', function() {
    console.log("Running Details cron job every 10 minutes");
    
    getDetailsNew();
});

cron.schedule('*/10 * * * *', function() {
    console.log("Running DataCache cron job every 10 minutes");
    
    cacheData();
});

function updateDB(params) {
	return new Promise((resolve, reject) => {
		var promises = [];

		params.forEach((param) => {
			promises.push(doUpdate(param));
		});

		Promise.all(promises).then((res) => {
			return resolve(params);
		});		
	});
}

function doUpdate(params) {
	return new Promise((resolve, reject) => {
		var setOnInsert = {
			name: params['name'],
			pid: params['pid'],
			event: params['event'],
			type: params['type'],
			//status: params['status'],
			phno: params['phno'],
			email: params['email'],
		}
		var query = {name: params['name'], pid: params['pid'], event: params['event'], type: params['type']};

		User.update(query, {status: params['status'], $setOnInsert: setOnInsert}, { upsert: true, new: true }, function(err, doc) {
			if(err) {
				console.log(err);
				return reject(err);
			}
			else {
				//console.log(doc);
				return resolve(doc);
			}
		});
	});
}

function getDetails() {
	return new Promise((resolve, reject) => {
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

			return resolve(makeHTML(params));
		});
	});
}

function getDetailsNew() {
	return new Promise((resolve, reject) => {
		var promises = [];

		data.forEach(function(details) {
			var params = {
				'username': details[0],
				'password': details[1],
				'event': details[2] 
			};

			promises.push(spawnThingy(params).then((resp) => {
				counts[details[2]]['success'] = resp['success'];
				counts[details[2]]['pending'] = resp['pending'];
				console.log("Success: " + resp['success'] + " Pending: " + resp['pending']);
				return updateDB(resp['data']);
				//data[5] = resp['data'];
			}));

		});

		Promise.all(promises).then((res) => {
			return resolve(makeHTMLNew());
		});

	});
}

function count(ev, st) {
	return new Promise((resolve, reject) => {
		User.countDocuments({ event: ev, status: st }, function (err, count) {
			if(err) return reject(err);
			else {
				//console.log(count);
				//cnts['SUBG']['success'] = count;
				return resolve(count);
			}
		});
	});
}

function getCounts() {
	return new Promise((resolve, reject) => {
		var evs = ['SUBG', 'Clickbait', 'Laser Tag', 'UTH'];

		var cnts = {
			'SUBG': {},
			'Clickbait': {},
			'Laser Tag': {},
			'UTH': {}
		};

		var promises = [];

		evs.forEach((ev) => {
			promises.push(
				count(ev, 'Success')
				.then((c) => {
					cnts[ev]['success'] = c;
					return count(ev, 'Pending');
				}).then((c) => {
					cnts[ev]['pending'] = c;
				})
			);
		});

		Promise.all(promises).then(() => {
			//console.log(promises);
			console.log(cnts);
			counts = cnts;
			return resolve(makeHTMLNew());
		});
		
	});
}


function cacheData() {
	console.log('Caching Data');
	return cacheSUBG()
	.then(cacheLT())
	.then(cacheUTH())
	.then(cacheCB())
	.catch((err) => console.log(err))
}

function cacheSUBG() {
	return new Promise((resolve, reject) => {
		getData('SUBG').then(function(dat) {
        dataSUBG = JSON.stringify(dat);

        zlib.gzip(new Buffer.from(dataSUBG), function(err, data) {
            cachedSUBG = data;
            console.log('Cached SUBG');
            return resolve(data);
            //return resolve(cachedGzip);
        });
    });
	});
}

function cacheLT() {
	return new Promise((resolve, reject) => {
		getData('Laser Tag').then(function(dat) {
        dataLT = JSON.stringify(dat);

        zlib.gzip(new Buffer.from(dataLT), function(err, data) {
            cachedLT = data;
            console.log('Cached LT');
            return resolve(data);
            //return resolve(cachedGzip);
        });
    });
	});
}

function cacheUTH() {
	return new Promise((resolve, reject) => {
		getData('UTH').then(function(dat) {
        dataUTH = JSON.stringify(dat);

        zlib.gzip(new Buffer.from(dataUTH), function(err, data) {
            cachedUTH = data;
            console.log('Cached UTH');
            return resolve(data);
            //return resolve(cachedGzip);
        });
    });
	});
}

function cacheCB() {
	return new Promise((resolve, reject) => {
		 getData('Clickbait').then(function(dat) {
        dataCB = JSON.stringify(dat);

        zlib.gzip(new Buffer.from(dataCB), function(err, data) {
            cachedCB = data;
            console.log('Cached CB');
            return resolve(data);
            //return resolve(cachedGzip);
        });
    });
	});
}

function getData(ev) {
	return new Promise((resolve, reject) => {
		User.aggregate([
			{ 
				$match: { event: ev } 
			},
			{
				$sort: { status: 1 }
			}
		], function(err, result) {
			if(err) reject(err);
            var usr = [];

            result.forEach(function(user) {
                usr.push(user);
            });
            resolve(usr);
		})
	});
}

function spawnThingy(params) {
	return new Promise((resolve, reject) => {
		var USERNAME = params['username']
		var PASSWORD = params['password']
		var EVENT = params['event'];

		var spawn = require("child_process").spawn;
		var process = spawn("python", [seleniumScraper]);
		var data = [USERNAME, PASSWORD, EVENT];

		var jsonStr = "";
		var jsonObj = null;

		process.stdout.on('data', function(data) {
	    	jsonStr += data.toString();
		});
		process.stderr.on('data', function(data) {
		    console.log('stderr: ' + data);
		    if (process) {
	    		//res.send("Failed");
	    		process.kill();
	    		return reject("Failed");
	    		//return "error";
		    }
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
	    	//console.log(jsonStr);
			jsonStr = jsonStr.replace(/'/g, '"');
			jsonStr = jsonStr.replace(/u"/g, '"');
			var data = JSON.parse(jsonStr);
			//console.log(data);

			return resolve(data);
		});

		process.stdin.write(JSON.stringify(data));
		process.stdin.end();
	});
}

function makeHTML(params) {
	html = '<html><meta name="viewport" content="width=device-width, initial-scale=1"><head> <style> table {border: 1px solid black; border-spacing: 5px;}' 
	+ ' td {border: 1px solid black; padding: 15px; text-align: left;}' 
	+ 'th {border: 1px solid black; padding: 15px;} </style> </head> <body> <table> <tr> <th>Event</th> <th>Paid</th> <th>Pending</th> </tr> <tr> <td>Clickbait</td> <td>' 
	+ params['CB'][0] +'</td> <td>' + params['CB'][1] +'</td> </tr> <tr> <td>Laser Tag</td> <td>' + params['LT'][0] +'</td> <td>' 
	+ params['LT'][1] +'</td> </tr> <tr> <td>SUBG</td> <td>' + params['SUBG'][0] +'</td> <td>' + params['SUBG'][1] +'</td> </tr> <tr> <td>Under The Hood</td> <td>' 
	+ params['UTH'][0] +'</td> <td>' + params['UTH'][1] +'</td> </tr> </table> </body> </html>';

	return html;
}

function makeHTMLNew() {
	html = '<html><meta name="viewport" content="width=device-width, initial-scale=1"><head> <style> table {border: 1px solid black; border-spacing: 5px;}' 
	+ ' td {border: 1px solid black; padding: 15px; text-align: left;}' 
	+ 'th {border: 1px solid black; padding: 15px;} </style> </head> <body> <table> <tr> <th>Event</th> <th>Paid</th> <th>Pending</th> </tr> <tr> <td>Clickbait</td> <td>' 
	+ counts['Clickbait']['success'] +'</td> <td>' + counts['Clickbait']['pending'] +'</td> </tr> <tr> <td>Laser Tag</td> <td>' + counts['Laser Tag']['success'] +'</td> <td>' 
	+ counts['Laser Tag']['pending'] +'</td> </tr> <tr> <td>SUBG</td> <td>' + counts['SUBG']['success'] +'</td> <td>' + counts['SUBG']['pending'] +'</td> </tr> <tr> <td>Under The Hood</td> <td>' 
	+ counts['UTH']['success'] +'</td> <td>' + counts['UTH']['pending'] +'</td> </tr> </table> </body> </html>';

	return html;
}

app.get('/old', (req, res, next) => {
	if(html == null) {
		getDetails().then((params) => res.send(html));
	} else {
		res.send(html);
	}
});

app.get('/', (req, res, next) => {
	getCounts()
		.then(() => res.send(html))
		.catch((err) => console.log(err));

	/*if(counts) {
		getDetailsNew()
		.then((params) => res.send(html))
		.catch((err) => console.log(err));
	} else {
		getCounts()
		.then(() => res.send(html))
		.catch((err) => console.log(err));	
	}*/
});

app.get('/forceRefresh', (req, res, next) => {
	getDetailsNew()
		.then((params) => res.send(html))
		.then((params) => cacheData())
		.catch((err) => console.log(err));
});

app.get('/SUBG', (req, res, next) => {
	if(cachedSUBG == null)
    {
        cacheSUBG()
            .then(function(crs) {
                res.send(crs);
            });
    } else {
        res.header('Content-Type', 'application/json');
        res.header('Content-Encoding', 'gzip');
        res.send(cachedSUBG);
    }
});

app.get('/LT', (req, res, next) => {
	if(cachedLT == null)
    {
        cacheLT()
            .then(function(crs) {
                res.send(crs);
            });
    } else {
        res.header('Content-Type', 'application/json');
        res.header('Content-Encoding', 'gzip');
        res.send(cachedLT);
    }
});

app.get('/UTH', (req, res, next) => {
	if(cachedUTH == null)
    {
        cacheUTH()
            .then(function(crs) {
                res.send(crs);
            });
    } else {
        res.header('Content-Type', 'application/json');
        res.header('Content-Encoding', 'gzip');
        res.send(cachedUTH);
    }
});

app.get('/CB', (req, res, next) => {
	if(cachedCB == null)
    {
        cacheCB()
            .then(function(crs) {
                res.send(crs);
            });
    } else {
        res.header('Content-Type', 'application/json');
        res.header('Content-Encoding', 'gzip');
        res.send(cachedCB);
    }
});

app.listen(port, () => {
	console.log("Server listening on port " + port)
});
