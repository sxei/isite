var provinces = ['shanghai', 'hebei','shanxi','neimenggu','liaoning','jilin','heilongjiang','jiangsu','zhejiang','anhui','fujian','jiangxi','shandong','henan','hubei','hunan','guangdong','guangxi','hainan','sichuan','guizhou','yunnan','xizang','shanxi1','gansu','qinghai','ningxia','xinjiang', 'beijing', 'tianjin', 'chongqing', 'xianggang', 'aomen'];
var provincesZh = ['上海', '河北', '山西', '内蒙古', '辽宁', '吉林','黑龙江',  '江苏', '浙江', '安徽', '福建', '江西', '山东','河南', '湖北', '湖南', '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '北京', '天津', '重庆', '香港', '澳门'];


var currentIdx = 0;
var myChart;
function showProvince()
{
    var name = provinces[currentIdx];
    myChart.showLoading();
    $.get('asset/province/' + name + '.json', function (geoJson)
    {
        myChart.hideLoading();
        echarts.registerMap(name, geoJson);
        myChart.setOption(
        {
            backgroundColor: '#404a59',
            title2: {
                text: provincesZh[currentIdx],
                left: 'center',
                textStyle: {
                    color: '#fff'
                }
            },
            series: [
                {
                    type: 'map',
                    mapType: name,
                    label: {
                        emphasis: {
                            textStyle: {
                                // 故意设置颜色一样以便隐藏文字
                                color: '#389BB7'
                            }
                        }
                    },
                    itemStyle: {
                        normal: {
                            borderColor: '#389BB7',
                            areaColor: '#fff',
                        },
                        emphasis: {
                            areaColor: '#389BB7',
                            borderWidth: 0
                        }
                    },
                    //animation: false
                    animationDurationUpdate: 1000,
                    animationEasingUpdate: 'quinticInOut'
                }
            ]
        });
    });
}
function showProvinceRandom()
{
    currentIdx = xei.getRandom(provinces.length);
    showProvince();
}
$('#next').on('click', function()
{
    showProvinceRandom();
});
$('#see_result').on('click', function()
{
    alert(provincesZh[currentIdx]);
});
$('#post_answer').click(function()
{
    var val = $('#answer').val();
    if(!val) alert('答案不能为空！');
    else if(val == provincesZh[currentIdx])
    {
        showProvinceRandom();
        $('#answer').val('');
        alert('恭喜你，回答正确！');
    }
});
$(function()
{
    myChart = echarts.init($('#panel')[0]);
    showProvinceRandom();
});
