// components/Header.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  ZoomOut,
  RotateCcw,
  Eye,
  Sun,
  Moon,
  Menu,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import logoDark from "../assets/AI-POD-lite-logo.png";
import logoLight from "../assets/AI-POD-lite-logo-light.png";
import { useState } from "react";
import { useTheme } from "next-themes";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [count, setCount] = useState(2);
  const [zoom, setZoom] = useState(100);
  const [showMasks, setShowMasks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const increment = () => setCount(prev => Math.min(prev + 1, 10000));
  const decrement = () => setCount(prev => Math.max(prev - 1, 1));
  
  const handleGenerate = () => {
    console.log('Generate clicked with count:', count);
    // Add your generation logic here
  };

  const handleSearch = () => {
    setShowSearch(!showSearch);
    console.log('Search toggled:', !showSearch);
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 10));
    console.log('Zoom out to:', zoom - 10);
  };

  const handleReset = () => {
    console.log('Reset/Rotate clicked');
    // Add reset/rotate logic here
  };

  const handleMasksToggle = () => {
    setShowMasks(!showMasks);
    console.log('Masks toggled:', !showMasks);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    console.log('Theme toggled to:', theme === 'dark' ? 'light' : 'dark');
  };

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
    console.log('Menu toggled:', !showMenu);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-background text-foreground border-b border-border transition-colors">
      {/* Left section: Logo, Version and Number Input with Invoke */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <img
            src={logoLight}
            alt="AI POD Lite Logo"
            className="h-9 dark:hidden"
          />
          <img
            src={logoDark}
            alt="AI POD Lite Logo"
            className="h-9 hidden dark:block"
          />
        </div>
        
       <div className="flex items-center gap-3"> 
          <div className="w-px h-5 bg-border" />
        </div> 
        
        {/* Merged: Invoke Button with Number Input */}
        <div className="flex items-center bg-secondary border-border rounded">
          {/* Invoke Button Section */}
          <Button 
            variant="ghost"
            onClick={handleGenerate}
            className="flex items-center gap-2 hover:bg-accent rounded-none px-4 h-9 bg-transparent m-0 border-0"
          >
                        <Sparkles className="w-4 h-4 text-purple-400" />

                        <div className="w-px h-4 bg-border" />

            <span className="text-sm font-medium">Generate</span>
          </Button>
          
          {/* Number Input Section */}
          <div className="flex items-center px-2 py-1 border-l border-border">
            <Input
              type="number"
              min="1"
              max="10000"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
              className="w-12 h-7 bg-transparent border-none text-foreground text-center text-sm focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
            />
            <div className="flex flex-col -space-y-1 ml-1">
              <button
                onClick={increment}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={decrement}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle section: Control Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSearch}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
        >
          <Search className="w-4 h-4" />
        </Button>
        
        <span className="text-sm font-medium px-3">{zoom}%</span>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleZoomOut}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleReset}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost"
          onClick={handleMasksToggle}
          className={`flex items-center gap-2 hover:bg-accent rounded-lg px-3 py-2 h-9 border border-purple-500/30 ${showMasks ? 'bg-purple-500/20' : ''}`}
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">Masks</span>
        </Button>
      </div>

      {/* Right section: Theme and Menu Icons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleThemeToggle}
          className="hover:bg-accent rounded-lg w-9 h-9 border bg-blue-500/20 border-blue-500/50 dark:bg-yellow-500/20 dark:border-yellow-500/50"
        >
          <Moon className="w-4 h-4 text-blue-400 dark:hidden" />
          <Sun className="w-4 h-4 text-yellow-400 hidden dark:block" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleMenuToggle}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  );
}