/**
 * 获取静态资源
 * @param {*} url
 * @param {*} app
 */
export function fetchSource(url, app) {
  return fetch(url).then((res) => res.text());
}
