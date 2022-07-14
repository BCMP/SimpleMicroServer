(function($) {
  'use strict';
  $(function() {
    var body = $('body');
    var sidebar = $('.sidebar');
    //Add active class to nav-link based on url dynamically
    //Active class can be hard coded directly in html file also as require

    //Close other submenu in sidebar on opening any

    sidebar.on('show.bs.collapse', '.collapse', function() {
      sidebar.find('.collapse.show').collapse('hide');
    });

    //Change sidebar

    $('[data-toggle="minimize"]').on("click", function() {
      body.toggleClass('sidebar-icon-only');
    });

    //checkbox and radios
    $(".form-check label,.form-radio label").append('<i class="input-helper"></i>');
  });
})(jQuery);
function ChangePage(clicked,name){
    var external_frame = document.getElementsByClassName("external-frame");
    var $this = $(clicked);
    var sidebar = $('.sidebar');
    $('.nav li a', sidebar).each(function() {
      $(this).parents('.nav-item').last().removeClass('active');
    })
    addActiveClass($this);
    for (var i = 0; i < external_frame.length; i++)
    {
        external_frame[i].style.display="none";
    }
    document.getElementById(name).style.display="block";

    function addActiveClass(element) {
      element.parents('.nav-item').last().addClass('active');
      if (element.parents('.sub-menu').length) {
        element.closest('.collapse').addClass('show');
        element.addClass('active');
      }
      if (element.parents('.submenu-item').length) {
        element.addClass('active');
      }
    }
}
//var iframe = document.getElementById('external-frame')
//setIframeHeight(iframe);
//document.getElementById('SubPage-main-panel').style.visibility="visible";

//导航栏是否缩进
//正则获取url中的参数
function URL_Request(strName) {
    var strHref = document.location.toString();
    var intPos = strHref.indexOf("?");
    var strRight = strHref.substr(intPos + 1); //==========获取到右边的参数部分
    var arrTmp = strRight.split("&"); //=============以&分割成数组
    //console.log(strHref,intPos,strRight,arrTmp);
    for (var i = 0; i < arrTmp.length; i++) //===========循环数组
    {
        var dIntPos = arrTmp[i].indexOf("=");
        var paraName = arrTmp[i].substr(0, dIntPos);
        var paraData = arrTmp[i].substr(dIntPos + 1);
        if (paraName.toUpperCase() == strName.toUpperCase()) {
            return paraData;
        }
    }
    return "";
}

// document.domain = "caibaojian.com";
function setIframeHeight(iframe) {
    if (iframe) {
        var username = window.location.search;//URL_Request('username');
        iframe.src = "RoadManager/RoadManagerSubPage"+username;
        //console.log("RoadManager/RoadManagerSubPage"+username);
        var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
        if (iframeWin.document.body) {
            var height = iframeWin.document.body.scrollHeight;
            iframe.height = height;
        }
    }
};