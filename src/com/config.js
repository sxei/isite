// 整个工程的全局配置文件
var config = 
{
	protocol: 'http', // 协议，为将来升级https预留
	domain: 'liuxianan.com', // 主站域名
	// domain: 'xiaoming.com', // 主站域名
	siteName: '柳夏南的小窝' // 主站名称
};
// 资源站点路径
config.resSitePath = '//res.' + config.domain;
module.exports = config;