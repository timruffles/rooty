# Rooty

*Warning - this isn't finished yet! Let me know if you'd like it to be.*

If you're fed up with:

- hand writing routes in views, and having to update them
- parsing and serializing data to the URL
- repeating yourself with nested views

Rooty might be for you!


## Why

Ever had to change a heap of href's in your JS app application because a route changed? Rooty gives you helpers to generate your URLs - just like Django or Rails.

```
link("repo:reports",{report: "repetition", user: "documentcloud", name: "backbone"});
-> "/repositories/documentcloud/backbone/reports/repetition"
```

Ever feel taking positional arguments from your routes (like Backbone) was a bit of a time waster? Rooty agrees, and turns your parameters into objects with keys and values.

```
rootyRouter.match("/repositories/documentcloud/backbone/reports/repetition")
-> triggers "repo:reports", {report: "repetition", user: "documentcloud", name: "backbone"}
```


Annoyed by defining heaps of routes with common prefixes? Rooty allows you to quickly build up namespaces of routes.

```
var appRoutes = new Rooty;
appRoutes.namespace("repo","/repo/:user/:name",function(repo){
	repo.route("reports","/reports(/:type)");
	repo.route("resource","/:ref/:resource/*path",{defaults: {resource: "blob"}});
});
```

Faffying over formatting objects into and out of URL strings? Rooty gives you a simple way to have typed components in your routes - easily getting Dates or custom application data types in and out of your URLs.

```
var appRoutes = new Rooty;
appRoutes.namespace("repo","/repo/:user<alpha>/:name<alpha>",function(repo){
	repo.route("/:ref<gitRef>/:resource<resource>/*path<path>",{defaults: {resource: "blob"}});
});
appRoutes.types({
	gitRef: {
		toString: function() {
		},
		fromString: function(string) {
		}
	},
	...
});
```

## Rooty plays well with others

Want to use Rooty with Backbone? You can. Want to use it with some other router? You can - if you plug it in to how routes are registered and triggered with that router.

Rooty has no dependencies. If you already use Underscore or Backbone, Rooty can use them to be even smaller.

## Philosophy

Rooty grew out of a few applications' experience of writing Backbone. 
