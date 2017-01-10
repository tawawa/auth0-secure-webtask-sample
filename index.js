'use strict';

var express = require('express');
var app = express();
var jwt = require('express-jwt');
var rsaValidation = require('auth0-api-jwt-rsa-validation');
var bodyParser = require('body-parser');
var metadata = require('./webtask.json');
var R = require('ramda');

const assert = require('assert');

var config = require('./config');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(function (req, res, next) {
  config.setVars(req);
  next();
});

var jwtCheck = jwt({
  secret: rsaValidation(),
  algorithms: ['RS256'],
  issuer: config.AUTH0_ISSUER,
  audience: config.AUTH0_AUDIENCE
});

var hasRequiredScope = (req, requiredScope) => {
  if (!req.user) {
    return false;
  } else if (!req.user.scope) {
    return false;
  }
  var scopes = req.user.scope.split(' ');
  console.log(scopes);
  return scopes.indexOf(requiredScope) !== -1;
};

var homePage = require('./resources/homePage');
var errorPage = require('./resources/errorPage');

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.status(200).send(homePage(config));
});

app.post('/secure', jwtCheck, function(req, res) {
  if (!req.webtaskContext) {
    console.log('Not running as webtask - ignore');
    return res.sendStatus(201);
  }

  if (!hasRequiredScope(req, 'create:account')) {
    console.log('Incorrect scope authorization');
    return res.sendStatus(401);
  }

  req.webtaskContext.storage.get(function(err, data) {
    if(err) {
      return res.status(400).send(errorPage);
    }
    data = data || [];
    console.log('@@@');
    console.log(req.body.email);
    console.log('@@@');

    data.push({ 'email': req.body.email, time: Date.now() });
    req.webtaskContext.storage.set(data, function(err){
      if(err) {
        console.log('error..');
        console.log(err);
        return res.status(400).send(errorPage);
      }
      console.log('all good');
      res.sendStatus(201);
    });
  })
});

app.get('/_list', function(req, res) {
  if (!req.webtaskContext) {
    console.log('Not running as webtask - ignore');
    return res.status(200);
  }
  req.webtaskContext.storage.get(function(err, data) {
    data = data || [];
    var result = R.reduce(function (acc, cur) {
      return acc + cur.email + '<br>';
    }, '', data);

    res.status(200).send(result);
  });
});

app.get('/_reset', function(req, res) {
  if (!req.webtaskContext) {
    console.log('Not running as webtask - ignore');
    return res.sendStatus(200);
  }
  req.webtaskContext.storage.set([], {force: 1}, function() { res.send(200)});
});

app.get('/meta', function (req, res) {
  res.status(200).send(metadata);
});

module.exports = app;
