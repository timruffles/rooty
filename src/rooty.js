"use strict";

var Parser = require("./parser");
var _ = require("lodash");

function Rooty(name) {
  return new NameSpace(name || "root");
}

function NameSpace(name,options) {
  this.byName = {}; 
  this.name = name || "";
  _.extend(this,{_route: {type: "route", children: []}},options);
  this._defaults = {};
  this.hasRoot = true;
  this.parser = new Parser;
}

NameSpace.prototype = {
  route: function(name,path) {
    path = path.replace(/^([^\/])/,"/$1");
    return this.byName[name] = new NameSpace(name,{
      _route: this.concatRoute(this._route,this.parser.parse(path)),
      parent: this
    });
  },
  noRoot: function() {
    this.hasRoot = false;
    this.parent && this.parent._remove(this.name);
  },
  namespace: function(name,path,cb) {
    var route = this.route(name,path);
    if(cb) cb(route);
  },
  defaults: function(defaults) {
    this._defaults = defaults;
  },
  _remove: function(name) {
    delete this.byName[name];
  },

  getRoute: function(name) {
    if(name === "root") name = "";
    var namespace;
    if(name) {
      name = name.replace(/^root:/,"");
      var nameSegements = name.split(":");
      namespace = nameSegements.reduce(function(candidate,component) {
        candidate = candidate.byName[component];
        assert(candidate,"Unknown route " + name);
        return candidate;
      },this);
    } else {
      assert(this.hasRoot,"No root route for " + this.name);
      namespace = this;
    }
    return new Route(namespace);
  },
  parents: function() {
    var parents = [];
    var current = this.parent;
    while(current) {
      parents.push(current);
      current = current.parent;
    }
    return parents;
  },
  getDefaults: function() {
    return this.parents().reduce(function(defaults,namespace) {
      return _.defaults(defaults,namespace._defaults);
    },this._defaults);
  },
  fullName: function() {
    return this.parents().reduce(function(name,namespace) {
      if(namespace.name === "") return name;
      return namespace.name + ":" + name;
    },this.name).replace(/^root:/,"");
  },

  concatRoute: function(head,tail) {
    if(!head) return tail;
    return {type: "route", children: head.children.concat(tail.children)};
  },

  allRoutes: function() {
    var candidates = [];
    var candidate = this;
    var routes = [];
    while(candidate) {
      candidates = candidates.concat(_.values(candidate.byName));
      routes.push(candidate);
      candidate = candidates.pop();
    }
    return routes;
  },

  _joinName: function(nameA,nameB) {
    if(nameA === "") return nameB;
    return nameA + ":" + nameB;
  }
};

function Route(namespace,parent) {
  this.namespace = namespace;
  this._defaults = {};
  this.parent = parent;
}

Route.prototype = {
  fill: function(fill) {
    var route = new Route(this.namespace,this);
    route._defaults = _.defaults({},fill,route._defaults);
    return route;
  },
  _pathInfo: function(params) {
    params = params || {};
    var defaults = [params];
    var current = this;
    while(current) {
      defaults.push(current._defaults)
      var namespaceDefaults = current.namespace._defaults;
      if(namespaceDefaults) defaults.push(namespaceDefaults);
      current = current.parent || (current.namespace.parent && { namespace: current.namespace.parent, _defaults: {} });
    }
    var finalDefaults = defaults.reduce(function(current,next) {
      return _.defaults(current,next);
    });
    return { defaults: finalDefaults };
  },
  path: function(params) {
    var pathInfo = this._pathInfo(params); 
    return this.toUrlComponent(pathInfo.defaults);
  },
  toUrlComponent: function(params) {
    // TODO route
    return this.routeComponentToString(this.namespace._route,params);  
  },
  routeComponentToString: function(component, params) {
    switch(component.type) {
      case "route":
      case "optional":
        var value;
        try {
          return component.children.map(function(c) {
            return this.routeComponentToString(c,params)
          },this).join("");
        } catch(e) {
          return "";
        }
      case "literal":
        return "/" + component.value;
      case "required":
      case "splat":
        var value = params[component.value];
        if(value === undefined && component.type === "required") throw new Error("Missing value for required component " + component.name);
        return "/" + value;
      default:
        throw new Error("Unknown component type " + component.type);
    };
  },
  getRoute: function(name) {
    var child = this.namespace.getRoute(name);
    child.parent = this;
    return child;
  }
};

var Routing = {
  toRouteRegexp: function(component) {
    return new RegExp(this.routeComponentToRouteRegexpString(component));
  },
  toRouteRegexpString: function(component) {
    return this.routeComponentToRouteRegexpString(component);
  },
  routeComponentToRouteRegexpString: function(component) {
    switch(component.type) {
      case "route":
        return component.children.map(this.routeComponentToRouteRegexpString).join("");
      case "literal":
        return "/" + component.value;
      case "required":
        return "/([^/]+)"
      case "splat":
        return "(/.*)"
      case "optional":
        return "(" + component.children.map(this.routeComponentToRouteRegexpString).join("") + ")"
      default:
        throw new Error("Unknown component type " + component.type);
    }
  },
  routeToLinearComponents: function(component) {
    return _.flatten(this.componentToLinearComponents(component));
  },
  componentToLinearComponents: function componentToLinearComponents(component) {
    if(component.type in {required:1,splat:1}) return component.value;
    if(component.type in {optional:1,route:1}) return component.children.map(componentToLinearComponents);
    return [];
  }
};

var allPathComponents = '[\:\*]([^\:\/]+)';
var allPathComponentRe = new RegExp(allPathComponents);

Rooty.Routing = Routing;
Routing.Parser = Parser;

module.exports = Rooty;

function assert(test,msg) {
  if(!test) throw new Error(msg);
}
