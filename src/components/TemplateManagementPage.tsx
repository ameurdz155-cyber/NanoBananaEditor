"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
	Copy,
	Edit2,
	Eye,
	EyeOff,
	Loader2,
	Mic,
	MicOff,
	Plus,
	RefreshCw,
	Search,
	Trash2,
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

type SpeechRecognitionConstructor = new () => SpeechRecognition;

export const TemplateManagementPage: React.FC<TemplateManagementPageProps> = ({ onClose }) => {
	const { language, promptCategories, setPromptCategories } = useAppStore((state) => ({
		language: state.language,
		promptCategories: state.promptCategories,
		setPromptCategories: state.setPromptCategories,
	}));
	const { isAuthenticated, isPremiumUser } = useAuthStore((state) => ({
		isAuthenticated: state.isAuthenticated,
		isPremiumUser: state.isPremiumUser,
	}));
	const {
		templates,
		loading,
		fetchTemplates,
		refreshTemplates,
		createTemplate,
		updateTemplate,
		deleteTemplate,
	} = useTemplateStore((state) => ({
		templates: state.templates,
		loading: state.loading,
		fetchTemplates: state.fetchTemplates,
		refreshTemplates: state.refreshTemplates,
		createTemplate: state.createTemplate,
		updateTemplate: state.updateTemplate,
		deleteTemplate: state.deleteTemplate,
	}));
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
	const recognitionRef = useRef<SpeechRecognition | null>(null);

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

		const browserWindow = window as typeof window & {
			SpeechRecognition?: SpeechRecognitionConstructor;
			webkitSpeechRecognition?: SpeechRecognitionConstructor;
		};
		const RecognitionCtor = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
		if (!RecognitionCtor) {
			recognitionRef.current = null;
			return;
		}

		const recognition = new RecognitionCtor();
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;
		recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
		recognition.onresult = (event) => {
			const transcript = event.results?.[0]?.[0]?.transcript;
			if (transcript) {
				setSearchTerm(transcript);
			}
			setListening(false);
		};
		recognition.onerror = (event) => {
			setListening(false);
			if (event.error !== 'no-speech') {
				console.error('Speech recognition error:', event.error);
			}
		};
		recognition.onend = () => setListening(false);

		recognitionRef.current = recognition;

		return () => {
			recognition.stop();
		};
	}, [language]);

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

	const handleFormSubmit = async () => {
			if (!formState.name.trim() || !formState.positivePrompt.trim()) {
			return;
		}

		try {
			if (editingTemplate) {
				await updateTemplate(editingTemplate.id, {
					name: formState.name.trim(),
						positivePrompt: formState.positivePrompt.trim(),
					negativePrompt: formState.negativePrompt.trim() || undefined,
					categoryId: formState.categoryId || undefined,
					description: formState.description.trim() || undefined,
					emoji: formState.emoji || undefined,
					image: formState.image || undefined,
				});
			} else {
				await createTemplate({
					name: formState.name.trim(),
							positivePrompt: formState.positivePrompt.trim(),
					negativePrompt: formState.negativePrompt.trim() || undefined,
					categoryId: formState.categoryId || undefined,
					description: formState.description.trim() || undefined,
					emoji: formState.emoji || undefined,
					image: formState.image || undefined,
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
			await createTemplate({
				name: `${template.name} (Copy)`,
						positivePrompt: template.positivePrompt,
				negativePrompt: template.negativePrompt,
				categoryId: template.categoryId,
				description: template.description,
				emoji: template.emoji,
				image: template.image,
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
			alert(
				language === 'zh'
					? '当前浏览器不支持语音搜索。'
					: 'Voice search is not supported in this browser.'
			);
			return;
		}

		if (isListening) {
			recognition.stop();
			return;
		}

		try {
			recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
			recognition.start();
			setListening(true);
		} catch (error) {
			console.error('Unable to start speech recognition', error);
			setListening(false);
		}
	};

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
		<div className="flex h-full flex-col bg-[var(--surface-primary)] text-[var(--text-primary)]">
			<header className="flex items-center justify-between border-b border-[var(--surface-border-light)] px-6 py-4">
				<div>
					<h1 className="text-xl font-semibold">{language === 'zh' ? '模板管理' : 'Template Management'}</h1>
					<p className="text-sm text-[var(--text-secondary)]">
						{language === 'zh'
							? '创建、分类并维护您的提示模板。'
							: 'Create, categorize, and maintain your prompt templates.'}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						onClick={() => refreshTemplates()}
						disabled={loading.templates}
					>
						{loading.templates ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
						<span>{language === 'zh' ? '刷新' : 'Refresh'}</span>
					</Button>
					<Button onClick={openCreateForm}>
						<Plus className="h-4 w-4" />
						<span>{language === 'zh' ? '新增模板' : 'New Template'}</span>
					</Button>
					<Button variant="ghost" onClick={onClose}>
						{language === 'zh' ? '返回' : 'Close'}
					</Button>
				</div>
			</header>

			<section className="grid gap-4 border-b border-[var(--surface-border-light)] px-6 py-4 md:grid-cols-[1fr_auto] md:items-center">
				<div className="relative flex items-center">
					<Search className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--text-tertiary)]" />
					<Input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder={language === 'zh' ? '搜索模板...' : 'Search templates...'}
						className="pl-9"
					/>
					<Button
						variant="ghost"
						size="icon"
						className="ml-2"
						onClick={toggleVoiceSearch}
					>
						{isListening ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant={selectedCategory === 'all' ? 'default' : 'ghost'}
						size="sm"
						onClick={() => setSelectedCategory('all')}
					>
						{t.allCategories}
					</Button>
					<Button
						variant={selectedCategory === 'uncategorized' ? 'default' : 'ghost'}
						size="sm"
						onClick={() => setSelectedCategory('uncategorized')}
					>
						{t.uncategorized}
					</Button>
					{promptCategories.map((category) => (
						<Button
							key={category.id}
							variant={selectedCategory === category.id ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setSelectedCategory(category.id)}
						>
							<span className="mr-1">{category.emoji || '📁'}</span>
							{category.name}
						</Button>
					))}
				</div>
			</section>

			<main className="flex-1 overflow-y-auto px-6 py-4">
				{loading.templates ? (
					<div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						{language === 'zh' ? '正在加载模板' : 'Loading templates'}
					</div>
				) : filteredTemplates.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[var(--text-secondary)]">
						<EyeOff className="h-6 w-6" />
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
									className="space-y-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-secondary)] p-4 shadow-sm"
								>
									<header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div>
											<h2 className="text-lg font-semibold">{template.name}</h2>
											{template.description && (
												<p className="text-sm text-[var(--text-secondary)]">{template.description}</p>
											)}
											<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
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
													<span className="rounded-full bg-[var(--surface-border-light)] px-2 py-0.5">
														{language === 'zh' ? '默认' : 'Default'}
													</span>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" onClick={() => togglePreview(template.id)}>
												{previewId === template.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</Button>
											<Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
												<Copy className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon" onClick={() => openEditForm(template)}>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(template)}
												disabled={template.isDefault}
												className={cn(template.isDefault && 'cursor-not-allowed opacity-50')}
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
										<div className="space-y-3 rounded-lg border border-[var(--surface-border-light)] bg-[var(--surface-primary)] p-3 text-sm">
											<section>
												<h3 className="font-medium text-green-400">{language === 'zh' ? '正向提示词' : 'Positive prompt'}</h3>
												<p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">{template.positivePrompt}</p>
											</section>
											{template.negativePrompt && (
												<section>
													<h3 className="font-medium text-red-400">{language === 'zh' ? '负向提示词' : 'Negative prompt'}</h3>
													<p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">{template.negativePrompt}</p>
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

			<Dialog open={isFormOpen} onOpenChange={(open) => (open ? setFormOpen(true) : handleFormCancel())}>
				<DialogContent className="max-w-2xl space-y-6">
					<DialogHeader>
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

					<div className="grid gap-4">
						<div className="grid gap-2">
							<label className="text-sm font-medium">{language === 'zh' ? '名称' : 'Name'}</label>
							<Input
								value={formState.name}
								onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
								placeholder={language === 'zh' ? '模板名称' : 'Template name'}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">{language === 'zh' ? '描述' : 'Description'}</label>
							<Textarea
								value={formState.description}
								onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
								placeholder={language === 'zh' ? '可选：对模板进行简短说明' : 'Optional: add a short description'}
								rows={2}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">{language === 'zh' ? '正向提示词' : 'Positive prompt'}</label>
							<Textarea
								value={formState.positivePrompt}
								onChange={(event) => setFormState((prev) => ({ ...prev, positivePrompt: event.target.value }))}
								placeholder="{prompt}"
								rows={4}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">{language === 'zh' ? '负向提示词' : 'Negative prompt'}</label>
							<Textarea
								value={formState.negativePrompt}
								onChange={(event) => setFormState((prev) => ({ ...prev, negativePrompt: event.target.value }))}
								placeholder={language === 'zh' ? '可选：不希望出现的元素' : 'Optional: things to avoid'}
								rows={3}
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">{language === 'zh' ? '分类' : 'Category'}</label>
							<select
								value={formState.categoryId}
								onChange={(event) => setFormState((prev) => ({ ...prev, categoryId: event.target.value }))}
								className="rounded-md border border-[var(--surface-border)] bg-transparent px-3 py-2 text-sm"
							>
								<option value="">{t.uncategorized}</option>
								{promptCategories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.emoji ? `${category.emoji} ` : ''}{category.name}
									</option>
								))}
							</select>
						</div>
						<div className="grid gap-2 md:grid-cols-2">
							<div className="grid gap-2">
								<label className="text-sm font-medium">{language === 'zh' ? '图标表情' : 'Emoji'}</label>
								<Input
									value={formState.emoji}
									onChange={(event) => setFormState((prev) => ({ ...prev, emoji: event.target.value }))}
									placeholder="✨"
								/>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">{language === 'zh' ? '预览图 URL' : 'Image URL'}</label>
								<Input
									value={formState.image}
									onChange={(event) => setFormState((prev) => ({ ...prev, image: event.target.value }))}
									placeholder="https://example.com/preview.jpg"
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="ghost" onClick={handleFormCancel}>
							{language === 'zh' ? '取消' : 'Cancel'}
						</Button>
						<Button onClick={handleFormSubmit} disabled={!formState.name.trim() || !formState.positivePrompt.trim()}>
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
		</div>
	);
};
