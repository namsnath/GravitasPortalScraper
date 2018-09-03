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

var countsNew = {
	'SUBG': {
		'Internal': {
			'Success': 0,
			'Pending': 0,
			'Max': 105
		},
		'External': {
			'Success': 0,
			'Pending': 0,
			'Max': 45
		}
	},
	'Clickbait': {
		'Internal': {
			'Success': 0,
			'Pending': 0,
			'Max': 140
		},
		'External': {
			'Success': 0,
			'Pending': 0,
			'Max': 60
		}
	},
	'Laser Tag': {
		'Internal': {
			'Success': 0,
			'Pending': 0,
			'Max': 700
		},
		'External': {
			'Success': 0,
			'Pending': 0,
			'Max': 300
		}
	},
	'UTH': {
		'Internal': {
			'Success': 0,
			'Pending': 0,
			'Max': 105
		},
		'External': {
			'Success': 0,
			'Pending': 0,
			'Max': 45
		}
	}
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
				//counts[details[2]]['success'] = resp['success'];
				//counts[details[2]]['pending'] = resp['pending'];
				//console.log(details[2] + " Success: " + resp['success'] + " Pending: " + resp['pending']);
				return updateDB(resp['data']);
				//data[5] = resp['data'];
			}));

		});

		Promise.all(promises).then((res) => {
			return resolve(newGetCounts());
		});

	});
}

function count(ev, st="Success", ty="Internal") {
	return new Promise((resolve, reject) => {
		User.countDocuments({ event: ev, status: st, type: ty }, function (err, count) {
			if(err) return reject(err);
			else {
				console.log(ev, st, ty, count);
				countsNew[ev][ty][st] = count;
				return resolve(count);
			}
		});
	});
}

function newGetCounts() {
	return new Promise((resolve, reject) => {
		count('SUBG', 'Success', 'Internal')
		.then((a) => count('SUBG', 'Success', 'External'))
		.then((a) => count('SUBG', 'Pending', 'Internal'))
		.then((a) => count('SUBG', 'Pending', 'External'))
		.then((a) => count('Clickbait', 'Success', 'Internal'))
		.then((a) => count('Clickbait', 'Success', 'External'))
		.then((a) => count('Clickbait', 'Pending', 'Internal'))
		.then((a) => count('Clickbait', 'Pending', 'External'))
		.then((a) => count('Laser Tag', 'Success', 'Internal'))
		.then((a) => count('Laser Tag', 'Success', 'External'))
		.then((a) => count('Laser Tag', 'Pending', 'Internal'))
		.then((a) => count('Laser Tag', 'Pending', 'External'))
		.then((a) => count('UTH', 'Success', 'Internal'))
		.then((a) => count('UTH', 'Success', 'External'))
		.then((a) => count('UTH', 'Pending', 'Internal'))
		.then((a) => count('UTH', 'Pending', 'External'))
		.then((a) => makeHTMLNewer())
		.then((html) => {return resolve(html)})
		.catch((err) => console.log(err));
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

function makeHTMLNewer() {
	var cis = countsNew['Clickbait']['Internal']['Success'],
	 	cip = countsNew['Clickbait']['Internal']['Pending'],
	 	ces = countsNew['Clickbait']['External']['Success'], 
	 	cep = countsNew['Clickbait']['External']['Pending'], 
	 	cst = cis + ces, 
	 	cpt = cip + cep, 
	 	cir = countsNew['Clickbait']['Internal']['Max'] - cis, 
	 	cer = countsNew['Clickbait']['External']['Max'] - ces;

	var lis = countsNew['Laser Tag']['Internal']['Success'],
	 	lip = countsNew['Laser Tag']['Internal']['Pending'],
	 	les = countsNew['Laser Tag']['External']['Success'], 
	 	lep = countsNew['Laser Tag']['External']['Pending'], 
	 	lst = lis + les, 
	 	lpt = lip + lep, 
	 	lir = countsNew['Laser Tag']['Internal']['Max'] - lis, 
	 	ler = countsNew['Laser Tag']['External']['Max'] - les;

	var sis = countsNew['SUBG']['Internal']['Success'],
	 	sip = countsNew['SUBG']['Internal']['Pending'],
	 	ses = countsNew['SUBG']['External']['Success'], 
	 	sep = countsNew['SUBG']['External']['Pending'], 
	 	sst = sis + ses, 
	 	spt = sip + sep, 
	 	sir = countsNew['SUBG']['Internal']['Max'] - sis, 
	 	ser = countsNew['SUBG']['External']['Max'] - ses;
	 
	var uis = countsNew['UTH']['Internal']['Success'],
	 	uip = countsNew['UTH']['Internal']['Pending'],
	 	ues = countsNew['UTH']['External']['Success'], 
	 	uep = countsNew['UTH']['External']['Pending'], 
	 	ust = uis + ues, 
	 	upt = uip + uep, 
	 	uir = countsNew['UTH']['Internal']['Max'] - uis, 
	 	uer = countsNew['UTH']['External']['Max'] - ues; 	 	


	html = `<html>
	<head>
		<style>
			table {border: 1px solid black; border-spacing: 5px;}
			td {border: 1px solid black; padding: 15px; text-align: left;}
			th {border: 1px solid black; padding: 15px;}
		</style>
		<meta name="viewport" content="width=device-width, initial-scale=1">
	</head>
	
	<body>
		<table>
			<tr>
				<th rowspan=2>Event</th>
				<th colspan=3>Paid</th>
				<th colspan=3>Pending</th>
				<th colspan=2>Remaining</th>
			</tr>
          
          <tr>
          		<th>Internal</th>
            	<th>External</th>
            	<th>Total</th>
            	<th>Internal</th>
            	<th>External</th>
            	<th>Total</th>
            	<th>Internal</th>
            	<th>External</th>
          </tr>
			
			<tr>
				<td>ClickBait</td>
				<td>` + cis + `</td>
				<td>` + ces + `</td>
              	<td>` + cst + `</td>
				<td>` + cip + `</td>
              	<td>` + cep + `</td>
				<td>` + cpt + `</td>
				<td>` + cir + `</td>
				<td>` + cer + `</td>
			</tr>
			
			<tr>
				<td>Laser Tag</td>
				<td>` + lis + `</td>
				<td>` + les + `</td>
              	<td>` + lst + `</td>
				<td>` + lip + `</td>
              	<td>` + lep + `</td>
				<td>` + lpt + `</td>
				<td>` + lir + `</td>
				<td>` + ler + `</td>
          </tr>
			
			<tr>
				<td>SUBG</td>
				<td>` + sis + `</td>
				<td>` + ses + `</td>
              	<td>` + sst + `</td>
				<td>` + sip + `</td>
              	<td>` + sep + `</td>
				<td>` + spt + `</td>
				<td>` + sir + `</td>
				<td>` + ser + `</td>
			</tr>
			
			<tr>
				<td>Under The Hood</td>
				<td>` + uis + `</td>
				<td>` + ues + `</td>
              	<td>` + ust + `</td>
				<td>` + uip + `</td>
              	<td>` + uep + `</td>
				<td>` + upt + `</td>
				<td>` + uir + `</td>
				<td>` + uer + `</td>
			</tr>
		</table>
	</body>
</html>`;

	return html;
}

app.get('/', (req, res, next) => {
	newGetCounts()
		.then((html) => res.send(html.toString()))
		.catch((err) => console.log(err));
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
