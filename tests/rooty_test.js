testCase("Rooty",[
  "libs/rooty",
  "libs/rooty_parser",
  "vendor/backbone"
],function(
  Rooty,
  Parser,
  Backbone,
  run
) {
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
  run({
    "setUp": function() {
      app = new Rooty;
    },
    "defines routes via route and namespace": {
      "setUp": defaultPaths,
      "with accessor for list of all routes": function() {
        assert.same(5,app.allRoutes().length);
      },
      "and can access via getRoute": function() {
        assert.defined(app.getRoute("repo:tree"));
      },
      "access full name": function() {
        assert.same("repo:settings",app.byName.repo.byName.settings.fullName());
      },
      "access parents": function() {
        assert.same(2,app.byName.repo.byName.settings.parents().length);
      },
      "access defaults": function() {
        assert.same("blob",app.byName.repo.byName.blob.getDefaults().requirement);
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
          assert.same("/documentcloud/backbone/blob/04aabc/app/js/view.js",path);
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
          assert.same("/documentcloud/backbone/repetition/04aabc/app/js/view.js",path);
        },
        "without optional components": function() {
          var name = "connect-repositories";
          app.route(name,"/connect/repositories(/:service)");
          var route = app.getRoute(name);
          assert.same("/connect/repositories",route.path());
        }
      }
    },
    "routing": {
      "turns a route into a linear array of keys to extract": function() {
        var parser = new Parser;
        var parsed = parser.parse("/repo/:user(/:name)/raw/*path");
        var linear = Rooty.Routing.routeToLinearComponents(parsed);
        assert.equals(["user","name","path"],linear);
      },
      "generates regex strings that extract correctly": function() {
        // ":user/:repo/tree/:ref/*path"
        defaultPaths();
        var re = Rooty.Routing.toRouteRegexp(app.getRoute("repo:tree").namespace._route);
        var match = re.exec("/documentcloud/backbone/tree/master/test/views/index.js");
        assert.same(5,match.length);
      },
    },
    "backbone router": {
      "and generates BB route strings": function() {
        defaultPaths();
        assert.same(":user/:repo/:requirement/:ref/*path",Rooty.BackboneRouting.toBackboneRouteString(app.getRoute("repo:blob").namespace._route));
      },
      "it fires a route event with name and params": function() {

        var app = new Rooty;
        var route = "/:user/:repo";
        app.route("repo",route);

        var r = new Rooty.Router(app);

        var cb = r.routeCallback(app.byName["repo"]);
        var routeSpy = sinon.spy();
        r.on("route", routeSpy);
        cb.call(r, "sidekick","client");
        assert.calledOnceWith(routeSpy, "repo", {user: "sidekick", repo: "client"});
      }
    }
  });

});
