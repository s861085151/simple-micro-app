import CreateApp, { appInstanceMap } from "./app";

// 自定义元素
class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ["name", "url"];
  }

  constructor() {
    super();
  }

  appName = "";
  appUrl = "";
  // name = "";
  // url = "";

  connectedCallback() {
    // 元素被插入到DOM时调用，此时去加载子应用的静态资源并渲染
    console.log("micro app is connected");
    console.log("this", this);
    const app = new CreateApp({
      name: this.appName,
      url: this.appUrl,
      container: this,
    });

    appInstanceMap.set(this.name, app);
  }

  disconnectedCallback() {
    // 子应用被删除时，执行的卸载操作
    console.log("micro app is disconnected");
    // 获取应用实例
    const app = appInstanceMap.get(this.name);
    // 如果有属性destory，则完全卸载应用包括缓存的文件
    app.unMount(this.hasAttribute("destory"))
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    // 元素属性发生变化时，执行的操作
    // 可以获取到name、url等属性的值
    console.log("attribute changed", attrName);
    if (attrName === "name" && !this.appName && newVal) {
      this.appName = newVal;
    }
    if (attrName === "url" && !this.appUrl && newVal) {
      this.appUrl = newVal;
    }
  }
}

// mrico-app 可能存在重复定义的情况，所以需要做一下边界处理
export function defineElement() {
  if (!window.customElements.get("micro-app")) {
    /**
     * 注册元素
     * 注册后，就可以像普通元素一样使用micro-app，当micro-app元素被插入或删除DOM时即可触发相应的生命周期函数。
     */
    window.customElements.define("micro-app", MyElement);
  }
}

/**
 * 注册元素
 * 注册后，就可以像普通元素一样使用micro-app，当micro-app元素被插入或删除DOM时即可触发相应的生命周期函数。
 */
// window.customElements.define('micro-app', MyElement)
