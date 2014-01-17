
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
		about:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:true,   
			crop_width:455,
			crop_height:415
		},		
		mobile:{type:'string'},
		phone:{type:'string'},
		fax:{type:'string'},
		twitter:{type:'string'},
		facebook:{type:'string'},
		google_analytics:{type:'string', multi:true}
	}
});
cms.add('website_brands',{
	fields:{
		name:{type:"string"},
		image:{
			type:'image', 
			maintain_ratio:true,   
			crop_height:90,
			sizes:[
				{
					prefix:"medium", 
					height:90
				}
			]
		}		
	}
});
cms.add('website_home',{
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
cms.add('subscription_list',{
	single:true,
	readonly:true,
	fields:{
		name:{
			type:"table",
			readonly:true,
			columns:1,
			rows:1			
		}
	}
});
cms.run(function(){
	//setup pre requisites
	cms
	.subscription_list
	.findOne({},function(err, doc){
		if (err) throw err;
		if(!doc){
			new cms
			.subscription_list({name:{rows:[], columns:["Emails"]}})
			.save(console.log);	
		}
	});
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
	generate(req,res,'home');
});
app.get('/products', function(req, res){
	generate(req,res,'products');
});
app.get('/services', function(req, res){
	generate(req,res,'services');
});
app.get('/contact', function(req, res){
	generate(req,res,'contact');
});
app.post('/contact', function(req, res){
	res.end();
});
app.get('/about', function(req, res){
	generate(req,res,'about');
});
app.post('/subscribe', function(req, res){
	var email = req.body.email;
	if(email == ""){
		return res.json({error: "Invalid email"});
	}
	cms
	.subscription_list
	.update({},{$push:{'name.rows':[email]}},function(err, mail){
		if(err) throw err;
		res.json({message:"Subscribed"});
	});
});

function generate(req, res, route){
	async.auto({
		administration:function(fn){
			cms
			.website_administration
			.findOne()
			.lean()
			.exec(function(err, doc){
				fn(null, doc || {});
			});
		},
		brands:function(fn){
			cms
			.website_brands
			.find()
			.lean()
			.exec(fn);
		},
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
		if(page[route]){
			page[route].selected = true;
			page.selected_data = page[route];
		}
		page.selected = route;
		res.render('layout', page);
	});	

}


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
