export type Language = 'en' | 'zh';

export interface Translations {
  // Header
  appName: string;
  appSubtitle: string;
  versionBadge: string;
  pageTitle: string;
  // Header links
  menuTutorials: string;
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
  
  // Generate button
  invoke: string;
  applyEdit: string;
  validating: string;
  stopGeneration: string;
  generating: string;
  pressCtrlEnter: string;
  
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
  boardName: string;
  enterBoardName: string;
  create: string;
  
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
  
  // Error messages
  prohibitedContent: string;
  prohibitedContentMessage: string;
  placeholderWarning: string;
  placeholderWarningMessage: string;
  
  // Prompt History Modal
  promptHistory: string;
  prompts: string;
  searchPrompts: string;
  noPromptHistoryRecorded: string;
  promptsWillAppearHere: string;
  noPromptsFound: string;
  tryDifferentSearch: string;
  clickToUsePrompt: string;
  copyToClipboard: string;
  deletePrompt: string;
  clickPromptToReuse: string;
  escToClose: string;
  
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
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appName: 'AI POD Lite',
    appSubtitle: 'Free Edition',
    versionBadge: 'V2.0 Free Version',
    pageTitle: 'AI POD Lite - AI Image Generator & Editor',
  menuTutorials: 'Tutorials',
  menuCommunity: 'Community',
  menuAssets: 'My Assets',
  menuWallet: 'Withdraw & Deposit',
    
    // Settings
    settings: 'Settings',
    apiKey: 'API Key',
    geminiApiKey: 'Gemini API Key',
    enterApiKey: 'Enter your Gemini API key',
    getApiKey: 'Google AI Studio',
    testApiKey: 'Test API Key',
    testing: 'Testing...',
    save: 'Save',
    saved: 'Saved!',
    clear: 'Clear',
    language: 'Language',
    selectLanguage: 'Select Language',
    savePath: 'Save Path',
    savePathDescription: 'Images will be automatically saved to this folder',
    chooseFolder: 'Choose Folder',
    openFolder: 'Open Folder',
    defaultSavePath: 'Default: ~/Documents/AI POD Lite',
    desktopAppOnly: 'Desktop App Only',
    
    // Validation messages
    apiKeyValid: 'API key is working correctly!',
    apiKeyInvalid: 'Invalid API key',
    apiKeySaved: 'API key saved and validated!',
    validatingApiKey: 'Validating API key...',
    enterApiKeyToTest: 'Please enter an API key to test',
    
    // Mode selector
  selectMode: 'Creative Mode',
    chooseHowToCreate: 'Choose how you want to create',
    generate: 'Generate',
    edit: 'Edit',
  select: 'Creative',
    createFromText: 'Create from text',
    modifyExisting: 'Modify existing',
    clickToSelect: 'Click to select',
    
    // File upload
    addReferenceImages: 'Add Reference Images',
    styleReferences: 'Style References',
    uploadImageToEdit: 'Upload Image to Edit',
    uploadImageWithMasks: 'Upload an image to edit with masks',
    addImagesToGuide: 'Add images to guide the generation (optional, max 2)',
    addStyleReferences: 'Add style references (optional, max 2)',
    uploadToStartEditing: 'Upload an image to start editing (max 2)',
    chooseFile: 'Choose File',
    replaceImage: 'Replace Image',
    uploadImage: 'Upload Image',
    uploadImageForMaskPainting: 'Upload an image to edit with mask painting',
    uploadImageForEditUpTo2: 'Upload image to edit, up to 2 images',
    optionalStyleReferencesUpTo2: 'Optional style references, up to 2 images',
    uploadReferenceImagesUpTo2: 'Upload up to 2 reference images to guide the style and composition',
    upload: 'Upload',
    removeImage: 'Remove image',
    
    // Prompt
    generateFromText: 'Generate from Text',
    editInstructions: 'Edit Instructions',
    enterPromptAndInvoke: 'Enter a prompt and Invoke.',
    describeChanges: 'Describe the changes you want to make.',
    promptPlaceholderGenerate: 'A serene mountain landscape at sunset with a lake reflecting the golden sky, photorealistic, detailed...',
    promptPlaceholderEdit: 'Make the sky more dramatic, add storm clouds, enhance lighting...',
    needsMoreDetail: 'Needs more detail',
    goodPrompt: 'Good prompt',
    excellentPrompt: 'Excellent prompt',
    characters: 'characters',
    
