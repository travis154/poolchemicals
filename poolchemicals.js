
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , MongoStore = require('connect-mongo')(express)
  , async = require('async')
  , jade_browser = require('jade-browser')
  , moment = require('moment')
_.str = require('underscore.string');

var cms = require('./lib/cms');
cms.add('website_administration',{
	single:true,
	fields:{
		google_analytics:{type:'string', multi:true},
		logo:{type:'image', maintain_ratio:false,  crop_height:150, crop_width:240, sizes:[{prefix:"medium", width:240, height:180,}, {prefix:"mediumbig", width:370, height:370}]}		
	}
});
cms.add('website_home',{
	fields:{
		name:{type:"string"},
		slide:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:1170, 
			crop_height:550, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});

cms.add('website_products',{
	fields:{
		name:{type:"string"},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:1170, 
			crop_height:550, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		},
		caption:{
			type:'string',
			multi:true
		}
	}
});

cms.add('website_services',{
	fields:{
		name:{type:"string"},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:1170, 
			crop_height:550, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		},
		caption:{
			type:'string',
			multi:true
		}
	}
});


var app = express();

// all environments
app.set('port', process.env.PORT || 3033);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.cookieParser("herro"));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({secret:"herro",store: new MongoStore({url:'mongodb://127.0.0.1:27017/poolchemicals'}), cookie: { maxAge: 600000000 ,httpOnly: false, secure: false}}));
app.use(express.methodOverride());
app.use(jade_browser('/modals/packages.js', 'package*', {root: __dirname + '/views/modals', cache:false}));	
app.use(jade_browser('/modals/products.js', 'product*', {root: __dirname + '/views/modals', cache:false}));	
app.use(jade_browser('/templates.js', '**', {root: __dirname + '/views/components', cache:false}));	
app.use(function(req, res, next){
  	res.header('Vary', 'Accept');
	next();
});	
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

cms.listen(app);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
	async.auto({
		home:function(fn){
			cms
			.website_home
			.find()
			.lean()
			.exec(fn);
		},
		products:function(fn){
			cms
			.website_products
			.find()
			.lean()
			.exec(fn);			
		},
		services:function(fn){
			cms
			.website_services
			.find()
			.lean()
			.exec(fn);			
		}
	}, 
	function(err, page){
		if(err) throw err;
		var data = JSON.stringify(page);
		page.data = data;
		res.render('layout', page);
	});	

});
app.get('/company-info', function(req,res){
	res.render('company-info');
});
app.get('/contact', function(req,res){
	async.auto({
		faq:function(fn){
			cms
			.services_faq
			.find()
			.lean()
			.exec(fn);
		}
	}, 
	function(err, page){
		if(err) throw err;
		for(var i=0; i<page.faq.length; i++){
			var item = page.faq[i];
			item.title = _.str.slugify(item.name) + "-" + item._id;
		}
		res.render('contact', page);
	});	
});
app.get('/jobs', function(req,res){
	async.auto({
		page:function(fn){
			cms
			.jobs_page
			.findOne()
			.lean()
			.exec(fn);
		},
		posts:function(fn){
			cms
			.jobs_posts
			.find()
			.lean()
			.exec(fn);
		}
	}, 
	function(err, page){
		if(err) throw err;
		res.render('jobs', page);
	});
});
app.get('/press', function(req,res){
	press(req,res);
});
app.get('/press/:article', function(req,res){
	press(req,res,req.params.article);
});
app.get('/login', function(req,res){
	res.render('login');
});
app.post('/login', function(req,res){
	res.render('login',{login:true, used:"15MB", allowance:"25GB"});
});
app.get('/packages', function(req,res){
	packages(req, res);
});
app.get('/services', function(req,res){
	cms.services_services.find({}, function(err, services){
		res.render('services', {services:services});
	})
});

