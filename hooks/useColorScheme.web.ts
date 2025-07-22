import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Improved Color Scheme Hook:
 * - Avoids flickering due to hydration issues
 * - Uses system colorScheme immediately
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const [hydratedScheme, setHydratedScheme] = useState(colorScheme);

  useEffect(() => {
    setHydratedScheme(colorScheme);
  }, [colorScheme]);

  return hydratedScheme ?? 'light';  // Ensures 'light' as fallback
}

