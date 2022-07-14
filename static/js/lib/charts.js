var dom1 = document.getElementById("container1");
var dom2 = document.getElementById("container2");
var dom3 = document.getElementById("container3");
var myChart1 = echarts.init(dom1, null, {height: 400});
var myChart2 = echarts.init(dom2, null, {height: 400});
var myChart3 = echarts.init(dom3, null, {height: 400});
chart_init();
function chart_init(){
    window.onresize = function() {
      myChart1.resize();
      myChart2.resize();
      myChart3.resize();
    };
    Statistical(false);
}

function sum(arr) {
    return eval(arr.join("+"));
};

function chart1(myChart,result){
  //console.log(myChart1);
  myChart.clear();
  var total_num = new Array();
  for(var key in result){ // 输出字典元素，如果字典的key是数字，输出时会自动按序输出
    total_num.push(sum(result[key]));
  }
  var option;
  option = {
    title: {
      text: '总数变化趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: []
    },
    toolbox: {
      feature: {
        saveAsImage: { show: true }
      }
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: Object.keys(result)
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
        {
          name: '总数',
          type: 'line',
          stack: 'Total',
          label: {
            show: true,
            position: 'top'
          },
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: total_num
        }
    ]
  };

  if (option && typeof option === 'object') {
      myChart.setOption(option);
  }
}

function chart2(myChart,result,name){
    myChart.clear();
    var name_list = name;
    /*['裂缝', '网裂', '拥包', '沉陷', '路框差', '线状已修', '方形已修', '临时已修', '水泥路连接缝大',
    '松散', '沥青路面-坑槽', '沥青路面-纵向裂缝', '沥青路面-横向裂缝', '沥青路面-斜向裂缝', '沥青路面-网状裂缝','唧浆',
     '车辙', '水泥路-沉陷', '水泥路-拥包', '水泥板破碎', '水泥路-坑槽']*/
    var series_list = new Array();
    var data_temp = new Array();
    var num = 0;
    for(var key in result){ // 输出字典元素，如果字典的key是数字，输出时会自动按序输出
        data_temp.push(result[key]);
    }
    //转置
    var data_temp_T = data_temp[0].map(function(col, i) {
        return data_temp.map(function(row) {return row[i];})
    });
    //console.log(data_temp_T);
    for (var i=0; i < name_list.length; i++)
    {
        //console.log(content);
        series_list.push({
          name: name_list[i],
          type: 'bar',
          stack: 'Total',
          label: {
            show: true,
            position: 'right'
          },
          barMaxWidth: 15,
          emphasis: {
            focus: 'series'
          },
          data: data_temp_T[i]
        });
    }
    //console.log(series_list);
    var option;
    option = {
      title: {
        text: '各类型数量变化趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        axisPointer: {
          type: 'shadow'
        }
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: { show: true }
        }
      },
      legend: {
          type: 'scroll',
          top:'5%',
          height: "auto", // 图例组件的高度
          orient: 'vertical', //'horizontal' // vertical
          left:10,
          width: "85%"
      },
      grid: {
        left: '15%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: Object.keys(result)
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: series_list
    };
    if (option && typeof option === 'object') {
        myChart.setOption(option);
    }
}

