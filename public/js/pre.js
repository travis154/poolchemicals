//preload images
var load = html5Preloader();

for(var i in poolchemicals){
	var e = poolchemicals[i];
	if(!e.length) continue;
	e.forEach(function(item){
		
		if(item.slide){
			load.addFiles("/files/" + item.slide);
			console.log('here');
		}
		if(item.image){
			load.addFiles("/files/" + item.image);
			console.log('heres');
		}
	});
}

$(function(){
	init();
	$(window).on('resize', init);
	var app = Davis(function () {
		this.get('/', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/']").addClass("current-url");
			render("home");
		});
		this.get('/products', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/products']").addClass("current-url");
			render("products");
		});
		this.get('/services', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/services']").addClass("current-url");
			render("services");
		});
		this.get('/contact', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/contact']").addClass("current-url");
			renderView("contact");
		});
		this.get('/packages/', function (req) {
			$("#package-modal").modal('hide');
		});
		this.get('/packages/:package', function (req) {
			$("#package-modal").modal('hide');
			console.log(req);
			var self = $(".nav a[nav-slug='"+req.params.package+"']");
			self.parent().parent().find("a").removeClass("active");
			self.addClass("active");

			var nav = self.text();
			$(".navigation-block[data-nav!='"+nav+"']").hide();
			$(".navigation-block[data-nav='"+nav+"']").show();					
		});
		this.get('/packages/:package/:item', function(req){
			var path = req.path;
			var data = $('a.package-box[data-path="'+path+'"]').data().data;
			data = JSON.parse(decodeURIComponent(data));
			var modal = jade.render('package',data);
			$("#modal-container").html(modal);
			var m = $("#package-modal").modal('show');
			m.on('hidden', function(){
				window.history.go(-1);
			});
			//app.trans();
		});
	})
	$("body").on("click", "#submenu h4", function(){
		var self = $(this);
		$("#submenu h4").removeClass("active");
		self.addClass("active");
		var index = self.data().index;
		$("#carousel").carousel(parseInt(index));
	});
	$("#subscribe").on("click", function(){
		var email = $("#subscribe-email").val();
		if(email == "" || !email){
			return alert("No email provided");
		}
		$.post("/subscribe",{email:email}, function(res){
			if(res.error){
				return alert(res.error);
			}
			$("#subscription-message").removeClass("hide").fadeIn();
		});
	});
	$("body").on("click", ".contact-menu", function(){
		$("#quickcontact").addClass("active");
	});
	$("#new-message-form").on('submit', function(e){
        e.preventDefault();
        var form = $(this);
        if(form.parsley('isValid')){
        	var data = form.serializeArray();
            var obj = {};
            data.forEach(function(e){
				obj[e.name] = e.value;
            });
			var url = "/contact";
			$.post(url, data, function(res){
				form.remove();
				$("#contact-status").text('Thank you for contacting us, we will get back to you shortly.');
			});
        }
	});
});
function render(menu){
	$("#quickcontact").removeClass("active");
	var select = poolchemicals[menu];
	var obj = {selected_data:select, selected:menu};
	var html = (jade.render("carousel", obj));
	$("#carousel").html(html);
}

function renderView(view){
	var html = jade.render(view);
	$("#submenu").html("");
	$("#content").html(html);
}

function init(){
	var width = $(window).width();
	var parent = $("#nav-parent");
	var stuff = $("#stuff");
	if(width > 450){
		parent.hide();
		stuff.show();
	}else{
		parent.show();
		stuff.hide();
	}
}
