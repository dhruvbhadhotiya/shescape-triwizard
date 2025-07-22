import { Colors, ColorKeys } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKeys // ✅ Updated to include `tabBar`, `tabBarBorder`
) {
  const theme = useColorScheme() ?? "light";

  return props[theme] ?? Colors[theme][colorName] ?? Colors.light[colorName];
}
