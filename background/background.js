"use strict";

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

// https://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx/
// the highjacking prefix is )]}, which we escape in \)]} and only remove it for the start of the string with ^
var jsonPrefixRegex = /^\)]}', /;

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
    if (header.name.toLowerCase() === "content-type" && header.value && jsonContentType.test(header.value)) {
      filterHighjackPrefix(event, header.value);
    }
  }

  // return the original response headers
  return { responseHeaders: event.responseHeaders };
}

function filterHighjackPrefix(details, contentType) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();

  filter.ondata = event => {
    let str = decoder.decode(event.data, {stream: true});
    if (jsonPrefixRegex.test(str)) {
      console.log("Prefix \")]}, \" detected for content-type \"" + contentType + "\", removing prefix for better display")
    }
    str = str.replace(jsonPrefixRegex, '');
    filter.write(encoder.encode(str));
    filter.disconnect();
  }

  return {};
}

chrome.webRequest.onHeadersReceived.addListener(
  detectJSON,
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking", "responseHeaders"]
);
