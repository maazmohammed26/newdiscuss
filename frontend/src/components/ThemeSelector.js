import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sun, Moon, Terminal } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, changeTheme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);

  const handleThemeChange = (newTheme) => {
    if (newTheme === 'discuss' && theme !== 'discuss') {
      setPendingTheme(newTheme);
      setShowConfirm(true);
    } else {
      changeTheme(newTheme);
    }
  };

  const confirmThemeChange = () => {
    if (pendingTheme) {
      changeTheme(pendingTheme);
    }
    setShowConfirm(false);
    setPendingTheme(null);
  };

  const themes = [
    { id: 'light', name: 'Light', icon: Sun, desc: 'Clean & bright' },
    { id: 'dark', name: 'Dark', icon: Moon, desc: 'Easy on eyes' },
    { id: 'discuss', name: 'Discuss', icon: Terminal, desc: 'Retro terminal', highlight: true },
  ];

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#00FF88]">
          Choose Theme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                data-testid={`theme-option-${t.id}`}
                onClick={() => handleThemeChange(t.id)}
                className={`relative flex flex-col items-center gap-2 p-3 border-2 transition-all ${
                  isActive
                    ? 'border-[#2563EB] bg-[#2563EB]/10 dark:border-[#60A5FA] dark:bg-[#60A5FA]/10 discuss:border-[#00FF88] discuss:bg-[#00FF88]/10'
                    : 'border-[#E2E8F0] dark:border-[#334155] discuss:border-[#00FF88]/30 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/50 discuss:hover:border-[#00FF88]/50'
                } ${
                  t.highlight && theme !== 'discuss'
                    ? 'ring-2 ring-[#BC4800] ring-offset-2 animate-pulse'
                    : ''
                }`}
              >
                {t.highlight && theme !== 'discuss' && (
                  <span className="absolute -top-2 -right-2 bg-[#BC4800] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#2563EB] dark:text-[#60A5FA] discuss:text-[#00FF88]' : 'text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/60'}`} />
                <div className="text-center">
                  <div className={`text-xs font-semibold ${isActive ? 'text-[#2563EB] dark:text-[#60A5FA] discuss:text-[#00FF88]' : 'text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#00FF88]/80'}`}>
                    {t.name}
                  </div>
                  <div className="text-[10px] text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/50">
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#141414] discuss:border-[#00FF88]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#00FF88] flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Switch to Discuss Theme?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#00FF88]/70">
              This will apply a retro, tech-inspired design with square edges, monospace fonts, and terminal-style aesthetics. 
              You can switch back anytime from your profile settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => { setShowConfirm(false); setPendingTheme(null); }}
              className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] dark:hover:bg-[#475569] discuss:bg-[#1E1E1E] discuss:text-[#00FF88] discuss:border-[#00FF88]/30"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmThemeChange}
              className="bg-[#00FF88] text-[#0a0a0a] hover:bg-[#00DD77] font-bold"
            >
              Apply Discuss Theme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
