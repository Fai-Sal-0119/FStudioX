# FStudioX Version 15 Design Brief

## Tone & Purpose
Premium creative editing suite for Instagram/CapCut-level users. Industrial/pro aesthetic. Dark theme maximizes content preview and minimizes visual fatigue during long editing sessions. Red accent used sparingly for highest-priority interactions (export, save, active states).

## Palette
| Token | OKLCH | Hex | Purpose |
|---|---|---|---|
| Background | 0.09 0.008 265 | #0b0b0f | Deep navy, editor base, primary surface |
| Surface | — | #14151c | Tool panels, cards, elevated states |
| Elevated | — | #1f2230 | Buttons, secondary states, interactive elements |
| Border | — | #2a2d3a | Dividers, 1px separation lines |
| Accent (Red) | 0.51 0.22 27 | #e11d2e | CTAs, export, active states, primary highlight |
| Accent Hover | — | #b81422 | Red interactive state, focus state |
| Foreground | 0.98 0 0 | #ffffff | Primary text, high contrast |
| Secondary | — | #c9ceda | Secondary UI text, inactive states |
| Muted | — | #8b93a7 | Disabled, tertiary text, subtle labels |

## Typography
| Role | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Display/Heading | Bricolage Grotesque | 600–800 | 28–40px | Bold, editorial, red accent sparingly |
| Subheading | Bricolage Grotesque | 600 | 18–24px | Section titles, navigation |
| Body/UI | DM Sans | 400–600 | 14–16px | Touch-friendly, readable in tools panel |
| Mono/Code | General Sans | 400 | 12–14px | Code, technical labels |

## Structural Zones
| Zone | Treatment | Border | Notes |
|---|---|---|---|
| Home Page | Dark premium bg with 3 animated floating orbs, 4 editor cards below | None | Landing page hero: FStudioX branding, direct editor access |
| Editor Cards | Elevated bg, 4 prominent cards (Photo/Video/Text/Design/Music/Projects) | Inactive: #2a2d3a; Active: #e11d2e + red glow | Direct action entry, hover effect, smooth transition |
| Bottom Nav Bar | Surface bg, fixed at bottom with safe-area-inset | Top border #2a2d3a | 6 tabs, red active indicator, touch-safe sizing |
| Editor Preview | Primary bg, centered content, full-width top half | None | 50vh on desktop, minimal borders, focus on content |
| Tool Panel | Surface bg, tabbed interface (Trim/Effects/Adjustments/Overlays/Export), scrollable | Top border | Bottom half 50vh, organized by workflow, horizontal tab scroll |
| Footer | Minimal surface treatment, credits + Instagram link | Top border | Compact, consistent across pages |

## Component Patterns
- **Buttons**: Primary (red bg, white text, glow on hover), Secondary (elevated bg, outline), Tertiary (ghost, transparent)
- **Tabs**: Text labels, active underline in red, smooth 0.2s transition
- **Sliders**: Range inputs with red accent-color, large touch targets
- **Cards**: Elevated bg, 1px border, no shadow (elevation via color hierarchy)
- **Bottom Nav**: Fixed position, 6 items, red active indicator top border, 3px underline
- **Overlays**: Modals with elevated bg, no backdrop blur (clear content priority)

## Motion
- **Transitions**: 0.2s cubic-bezier(0.4, 0, 0.2, 1) for color/background changes
- **Interactions**: Scale 0.98 on button press, fade-in 0.6s on entry
- **Scrolling**: Smooth, no parallax or animation on scroll (content is focus)
- **Floating Orbs**: 3 orbs at 10s/13s/16s cycles, ease-in-out, opacity 0.6–0.95, scale 0.96–1.12

## Elevation & Depth
- No shadows (reduce visual noise in editing context)
- Depth via background color hierarchy: primary < surface < elevated
- 1px borders in muted gray (#2a2d3a) for subtle separation
- Red glow (0 0 20px rgba(225,29,46,0.25)) reserved for primary actions

## Spacing & Rhythm
- Base unit: 4px (Tailwind default)
- Content padding: 16px (mobile), 24px (desktop)
- Bottom nav padding: 12px top, 16px bottom + safe-area-inset
- Gap between sections: 12–20px (mobile-first)
- Tool tabs: 12px vertical, 16px horizontal padding

## Signature Detail
**Home page**: Premium dark navy background with 3 animated floating red-tinted orbs (10s/13s/16s smooth cycles). 4 large editor cards below (Photo/Video/Text/Design) with direct tap entry, red border + glow on hover. No "Open Studio" step — instant access. **Editor workspace**: Instagram/CapCut-style split layout — content preview top half (50vh), tool panel bottom half (50vh) with tabbed interface. Bottom nav fixed at bottom, 6 tabs with red active indicator. Red accent sparingly: only on CTAs, active states, and hover effects. **Font stack**: Bricolage Grotesque display (bold, editorial), DM Sans body (refined, readable), General Sans mono (technical). Mobile-first, touch-safe buttons (min 44px), safe-area-inset for notch/home indicator.

## Responsive
- Mobile: Full-screen stack, fixed bottom nav, preview full height, tools expandable/scrollable
- Tablet (768px+): 50/50 split, bottom nav fixed
- Desktop (1024px+): Split layout with optional sidebar for projects

## Constraints
- No gradients on UI elements (solid colors only)
- No box-shadows except red glow on primary actions (0 0 20px rgba(225,29,46,0.25))
- Max 3 interactive colors: white (text), red (accent), secondary grey (muted)
- Tool panels scroll vertically, never horizontal scroll
- Bottom nav always visible, 64px min height with safe-area-inset
- Export always visible in toolbar
- Fonts loaded via @font-face from /assets/fonts/
