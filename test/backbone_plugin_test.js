var getRouterConstructor = require("../src/backbone");
var Rooty = require("../src/rooty");

var Router;

var Backbone = require("backbone");
var _ = require("underscore");

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
  "before": function() {
    Router = getRouterConstructor(Backbone, _);
  },
  "beforeEach": function() {
    app = new Rooty;
  },
  "backbone router": {
    "and generates BB route strings": function() {
      defaultPaths();
      assert.equal(":user/:repo/:requirement/:ref/*path", getRouterConstructor._toBackboneRouteString(app.getRoute("repo:blob").namespace._route));
    },
    "it fires a route event with name and params": function() {

      var route = "/:user/:repo";
      app.route("repo",route);

      var r = new Router(app);

      var cb = r.routeCallback(app.byName["repo"]);

      var routeSpy = sinon.spy();
      r.on("route", routeSpy);

      cb.call(r, "sidekick","client");

      sinon.assert.calledOnce(routeSpy);
      sinon.assert.calledWith(routeSpy, "repo", {user: "sidekick", repo: "client"});
    }
  }
};