    // Mode help text
    generateModeTitle: 'Generate Mode',
    generateModeDescription: 'Creates a completely new image from your text description. Not related to any image on the artboard.',
    generateModeTip: '💡 Tip: Use the Seed in Advanced Controls to preserve series work and create consistent variations.',
    editModeTitle: 'Edit Mode',
    editModeDescription: 'Modifies the entire image on the artboard. Describe the changes you want to make to the whole image.',
  selectModeTitle: 'Creative Mode',
    selectModeDescription: 'Edits only the areas you brush on the artboard. Paint with your brush to select regions, then describe the changes.',
    selectModeWarning: '⚠️ Only brushed areas will be affected. Unmasked areas remain unchanged.',
    
    // Generate button
    invoke: 'Invoke',
    applyEdit: 'Apply Edit',
    validating: 'Validating...',
    stopGeneration: 'Stop Generation',
    generating: 'Generating...',
    pressCtrlEnter: 'to generate',
    
    // Advanced controls
    showAdvancedControls: 'Show Advanced Controls',
    hideAdvancedControls: 'Hide Advanced Controls',
    clearSession: 'Clear Session',
    aspectRatio: 'Aspect Ratio',
    creativity: 'Creativity',
    seed: 'Seed',
    random: 'Random',
    areYouSure: 'Are you sure?',
    clearSessionConfirm: 'Are you sure you want to clear this session? This will remove all uploads, prompts, and canvas content.',
    yesClear: 'Yes, Clear',
    cancel: 'Cancel',
    
    // Keyboard shortcuts
    shortcuts: 'Shortcuts',
    saveImage: 'Save Image',
    reRoll: 'Re-roll',
    editMode: 'Edit mode',
    history: 'History',
    togglePanel: 'Toggle Panel',
    
    // Save success modal
    imageSavedSuccessfully: 'Image Saved Successfully!',
    imageSavedToGallery: 'Your image has been saved to',
    savedToPath: 'Saved to',
    downloadImage: 'Download Image',
    browserStorageNote: 'Saved to browser storage. Download to save permanently.',
    ok: 'OK',
    
    // History panel
    yourCreations: 'Your Creations',
    items: 'items',
    gallery: 'Gallery',
    total: 'total',
    noCreationsYet: 'No creations yet',
    generatedImagesWillAppear: 'Your generated images will appear here',
    currentImage: 'Current Image',
    dimensions: 'Dimensions',
    mode: 'Mode',
    generationDetails: 'Generation Details',
    prompt: 'Prompt',
    model: 'Model',
    editInstruction: 'Edit Instruction',
    type: 'Type',
    created: 'Created',
    mask: 'Mask',
    applied: 'Applied',
    originalImage: 'Original Image',
    maskedReference: 'Masked Reference Image',
    
    // Canvas
    createWithAI: 'Create with AI',
    enterPromptToGenerate: 'Enter your prompt to generate stunning images powered by Gemini AI',
    uploadImageToStartEditing: 'Upload an image to start editing with AI assistance',
    readyToCreate: 'Ready to create',
    creatingYourImage: 'Creating your image...',
  addCanvasImageToReferences: 'Add canvas image to references',
  saveCanvasImage: 'Save image',
    
    // Toolbar
    brush: 'Brush',
    masks: 'Masks',
    
    // Info modal
    about: 'About',
  referencesUsed: 'References used',
  generationStep: 'Iteration',
  generatingProgress: 'Generating {current}/{total}',
    tipsHelp: 'Tips & Help',
    version: 'Version 2.0.0',
    
    // Info modal content
    appDescription: 'Professional AI-powered image generation and editing for desktop',
    aiGeneration: 'AI Generation',
    aiGenerationDesc: 'Create stunning images from text descriptions',
    smartEditing: 'Smart Editing',
    smartEditingDesc: 'Intelligent image modifications with AI',
    desktopOptimized: 'Desktop Optimized',
    desktopOptimizedDesc: 'Designed for professional workflows',
    infiniteVariations: 'Infinite Variations',
    infiniteVariationsDesc: 'Generate unlimited creative possibilities',
    professionalQuality: 'Professional Quality',
    professionalQualityDesc: 'High-resolution output for any project',
    advancedControls: 'Advanced Controls',
    advancedControlsDesc: 'Fine-tune every aspect of generation',
    
