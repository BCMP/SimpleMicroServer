//类型、消息文本
function show_message(type,message_text){
    var heading_text = '<b>系 统 消 息</b>';//<font size="1.5"></font>
    var msg_text = '<font style="letter-spacing:2px;">'+message_text+'</font>';//'<font size="1" style="letter-spacing:2px;">'+message_text+'</font>'
    var time = 3000;
    var position_ = 'top-center1';//{ left : 'auto', right : '10px', top : '70px', bottom : 'auto' }
    var stack_num = 3;
    var showHideTransition_ = 'slide';
    //console.log(message_text);
    if(type == 'Success')
    {
        $.toast({
            text: msg_text, // Text that is to be shown in the toast
            heading: heading_text, // Optional heading to be shown on the toast
            icon: 'success', // Type of toast icon
            showHideTransition: showHideTransition_, // fade, slide or plain
            allowToastClose: true, // Boolean value true or false
            hideAfter: time, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
            stack: stack_num, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time

            position: position_, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values

            bgColor: '#71c016',
            textColor: 'white',
            textAlign: 'left',  // Text alignment i.e. left, right or center
            loader: true,  // Whether to show loader or not. True by default
            loaderBg: '#71c016',  // Background color of the toast loader
            beforeShow: function () {}, // will be triggered before the toast is shown
            afterShown: function () {}, // will be triggered after the toat has been shown
            beforeHide: function () {}, // will be triggered before the toast gets hidden
            afterHidden: function () {}  // will be triggered after the toast has been hidden
        });
    }
    if(type == 'Warning')
    {
        $.toast({
            text: msg_text, // Text that is to be shown in the toast
            heading: heading_text, // Optional heading to be shown on the toast
            icon: 'warning', // Type of toast icon
            showHideTransition: showHideTransition_, // fade, slide or plain
            allowToastClose: true, // Boolean value true or false
            hideAfter: time, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
            stack: stack_num, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time

            position: position_, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values

            bgColor: '#ffc100',
            textColor: 'white',
            textAlign: 'left',  // Text alignment i.e. left, right or center
            loader: true,  // Whether to show loader or not. True by default
            loaderBg: '#ffc100',  // Background color of the toast loader
            beforeShow: function () {}, // will be triggered before the toast is shown
            afterShown: function () {}, // will be triggered after the toat has been shown
            beforeHide: function () {}, // will be triggered before the toast gets hidden
            afterHidden: function () {}  // will be triggered after the toast has been hidden
        });
    }
    if(type == 'Error')
    {
        $.toast({
            text: msg_text, // Text that is to be shown in the toast
            heading: heading_text, // Optional heading to be shown on the toast
            icon: 'error', // Type of toast icon
            showHideTransition: showHideTransition_, // fade, slide or plain
            allowToastClose: true, // Boolean value true or false
            hideAfter: time, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
            stack: stack_num, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time

            position: position_, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values

            bgColor: '#ff4747',
            textColor: 'white',
            textAlign: 'left',  // Text alignment i.e. left, right or center
            loader: true,  // Whether to show loader or not. True by default
            loaderBg: '#ff4747',  // Background color of the toast loader
            beforeShow: function () {}, // will be triggered before the toast is shown
            afterShown: function () {}, // will be triggered after the toat has been shown
            beforeHide: function () {}, // will be triggered before the toast gets hidden
            afterHidden: function () {}  // will be triggered after the toast has been hidden
        });
    }
    if(type == 'Info')
    {
        $.toast({
            text: msg_text, // Text that is to be shown in the toast
            heading: heading_text, // Optional heading to be shown on the toast
            icon: 'info', // Type of toast icon
            showHideTransition: showHideTransition_, // fade, slide or plain
            allowToastClose: true, // Boolean value true or false
            hideAfter: time, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
            stack: stack_num, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time

            position: position_, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values

            bgColor: '#4d83ff',
            textColor: 'white',
            textAlign: 'left',  // Text alignment i.e. left, right or center
            loader: true,  // Whether to show loader or not. True by default
            loaderBg: '#4d83ff',  // Background color of the toast loader
            beforeShow: function () {}, // will be triggered before the toast is shown
            afterShown: function () {}, // will be triggered after the toat has been shown
            beforeHide: function () {}, // will be triggered before the toast gets hidden
            afterHidden: function () {}  // will be triggered after the toast has been hidden
        });
    }
}