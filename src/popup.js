import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import './popup.scss';

// this hook will store the state in localStorage and also send it to background.js
const useStateWithLocalStorageAndMessaging = (localStorageKey, defaultValue) => {
  let storedValue = localStorage[localStorageKey];

  if (storedValue === 'true') {
    storedValue = true;
  } else if (storedValue === 'false') {
    storedValue = false;
  } else if (storedValue.length > 0) {
    storedValue = storedValue.split(',');
  } else {
    storedValue = undefined;
  }

  const [value, setValue] = useState(
    storedValue !== undefined ? storedValue : defaultValue
  );

  chrome.runtime.sendMessage({[localStorageKey]: value});

  useEffect(() => {
    localStorage[localStorageKey] = value;

    chrome.runtime.sendMessage({ name: localStorageKey, value });
  }, [value]);

  return [value, setValue];
};

const Popup = () => {
  const [selectedTypes, setSelectedTypes] = useStateWithLocalStorageAndMessaging('selectedTypes', []);
  const [isWhitelist, setIsWhitelist] = useStateWithLocalStorageAndMessaging('isWhitelist', true);
  const [isEnabled, setIsEnabled] = useStateWithLocalStorageAndMessaging('isEnabled', true);

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
            disabled={!isEnabled}
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
          disabled={!isEnabled}
          checked={selectedTypes.includes(id)}
          onChange={typeSelectHandler}
        />
        <label htmlFor={id}>{name}</label>
      </article>
    ));
  };

  const buildOptions = () => {
    if (isEnabled) {
      return (
        <section className='popup-content'>
          <section>
            <h4>Options</h4>
            {buildListTypeRadios()}
          </section>

          <section>
            <h4>Page Types</h4>
            <section className='popup-pageTypes'>
              {buildTypeCheckboxes()}
            </section>
          </section>
        </section>
      );
    }

    return (
      <p className='popup-disabled'>
        Disabled.
      </p>
    );
  };

  return (
    <main className='popup'>
      <header>
        <section className='popup-title'>
          <h3>Salesforce Lightning Redirector</h3>
          <button onClick={enableHandler}>
            {isEnabled ? 'Disable' : 'Enable'}
          </button>
        </section>
        <p className='popup-description'>Redirect Salesforce Lightning links to Salesforce Classic.</p>
      </header>
      {buildOptions()}
    </main>
  );
};

window.onload = function() {
  ReactDOM.render(<Popup />, document.getElementById('popupRoot'));
};
