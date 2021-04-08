//
// Replace the default npm usage info and displays the authToken that needs
// to be configured.
//

export function getWindowsInfo() {
  const username = localStorage.getItem('username');
  if (!username) {
    return 'Click the login button to authenticate with Google.';
  }

  const url = (window as any).VERDACCIO_API_URL
    ? (window as any).VERDACCIO_API_URL.replace(/-\/verdaccio\/$/, '')
    : `//${location.host}${location.pathname}`;
  const authToken = localStorage.getItem('npm');
  return [
    `echo [npmAuth."${url}"] >> %USERPROFILE%\\.upmconfig.toml && echo token = "${authToken}" >> %USERPROFILE%\\.upmconfig.toml && echo email = "${username}" >> %USERPROFILE%\\.upmconfig.toml && echo alwaysAuth = true >> %USERPROFILE%\\.upmconfig.toml`,
  ].join('\n');
}

export function getMacInfo() {
  const username = localStorage.getItem('username');
  if (!username) {
    return 'Click the login button to authenticate with Google.';
  }

  const url = (window as any).VERDACCIO_API_URL
    ? (window as any).VERDACCIO_API_URL.replace(/-\/verdaccio\/$/, '')
    : `//${location.host}${location.pathname}`;
  const authToken = localStorage.getItem('npm');
  return [
    `echo \\[npmAuth.\\"${url}\\"\\]>> ~/.upmconfig.toml && echo token = \\"${authToken}\\">> ~/.upmconfig.toml && echo email = \\"${username}\\">> ~/.upmconfig.toml && echo alwaysAuth = true>> ~/.upmconfig.toml`,
  ].join('\n');
}

export function getPublishInfo() {
  const username = localStorage.getItem('username');
  if (!username) {
    return 'Click the login button to authenticate with Google.';
  }

  const configBase = (window as any).VERDACCIO_API_URL
    ? (window as any).VERDACCIO_API_URL.replace(/^https?:/, '').replace(/-\/verdaccio\/$/, '')
    : `//${location.host}${location.pathname}`;
  const url = (window as any).VERDACCIO_API_URL
    ? (window as any).VERDACCIO_API_URL.replace(/-\/verdaccio\/$/, '')
    : `//${location.host}${location.pathname}`;
  const authToken = localStorage.getItem('npm');
  return [
    `npm config set ${configBase}:_authToken "${authToken}"`,
    `npm config set ${configBase}:always-auth true`,
    `npm publish --registry ${url}`
  ].join('\n');
}
