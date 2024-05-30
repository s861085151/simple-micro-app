import loadHtml from "./source";
import Sandbox from './sandbox';

export const appInstanceMap = new Map(); // 应用实例映射表

export default class CreateApp {

  name = ""; // 应用名称
  url = ""; // 应用地址
  container = ""; // 应用容器

  status = "created"; // 组件状态，包括 created/loading/mount/unmount

  loadCount = 0;

  source = {
    html: '', // 应用html内容
    links: new Map(), // link元素对应的静态资源
    scripts: new Map(), // script元素对应的静态资源
  };

  constructor({ name, url, container }) {
    console.log("app create config：", name, url, container);
    this.name = name;
    this.url = url;
    this.container = container;
    this.status = "loading";
    loadHtml(this);

    this.sandbox = new Sandbox(name)
  }

  // 资源加载完毕后执行
  onLoad(htmlDom) {
    this.loadCount = this.loadCount ? this.loadCount + 1 : 1;
    // 第二次执行且组件未卸载时执行渲染
    if(this.loadCount === 2 && this.status !== 'unmount') {
      // 记录DOM结构用于后续操作
      this.source.html = htmlDom;
      // 执行mount方法
      this.mount();
    }
  }
  /**
   * 资源加载完后，进行渲染
   */
  mount () {
    // 克隆DOM节点
    const cloneHtml = this.source.html.cloneNode(true)
    // 创建一个fragment节点作为模版，这样不会产生冗余的元素
    const fragment = document.createDocumentFragment()
    Array.from(cloneHtml.childNodes).forEach((node) => {
      fragment.appendChild(node)
    })

    // 将格式化后的DOM结构插入到容器中
    this.container.appendChild(fragment)

    // 启动沙箱
    this.sandbox.start();

    // 执行js
    this.source.scripts.forEach((info) => {
      console.log('this.source', this.source, info);
      // (0, eval)(info.code)
      (0, eval)(this.sandbox.bindScope(info.code))
    })

    // 标记应用为已渲染
    this.status = 'mounted'
  }

  /**
   * 卸载应用
   * 执行关闭沙箱，清空缓存等操作
   */
  unMount(destory) {
    console.log('unmount');
    // 更新状态
    this.status = 'unmount'
    // 清空容器
    this.container = null;

    this.sandbox.stop();

    // destory为true，则删除应用
    if(destory) {
      appInstanceMap.delete(this.name)
    }
  }
}
