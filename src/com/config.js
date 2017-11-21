// 整个工程的全局配置文件
var config = 
{
	protocol: 'http', // 协议，为将来升级https预留
	domain: 'haoji.me', // 主站域名
	siteName: '好记么', // 主站名称
	weibo: 'http://weibo.com/liuxianan',
	github: 'https://github.com/sxei',
	cnzz: '1270741665'
};
// 资源站点路径
config.websiteHomePage = `${config.protocol}://${config.domain}/`;
config.resSitePath = `${config.protocol}://res.${config.domain}/`;
config.blogHomePage = `${config.protocol}://blog.${config.domain}/`;
module.exports = config;