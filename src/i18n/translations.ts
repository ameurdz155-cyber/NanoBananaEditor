export type Language = 'en' | 'zh';

export interface Translations {
  // Header
  appName: string;
  appSubtitle: string;
  versionBadge: string;
  
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
  
  // Generate button
  invoke: string;
  applyEdit: string;
  validating: string;
  generating: string;
  pressCtrlEnter: string;
  
  // Advanced controls
  showAdvancedControls: string;
  hideAdvancedControls: string;
  clearSession: string;
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
  
  // Canvas
  createWithAI: string;
  enterPromptToGenerate: string;
  uploadImageToStartEditing: string;
  readyToCreate: string;
  creatingYourImage: string;
  
  // Toolbar
  brush: string;
  masks: string;
  
  // Info modal
  about: string;
  tipsHelp: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appName: 'AI POD Lite',
    appSubtitle: 'Lite Edition',
    versionBadge: 'v1.0 LITE',
    
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
    
    // Validation messages
    apiKeyValid: 'API key is working correctly!',
    apiKeyInvalid: 'Invalid API key',
    apiKeySaved: 'API key saved and validated!',
    validatingApiKey: 'Validating API key...',
    enterApiKeyToTest: 'Please enter an API key to test',
    
    // Mode selector
    selectMode: 'Select Mode',
    chooseHowToCreate: 'Choose how you want to create',
    generate: 'Generate',
    edit: 'Edit',
    select: 'Select',
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
    
    // Generate button
    invoke: 'Invoke',
    applyEdit: 'Apply Edit',
    validating: 'Validating...',
    generating: 'Generating...',
    pressCtrlEnter: 'to generate',
    
    // Advanced controls
    showAdvancedControls: 'Show Advanced Controls',
    hideAdvancedControls: 'Hide Advanced Controls',
    clearSession: 'Clear Session',
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
    
    // Toolbar
    brush: 'Brush',
    masks: 'Masks',
    
    // Info modal
    about: 'About',
    tipsHelp: 'Tips & Help',
  },
  zh: {
    // Header
    appName: 'AI POD 精简版',
    appSubtitle: '精简版',
    versionBadge: 'v1.0 精简版',
    
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
    
    // Validation messages
    apiKeyValid: 'API密钥工作正常！',
    apiKeyInvalid: 'API密钥无效',
    apiKeySaved: 'API密钥已保存并验证！',
    validatingApiKey: '正在验证API密钥...',
    enterApiKeyToTest: '请输入API密钥进行测试',
    
    // Mode selector
    selectMode: '选择模式',
    chooseHowToCreate: '选择您想要的创作方式',
    generate: '生成',
    edit: '编辑',
    select: '选择',
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
    
    // Generate button
    invoke: '调用',
    applyEdit: '应用编辑',
    validating: '验证中...',
    generating: '生成中...',
    pressCtrlEnter: '生成',
    
    // Advanced controls
    showAdvancedControls: '显示高级控制',
    hideAdvancedControls: '隐藏高级控制',
    clearSession: '清除会话',
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
    
    // History panel
    yourCreations: '您的创作',
    items: '项',
    gallery: '画廊',
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
    
    // Canvas
    createWithAI: '使用AI创作',
    enterPromptToGenerate: '输入您的提示词，使用Gemini AI生成精美图片',
    uploadImageToStartEditing: '上传图片以开始AI辅助编辑',
    readyToCreate: '准备创作',
    creatingYourImage: '正在创建您的图片...',
    
    // Toolbar
    brush: '画笔',
    masks: '蒙版',
    
    // Info modal
    about: '关于',
    tipsHelp: '提示与帮助',
  },
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};
