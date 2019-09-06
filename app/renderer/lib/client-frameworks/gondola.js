import Framework from './framework';

let glocator = '';

class GondolaFramework extends Framework {

  get language () {
    return 'js';
  }

  wrapWithBoilerplate (code) {
    let caps = JSON.stringify(this.caps);
    return `// Requires the admc/wd client library
// (npm install wd)
// Then paste this into a .js file and run with Node 7.6+

const wd = require('wd');
const driver = wd.promiseChainRemote("${this.serverUrl}");
const caps = ${caps};

async function main () {
  await gondola.init(caps);
${this.indent(code, 2)}
  await gondola.quit();
}

main().catch(console.log);
`;
  }

  codeFor_findAndAssign (strategy, locator) {
    switch (strategy) {
      case 'accessibility id': locator = `~${locator}`; break;
      case 'id': locator = `${locator}`; break;
      case 'xpath': break; // xpath does not need to be updated
      case 'name': locator = `name=${locator}`; break;
      case 'class name': locator = `${locator}`; break;
      case '-android uiautomator': locator = `android=${locator}`; break;
      case '-android datamatcher': locator = `android=${locator}`; break;
      case '-ios predicate string': locator = `ios=${locator}`; break;
      case '-ios class chain': locator = `ios=${locator}`; break; // TODO: Handle IOS class chain properly. Not all libs support it. Or take it out
      default: throw new Error(`Can't handle strategy ${strategy}`);
    }

    glocator = locator;
    return '';
  }

  codeFor_click () {
    return `await gondola.click("${glocator}")`;
  }