    // Prompt Composer
    promptTips: 'Prompt tips',
    hidePromptPanel: 'Hide Prompt Panel',
    showPromptPanel: 'Show Prompt Panel',
    templates: 'Templates',
    clickToManageTemplates: 'Click to manage templates',
    clickToCollapse: 'Click to collapse',
    improvePrompt: 'Improve Prompt',
    improving: 'Improving...',
    activeTemplate: 'Active Template',
    positive: 'Positive',
    negative: 'Negative',
    enterCustomPrompt: 'Enter your custom prompt (will be combined with the template above)',
    improvedPromptTitle: 'Improved Prompt',
    originalPrompt: 'Original Prompt',
    improvedVersion: 'Improved Version',
    acceptAndUse: 'Accept & Use This',
    keepOriginal: 'Keep Original',
    canEditImproved: '✏️ You can edit this improved version before accepting',
    
    // Templates actions
    hidePreview: 'Hide Previews',
    showPreview: 'Show Previews',
    createTemplate: 'Create Template',
    importTemplates: 'Import Templates',
    exportTemplates: 'Export Templates',
    hideTemplatePrompt: 'Hide template prompt',
    showTemplatePrompt: 'Show template prompt',
    flattenTemplate: 'Flatten selected template into current prompt',
    clearTemplateSelection: 'Clear template selection',
    duplicateTemplate: 'Duplicate template',
    editTemplate: 'Edit template',
    deleteTemplate: 'Delete template',
    
    // History Panel tabs
    boards: 'Gallery',
    myCreations: 'My Creations',
    images: 'Images',
    assets: 'Assets',
    noImagesYet: 'No generated images yet',
    createImagesMessage: 'Create some images to see them here.',
    
    // Boards
    createBoard: 'Create Board',
    renameBoard: 'Rename Board',
  downloadBoard: 'Download Board',
    deleteBoard: 'Delete Board',
    cannotDeleteDefault: 'Cannot delete the default board',
    confirmDelete: 'Are you sure you want to delete this board?',
    uploadImages: 'Upload Images',
    removeFromBoard: 'Remove from board',
    moveToBoard: 'Move to board',
    boardName: 'Board Name',
    enterBoardName: 'Enter board name...',
    create: 'Create',
    
    // Prompt Hints
    promptQualityTips: 'Prompt Quality Tips',
    subject: 'subject',
    subjectHint: 'Be specific about the main subject',
    subjectExample: '"A vintage red bicycle" vs "bicycle"',
    scene: 'scene',
    sceneHint: 'Describe the environment and setting',
    sceneExample: '"in a cobblestone alley during golden hour"',
    action: 'action',
    actionHint: 'Include movement or activity',
    actionExample: '"cyclist pedaling through puddles"',
    style: 'style',
    styleHint: 'Specify artistic style or mood',
    styleExample: '"cinematic photography, moody lighting"',
    camera: 'camera',
    cameraHint: 'Add camera perspective details',
    cameraExample: '"shot with 85mm lens, shallow depth of field"',
    bestPractice: 'Best practice:',
    bestPracticeHint: 'Write full sentences that describe the complete scene, not just keywords. Think "paint me a picture with words."',
    
    // Template Modal
    createPromptTemplate: 'Create Prompt Template',
    editPromptTemplate: 'Edit Prompt Template',
    name: 'Name',
    description: 'Description',
    descriptionOptional: 'Description (Optional)',
    briefDescription: 'Brief description of this template',
    positivePrompt: 'Positive Prompt',
    negativePrompt: 'Negative Prompt',
    insertPlaceholder: 'Insert placeholder',
    templateExplanation: 'Prompt templates add text to the prompts you write in the prompt box.',
    templateOmitPlaceholder: 'If you omit the placeholder, the template will be appended to the end of your prompt.',
    usePlaceholder: 'Use the placeholder string {prompt} to specify where your prompt should be included in the template.',
    
