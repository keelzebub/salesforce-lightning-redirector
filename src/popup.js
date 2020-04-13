import React, { useState, useEffect, Fragment } from 'react';
import ReactDOM from 'react-dom';

import './popup.scss';

// this hook will store the state in localStorage and also send it to background.js
const useStateWithLocalStorageAndMessaging = (localStorageKey, defaultValue) => {
  let storedValue = localStorage[localStorageKey];

  if (storedValue === 'true') {
    storedValue = true;
  } else if (storedValue === 'false') {
    storedValue = false;
  } else if (storedValue && storedValue.length > 0) {
    storedValue = storedValue.split(',');
  } else {
    storedValue = undefined;
  }

  const [value, setValue] = useState(
    storedValue !== undefined ? storedValue : defaultValue
  );

  useEffect(() => {
    localStorage[localStorageKey] = value;

    chrome.runtime.sendMessage({ name: 'updateOption', key: localStorageKey, value });
  }, [value]);

  return [value, setValue];
};

// this is the actual popup
const Popup = () => {
  const [selectedTypes, setSelectedTypes] = useStateWithLocalStorageAndMessaging('selectedTypes', []);
  const [isWhitelist, setIsWhitelist] = useStateWithLocalStorageAndMessaging('isWhitelist', true);
  const [isEnabled, setIsEnabled] = useStateWithLocalStorageAndMessaging('isEnabled', true);
  const [classicDisabled, setClassicDisabled] = useState(false);

  useEffect(function() {
    chrome.runtime.sendMessage({ name: 'checkIfSalesforceClassicDisabled' }, function(response) {
      if (response.isSalesforceClassicDisabled) {
        setClassicDisabled(response.isSalesforceClassicDisabled);
      }
    });
  }, []);

  const refreshExtension = (e) => {
    chrome.runtime.sendMessage({name: 'refreshExt'});
    setClassicDisabled(false);
  };

  const enableHandler = (e) => {
    setIsEnabled(!isEnabled);
  };

  const listTypeHandler = (e) => {
    if (e.target.value === 'true') {
      setIsWhitelist(true);
    } else {
      setIsWhitelist(false);
    }
  };

  const typeSelectHandler = (e) => {
    let newSelectedTypes = selectedTypes.splice(0);

    if (e.target.checked) {
      newSelectedTypes.push(e.target.value);
    } else {
      const index = newSelectedTypes.indexOf(e.target.value);
      newSelectedTypes.splice(index, 1);
    }

    setSelectedTypes(newSelectedTypes);
  };

  const buildListTypeRadios = () => {
    return (
      <section>
        <article className='popup-listType'>
          <input
            type='radio'
            value='true'
            name='whitelist'
            id='whitelist-true'
            checked={isWhitelist}
            onChange={listTypeHandler}
          />
          <label htmlFor='whitelist-true'>Only redirect selected types.</label>
        </article>
        <article className='popup-listType'>
          <input
            type='radio'
            value='false'
            name='whitelist'
            id='whitelist-false'
            checked={!isWhitelist}
            onChange={listTypeHandler}
          />
          <label htmlFor='whitelist-false'>Redirect everything <i>except</i> selected types.</label>
        </article>
      </section>
    );
  };

  const buildTypeCheckboxes = () => {
    const types = [
      ['Case', 'Cases'],
      ['Report', 'Reports'],
      ['Account', 'Accounts'],
      ['Contact', 'Contacts'],
    ];

    return types.map(([id, name]) => (
      <article key={id} className='popup-pageTypes-type'>
        <input
          type='checkbox'
          id={id}
          value={id}
          checked={selectedTypes.includes(id)}
          onChange={typeSelectHandler}
        />
        <label htmlFor={id}>{name}</label>
      </article>
    ));
  };

  const buildHeader = () => {
    return (
      <header>
        <section className='popup-title'>
          <h3>Salesforce Lightning Redirector</h3>
        </section>
        <section className='popup-description'>
          <span>Salesforce Lightning {String.fromCharCode(8594)} Salesforce Classic.</span>
          <button onClick={enableHandler}>
            {isEnabled ? 'Disable' : 'Enable'}
          </button>
        </section>
      </header>
    );
  };

  const buildContent = () => {
    if (!isEnabled) {
      return (
        <main className='popup'>
          {buildHeader()}
          <p className='popup-disabled'>
            Disabled.
          </p>
        </main>
      );
    }

    return (
      <main className='popup'>
        {buildHeader()}
        <section className='popup-content'>
          <section className='popup-content-section'>
            <h4>Options</h4>
            {buildListTypeRadios()}
          </section>

          <section className='popup-content-section'>
            <h4>Page Types</h4>
            <section className='popup-pageTypes'>
              {buildTypeCheckboxes()}
            </section>
          </section>
        </section>
      </main>
    );
  };

  const buildError = () => {
    return (
      <main className='popup popup--error'>
        <header>
          <section className='popup-title'>
            <h3>Error: Salesforce Lightning Redirector</h3>
          </section>
        </header>
        <section className='popup-error'>
          <p>
            Salesforce Classic appears to be disabled for your account. To fix:
          </p>
          <ol>
            <li>Click on your profile icon in the top right corner</li>
            <li>Select <strong>"Switch to Salesforce Classic"</strong></li>
            <li>Come back here and click <strong>"Refresh"</strong></li>
          </ol>
          <p className='popup-error-note'>
            Note: if you don't see the "Switch to Salesforce Classic" option, you'll need to talk to your
            Salesforce administrator.
          </p>
          <div className='popup-error-buttonContainer'>
            <button onClick={refreshExtension}>
              Refresh
            </button>
          </div>
        </section>
      </main>
    );
  };

  return classicDisabled ? buildError() : buildContent();
};

window.onload = function() {
  ReactDOM.render(<Popup />, document.getElementById('popupRoot'));
};
