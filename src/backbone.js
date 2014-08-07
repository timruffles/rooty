"use strict";

var Routing = require("./rooty").Routing;

module.exports = getRouterConstructor;
module.exports._toBackboneRouteString = toBackboneRouteString;

function getRouterConstructor(Backbone, _) {

  var Router = Backbone.Router.extend({
    initialize: function(namespace) {
      this.namespace = namespace;
      if(namespace) namespace.allRoutes().reverse().forEach(this.addRoute,this);
    },
    addRoute: function(namespace) {
      var route = toBackboneRouteString(namespace._route);
      this.route(route,namespace.fullName(),this.routeCallback(namespace));
    },
    routeCallback: function(namespace) {
      return _.bind(function() {
        var values = _.compact(arguments);
        var keys = this.routeToLinearComponents(namespace._route).slice(0,values.length);
        var obj = values.length > 0 ? _.object(_.zip(keys, values)) : {};
        _.defaults(obj,namespace.getDefaults());
        var name = namespace.fullName(); 
        name = name.replace(/^root:/,"");
        this.trigger("routed", name, obj);
        this.trigger("routed:" + name, obj);
      },this);
    },
  });

  _.extend(Router.prototype, Routing);
  
  return Router;
}

function componentToBackboneRouteString(component) {
  switch(component.type) {
    case "route":
      return component.children.map(componentToBackboneRouteString).join("");
    case "literal":
      return "/" + component.value;
    case "required":
      return "/:" + component.value;
    case "splat":
      return "/*" + component.value;
    case "optional":
      return "(" + component.children.map(componentToBackboneRouteString).join("") + ")"
    default:
      throw new Error("Unknown component type " + component.type);
  };
}

function toBackboneRouteString(component) {
  return componentToBackboneRouteString(component).replace(/^\//,"");
}