app.get('/packages/:package', function(req,res){
	packages(req, res, req.params.package);
});
app.get('/packages/:package/:product', function(req,res){
	packages(req, res, req.params.package, "/packages/" + req.params.package + "/" + req.params.product);
});
app.get('/products', function(req, res){
	products(req, res);
});
app.get('/products/:category', function(req, res){
	products(req, res, req.params.category);
});
app.get('/products/:category/:product', function(req, res){
	var product = req.params.product;
	products(req, res, req.params.category, product);
});
app.get('/rol', function(req, res){
	async.auto({
		management:function(fn){
			cms
			.company_management
			.find()
			.lean()
			.exec(fn);
		},
		affiliates:function(fn){
			cms
			.company_affiliates
			.find()
			.lean()
			.exec(fn);
		},
		press:function(fn){
			cms.company_press
			.find()
			.sort({_id:-1})
			//.lean() /* if lean is used it wont give ObjectId's timestamp */
			.exec(function(err, docs){
				if(err) throw err;
				for(var i=0; i<docs.length; i++){
					docs[i].url = "/press/" + _.str.slugify(docs[i].name);
					docs[i].slug = _.str.slugify(docs[i].name);
					docs[i].date = moment(docs[i]._id.getTimestamp()).format("DD/MM/YYYY");
				}
				var times = _.groupBy(docs,function(e){
					var x = moment(e._id.getTimestamp()); 
					var d = x.format('MMMM YYYY'); 
					return d; 
				});
				fn(null,times);
			});
		},
		info:function(fn){	
			cms
			.company_information
			.find()
			.lean()
			.exec(fn);
		}
		
	}, function(err, rol){
		res.render('aboutus', rol);
	});
})
function products(req, res, category, product){
	if(product){
		product = product.split("-");
		product.pop();
		product = product.join("-");
	}
	async.auto({
		products:function(fn){
			cms
			.sales_products
			.find()
			.sort({_id:1})
			.lean()
			.exec(fn);
		}
	}, function(err, products){
		var selected_product
		 ,  selected_product_parent;
		    
		for(var i=0; i<products.products.length; i++){
			var slug_cat = _.str.slugify(products.products[i].category);
			var slug_prod = _.str.slugify(products.products[i].name);
			products.products[i].slug = slug_prod;
			products.products[i].slug_cat = slug_cat;
			products.products[i].url = "/products/" + slug_cat + "/" + slug_prod + "-" + products.products[i]._id;
			products.products[i].selected = true;
			if(category && category != slug_cat){
				products.products[i].selected = false;
			}
			if(product && product == products.products[i].slug){				
				selected_product = products.products[i].url;
				selected_product_parent = "/products/" + slug_cat;
			}
		}
		//categories
		products.categories = _.uniq(_.pluck(products.products,'category'));
		for(var i=0; i<products.categories.length; i++){
			products.categories[i] = {
				name: products.categories[i],
				slug: _.str.slugify(products.categories[i]),
				url: '/products/' + _.str.slugify(products.categories[i])
			}
			if(category && category == products.categories[i].slug){
				products.categories[i].selected = true;
			}
		}
		if(category){
			products.selected = category;
			if(product){
				products.selected_product = selected_product;
				products.selected_product_parent = selected_product_parent;
			}
		}
		res.render('products', products);
	});

}
function press(req,res,article){
	var sel;
	async.auto({
		contacts:function(fn){
			cms.company_contacts
			.find()
			.sort({_id:1})
			.lean()
			.exec(fn);
		},
		press:function(fn){
			cms.company_press
			.find()
			.sort({_id:-1})
			//.lean() /* if lean is used it wont give ObjectId's timestamp */
			.exec(function(err, docs){
				if(err) throw err;
				for(var i=0; i<docs.length; i++){
					docs[i].url = "/press/" + _.str.slugify(docs[i].name);
					docs[i].slug = _.str.slugify(docs[i].name);
					docs[i].date = moment(docs[i]._id.getTimestamp()).format("DD/MM/YYYY");
					if(article == docs[i].slug){
						sel = docs[i];
					}
				}
				var times = _.groupBy(docs,function(e){
					var x = moment(e._id.getTimestamp()); 
					var d = x.format('MMMM YYYY'); 
					return d; 
				});
				fn(null,times);
			});
		}
	}, function(err, page){
		if(article){
			page.select = sel;
		}
		res.render('press', page);
	});

}
function packages(req,res,select, product){
	async.auto({
		navigation:function(fn){
			cms
			.services_categories
			.find()
			.lean()
			.exec(function(err, docs){
				if(err) throw err;
				var nav;
				if(select)
					nav = generateURL(docs, "name", "packages", select);
				else
					nav = generateURL(docs, "name", "packages");
				fn(err, nav);
			});
		},
		categories:function(fn){
			cms
			.services_categories
			.find()
			.lean()
			.exec(fn);
		},
		packages:function(fn){
			cms
			.services_packages
			.find()
			.lean()
			.exec(function(err, packages){
				var packages = _.map(packages, function(p){
					p.url = "/packages/" + _.str.slugify(p.category) + "/" + _.str.slugify(p.name);
					return p;
				});
				fn(err, packages);
			});
		}
	}, function(err, page){
		var packages_grp = _.groupBy(page.packages,'category');
		var categories_grp = _.groupBy(page.categories, 'name');
		var packages = [];
		for(var p in packages_grp){
			var obj = {
				name:p, 
				description:categories_grp[p][0].description, 
				packages:packages_grp[p]
			};
			if(select){
				if(select == _.str.slugify(p)){
					obj.active = true;
				}else{
					obj.active = false;
				}
			}else{
				obj.active = true;
			}
			packages.push(obj);		
		}

		page.packages = packages;
		if(product){
			page.product = product;
			var parent = product.split("/");
			parent.pop();
			page.product_parent = parent.join("/");
		}
		res.render('packages', page);
	});

}

function generateURL(urls, key, append, select){
	var append = append ? "/" + append + "/":'';
	return _.map(urls, function(d){
		var obj = {
			text:d[key], 
			url:append + _.str.slugify(d[key]),
			slug:_.str.slugify(d[key])
		}
		if(select && obj.slug == select){
			obj.active = true;
		}
		return obj;
	});
}
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
