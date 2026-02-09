/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/**
 * This is responsible for bootstrapping all the OIC modules required.
 * This is not part of the webpack bundle and therefore can not have any dependency on any
 * of the modules loaded via that.
 *
 * @type {[{publicPath: string, key: string, modules: {pwpages: string, pwMsg: string}}, {buildInfo: string, key: string, modules: {resources: string, oicIntegrationsMsg: string, integrationpages: string}}, {key: string, modules: {FSTranslations: string, filespages: string}}]}
 */
const OIC_MF_MODULES_MAP = [
	{
		"key": "integration",
		"modules": {
			'oicIntegrationsMsg': 'oic-integration-components/oicIntegrationsMsg',
			'resources': 'oic-integration-components/resources',
			'integrationpages': "integration/integrationpages",
		},
		"buildInfo": "js/integration/build.json"
	},
	{
		"key": "files",
		"modules": {
			'filespages': "files/filespages",
			'FSTranslations': "files/resources/FSTranslations"
		},
		"buildInfo": "js/files/build.json"
	},
	{
		"key": "b2b",
		"modules": {
			'b2bpages': "b2b/b2bpages",
			'b2bresources': 'oic-b2b-components/resources',
			'oicB2BMsg': 'oic-b2b-components/oicB2BMsg'

		},
		"buildInfo": "js/b2b/build.json"
	},
	{
		"key": "rpa",
		"publicPath": "rpapages/publicPath",
		"modules": {
			'rpapages': "rpa/rpapages",
			'rpaComponentMsg': 'rpa/rpaComponentMsg',
			'rpaCanvasMsg': 'rpa/rpaCanvasMsg',
			'rpa': 'rpa'
		},
		"buildInfo": "js/rpa/build.json"	
	},
	{
		"key": "decision",
		"publicPath": "decisionpages/publicPath",
		"modules": {
			'decisionpages': "decision/decisionpages",
			'decisionServiceMsg': 'decision/decisionServiceMsg',
			'dmnServiceMsg': 'decision/dmnServiceMsg',
			'oj-opa-cc': 'decision/oj-opa-cc'
		},
		"buildInfo": "js/decision/build.json"
	},
	{
		"key": "process",
		"publicPath": "processpages/publicPath",
		"modules": {
			'processpages': "process/processpages",
			'oicProcessMsg': 'process/oicProcessMsg',
			'bpmMsg': 'process/bpmMsg',
			'dataMapperMsg': 'process/dataMapperMsg',
			'builderMsg':'process/builderMsg',
			'rendererMsg':'process/rendererMsg',
		},
		"buildInfo": "js/process/build.json"
	},
	{
		"key": "healthcare",
		"modules": {
			'healthcarepages': "healthcare/healthcarepages",
			'healthcareresources': 'oic-healthcare-components/resources',
			'oicHealthcareMsg': 'oic-healthcare-components/oicHealthcareMsg'

		},
		"buildInfo": "js/healthcare/build.json"
	}
];

// List of resources for which integration instance id context is required.
const ENABLE_INSTANCE_ID_FRAGMENTS = ['node_modules/cdn', 'js/spaui', 'js/integration', 'js/files', 'js/pw', 'js/localstubs', 'js/b2b', 'js/rpa', 'js/decision', 'js/process', 'js/healthcare', 'js/oj-sp', 'suiteComponentsMsg', 'node_modules/@types', 'node_modules/oic-icons', 'node_modules/opaas-branding', 'node_modules/opaas-table-view', 'node_modules/require-css', 'node_modules/requirejs', 'node_modules/signals', 'oic-integration-components', 'oic-b2b-components', 'oic-healthcare-components']

// This will be replaced by a generated value during build time.
// Don't change the value without changing the associated grunt script.
const CACHE_BUST_PARAM = "1769594021163";

// List of resources for which cache busting is disabled.
const DISABLE_CACHE_BUST_FRAGMENTS = ['https://static.oracle.com', 'cdn/jet', 'spaui/integration.suite.']

// The default load paths. Currently only provided for Insight.
// TODO: Need to build this based on the region.
const PROD_MF_MODULES = {};

