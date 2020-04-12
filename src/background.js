import difference from 'lodash/difference';

const options = {
  isEnabled: true,
  isWhitelist: true,
  selectedTypes: [],
};

chrome.runtime.onMessage.addListener(
  function(request, _sender, _sendResponse) {
    options[request.name] = request.value;
  }
);


chrome.webRequest.onBeforeRequest.addListener(function(details) {
  if (!options.isEnabled) {
    return {};
  }

  const lightningUrl = details.url;
  let sectionsToRedirect = [
    'Case',
    'Contact',
    'Report',
    'Account',
  ];

  if (options.isWhitelist) {
    sectionsToRedirect = options.selectedTypes;
  } else {
    sectionsToRedirect = difference(sectionsToRedirect, options.selectedTypes);
  }

  const sectionString = sectionsToRedirect.join('|');

  const regex = new RegExp(`(?<company>[\\w\\d]*).lightning.force.com\\/.*\\/(${sectionString})\\/(?<id>[\\w\\d]*)\\/view$`);
  let classicUrl;

  const urlMatch = lightningUrl.match(regex);

  if (urlMatch && urlMatch.groups) {
    classicUrl = `https://${urlMatch.groups.company}.my.salesforce.com/${urlMatch.groups.id}`;

    return {
      redirectUrl: classicUrl,
    };
  }

  return {};

}, {urls: ['*://lightspeed.lightning.force.com/*'], types: ['main_frame']}, ['blocking']);