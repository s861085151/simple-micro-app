/**
 * style元素插入到文档后会创建css样式表，但有些style元素(比如动态创建的style)在执行样式隔离时还没插入到文档中，此时样式表还没生成。
 * 所以我们需要创建一个模版style元素，它用于处理这种特殊情况，模版style只作为格式化工具，不会对页面产生影响。
 * 
 * 还有一种情况需要特殊处理：style元素被插入到文档中后再添加样式内容。这种情况常见于开发环境，通过style-loader插件创建的style元素。
 * 对于这种情况可以通过MutationObserver监听style元素的变化，当style插入新的样式时再进行隔离处理。
 */
let templateStyle //模版style

/**
 * 进行样式隔离
 * @param {HTMLStyleElement} styleElement style元素 
 * @param {string} appName 应用名称(唯一)
 */
export default function scopedCSS(styleElement, appName) {
  console.log('styleElement', styleElement.sheet);
  // 前缀
  const prefix = `micro-app[name=${appName}]`

  // 初始化创建模版标签
  if(!templateStyle) {
    templateStyle = document.createElement('style');
    document.body.appendChild(templateStyle);
    // 设置样式表无效，防止对应用造成影响
    templateStyle.sheet.disabled = true;
  }

  if(styleElement.textContent) {
    // 将元素内容赋值给模版元素
    templateStyle.textContent = styleElement.textContent;
    // 格式化规则，并将格式化后的规则赋值给style元素
    styleElement.textContent = scopedRule(Array.from(templateStyle.sheet?.cssRules ?? []), prefix)
    // 清空模版style内容
    templateStyle.textContent = ''
  } else {
    // 监听动态添加内容的style元素
    const observer = new MutationObserver(function () {
      // 断开监听
      observer.disconnect()
      // 格式化规则，并将格式化后的规则赋值给style元素
      styleElement.textContent = scopedRule(Array.from(styleElement.sheet?.cssRules ?? []), prefix)
    })

    // 监听style元素的内容是否变化
    observer.observe(styleElement, { childList: true })
  }
}

/**
 * scopedRule方法主要进行CSSRule.type的判断和处理，CSSRule.type类型有数十种，
 * 我们只处理STYLE_RULE、MEDIA_RULE、SUPPORTS_RULE三种类型，它们分别对应的type值为：1、4、12，其它类型type不做处理。
 * 
 * 依次处理每个cssRule
 * @param {CSSRuleList} rules cssRules
 * @param {string} prefix 前缀
 */
function scopedRule(rules, prefix) {
  let result = '';
  for (const rule of rules) {
    switch (rule.type) {
      case rule.STYLE_RULE: 
        result += scopedStyleRule(rule, prefix);
        break;
      case rule.MEDIA_RULE: 
        result += scopedPackRule(rule, prefix, 'media');
        break;
      case rule.SUPPORTS_RULE: 
        result += scopedPackRule(rule, prefix, 'supports');
        break;
      default:
        result += rule.cssText;
    }
  }
  return result;
}

/**
 * 修改css规则，添加前缀
 * @param {CSSRule} rule 
 * @param {string} prefix 
 */
function scopedStyleRule (rule, prefix) {
  // 获取CSS规则对象的选择和内容
  const { selectorText, cssText } = rule

  // 处理顶层选择器，如 body，html 都转换为 micro-app[name=xxx]
  if (/^((html[\s>~,]+body)|(html|body|:root))$/.test(selectorText)) {
    return cssText.replace(/^((html[\s>~,]+body)|(html|body|:root))/, prefix)
  } else if (selectorText === '*') {
    // 选择器 * 替换为 micro-app[name=xxx] *
    return cssText.replace('*', `${prefix} *`)
  }

  const builtInRootSelectorRE = /(^|\s+)((html[\s>~]+body)|(html|body|:root))(?=[\s>~]+|$)/

  // 匹配查询选择器
  return cssText.replace(/^[\s\S]+{/, (selectors) => {
    return selectors.replace(/(^|,)([^,]+)/g, (all, $1, $2) => {
      // 如果含有顶层选择器，需要单独处理
      if (builtInRootSelectorRE.test($2)) {
        // body[name=xx]|body.xx|body#xx 等都不需要转换
        return all.replace(builtInRootSelectorRE, prefix)
      }
      // 在选择器前加上前缀
      return `${$1} ${prefix} ${$2.replace(/^\s*/, '')}`
    })
  })
}

// 处理media 和 supports
function scopedPackRule (rule, prefix, packName) {
  // 递归执行scopedRule，处理media 和 supports内部规则
  const result = scopedRule(Array.from(rule.cssRules), prefix)
  return `@${packName} ${rule.conditionText} {${result}}`
}