// List of common modules required by all the top level HTML pages.
const COMMON_LOCAL_MODULE_PATHS = {
	'suiteComponentsMsg': '../src/main/common/suiteComponentsMsg',
	'tableViewMsg': '../node_modules/opaas-table-view/tableViewMsg',
	'toolbarMsg': '../node_modules/opaas-table-view/toolbarMsg',
	/****** Dependencies for ONSR-Disconnected regions *******/
	'oj-ux-icon': cdnIcons + "/images",
	"jqueryui-amd" : cdnReqConfig + "/3rdparty/jquery/jqueryui-amd-1.13.0",
	"ojs/ojtree" : cdnJet18 + "/default/js/debug/ojtree",
	"ojtree" : cdnJet18 + "/default/js/debug/ojtree",
	"ojs" : cdnReqConfig + "/default/js/debug",
	"ojtranslations" : cdnReqConfig + "/default/js/resources",
	"ojcss" : cdnReqConfig + "/default/js/debug/ojcss",
	"@oracle/oraclejet-preact" : cdnReqConfig + "/3rdparty/oraclejet-preact/amd",
	"oj-c" : cdnReqConfig + "../packs/oj-c/19.0.0/min",
	"css-builder" : cdnReqConfig + "/3rdparty/require-css/css-builder",
	"normalize" : cdnReqConfig + "/3rdparty/require-css/normalize",
	"proj4" : cdnReqConfig + "/3rdparty/proj4js/dist/proj4-src",
	"persist" : cdnReqConfig + "/3rdparty/persist/debug"	
};

