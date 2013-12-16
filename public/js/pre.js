$(function(){
	init();
	$(window).on('resize', init);
});

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
