import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FolderTree, Plus, Edit2, Trash2, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import {
	FaFolder,
	FaFolderOpen,
	FaHome,
	FaUser,
	FaUsers,
	FaCamera,
	FaImage,
	FaPalette,
	FaBrush,
	FaPaintBrush,
	FaMusic,
	FaVideo,
	FaShoppingCart,
	FaShoppingBag,
	FaCreditCard,
	FaTag,
	FaGift,
	FaStore,
	FaBriefcase,
	FaBuilding,
	FaIndustry,
	FaLandmark,
	FaGraduationCap,
	FaBook,
	FaPen,
	FaPencilAlt,
	FaPhone,
	FaLaptop,
	FaDesktop,
	FaCoffee,
	FaUtensils,
	FaPizzaSlice,
	FaCar,
	FaTrain,
	FaPlane,
	FaGlobe,
	FaMap,
	FaMapPin,
	FaLightbulb,
	FaSun,
	FaMoon,
	FaCloudSun,
	FaTree,
	FaLeaf,
	FaSeedling,
	FaMountain,
	FaWater,
	FaUmbrella,
	FaTrophy,
	FaAward,
	FaLock,
	FaKey,
	FaUserShield,
	FaFingerprint,
	FaWrench,
	FaHammer,
	FaCogs,
	FaCircle,
	FaSquare
} from 'react-icons/fa';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

type ManagedCategory = {
	id: string;
	name: string;
	emoji: string;
	createdAt: number;
};

type FormMode = 'none' | 'create' | 'edit';

type IconSource = 'emoji' | 'icons' | 'upload';

type IconOption = {
	id: string;
	name: string;
	icon: React.ComponentType<{ className?: string; style?: CSSProperties }>;
};

const FONT_AWESOME_ICONS: IconOption[] = [
	{ id: 'folder', name: 'Folder', icon: FaFolder },
	{ id: 'folder-open', name: 'Folder Open', icon: FaFolderOpen },
	{ id: 'home', name: 'Home', icon: FaHome },
	{ id: 'user', name: 'User', icon: FaUser },
	{ id: 'users', name: 'Users', icon: FaUsers },
	{ id: 'camera', name: 'Camera', icon: FaCamera },
	{ id: 'image', name: 'Image', icon: FaImage },
	{ id: 'palette', name: 'Palette', icon: FaPalette },
	{ id: 'brush', name: 'Brush', icon: FaBrush },
	{ id: 'paint-brush', name: 'Paint Brush', icon: FaPaintBrush },
	{ id: 'music', name: 'Music', icon: FaMusic },
	{ id: 'video', name: 'Video', icon: FaVideo },
	{ id: 'shopping-cart', name: 'Shopping Cart', icon: FaShoppingCart },
	{ id: 'shopping-bag', name: 'Shopping Bag', icon: FaShoppingBag },
	{ id: 'credit-card', name: 'Credit Card', icon: FaCreditCard },
	{ id: 'tag', name: 'Tag', icon: FaTag },
	{ id: 'gift', name: 'Gift', icon: FaGift },
	{ id: 'store', name: 'Store', icon: FaStore },
	{ id: 'briefcase', name: 'Briefcase', icon: FaBriefcase },
	{ id: 'building', name: 'Building', icon: FaBuilding },
	{ id: 'industry', name: 'Industry', icon: FaIndustry },
	{ id: 'landmark', name: 'Landmark', icon: FaLandmark },
	{ id: 'graduation-cap', name: 'Graduation Cap', icon: FaGraduationCap },
	{ id: 'book', name: 'Book', icon: FaBook },
	{ id: 'pen', name: 'Pen', icon: FaPen },
	{ id: 'pencil-alt', name: 'Pencil Alt', icon: FaPencilAlt },
	{ id: 'phone', name: 'Phone', icon: FaPhone },
	{ id: 'laptop', name: 'Laptop', icon: FaLaptop },
	{ id: 'desktop', name: 'Desktop', icon: FaDesktop },
	{ id: 'coffee', name: 'Coffee', icon: FaCoffee },
	{ id: 'utensils', name: 'Utensils', icon: FaUtensils },
	{ id: 'pizza-slice', name: 'Pizza Slice', icon: FaPizzaSlice },
	{ id: 'car', name: 'Car', icon: FaCar },
	{ id: 'train', name: 'Train', icon: FaTrain },
	{ id: 'plane', name: 'Plane', icon: FaPlane },
	{ id: 'globe', name: 'Globe', icon: FaGlobe },
	{ id: 'map', name: 'Map', icon: FaMap },
	{ id: 'map-pin', name: 'Map Pin', icon: FaMapPin },
	{ id: 'lightbulb', name: 'Lightbulb', icon: FaLightbulb },
	{ id: 'sun', name: 'Sun', icon: FaSun },
	{ id: 'moon', name: 'Moon', icon: FaMoon },
	{ id: 'cloud-sun', name: 'Cloud Sun', icon: FaCloudSun },
	{ id: 'tree', name: 'Tree', icon: FaTree },
	{ id: 'leaf', name: 'Leaf', icon: FaLeaf },
	{ id: 'seedling', name: 'Seedling', icon: FaSeedling },
	{ id: 'mountain', name: 'Mountain', icon: FaMountain },
	{ id: 'water', name: 'Water', icon: FaWater },
	{ id: 'umbrella', name: 'Umbrella', icon: FaUmbrella },
	{ id: 'trophy', name: 'Trophy', icon: FaTrophy },
	{ id: 'award', name: 'Award', icon: FaAward },
	{ id: 'lock', name: 'Lock', icon: FaLock },
	{ id: 'key', name: 'Key', icon: FaKey },
	{ id: 'user-shield', name: 'User Shield', icon: FaUserShield },
	{ id: 'fingerprint', name: 'Fingerprint', icon: FaFingerprint },
	{ id: 'wrench', name: 'Wrench', icon: FaWrench },
	{ id: 'hammer', name: 'Hammer', icon: FaHammer },
	{ id: 'cogs', name: 'Cogs', icon: FaCogs },
	{ id: 'circle', name: 'Circle', icon: FaCircle },
	{ id: 'square', name: 'Square', icon: FaSquare }
];

