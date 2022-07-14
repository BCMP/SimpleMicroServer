var settings = {
    trigger:'hover',
    title:'预览图',
    content:'<p>这是预览图</p>',
    width:350,
    height:'auto',
    multi:false,
    closeable:false,
    style:'',
    padding:true
};

function initPopover(index){
    //console.log('initPopover');
    //$('.show-pop').webuiPopover('destroy').webuiPopover(settings);
    var name = '#largeContent'+index.toString()
    var largeContent = $(name).html();
    //console.log(largeContent);
    var largeSettings = {content:largeContent,
                        width:350,
                        height:'auto',
                        closeable:false};
    var name = '.show-pop-large'+index.toString()
    //console.log(name);
    $(name).webuiPopover('destroy').webuiPopover($.extend({},settings,largeSettings));
}

function initPopover1(index){
    //console.log('initPopover');
    //$('.show-pop').webuiPopover('destroy').webuiPopover(settings);
    var name = '#largeContent1_'+index.toString()
    var largeContent = $(name).html();
    //console.log(largeContent);
    var largeSettings = {content:largeContent,
                        width:350,
                        height:'auto',
                        closeable:false};
    var name = '.show-pop-large1_'+index.toString()
    //console.log(name);
    $(name).webuiPopover('destroy').webuiPopover($.extend({},settings,largeSettings));
}