import { useEffect } from 'react';
import { useAccessibility } from './useAccessibility';

export interface ShortcutMap {
  [keyCombo: string]: () => void;
}

/**
 * useKeyboardNavigation Hook
 * Registers global and scoped accessible hotkeys without trapping or preventing standard browser behavior.
 */
export function useKeyboardNavigation(shortcuts: ShortcutMap = {}, enabled: boolean = true) {
  const { preferences } = useAccessibility();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Do not trigger custom shortcuts if the user is typing inside an editable field unless Alt is held
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      // Build key identifier e.g. "Alt+A", "Escape", "ArrowRight"
      const parts: string[] = [];
      if (event.altKey) parts.push('Alt');
      if (event.ctrlKey) parts.push('Ctrl');
      if (event.shiftKey) parts.push('Shift');
      
      const keyFormatted = event.key.length === 1 ? event.key.toUpperCase() : event.key;
      parts.push(keyFormatted);

      const combo = parts.join('+');

      if (shortcuts[combo] && (!isInput || event.altKey)) {
        event.preventDefault();
        shortcuts[combo]();
      } else if (shortcuts[event.key] && !isInput) {
        event.preventDefault();
        shortcuts[event.key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, preferences.keyboardOnlyMode]);
}
