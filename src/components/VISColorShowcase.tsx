import React from 'react';
import { Palette, Sparkles, Circle, Square } from 'lucide-react';
import { Button } from './ui/Button';

/**
 * VIS Color System Showcase Component
 * 
 * This component demonstrates all the colors and patterns from the VIS brand system.
 * Use this as a reference when building new components.
 */
export const VISColorShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'colors' | 'components' | 'effects'>('colors');

  return (
    <div className="min-h-screen bg-vis-app p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Palette className="w-10 h-10 text-vis-teal" />
            <h1 className="text-4xl font-bold text-vis-primary">
              VIS Brand Color System
            </h1>
          </div>
          <p className="text-vis-secondary text-lg max-w-2xl mx-auto">
            A comprehensive design system based on the Upscale Panel design with Teal/Cyan primary and Purple secondary colors.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex justify-center gap-2">
          {(['colors', 'components', 'effects'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'bg-vis-teal-500 hover:bg-vis-teal-600' : ''}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-8">
            {/* Teal Palette */}
            <section className="bg-vis-panel rounded-xl border border-vis-teal-light p-6 shadow-vis-glow-teal">
              <h2 className="text-2xl font-bold text-vis-teal mb-4 flex items-center gap-2">
                <Circle className="w-5 h-5 fill-current" />
                Teal Palette (Primary Brand)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-3">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                  <div key={shade} className="space-y-2">
                    <div
                      className={`h-20 rounded-lg border border-vis-default bg-vis-teal-${shade} shadow-md`}
                      style={{ backgroundColor: `var(--vis-teal-${shade})` }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-vis-primary">{shade}</p>
                      <p className="text-[10px] text-vis-muted font-mono">teal-{shade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cyan Palette */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-cyan mb-4 flex items-center gap-2">
                <Circle className="w-5 h-5 fill-current" />
                Cyan Palette (Complementary)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-3">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                  <div key={shade} className="space-y-2">
                    <div
                      className={`h-20 rounded-lg border border-vis-default bg-vis-cyan-${shade} shadow-md`}
                      style={{ backgroundColor: `var(--vis-cyan-${shade})` }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-vis-primary">{shade}</p>
                      <p className="text-[10px] text-vis-muted font-mono">cyan-{shade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Purple Palette */}
            <section className="bg-vis-panel rounded-xl border border-vis-purple-light p-6 shadow-vis-glow-purple">
              <h2 className="text-2xl font-bold text-vis-purple mb-4 flex items-center gap-2">
                <Circle className="w-5 h-5 fill-current" />
                Purple Palette (Secondary Brand)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-3">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                  <div key={shade} className="space-y-2">
                    <div
                      className={`h-20 rounded-lg border border-vis-default bg-vis-purple-${shade} shadow-md`}
                      style={{ backgroundColor: `var(--vis-purple-${shade})` }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-vis-primary">{shade}</p>
                      <p className="text-[10px] text-vis-muted font-mono">purple-{shade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Semantic Colors */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4">Semantic Colors</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-vis-success-bg border border-vis-success-border rounded-lg p-4">
                  <p className="text-vis-success-text font-semibold">Success</p>
                  <p className="text-xs text-vis-muted mt-1">For positive actions</p>
                </div>
                <div className="bg-vis-error-bg border border-vis-error-border rounded-lg p-4">
                  <p className="text-vis-error-text font-semibold">Error</p>
                  <p className="text-xs text-vis-muted mt-1">For errors & alerts</p>
                </div>
                <div className="bg-vis-warning-bg border border-vis-warning-border rounded-lg p-4">
                  <p className="text-vis-warning-text font-semibold">Warning</p>
                  <p className="text-xs text-vis-muted mt-1">For warnings</p>
                </div>
                <div className="bg-vis-info-bg border border-vis-info-border rounded-lg p-4">
                  <p className="text-vis-info-text font-semibold">Info</p>
                  <p className="text-xs text-vis-muted mt-1">For information</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="space-y-8">
            {/* Buttons */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4">Buttons</h2>
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 rounded-full bg-vis-teal-500 hover:bg-vis-teal-600 text-white font-semibold shadow-vis-glow-teal transition-all">
                  Primary Teal
                </button>
                <button className="px-6 py-3 rounded-full bg-vis-purple-500 hover:bg-vis-purple-600 text-white font-semibold shadow-vis-glow-purple transition-all">
                  Secondary Purple
                </button>
                <button className="px-6 py-3 rounded-full border border-vis-teal-light text-vis-teal hover:text-vis-teal-bright hover:border-vis-teal hover:bg-vis-teal/10 font-semibold transition-all">
                  Outline Teal
                </button>
                <button className="px-6 py-3 rounded-full bg-vis-button-ghost-bg hover:bg-vis-button-ghost-hover text-vis-primary font-semibold transition-all">
                  Ghost
                </button>
              </div>
            </section>

            {/* Panels */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4">Panel Styles</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Teal Panel */}
                <div className="rounded-xl border border-gray-800 bg-gray-900/70 shadow-vis-glow-teal">
                  <header className="px-4 py-3 border-b border-gray-800/80">
                    <p className="text-sm uppercase tracking-wider text-vis-teal-300 font-medium">
                      Teal Accent Panel
                    </p>
                  </header>
                  <div className="p-4 space-y-3">
                    <div className="rounded-lg border border-dashed border-vis-teal-light bg-gray-900/60 p-4 text-center">
                      <p className="text-vis-secondary text-sm">Dashed border upload area</p>
                    </div>
                    <button className="w-full h-11 rounded-full border border-vis-teal-light text-vis-teal hover:text-vis-teal-bright hover:border-vis-teal transition-all">
                      Upload Image
                    </button>
                  </div>
                </div>

                {/* Purple Panel */}
                <div className="rounded-xl border border-gray-800 bg-gray-900/70 shadow-vis-glow-purple">
                  <header className="px-4 py-3 border-b border-gray-800/80">
                    <p className="text-sm uppercase tracking-wider text-vis-purple-300 font-medium">
                      Purple Accent Panel
                    </p>
                  </header>
                  <div className="p-4 space-y-3">
                    <div className="rounded-lg border border-dashed border-vis-purple-light bg-gray-900/60 p-4 text-center">
                      <p className="text-vis-secondary text-sm">Alternative style</p>
                    </div>
                    <button className="w-full h-11 rounded-full border border-vis-purple-light text-vis-purple hover:border-vis-purple transition-all">
                      Secondary Action
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Inputs & Controls */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4">Inputs & Controls</h2>
              <div className="space-y-6 max-w-md">
                {/* Slider */}
                <div className="space-y-2">
                  <label className="text-sm text-vis-secondary">Teal Slider</label>
                  <input
                    type="range"
                    className="w-full h-2 rounded-full bg-gray-800/70 accent-vis-teal-400"
                    defaultValue="50"
                  />
                </div>

                {/* Scale Buttons */}
                <div className="space-y-2">
                  <label className="text-sm text-vis-secondary">Scale Selection</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-11 rounded-lg bg-vis-teal-500 text-white font-semibold">
                      2x
                    </button>
                    <button className="h-11 rounded-lg border border-vis-default text-vis-secondary hover:bg-vis-hover transition-all">
                      4x
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div className="space-y-8">
            {/* Gradients */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Gradients
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-32 rounded-lg bg-vis-gradient-teal flex items-center justify-center">
                  <p className="text-white font-semibold">Teal Gradient</p>
                </div>
                <div className="h-32 rounded-lg bg-vis-gradient-purple flex items-center justify-center">
                  <p className="text-white font-semibold">Purple Gradient</p>
                </div>
                <div className="h-32 rounded-lg bg-vis-gradient-brand flex items-center justify-center">
                  <p className="text-white font-semibold">Brand Gradient</p>
                </div>
                <div className="h-32 rounded-lg bg-vis-gradient-brand-reverse flex items-center justify-center">
                  <p className="text-white font-semibold">Brand Reverse</p>
                </div>
                <div className="h-32 rounded-lg bg-vis-gradient-panel flex items-center justify-center border border-vis-default">
                  <p className="text-vis-primary font-semibold">Panel Gradient</p>
                </div>
                <div className="h-32 rounded-lg bg-vis-gradient-card flex items-center justify-center border border-vis-default">
                  <p className="text-vis-primary font-semibold">Card Gradient</p>
                </div>
              </div>
            </section>

            {/* Glows & Shadows */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4">Glows & Shadows</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-vis-teal font-semibold">Teal Glows</h3>
                  <div className="h-20 rounded-lg bg-vis-teal-500 shadow-vis-glow-teal-sm flex items-center justify-center">
                    <p className="text-white text-sm">Small</p>
                  </div>
                  <div className="h-20 rounded-lg bg-vis-teal-500 shadow-vis-glow-teal-md flex items-center justify-center">
                    <p className="text-white text-sm">Medium</p>
                  </div>
                  <div className="h-20 rounded-lg bg-vis-teal-500 shadow-vis-glow-teal-lg flex items-center justify-center">
                    <p className="text-white text-sm">Large</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-vis-purple font-semibold">Purple Glows</h3>
                  <div className="h-20 rounded-lg bg-vis-purple-500 shadow-vis-glow-purple-sm flex items-center justify-center">
                    <p className="text-white text-sm">Small</p>
                  </div>
                  <div className="h-20 rounded-lg bg-vis-purple-500 shadow-vis-glow-purple-md flex items-center justify-center">
                    <p className="text-white text-sm">Medium</p>
                  </div>
                  <div className="h-20 rounded-lg bg-vis-purple-500 shadow-vis-glow-purple-lg flex items-center justify-center">
                    <p className="text-white text-sm">Large</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-vis-primary font-semibold">Combined</h3>
                  <div className="h-20 rounded-lg bg-vis-teal-500 shadow-vis-glow-teal flex items-center justify-center">
                    <p className="text-white text-sm">Shadow + Glow</p>
                  </div>
                  <div className="h-20 rounded-lg bg-vis-purple-500 shadow-vis-glow-purple flex items-center justify-center">
                    <p className="text-white text-sm">Shadow + Glow</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Mesh Background */}
            <section className="bg-vis-panel rounded-xl border border-vis-default p-6">
              <h2 className="text-2xl font-bold text-vis-primary mb-4">Mesh Background</h2>
              <div className="h-64 rounded-lg bg-vis-gradient-mesh border border-vis-default flex items-center justify-center">
                <p className="text-vis-primary font-semibold bg-vis-panel px-6 py-3 rounded-lg border border-vis-teal-light">
                  Ambient Mesh Gradient Background
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-vis-divider-light">
          <p className="text-vis-muted text-sm">
            VIS Brand Color System v1.0.0 • Based on Upscale Panel Design
          </p>
        </footer>
      </div>
    </div>
  );
};
