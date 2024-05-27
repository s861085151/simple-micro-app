import { fetchSource } from './utils'

export default function loadHtml(app) {
  fetchSource(app.url)
    .then((html) => {
      console.log("source html：", html);
      html = html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, (match) => {
        // 将 head 标签替换为 micro-head，因为一个 web 页面只允许有一个 head 标签
        return match.replace(/<head/i, '<micro-app-head').replace(/<\/head>/i, '</micro-app-head>')
      }).replace(/<body[^>]*>[\s\S]*?<\/body>/i, (match) => {
        // 将 body 标签替换为 micro-app-body，防止与基座应用的 body 标签重复导致的问题。
        return match
          .replace(/<body/i, '<micro-app-body')
          .replace(/<\/body>/i, '</micro-app-body>')
      })

      // 将 html 转化为 DOM 结构
      const htmlDom = document.createElement('div');
      htmlDom.innerHTML = html;
      console.log('source html dom：', htmlDom)   

      // 进一步提取 js、css 资源
      extractSourceDom(htmlDom, app);

      // 获取 mirco-app-head 元素
      const microAppHead = htmlDom.querySelector('micro-app-head');
      console.log('app', app);
      // 如果有远程css资源，则通过fetch请求
      if(app.source.links.size > 0) {
        fetchLinksFromHtml(app, microAppHead, htmlDom)
      } else {
        app.onLoad(htmlDom)
      }

      if(app.source.scripts.size > 0) {
        fetchScriptsFromHtml(app, htmlDom)
      } else {
        app.onLoad(htmlDom)
      }
    })
    .catch((e) => {
      console.log("加载html出错", e);
    });
}


/**
 * 递归处理每一个子元素
 * @param {*} parent 父元素
 * @param {*} app app实例
 */
/**
 * DOM结构
 * <div>
 *    <micro-head>
 *        <style></style>
 *        <script></script>
 *    </micro-head>
 *    <micro-app-body>
 *        <div id="app">
 *            子应用内容
 *        </div>
 *    </micro-app-body>
 * </div>
 */
function extractSourceDom(parent, app) {
  const children = Array.from(parent.children);

  // 递归每一个子元素
  children.forEach((child) => {
    extractSourceDom(child, app)
  })

  for (const dom of children) {
    if(dom instanceof HTMLLinkElement) {
      // 提取css href 地址
      const href = dom.getAttribute('href');
      if(dom.getAttribute('rel') ==='stylesheet' && href) {
        // 计入到source.links缓存中
        app.source.links.set(href, {
          code: ''
        })
      }
      parent.removeChild(dom);
    } else if(dom instanceof HTMLScriptElement) {
      // 提取js src 地址  
      const src = dom.getAttribute('src')
      if(src) { // 远程src
        app.source.scripts.set(src, {
          code: '',
          isExternal: true // 是否为远程script
        })
      } else if (dom.textContent) {
        // 随机数
        const nonceStr = Math.random().toString(36).substr(2, 15);
        app.source.scripts.set(nonceStr, {
          code: dom.textContent,
          isExternal: false // 是否为远程script
        })
      }

      parent.removeChild(dom)
    } else if(dom instanceof HTMLStyleElement) {
      // 进行样式隔离
    }
  }

}

/**
 * 获取links远程资源
 * @param {*} app 
 * @param {*} microAppHead 
 * @param {*} htmlDom 
 */
export function fetchLinksFromHtml(app, microAppHead, htmlDom) {
  const linkEntries = Array.from(app.source.links.entries());
  // 通过fetch请求所有的资源
  const fetchLinkPromise = [];
  for (const [url] of linkEntries) {
    fetchLinkPromise.push(fetchSource(url, app))
  }

  Promise.all(fetchLinkPromise).then((res) => {
    for (let i = 0; i < res.length; i++) {
      const code = res[i];
      // 拿到css资源放入style元素中并插入到micro-app-head中
      const link2Style = document.createElement('style');
      link2Style.textContent = code;
      microAppHead.appendChild(link2Style);

      // 当拿到的css资源放入到缓存中，再次渲染可以从缓存中获取
      linkEntries[i][1].code = code;
    }
    
    // 处理完成后执行app.onLoad方法
    app.onLoad(htmlDom);
  }).catch((e) => {
    console.log('css加载出错', e);
  })
}

/**
 * 获取js远程资源
 * @param {*} app 应用实例
 * @param {*} htmlDom Dom结构
 */
export function fetchScriptsFromHtml(app, htmlDom) {
  const scriptEntries = Array.from(app.source.scripts.entries());
  // 通过fetch请求所有的js资源
  const fetchScriptPromise = [];
  for (const [url, info] of scriptEntries) {
    // 如果是内联的script，则不需要请求资源
    if(!info.isExternal) {
      fetchScriptPromise.push(Promise.resolve(info.code))
    } else {
      fetchScriptPromise.push(fetchSource(url, app))
    }
  }

  Promise.all(fetchScriptPromise).then((res) => {
    console.log('fetchScriptsFromHtml', res);
    for (let i = 0; i < res.length; i++) {
      const code = res[i];
      scriptEntries[i][1].code = code;
    }

    // 处理完成后执行app.onLoad方法
    app.onLoad(htmlDom);
  }).catch((e) => {
    console.log('js加载出错', e);
  })
  
}