const STORAGE_KEY = 'promptCategories';

const DEFAULT_CATEGORY_FACTORY = (language: string): ManagedCategory[] => [
	{ id: 'portrait', name: language === 'zh' ? '肖像' : 'Portrait', emoji: '🧑', createdAt: Date.now() },
	{ id: 'landscape', name: language === 'zh' ? '风景' : 'Landscape', emoji: '🏞️', createdAt: Date.now() },
	{ id: 'product', name: language === 'zh' ? '产品' : 'Product', emoji: '📦', createdAt: Date.now() },
	{ id: 'art-style', name: language === 'zh' ? '艺术风格' : 'Art Style', emoji: '🎨', createdAt: Date.now() },
	{ id: 'concept', name: language === 'zh' ? '概念设计' : 'Concept Design', emoji: '🌌', createdAt: Date.now() },
	{ id: 'photography', name: language === 'zh' ? '摄影' : 'Photography', emoji: '📷', createdAt: Date.now() },
	{ id: 'architecture', name: language === 'zh' ? '建筑设计' : 'Architecture', emoji: '🏛️', createdAt: Date.now() }
];

const normalizeIconValue = (value: string): string => {
	if (!value) {
		return value;
	}
	if (value.startsWith('fa-')) {
		return `fa:${value.slice(3)}`;
	}
	return value;
};

const resolveIconTab = (value: string): IconSource => {
	const normalized = normalizeIconValue(value);
	if (normalized.startsWith('fa:')) {
		return 'icons';
	}
	if (normalized.startsWith('data:image')) {
		return 'upload';
	}
	return 'emoji';
};

const findFontAwesomeIcon = (value: string) => {
	const iconId = value.replace(/^fa[:\-]/, '');
	return FONT_AWESOME_ICONS.find((option) => option.id === iconId);
};

const renderCategoryIcon = (value: string | undefined, className: string): React.ReactNode => {
	if (!value) {
		return <span className={className}>📁</span>;
	}
	const normalized = normalizeIconValue(value);
	if (normalized.startsWith('data:image')) {
		return <img src={normalized} alt="Category icon" className="w-8 h-8 rounded object-cover" />;
	}
	if (normalized.startsWith('fa:')) {
		const match = findFontAwesomeIcon(normalized);
		if (match) {
			const IconComponent = match.icon;
			return <IconComponent className={className} />;
		}
	}
	return <span className={className}>{normalized}</span>;
};

