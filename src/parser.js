define([
],function(
) {

  var flip = function(obj) {
    return Object.keys(obj).reduce(function(flipped,k) {
      flipped[obj[k]] = k; return flipped;
    },{});
  };

  var Parser = function() {

    var TOKENS = {
      "COLON": ":",
      "GT": ">",
      "LT": "<",
      "SPLAT_PREFIX": "*",
      "L_PAREN": "(",
      "R_PAREN": ")",
      "IDENTIFIER": /^[a-zA-Z0-9-_]+/,
      "SLASH": "/"
    };
    var TOKEN_LOOKUP = flip(TOKENS);

    var tokenize = function(string) {
      var tokens = []; 
      var read = "";

      while(string.length) {
        var identifier = string.match(TOKENS.IDENTIFIER);
        if(identifier) {
          string = string.substr(identifier[0].length);
          read += identifier[0];
          tokens.push({type: "IDENTIFIER", value: identifier[0]});
          continue;
        }
        var next = string[0];
        string = string.substr(1);
        var tokenId = TOKEN_LOOKUP[next];
        if(tokenId) {
          tokens.push({type: tokenId, value: next});
          read += next; 
        } else {
          throw new Error("Unknown token after '" + read + "': " + next);
        }
      }
      return tokens;
    };

    var input;

    var done = function() {
      return input.length === 0;
    };

    var onlyAccept = function() {
      var val = accept.apply(null,arguments);
      if(!val) throw new Error("Expected one of " + [].slice.call(arguments));
      return val;
    };

    var takeToken = function() {
      var tok = onlyAccept.apply(null,arguments);
      next();
      return tok;
    };

    var accept = function() {
      var components = [].slice.call(arguments);
      var n = 0;
      var potentialPeek = components[components.length - 1];
      if(Number(potentialPeek) === potentialPeek) {
        n = components.pop();
      };
      var next = input[n];
      var val;
      [].some.call(components,function(id) {
        var token = TOKENS[id];
        if(token) {
          if(next && next.type === id) return val = next;
        } else {
          var node = GRAMMAR[id];
          if(node) return val = node();
          throw new Error("Unknown component " + id);
        }
      });
      return val;
    };
    
    var next = function() {
      input.shift();
    };

    var identiferWithType = function(type,prefix) {
      return function() {
        if(!accept(prefix)) return;
        next();
        var name = takeToken("IDENTIFIER");
        var hint = accept("TYPE");
        return {type: type, value: name.value, hint: hint}; 
      }
    };

    var GRAMMAR = {
      ROUTE: function() { 
        var component;
        var components = []
        while(component = accept("COMPONENT")) {
          components.push(component);
        }
        return {type: "route", children: components};
      },
      COMPONENT: function() {
        if(accept("SLASH")) {
          next();
          return onlyAccept("SPLAT","REQUIRED","LITERAL");
        }
        return accept("OPTIONAL");
      },
      TYPE: function() {
        if(!accept("LT")) return;
        next();
        var type = takeToken("IDENTIFIER");
        takeToken("GT");
        return {type: "type", value: type.value};
      },
      LITERAL: function() {
        return {type: "literal", value: takeToken("IDENTIFIER").value};
      },
      REQUIRED: identiferWithType("required","COLON"),
      SPLAT: identiferWithType("splat","SPLAT_PREFIX"),
      OPTIONAL: function() {
        if(!accept("L_PAREN")) return;
        next();
        var type = {type: "optional", children: onlyAccept("ROUTE").children};
        takeToken("R_PAREN");
        if(accept("SPLAT_PREFIX","COLON",1)) throw new Error("Can't follow optional by required or splat params - ambiguous");
        if(accept("L_PAREN")) throw new Error("Can't follow optional with an optional group");
        return type;
      },
    };

    var api = {
      tokenize: tokenize,
      parse: function(string) {
        var tokens = tokenize(string);
        return api.tokensToRoute(tokens);
      },
      tokensToRoute: function(something) {
        input = something;
        try {
          var route = GRAMMAR.ROUTE();
        } catch(e) {
          throw e;
        }
        if(!done()) throw new Error("Invalid next token " + input[0] + ", " + (input.length - 1) + " other tokens remaining");
        return route;
      }
    };
    return api;

  };

  return Parser;
})
