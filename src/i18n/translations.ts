import enLocale from './locales/en/common.json';
import zhLocale from './locales/zh/common.json';

export type Language = 'en' | 'zh';

export interface Translations {
  // Header
  appName: string;
  appSubtitle: string;
  versionBadge: string;
  pageTitle: string;
  // Header links
  menuTutorials: string;
  menuPromptCategories: string;
  menuTemplateManagement: string;
  menuCommunity: string;
  menuAssets: string;
  menuWallet: string;
  
  // Settings
  settings: string;
  apiKey: string;
  geminiApiKey: string;
  enterApiKey: string;
  getApiKey: string;
  testApiKey: string;
  testing: string;
  save: string;
  saved: string;
  clear: string;
  language: string;
  selectLanguage: string;
  savePath: string;
  savePathDescription: string;
  chooseFolder: string;
  openFolder: string;
  defaultSavePath: string;
  desktopAppOnly: string;
  imageServiceUrl: string;
  enterBackendUrl: string;
  backendUrlHelp: string;
  
  // Validation messages
  apiKeyValid: string;
  apiKeyInvalid: string;
  apiKeySaved: string;
  validatingApiKey: string;
  enterApiKeyToTest: string;
  
  // Mode selector
  selectMode: string;
  chooseHowToCreate: string;
  generate: string;
  edit: string;
  select: string;
  createFromText: string;
  modifyExisting: string;
  clickToSelect: string;
  canvasTab: string;
  upscalingTab: string;
  workflowsTab: string;
  
  // File upload
  addReferenceImages: string;
  styleReferences: string;
  uploadImageToEdit: string;
  uploadImageWithMasks: string;
  addImagesToGuide: string;
  addStyleReferences: string;
  uploadToStartEditing: string;
  chooseFile: string;
  replaceImage: string;
  uploadImage: string;
  uploadImageForMaskPainting: string;
  uploadImageForEditUpTo2: string;
  optionalStyleReferencesUpTo2: string;
  uploadReferenceImagesUpTo2: string;
  upload: string;
  removeImage: string;
  
  // Prompt
  generateFromText: string;
  editInstructions: string;
  enterPromptAndInvoke: string;
  describeChanges: string;
  promptPlaceholderGenerate: string;
  promptPlaceholderEdit: string;
  needsMoreDetail: string;
  goodPrompt: string;
  excellentPrompt: string;
  characters: string;
  
  // Mode help text
  generateModeTitle: string;
  generateModeDescription: string;
  generateModeTip: string;
  editModeTitle: string;
  editModeDescription: string;
  selectModeTitle: string;
  selectModeDescription: string;
  selectModeWarning: string;
  modelSelection: string;
  modelSelectionDescription: string;
  modelOptionGemini: string;
  modelOptionGeminiHint: string;
  modelOptionImagen: string;
  modelOptionImagenHint: string;
  modelCustomLabel: string;
  modelGeminiHelp: string;
  modelImagenSelectLabel: string;
  modelImagenLoading: string;
  modelImagenLoadingShort: string;
  modelImagenEmpty: string;
  modelLoadError: string;
  
  // Generate button
  invoke: string;
  applyEdit: string;
  validating: string;
  stopGeneration: string;
  generating: string;
  startUpscaling: string;
  stopUpscaling: string;
  scaleLabel: string;
  upscalingPanelTitle: string;
  upscalingModelTitle: string;
  upscalingBackToGenerate: string;
  upscalingSelectedAlt: string;
  upscalingNoImageTitle: string;
  upscalingNoImageDescription: string;
  upscalingUploadAria: string;
  upscalingReplaceAria: string;
  upscalingModelLockedBadge: string;
  upscalingModelLockedHint: string;
  upscalingAdvancedOptions: string;
  upscalingStructure: string;
  upscalingStopping: string;
  upscalingProcessing: string;
  upscalingImageReady: string;
  upscalingReadError: string;
  upscalingLoadError: string;
  upscalingFetchSourceError: string;
  upscalingProcessSourceError: string;
  upscalingProcessingError: string;
  upscalingResultTitle: string;
  upscalingSessionTitle: string;
  upscalingCompleteStatus: string;
  upscalingStoppedStatus: string;
  upscalingFailedGeneric: string;
  upscalingResizeAria: string;
  upscalingDragToResize: string;
  pressCtrlEnter: string;
  waitingGeneration: string;
  thisMayTakeMoments: string;
  
