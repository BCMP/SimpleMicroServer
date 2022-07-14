/*(function($){...})(jQuery)
就是定义一个匿名函数function($)，函数要求传入的类型是jquery对象。
然后调用这个函数，向里面传值jquery对象：(function($){...})(jQuery)
等价于
function name(jquery){
　　//...
};
name(param);
这里jquery作为实参而不是使用$是为了避免和其他将$作为标志的函数冲突，$作为形参，只作用于函数内部，不会对外部产生影响。
*/
//界面加载时设置表格样式，更新表格数据
(function($) {
    'use strict';
    $('#UserTable').DataTable({
          "aLengthMenu": [[5, 10, 15, -1],[5, 10, 15, "All"]], //更改显示记录数选项
          "iDisplayLength": 10,
          "language": {search: ""},
          "ordering": false,
          "searching": false,
          "paging": false,
          "info": false
        });
    //$(function(){})也就是$(document).ready(function(){})的简写
    $(function(){
        search_by_condition(false);
    })
})(jQuery);

//刷新页面数据，可以当参数传递使用
refreshUserChart = function(data){
    var result = data['result']
    //console.log(result)
    var sum = data['sum']
    //console.log(sum)
    var str = "";
    for(var i = 0 ; i < result.length ; i++){
        str += "<tr role=\"row\">"
        str += "<td id=\"id"+(i+1).toString()+"\">"+result[i][0]+"</td>";
        str += "<td id=\"name"+(i+1).toString()+"\">"+result[i][1]+"</td>";
        str += "<td id=\"username"+(i+1).toString()+"\">"+result[i][2]+"</td>";
        str += "<td id=\"usertype"+(i+1).toString()+"\">"+result[i][3]+"</td>";
        str += "<td>";
        str += "<button class=\"btn btn-link\" d=\"edit"+(i+1).toString()+"\"><font color=\"#4169E1\" onclick=\"show_in_card("+(i+1).toString()+");showbox();\">编辑</font></button>";
        str += "<button class=\"btn btn-link\"><font color=\"#FF1493\" onclick=\"delete_userinfo("+(i+1).toString()+");\">删除</font></button>";
        str += "</td>";
        str += "</tr>";
    }
    //console.log(str)
    $("#UserInfo").html(str);
    //console.log(result);
    document.getElementById("sum_of_userinfo").innerHTML = "共有"+sum+"条记录";
    document.getElementById("sum_of_pages").innerHTML = "/ "+Math.ceil(parseInt(sum)/10).toString();
    select_userinfo_condition.sum_of_pages = Math.ceil(parseInt(sum)/10);
    //select_userinfo_condition.num_of_pages = 1;
}

//向指定的url发送数据，由于数据为js变量，只能传递为字符串，如果直接写成data：{}，则可以使用JSON序列化，可以传递其他类型的变量
function post_data(data_,func){
    $.ajax({
        type: "POST",
        url: '/userinfo',
        data: data_,/*data_属于对象，序列化后无法解析为原变量*/
        dataType: "json",
        timeout: 10000,
        success: function (data){
            //console.log(data)
            if (data['status']  == 'True')
            {
                func(data['message']);
            }
            else
            {
                show_message('Warning',data['message']);
                //window.alert(data['message']);
            }
        }
    })
}

//存储筛选条件及页码信息
var select_userinfo_condition = {
    user_id:"",
    user_name:"",
    user_username:"",
    user_usertype:3,
    num_of_pages:1,
    sum_of_pages:1
};

