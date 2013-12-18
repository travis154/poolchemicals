$(function(){
	init();
	$(window).on('resize', init);
	var app = Davis(function () {
		this.get('/products', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/products']").addClass("current-url");
			render("products");
		});
		this.get('/services', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/services']").addClass("current-url");
		});
		this.get('/contact', function (req) {
			$(".current-url").removeClass("current-url");
			$("a[href='/contact']").addClass("current-url");
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
	app.start();
});

function render(menu){
	var select = poolchemicals[menu];
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