  // Advanced controls
  showAdvancedControls: string;
  hideAdvancedControls: string;
  clearSession: string;
  aspectRatio: string;
  creativity: string;
  seed: string;
  random: string;
  areYouSure: string;
  clearSessionConfirm: string;
  yesClear: string;
  cancel: string;
  
  // Keyboard shortcuts
  shortcuts: string;
  saveImage: string;
  reRoll: string;
  editMode: string;
  history: string;
  togglePanel: string;
  
  // Save success modal
  imageSavedSuccessfully: string;
  imageSavedToGallery: string;
  savedToPath: string;
  downloadImage: string;
  browserStorageNote: string;
  ok: string;
  
  // History panel
  yourCreations: string;
  items: string;
  gallery: string;
  total: string;
  noCreationsYet: string;
  generatedImagesWillAppear: string;
  currentImage: string;
  dimensions: string;
  mode: string;
  generationDetails: string;
  prompt: string;
  model: string;
  editInstruction: string;
  type: string;
  created: string;
  mask: string;
  applied: string;
  originalImage: string;
  maskedReference: string;
  referencesUsed: string;
  generationStep: string;
  generatingProgress: string;
  
  // Canvas
  createWithAI: string;
  enterPromptToGenerate: string;
  uploadImageToStartEditing: string;
  readyToCreate: string;
  creatingYourImage: string;
  addCanvasImageToReferences: string;
  saveCanvasImage: string;
  
  // Toolbar
  brush: string;
  masks: string;
  
  // Info modal
  about: string;
  tipsHelp: string;
  version: string;
  
  // Info modal content
  appDescription: string;
  aiGeneration: string;
  aiGenerationDesc: string;
  smartEditing: string;
  smartEditingDesc: string;
  desktopOptimized: string;
  desktopOptimizedDesc: string;
  infiniteVariations: string;
  infiniteVariationsDesc: string;
  professionalQuality: string;
  professionalQualityDesc: string;
  advancedControls: string;
  advancedControlsDesc: string;
  
  // Prompt Composer
  promptTips: string;
  hidePromptPanel: string;
  showPromptPanel: string;
  templates: string;
  choosePromptTemplate: string;
  clickToManageTemplates: string;
  clickToCollapse: string;
  improvePrompt: string;
  improving: string;
  activeTemplate: string;
  positive: string;
  negative: string;
  enterCustomPrompt: string;
  improvedPromptTitle: string;
  originalPrompt: string;
  improvedVersion: string;
  acceptAndUse: string;
  keepOriginal: string;
  canEditImproved: string;
  
  // Templates actions
  hidePreview: string;
  showPreview: string;
  createTemplate: string;
  importTemplates: string;
  exportTemplates: string;
  hideTemplatePrompt: string;
  showTemplatePrompt: string;
  flattenTemplate: string;
  clearTemplateSelection: string;
  duplicateTemplate: string;
  editTemplate: string;
  deleteTemplate: string;
  
  // History Panel tabs
  boards: string;
  myCreations: string;
  images: string;
  assets: string;
  noImagesYet: string;
  createImagesMessage: string;
  
  // Boards
  createBoard: string;
  renameBoard: string;
  downloadBoard: string;
  deleteBoard: string;
  cannotDeleteDefault: string;
  confirmDelete: string;
  uploadImages: string;
  removeFromBoard: string;
  moveToBoard: string;
  moveToBoardTitle: string;
  boardName: string;
  enterBoardName: string;
  create: string;
  loadWorkflow: string;
  recallMetadata: string;
  sendToUpscale: string;
  useForPromptTemplate: string;
  newCanvasFromImage: string;
  changeBoardAction: string;
  starImage: string;
  locateInGallery: string;
  metadataOverview: string;
  copyPrompt: string;
  setAsCanvasImage: string;
  viewDetails: string;
  quickActions: string;
  openInNewCanvas: string;
  asMaskLayer: string;
  currentBoard: string;
  favoriteAdded: string;
  favoriteRemoved: string;
  