const JET_BUNDLES_CONFIG = {
	"oj-c/corepackbundle": [
	  "oj-c/input-password",
	  "oj-c/input-text",
	  "oj-c/text-area",
	  "oj-c/progress-bar",
	  "oj-c/progress-circle",
	  "oj-c/avatar",
	  "oj-c/button",
	  "oj-c/rating-gauge",
	  "oj-c/select-multiple",
	  "oj-c/avatar/avatar-styles",
	  "oj-c/button/button-styles",
	  "oj-c/input-password/input-password-styles",
	  "oj-c/input-text/input-text-styles",
	  "oj-c/progress-bar/progress-bar-styles",
	  "oj-c/progress-circle/progress-circle-styles",
	  "oj-c/rating-gauge/rating-gauge-styles",
	  "oj-c/select-multiple/select-multiple-styles",
	  "oj-c/text-area/text-area-styles"
	],
	"ojs/oj3rdpartybundle": [
	  "knockout",
	  "jquery",
	  "jqueryui-amd/version",
	  "jqueryui-amd/widget",
	  "jqueryui-amd/unique-id",
	  "jqueryui-amd/keycode",
	  "jqueryui-amd/focusable",
	  "jqueryui-amd/tabbable",
	  "jqueryui-amd/ie",
	  "jqueryui-amd/widgets/draggable",
	  "jqueryui-amd/widgets/mouse",
	  "jqueryui-amd/widgets/sortable",
	  "jqueryui-amd/data",
	  "jqueryui-amd/plugin",
	  "jqueryui-amd/safe-active-element",
	  "jqueryui-amd/safe-blur",
	  "jqueryui-amd/scroll-parent",
	  "jqueryui-amd/widgets/draggable",
	  "jqueryui-amd/position",
	  "@oracle/oraclejet-preact/UNSAFE_Environment",
	  "@oracle/oraclejet-preact/UNSAFE_Flex",
	  "@oracle/oraclejet-preact/UNSAFE_Icon",
	  "@oracle/oraclejet-preact/UNSAFE_Layer",
	  "@oracle/oraclejet-preact/UNSAFE_LiveRegion",
	  "@oracle/oraclejet-preact/UNSAFE_Message",
	  "@oracle/oraclejet-preact/UNSAFE_MessageBanner",
	  "@oracle/oraclejet-preact/utils/UNSAFE_interpolations/boxalignment",
	  "@oracle/oraclejet-preact/utils/UNSAFE_interpolations/flexbox",
	  "@oracle/oraclejet-preact/utils/UNSAFE_interpolations/flexitem",
	  "@oracle/oraclejet-preact/utils/UNSAFE_matchTranslationBundle",
	  "signals",
	  "text",
	  "hammerjs",
	  "ojdnd",
	  "preact",
	  "preact/hooks",
	  "preact/compat",
	  "preact/jsx-runtime",
	  "css",
	  "touchr"
	],
	"ojs/ojpreactbundle": [
	  "@oracle/oraclejet-preact/translationBundle",
	  "@oracle/oraclejet-preact/UNSAFE_Button",
	  "@oracle/oraclejet-preact/UNSAFE_Chip",
	  "@oracle/oraclejet-preact/UNSAFE_Collection",
	  "@oracle/oraclejet-preact/UNSAFE_ComponentMessage",
	  "@oracle/oraclejet-preact/UNSAFE_HighlightText",
	  "@oracle/oraclejet-preact/UNSAFE_InputPassword",
	  "@oracle/oraclejet-preact/UNSAFE_InputText",
	  "@oracle/oraclejet-preact/UNSAFE_Label",
	  "@oracle/oraclejet-preact/UNSAFE_LabelValueLayout",
	  "@oracle/oraclejet-preact/UNSAFE_ListView",
	  "@oracle/oraclejet-preact/UNSAFE_ProgressBar",
	  "@oracle/oraclejet-preact/UNSAFE_ProgressCircle",
	  "@oracle/oraclejet-preact/UNSAFE_RatingGauge",
	  "@oracle/oraclejet-preact/UNSAFE_SelectMultiple",
	  "@oracle/oraclejet-preact/UNSAFE_Selector",
	  "@oracle/oraclejet-preact/UNSAFE_Skeleton",
	  "@oracle/oraclejet-preact/UNSAFE_TextArea",
	  "@oracle/oraclejet-preact/UNSAFE_TextAreaAutosize",
	  "@oracle/oraclejet-preact/UNSAFE_TextField",
	  "@oracle/oraclejet-preact/UNSAFE_UserAssistance",
	  "@oracle/oraclejet-preact/hooks/UNSAFE_useFormContext",
	  "@oracle/oraclejet-preact/hooks/UNSAFE_useTooltip",
	  "@oracle/oraclejet-preact/hooks/UNSAFE_useUncontrolledState",
	  "@oracle/oraclejet-preact/utils/UNSAFE_logger",
	  "@oracle/oraclejet-preact/utils/UNSAFE_size",
	  "@oracle/oraclejet-preact/utils/UNSAFE_interpolations/text",
	  "@oracle/oraclejet-preact/utils/UNSAFE_valueUpdateDetail"
	],
	"ojs/ojcorebundle": [
	  "ojL10n",
	  "ojtranslations/nls/ojtranslations",
	  "ojs/ojlogger",
	  "ojs/ojcore-base",
	  "ojs/ojcontext",
	  "ojs/ojconfig",
	  "ojs/ojresponsiveutils",
	  "ojs/ojthemeutils",
	  "ojs/ojtimerutils",
	  "ojs/ojtranslation",
	  "ojs/ojcore",
	  "ojs/ojmessaging",
	  "ojs/ojmetadatautils",
	  "ojs/ojdefaultsutils",
	  "ojs/ojcustomelement-utils",
	  "ojs/ojcustomelement",
	  "ojs/ojdomutils",
	  "ojs/ojfocusutils",
	  "ojs/ojgestureutils",
	  "ojs/ojcomponentcore",
	  "ojs/ojkoshared",
	  "ojs/ojhtmlutils",
	  "ojs/ojtemplateengine-ko",
	  "ojs/ojtemplateengine-preact",
	  "ojs/ojtemplateengine-preact-ko",
	  "ojs/ojtemplateengine-utils",
	  "ojs/ojcomposite-knockout",
	  "ojs/ojcomposite",
	  "ojs/ojbindingprovider",
	  "ojs/ojknockouttemplateutils",
	  "ojs/ojresponsiveknockoututils",
	  "ojs/ojkeysetimpl",
	  "ojs/ojknockout",
	  "ojs/ojknockout-validation",
	  "ojs/ojrouter",
	  "ojs/ojmodule",
	  "ojs/ojmodule-element",
	  "ojs/ojmodule-element-utils",
	  "ojs/ojanimation",
	  "ojs/ojmoduleanimations",
	  "ojs/ojdefer",
	  "ojs/ojdatasource-common",
	  "ojs/ojarraytabledatasource",
	  "ojs/ojeventtarget",
	  "ojs/ojdataprovider",
	  "ojs/ojdataprovideradapter-base",
	  "ojs/ojdataprovideradapter",
	  "ojs/ojset",
	  "ojs/ojmap",
	  "ojs/ojarraydataprovider",
	  "ojs/ojlistdataproviderview",
	  "ojs/ojcss",
	  "ojs/ojbootstrap",
	  "ojs/ojvcomponent",
	  "ojs/ojpreact-patch",
	  "ojs/ojvcomponent-binding",
	  "ojs/ojvcomponent-remounter",
	  "ojs/ojvcomponent-template",
	  "ojs/ojdataproviderhandler",
	  "ojs/ojexpressionutils",
	  "ojs/ojkeyset",
	  "ojs/ojtreedataproviderview",
	  "ojs/ojexpparser",
	  "ojs/ojcspexpressionevaluator",
	  "ojs/ojcspexpressionevaluator-internal",
	  "ojs/ojtreedataprovideradapter",
	  "ojs/ojcorerouter",
	  "ojs/ojurlparamadapter",
	  "ojs/ojurlpathadapter",
	  "ojs/ojmodulerouter-adapter",
	  "ojs/ojknockoutrouteradapter",
	  "ojs/ojobservable",
	  "ojs/ojbinddom",
	  "ojs/ojdeferreddataprovider",
	  "ojs/ojtracer",
	  "ojs/ojcachediteratorresultsdataprovider",
	  "ojs/ojdedupdataprovider",
	  "ojs/ojmutateeventfilteringdataprovider",
	  "ojs/ojdataproviderfactory"
	],
	"ojs/ojcommoncomponentsbundle": [
	  "ojs/ojoption",
	  "ojs/ojchildmutationobserver",
	  "ojs/ojjquery-hammer",
	  "ojs/ojpopupcore",
	  "ojs/ojpopup",
	  "ojs/ojlabel",
	  "ojs/ojlabelledbyutils",
	  "ojs/ojbutton",
	  "ojs/ojmenu",
	  "ojs/ojtoolbar",
	  "ojs/ojdialog",
	  "ojs/ojoffcanvas",
	  "ojs/ojdomscroller",
	  "ojs/ojdatacollection-common",
	  "ojs/ojdataproviderscroller",
	  "ojs/ojlistview",
	  "ojs/ojlistitemlayout",
	  "ojs/ojnavigationlist",
	  "ojs/ojavatar",
	  "ojs/ojswitcher",
	  "ojs/ojmessage",
	  "ojs/ojmessages",
	  "ojs/ojconveyorbelt",
	  "ojs/ojcollapsible",
	  "ojs/ojaccordion",
	  "ojs/ojprogress",
	  "ojs/ojprogressbar",
	  "ojs/ojprogress-bar",
	  "ojs/ojprogress-circle",
	  "ojs/ojprogresslist",
	  "ojs/ojfilmstrip",
	  "ojs/ojtouchproxy",
	  "ojs/ojselector",
	  "ojs/ojtreeview",
	  "ojs/ojinputsearch",
	  "ojs/ojhighlighttext",
	  "ojs/ojactioncard",
	  "ojs/ojmessagebanner"
	],
	"ojs/ojformbundle": [
	  "ojtranslations/nls/localeElements",
	  "ojs/ojlocaledata",
	  "ojs/ojconverterutils",
	  "ojs/ojvalidator",
	  "ojs/ojvalidation-error",
	  "ojs/ojvalidator-required",
	  "ojs/ojeditablevalue",
	  "ojs/ojconverter",
	  "ojs/ojvalidator-async",
	  "ojs/ojconverterutils-i18n",
	  "ojs/ojconverter-number",
	  "ojs/ojvalidator-numberrange",
	  "ojs/ojinputnumber",
	  "ojs/ojvalidator-regexp",
	  "ojs/ojfilter",
	  "ojs/ojfilter-length",
	  "ojs/ojinputtext",
	  "ojs/ojoptgroup",
	  "ojs/ojlabelvalue",
	  "ojs/ojformlayout",
	  "ojs/ojradiocheckbox",
	  "ojs/ojcheckboxset",
	  "ojs/ojradioset",
	  "ojs/ojconverter-color",
	  "ojs/ojvalidator-length",
	  "ojs/ojvalidationfactory-base",
	  "ojs/ojvalidation-base",
	  "ojs/ojvalidationfactory-number",
	  "ojs/ojvalidation-number",
	  "ojs/ojvalidationgroup",
	  "ojs/ojasyncvalidator-adapter",
	  "ojs/ojasyncvalidator-length",
	  "ojs/ojasyncvalidator-numberrange",
	  "ojs/ojasyncvalidator-regexp",
	  "ojs/ojasyncvalidator-required",
	  "ojs/ojslider",
	  "ojs/ojswitch",
	  "ojs/ojcolor",
	  "ojs/ojfilepicker",
	  "ojs/ojselectbase",
	  "ojs/ojselectsingle"
	],
	"ojs/ojdatetimebundle": [
	  "ojs/ojcalendarutils",
	  "ojs/ojconverter-datetime",
	  "ojs/ojconverter-nativedatetime",
	  "ojs/ojvalidator-datetimerange",
	  "ojs/ojvalidator-daterestriction",
	  "ojs/ojdatetimepicker",
	  "ojs/ojvalidationfactory-datetime",
	  "ojs/ojvalidation-datetime",
	  "ojs/ojasyncvalidator-daterestriction",
	  "ojs/ojasyncvalidator-datetimerange"
	],
	"ojs/ojdvtbasebundle": [
	  "ojs/ojdvt-toolkit",
	  "ojs/ojattributegrouphandler",
	  "ojs/ojdvt-base"
	],
	"ojs/ojchartbundle": [
	  "ojs/ojdvt-axis",
	  "ojs/ojchart-toolkit",
	  "ojs/ojlegend-toolkit",
	  "ojs/ojdvt-overview",
	  "ojs/ojgauge-toolkit",
	  "ojs/ojchart",
	  "ojs/ojlegend",
	  "ojs/ojgauge"
	],
	"ojs/ojtimezonebundle": [
	  "ojs/ojtimezonedata",
	  "ojtranslations/nls/timezoneData"
	],
	"persist/offline-persistence-toolkit-core-1.5.7": [
	  "persist/persistenceUtils",
	  "persist/impl/logger",
	  "persist/impl/PersistenceXMLHttpRequest",
	  "persist/persistenceStoreManager",
	  "persist/impl/defaultCacheHandler",
	  "persist/impl/PersistenceSyncManager",
	  "persist/impl/OfflineCache",
	  "persist/impl/offlineCacheManager",
	  "persist/impl/fetch",
	  "persist/persistenceManager",
	  "persist/impl/PersistenceStoreMetadata"
	],
	"persist/offline-persistence-toolkit-pouchdbstore-1.5.7": [
	  "persist/PersistenceStore",
	  "persist/impl/storageUtils",
	  "persist/pouchdb-browser-7.2.2",
	  "persist/impl/pouchDBPersistenceStore",
	  "persist/pouchDBPersistenceStoreFactory",
	  "persist/configurablePouchDBStoreFactory",
	  "persist/persistenceStoreFactory"
	],
	"persist/offline-persistence-toolkit-arraystore-1.5.7": [
	  "persist/PersistenceStore",
	  "persist/impl/storageUtils",
	  "persist/impl/keyValuePersistenceStore",
	  "persist/impl/arrayPersistenceStore",
	  "persist/arrayPersistenceStoreFactory",
	  "persist/persistenceStoreFactory"
	],
	"persist/offline-persistence-toolkit-localstore-1.5.7": [
	  "persist/PersistenceStore",
	  "persist/impl/storageUtils",
	  "persist/impl/keyValuePersistenceStore",
	  "persist/impl/localPersistenceStore",
	  "persist/localPersistenceStoreFactory",
	  "persist/persistenceStoreFactory"
	],
	"persist/offline-persistence-toolkit-filesystemstore-1.5.7": [
	  "persist/impl/storageUtils",
	  "persist/impl/keyValuePersistenceStore",
	  "persist/impl/fileSystemPersistenceStore",
	  "persist/fileSystemPersistenceStoreFactory"
	],
	"persist/offline-persistence-toolkit-responseproxy-1.5.7": [
	  "persist/fetchStrategies",
	  "persist/cacheStrategies",
	  "persist/defaultResponseProxy",
	  "persist/simpleJsonShredding",
	  "persist/oracleRestJsonShredding",
	  "persist/simpleBinaryDataShredding",
	  "persist/queryHandlers"
	]
  }

