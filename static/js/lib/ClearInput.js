//当键盘焦点移到输入
$("input").focus(function(){
    //console.log('focus');
    if($(this).val() == '')
    {
        $(this).parent().children(".btn-input-clear").css('display','none');
    }
    else
    {
        $(this).parent().children(".btn-input-clear").css('display','block');
    }
});
//输入发生变化时
$('input').bind('input propertychange', (function(){
    if($(this).val() == '')
    {
        $(this).parent().children(".btn-input-clear").css('display','none');
    }
    else
    {
        $(this).parent().children(".btn-input-clear").css('display','block');
    }
}));
//当键盘焦点从输入移开
$("input").blur(function(){
    //console.log('blur');
    if($(this).val() == '')
    {
        $(this).parent().children(".btn-input-clear").css('display','none');
    }
    else
    {
        $(this).parent().children(".btn-input-clear").css('display','block');
    }
});

$(".btn-input-clear").click(function(){
    //console.log('click');
    $(this).parent().find('input').val('');
    $(this).css('display','none');
});
$(".btn-input-clear").css('font-size','0.5rem');
$(".btn.btn-rounded").css('font-size','0.5rem');
$(".mdi-window-close").css('font-size','0.5rem');
$(".mdi-window-close").css('text-anchor','middle');
$(".mdi-window-close").css('vertical-align','-webkit-baseline-middle');