  // Prompt Hints
  promptQualityTips: string;
  subject: string;
  subjectHint: string;
  subjectExample: string;
  scene: string;
  sceneHint: string;
  sceneExample: string;
  action: string;
  actionHint: string;
  actionExample: string;
  style: string;
  styleHint: string;
  styleExample: string;
  camera: string;
  cameraHint: string;
  cameraExample: string;
  bestPractice: string;
  bestPracticeHint: string;
  
  // Template Modal
  createPromptTemplate: string;
  editPromptTemplate: string;
  name: string;
  description: string;
  descriptionOptional: string;
  briefDescription: string;
  positivePrompt: string;
  negativePrompt: string;
  insertPlaceholder: string;
  templateExplanation: string;
  templateOmitPlaceholder: string;
  usePlaceholder: string;
  templateCategories: string;
  allCategories: string;
  uncategorized: string;
  manageCategories: string;
  addCategory: string;
  categoryNameLabel: string;
  categoryEmojiLabel: string;
  templateEmojiLabel: string;
  templateCategoryLabel: string;
  templateImageLabel: string;
  templateImageUrlPlaceholder: string;
  templateImageUpload: string;
  templateImageClear: string;
  deleteCategory: string;
  noPromptTemplatesAvailable: string;
  noMatchingTemplates: string;
  createTemplateFirstMessage: string;
  
  // Error messages
  prohibitedContent: string;
  prohibitedContentMessage: string;
  placeholderWarning: string;
  placeholderWarningMessage: string;
  
  // Prompt History Modal
  promptHistory: string;
  prompts: string;
  searchPrompts: string;
  clearHistory: string;
  promptNumber: string;
  noPromptHistoryRecorded: string;
  promptsWillAppearHere: string;
  noPromptsFound: string;
  tryDifferentSearch: string;
  clickToUsePrompt: string;
  copyToClipboard: string;
  deletePrompt: string;
  clickPromptToReuse: string;
  escToClose: string;
  switchBetweenPrompts: string;
  
  // Additional UI strings
  viewTemplatePrompt: string;
  hideTemplatePromptButton: string;
  flattenTemplateButton: string;
  clearTemplateButton: string;
  addNegativePrompt: string;
  hideNegativePrompt: string;
  negativePromptLabel: string;
  enterNegativePrompt: string;
  uploadReferenceImages: string;
  referenceLibrary: string;
  uploadImageToGuideStyle: string;
  uploadImageOptionalEdit: string;
  uploadImageToSeeHistory: string;
  previousUploads: string;
  clickToAdd: string;
  clickToAddToReferences: string;
  shuffle: string;
  iterations: string;
  numberOfImages: string;
  generateMultipleImages: string;
  width: string;
  height: string;
  aspectRatioLabel: string;
  square: string;
  ultrawide: string;
  widescreen: string;
  classicPhoto: string;
  standard: string;
  portrait: string;
  classicPortrait: string;
  vertical: string;
  tall: string;
  referenceImagesTitle: string;
  referenceModel: string;
  currentReferences: string;
  uploadNewImage: string;
  clickToUploadImage: string;
  recentWork: string;
  allImagesAdded: string;
  noUploadHistoryYet: string;
  genLabel: string;
  unlimitedUploads: string;
  addAsReference: string;
  premiumFeatureTitle: string;
  premiumFeatureDescription: string;
  upgradeToUnlock: string;
  
  // Authentication
  loginTitle: string;
  loginSubtitle: string;
  loginButton: string;
  signingIn: string;
  emailAddress: string;
  password: string;
  enterPassword: string;
  rememberMe: string;
  dontHaveAccount: string;
  signUp: string;
  defaultCredentials: string;
  registrationTitle: string;
  registrationSubtitle: string;
  username: string;
  fullName: string;
  fullNamePlaceholder: string;
  confirmPassword: string;
  createPassword: string;
  confirmPasswordPlaceholder: string;
  createAccount: string;
  creatingAccount: string;
  backToLogin: string;
  passwordsDoNotMatch: string;
  passwordTooShort: string;
  unableToSignIn: string;
  unableToRegister: string;
  accountCreatedTitle: string;
  accountCreatedSubtitle: string;
}

const translations: Record<Language, Translations> = {
  en: enLocale as Translations,
  zh: zhLocale as Translations,
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};
