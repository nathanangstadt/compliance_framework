/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define('ojtranslations/nls/timezoneData',{root:{supplemental:{version:{cldrVersion:"38"}}},ar:1,bg:1,bs:1,"bs-Cyrl":1,"bs-Cyrl-BA":1,"bs-Latn":1,"bs-Latn-BA":1,cs:1,da:1,de:1,el:1,"en-US":1,es:1,et:1,fi:1,fr:1,he:1,hr:1,hu:1,is:1,it:1,ja:1,ko:1,lt:1,lv:1,ms:1,nl:1,no:1,pl:1,pt:1,"pt-PT":1,ro:1,ru:1,sk:1,sl:1,sr:1,"sr-Cyrl":1,"sr-Cyrl-BA":1,"sr-Latn":1,"sr-Latn-BA":1,sv:1,th:1,tr:1,uk:1,vi:1,zh:1,"zh-Hans":1,"zh-Hant":1,"zh-Hant-HK":1,"zh-Hant-MO":1,__noOverlay:!0,__defaultNoOverlayLocale:"en-US"});


define('ojs/ojtimezonedata',['ojs/ojcore-base', 'ojs/ojlocaledata', 'ojL10n!ojtranslations/nls/timezoneData'], function (oj, LocaleData, ojtd) { 'use strict';

  oj = oj && Object.prototype.hasOwnProperty.call(oj, 'default') ? oj['default'] : oj;
  ojtd = ojtd && Object.prototype.hasOwnProperty.call(ojtd, 'default') ? ojtd['default'] : ojtd;

  /**
   * Internal utilities for dealing with timezone data
   * @ignore
   */
  const TimezoneData = {};
  oj._registerLegacyNamespaceProp('TimezoneData', TimezoneData);

  /**
   * Merges timezone data bundle into the LocaleElements bundle
   * @param {Object} timezoneBundle bundle to merge into the LocaleElements bundle
   * @ignore
   */
  TimezoneData.__mergeIntoLocaleElements = function (timezoneBundle) {
    var localeElements = LocaleData.__getBundle();
    oj.CollectionUtils.copyInto(localeElements, timezoneBundle, undefined, true);
  };

  /**
   * @return {Array.<string>} names of the timezone bundles
   * @ignore
   */
  TimezoneData.__getBundleNames = function () {
    return TimezoneData._bundleNames;
  };

  /**
   * @param {string} name bundle name
   * @ignore
   */
  TimezoneData.__registerBundleName = function (name) {
    TimezoneData._bundleNames.push(name);
  };

  /**
   * @ignore
   */
  TimezoneData._bundleNames = [];

  (function () {
    TimezoneData.__registerBundleName('/timezoneData');
    TimezoneData.__mergeIntoLocaleElements(typeof ojtd === 'undefined' ? {} : ojtd);
  })();

  return TimezoneData;

});


define("bundles/ojtimezonebundle", function(){});
