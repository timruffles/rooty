module.exports = {
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
};