const CONFIG_OVERRIDE_URL_PARAM_NAME = "configoverride";
const CONFIG_CLIENT_OVERRIDE_SESSION_KEY = "oic.spaui.config.override";

/**
 * Called from the top level to bootstrap the required modules.
 * @param coreModuleEntry the top level module specific to the current page loaded.
 *        Example : {'integration.suite.home': 'spaui/integration.suite.home.6c74dc61949f42372056'}
 * @param initCallback will be invoked once the module bootstrap is complete.
 */
function bootstrapOICUIModules(coreModuleEntry = {}, initCallback) {

	/*
	 * Adding this special handling for RPA
	 * This logic will be made part of LPAF going forward, we will make this more generic when we have LPAF up and running.
	 */
	_fetchFeaturesConfig("ic/home/registry/api/v1/features?integrationInstance=" + integrationInstance, function(features) {
		
		/*
		 * If RPA feature is exposed in the features API,
		 * then use RPA endpoints in the features API to download RPA MFE
		 * 		--- this has changed for now, RPA MFE should be downloaded from a derived URL for now
		 * 			We will revert to features API for RPA UI pieces at some later stages
		 */
		const rpaFeature = features.find(item => item.featureType.toLowerCase() === 'rpa');	// Hardcoding this to featureType=rpa for now, 
		if(rpaFeature) {
			const match = window.location.origin.match(/integration\.(.*?)\.ocp\.oraclecloud\.com/); // Read the browser URL and get the region
			const region = match ? match[1] : "us-phoenix-1";
			PROD_MF_MODULES["rpa"] = rpaFeature.localUrl ?? `https://orpa-preprod.${region}.oci.oraclecloud.com`;
		}
		const opaFeature = features.find(item => item.featureType.toLowerCase() === 'process_automation');
		if (opaFeature && opaFeature.project) {
			PROD_MF_MODULES["decision"] = opaFeature.localUrl + '/decision/designer';
			PROD_MF_MODULES["process"] = opaFeature.localUrl + '/oic-process-ui';
		}

		let localModuleConfigs = Object.assign(COMMON_LOCAL_MODULE_PATHS, coreModuleEntry);

		_buildOICMFLoadConfig(OIC_MF_MODULES_MAP, function(removeModulePaths, dynamicPublicPaths, moduleBuildInfos) {
	
			let allModulePaths = {
				...localModuleConfigs,
				...removeModulePaths
			};
			requirejs.config({
				baseUrl: './js',
				// Path mappings for the logical module names
				paths: allModulePaths,
				bundles: JET_BUNDLES_CONFIG,
				urlArgs: function(id, url) {
					let instanceidParam = "integrationInstance=" + integrationInstance;
					let enableInstanceContext = ENABLE_INSTANCE_ID_FRAGMENTS.find((pathEntry) => {
						return url.includes(pathEntry);
					})
					let disableCacheBust = DISABLE_CACHE_BUST_FRAGMENTS.find((pathEntry) => {
						return url.includes(pathEntry);
					})
					if (!disableCacheBust) {
						// For common builds use the build time cache bust param.
						// For resource built outside use the time stamp based cache bust param.
						let useBuildBust = Object.keys(COMMON_LOCAL_MODULE_PATHS).find((keyEntry) => {
							return id.startsWith(keyEntry);
						});
	
						let cacheBustParam = null;
						if (useBuildBust) {
							cacheBustParam = CACHE_BUST_PARAM;
						} else {
							let useRemoteBust = Object.keys(moduleBuildInfos).find((keyEntry) => {
								return id.startsWith(keyEntry);
							});
							let cacheBustVal = null;
							if (useRemoteBust) {
								cacheBustVal = moduleBuildInfos[useRemoteBust];
							}
	
							if (!cacheBustVal) {
								// Ideally should not come here.
								// Use the current time if there is no specific bust param is found.
								cacheBustVal = (new Date()).getTime();
							}
							cacheBustParam = "bust=" + cacheBustVal;
						}
						return (url.indexOf('?') === -1 ? '?' : '&') + cacheBustParam + (enableInstanceContext ? '&' + instanceidParam : '');
					}
					return (enableInstanceContext ? (url.indexOf('?') === -1 ? '?' : '&') + instanceidParam : "");
				},
				waitSeconds: 0
			});
	
			// Currently the public path updates are working only inside the module loader code.
			sessionStorage.setItem("oic.spaui.remote.publicPaths", JSON.stringify(dynamicPublicPaths));
			initCallback();
		});
	});
}

