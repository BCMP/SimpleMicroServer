$('#submit').click(function(){
    var name = $("#name").val();
    var username = $("#username").val();
    var password = $("#password").val();
    var repassword = $("#repassword").val();
    if (password != repassword)
    {
        show_message('Warning',"两次密码输入不一致");
    }
    else
    {
        var data_ = {"name":name,"username":username,"password":password,"repassword":repassword}
        console.log(data_);
        $.ajax({
            type: "POST",
            url: '/register',
            data: data_,/*data_属于对象，序列化后无法解析为原变量*/
            dataType: "json",
            timeout: 2000,
            async: false,
            success: function (data){
                console.log(data)
                if (data['status']  == '0')
                {
                    show_message('Warning',data['message']);
                    //window.alert(data['message']);
                }
                else if(data['status']  == '1')
                {
                    show_message('Success',data['message']);
                }
            }
        })
    }
})