import type { AssetPreset, AssetCategory } from '../../types/brand';

export const ASSET_PRESETS: AssetPreset[] = [
  // Social
  { id: 'ig-post', name: 'Instagram Post', category: 'social', type: 'instagram_post', width: 1080, height: 1080, aspectLabel: '1:1', description: 'Square feed post', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'ig-story', name: 'Instagram Story', category: 'social', type: 'instagram_story', width: 1080, height: 1920, aspectLabel: '9:16', description: 'Vertical story frame', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'x-post', name: 'X / Twitter Post', category: 'social', type: 'x_post', width: 1200, height: 675, aspectLabel: '16:9', description: 'In-feed image', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'x-banner', name: 'X / Twitter Banner', category: 'social', type: 'x_banner', width: 1500, height: 500, aspectLabel: '3:1', description: 'Profile banner', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'li-post', name: 'LinkedIn Post', category: 'social', type: 'linkedin_post', width: 1200, height: 627, aspectLabel: '1.91:1', description: 'Professional feed graphic', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'li-banner', name: 'LinkedIn Banner', category: 'social', type: 'linkedin_banner', width: 1584, height: 396, aspectLabel: '4:1', description: 'Profile cover', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', category: 'social', type: 'youtube_thumbnail', width: 1280, height: 720, aspectLabel: '16:9', description: 'Video thumbnail', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'wa-profile', name: 'WhatsApp Profile', category: 'social', type: 'whatsapp_profile', width: 500, height: 500, aspectLabel: '1:1', description: 'Business profile photo frame', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'wa-status', name: 'WhatsApp Status', category: 'social', type: 'whatsapp_status', width: 1080, height: 1920, aspectLabel: '9:16', description: 'Status story', supportsTemplate: true, prefersImageGeneration: true },
  // Business
  { id: 'biz-card', name: 'Business Card', category: 'business', type: 'business_card', width: 1050, height: 600, aspectLabel: '3.5×2', description: 'Front card layout', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'letterhead', name: 'Letterhead', category: 'business', type: 'letterhead', width: 816, height: 1056, aspectLabel: 'Letter', description: 'Document header sheet', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'pres-cover', name: 'Presentation Cover', category: 'business', type: 'presentation_cover', width: 1920, height: 1080, aspectLabel: '16:9', description: 'Deck title slide', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'email-header', name: 'Email Header', category: 'business', type: 'email_header', width: 600, height: 200, aspectLabel: '3:1', description: 'Email banner', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'proposal-cover', name: 'Proposal Cover', category: 'business', type: 'proposal_cover', width: 816, height: 1056, aspectLabel: 'Letter', description: 'Proposal title page', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'invoice-header', name: 'Invoice Header', category: 'business', type: 'invoice_header', width: 800, height: 200, aspectLabel: '4:1', description: 'Document header bar', supportsTemplate: true, prefersImageGeneration: false },
  // Website
  { id: 'web-hero', name: 'Website Hero', category: 'website', type: 'website_hero', width: 1920, height: 1080, aspectLabel: '16:9', description: 'Homepage hero visual', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'web-banner', name: 'Website Banner', category: 'website', type: 'website_banner', width: 1600, height: 400, aspectLabel: '4:1', description: 'Section or promo banner', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'og-image', name: 'Open Graph Image', category: 'website', type: 'og_image', width: 1200, height: 630, aspectLabel: '1.91:1', description: 'Social share card', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'section-bg', name: 'Section Background', category: 'website', type: 'section_background', width: 1920, height: 800, aspectLabel: 'Wide', description: 'Subtle section backdrop', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'service-card', name: 'Service Card Graphic', category: 'website', type: 'service_card', width: 800, height: 600, aspectLabel: '4:3', description: 'Card illustration area', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'favicon', name: 'Favicon / Icon', category: 'website', type: 'favicon', width: 512, height: 512, aspectLabel: '1:1', description: 'App and browser icon', supportsTemplate: true, prefersImageGeneration: false },
  // Marketing
  { id: 'promo', name: 'Promotional Graphic', category: 'marketing', type: 'promotional', width: 1200, height: 1200, aspectLabel: '1:1', description: 'General promo visual', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'product-ad', name: 'Product Advertisement', category: 'marketing', type: 'product_ad', width: 1200, height: 1500, aspectLabel: '4:5', description: 'Product-focused ad', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'event', name: 'Event Graphic', category: 'marketing', type: 'event', width: 1920, height: 1080, aspectLabel: '16:9', description: 'Event announcement', supportsTemplate: true, prefersImageGeneration: true },
  { id: 'announce', name: 'Announcement', category: 'marketing', type: 'announcement', width: 1200, height: 675, aspectLabel: '16:9', description: 'News or update graphic', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'campaign', name: 'Campaign Visual', category: 'marketing', type: 'campaign', width: 1920, height: 1080, aspectLabel: '16:9', description: 'Campaign key visual', supportsTemplate: true, prefersImageGeneration: true },
  // Graphics
  { id: 'abstract-bg', name: 'Abstract Background', category: 'graphics', type: 'abstract_background', width: 1920, height: 1080, aspectLabel: '16:9', description: 'Brand abstract field', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'pattern', name: 'Pattern', category: 'patterns', type: 'pattern', width: 800, height: 800, aspectLabel: 'Tile', description: 'Seamless-style pattern tile', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'texture', name: 'Texture', category: 'backgrounds', type: 'texture', width: 1200, height: 1200, aspectLabel: '1:1', description: 'Subtle brand texture', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'deco-shape', name: 'Decorative Shape', category: 'graphics', type: 'decorative_shape', width: 600, height: 600, aspectLabel: '1:1', description: 'Accent shape motif', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'icon-set', name: 'Icon Set', category: 'icons', type: 'icon_set', width: 512, height: 512, aspectLabel: 'Grid', description: 'Four brand icons', supportsTemplate: true, prefersImageGeneration: false },
  { id: 'illustration-dir', name: 'Illustration Direction', category: 'graphics', type: 'illustration_direction', width: 1200, height: 800, aspectLabel: '3:2', description: 'Style board frame', supportsTemplate: true, prefersImageGeneration: false },
];

export const ASSET_CATEGORIES: { id: AssetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'business', label: 'Business' },
  { id: 'website', label: 'Website' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'backgrounds', label: 'Backgrounds' },
  { id: 'icons', label: 'Icons' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'other', label: 'Other' },
];

export function getPreset(id: string): AssetPreset | undefined {
  return ASSET_PRESETS.find((p) => p.id === id);
}

export function presetsByCategory(category: AssetCategory | 'all'): AssetPreset[] {
  if (category === 'all') return ASSET_PRESETS;
  return ASSET_PRESETS.filter((p) => p.category === category);
}
