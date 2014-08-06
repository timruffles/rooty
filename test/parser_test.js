var Parser = require("../src/parser");

module.exports = {
  "beforeEach": function(){
    this.parser = new Parser();
    this.parse = this.parser.parse;
  },
  "simple route parsing": {
    "root": function() {
      assert.equal(0,this.parse("").children.length);
    },
    "literal": function() {
      var parsed = this.parse("/users");
      assert.equal(1,parsed.children.length);
      assert.equal("users",parsed.children[0].value);
    },
    "all literals": function() {
      assert.equal(2,this.parse("/users/me").children.length);
    },
    "literals and required": function() {
      var parsed = this.parse("/tree/:id");
      assert.equal(2,parsed.children.length);
      assert.equal("id",parsed.children[1].value);
    },
    "literals and splats": function() {
      var parsed = this.parse("/tree/*path");
      assert.equal(2,parsed.children.length);
      assert.equal("path",parsed.children[1].value);
    },
    "required, splats, literals": function() {
      assert.equal(3,this.parse("/:ref/:requirement/*path").children.length);
    }
  },
  "optionals": {
    "can handle optional components": function() {
      var parsed = this.parse("/repo(/:ref/:requirement/*path)");
      assert.equal(2,parsed.children.length);
      var optional = parsed.children[1];
      assert.equal(3,optional.children.length);
    },
    "disallowed": {
      "beforeEach": function() {
        var parse = this.parse;
        this.checkDisallowed = function(disallowed) {
          disallowed.forEach(function(path) {
            assert.throws(function() {
              parse(path);
            },null,null,"'P' should be invalid".replace("P",path));
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
    assert.equal("ref",parsed.children[1].value);
    assert.equal("foo",parsed.children[3].children[1].children[0].value);
  },
  "types": {
    "accesses types in required": function() {
      assert.equal("sha",this.parse("/repo/:ref<sha>/:report").children[1].hint.value);
    },
    "accesses types in splats": function() {
      assert.equal("sha",this.parse("/repo/*ref<sha>/:report").children[1].hint.value);
    },
  }
}