/**
 * Build the dynamic require module configuration.
 * The configuration is built based the following priority order
 * P0) Client overrides
 *   - Sample override url param:
 *     - ?configoverride={"plugins":{"insight":"https://insight-l1-plugin.us-phoenix-1.ocp.oc-test.com/20190131"}}
 * P1) Server side config (Config returned by the request js/config/plugin.json)
 * P3) OOTB defaults
 *     - These are the region specific defaults, with an option to local fallback in case of failures.
 * @param modulesTemplateArr the template entries related to the modules.
 * @param configLoadCallback is invoked once the config has been built.
 */
function _buildOICMFLoadConfig(modulesTemplateArr, configLoadCallback) {

	let dynamicModules = {};
	let dynamicPublicPaths = {};
	let moduleBuildInfoPromises = [];

	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const clientConfigOverrideStrEnc = urlParams.get(CONFIG_OVERRIDE_URL_PARAM_NAME);
	let clientConfigOverrideStr = clientConfigOverrideStrEnc !== null ? decodeURIComponent(clientConfigOverrideStrEnc) : null;
	if (!clientConfigOverrideStr) {
		clientConfigOverrideStr = sessionStorage.getItem(CONFIG_CLIENT_OVERRIDE_SESSION_KEY);
	}

	let plugins = {};
	if (clientConfigOverrideStr) {
		try {
			let configOverrides = JSON.parse(clientConfigOverrideStr);
			plugins = configOverrides.plugins;
			sessionStorage.setItem(CONFIG_CLIENT_OVERRIDE_SESSION_KEY, clientConfigOverrideStr);
		} catch (er) {
			console.log("## Unable to process the client config overrides ##")
			console.error(er, er.stack);
		}
	}

	_fetchModuleLoadConfig("js/config/plugins.json?integrationInstance=" + integrationInstance, function(serverPlugins) {
		// Merge the client and server config with priority to client config.
		plugins = Object.assign(serverPlugins, plugins);

		modulesTemplateArr.forEach(function(entry) {
			let moduleKey = entry.key;

			// Find the corresponding override entry.
			const match = Object.keys(plugins).find((key) => key === moduleKey);

			let moduleEndPoint = null;
			if (match) {
				moduleEndPoint = plugins[moduleKey];
			} else {
				// Build for the predefined end point.
				moduleEndPoint = PROD_MF_MODULES[moduleKey];
			}

			// Entry to update the remote public path.
			if (entry.publicPath && moduleEndPoint) {
				dynamicPublicPaths[moduleKey] = {
					publicPath: moduleEndPoint + "/js/" + moduleKey + "/",
					publicPathLoader: entry.publicPath
				};
			}

			let buildInfoPromise = _fetchRemoteBuildInfo(entry, moduleEndPoint);
			moduleBuildInfoPromises.push(buildInfoPromise);

			// We will use the remotely hosted module as the primary require config.
			// But will use the local as a fallback for development use-cases.
			let modules = entry.modules;
			Object.keys(modules).forEach(function(moduleKey) {
				let moduleDetails = [];
				let modulePath = modules[moduleKey];
				// Non-local endpoint.
				if (moduleEndPoint) {
					moduleDetails.push(moduleEndPoint + "/js/" + modulePath);
				}
				
					if (Array.isArray(modulePath)) {
						moduleDetails.push(...modulePath);
					} else {
						moduleDetails.push(modulePath);
					}
					dynamicModules[moduleKey] = moduleDetails;
			});
		});
		Promise.all(moduleBuildInfoPromises).then((moduleBuildInfos) => {
			let allModuleBuildInfos = {};
			moduleBuildInfos.forEach(buildInfo => {
				allModuleBuildInfos = {
					...allModuleBuildInfos,
					...buildInfo
				};
			});
			configLoadCallback(dynamicModules, dynamicPublicPaths, allModuleBuildInfos);
		}).catch(error => {
			console.error("Error constructing the build information for the modules. Failed due to " + error.message);
			configLoadCallback(dynamicModules, dynamicPublicPaths, []);
		});
	});
}

