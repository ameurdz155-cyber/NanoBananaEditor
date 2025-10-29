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
  stopGeneration: string;
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
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appName: 'AI POD',
    appSubtitle: 'Professional Edition',
    versionBadge: 'v1.0 PRO',
    
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
    stopGeneration: 'Stop Generation',
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
    
    // History Panel tabs
    boards: 'Boards',
    myCreations: 'My Creations',
    images: 'Images',
    assets: 'Assets',
    noImagesYet: 'No generated images yet',
    createImagesMessage: 'Create some images to see them here.',
    
    // Boards
    createBoard: 'Create Board',
    renameBoard: 'Rename Board',
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
  },
  zh: {
    // Header
    appName: 'AI POD',
    appSubtitle: '专业版',
    versionBadge: 'v1.0 专业版',
    
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
    stopGeneration: '停止生成',
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
    
    // History Panel tabs
    boards: '画板',
    myCreations: '我的创作',
    images: '图片',
    assets: '素材',
    noImagesYet: '还没有生成图片',
    createImagesMessage: '创建一些图片以在此处查看。',
    
    // Boards
    createBoard: '创建画板',
    renameBoard: '重命名画板',
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
  },
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};
