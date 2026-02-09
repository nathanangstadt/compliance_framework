/* Copyright (c) 2023, Oracle and/or its affiliates */

/*
 * ###Common Strings for All Shell Components###
 *
 * Every component has its own explicit section with all the strings required by the component listed. However, some keys are common and
 * shared across components is explicitly commented out and sits in a common section at the start of this file. Please add a comment for
 * those strings in the respective component section:
 *
 * "Refer to common section"
 *
 * e.g.
 * //oj-sp-about page
 * // aboutThisApplication: 'About This Application',
 * adf: 'Oracle Application Development Framework',
 */

// * See the JET documentation for oj.Translations, and adding resource bundles.
define({
  /**
   * Common Strings shared across components
   */
  actions: 'Actions',
  attachmentsRemove: 'Remove', // locnote= Alt text for icon to remove attachment
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  continue: 'Continue', // locnote= Label for the button to continue with a flow such as a guided process
  download: 'Download',
  edit: 'Edit',
  editProfile: 'Edit Profile',
  errorIcon: 'Error',
  goToParent: 'Parent page',
  infoIcon: 'Information',
  moreActions: 'More Actions',
  next: 'Next',
  previous: 'Previous',
  ctaAndNext: "{CTA_LABEL} and Next",
  ctaAndClose: "{CTA_LABEL} and Close",
  rangeSeparator: '{from}–{to}', // locnote= Separator used for number and date ranges where the tokens are substituted with the from and to values. En dash character (unicode number: U+2013 - https://unicode-table.com/en/2013) is used as the separator.
  remove: 'Remove',
  resume: 'Resume',
  save: 'Save',
  skip: 'Skip',
  start: 'Start', // locnote= Label for button to start a flow such as a guided process
  submit: 'Submit', // locnote= Label for button as the final step of a task, such as submit a workflow or guided process
  successIcon: 'Success',
  updateMedia: 'Update Media',
  lastUpdateDate: 'Last updated on {date}',
  warningIcon: 'Warning',
  inFlowBack: 'Back',
  /*
   * oj-sp-filter-chip
   */
  appliedFilter: 'Applied Filter: {value}', // locnote= Screen reader text for an applied filter where the value token is replaced by the filter label and value. For example: "Applied Filter: Country US"
  count: 'Count', // locnote= Translation string used for the xAndY translation string
  filterRemove: 'Remove {0}', // locnote= Aria label to provide context of the object to remove where the token is the object label. For example: "Remove Country US"
  label: 'Label', // locnote= Translation string used for the xAndY translation string
  // remove: Refer to common section,
  suggestionFilter: 'Suggested Filter {labelSuffix}: {value}', // locnote= Screen reader text for a suggestion filter where the labelSuffix and value tokens are replaced by a combination of filter label, value, and count depending of the contents of the suggestion filter. For example: "Suggested Filter Label: Country" or "Suggested Filter Value: US" or "Suggested Filter Value and Count: US 900"
  pressDelete: 'Press delete to remove',
  value: 'Value', // locnote= Translation string used for the xAndY translation string
  xAndY: '{x} and {y}', // locnote= Translation string used to generate the value token of the suggestionFilter translation string. For example: "Value and Count"

  /**
   * oj-sp-email-address-chip
   */
  emailAddressChipRemove: 'Remove',

  /**
   * oj-sp-smart-search
   */
  keywordWarningMessage: 'The maximum number of keywords have been added to your search query.',

  /**
   * oj-sp-smart-filters
   */
  appliedFilters: 'Applied Filters',
  // back: Refer to common section,
  andAriaLabel: 'And',
  clearField: 'Clear field',
  complexFilterChip: 'Complex Filter Chip',
  keywordFilterChip: 'Keyword Filter Chip',
  moreFilters: 'More Filters',
  msgNoData: 'Nothing matches your search.',
  plusCount: '+{0}',
  search: 'Search',
  seeResults: 'View {0} Results',
  suggestionFilters: 'Suggested Filters',
  suggestions: 'Suggestions',

  /**
   * oj-sp-input-email
   */
  errorMessageEmail: 'Enter a value in this format: user@example.com.',
  email: 'Email',

  /**
   * oj-sp-input-url
   */
  errorMessageUrl: 'Enter a URL in this format: www.example.com.',
  url: 'URL',

  /**
   * oj-sp-header-create-edit
   */
  // actions: Refer to common section,
  avatarHint: 'Avatar of {pageTitle}',
  // back: Refer to common section,
  // cancel: Refer to common section,
  // goToParent: Refer to common section,
  // next: Refer to common section,
  // save: Refer to common section,

  /**
   * oj-sp-header-general-overview
   */
  // actions: Refer to common section,
  // back: Refer to common section,
  // goToParent: Refer to common section,
  navigator: 'Navigator',

  /**
   * oj-sp-header-navigation
   */
  contentExpanded: 'Back',
  // goToParent: Refer to common section,
  // inFlowBack: Refer to common section,
  // next: Refer to common section,
  // previous: Refer to common section,

  /**
   * oj-sp-messages-banner
   */
  tryAgain: 'Try again',
  viewLess: 'View less',
  viewMore: 'View more',
  accMoreContentDisplayed: 'More content displayed',
  serverErrorMessage: 'Server not responding',

  /**
   * oj-sp-diagram-node
   */
  // actions: Refer to common section,
  // errorIcon: Refer to common section,
  // infoIcon: Refer to common section,
  // successIcon: Refer to common section,
  // warningIcon: Refer to common section,
  nodeLabel: 'Label',
  nodeUntitled: 'Untitled',
  addNodeAbove: 'Add Node Above',
  addNodeBelow: 'Add Node Below',
  addNodeLeft: 'Add Node To Left',
  addNodeRight: 'Add Node To Right',
  addNodeConnectedToNode: 'Add node connected to {nodeTitle} node',
  addNodeConnectedToNodePath: 'Add node connected to {nodeTitle} node on path {pathTitle}',

  /**
   * oj-sp-diagram-builder
   */
  accHasPaths: 'Has paths',
  addNode: 'Add node',
  addNodeBetween: 'Add Node Between',
  flowStart: 'Start of flow',
  flowEnd: 'End of flow',
  pathFromNodeToNode: '{pathStyle} path {pathLabel} from {nodeTitle1} to {nodeTitle2}',

  /**
   * oj-sp-hierarchy-card
   */
  // actions: Refer to common section,

  /**
   * oj-sp-hierarchy-viewer
   */
  childCardList: 'List of {0}', // locnote=Aria label for the list that contains the child cards, the placeholder will contain the tab name, for example "List of Directs" or "List of Departments"

  /**
   * oj-sp-input-key-flex-field
   */
  kffSegmentName: 'Segment',
  kffSegmentValue: 'Value',
  kffSegmentDescription: 'Description',
  segmentError: 'Enter valid segment values for these segments: {0}',
  validationErrorMessage: 'Enter a valid combination of segment values.',
  incompleteCombinationError: 'Enter the missing segment values.',
  requiredSegmentError: 'These segments are required: {0}',
  advanced_search: 'Search for combination',
  no_item_to_display: 'No matches found.',
  segment_lov_table: 'Segment values',
  search_value_or_description: 'Search by value or description',
  kff_combinations: 'Search for combination',
  select: 'Select',
  selectCombination: 'Apply',
  clearValue: 'Clear',
  clearSegmentValue: 'Clear {0}', // locnote= Action to clear the value for the segment filter chip where the token is substituted with the segment name.
  alias: 'Alias',
  combination: 'Combination',
  kff_placeholder_text: 'Enter #alias or segment',
  combinationDetails: 'Combination details',
  aliasSubtitle: 'Alias {0}',

  /**
   * oj-sp-input-currency
   */
  minValidationMsg: 'Enter {0} or a higher number.',
  maxValidationMsg: 'Enter {0} or a lower number.',
  minMaxEqualValidationMsg: 'Enter the number {0}.',

  /**
   * oj-sp-activity-item
   */
  create: 'Create',
  pin: 'Pin',
  // edit: Refer to common section,
  // moreActions: Refer to common section,
  // actions: Refer to common section,
  // cancel: Refer to common section,
  // save: Refer to common section,

  /**
   * oj-sp-appointment-item
   */
  appointment: 'Appointment',

  /**
   * oj-sp-card-footer
   */
  // moreActions: Refer to common section,
  // actions: Refer to common section,
  secondaryActions: 'Secondary Actions',

  /**
   * oj-sp-collection-container
   */
  add: 'Add',
  delete: 'Delete',

  active: 'Active',
  hidden: 'Hidden',
  show: 'Show',
  hide: 'Hide',
  columns: 'Columns',
  contextMenu: 'Context',
  restoreDefaults: 'Restore Defaults',

  allSelected: 'All selected',
  numSelected: '{0} selected',
  allTotalSelected: 'All {0} selected',
  numOfTotalSelected: '{0} of {1} selected',
  sortBy: 'Sort By',
  noneSelected: 'None selected',
  layoutActions: 'Layout Actions',
  // search: Defined in another section,

  /**
   * oj-sp-collection-container-advanced
   */
  exportIcon: 'Export',

  /**
   * oj-sp-expandable-list-item
   */
  // actions: Refer to common section,

  /**
   * oj-sp-item-overview
   */
  share: 'Share',
  favorite: 'Add to Favorites',
  unfavorite: 'Remove from Favorites',
  // edit: Refer to common section,
  // actions: Refer to common section,

  /**
   * oj-sp-smart-filter-search
   */
  smartFilterSearchNumberResults: '{numOfResults} Results',
  smartFilterSearchOneResult: '{numOfResults} Result',
  smartFilterSearchSwitchView: 'Switch views between the dashboard and search results',
  smartFilterSearchViewDashboard: 'View dashboard',
  smartFilterSearchViewSearchResults: 'View search results',

  /**
   * oj-sp-horizontal-overview
   */
  showDetails: 'Show Details',

  /**
   * oj-sp-list-item-template
   */
  // actionToolbar: 'Actions', Renamed to "actions" in the component, Refer to common section
  // moreActions: 'More actions', Refer to common section,
  /**
   * oj-rw-sample-monetary-list-item-template
   */
  transactionDate: 'Transaction Date',
  /**
   * oj-sp-object-card
   */
  // object-card has no strings at this point in time

  /**
   * oj-sp-profile-card
   */
  // moreActions: 'More Actions', Refer to common section,
  // actions: 'Actions', Refer to common section,

  /**
   * oj-sp-task-card
   */
  // task-card has no strings at this point in time

  /**
   * oj-sp-attachments-common
   * - Used by both oj-sp-attachments-simple and oj-sp-attachments
   */
  attachmentsList: 'Attachments',
  lastUpdateByDate: 'Last updated by {username} on {date}',
  // lastUpdateDate: 'Last updated on {date}', Refer to common section
  addFiles: 'Add Files',
  addUrl: 'Add URL',
  urlLengthValidationMessage: 'Enter a URL with no more than 4000 characters.',
  removeDialogHeader: 'Remove attachment?',
  // addFilePrimaryText: 'Drag and Drop',
  //addFileSecondaryText: 'Select or drop files here.',

  /**
   * oj-sp-attachments-simple
   */
  AA_LINK_PLACEHOLDER: 'http://www.example.com',
  attach: 'Attach',
  // cancel: Refer to common section - locnote Button label to cancel the action and close the dialog
  AA_URL: 'URL',
  AA_ATTACH_URL_HEADING: 'Attach URL',
  AA_STOP_UPLOAD: 'Cancel Upload',

  /**
   * oj-sp-thumbnail
   */
  alternativeText: 'Thumbnail',
  documentAlternativeText: 'Document',
  imageAlternativeText: 'Image',
  videoAlternativeText: 'Video',
  audioAlternativeText: 'Audio',
  pdfAlternativeText: 'PDF',
  presentationAlternativeText: 'Presentation',
  spreadsheetAlternativeText: 'Spreadsheet',
  compressedAlternativeText: 'Compressed file',
  codeAlternativeText: 'Code',
  webAlternativeText: 'Web',
  actionText: 'Thumbnail action',

  /**
   * oj-sp-input-rich-text
   */
  fontSizeSmall: 'Small',
  fontSizeNormal: 'Normal',
  fontSizeLarge: 'Large',
  fontsizeExtraLarge: 'Extra Large',
  alignCenter: 'Align Center',
  alignLeft: 'Align Left',
  alignRight: 'Align Right',
  fontSizeMenuLabel: 'Font Size',
  alignMenuLabel: 'Alignment',

  /**
   * oj-sp-input-rich-text-2
   */
  userMention: 'Mention Someone',
  insertHashtag: 'Add Hashtag',
  insertMenu: 'Insert',
  formattingToolbar: 'Formatting',
  customToolbar: 'Custom action',
  decreaseIndent: 'Decrease Indent',
  increaseIndent: 'Increase Indent',
  clearFormatting: 'Clear Formatting',
  numberList: 'Numbered List',
  bulletList: 'Bulleted List',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  alignmentMenu: 'Alignment',
  alignJustify: 'Justify',
  matchesFound: 'matches found',

  /**
   * oj-sp-attachments
   */
  preview: 'Preview',
  editAttachDetails: 'Edit', // locnote Alt text for the Edit icon to edit attachment details
  // cancel: Refer to common section,
  updateAttachment: 'Update',
  fileUrlHeader: 'File/URL',
  categoryHeader: 'Category',
  fileSizeHeader: 'File Size',
  lastUpdatedByHeader: 'Last Updated By',
  lastUpdatedOnHeader: 'Last Updated On',
  descriptionHeader: 'Description',
  attachmentsHeading: 'Attachments',
  addUrlDialogHeader: 'Add URL',
  editDialogHeader: 'Attachment details',
  // editTitleLabel: 'Title', - removed
  displayNameLabel: 'Display Name',
  lastUpdatedByLabel: 'Last Updated By',
  lastUpdatedOnLabel: 'Last Updated On',
  fileSizeLabel: 'File Size',
  categoryLabel: 'Category',
  descriptionLabel: 'Description',
  uploadCompleteAction: 'Upload complete',
  overallUploadProgress: 'Uploading {count} files',
  overallUploadComplete: 'Finishing upload',
  attachmentsTable: 'Attachments',
  uploadingIconAlternativeText: 'Uploading',
  // Attachments Property Errors
  // Attachments Errors
  errorAttachmentUploadRegistration: 'Attachment registration issue',
  errorAttachmentUpload: 'Couldn\'t upload attachment',
  errorAttachmentDownload: 'Couldn\'t download attachment',
  errorAttachmentDownloadNoContent: 'Couldn\'t download empty file',
  errorAttachmentUpdate: 'Couldn\'t update attachment',
  errorAttachmentRemove: 'Couldn\'t remove attachment',
  errorAttachmentCategories: 'Couldn\'t get categories',
  errorAttachmentRetrieve: 'Couldn\'t get attachments',
  errorAttachmentPreviewPages: 'Couldn\'t get preview pages',
  // Attachment Overview Error Details
  errorAttachmentEndpointDetail: 'There seems to be a missing property. Please try again later and if the issue persists, contact your help desk.',
  errorAttachmentOverviewCodeDetail: 'An attachments error occurred: {code}. Please try again later and if the issue persists, contact your help desk.',
  // Attachment Accessibility Announcements
  attachmentAnnounceUpload: 'Completed file upload {filename}',
  attachmentAnnounceCreateLink: 'Created attachment link',
  attachmentAnnounceAdditionalCreateLink: 'Created additional attachment link',
  attachmentAnnounceDelete: 'Deleted attachment {displayName}',
  attachmentAnnounceDownload: 'Downloading attachment {displayName}',
  attachmentAnnounceEdit: 'Edited attachment {displayName}',
  // Preview Actions
  previewNewTab: 'New tab',

  /**
   * oj-sp-preview-card (private component of attachments)
   */
  // actions: Refer to common section,
  // cancel: Refer to common section,
  // download: Refer to common,
  // removeAction: Refer to common,

  /**
   * oj-sp-input-address
   */

  typeInAddress: 'Enter an address',
  cannotFindAddress: 'No matches found.',
  searchAddress: 'Search for new address',
  countryRegion: 'Country/Region',
  searchForAnAddress: 'Search for an address',
  editAddress: 'Edit address',

  /**
   * oj-sp-attachments-viewer
   */
  magnificationControlGroup: 'Magnification Controls',
  zoomOut: 'Zoom Out',
  zoomIn: 'Zoom In',
  fitWidth: 'Fit to Width',
  navigationControlGroup: 'Navigation Controls',
  previousFile: 'Previous File',
  nextFile: 'Next File',
  // identifies the content area for accessibility
  attachmentContent: 'Attachment Content',

  /**   * oj-sp-message-unsaved-changes
   */
  unsavedChangesTitle: 'Discard your changes?',
  unsavedChangesMessage: 'If you leave now, your changes won\'t be saved.',
  unsavedChnagesSaveAndLeaveTitle: 'Save your changes?',
  unsavedChangesSaveAndLeaveMessage: 'If you leave without saving, your changes will be discarded.',
  // cancel: Refer to common section,
  discard: 'Discard',
  // save: Refer to common section,

  /**
   * oj-sp-attachments-2
   */
  // actions -- shared
  // add: 'Add', // shared
  // actions: 'Actions', // shared
  addLink: 'Add Link',
  attachFile: 'Attach File',
  // attachmentsRemove: 'Remove',  // shared
  attachments: 'Attachments',
  attachmentDetails: "Attachment details",
  attachmentTitle: 'Title',
  // attachmentAnnounceDownload: 'Downloading attachment {displayName}',  // shared
  attachmentSingleRemoved: '1 attachment removed',
  attachmentsMultipleRemoved: '{count} attachments removed',
  attachmentUpdated: 'Attachment updated',
  downloadAttachment: 'Download "{title}"',
  // descriptionHeader: 'Description', // shared
  // cancel: 'Cancel', // shared
  // download: 'Download', // shared
  // edit: 'Edit', // shared
  editAttachment: 'Edit "{title}"',
  // fileSizeHeader: 'File Size', // shared
  fileType: 'File Type',
  link: 'Link',
  linkAdded: 'Link added',
  selectFileOrDropMsg: 'Select a file or drop one here.',
  selectFileMsg: 'Select a file.',
  maxFileSizeMsg: 'Maximum file size is {max_size}.',
  
  updatedOnDate: 'Updated on {date}',
  updatedOn: 'Updated On',
  uploadingSingleFile: 'Uploading file',
  uploadingManyFile: 'Uploading {count} files',
  uploadedFile: '1 file uploaded',
  uploadedFiles: '{count} files uploaded',
  // remove: 'Remove' // shared
  // removeDialogHeader: 'Remove attachment?', // shared 
  removeMultipleAttachments: 'Remove {count} attachments?',
  sampleURL: 'https://www.example.com',
  selectAttachment: 'Select "{title}"',
  
    
  // file sizes -- not shared but can be if the function is moved
  fileSize_byte: "byte",
  fileSize_bytes: "bytes",
  fileSize_kilobytes: "KB",
  fileSize_megabytes: "MB",
  fileSize_gigabytes: "GB",
  fileSize_terabytes: "TB",


  /**
   * oj-sp-message-dialog
   */
  // cancel: Refer to common section,
  /** oj-sp-message-destruction
   *
   */
  // cancel: Refer to common section,
  deleteButton: 'Delete',

  /**
  * oj-sp-input-currency-conversion-rate
  */

  checkRateValues: 'Check the rate values.',
  rateType: 'Rate Type',
  rate: 'Rate',
  inverseRate: 'Inverse Rate',
  apply: 'Apply',
  enterGreaterThanZero: 'Enter a number greater than 0.',
  selectConversionRateType: 'Select conversion rate type.',
  selectConversionRate: 'Select conversion rate',
  conversionRate: 'Conversion Rate',
  selectedDateNotAvailableTryAnother: 'The date you selected isn\'t available. Try another date.',

  /**
   * oj-sp-foldout-panel
   */
  fpViewMore: 'View more',

  /**
   * oj-sp-guided-process
   */
  stepIndicator: 'Step {0} of {1}', // locnote= Text for screen reader to indicate which step is in focus, for example 'Step 1 of 4' in a guided process
  stepTitle: 'Step {currentStep} of {totalSteps} {stepTitle}', // locnote= Aria-label Accessibility text to provide context for position of steps and the process title.

  uploadingFile: 'Uploading file',
  stepError: 'Contains errors',
  stepSuccess: 'Completed',
  stepInProgress: 'In progress',
  accChecklist: 'Checklist',

  /**
  * oj-sp-timestamp
  */
  lastUpdateRelativeDate: 'Last updated {date}',

  /**
  * oj-sp-emo-button
  */
  // locnote: values used to replace tokens in the tooltips, for example 'This was a good experience'
  emoUnhappy: 'bad',
  emoNeutral: 'okay',
  emoHappy: 'good',
  // locnote: values used in the emo buttons when they're in focus
  emoUnhappyLabel: 'Bad',
  emoNeutralLabel: 'Okay',
  emoHappyLabel: 'Good',
  emoDefaultAcknowledgementMessage: 'Your action was completed',
  emobuttonProximalAriaText: 'Give us feedback as you finish',
  // locnote: Tooltip for the emo button when the mood token is replaced by either 'bad' or 'good'.
  emobuttonAssistiveText: 'This was a {mood} experience',
  // locnote: Tooltip for the emo button when the mood token is replaced by 'okay'.
  emobuttonAssistiveNeutralText: 'This was an {mood} experience',
  emoDrawerTitle: 'Anything else to add?',
  emoMobileDrawerTitle: 'How was your experience?',
  emoDrawerResponseText: 'We recorded your response, but you can change it here.',
  // locnote: Inline text when the user changes emo response to either good, bad, or okay.
  emoDrawerModifiedResponseText: 'You changed your response to {mood}.',
  emoResponseItemEasy: 'Easy to use',
  emoResponseItemAppealing: 'Visually appealing',
  emoResponseItemCouldBetter: 'Could be better',
  emoResponseItem1: 'Took too long',
  emoResponseItem2: 'Too complicated',
  emoSendFeedback: 'Send',
  // locnote: Hover text and aria-label for the Close icon on the drawer
  emoCancelFeedback: 'Close',
  emoLegalDisclaimer: 'By filling and submitting this form you understand and agree that the use of Oracle\'s web site is subject to the {emoTermsofUse}. Additional details regarding Oracle\'s collection and use of your personal information, including information about access, retention, rectification, deletion, security, cross-border transfers and other topics, is available in the {emoPrivacyPolicy}.',
  emoTermsofUse: 'Oracle.com Terms of Use',
  emoPrivacyPolicy: 'Oracle Privacy Policy',
  emoMobileDrawerAcknowledgement: 'Thanks for your feedback',

  /**
   * oj-sp-scoreboard
   */
  listOfScoreCards: 'Scoreboard metric cards',

  /**
   * oj-sp-scoreboard-metric-card
   */
  arrowUp: 'Up',
  arrowDown: 'Down',

  /**
   * oj-sp-bottom-drawer-template
   */
  expandDrawer: 'Expand',
  collapseDrawer: 'Collapse',
  maximizeDrawer: 'Maximize',
  minimizeDrawer: 'Minimize',
  accDrawerExpand: 'Expand {0}',
  accDrawerCollapse: 'Collapse {0}',
  accDrawerMaximize: 'Maximize {0}',
  accDrawerMinimize: 'Minimize {0}',
  accDrawerClose: 'Close {0}',

  /**
   *  oj-sp-input-phone-number
   */
  invalidPhoneLengthForCountry: 'Enter the standard number of digits for the selected country.',
  invalidDialingCode: 'Enter a known dialing code.',
  invalidSubscriberNumber: 'Enter a number appropriate for this country or region.',

  /**
   * oj-sp-compose-email
   */
  from: 'From',
  to: 'To',
  subject: 'Subject',
  ccBcc: 'Cc/Bcc',
  cc: 'Cc',
  bcc: 'Bcc',
  reply: 'Reply',
  replyAll: 'Reply All',
  send: 'Send',
  forward: 'Forward',
  startNewThread: 'Start New Thread',
  forwardPrepend: 'Fwd:',
  labelAccOpenDropdown: 'Expand',
  labelAccClearValue: 'Clear Value',
  plusNMore: '+{COUNT}',

  /**
   * oj-sp-vertical-anchor-navigator
   */
  sectionsPanel: 'Jump to',
  sectionsPanelAcc: 'Jump to Section',

  /**
   * oj-sp-collection-detail-page
   */
  collectionDetailPageNoSelectionSlotDefaultMessage: 'When you select an item, you see its details here.',

  /**
   * oj-sp-information-organizer
   */
  containsErrors: 'Contains errors'
});
