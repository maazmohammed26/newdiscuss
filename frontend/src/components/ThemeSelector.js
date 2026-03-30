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
import { Sun, Moon, Code } from 'lucide-react';

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
    { id: 'light', name: 'Light', icon: Sun },
    { id: 'dark', name: 'Dark', icon: Moon },
    { id: 'discuss', name: 'Discuss', icon: Code },
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              data-testid={`theme-option-${t.id}`}
              onClick={() => handleThemeChange(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 border transition-all text-xs font-medium ${
                isActive
                  ? 'border-[#2563EB] bg-[#2563EB] text-white dark:border-[#60A5FA] dark:bg-[#60A5FA] discuss:border-[#EF4444] discuss:bg-[#EF4444]'
                  : 'border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#64748B] dark:text-[#94A3B8] discuss:text-[#9CA3AF] hover:border-[#2563EB] dark:hover:border-[#60A5FA] discuss:hover:border-[#EF4444]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#1a1a1a] discuss:border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5] flex items-center gap-2">
              <Code className="w-5 h-5 discuss:text-[#EF4444]" />
              Switch to Discuss Theme?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
              This will apply a tech-inspired dark theme with monospace fonts and red accents. 
              You can switch back anytime from your profile settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => { setShowConfirm(false); setPendingTheme(null); }}
              className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] dark:hover:bg-[#475569] discuss:bg-[#262626] discuss:text-[#F5F5F5] discuss:border-[#333333]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmThemeChange}
              className="bg-[#EF4444] text-white hover:bg-[#DC2626] font-medium"
            >
              Apply Discuss Theme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
