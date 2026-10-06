/**
 * Design tokens derived from approved Visual Identity.
 * Generic enough for Forge website generation.
 */

import type { BrandProfile, DesignTokens } from '../../types/brand';

function color(brand: BrandProfile, role: string, fallback: string): string {
  return (
    brand.visualIdentity?.colors?.palette.find((c) => c.role === role)?.hex ||
    fallback
  );
}

export function buildDesignTokens(brand: BrandProfile): DesignTokens {
  const type = brand.visualIdentity?.typography;
  const visual = brand.visualDirection;
  const isDark =
    visual === 'Dark Tech' ||
    visual === 'Futuristic' ||
    visual === 'Minimal' ||
    visual === 'Luxury';

  const primary = color(brand, 'primary', '#62E6FF');
  const secondary = color(brand, 'secondary', '#8B5CF6');
  const accent = color(brand, 'accent', '#F5C542');
  const background = color(brand, 'background', isDark ? '#08090B' : '#FAFAFA');
  const surface = color(brand, 'surface', isDark ? '#111318' : '#FFFFFF');
  const text = color(brand, 'text', isDark ? '#F2F4F7' : '#111318');
  const muted = color(brand, 'muted', isDark ? '#9AA5B1' : '#6B7280');
  const border = color(brand, 'border', isDark ? '#2A2F38' : '#E5E7EB');
  const success = color(brand, 'success', '#34D399');
  const warning = color(brand, 'warning', '#FBBF24');
  const error = color(brand, 'error', '#F87171');

  const radiusScale =
    visual === 'Playful' || visual === 'Organic'
      ? { sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '9999px' }
      : visual === 'Minimal' || visual === 'Corporate'
        ? { sm: '4px', md: '6px', lg: '10px', xl: '14px', full: '9999px' }
        : { sm: '6px', md: '10px', lg: '14px', xl: '18px', full: '9999px' };

  return {
    colors: {
      primary,
      secondary,
      accent,
      background,
      surface,
      surfaceElevated: color(brand, 'surfaceElevated', isDark ? '#161A21' : '#FFFFFF'),
      text,
      muted,
      border,
      overlay: color(brand, 'overlay', 'rgba(0,0,0,0.5)'),
      success,
      warning,
      error,
      primaryContrast: color(brand, 'primaryContrast', '#0A0C10'),
      secondaryContrast: color(brand, 'secondaryContrast', '#FFFFFF'),
    },
    typography: {
      fonts: {
        display: type?.displayFont || 'Inter',
        heading: type?.headingFont || 'Inter',
        body: type?.bodyFont || 'Inter',
        ui: type?.uiFont || 'Inter',
        mono: type?.monoFont || 'JetBrains Mono',
        displayStack: type?.displayStack || 'system-ui, sans-serif',
        headingStack: type?.headingStack || 'system-ui, sans-serif',
        bodyStack: type?.bodyStack || 'system-ui, sans-serif',
        uiStack: type?.uiStack || 'system-ui, sans-serif',
        monoStack: type?.monoStack || 'ui-monospace, monospace',
      },
      weights: type?.weights || [400, 500, 600, 700],
      scale: type?.scale || [
        { name: 'Display', size: '2.5rem', weight: 650, lineHeight: '1.1', letterSpacing: '-0.03em' },
        { name: 'Heading', size: '1.5rem', weight: 600, lineHeight: '1.25' },
        { name: 'Body', size: '1rem', weight: 400, lineHeight: '1.6' },
        { name: 'UI', size: '0.875rem', weight: 500, lineHeight: '1.4' },
        { name: 'Caption', size: '0.75rem', weight: 500, lineHeight: '1.4' },
      ],
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      section: '80px',
    },
    radius: {
      sm: radiusScale.sm,
      md: radiusScale.md,
      lg: radiusScale.lg,
      xl: radiusScale.xl,
      full: radiusScale.full,
      button: radiusScale.md,
      card: radiusScale.lg,
      input: radiusScale.sm,
    },
    effects: {
      shadows: {
        sm: isDark
          ? '0 1px 2px rgba(0,0,0,0.4)'
          : '0 1px 2px rgba(0,0,0,0.06)',
        md: isDark
          ? '0 4px 12px rgba(0,0,0,0.45)'
          : '0 4px 12px rgba(0,0,0,0.08)',
        lg: isDark
          ? '0 12px 32px rgba(0,0,0,0.5)'
          : '0 12px 32px rgba(0,0,0,0.1)',
      },
      borders: {
        subtle: `1px solid ${border}`,
        strong: isDark
          ? '1px solid rgba(255,255,255,0.14)'
          : '1px solid rgba(0,0,0,0.12)',
      },
      blur: {
        sm: '4px',
        md: '12px',
      },
      gradients: {
        primarySoft: `linear-gradient(135deg, ${primary}22, ${secondary}18)`,
      },
    },
    components: {
      button: {
        primaryBg: primary,
        primaryColor: color(brand, 'primaryContrast', '#0A0C10'),
        secondaryBg: 'transparent',
        secondaryBorder: border,
        radius: radiusScale.md,
        paddingX: '16px',
        paddingY: '10px',
        fontWeight: '600',
      },
      card: {
        background: surface,
        border: `1px solid ${border}`,
        radius: radiusScale.lg,
        padding: '16px',
      },
      input: {
        background: background,
        border: `1px solid ${border}`,
        radius: radiusScale.sm,
        color: text,
        placeholderColor: muted,
      },
    },
  };
}

/** CSS custom properties string for download */
export function designTokensToCss(tokens: DesignTokens, prefix = 'brand'): string {
  const lines: string[] = [':root {'];
  for (const [k, v] of Object.entries(tokens.colors)) {
    lines.push(`  --${prefix}-color-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.typography.fonts)) {
    lines.push(`  --${prefix}-font-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.spacing)) {
    lines.push(`  --${prefix}-space-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.radius)) {
    lines.push(`  --${prefix}-radius-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.effects.shadows)) {
    lines.push(`  --${prefix}-shadow-${k}: ${v};`);
  }
  lines.push('}');
  lines.push('');
  lines.push('/* Generated by VEXDYN Brand-in-a-Box */');
  return lines.join('\n');
}
