/**
 * @author Chidambaram P G
 * @email chidambaram@rexav.in
 * @create date 2020-06-01 11:08:18
 * @modify date 2020-06-01 11:08:18
 * @desc [description]
 */

window.ipcRenderer = require('electron').ipcRenderer;
window.session = require('electron').remote.session
// window.session = session
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
