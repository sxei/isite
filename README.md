# haoji.me源码

http://haoji.me 站点源码，除了blog子域名大部分均开源于此，会陆陆续续将大部分代码都放在这里。

# webpack配置说明

## 目录结构

根目录只有2个文件夹，所有源码都在src下面，dist是构建输出目录。

构建规则：

* `src`下面每个文件夹都会出现在`dist`下面，每一个文件夹都对应着一个子域名，比如`game`文件夹对应着 http://game.haoji.me ;
* 只要名称为`index.html`的文件就会被认为入口HTML文件，只要名称是`index.js`的文件就会被认为是入口JS；
* 不过，`src/res`和`src/test`这2个文件夹比较特殊，会原样复制到dist；另外，只要文件夹名称是`asset`也会原样复制过去；
* 公共JS和CSS输出到`dist/res/bundle/common.js`和`dist/res/bundle/common.css`；

# 构建说明

开始时运行`run-dev.bat`，打包时，先运行`run-build.bat`，然后运行`run-gulp.bat`。