//根据条件查询数据
function search_by_condition(flag){
    var id = $("#ID").val();
    var name = $("#Name").val();
    var username = $("#UserName").val();
    var usertype = $("#Type").ySelectedValues(',');//$("#Type").val();
    select_userinfo_condition.user_id = id;
    select_userinfo_condition.user_name = name;
    select_userinfo_condition.user_username = username;
    select_userinfo_condition.user_usertype = usertype;
    data = {"server":"search","id":id,"name":name,"username":username,"usertype":usertype,'num_of_pages':1}; //'num_of_pages':select_userinfo_condition.num_of_pages
    //console.log(data);
    //console.log(select_userinfo_condition.num_of_pages);
    post_data(data,refreshUserChart);
    select_userinfo_condition.num_of_pages = 1;
    $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
    if(flag){
        show_message('Success','查询成功');
    }
    //window.alert("编号为空");
}

//点击编辑或删除时所在行的信息
var userinfo_selected = {
    user_index:0,
    user_id:"",
    user_name:"",
    user_username:"",
    user_usertype:1
};

//将表格中被选中的那一行的信息显示在编辑表单中
//jquery有自带的函数也可以实现，但是在这个模板中会对样式产生影响，没找出是哪里的问题，所以采用了最基础的办法
function show_in_card(index){
    var user_id = get_select_userinfo("id",index);
    var user_name = get_select_userinfo("name",index);
    var user_username = get_select_userinfo("username",index);
    var user_usertype = get_select_userinfo("usertype",index);
    userinfo_selected.user_index = index;
    userinfo_selected.user_id = user_id;
    userinfo_selected.user_name = user_name;
    userinfo_selected.user_username = user_username;
    userinfo_selected.user_usertype = user_usertype;
    //console.log(userinfo_selected);
    //console.log(user_id);
    //console.log(user_name);
    //console.log(user_username);
    //console.log(user_usertype);
    reset_edit_form();
    //var select = document.getElementById("edit_usertype");
    //console.log(select.length - Number(user_usertype)-1);
    //select.options[select.length - Number(user_usertype)-1].selected = true;
}

//重置编辑表单，由于自带的reset会将改变下拉框的预选值，所以重写了一个函数
function reset_edit_form(){
    //清空
    $('#edit_id').val("");
    $('#edit_name').val("");
    $('#edit_username').val("");
    //设置默认值
    $('#edit_id').attr('placeholder',userinfo_selected.user_id);
    $('#edit_name').attr('placeholder',userinfo_selected.user_name);
    $('#edit_username').attr('placeholder',userinfo_selected.user_username);
    $("#edit_usertype").val(userinfo_selected.user_usertype);//设置value为xx的option选项为默认选中
}

//获取选择的行的人员信息，由于是对<td>添加的id，所以只能用这种方式获取<td></td>中的字符
function get_select_userinfo(name,index){
    var str = name+index.toString();
    var tdobj = document.getElementById(str);
    var userinfo = tdobj.innerHTML;
    return userinfo
}

//编辑表单提交后的操作，如果编辑成功则更改表格数据，则更新表格数据，否则弹出警告
function edit_userinfo(){
    //判断是否有输入
    var edit_id = $('#edit_id').val() == ""?userinfo_selected.user_id:$('#edit_id').val();
    var edit_name = $('#edit_name').val()== ""?userinfo_selected.user_name:$('#edit_name').val();
    var edit_username = $('#edit_username').val()== ""?userinfo_selected.user_username:$('#edit_username').val();
    var edit_usertype = $('#edit_usertype').val()== ""?userinfo_selected.user_usertype:$('#edit_usertype').val();
    //console.log(userinfo_selected.user_index);
    //console.log(edit_id);
    //console.log(edit_name);
    //console.log(edit_username);
    //console.log(edit_usertype);
    data_ = {"server":"edit","id":edit_id,"name":edit_name,"username":edit_username,"usertype":edit_usertype};
    EditUserinfo = function(data){
        if (data['status'] ==1){
            //console.log(data);
            var index = userinfo_selected.user_index;
            set_select_userinfo(index,"id",edit_id);
            set_select_userinfo(index,"name",edit_name);
            set_select_userinfo(index,"username",edit_username);
            set_select_userinfo(index,"usertype",edit_usertype);
            hidebox();
            reset_edit_form();
            show_message('Success','修改成功');
        }
        else{
            show_message('Error','更改失败');
            //window.alert("更改失败");
        }
    };
    //传输请求
    post_data(data_,EditUserinfo);
}