  codeFor_clear (varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.clear();`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `await gondola.enter("${glocator}",${JSON.stringify(text)})`;
  }

  codeFor_checkControlExist () {
    return `await gondola.checkControlExist('${glocator}');`;
  }

  codeFor_checkControlProperty (varName, varIndex, name, value) {
    return `await gondola.checkControlProperty('${glocator}', '${name}', '${value}');`;
  }

  codeFor_back () {
    return `await gondola.back();`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, x, y) {
    return `await gondola.tap({x: ${x}, y: ${y}})`;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, x1, y1, x2, y2) {
    return `await gondola.touchDown({x: ${x1}, y: ${y1}}).moveTo({x: ${x2}, y: ${y2}}).touchUp()`;
  }

  codeFor_getCurrentActivity () {
    return `await gondola.getCurrentActivity()`;
  }

  codeFor_getCurrentPackage () {
    return `await gondola.getCurrentPackage()`;
  }


  codeFor_installAppOnDevice (varNameIgnore, varIndexIgnore, app) {
    return `await gondola.installAppOnDevice('${app}');`;
  }

  codeFor_isAppInstalledOnDevice (varNameIgnore, varIndexIgnore, app) {
    return `await gondola.isAppInstalled("${app}");`;
  }

  codeFor_launchApp () {
    return `await gondola.launchApp();`;
  }

  codeFor_backgroundApp (varNameIgnore, varIndexIgnore, timeout) {
    return `await gondola.backgroundApp(${timeout});`;
  }

  codeFor_closeApp () {
    return `await gondola.closeApp();`;
  }

  codeFor_resetApp () {
    return `await gondola.resetApp();`;
  }

  codeFor_removeAppFromDevice (varNameIgnore, varIndexIgnore, app) {
    return `await gondola.removeAppFromDevice('${app}');`;
  }

  codeFor_getAppStrings (varNameIgnore, varIndexIgnore, language, stringFile) {
    return `await gondola.getAppStrings(${language ? `${language}, ` : ''}${stringFile ? `"${stringFile}` : ''});`;
  }

  codeFor_getClipboard () {
    return `await gondola.getClipboard();`;
  }

  codeFor_setClipboard (varNameIgnore, varIndexIgnore, clipboardText) {
    return `await gondola.setClipboard('${clipboardText}')`;
  }

  codeFor_pressKeycode (varNameIgnore, varIndexIgnore, keyCode, metaState, flags) {
    return `await gondola.longPressKeyCode(${keyCode}, ${metaState}, ${flags});`;
  }

  codeFor_longPressKeycode (varNameIgnore, varIndexIgnore, keyCode, metaState, flags) {
    return `await gondola.longPressKeyCode(${keyCode}, ${metaState}, ${flags});`;
  }

  codeFor_hideDeviceKeyboard () {
    return `await gondola.hideDeviceKeyboard();`;
  }

  codeFor_isKeyboardShown () {
    return `await gondola.isKeyboardShown();`;
  }

  codeFor_pushFileToDevice (varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `await gondola.pushFileToDevice('${pathToInstallTo}', '${fileContentString}');`;
  }

  codeFor_pullFile (varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `await gondola.pullFile('${pathToPullFrom}');`;
  }

  codeFor_pullFolder (varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `await gondola.pullFolder('${folderToPullFrom}');`;
  }

  codeFor_toggleAirplaneMode () {
    return `await gondola.toggleAirplaneMode();`;
  }

  codeFor_toggleData () {
    return `await gondola.toggleData();`;
  }

  codeFor_toggleWiFi () {
    return `await gondola.toggleWiFi();`;
  }

  codeFor_toggleLocationServices () {
    return `await gondola.toggleLocationServices();`;
  }

  codeFor_sendSMS (varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `await gondola.sendSms('${phoneNumber}', '${text}');`;
  }

  codeFor_gsmCall (varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `await gondola.gsmCall('${phoneNumber}', '${action}');`;
  }

  codeFor_gsmSignal (varNameIgnore, varIndexIgnore, signalStrength) {
    return `await gondola.gsmSignal(${signalStrength});`;
  }

  codeFor_gsmVoice (varNameIgnore, varIndexIgnore, state) {
    return `await gondola.gsmVoice('${state}');`;
  }

  codeFor_shake () {
    return `await gondola.shake();`;
  }

  codeFor_lock (varNameIgnore, varIndexIgnore, seconds) {
    return `await gondola.lock(${seconds})`;
  }

  codeFor_unlock () {
    return `await gondola.unlock()`;
  }

  codeFor_isLocked () {
    return `let isLocked = await gondola.isLocked();`;
  }

  codeFor_rotateDevice (varNameIgnore, varIndexIgnore, x, y, radius, rotation, touchCount, duration) {
    return `await gondola.rotateDevice({x: ${x}, y: ${y}, duration: ${duration}, radius: ${radius}, rotation: ${rotation}, touchCount: ${touchCount}});`;
  }

  codeFor_getPerformanceData (varNameIgnore, varIndexIgnore, packageName, dataType, dataReadTimeout) {
    return `await gondola.getPerformanceData('${packageName}', '${dataType}', ${dataReadTimeout});`;
  }

  codeFor_getSupportedPerformanceDataTypes () {
    return `let supportedPerformanceDataTypes = await gondola.getSupportedPerformanceDataTypes();`;
  }

  codeFor_performTouchId (varNameIgnore, varIndexIgnore, match) {
    return `await gondola.touchId(${match});`;
  }

  codeFor_toggleTouchIdEnrollment (varNameIgnore, varIndexIgnore, enroll) {
    return `await gondola.toggleTouchIdEnrollment(${enroll});`;
  }

  codeFor_openNotifications () {
    return `await gondola.openNotifications();`;
  }

  codeFor_getDeviceTime () {
    return `let time = await gondola.getDeviceTime();`;
  }

  codeFor_fingerprint (varNameIgnore, varIndexIgnore, fingerprintId) {
    return `await gondola.fingerprint(${fingerprintId});`;
  }

  codeFor_sessionCapabilities () {
    return `let caps = await gondola.sessionCapabilities();`;
  }

  codeFor_setPageLoadTimeout (varNameIgnore, varIndexIgnore, ms) {
    return `await setPageLoadTimeout(${ms})`;
  }

  codeFor_setAsyncScriptTimeout (varNameIgnore, varIndexIgnore, ms) {
    return `await setAsyncScriptTimeout(${ms})`;
  }

  codeFor_setImplicitWaitTimeout (varNameIgnore, varIndexIgnore, ms) {
    return `await setImplicitWaitTimeout(${ms})`;
  }

  codeFor_getOrientation () {
    return `let orientation = await gondola.getOrientation();`;
  }

  codeFor_setOrientation (varNameIgnore, varIndexIgnore, orientation) {
    return `await gondola.setOrientation('${orientation}');`;
  }

  codeFor_getGeoLocation () {
    return `let location = await gondola.getGeoLocation();`;
  }

  codeFor_setGeoLocation (varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `await gondola.setGeoLocation(${latitude}, ${longitude}, ${altitude});`;
  }

  codeFor_logTypes () {
    return `let logTypes = await gondola.logTypes();`;
  }

  codeFor_log (varNameIgnore, varIndexIgnore, logType) {
    return `let logs = await gondola.log('${logType}');`;
  }

  codeFor_updateSettings (varNameIgnore, varIndexIgnore, settingsJson) {
    return `await gondola.updateSettings(${settingsJson});`;
  }

  codeFor_settings () {
    return `let settings = await gondola.settings();`;
  }

}

GondolaFramework.readableName = 'Gondola';

export default GondolaFramework;