// Fetching the remote build information.
function _fetchRemoteBuildInfo(entry, moduleEndPoint) {
	if (entry.buildInfo) {
		let serverConfig = new XMLHttpRequest();
		serverConfig.withCredentials = true;
		serverConfig.overrideMimeType("application/json");
		// Need to make sure that build info is not cached and loaded every time.
		let resourceQuery = entry.buildInfo + "?bust=" + (new Date()).getTime() + (integrationInstance ? "&integrationInstance=" + integrationInstance : "");
		if (moduleEndPoint) {
			resourceQuery = moduleEndPoint + "/" + resourceQuery;
		}
		serverConfig.open("GET", resourceQuery, true);
		let moduleBuildInfos = {};
		let ret = new Promise(resolve => {
			serverConfig.onreadystatechange = function() {
				if (serverConfig.readyState === 4) {
					try {
						let buildTimestamp = null;
						if (serverConfig.status === 200) {
							buildTimestamp = JSON.parse(serverConfig.responseText).buildTimestamp;
						} else {
							console.log("Using the spaui build information for the module [" + entry.key + "]");
						}
						let modules = entry.modules;
						Object.keys(modules).forEach(function(moduleKey) {
							moduleBuildInfos[moduleKey] = buildTimestamp;
						});
						resolve(moduleBuildInfos);
					} catch (error) {
						console.log("Error processing the build information for the module [" + entry.key + "]. Failed due to " + error.message);
						resolve(moduleBuildInfos);
					}
				}
			}
		});
		serverConfig.send(null);
		return ret;
	} else {
		return Promise.resolve({});
	}
}

