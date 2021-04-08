import {getMacInfo, getPublishInfo, getWindowsInfo, init, isLoggedIn} from './plugin/index.js';

const helpCardUsageInfoSelector = '#help-card > div.MuiCardContent-root > div > span';
const dialogUsageInfoSelector = '#registryInfo--dialog-container .MuiDialogContent-root .MuiTypography-root span';
const tabSelector = '#registryInfo--dialog-container .MuiDialogContent-root .MuiTabs-flexContainer .MuiTab-wrapper';
const labelSelector = '#help-card > div.MuiCardContent-root > span';
const randomClass = 'Os1waV6BSoZQKfFwNlIwS';

// copied from here as it needs to be the same behaviour
// https://github.com/verdaccio/ui/blob/master/src/utils/cli-utils.ts
export function copyToClipboard(text: string) {
  const node = document.createElement('div');
  node.innerText = text;
  document.body.appendChild(node);
  const range = document.createRange();
  const selection = window.getSelection() as Selection;
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('copy');
  document.body.removeChild(node);
}

function modifyUsageInfoNodes(selector: string, findPredicate: (node: HTMLElement, i: number) => boolean, findUsageInfo: (node: HTMLElement) => string | undefined): void {
  const loggedIn = isLoggedIn();

  const infoElements: NodeListOf<HTMLSpanElement> = document.querySelectorAll(selector);
  const elements = Array.prototype.slice.call(infoElements) as Array<HTMLSpanElement>;
  const firstUsageInfoEl = elements.find(findPredicate);
  const usageInfo = elements.map(findUsageInfo).filter(info => info)[0];
  const hasInjectedElement = elements.find((node: HTMLElement) => node.parentElement!.classList.contains(randomClass));

  // We can't find any element related to usage instructions,
  // or we have already injected elements
  if (!firstUsageInfoEl || hasInjectedElement) {
    return;
  }

  const cachedParent: HTMLDivElement | null = firstUsageInfoEl.parentElement as HTMLDivElement;
  if (cachedParent && usageInfo) {
    usageInfo
      .split('\n')
      .reverse()
      .forEach(info => {
        const clonedNode = cachedParent.cloneNode(true) as HTMLDivElement;
        const textElem = clonedNode.querySelector('span')!;
        const copyEl = clonedNode.querySelector('button')!;

        clonedNode.classList.add(randomClass);
        textElem.innerText = info;
        copyEl.style.visibility = loggedIn ? 'visible' : 'hidden';
        if (info.startsWith('npm') || info.startsWith('echo')) {
          copyEl.onclick = e => {
            e.preventDefault();
            e.stopPropagation();
            copyToClipboard(info);
          };
        } else {
          textElem.style.fontSize = '1.2rem';
          textElem.style.height = '25px';
          clonedNode.removeChild(copyEl);
        }

        cachedParent.insertAdjacentElement('afterend', clonedNode);
      });
    const parent = cachedParent.parentElement;
    if (parent) {
      parent.removeChild(cachedParent);
    }
  }

  infoElements.forEach(node => {
    if (
      // We only match lines related to bundler commands
      !!node.innerText.match(/^(npm|pnpm|yarn)/) &&
      // And only commands that we want to remove
      (node.innerText.includes('adduser') || node.innerText.includes('set password'))
    ) {
      node.parentElement!.parentElement!.removeChild(node.parentElement!);
    }
  });
}

function changeTabs() {
  const tabs: NodeListOf<HTMLSpanElement> = document.querySelectorAll(tabSelector);
  if (tabs.length != 3) return;
  tabs[0].innerText = "Windows";
  tabs[1].innerText = "Mac";
  tabs[2].innerText = "Publish";
}

function changeLabels() {
  const tabs: NodeListOf<HTMLSpanElement> = document.querySelectorAll(labelSelector);
  if (tabs.length != 3) return;

  tabs[0].innerText = "Windows";
  const windowsNode = tabs[0].nextSibling as HTMLDivElement;
  setupNode(windowsNode, getWindowsInfo());

  tabs[1].innerText = "Mac";
  const macNode = tabs[1].nextSibling as HTMLDivElement;
  setupNode(macNode, getMacInfo());

  tabs[2].innerText = "Publish";
  tabs[2].className = tabs[1].className;

  const parent = tabs[2].parentElement;
  if (!parent) return;
  const elements = Array.prototype.slice.call(parent.childNodes) as Array<HTMLSpanElement>;
  const hasInjectedElement = elements.find((node: HTMLElement) => node.classList.contains(randomClass));
  if (hasInjectedElement) return;

  getPublishInfo()
    .split('\n')
    .forEach(info => {
      const clonedNode = macNode.cloneNode(true) as HTMLDivElement;
      setupNode(clonedNode, info);
      clonedNode.classList.add(randomClass);
      parent.appendChild(clonedNode);
    });
}

function setupNode(node: HTMLDivElement, info: string) {
  const loggedIn = isLoggedIn();
  const textElem = node.querySelector('span')!;
  const copyEl = node.querySelector('button')!;
  textElem.innerText = info;
  copyEl.style.visibility = loggedIn ? 'visible' : 'hidden';
  copyEl.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(info);
  };
}

function updateUsageInfo() {
  modifyUsageInfoNodes(
    dialogUsageInfoSelector,
    node =>
      !!node.innerText.match(
        // This checks for an element showing instructions to set the registry URL
        /((npm|pnpm) set|(yarn) config set)/
      ),
    node => {
      if (node.innerText.startsWith('npm')) return getWindowsInfo()
      if (node.innerText.startsWith('pnpm')) return getMacInfo()
      if (node.innerText.startsWith('yarn')) return getPublishInfo()
      return undefined;
    }
  );
  changeTabs();
  changeLabels();
}

init({
  loginButton: "#header--button-login, [data-testid='header--button-login']",
  logoutButton: "#header--button-logout, [data-testid='header--button-logout']",
  updateUsageInfo,
});
