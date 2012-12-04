var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

////////////// contrived curry/partial function usage //////////////
// http://ejohn.org/blog/partial-functions-in-javascript/
Function.prototype.partial = function(){
  var fn = this, args = Array.prototype.slice.call(arguments);
  return function(){
    var arg = 0;
    for ( var i = 0; i < args.length && arg < arguments.length; i++ )
      if ( args[i] === undefined )
        args[i] = arguments[arg++];
    return fn.apply(this, args);
  };
};

Array.prototype.add = function(arr2) {
  // assumes same length
  ret = new Array(this.length);
  for (var i = this.length - 1; i >= 0; i--) {
    ret[i] = this[i] + arr2[i];
  };
  return ret;
}
// hourly wage bonus by day of week
var wagePremium = [2,0,0,0,0,0,1.5]
// contrived curry/partial function
Array.prototype.addWagePremium = Array.prototype.add.partial(wagePremium);

// contrived use of it
var joesWages = [8,8,8,8,8,8,8];
var bobsWages = [7,7,7,7,7,8,8]; // congrats Bob, you got a raise in the middle of the week
console.log( joesWages.addWagePremium())
console.log( bobsWages.addWagePremium())
