var provinces = ['shanghai', 'hebei','shanxi','neimenggu','liaoning','jilin','heilongjiang','jiangsu','zhejiang','anhui','fujian','jiangxi','shandong','henan','hubei','hunan','guangdong','guangxi','hainan','sichuan','guizhou','yunnan','xizang','shanxi1','gansu','qinghai','ningxia','xinjiang', 'beijing', 'tianjin', 'chongqing', 'xianggang', 'aomen'];
var request = require('request'), fs = require('fs');
provinces.forEach(province => {
    request('http://echarts.baidu.com/gallery/vendors/echarts/map/json/province/' + province + '.json').pipe(fs.createWriteStream(province + '.json'));
});