    // Error messages
    prohibitedContent: 'Content Prohibited',
    prohibitedContentMessage: 'Your prompt contains content that violates safety guidelines. Please modify your prompt and try again.',
    placeholderWarning: 'Placeholder Detected',
    placeholderWarningMessage: 'Your prompt contains placeholders like {prompt} or {photo}. Please replace them with your actual content before invoking.',
    
    // Prompt History Modal
    promptHistory: 'Prompt History',
    prompts: 'prompts',
    searchPrompts: 'Search prompts...',
    noPromptHistoryRecorded: 'No prompt history recorded',
    promptsWillAppearHere: 'Your prompts will appear here after you generate images',
    noPromptsFound: 'No prompts found',
    tryDifferentSearch: 'Try a different search term',
    clickToUsePrompt: 'Click to use in prompt field',
    copyToClipboard: 'Copy to clipboard',
    deletePrompt: 'Delete prompt',
    clickPromptToReuse: 'Click a prompt to reuse it',
    escToClose: 'to close',
    
    // Additional UI strings
    viewTemplatePrompt: 'View template prompt',
    hideTemplatePromptButton: 'Hide template prompt',
    flattenTemplateButton: 'Flatten selected template into current prompt',
    clearTemplateButton: 'Clear template selection',
    addNegativePrompt: 'Add Negative Prompt',
    hideNegativePrompt: 'Hide Negative Prompt',
    negativePromptLabel: 'Negative Prompt',
    enterNegativePrompt: 'Enter negative prompt (things to avoid)...',
    uploadReferenceImages: 'Upload reference images to guide generation style',
    referenceLibrary: 'Reference Library',
    uploadImageToGuideStyle: 'Upload reference images to guide generation style',
    uploadImageOptionalEdit: 'Optional: Add style reference images to guide the edit',
    uploadImageToSeeHistory: 'Upload images to see them here',
    previousUploads: 'Previous Uploads',
    clickToAdd: 'Click to add',
    clickToAddToReferences: 'Click to add to references',
    shuffle: 'Shuffle',
    iterations: 'Iterations',
    numberOfImages: '(Number of images)',
    generateMultipleImages: 'Generate multiple images at once (1-10)',
    width: 'Width',
    height: 'Height',
    aspectRatioLabel: 'Aspect Ratio',
    square: 'Square',
    ultrawide: 'Ultrawide',
    widescreen: 'Widescreen',
    classicPhoto: 'Classic Photo',
    standard: 'Standard',
    portrait: 'Portrait',
    classicPortrait: 'Classic Portrait',
    vertical: 'Vertical',
    tall: 'Tall',
    referenceImagesTitle: 'Reference Images',
    referenceModel: 'Model: {model}',
    currentReferences: 'Current References',
    uploadNewImage: 'Upload New Image',
    clickToUploadImage: 'Click to upload image',
    recentWork: 'Recent Work',
    allImagesAdded: 'All images from history are already added to references',
    noUploadHistoryYet: 'No upload history yet',
    genLabel: 'Gen',
    unlimitedUploads: 'Click on any image to add to references • Unlimited uploads',
  },
  zh: {
    // Header
    appName: 'AI POD Lite',
    appSubtitle: '专业版',
    versionBadge: 'V2.0 免费版',
  pageTitle: 'AI POD Lite - AI图像生成器和编辑器',
  menuTutorials: '使用教程',
  menuCommunity: '用户社群',
  menuAssets: '我的资产',
  menuWallet: '提现与充值',
    
    // Settings
    settings: '设置',
    apiKey: 'API密钥',
    geminiApiKey: 'Gemini API密钥',
    enterApiKey: '输入您的Gemini API密钥',
    getApiKey: 'Google AI Studio',
    testApiKey: '测试API密钥',
    testing: '测试中...',
    save: '保存',
    saved: '已保存！',
    clear: '清除',
    language: '语言',
    selectLanguage: '选择语言',
    savePath: '保存路径',
    savePathDescription: '图片将自动保存到此文件夹',
    chooseFolder: '选择文件夹',
    openFolder: '打开文件夹',
    defaultSavePath: '默认：~/Documents/AI POD Lite',
    desktopAppOnly: '仅限桌面应用',
    
    // Validation messages
    apiKeyValid: 'API密钥工作正常！',
    apiKeyInvalid: 'API密钥无效',
    apiKeySaved: 'API密钥已保存并验证！',
    validatingApiKey: '正在验证API密钥...',
    enterApiKeyToTest: '请输入API密钥进行测试',
    
    // Mode selector
  selectMode: '创作模式',
    chooseHowToCreate: '选择您想要的创作方式',
    generate: '生成',
    edit: '编辑',
    select: '创作',
    createFromText: '从文本创建',
    modifyExisting: '修改现有',
    clickToSelect: '点击选择',
    
    // File upload
    addReferenceImages: '添加参考图片',
    styleReferences: '风格参考',
    uploadImageToEdit: '上传要编辑的图片',
    uploadImageWithMasks: '上传图片以使用蒙版编辑',
    addImagesToGuide: '添加图片来引导生成（可选，最多2张）',
    addStyleReferences: '添加风格参考（可选，最多2张）',
    uploadToStartEditing: '上传图片开始编辑（最多2张）',
    chooseFile: '选择文件',
    replaceImage: '替换图片',
    uploadImage: '上传图片',
    uploadImageForMaskPainting: '上传图片以使用蒙版绘画编辑',
    uploadImageForEditUpTo2: '上传要编辑的图片，最多2张',
    optionalStyleReferencesUpTo2: '可选风格参考，最多2张',
    uploadReferenceImagesUpTo2: '上传最多2张参考图片来引导风格和构图',
    upload: '上传',
    removeImage: '删除图片',
    
    // Prompt
    generateFromText: '从文本生成',
    editInstructions: '编辑说明',
    enterPromptAndInvoke: '输入提示词并调用。',
    describeChanges: '描述您想要做的更改。',
    promptPlaceholderGenerate: '宁静的山景日落，湖面倒映着金色的天空，逼真，详细...',
    promptPlaceholderEdit: '让天空更有戏剧性，添加风暴云，增强光照...',
    needsMoreDetail: '需要更多细节',
    goodPrompt: '不错的提示',
    excellentPrompt: '优秀的提示',
    characters: '个字符',
    
    // Mode help text
    generateModeTitle: '生成模式',
    generateModeDescription: '根据您的文字描述创建全新的图像。与画板上的任何图像无关。',
    generateModeTip: '💡 提示：使用高级控制中的种子来保留系列作品并创建一致的变体。',
    editModeTitle: '编辑模式',
    editModeDescription: '修改画板上的整个图像。描述您想对整个图像做的更改。',
    selectModeTitle: '创作模式',
    selectModeDescription: '仅编辑您在画板上刷涂的区域。用画笔绘制选择区域，然后描述更改。',
    selectModeWarning: '⚠️ 只有刷涂的区域会受到影响。未遮罩区域保持不变。',
    
    // Generate button
    invoke: '调用',
    applyEdit: '应用编辑',
    validating: '验证中...',
    stopGeneration: '停止生成',
    generating: '生成中...',
    pressCtrlEnter: '生成',
    
    // Advanced controls
    showAdvancedControls: '显示高级控制',
    hideAdvancedControls: '隐藏高级控制',
    clearSession: '清除会话',
    aspectRatio: '宽高比',
    creativity: '创造力',
    seed: '种子',
    random: '随机',
    areYouSure: '您确定吗？',
    clearSessionConfirm: '您确定要清除此会话吗？这将删除所有上传、提示和画布内容。',
    yesClear: '是的，清除',
    cancel: '取消',
    
    // Keyboard shortcuts
    shortcuts: '快捷键',
    saveImage: '保存图片',
    reRoll: '重新生成',
    editMode: '编辑模式',
    history: '历史记录',
    togglePanel: '切换面板',
    
    // Save success modal
    imageSavedSuccessfully: '图片保存成功！',
    imageSavedToGallery: '您的图片已保存到',
    savedToPath: '保存到',
    downloadImage: '下载图片',
    browserStorageNote: '已保存到浏览器存储。下载以永久保存。',
    ok: '确定',
    
    // History panel
    yourCreations: '您的创作',
    items: '项',
    gallery: '图库',
    total: '总计',
    noCreationsYet: '还没有创作',
    generatedImagesWillAppear: '您生成的图片将显示在这里',
    currentImage: '当前图片',
    dimensions: '尺寸',
    mode: '模式',
    generationDetails: '生成详情',
    prompt: '提示词',
    model: '模型',
    editInstruction: '编辑说明',
    type: '类型',
    created: '创建时间',
    mask: '蒙版',
    applied: '已应用',
    originalImage: '原始图片',
    maskedReference: '蒙版参考图片',
  referencesUsed: '参考图数量',
  generationStep: '迭代',
  generatingProgress: '正在生成 {current}/{total}',
    
    // Canvas
    createWithAI: '使用AI创作',
    enterPromptToGenerate: '输入您的提示词，使用Gemini AI生成精美图片',
    uploadImageToStartEditing: '上传图片以开始AI辅助编辑',
    readyToCreate: '准备创作',
    creatingYourImage: '正在创建您的图片...',
  addCanvasImageToReferences: '将画布图像添加到参考',
  saveCanvasImage: '保存图像',
    
    // Toolbar
    brush: '画笔',
    masks: '蒙版',
    
    // Info modal
    about: '关于',
    tipsHelp: '提示与帮助',
    version: '版本 2.0.0',
    
    // Info modal content
    appDescription: '专业的AI驱动图像生成和编辑桌面应用',
    aiGeneration: 'AI生成',
    aiGenerationDesc: '从文字描述创造精美图像',
    smartEditing: '智能编辑',
    smartEditingDesc: '使用AI进行智能图像修改',
    desktopOptimized: '桌面优化',
    desktopOptimizedDesc: '专为专业工作流程设计',
    infiniteVariations: '无限变化',
    infiniteVariationsDesc: '生成无限创意可能性',
    professionalQuality: '专业品质',
    professionalQualityDesc: '适用于任何项目的高分辨率输出',
    advancedControls: '高级控制',
    advancedControlsDesc: '微调生成的每个方面',
    
    // Prompt Composer
    promptTips: '提示技巧',
    hidePromptPanel: '隐藏提示面板',
    showPromptPanel: '显示提示面板',
    templates: '模板',
    clickToManageTemplates: '点击管理模板',
    clickToCollapse: '点击折叠',
    improvePrompt: '改进提示词',
    improving: '改进中...',
    activeTemplate: '活动模板',
    positive: '正向',
    negative: '负向',
    enterCustomPrompt: '输入您的自定义提示词（将与上面的模板组合）',
    improvedPromptTitle: '改进的提示词',
    originalPrompt: '原始提示词',
    improvedVersion: '改进版本',
    acceptAndUse: '接受并使用',
    keepOriginal: '保持原样',
    canEditImproved: '✏️ 您可以在接受前编辑此改进版本',
    
    // Templates actions
    hidePreview: '隐藏预览',
    showPreview: '显示预览',
    createTemplate: '创建模板',
    importTemplates: '导入模板',
    exportTemplates: '导出模板',
    hideTemplatePrompt: '隐藏模板提示词',
    showTemplatePrompt: '显示模板提示词',
    flattenTemplate: '将选定的模板合并到当前提示词',
    clearTemplateSelection: '清除模板选择',
    duplicateTemplate: '复制模板',
    editTemplate: '编辑模板',
    deleteTemplate: '删除模板',
    
    // History Panel tabs
    boards: '图库',
    myCreations: '我的创作',
    images: '图片',
    assets: '素材',
    noImagesYet: '还没有生成图片',
    createImagesMessage: '创建一些图片以在此处查看。',
    
    // Boards
    createBoard: '创建画板',
    renameBoard: '重命名画板',
  downloadBoard: '下载画板',
    deleteBoard: '删除画板',
    cannotDeleteDefault: '无法删除默认画板',
    confirmDelete: '您确定要删除此画板吗？',
    uploadImages: '上传图片',
    removeFromBoard: '从画板中移除',
    moveToBoard: '移动到画板',
    boardName: '画板名称',
    enterBoardName: '输入画板名称...',
    create: '创建',
    
    // Prompt Hints
    promptQualityTips: '提示词质量技巧',
    subject: '主题',
    subjectHint: '对主要主题进行具体描述',
    subjectExample: '"一辆复古红色自行车" vs "自行车"',
    scene: '场景',
    sceneHint: '描述环境和设置',
    sceneExample: '"在鹅卵石小巷中，黄金时段"',
    action: '动作',
    actionHint: '包含运动或活动',
    actionExample: '"骑车人踩踏水坑"',
    style: '风格',
    styleHint: '指定艺术风格或情绪',
    styleExample: '"电影摄影，忧郁灯光"',
    camera: '相机',
    cameraHint: '添加相机视角细节',
    cameraExample: '"使用85mm镜头拍摄，浅景深"',
    bestPractice: '最佳实践：',
    bestPracticeHint: '写完整的句子来描述完整场景，而不仅仅是关键词。把它想象成"用文字画一幅画"。',
    
    // Template Modal
    createPromptTemplate: '创建提示词模板',
    editPromptTemplate: '编辑提示词模板',
    name: '名称',
    description: '描述',
    descriptionOptional: '描述（可选）',
    briefDescription: '此模板的简要描述',
    positivePrompt: '正面提示词',
    negativePrompt: '负面提示词',
    insertPlaceholder: '插入占位符',
    templateExplanation: '提示词模板会将文本添加到您在提示框中编写的提示词中。',
    templateOmitPlaceholder: '如果省略占位符，模板将附加到提示词的末尾。',
    usePlaceholder: '使用占位符字符串 {prompt} 来指定您的提示词应包含在模板中的位置。',
    
    // Error messages
    prohibitedContent: '内容被禁止',
    prohibitedContentMessage: '您的提示词包含违反安全准则的内容。请修改您的提示词后重试。',
    placeholderWarning: '检测到占位符',
    placeholderWarningMessage: '您的提示词包含占位符（如 {prompt} 或 {photo}）。请在调用前将其替换为实际内容。',
    
    // Prompt History Modal
    promptHistory: '提示词历史',
    prompts: '条提示词',
    searchPrompts: '搜索提示词...',
    noPromptHistoryRecorded: '暂无提示词历史',
    promptsWillAppearHere: '生成图像后，您的提示词将显示在这里',
    noPromptsFound: '未找到提示词',
    tryDifferentSearch: '尝试不同的搜索词',
    clickToUsePrompt: '点击以在提示词字段中使用',
    copyToClipboard: '复制到剪贴板',
    deletePrompt: '删除提示词',
    clickPromptToReuse: '点击提示词以重复使用',
    escToClose: '关闭',
    
    // Additional UI strings
    viewTemplatePrompt: '查看模板提示词',
    hideTemplatePromptButton: '隐藏模板提示词',
    flattenTemplateButton: '将选定的模板合并到当前提示词',
    clearTemplateButton: '清除模板选择',
    addNegativePrompt: '添加负面提示词',
    hideNegativePrompt: '隐藏负面提示词',
    negativePromptLabel: '负面提示词',
    enterNegativePrompt: '输入负面提示词（要避免的事物）...',
    uploadReferenceImages: '上传参考图片来引导生成风格',
    referenceLibrary: '参考库',
    uploadImageToGuideStyle: '上传参考图片来引导生成风格',
    uploadImageOptionalEdit: '可选：添加风格参考图片来引导编辑',
    uploadImageToSeeHistory: '上传图片以在此处查看',
    previousUploads: '之前的上传',
    clickToAdd: '点击添加',
    clickToAddToReferences: '点击添加到参考',
    shuffle: '随机',
    iterations: '迭代次数',
    numberOfImages: '（图片数量）',
    generateMultipleImages: '一次生成多张图片（1-10）',
    width: '宽度',
    height: '高度',
    aspectRatioLabel: '宽高比',
    square: '正方形',
    ultrawide: '超宽',
    widescreen: '宽屏',
    classicPhoto: '经典照片',
    standard: '标准',
    portrait: '肖像',
    classicPortrait: '经典肖像',
    vertical: '竖直',
    tall: '高',
    referenceImagesTitle: '参考图像',
    referenceModel: '模型：{model}',
    currentReferences: '当前参考图',
    uploadNewImage: '上传新图片',
    clickToUploadImage: '点击上传图片',
    recentWork: '最近作品',
    allImagesAdded: '历史记录中的图片已全部添加到参考',
    noUploadHistoryYet: '暂无上传历史',
    genLabel: '生成',
  unlimitedUploads: '点击任意图片添加到参考 • 上传数量不限',
  },
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};