// Module to read the server configuration.
function _fetchModuleLoadConfig(fileName, callback) {
	let serverConfig = new XMLHttpRequest();
	serverConfig.overrideMimeType("application/json");
	serverConfig.open("GET", fileName, true);
	serverConfig.onreadystatechange = function() {
		if (serverConfig.readyState === 4) {
			let serverConfigText = null;
			if (serverConfig.status === 200) {
				serverConfigText = serverConfig.responseText;
			} else {
				console.log("No server plugin overrides loaded")
				serverConfigText = '{"plugins": {}}';
			}
			callback(JSON.parse(serverConfigText).plugins);
		}
	}
	serverConfig.send(null);
}

function _fetchFeaturesConfig(url, callback) {
	let serverConfig = new XMLHttpRequest();
	serverConfig.overrideMimeType("application/json");
	serverConfig.open("GET", url, true);
	serverConfig.onreadystatechange = function() {
		if (serverConfig.readyState === 4) {
			let serverConfigText = null;
			if (serverConfig.status === 200) {
				serverConfigText = serverConfig.responseText;
			} else {
				console.log("No server plugin overrides loaded")
				serverConfigText = '{"items": {}}';
			}
			callback(JSON.parse(serverConfigText).items);
		}
	}
	serverConfig.send(null);
}

bootstrapOICUIModules({
	'integration.suite.home': 'spaui/integration.suite.home.6c74dc61949f42372056'
}, function() {
	require(['integration.suite.home'], function(app) {
		app.start({});
	});
});