//设置表格数据
function set_select_userinfo(index,name,value){
    var str = name+index.toString();
    var tdobj = document.getElementById(str);
    tdobj.innerHTML = value;
    //console.log(str);
    //console.log(value);
}

//重置编辑表单，由于自带的reset会将改变下拉框的预选值，所以重写了一个函数
function reset_add_form(){
    //清空
    $('#add_name').val("");
    $('#add_username').val("");
    $('#edit_username').val("");
    $('#add_password').val("");
    $('#add_repassword').val("");
    $('#add_usertype').val("1");
}

//增加人员信息
function add_userinfo(){
    var add_name = $('#add_name').val()
    var add_username = $('#add_username').val()
    var add_password = $('#add_password').val()
    var add_repassword = $('#add_repassword').val()
    var add_usertype = $('#add_usertype').val()
    if (add_name == "" || add_username == "" || add_password == "" || add_repassword=="" || add_usertype=="")
    {
        show_message('Warning','人员信息不能为空');
        //window.alert("人员信息不能为空");
    }
    else{
        if (add_password == add_repassword){
            AddUserinfo = function(data){
                //data为后端传回的数据
                if (data['status'] ==1){
                    var id = select_userinfo_condition.user_id;
                    var name = select_userinfo_condition.user_name;
                    var username = select_userinfo_condition.user_username;
                    var usertype = select_userinfo_condition.user_usertype;
                    var num_of_pages = select_userinfo_condition.num_of_pages;
                    data_ = {"server":"search","id":id,"name":name,"username":username,"usertype":usertype,'num_of_pages':num_of_pages};
                    post_data(data_,refreshUserChart);
                    show_message('Success','新增成功');
                }
                else{
                    show_message('Error','新增失败');
                    //window.alert("新增失败");
                }
            };
            data = {"server":"add","name":add_name,"username":add_username,"password":add_password,"usertype":add_usertype};
            post_data(data,AddUserinfo);
        }
        else{
            show_message('Warning','两次密码不一致');
            //window.alert("两次密码不一致");
        }
    }
}

//删除人员信息
function delete_userinfo(index){
    var user_id = get_select_userinfo("id",index);
    data = {"server":"delete","id":user_id};//传入后端接口的data
    DeleteUserinfo = function(data){
        //data为后端传回的数据
        if (data['status'] ==1){
            var id = select_userinfo_condition.user_id;
            var name = select_userinfo_condition.user_name;
            var username = select_userinfo_condition.user_username;
            var usertype = select_userinfo_condition.user_usertype;
            var num_of_pages = select_userinfo_condition.num_of_pages;
            data_ = {"server":"search","id":id,"name":name,"username":username,"usertype":usertype,'num_of_pages':num_of_pages};
            post_data(data_,refreshUserChart);
            show_message('Success','删除成功');
        }
        else{
            show_message('Error','删除失败');
            //window.alert("删除失败");
        }
    };
    post_data(data,DeleteUserinfo);
}

//表格页面切换
function num_of_pages_enter(){
    if (parseInt($('#num_of_pages').val()) <=  parseInt(select_userinfo_condition.sum_of_pages))
    {
        select_userinfo_condition.num_of_pages = $('#num_of_pages').val();
        //$('#num_of_pages').val("");
        $('#num_of_pages').attr('placeholder',select_userinfo_condition.num_of_pages);
        //console.log(select_userinfo_condition.num_of_pages)
        //data = {"num_of_pages":select_userinfo_condition.num_of_pages};//传入后端接口的data
        var id = select_userinfo_condition.user_id;
        var name = select_userinfo_condition.user_name;
        var username = select_userinfo_condition.user_username;
        var usertype = select_userinfo_condition.user_usertype;
        var num_of_pages = select_userinfo_condition.num_of_pages;
        data = {"server":"search","id":id,"name":name,"username":username,"usertype":usertype,'num_of_pages':num_of_pages};
        //console.log(data);
        post_data(data,refreshUserChart);
    }
    else{
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
        show_message('Warning','超出最大页数');
        //window.alert("超出最大页数");
    }
}