function chart3(myChart,result,name){
    myChart.clear();
    var name_list = name;
    /*
    ['裂缝', '网裂', '拥包', '沉陷', '路框差', '线状已修', '方形已修', '临时已修',
    '水泥路连接缝大','松散', '沥青路面-坑槽', '沥青路面-纵向裂缝', '沥青路面-横向裂缝', '沥青路面-斜向裂缝',
    '沥青路面-网状裂缝','唧浆', '车辙', '水泥路-沉陷', '水泥路-拥包', '水泥板破碎', '水泥路-坑槽']*/
    var data_ = [];
    var data_temp = new Array();
    for(var key in result){ // 输出字典元素，如果字典的key是数字，输出时会自动按序输出
        data_temp.push(result[key]);
    }
    //转置
    var data_temp_T = data_temp[0].map(function(col, i) {
        return data_temp.map(function(row) {return row[i];})
    });
    for (var i=0; i < name_list.length; i++)
    {
        var num = sum(data_temp_T[i]);
        if(num > 0)
        {
            data_.push({ value: num, name: name_list[i]});
        }
    }
    var option;
    option = {
      title: {
        text: '各类型占比',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: { show: true }
        }
      },
      legend: {
          type: 'scroll',
          top:'5%',
          height: "auto", // 图例组件的高度
          orient: 'vertical', //'horizontal' // vertical
          left:10,
          width: "85%"
      },
      series: [
        {
          name: '',
          type: 'pie',
          radius: '50%',
          data: data_,
          label: {
            alignTo: 'edge',
            formatter: '{name|{b}}\n{time|({d}%)}',
            minMargin: 5,
            edgeDistance: 200,
            lineHeight: 15,
            rich: {
              time: {
                fontSize: 10,
                color: '#999'
              }
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    if (option && typeof option === 'object') {
        myChart.setOption(option);
    }
}

function RefreshText(result,name)
{
    var text1 = '根据总数变化趋势图可知，';
    var text2 = '根据各类型数量变化趋势图可知，';
    var text3 = '根据各类型占比图可知，';

    $('#card11_text').html(text1);
    $('#card21_text').html(text2);
    $('#card31_text').html(text3);
}

//向指定的url发送数据，由于数据为js变量，只能传递为字符串，如果直接写成data：{}，则可以使用JSON序列化，可以传递其他类型的变量
function post_data(data_,func){
    $.ajax({
        type: "POST",
        url: '/roadinfo',
        data: data_,/*data_属于对象，序列化后无法解析为原变量*/
        dataType: "json",
        timeout: 2000,
        async: false,
        success: function (data){
            //console.log(data)
            if (data['status']  == 'True')
            {
                func(data['message']);
                //console.log(post_result);
            }
            else
            {
                show_message('Warning',data['message']);
                //window.alert(data['message']);
            }
        }
    })
}

function Statistical(flag){
    //输入
    var DataSource = $('#DataSource').val();
    var SerialID = $('#SerialID').val();
    var StartDate = $('#StartDate').val();
    var EndDate = $('#EndDate').val();
    var SearchType = $('#SearchType').val();
    data_ = {"server":"Statistical","DataSource":DataSource,"SerialID":SerialID,"StartDate":StartDate,"EndDate":EndDate,"SearchType":SearchType};
    //console.log(data_)
    StatisticalRoadinfo = function(data){
        //console.log(data);
        //console.log(window.parent.frames);
        if (data['status'] ==1){
            //console.log(data['result']);
            if (flag == true)
            {
                show_message('Success','分析成功');
            }
            chart1(myChart1,data['result']);
            chart2(myChart2,data['result'],data['name']);
            chart3(myChart3,data['result'],data['name']);
        }
        else{
            show_message('Warning',data['result']);
        }

    };
    //传输请求
    post_data(data_,StatisticalRoadinfo);
}

var pdf_path = '';

$("#card1,#card2,#card3").dblclick(function(){
    if ($(this).css("border") != "1px solid rgb(33, 150, 243)" )
    {
        //console.log($(this).css("border"));
        $(this).css("border","1px solid #2196f3");
        //console.log($(this).parent());
        //console.log($(this).parent().prev());
        //$(this).parent().prev().children('.card').css("border","1px solid #2196f3");
    }
    else
    {
        //console.log($(this).css("border"));
        $(this).css("border","1px solid #e7eaed");
        //$(this).parent().prev().children('.card').css("border","1px solid #e7eaed");
    }
});

function showbox() //显示弹出层
{
    //console.log($("#Type").ySelectedValues(","));
    var hideobj=document.getElementById("hidebg");
    hidebg.style.display="block"; //显示隐藏层
    hidebg.style.animation="0.3s fade-in-60"; //显示隐藏层
    hidebg.style.height=document.body.clientHeight+"px"; //设置隐藏层的高度为当前页面高度
    document.getElementById("loadingbox").style.display="block"; //显示弹出层
    document.getElementById("loadingbox").style.animation="0.3s fade-in-100"; //显示隐藏层
    //console.log('showbox');
}

function showhidebox() //显示弹出层
{
    document.getElementById("hidebox").style.display="block"; //显示弹出层
    document.getElementById("hidebox").style.animation="0.3s fade-in-100"; //显示隐藏层
    var pdf_page =document.getElementById("pdf_page");
    pdf_page.style.width = "90vw";//document.body.clientWidth * 0.9+"px";
    pdf_page.style.height = "90vh";//document.body.clientHeight * 0.6+"px";
    var url= pdf_path.slice(1);//"/static/report_temp/Hello.pdf";//这里就可以做url动态切换--主要是使用iframe
    //console.log(url);
    $("#pdf_page").attr("src",url);
    $('.pdf').media();
    document.getElementById("loadingbox").style.animation="0.3s fade-out-100";
    setTimeout(function () {
        document.getElementById("loadingbox").style.display="none";
    },300);
}

function hidebox() //去除隐藏层和弹出层
{
    document.getElementById("hidebox").style.animation="0.3s fade-out-100";
    document.getElementById("hidebg").style.animation="0.3s fade-out-60";
    setTimeout(function () {
        document.getElementById("hidebox").style.display="none";
        document.getElementById("hidebg").style.display="none";
    },300);
}

$('#download_button').click(function(){
    showbox();
    //Statistical(true);
    //ajax会导致css延迟刷新，因为需要立即刷新，所以将ajax延迟执行
    setTimeout(function () {
        var img_option =  {
            'type': 'png', // 导出的格式，可选 png, jpeg
            'pixelRatio': 2, // 导出的图片分辨率比例，默认为 1。
            'backgroundColor':'#ffffff' ,// 导出的图片背景色，默认使用 option 里的 backgroundColor
            'excludeComponents':['toolbox'] //忽略toolbox
        }
        var image1 = myChart1.getDataURL(img_option);
        var image2 = myChart2.getDataURL(img_option);
        var image3 = myChart3.getDataURL(img_option);
        var DataSource = $('#DataSource').val();
        var SerialID = $('#SerialID').val();
        var StartDate = $('#StartDate').val();
        var EndDate = $('#EndDate').val();
        var SearchType = $('#SearchType').val();
        $.ajax({
            type: "POST",
            url: '/getpdf',
            data: JSON.stringify({ 'server': 'create_pdf',
                    'part':{ 'part1':{'image':image1,'text':''},'part2':{'image':image2,'text':''},'part3':{'image':image3,'text':''}},
                    'condition':{"DataSource":DataSource,"SerialID":SerialID,"StartDate":StartDate,"EndDate":EndDate,"SearchType":SearchType}}),/*data_属于对象，序列化后无法解析为原变量*/
            dataType: "json",
            timeout: 2000,
            async: false,
            success: function (data){
                //console.log(data);
                pdf_path = data['message']['pdf_path'];
                showhidebox();
            }
        });
    }, 50)
});