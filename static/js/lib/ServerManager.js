(function($) {
    'use strict';
    $('#ServerTable').DataTable({
          "aLengthMenu": [[5, 10, 15, -1],[5, 10, 15, "All"]], //更改显示记录数选项
          //"iDisplayLength": 10,
          "language": {search: ""},
          "ordering": false,
          "searching": false,
          "paging": false,
          "info": false
        });
    //$(function(){})也就是$(document).ready(function(){})的简写
    $(function(){
        post_data();
    })
})(jQuery);
document.getElementById("add").onclick = function(){
    $("#add").attr("disabled","disabled");
    $.ajax({
       type:"POST",
       dataType: "json",
       url:"/add_server",
       data:JSON.stringify({"server": $("#ServiceType").ySelectedValues(),"group":$('#ServerGroup').val() == ""?"all":$('#ServerGroup').val()}),
       success:function(data){
           var now = new Date();
           time = dateFtt("yyyy-MM-dd hh:mm:ss",now);
           //console.log(time+" "+data['message']);
           show_message('Success',time+"<br>"+data['message']+'</br>');
           //window.alert(time+" "+data['message']);
           setTimeout(function(){post_data()}, 1000);
           setTimeout(function(){$("#add").removeAttr("disabled");}, 2000);
       }
    });
}
document.getElementById("delete").onclick = function(){
    $("#delete").attr("disabled","disabled");
    $.ajax({
       type:"POST",
       dataType: "json",
       url:"/delete_server",
       data:JSON.stringify({"server": $("#ServiceType").ySelectedValues(','),"group":$('#ServerGroup').val() == ""?"all":$('#ServerGroup').val()}),
       success:function(data){
           var now = new Date();
           time = dateFtt("yyyy-MM-dd hh:mm:ss",now);
           if (data['status'] == 0){
                show_message('Success',time+"<br>"+data['message']+'</br>');
                //window.alert(time+" "+data['message']);
           }
           else if(data['status'] == 1){
                show_message('Warning',time+"<br>"+data['message']+'</br>');
                //window.alert(time+" "+data['message']);
           }
           else{
                show_message('Error',time+"<br>"+data['message']+'</br>');
                //window.alert(time+" "+data['message']);
           }
           setTimeout(function(){post_data()}, 1000);
           setTimeout(function(){$("#delete").removeAttr("disabled");}, 2000);
       }
    });
}
function post_data(){
     $.ajax({
       type:"POST",
       dataType: "json",
       url:"/getdata",
       data:"",
       timeout: 10000,
       success:function(data){
           createShowingTable(data['Service']);
       }
     });
 }
//动态的创建一个table
function createShowingTable(data) {
     var tableStr = "";
     var len = data.length;
     for(var i = 0 ; i < len ; i++){
        tableStr += "<tr role=\"row\">";
        tableStr += "<td>"+ data[i][0]+ "</td>";
        tableStr += "<td>"+ data[i][1] + "</td>";
        if (data[i][2]){
            tableStr = tableStr + "<td><font color='#6f9300'>"+ data[i][2] + "</font></td>";
            tableStr = tableStr + "<td><font color='#6f9300'>"+ data[i][3] + "</font></td>";
         }
         else{
            tableStr = tableStr + "<td><font color='#a62626'>"+ data[i][2] + "</font></td>";
            tableStr = tableStr + "<td><font color='#a62626'>"+ data[i][3] + "</font></td>";
         }
        tableStr = tableStr +"<td>"+ data[i][4] + "</td></tr>";
    }
    $("#ServerInfo").html(tableStr);
}

var timing_func = null;
function timing_refresh(){
    if(document.getElementById("refresh").checked)
    {
        post_data();
        timing_func = setInterval(function(){post_data();},3000);
    }
    else
    {
        clearInterval(timing_func);
        timing_func = null;
    }
}

function dateFtt(fmt,date)
{
    var o = {
    "M+" : date.getMonth()+1,     //月份
    "d+" : date.getDate(),     //日
    "h+" : date.getHours(),     //小时
    "m+" : date.getMinutes(),     //分
    "s+" : date.getSeconds(),     //秒
    "q+" : Math.floor((date.getMonth()+3)/3), //季度
    "S" : date.getMilliseconds()    //毫秒
    };
    if(/(y+)/.test(fmt))
    fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
    if(new RegExp("("+ k +")").test(fmt))
    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}
