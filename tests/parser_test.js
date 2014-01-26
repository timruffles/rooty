testCase("RootyParser",[
  "libs/rooty_parser"
],function(
  Parser,
  run
) {

  run({
    "setUp": function(){
      this.parser = new Parser();
      this.parse = this.parser.parse;
    },
    "simple route parsing": {
      "root": function() {
        assert.same(0,this.parse("").children.length);
      },
      "literal": function() {
        var parsed = this.parse("/users");
        assert.same(1,parsed.children.length);
        assert.same("users",parsed.children[0].value);
      },
      "all literals": function() {
        assert.same(2,this.parse("/users/me").children.length);
      },
      "literals and required": function() {
        var parsed = this.parse("/tree/:id");
        assert.same(2,parsed.children.length);
        assert.same("id",parsed.children[1].value);
      },
      "literals and splats": function() {
        var parsed = this.parse("/tree/*path");
        assert.same(2,parsed.children.length);
        assert.same("path",parsed.children[1].value);
      },
      "required, splats, literals": function() {
        assert.same(3,this.parse("/:ref/:requirement/*path").children.length);
      }
    },
    "optionals": {
      "can handle optional components": function() {
        var parsed = this.parse("/repo(/:ref/:requirement/*path)");
        assert.same(2,parsed.children.length);
        var optional = parsed.children[1];
        assert.same(3,optional.children.length);
      },
      "disallowed": {
        "setUp": function() {
          var parse = this.parse;
          this.checkDisallowed = function(disallowed) {
            disallowed.forEach(function(path) {
              assert.exception(function() {
                parse(path);
              },undefined,"'P' to be refused".replace("P",path));
            });
          };
        },
        "ambiguous optionals followed by any non-literal": function() {
          this.checkDisallowed([
            "/repo(/:ref)/:something",
            "/repo(/:ref)/*something",
          ]);
        },
        "optionals followed by optionals": function() {
          this.checkDisallowed([
            "/repo(/:ref)(/:something)",
          ]);
        }
      }
    },
    "smoke test": function() {
      var parsed = this.parse("/repo/:ref<sha>/:report(/path(/:foo(/bar)))");
      assert.same("ref",parsed.children[1].value);
      assert.same("foo",parsed.children[3].children[1].children[0].value);
    },
    "types": {
      "accesses types in required": function() {
        assert.same("sha",this.parse("/repo/:ref<sha>/:report").children[1].hint.value);
      },
      "accesses types in splats": function() {
        assert.same("sha",this.parse("/repo/*ref<sha>/:report").children[1].hint.value);
      },
    }
  });

});
