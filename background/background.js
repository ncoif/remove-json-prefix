
//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData
//https://github.com/bhollis/jsonview/

async function initialize() {
  await initializeOptions();
}
initialize();

var isExtensionEnabled = true;

function initializeOptions(){
  return new Promise(resolve => {
    browser.storage.local.get("globalEnabled", function(item) {
      isExtensionEnabled = item.globalEnabled;
      updateIconState();
    });
  });
}

function updateIconState() {
  if (!browser.tabs) return;

  let iconState = 'active';

  if (!isExtensionEnabled) {
    iconState = 'disabled';
  }

  if ('setIcon' in chrome.browserAction) {
    browser.browserAction.setIcon({
      path: {
        38: '../icons/icon-' + iconState + '-32.png'
      }
    });
  }

  browser.browserAction.setTitle({
    title: 'JSon prefix remover ' + ((iconState === 'active') ? '' : ' (' + iconState + ')')
  });
}

browser.storage.onChanged.addListener(async function(changes, areaName) {
  if (areaName === 'sync' || areaName === 'local') {
    if ('globalEnabled' in changes) {
      isExtensionEnabled = changes.globalEnabled.newValue;
      updateIconState();
    }
  }
});

// Look for JSON if the content type is "application/json",
// or "application/whatever+json" or "application/json; charset=utf-8"
var jsonContentType = /^application\/([a-z]+\+)?json($|;)/;

function detectJSON(event) {
  // if the extension has been disabled by the user, return directly
  if (!isExtensionEnabled) {
    return;
  }

  // if there is no headers, return directly
  if (!event.responseHeaders) {
    return;
  }

  var arrayLength = event.responseHeaders.length;
  for (var i = 0; i < arrayLength; i++) {
    var header = event.responseHeaders[i];
    console.log(header);
    if (header.name.toLowerCase() === "content-type" && header.value && jsonContentType.test(header.value)) {
      console.log("Detected JSON content-type, attempting to remove potential prefix");
      //TODO
    }
  }

  // return the original response headers
  return { responseHeaders: event.responseHeaders };
}

chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);
