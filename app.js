const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser");
const unirest = require('unirest');
const Promise = require('bluebird');
const _ = require('lodash');
const request = require('request-promise');

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = express.Router();

function getLogin(params) {
  return new Promise((resolve, reject) => {
    console.log('GETting Login Page');

    var cookieJar = params['cookieJar'];
    //console.log(cookieJar);

    request({url: 'http://info.vit.ac.in/gravitas18/gravitas/gravitas_coordinator_login.asp', jar: cookieJar})
    .then((resp) => {
      var $ = cheerio.load(resp);
      var data = $('input');
      
      console.log(data['2']['attribs']['value']);

      return resolve({'captcha':  data['2']['attribs']['value'], 'cookieJar': cookieJar});
    }).catch((err) => {
      return reject(err);
    });

  });
}

function postLogin(params) {
  return new Promise((resolve, reject) => {
    console.log('POSTing to Login');

    var cookieJar = params['cookieJar'];
    //console.log(cookieJar);

    var options = {
      method: 'POST',
      url: 'http://info.vit.ac.in/gravitas18/gravitas/login_authorize.asp',
      form: {
        'captchacode': params['captcha'],
        'captchacode1': params['captcha'], 
        'frmSubmit': '', 
        'loginid': 'bhavbhuti.nathwani2017@vitstudent.ac.in', 
        'logpassword': '9898696163'
      },
      jar: cookieJar,
      followAllRedirects: true
    }

    request(options)
    .then((resp) => {
      params['cookieJar'] = cookieJar;
      params['resp'] = resp;
      //res.send(resp);
      return resolve(params);
    }).catch((err) => {
      console.log('POST Fucked up login');
      console.log(err);
      return reject(err);
    });
  });
}

function getEventList(params) {
  return new Promise((resolve, reject) => {
    console.log('GETting Event List');

    var cookieJar = params['cookieJar'];
    //console.log(cookieJar);

    request({url: 'http://info.vit.ac.in/gravitas18/gravitas/coord_event_participants.asp', jar: cookieJar})
    .then((resp) => {
      params['cookieJar'] = cookieJar;
      params['resp'] = resp;
      return resolve(params)
    }).catch((err) => {
      console.log('Getting event list Fucked up');
      return reject(err);
    });

  });
}

function postParticipants(params) {
  return new Promise((resolve, reject) => {
    console.log('POSTing to Participant List');

    var cookieJar = params['cookieJar'];
    //console.log(cookieJar);

    var options = {
      method: 'POST',
      url: 'http://info.vit.ac.in/gravitas18/gravitas/coord_event_participant_list.asp',
      body: {'frmSubmit': '', 'upeventid': 'G18ETCH015'},
      jar: cookieJar,
      followAllRedirects: true
    }

    request(options)
    .then((resp) => {
      params['cookieJar'] = cookieJar;
      params['resp'] = resp;
      return resolve(params);
    }).catch((err) => {
      console.log('POST to participants fucked up');
      return reject(err);
    });

  });
}

app.get('/', (req, res, next) => {
  var cookieJar = request.jar();
  var params = {};
  params['cookieJar'] = cookieJar;

  getLogin(params)
  .then(postLogin)
  .then(getEventList)
  .then(postParticipants)
  .then((params) => {
    res.send(params);
    //console.log(params);
  })
  .catch((err) => {
    res.send(err);
    //console.log(err);
  });

});

/*
app.get("/", function(req, res, next) {
  var cookieJar = request.jar();


	request({url: "http://info.vit.ac.in/gravitas18/gravitas/gravitas_coordinator_login.asp", jar: cookieJar})
	.then(function(resp) {
    console.log('Getting');
		var $ = cheerio.load(resp);
		var data = $('input');
		console.log(data['2']['attribs']['value']);
		return {'captcha': data['2']['attribs']['value']};	

	}).then((params) => {
		console.log(params);
		var options = {
			method: 'POST',
			url: 'http://info.vit.ac.in/gravitas18/gravitas/login_authorize.asp',
			form: {'captchacode': params['captcha'], 'captchacode1': params['captcha'], 'frmSubmit': '', 'loginid': 'bhavbhuti.nathwani2017@vitstudent.ac.in', 'logpassword': 'namit2905'},
      jar: cookieJar,
      followAllRedirects: true
		}

		//request(options)
		request.post({url: options['url'], form: options['body'], jar: cookieJar, followAllRedirects: true})
		.then((params) => {
			request('http://info.vit.ac.in/gravitas18/gravitas/coord_event_participants.asp')
			.then((resp) => {
				var options = {
          method: 'POST',
          url: 'http://info.vit.ac.in/gravitas18/gravitas/coord_event_participant_list.asp',
          body: {'frmSubmit': '', 'upeventid': 'G18ETCH015'},
          jar: cookieJar,
          followAllRedirects: true
        };

        request.post({url: options['url'], form: options['body'], jar: cookieJar, followAllRedirects: true})
        .then((resp => {
          console.log(resp);
        }));
				
        });
				console.log(params);
		});
	})
	.catch((err) => console.log(err));
});
*/
app.listen(port, () => {
  console.log("Server listening on port " + port)
});