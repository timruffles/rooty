var Rooty = require("../src/rooty")
var Parser = require("../src/parser");

var app;
var defaultPaths = function() {
  app.namespace("repo","/:user/:repo",function(repo) {
    repo.route("settings","/settings");
    repo.route("tree","/tree/:ref/*path");
    repo.namespace("blob","/:requirement/:ref/*path",function(blob) {
      blob.defaults({requirement:"blob"});
    });
  });
};

module.exports = {
  "beforeEach": function() {
    app = new Rooty;
  },
  "defines routes via route and namespace": {
    "beforeEach": defaultPaths,
    "with accessor for list of all routes": function() {
      assert.equal(5,app.allRoutes().length);
    },
    "and can access via getRoute": function() {
      assert(app.getRoute("repo:tree"));
    },
    "access full name": function() {
      assert.equal("repo:settings",app.byName.repo.byName.settings.fullName());
    },
    "access parents": function() {
      assert.equal(2,app.byName.repo.byName.settings.parents().length);
    },
    "access defaults": function() {
      assert.equal("blob",app.byName.repo.byName.blob.getDefaults().requirement);
    },
    "and generates paths from child routes": {
      "without defaults": function() {
        var blob = app.getRoute("repo:blob");
        var path = blob.path({
          "user": "documentcloud",
          "repo": "backbone",
          "ref":"04aabc",
          "path":"app/js/view.js"
        });
        assert.equal("/documentcloud/backbone/blob/04aabc/app/js/view.js",path);
      },
      "or with defaults": function() {
        var blob = app.getRoute("repo:blob");
        var path = blob.path({
          "requirement": "repetition",
          "user": "documentcloud",
          "repo": "backbone",
          "ref":"04aabc",
          "path":"app/js/view.js"
        });
        assert.equal("/documentcloud/backbone/repetition/04aabc/app/js/view.js",path);
      },
      "without optional components": function() {
        var name = "connect-repositories";
        app.route(name,"/connect/repositories(/:service)");
        var route = app.getRoute(name);
        assert.equal("/connect/repositories",route.path());
      }
    }
  },
  "routing": {
    "turns a route into a linear array of keys to extract": function() {
      var parser = new Parser;
      var parsed = parser.parse("/repo/:user(/:name)/raw/*path");
      var linear = Rooty.Routing.routeToLinearComponents(parsed);
      assert.deepEqual(["user","name","path"], linear);
    },
    "generates regex strings that extract correctly": function() {
      // ":user/:repo/tree/:ref/*path"
      defaultPaths();
      var re = Rooty.Routing.toRouteRegexp(app.getRoute("repo:tree").namespace._route);
      var match = re.exec("/documentcloud/backbone/tree/master/test/views/index.js");
      assert.equal(5,match.length);
    },
  },
 };
