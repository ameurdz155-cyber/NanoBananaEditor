"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
	ArrowLeft,
	Copy,
	Edit2,
	Eye,
	EyeOff,
	FileText,
	Loader2,
	Mic,
	MicOff,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	UploadCloud,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTemplateStore, Template } from '../store/useTemplateStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import * as categoryService from '../services/categoryService';

interface TemplateManagementPageProps {
	onClose: () => void;
}

type TemplateFormState = {
	name: string;
	description: string;
	positivePrompt: string;
	negativePrompt: string;
	categoryId: string;
	emoji: string;
	image: string;
};

export const TemplateManagementPage: React.FC<TemplateManagementPageProps> = ({ onClose }) => {
	const language = useAppStore((state) => state.language);
	const promptCategories = useAppStore((state) => state.promptCategories);
	const setPromptCategories = useAppStore((state) => state.setPromptCategories);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isPremiumUser = useAuthStore((state) => state.isPremiumUser);
	const templates = useTemplateStore((state) => state.templates);
	const templatesLoading = useTemplateStore((state) => state.loading.templates);
	const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);
	const refreshTemplates = useTemplateStore((state) => state.refreshTemplates);
	const createTemplate = useTemplateStore((state) => state.createTemplate);
	const updateTemplate = useTemplateStore((state) => state.updateTemplate);
	const deleteTemplate = useTemplateStore((state) => state.deleteTemplate);
	const t = getTranslation(language);

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'all' | 'uncategorized' | string>('all');
	const [previewId, setPreviewId] = useState<string | null>(null);
	const [isFormOpen, setFormOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
	const [formState, setFormState] = useState<TemplateFormState>({
		name: '',
		description: '',
			positivePrompt: '',
		negativePrompt: '',
		categoryId: '',
		emoji: '',
		image: '',
	});
	const [isListening, setListening] = useState(false);
	const [voiceLang, setVoiceLang] = useState<'en-US' | 'zh-CN'>(() => (language === 'zh' ? 'zh-CN' : 'en-US'));
	const voiceLangWasManuallyChanged = useRef(false);
	const recognitionRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Image cropper state
	const [showCropper, setShowCropper] = useState(false);
	const [imageToCrop, setImageToCrop] = useState<string | null>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		fetchTemplates().catch((error) => {
			console.error('Failed to fetch templates:', error);
		});
	}, [isAuthenticated, fetchTemplates]);

	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		if (promptCategories.length === 0) {
			categoryService
				.fetchCategories()
				.then((categories) => setPromptCategories(categories))
				.catch((error) => {
					console.error('Failed to fetch categories:', error);
				});
		}
	}, [isAuthenticated, promptCategories.length, setPromptCategories]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognitionCtor) {
			return;
		}

		const recognition = new SpeechRecognitionCtor();
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;
		recognition.lang = voiceLang;
		recognition.onresult = (event: any) => {
			const transcript = Array.from(event.results)
				.map((result: any) => result[0]?.transcript ?? '')
				.join(' ')
				.trim();
			if (transcript) {
				setSearchTerm(transcript);
			}
		};
		recognition.onerror = () => setListening(false);
		recognition.onend = () => setListening(false);

		recognitionRef.current = recognition;

		return () => {
			if (recognitionRef.current) {
				try {
					recognitionRef.current.stop();
					recognitionRef.current.abort?.();
				} catch (error) {
					console.warn('Failed to stop speech recognition', error);
				}
			}
			recognitionRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (recognitionRef.current) {
			recognitionRef.current.lang = voiceLang;
		}
	}, [voiceLang]);

	useEffect(() => {
		const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
		if (!voiceLangWasManuallyChanged.current) {
			setVoiceLang(defaultVoiceLang);
		} else if (voiceLang === defaultVoiceLang) {
			voiceLangWasManuallyChanged.current = false;
		}
	}, [language, voiceLang]);

	const filteredTemplates = useMemo(() => {
		return templates.filter((template) => {
			const matchesSearch =
				searchTerm.trim().length === 0 ||
				template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.positivePrompt.toLowerCase().includes(searchTerm.toLowerCase());
			if (!matchesSearch) {
				return false;
			}

			if (selectedCategory === 'all') {
				return true;
			}

			if (selectedCategory === 'uncategorized') {
				return !template.categoryId;
			}

			return template.categoryId === selectedCategory;
		});
	}, [templates, searchTerm, selectedCategory]);

	const resetForm = () => {
		setFormState({
			name: '',
			description: '',
				positivePrompt: '',
			negativePrompt: '',
			categoryId: '',
			emoji: '',
			image: '',
		});
	};

	const openCreateForm = () => {
		setEditingTemplate(null);
		resetForm();
		setFormOpen(true);
	};

	const openEditForm = (template: Template) => {
		setEditingTemplate(template);
		setFormState({
			name: template.name,
			description: template.description ?? '',
			positivePrompt: template.positivePrompt,
			negativePrompt: template.negativePrompt ?? '',
			categoryId: template.categoryId ?? '',
			emoji: template.emoji ?? '',
			image: template.image ?? '',
		});
		setFormOpen(true);
	};

	const handleFormCancel = () => {
		setFormOpen(false);
		setEditingTemplate(null);
		resetForm();
	};

	const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	}, []);

	const createCroppedImage = useCallback(async (imageSrc: string, pixelCrop: Area): Promise<string> => {
		const image = new Image();
		image.src = imageSrc;

		return new Promise((resolve, reject) => {
			image.onload = () => {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Set canvas size to 16:9 aspect ratio
				canvas.width = pixelCrop.width;
				canvas.height = pixelCrop.height;

				ctx.drawImage(
					image,
					pixelCrop.x,
					pixelCrop.y,
					pixelCrop.width,
					pixelCrop.height,
					0,
					0,
					pixelCrop.width,
					pixelCrop.height
				);

				canvas.toBlob((blob) => {
					if (!blob) {
						reject(new Error('Failed to create blob'));
						return;
					}
					const reader = new FileReader();
					reader.onloadend = () => {
						resolve(reader.result as string);
					};
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				}, 'image/jpeg', 0.9);
			};
			image.onerror = reject;
		});
	}, []);

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				setImageToCrop(base64String);
				setShowCropper(true);
				setCrop({ x: 0, y: 0 });
				setZoom(1);
			};
			reader.readAsDataURL(file);
		}
		// Reset the input value to allow re-uploading the same file
		event.target.value = '';
	};

	const handleCropSave = async () => {
		if (!imageToCrop || !croppedAreaPixels) {
			return;
		}

		try {
			const croppedImage = await createCroppedImage(imageToCrop, croppedAreaPixels);
			setFormState((prev) => ({ ...prev, image: croppedImage }));
			setShowCropper(false);
			setImageToCrop(null);
		} catch (error) {
			console.error('Failed to crop image:', error);
			alert(language === 'zh' ? '裁剪图片失败' : 'Failed to crop image');
		}
	};

	const handleCropCancel = () => {
		setShowCropper(false);
		setImageToCrop(null);
		setCrop({ x: 0, y: 0 });
		setZoom(1);
		setCroppedAreaPixels(null);
	};

	const handleFormSubmit = async () => {
		const name = formState.name.trim();
		const positivePrompt = formState.positivePrompt.trim();
		if (!name || !positivePrompt) {
			return;
		}

		try {
			const imageValue = formState.image.trim();
			const normalizedImage = imageValue.length > 0 ? imageValue : undefined;

			if (editingTemplate) {
				await updateTemplate(editingTemplate.id, {
					name,
					positivePrompt,
					negativePrompt: formState.negativePrompt.trim() || undefined,
					categoryId: formState.categoryId || undefined,
					description: formState.description.trim() || undefined,
					emoji: formState.emoji || undefined,
					image: normalizedImage,
				});
			} else {
				await createTemplate({
					name,
					positivePrompt,
					negativePrompt: formState.negativePrompt.trim() || undefined,
					categoryId: formState.categoryId || undefined,
					description: formState.description.trim() || undefined,
					emoji: formState.emoji || undefined,
					image: normalizedImage,
				});
			}
			setFormOpen(false);
			setEditingTemplate(null);
			resetForm();
		} catch (error) {
			console.error('Failed to save template:', error);
			alert(
				language === 'zh'
					? '无法保存模板，请稍后重试。'
					: 'Unable to save template. Please try again later.'
			);
		}
	};

	const handleDelete = async (template: Template) => {
		if (template.isDefault) {
			return;
		}

		const confirmed = window.confirm(
			language === 'zh'
				? '确定要删除此模板吗？'
				: 'Are you sure you want to delete this template?'
		);

		if (!confirmed) {
			return;
		}

		try {
			await deleteTemplate(template.id);
		} catch (error) {
			console.error('Failed to delete template:', error);
			alert(
				language === 'zh'
					? '删除模板失败，请稍后重试。'
					: 'Unable to delete template. Please try again later.'
			);
		}
	};

	const handleDuplicate = async (template: Template) => {
		try {
			const imageValue = template.image?.trim();
			const normalizedImage = imageValue && imageValue.length > 0 ? imageValue : undefined;
			await createTemplate({
				name: `${template.name} (Copy)`,
						positivePrompt: template.positivePrompt,
				negativePrompt: template.negativePrompt,
				categoryId: template.categoryId,
				description: template.description,
				emoji: template.emoji,
				image: normalizedImage,
			});
		} catch (error) {
			console.error('Failed to duplicate template:', error);
			alert(
				language === 'zh'
					? '复制模板失败。'
					: 'Unable to duplicate template.'
			);
		}
	};

	const togglePreview = (id: string) => {
		setPreviewId((prev) => (prev === id ? null : id));
	};

	const toggleVoiceSearch = () => {
		const recognition = recognitionRef.current;
		if (!recognition) {
			return;
		}

		if (isListening) {
			try {
				recognition.stop();
				recognition.abort?.();
			} catch (error) {
				console.warn('Unable to stop speech recognition', error);
			} finally {
				setListening(false);
			}
			return;
		}

		try {
			recognition.lang = voiceLang;
			recognition.start();
			setListening(true);
		} catch (error) {
			console.error('Unable to start speech recognition', error);
			setListening(false);
		}
	};

	const handleVoiceLangChange = (value: string) => {
		if (value !== 'en-US' && value !== 'zh-CN') return;
		const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
		voiceLangWasManuallyChanged.current = value !== defaultVoiceLang;
		setVoiceLang(value);
	};

	const voiceLangLabel = voiceLang === 'zh-CN' ? '中文' : 'English';

	if (!isPremiumUser) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
				<h2 className="text-2xl font-semibold text-white">{t.premiumFeatureTitle}</h2>
				<p className="max-w-md text-sm text-gray-300">{t.premiumFeatureDescription}</p>
				<Button onClick={onClose} variant="ghost">
					{language === 'zh' ? '返回' : 'Back'}
				</Button>
			</div>
		);
	}

	return (
		<div className="h-full w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col overflow-hidden">
			{/* Header */}
			<header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-xl border-b border-vis-border z-10">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="h-7 w-7 text-vis-teal-400" />
						<h1 className="text-2xl font-bold bg-gradient-to-r from-vis-teal-400 to-vis-cyan-400 bg-clip-text text-transparent">
							{language === 'zh' ? '模板管理' : 'Template Management'}
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							onClick={() => refreshTemplates()}
							disabled={templatesLoading}
							className="text-vis-text-secondary hover:text-vis-teal-400 hover:bg-vis-teal-500/10"
						>
							{templatesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
							<span className="ml-2">{language === 'zh' ? '刷新' : 'Refresh'}</span>
						</Button>
						<Button onClick={onClose} variant="ghost" size="sm" className="text-vis-text-secondary hover:text-vis-teal-300">
							<ArrowLeft className="h-5 w-5 mr-1" />
							{language === 'zh' ? '返回' : 'Back'}
						</Button>
					</div>
				</div>
			</header>

			{/* Search Bar */}
			<div className="flex-shrink-0 px-6 py-4">
				<div className="flex gap-3 items-stretch">
					<div className="relative flex-1 flex items-center">
						<div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
							<Search className="h-5 w-5 text-vis-text-muted" />
						</div>
						<Input
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder={language === 'zh' ? '搜索模板...' : 'Search templates...'}
							className="pl-11 h-11 rounded-xl border border-vis-border bg-gray-900/50 text-vis-text-primary placeholder:text-vis-text-muted focus-visible:border-vis-teal-400 focus-visible:bg-gray-900/70 focus-visible:ring-2 focus-visible:ring-vis-teal-500/30 transition-all duration-200"
						/>
					</div>
					<Select value={voiceLang} onValueChange={handleVoiceLangChange}>
						<SelectTrigger className="h-11 w-auto min-w-[110px] bg-gray-900/80 border border-vis-border text-xs text-vis-text-primary rounded-xl px-3">
							<SelectValue>{voiceLangLabel}</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-gray-900/95 text-vis-text-primary border border-vis-border-light">
							<SelectItem value="en-US">English</SelectItem>
							<SelectItem value="zh-CN">中文</SelectItem>
						</SelectContent>
					</Select>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						onClick={toggleVoiceSearch}
						disabled={!recognitionRef.current}
						className={`h-11 w-11 rounded-full border flex-shrink-0 transition-all duration-200 ${isListening && recognitionRef.current ? 'border-vis-teal-400 text-vis-teal-400 bg-vis-teal-500/10 shadow-vis-glow-teal' : 'border-vis-border bg-gray-900/80 text-vis-text-secondary hover:border-vis-border-light hover:text-vis-text-primary'} ${!recognitionRef.current ? 'opacity-50 cursor-not-allowed' : ''}`}
						title={recognitionRef.current ? (isListening ? (language === 'zh' ? '停止语音搜索' : 'Stop voice search') : (language === 'zh' ? '开始语音搜索' : 'Start voice search')) : (language === 'zh' ? '浏览器不支持语音搜索' : 'Voice search not supported')}
					>
						{isListening && recognitionRef.current ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
					</Button>
					<Button 
						onClick={openCreateForm}
						size="icon"
						className="h-11 w-11 rounded-full bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white shadow-vis-glow-teal hover:shadow-vis-glow-cyan border-0 flex-shrink-0 transition-all duration-200"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</div>
			</div>

			{/* Category Filter */}
			<section className="flex-shrink-0 border-b border-vis-border px-6 py-4">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant={selectedCategory === 'all' ? 'default' : 'ghost'}
						size="sm"
						onClick={() => setSelectedCategory('all')}
						className={selectedCategory === 'all' ? 'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white border-0' : 'hover:bg-vis-teal-500/10 hover:text-vis-teal-400'}
					>
						{t.allCategories}
					</Button>
					<Button
						variant={selectedCategory === 'uncategorized' ? 'default' : 'ghost'}
						size="sm"
						onClick={() => setSelectedCategory('uncategorized')}
						className={selectedCategory === 'uncategorized' ? 'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white border-0' : 'hover:bg-vis-teal-500/10 hover:text-vis-teal-400'}
					>
						{t.uncategorized}
					</Button>
					{promptCategories.map((category) => (
						<Button
							key={category.id}
							variant={selectedCategory === category.id ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setSelectedCategory(category.id)}
							className={selectedCategory === category.id ? 'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white border-0' : 'hover:bg-vis-teal-500/10 hover:text-vis-teal-400'}
						>
							<span className="mr-1">{category.emoji || '📁'}</span>
							{category.name}
						</Button>
					))}
				</div>
			</section>

			{/* Templates - Scrollable Area */}
			<div className="flex-1 overflow-y-auto">
				<main className="px-6 py-6">
				{templatesLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-vis-text-secondary">
						<Loader2 className="mr-2 h-4 w-4 animate-spin text-vis-teal-400" />
						{language === 'zh' ? '正在加载模板' : 'Loading templates'}
					</div>
				) : filteredTemplates.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-vis-text-secondary">
						<EyeOff className="h-6 w-6 text-vis-text-muted" />
						<p>
							{searchTerm ? t.noMatchingTemplates : t.noPromptTemplatesAvailable}
						</p>
					</div>
				) : (
					<div className="grid gap-4">
						{filteredTemplates.map((template) => {
							const category = template.categoryId
								? promptCategories.find((cat) => cat.id === template.categoryId)
								: undefined;

							return (
								<article
									key={template.id}
									className="space-y-3 rounded-xl border border-vis-border bg-gray-800/50 p-4 shadow-sm hover:border-vis-teal-400 hover:shadow-vis-glow-teal transition-all duration-200"
								>
									<header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div className="flex gap-4 flex-1">
											{/* Template Image Thumbnail */}
											{(() => {
												const rawImage = template.image?.trim();
												const imageSrc = rawImage && (/^https?:\/\//i.test(rawImage) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(rawImage) || rawImage.startsWith('/')) ? rawImage : undefined;
												
												return (
													<div className="relative overflow-hidden rounded-lg border border-vis-border bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-purple-500/25 flex items-center justify-center w-24 h-24 flex-shrink-0">
														{imageSrc ? (
															<>
																<img
																	src={imageSrc}
																	alt={template.name}
																	className="h-full w-full object-cover absolute inset-0"
																	onError={(e) => {
																		const parent = e.currentTarget.parentElement;
																		e.currentTarget.style.display = 'none';
																		if (parent) {
																			const fallback = parent.querySelector('.fallback-icon');
																			if (fallback instanceof HTMLElement) {
																				fallback.style.display = 'flex';
																			}
																		}
																	}}
																/>
																<div className="fallback-icon hidden w-full h-full items-center justify-center">
																	<span className="text-2xl font-semibold text-vis-teal-400">
																		{template.emoji || template.name.charAt(0).toUpperCase()}
																	</span>
																</div>
															</>
														) : (
															<span className="text-2xl font-semibold text-vis-teal-400">
																{template.emoji || template.name.charAt(0).toUpperCase()}
															</span>
														)}
													</div>
												);
											})()}
											
											<div className="flex-1 min-w-0">
												<h2 className="text-lg font-semibold text-vis-text-primary">{template.name}</h2>
												{template.description && (
													<p className="text-sm text-vis-text-secondary">{template.description}</p>
												)}
												<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-vis-text-muted">
													<span>
														{language === 'zh' ? '更新' : 'Updated'}{' '}
														{formatDistanceToNow(new Date(template.updatedAt ?? template.createdAt), {
															addSuffix: true,
														})}
													</span>
													{category && (
														<span>· {category.emoji ? `${category.emoji} ` : ''}{category.name}</span>
													)}
													{template.source === 'default' && (
														<span className="rounded-full bg-vis-teal-500/20 border border-vis-teal-400/30 text-vis-teal-300 px-2 py-0.5">
															{language === 'zh' ? '默认' : 'Default'}
														</span>
													)}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" onClick={() => togglePreview(template.id)} className="hover:bg-vis-cyan-500/10 hover:text-vis-cyan-400">
												{previewId === template.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</Button>
											<Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)} className="hover:bg-vis-teal-500/10 hover:text-vis-teal-400">
												<Copy className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon" onClick={() => openEditForm(template)} className="hover:bg-vis-cyan-500/10 hover:text-vis-cyan-400">
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(template)}
												disabled={template.isDefault}
												className={cn(template.isDefault && 'cursor-not-allowed opacity-50', 'hover:bg-red-500/10 hover:text-red-300')}
												title={template.isDefault
													? language === 'zh'
														? '默认模板无法删除'
														: 'Default templates cannot be deleted'
													: undefined}
											>
												<Trash2 className="h-4 w-4 text-red-400" />
											</Button>
										</div>
									</header>
									{previewId === template.id && (
										<div className="space-y-3 rounded-lg border border-vis-border-light bg-gray-900/50 p-3 text-sm">
											<section>
												<h3 className="font-medium text-vis-teal-400">{language === 'zh' ? '正向提示词' : 'Positive prompt'}</h3>
												<p className="mt-1 whitespace-pre-wrap text-vis-text-secondary">{template.positivePrompt}</p>
											</section>
											{template.negativePrompt && (
												<section>
													<h3 className="font-medium text-red-400">{language === 'zh' ? '负向提示词' : 'Negative prompt'}</h3>
													<p className="mt-1 whitespace-pre-wrap text-vis-text-secondary">{template.negativePrompt}</p>
												</section>
											)}
										</div>
									)}
								</article>
							);
						})}
					</div>
				)}
				</main>
			</div>

			<Dialog open={isFormOpen} onOpenChange={(open) => (open ? setFormOpen(true) : handleFormCancel())}>
				<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
					<DialogHeader className="flex-shrink-0">
						<DialogTitle>
							{editingTemplate
								? language === 'zh'
									? '编辑模板'
									: 'Edit template'
								: language === 'zh'
									? '创建模板'
									: 'Create template'}
						</DialogTitle>
						<DialogDescription>
							{language === 'zh'
								? '填写模板详情以便快速复用常用提示。'
								: 'Fill in the template details so you can quickly reuse your favourite prompts.'}
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto px-1">
						<div className="grid gap-4">
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vis-text-primary">{language === 'zh' ? '名称' : 'Name'}</label>
							<Input
								value={formState.name}
								onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
								placeholder={language === 'zh' ? '模板名称' : 'Template name'}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vis-text-primary">{language === 'zh' ? '描述' : 'Description'}</label>
							<Textarea
								value={formState.description}
								onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
								placeholder={language === 'zh' ? '可选：对模板进行简短说明' : 'Optional: add a short description'}
								rows={2}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vis-text-primary">{language === 'zh' ? '分类' : 'Category'}</label>
							<select
								value={formState.categoryId}
								onChange={(event) => setFormState((prev) => ({ ...prev, categoryId: event.target.value }))}
								className="rounded-md border border-vis-border bg-gray-900/50 text-vis-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vis-teal-500/50 focus:border-vis-teal-400 transition-colors"
							>
								<option value="">{t.uncategorized}</option>
								{promptCategories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.emoji ? `${category.emoji} ` : ''}{category.name}
									</option>
								))}
							</select>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vis-text-primary">{language === 'zh' ? '模板图片' : 'Template Image'}</label>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleImageUpload}
							/>
							<Button
								type="button"
								variant="outline"
								className="w-full flex items-center justify-center gap-2 border-vis-border hover:border-vis-teal-400 hover:bg-vis-teal-500/10 transition-colors"
								onClick={() => fileInputRef.current?.click()}
							>
								<UploadCloud className="h-5 w-5" />
								<span>{language === 'zh' ? '上传图片' : 'Upload Image'}</span>
							</Button>
							{formState.image && (
								<div className="mt-2 flex items-center gap-4">
									<img
										src={formState.image}
										alt="Preview"
										className="h-20 w-20 rounded-md object-cover border border-vis-border"
										onError={(e) => {
											e.currentTarget.style.display = 'none';
										}}
									/>
									<Button
										variant="ghost"
										size="sm"
										className="text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
										type="button"
										onClick={() => setFormState((prev) => ({ ...prev, image: '' }))}
									>
										{language === 'zh' ? '清除' : 'Clear'}
									</Button>
								</div>
							)}
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vis-text-primary">{language === 'zh' ? '正向提示词' : 'Positive prompt'}</label>
							<Textarea
								value={formState.positivePrompt}
								onChange={(event) => setFormState((prev) => ({ ...prev, positivePrompt: event.target.value }))}
								placeholder="{prompt}"
								rows={4}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium text-vis-text-primary">{language === 'zh' ? '负向提示词' : 'Negative prompt'}</label>
							<Textarea
								value={formState.negativePrompt}
								onChange={(event) => setFormState((prev) => ({ ...prev, negativePrompt: event.target.value }))}
								placeholder={language === 'zh' ? '可选：不希望出现的元素' : 'Optional: things to avoid'}
								rows={3}
							/>
						</div>
						</div>
					</div>

					<DialogFooter className="flex-shrink-0">
						<Button variant="ghost" onClick={handleFormCancel} className="hover:bg-gray-800/50">
							{language === 'zh' ? '取消' : 'Cancel'}
						</Button>
						<Button 
							onClick={handleFormSubmit} 
							disabled={!formState.name.trim() || !formState.positivePrompt.trim()}
							className="bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white shadow-vis-glow-teal hover:shadow-vis-glow-cyan transition-all duration-200"
						>
							{editingTemplate
								? language === 'zh'
									? '保存'
									: 'Save'
								: language === 'zh'
									? '创建'
									: 'Create'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Image Cropper Modal */}
			<Dialog open={showCropper} onOpenChange={(open) => !open && handleCropCancel()}>
				<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle>
							{language === 'zh' ? '裁剪图片 (1:1)' : 'Crop Image (1:1)'}
						</DialogTitle>
						<DialogDescription>
							{language === 'zh'
								? '调整图片位置和缩放以获得最佳效果'
								: 'Adjust the image position and zoom for the best result'}
						</DialogDescription>
					</DialogHeader>

					<div className="relative w-full h-[500px] bg-gray-900 rounded-lg overflow-hidden">
						{imageToCrop && (
							<Cropper
								image={imageToCrop}
								crop={crop}
								zoom={zoom}
								aspect={1}
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={onCropComplete}
								style={{
									containerStyle: {
										width: '100%',
										height: '100%',
										backgroundColor: '#000',
									},
								}}
							/>
						)}
					</div>

					<div className="space-y-2 py-2">
						<label className="text-sm font-medium">
							{language === 'zh' ? '缩放' : 'Zoom'}
						</label>
						<input
							type="range"
							min={1}
							max={3}
							step={0.1}
							value={zoom}
							onChange={(e) => setZoom(Number(e.target.value))}
							className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
						/>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={handleCropCancel}
							type="button"
						>
							{language === 'zh' ? '取消' : 'Cancel'}
						</Button>
						<Button
							onClick={handleCropSave}
							disabled={!croppedAreaPixels}
							type="button"
						>
							{language === 'zh' ? '保存' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
