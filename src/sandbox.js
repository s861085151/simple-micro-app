// 记录 addEventListener 和 removeEventListener 原生方法
const rawWindowAddEventListener = window.addEventListener;
const rawWindowRemoveEventListener = window.removeEventListener;

/**
 * 重写全局事件的监听和解绑
 * @param {*} microWindow 原型对象
 */
function effect(microWindow) {
  // 使用Map记录全局事件
  const eventListenerMap = new Map();

  microWindow.addEventListener = function (type, listener, options) {
    const listenerList = eventListenerMap.get(type);
    // 当前事件非第一次监听，则添加缓存
    if (listenerList) {
      listenerList.add(listener);
    } else {
      // 当前事件为第一次监听，则初始化数据
      eventListenerMap.set(type, new Set([listener]));
    }

    return rawWindowAddEventListener.call(window, type, listener, options);
  };

  microWindow.removeEventListener = function (type, listener, options) {
    const listenerList = eventListenerMap.get(type);
    // 从缓存中删除监听的事件
    if (listenerList?.size && listenerList.has(listener)) {
      listenerList.delete(listener);
    }
    // 执行原生解绑函数
    return rawWindowRemoveEventListener.call(window, type, listener, options);
  };

  // 清空残余事件
  return () => {
    console.log("需要清空的全局事件", eventListenerMap);
    // 清空windows绑定事件
    if (eventListenerMap.size) {
      // 将残余的没有解绑的函数依次解绑
      eventListenerMap.forEach((listenerList, type) => {
        if (listenerList.size) {
          for (const listener of listenerList) {
            rawWindowRemoveEventListener.call(window, type, listener);
          }
        }
      });
      eventListenerMap.clear();
    }
  };
}

export default class Sandbox {
  active = false; // 沙箱是否在运行
  microWindow = {}; //代理的window对象
  injectedKeys = new Set(); //新添加的属性，在卸载时清空

  constructor() {
    // 卸载钩子
    this.releaseEffect = effect(this.microWindow);

    /**
     * 我们使用Proxy进行代理操作，代理对象为空对象microWindow，得益于Proxy强大的功能，实现沙箱变得简单且高效。
     * 在constructor中进行代理相关操作，通过Proxy代理microWindow，设置get、set、deleteProperty三个拦截器，此时子应用对window的操作基本上可以覆盖。
     */

    this.proxyWindow = new Proxy(this.microWindow, {
      get: (target, key) => {
        // 优先从代理对象上取值
        if (Reflect.has(target, key)) {
          return Reflect.get(target, key);
        }

        // 否则兜底到window对象上取值
        const rawValue = Reflect.get(window, key);

        // 如果兜底的值为函数，则需要绑定window对象，如：console，alert等
        if (typeof rawValue === "function") {
          const valueStr = rawValue.toString();
          // 排除构造函数
          if (
            !/^function\s+[A-Z]/.test(valueStr) &&
            !/^class\s+/.test(valueStr)
          ) {
            return rawValue.bind(window);
          }
        }

        // 其他情况下直接返回
        return rawValue;
      },
      set: (target, key, value) => {
        // 沙箱只有在运行的时候才可以设置变量
        if (this.active) {
          Reflect.set(target, key, value);

          // 记录新添加的变量，用于后续的清空操作
          this.injectedKeys.add(key);
        }
        return true;
      },
      deleteProperty: (target, key) => {
        // 当前key存在于代理对象上时才满足删除条件
        if (target.hasOwnProperty(key)) {
          Reflect.deleteProperty(target, key);
        }
        return true;
      },
    });
  }

  // 启动沙箱
  start() {
    if (!this.active) {
      console.log("start sandbox");
      this.active = true;
    }
  }

  // 停止沙箱
  stop() {
    if (this.active) {
      this.active = false;

      // 清空缓存的变量
      this.injectedKeys.forEach((key) =>
        Reflect.deleteProperty(this.microWindow, key)
      );
      this.injectedKeys.clear();

      // 卸载全局事件
      this.releaseEffect();
    }
  }

  /**
   *
   * 将子应用的js通过一个with函数包裹，修改js作用域，将子应用的window指向代理的对象。形式如：
   * (function(window, self) {
   *   with(window) {
   *     子应用的js代码
   *   }
   * }).call(代理对象, 代理对象, 代理对象)
   *
   */
  // 绑定js作用域
  bindScope(code) {
    window.proxyWindow = this.proxyWindow;
    return `;(function(window, self){with(window){;${code}\n}}).call(window.proxyWindow, window.proxyWindow, window.proxyWindow);`;
  }
}