interface CategoryManagementModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const ICON_TABS: Array<{ id: IconSource; labelEn: string; labelZh: string }> = [
	{ id: 'emoji', labelEn: 'Emoji', labelZh: '表情' },
	{ id: 'icons', labelEn: 'Icons', labelZh: '图标' },
	{ id: 'upload', labelEn: 'Upload', labelZh: '上传' }
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ open, onOpenChange }) => {
	const language = useAppStore((state) => state.language);
	const t = getTranslation(language);

	const [categories, setCategories] = useState<ManagedCategory[]>([]);
	const [formMode, setFormMode] = useState<FormMode>('none');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formName, setFormName] = useState('');
	const [formEmoji, setFormEmoji] = useState('📁');
	const [iconTab, setIconTab] = useState<IconSource>('upload');
	const [iconSearch, setIconSearch] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [isDarkMode, setIsDarkMode] = useState(() => {
		if (typeof window === 'undefined') {
			return true;
		}
		const storedTheme = localStorage.getItem('app-theme');
		if (storedTheme) {
			return storedTheme !== 'light';
		}
		return document.documentElement.classList.contains('dark');
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const emojiPickerThemeStyles = useMemo<Record<string, string>>(() => {
		if (isDarkMode) {
			return {
				'--epr-bg-color': 'var(--surface-primary)',
				'--epr-panel-bg-color': 'var(--surface-secondary)',
				'--epr-text-color': 'var(--text-primary)',
				'--epr-category-label-color': 'var(--text-secondary)',
				'--epr-hover-bg-color': 'rgba(124, 58, 237, 0.16)',
				'--epr-border-color': 'var(--surface-border)',
				'--epr-search-border-color': 'var(--surface-border)',
				'--epr-search-placeholder-color': 'var(--text-tertiary)',
				'--epr-search-bg-color': 'rgba(40, 42, 60, 0.9)',
				'--epr-highlight-color': 'var(--accent-emerald)'
			};
		}
		return {
			'--epr-bg-color': 'rgba(255, 255, 255, 0.98)',
			'--epr-panel-bg-color': 'rgba(244, 246, 253, 0.96)',
			'--epr-text-color': 'var(--text-primary)',
			'--epr-category-label-color': 'var(--text-secondary)',
			'--epr-hover-bg-color': 'rgba(124, 58, 237, 0.08)',
			'--epr-border-color': 'var(--surface-border)',
			'--epr-search-border-color': 'var(--surface-border)',
			'--epr-search-placeholder-color': 'var(--text-tertiary)',
			'--epr-search-bg-color': 'rgba(255, 255, 255, 0.95)',
			'--epr-highlight-color': 'var(--accent-emerald)'
		};
	}, [isDarkMode]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}
		setIsDarkMode(document.documentElement.classList.contains('dark'));
	}, [open]);

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed: ManagedCategory[] = JSON.parse(stored);
				const normalized = parsed.map((category) => ({
					...category,
					emoji: normalizeIconValue(category.emoji || '') || '📁'
				}));
				setCategories(normalized);
				localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
				return;
			} catch (error) {
				console.error('Failed to parse stored categories', error);
			}
		}
		setCategories(DEFAULT_CATEGORY_FACTORY(language));
	}, [language, open]);

	useEffect(() => {
		const handleThemeChange = () => {
			if (typeof window === 'undefined') {
				return;
			}
			const storedTheme = localStorage.getItem('app-theme');
			if (storedTheme) {
				setIsDarkMode(storedTheme !== 'light');
				return;
			}
			setIsDarkMode(document.documentElement.classList.contains('dark'));
		};

		window.addEventListener('themeChange', handleThemeChange);
		window.addEventListener('storage', handleThemeChange);

		return () => {
			window.removeEventListener('themeChange', handleThemeChange);
			window.removeEventListener('storage', handleThemeChange);
		};
	}, []);

	useEffect(() => {
		const handlePaste = (event: ClipboardEvent) => {
			if (iconTab !== 'upload' || formMode === 'none') {
				return;
			}
			const items = event.clipboardData?.items;
			if (!items) {
				return;
			}
			for (let index = 0; index < items.length; index += 1) {
				const item = items[index];
				if (item.type.includes('image')) {
					const file = item.getAsFile();
					if (!file) {
						continue;
					}
					const reader = new FileReader();
					reader.onload = (loadEvent) => {
						const base64 = loadEvent.target?.result as string;
						setFormEmoji(base64);
					};
					reader.readAsDataURL(file);
					event.preventDefault();
					break;
				}
			}
		};

		if (formMode !== 'none' && iconTab === 'upload') {
			document.addEventListener('paste', handlePaste);
			return () => document.removeEventListener('paste', handlePaste);
		}
		return undefined;
	}, [formMode, iconTab]);

	const filteredCategories = useMemo(
		() =>
			categories.filter((category) =>
				category.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
			),
		[categories, searchQuery]
	);

	const filteredIcons = useMemo(
		() =>
			FONT_AWESOME_ICONS.filter((option) => {
				const query = iconSearch.trim().toLowerCase();
				if (!query) {
					return true;
				}
				return option.name.toLowerCase().includes(query) || option.id.includes(query);
			}),
		[iconSearch]
	);

	const saveCategories = (next: ManagedCategory[]) => {
		setCategories(next);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	};

	const resetForm = () => {
		setEditingId(null);
		setFormName('');
		setFormEmoji('📁');
		setIconTab('upload');
		setIconSearch('');
		setFormMode('none');
	};

	const handleOpenCreate = () => {
		setEditingId(null);
		setFormName('');
		setFormEmoji('📁');
		setIconTab('upload');
		setIconSearch('');
		setFormMode('create');
	};

	const handleOpenEdit = (category: ManagedCategory) => {
		setEditingId(category.id);
		setFormName(category.name);
		const normalizedEmoji = normalizeIconValue(category.emoji || '') || '📁';
		setFormEmoji(normalizedEmoji);
		setIconTab(resolveIconTab(normalizedEmoji));
		setIconSearch('');
		setFormMode('edit');
	};

	const handleSave = () => {
		if (!formName.trim()) {
			return;
		}
		const normalizedEmoji = normalizeIconValue(formEmoji || '') || '📁';
		if (formMode === 'edit' && editingId) {
			const updated = categories.map((category) =>
				category.id === editingId
					? { ...category, name: formName.trim(), emoji: normalizedEmoji }
					: category
			);
			saveCategories(updated);
			return;
		}
		const newCategory: ManagedCategory = {
			id: `category-${Date.now()}`,
			name: formName.trim(),
			emoji: normalizedEmoji,
			createdAt: Date.now()
		};
		const next = [...categories, newCategory];
		saveCategories(next);
		setEditingId(newCategory.id);
		setFormMode('edit');
	};

	const handleDelete = (id: string) => {
		if (!confirm(t.confirmDelete)) {
			return;
		}
		const next = categories.filter((category) => category.id !== id);
		saveCategories(next);
		if (editingId === id) {
			resetForm();
		}
	};

	const handleEmojiClick = (emojiData: EmojiClickData) => {
		setFormEmoji(emojiData.emoji);
	};

	const handleIconSelect = (iconId: string) => {
		setFormEmoji(`fa:${iconId}`);
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		const reader = new FileReader();
		reader.onload = (loadEvent) => {
			const base64 = loadEvent.target?.result as string;
			setFormEmoji(base64);
		};
		reader.readAsDataURL(file);
	};

	const formTitle = formMode === 'edit'
		? language === 'zh' ? '编辑分类' : 'Edit Category'
		: language === 'zh' ? '新建分类' : 'Create Category';

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					resetForm();
				}
				onOpenChange(nextOpen);
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay
					className="fixed inset-0 backdrop-blur-sm z-[100]"
					style={{ backgroundColor: isDarkMode ? 'rgba(4, 6, 18, 0.72)' : 'rgba(15, 23, 42, 0.2)' }}
				/>
				<Dialog.Content
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[1180px] h-[86vh] overflow-hidden rounded-2xl border shadow-2xl z-[101]"
					style={{
						background: 'var(--modal-surface-background)',
						borderColor: 'var(--modal-surface-border)',
						color: 'var(--text-primary)',
						boxShadow: 'var(--shadow-xl)'
					}}
				>
					<div
						className="flex items-center justify-between px-6 py-4 border-b"
						style={{
							background: 'var(--surface-secondary)',
							borderColor: 'var(--surface-border-light)'
						}}
					>
						<div className="flex items-center gap-3">
							<div
								className="p-2 rounded-lg"
								style={{ background: isDarkMode ? 'rgba(124, 58, 237, 0.18)' : 'rgba(124, 58, 237, 0.1)' }}
							>
								<FolderTree className="h-5 w-5" style={{ color: 'var(--primary-gradient-end)' }} />
							</div>
							<div>
								<Dialog.Title className="text-lg font-semibold" style={{ color: 'var(--primary-gradient-end)' }}>
									{t.menuPromptCategories}
								</Dialog.Title>
								<p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
									{t.manageCategories}
								</p>
							</div>
						</div>
						<Dialog.Close asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 hover:bg-[var(--bg-hover)]"
								style={{ color: 'var(--text-secondary)' }}
								type="button"
							>
								<X className="h-4 w-4" />
							</Button>
						</Dialog.Close>
					</div>

					<div className="flex flex-col h-[calc(100%-80px)]">
						<div
							className="px-6 py-4 border-b bg-[var(--surface-primary)]"
							style={{ borderColor: 'var(--surface-border-light)' }}
						>
							<div className="flex flex-col gap-3 md:flex-row">
								<Input
									placeholder={t.searchPrompts}
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									className="flex-1"
								/>
								<Button
									onClick={handleOpenCreate}
									className="text-white shadow-sm hover:shadow-md border-0"
									style={{
										background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end))'
									}}
									type="button"
								>
									<Plus className="h-4 w-4 mr-2" />
									{t.addCategory}
								</Button>
							</div>
						</div>

						<div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
							<div
								className="w-full lg:w-5/12 xl:w-4/12 border-r"
								style={{ borderColor: 'var(--surface-border-light)' }}
							>
								<div className="h-full overflow-y-auto px-6 py-4 space-y-3">
									{filteredCategories.length === 0 ? (
										<div
											className="flex flex-col items-center justify-center text-center py-12"
											style={{ color: 'var(--text-secondary)' }}
										>
											<FolderTree className="h-12 w-12 mb-3" style={{ color: 'var(--text-muted)' }} />
											<p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
												{searchQuery ? t.noPromptsFound : 'No categories yet'}
											</p>
											<p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
												{searchQuery ? t.tryDifferentSearch : 'Create your first category to organize templates'}
											</p>
										</div>
									) : (
										filteredCategories.map((category) => {
											const isActive = formMode === 'edit' && editingId === category.id;
											return (
												<button
													key={category.id}
													type="button"
													onClick={() => handleOpenEdit(category)}
													className="w-full text-left"
												>
													<div
														className={cn(
															'w-full rounded-xl border px-4 py-3 flex items-center justify-between gap-4 transition-colors',
															isActive
																? isDarkMode
																	? 'border-lime-400/60 bg-lime-400/10'
																	: 'border-lime-400 bg-lime-50'
																: ''
														)}
														style={{
															background: !isActive
																? isDarkMode
																	? 'rgba(38, 40, 60, 0.92)'
																	: 'rgba(250, 251, 255, 0.94)'
																: undefined,
															borderColor: isActive ? undefined : 'var(--surface-border)',
															boxShadow: isDarkMode ? 'none' : '0 12px 28px rgba(15, 23, 42, 0.1)'
														}}
													>
														<div className="flex items-center gap-3">
															<div
																className="w-10 h-10 flex items-center justify-center rounded-lg"
																style={{
																	background: isDarkMode ? 'rgba(56, 58, 78, 0.85)' : 'rgba(124, 58, 237, 0.08)',
																	color: 'var(--accent-emerald)'
																}}
															>
																{renderCategoryIcon(category.emoji, 'text-xl')}
															</div>
															<div>
																<p className="font-medium" style={{ color: 'var(--text-primary)' }}>
																	{category.name}
																</p>
																<p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
																	{language === 'zh' ? '创建于' : 'Created'}{' '}
																	{new Date(category.createdAt).toLocaleDateString()}
																</p>
															</div>
														</div>
														<div className="flex gap-2">
															<Button
																size="sm"
																variant="ghost"
																className="hover:bg-[var(--bg-hover)]"
																onClick={(event) => {
																	event.stopPropagation();
																	handleOpenEdit(category);
																}}
																style={{ color: 'var(--accent-cyan)' }}
																type="button"
															>
																<Edit2 className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																className="hover:bg-[var(--bg-hover)]"
																onClick={(event) => {
																	event.stopPropagation();
																	handleDelete(category.id);
																}}
																style={{ color: '#ef4444' }}
																type="button"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</div>
												</button>
											);
										})
									)}
								</div>
							</div>

							<div className="w-full lg:w-7/12 xl:w-8/12 px-6 py-4 overflow-y-auto">
								{formMode === 'none' ? (
									<div
										className="h-full flex flex-col items-center justify-center text-center"
										style={{ color: 'var(--text-tertiary)' }}
									>
										<FolderTree className="h-16 w-16 mb-4" style={{ color: 'var(--text-muted)' }} />
										<p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
											{language === 'zh' ? '选择一个分类或创建新的分类' : 'Select a category or create a new one'}
										</p>
										<p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
											{language === 'zh' ? '左侧选择的分类将在此处编辑。' : 'Pick a category on the left to edit it here.'}
										</p>
										<Button
											className="mt-6"
											onClick={handleOpenCreate}
											style={{ background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--accent-emerald))' }}
											type="button"
										>
											<Plus className="h-4 w-4 mr-2" />
											{t.addCategory}
										</Button>
									</div>
								) : (
									<div
										className="border rounded-2xl p-6 space-y-6"
										style={{
											borderColor: 'var(--surface-border)',
											background: isDarkMode ? 'rgba(38, 40, 60, 0.92)' : 'rgba(250, 251, 255, 0.95)',
											boxShadow: isDarkMode ? 'none' : '0 16px 34px rgba(15, 23, 42, 0.1)'
										}}
									>
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
													{formTitle}
												</h3>
												<p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
													{language === 'zh'
														? '更新分类名称与图标，左侧列表会实时反映更改。'
														: 'Update the name and icon; the list reflects changes instantly.'}
												</p>
											</div>
											<Button
												onClick={resetForm}
												variant="ghost"
												className="hover:bg-[var(--bg-hover)]"
												style={{ color: 'var(--text-secondary)' }}
												type="button"
											>
												{t.cancel}
											</Button>
										</div>

										<div>
											<label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
												{t.categoryNameLabel}
											</label>
											<Input
												value={formName}
												onChange={(event) => setFormName(event.target.value)}
												placeholder={t.enterBoardName}
												onKeyDown={(event) => {
													if (event.key === 'Enter' && formName.trim()) {
														handleSave();
													}
													if (event.key === 'Escape') {
														resetForm();
													}
												}}
												autoFocus
											/>
										</div>

										<div className="flex items-center gap-4">
											<div
												className="h-20 w-20 flex items-center justify-center rounded-xl border"
												style={{
													borderColor: 'var(--surface-border)',
													background: isDarkMode ? 'var(--surface-secondary)' : 'rgba(124, 58, 237, 0.08)'
												}}
											>
												{renderCategoryIcon(formEmoji, 'text-4xl')}
											</div>
											<p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
												{language === 'zh'
													? '在下方选项卡中选择表达该分类的表情或图标，或上传图片。'
													: 'Use the tabs below to pick an emoji, choose a font icon, or upload an image.'}
											</p>
										</div>

										<div
											className="border rounded-2xl overflow-hidden"
											style={{
												borderColor: 'var(--surface-border)',
												background: 'var(--surface-secondary)',
												...(emojiPickerThemeStyles as CSSProperties)
											}}
										>
											<div className="flex border-b" style={{ borderColor: 'var(--surface-border)' }}>
												{ICON_TABS.map((tab) => {
													const isActive = iconTab === tab.id;
													return (
														<button
															key={tab.id}
															type="button"
															onClick={() => setIconTab(tab.id)}
															className={cn(
																'flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 hover:bg-[var(--bg-hover)]',
																isActive ? 'text-lime-400 border-lime-400' : 'border-transparent'
															)}
															style={{
																background: isActive ? 'var(--surface-primary)' : 'transparent',
																color: isActive ? undefined : 'var(--text-secondary)'
															}}
														>
															{language === 'zh' ? tab.labelZh : tab.labelEn}
														</button>
													);
												})}
											</div>

											<div className="bg-[var(--surface-primary)]">
												{iconTab === 'emoji' && (
													<EmojiPicker
														key={isDarkMode ? 'emoji-dark-inline' : 'emoji-light-inline'}
														onEmojiClick={handleEmojiClick}
														theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
														width="100%"
														height={320}
														searchPlaceHolder={language === 'zh' ? '搜索表情...' : 'Search emoji...'}
														previewConfig={{ showPreview: false }}
														style={emojiPickerThemeStyles as CSSProperties}
													/>
												)}

												{iconTab === 'icons' && (
													<div className="p-4" style={{ maxHeight: '320px', overflowY: 'auto' }}>
														<Input
															placeholder={language === 'zh' ? '搜索图标...' : 'Filter icons...'}
															value={iconSearch}
															onChange={(event) => setIconSearch(event.target.value)}
															className="mb-3"
														/>
														<div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
															{filteredIcons.map((option) => (
																<button
																	key={option.id}
																	type="button"
																	className="w-12 h-12 flex items-center justify-center rounded border border-transparent hover:border-lime-400 hover:bg-[var(--bg-hover)]"
																	onClick={() => handleIconSelect(option.id)}
																	title={option.name}
																>
																	<option.icon className="text-xl" style={{ color: 'var(--text-secondary)' }} />
																</button>
															))}
														</div>
													</div>
												)}

												{iconTab === 'upload' && (
													<div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '320px' }}>
														<input
															ref={fileInputRef}
															type="file"
															accept="image/*"
															className="hidden"
															onChange={handleFileUpload}
														/>
														<div
															onClick={() => fileInputRef.current?.click()}
															role="button"
															tabIndex={0}
															onKeyDown={(event) => {
																if (event.key === 'Enter' || event.key === ' ') {
																	event.preventDefault();
																	fileInputRef.current?.click();
																}
															}}
															className="border-2 border-dashed rounded-lg p-8 w-full cursor-pointer transition-all text-center hover:border-lime-400 hover:bg-[var(--bg-hover)]"
															style={{
																borderColor: 'var(--surface-border)',
																color: 'var(--text-secondary)',
																background: 'var(--surface-secondary)'
															}}
														>
															<div className="mb-3" style={{ color: 'var(--text-muted)' }}>
																<svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={1.5}
																		d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
																	/>
																</svg>
															</div>
															<p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
																{language === 'zh' ? '上传图片' : 'Upload an image'}
															</p>
															<p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
																{language === 'zh' ? '或使用 Ctrl+V 粘贴图片' : 'Or press Ctrl+V to paste an image'}
															</p>
														</div>
														<div className="mt-4">
															<Button
																onClick={() => fileInputRef.current?.click()}
																className="bg-lime-600 hover:bg-lime-700 text-white"
																type="button"
															>
																{language === 'zh' ? '选择文件' : 'Choose File'}
															</Button>
														</div>
													</div>
												)}
											</div>
										</div>

										<div className="flex gap-3">
											<Button
												onClick={handleSave}
												disabled={!formName.trim()}
												className="flex-1 text-white shadow-md hover:shadow-lg border-0"
												style={{ background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--accent-emerald))' }}
												type="button"
											>
												{t.save}
											</Button>
											<Button
												onClick={resetForm}
												variant="ghost"
												className="flex-1 hover:bg-[var(--bg-hover)]"
												style={{ color: 'var(--text-secondary)' }}
												type="button"
											>
												{t.cancel}
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>

						<div
							className="px-6 py-4 border-t bg-[var(--surface-secondary)]"
							style={{ borderColor: 'var(--surface-border-light)' }}
						>
							<div className="flex items-center justify-between">
								<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
									{filteredCategories.length} {language === 'zh' ? '个分类' : 'categories'}
								</p>
								<Button
									onClick={() => {
										resetForm();
										onOpenChange(false);
									}}
									variant="ghost"
									className="hover:bg-[var(--bg-hover)]"
									style={{ color: 'var(--text-secondary)' }}
									type="button"
								>
									{t.ok}
								</Button>
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

