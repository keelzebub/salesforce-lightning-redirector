import difference from 'lodash/difference';

let lastRedirectedUrl = '';
let redirectTimeout;
let isSalesforceClassicDisabled = false;

const options = {
  isEnabled: true,
  isWhitelist: false,
  selectedTypes: [],
};

chrome.runtime.onMessage.addListener(
  function(request, _sender, sendResponse) {
    if (request.name === 'refreshExt') {
      isSalesforceClassicDisabled = false;
      chrome.browserAction.setBadgeText({text: ''});
    } else if (request.name === 'updateOption') {
      options[request.key] = request.value;
    } else if (request.name === 'checkIfSalesforceClassicDisabled') {
      sendResponse({ isSalesforceClassicDisabled });
    }
  }
);

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  if (!options.isEnabled || isSalesforceClassicDisabled) {
    return {};
  }

  const lightningUrl = details.url;
  let sectionsToRedirect = [
    'Case',
    'Contact',
    'Report',
    'Account',
  ];

  // if we redirected this URL within the last 1 second (see timeout below),
  // the user probably has Classic view disabled
  if (lightningUrl === lastRedirectedUrl || lightningUrl.match(/\/_classic\//)) {
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    chrome.browserAction.setBadgeText({text: '!'});
    isSalesforceClassicDisabled = true;
    return {};
  }

  if (options.isWhitelist) {
    sectionsToRedirect = options.selectedTypes;
  } else {
    sectionsToRedirect = difference(sectionsToRedirect, options.selectedTypes);
  }

  const sectionString = sectionsToRedirect.join('|');

  const regexPattern = `(?<company>[\\w\\d]*).lightning.force.com\\/.*\\/(${sectionString})\\/(?<id>[\\w\\d]*)\\/view`;
  const regex = new RegExp(regexPattern);
  let classicUrl;

  const urlMatch = lightningUrl.match(regex);

  if (urlMatch && urlMatch.groups) {
    classicUrl = `https://${urlMatch.groups.company}.my.salesforce.com/${urlMatch.groups.id}`;

    // set the last redirected URL and clear it out after 1 second
    lastRedirectedUrl = lightningUrl;
    clearTimeout(redirectTimeout);
    redirectTimeout = setTimeout(function() {
      lastRedirectedUrl = '';
    }, 1000);


    return {
      redirectUrl: classicUrl,
    };
  }

  return {};

}, {urls: ['*://*.lightning.force.com/*'], types: ['main_frame']}, ['blocking']);

chrome.webRequest.onHeadersReceived.addListener(function(details) {
  return {};
}, {urls: ['<all_urls>'], types: ['main_frame']}, ['blocking']);