//上一页按钮
function p_page_(){
    //console.log(parseInt($('#num_of_pages').val()),parseInt(select_userinfo_condition.sum_of_pages));
    if (parseInt($('#num_of_pages').val()) <= 1 || parseInt($('#num_of_pages').val()) > parseInt(select_userinfo_condition.sum_of_pages))
    {
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
    }
    if (parseInt($('#num_of_pages').val()) > 1 && parseInt($('#num_of_pages').val()) <= parseInt(select_userinfo_condition.sum_of_pages))
    {
        select_userinfo_condition.num_of_pages = parseInt($('#num_of_pages').val())-1;
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
        $('#num_of_pages').attr('placeholder',select_userinfo_condition.num_of_pages);
        num_of_pages_enter();
    }
}

//下一页按钮
function n_page_(){
    //console.log(parseInt($('#num_of_pages').val()),parseInt(select_userinfo_condition.sum_of_pages));
    if (parseInt($('#num_of_pages').val()) >= parseInt(select_userinfo_condition.sum_of_pages))
    {
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
    }
    if (parseInt($('#num_of_pages').val()) < parseInt(select_userinfo_condition.sum_of_pages))
    {
        select_userinfo_condition.num_of_pages = parseInt($('#num_of_pages').val())+1;
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
        $('#num_of_pages').attr('placeholder',select_userinfo_condition.num_of_pages);
        num_of_pages_enter();
    }
}

//首页按钮
function first_page_(){
    //console.log(parseInt($('#num_of_pages').val()),parseInt(select_userinfo_condition.sum_of_pages));
    if (parseInt($('#num_of_pages').val()) != 1)
    {
        select_userinfo_condition.num_of_pages = 1;
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
        $('#num_of_pages').attr('placeholder',select_userinfo_condition.num_of_pages);
        num_of_pages_enter();
    }
}

//尾页按钮
function end_page_(){
    //console.log(parseInt($('#num_of_pages').val()),parseInt(select_userinfo_condition.sum_of_pages));
    if (parseInt($('#num_of_pages').val()) != parseInt(select_userinfo_condition.sum_of_pages))
    {
        select_userinfo_condition.num_of_pages = parseInt(select_userinfo_condition.sum_of_pages);
        $('#num_of_pages').val(select_userinfo_condition.num_of_pages.toString());
        $('#num_of_pages').attr('placeholder',select_userinfo_condition.num_of_pages);
        num_of_pages_enter();
    }
}

//不能写到上面的函数里面，不然相当于方法中的方法，html无法调用
function showbox() //显示隐藏层和弹出层
{
    var hideobj=document.getElementById("hidebg");
    hidebg.style.display="block"; //显示隐藏层
    hidebg.style.height=document.body.clientHeight+"px"; //设置隐藏层的高度为当前页面高度
    document.getElementById("hidebox").style.display="block"; //显示弹出层
}

function hidebox() //去除隐藏层和弹出层
{
    document.getElementById("hidebg").style.display="none";
    document.getElementById("hidebox").style.display="none";
}

function showAddBox() //显示隐藏层和弹出层
{
    var hideobj=document.getElementById("hidebg");
    hidebg.style.display="block"; //显示隐藏层
    hidebg.style.height=document.documentElement.scrollHeight+50+"px"; //设置隐藏层的高度为当前页面高度
    document.getElementById("hideAddBox").style.display="block"; //显示弹出层
}

function hideAddBox(){
    document.getElementById("hidebg").style.display="none";
    document.getElementById("hideAddBox").style.display="none";
}

function clickhide(){
    hidebox();
    hideAddBox();
};