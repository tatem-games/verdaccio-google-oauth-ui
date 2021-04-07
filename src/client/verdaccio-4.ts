import {getMacInfo, getPublishInfo, getWindowsInfo, init, isLoggedIn} from './plugin/index.js';

const helpCardUsageInfoSelector = '#help-card .MuiCardContent-root span';
const dialogUsageInfoSelector = '#registryInfo--dialog-container .MuiDialogContent-root .MuiTypography-root span';
const tabSelector = '#registryInfo--dialog-container .MuiDialogContent-root .MuiTabs-flexContainer .MuiTab-wrapper';
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

function modifyUsageInfoNodes(selector: string, findPredicate: (node: HTMLElement) => boolean, findUsageInfo: (node: HTMLElement) => string | undefined): void {
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
          textElem.style.fontSize = '1.5rem';
          textElem.style.height = '40px';
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
  tabs[0].innerText = "Windows";
  tabs[1].innerText = "Mac";
  tabs[2].innerText = "Publish";
}

function updateUsageInfo() {
  modifyUsageInfoNodes(helpCardUsageInfoSelector, node => node.innerText.includes('adduser'), node => getPublishInfo());
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
}

init({
  loginButton: "#header--button-login, [data-testid='header--button-login']",
  logoutButton: "#header--button-logout, [data-testid='header--button-logout']",
  updateUsageInfo,
});
