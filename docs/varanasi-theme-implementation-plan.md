# 🔱 Varanasi Theme Implementation Plan
## Gopuram Frames & Trishul Underlines

---

## 📋 Overview

This plan outlines the implementation of culturally-inspired visual elements for the Varanasi theme:
- **Gopuram frames** on movie cards (temple tower silhouette)
- **Trishul underlines** for section headers (trident symbol)
- Updated color palette matching Varanasi aesthetic

---

## 🎨 Design Specifications

### Color Palette

| Element | Color | Hex Code |
|---------|-------|----------|
| Background | Ghats night | `#0E0B07` |
| Text | Light cream | `#F5F3EE` |
| Gopuram | Gold | `#C9A24D` |
| Trishul | Gold | `#C9A24D` |
| Accent | Deep red | `#6A1B1A` |
| Stone | Ash tone | `#8D8373` |
| White (night mode) | Soft white | `#EEEAE2` |

### Design Principles

✅ **Line-art / silhouette** - No detailed photos  
✅ **Monotone** - Gold, stone, ash tones  
✅ **SVG-based** - Perfect scaling, no blur  
✅ **Minimal** - Thin lines, symmetrical, no textures  

---

## 📁 File Structure

```
public/
  ├── gopuram.svg          # Temple tower silhouette (line art)
  └── trishul.svg          # Trident underline (line art)
```

### SVG Requirements

**Gopuram SVG:**
- Dimensions: ~80px width × 40px height (viewBox)
- Style: Minimal line-art, symmetrical
- Color: Will be controlled via CSS `fill` or `stroke`
- Background: Transparent
- Format: Optimized SVG (no unnecessary elements)

**Trishul SVG:**
- Dimensions: ~120px width × 14px height (viewBox)
- Style: Minimal line-art, symmetrical trident
- Color: Will be controlled via CSS `fill` or `stroke`
- Background: Transparent
- Format: Optimized SVG (horizontal orientation)

---

## 🎯 Implementation Steps

### Step 1: Create SVG Assets

**Location:** `public/gopuram.svg` and `public/trishul.svg`

**Requirements:**
- Export from provided SVG files (Untitled-1 for trishul, Untitled-2 for gopuram)
- Optimize SVG code (remove metadata, unnecessary groups)
- Ensure paths use `currentColor` or specific fill colors
- Test at various sizes (mobile to desktop)

**Example SVG structure:**
```svg
<svg viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
  <path d="..." fill="currentColor" stroke="none"/>
</svg>
```

---

### Step 2: Update Color Scheme

**File:** `app/globals.css`

**Changes:**
- Update Varanasi theme CSS variables to match new palette
- Update both `.varanasi-theme` and `.varanasi` classes
- Ensure consistency across all theme instances

**Color Updates:**
```css
.varanasi-theme {
  --background: #0E0B07;        /* Changed from #0A0604 */
  --foreground: #F5F3EE;         /* Changed from #F5E6C8 */
  --primary: #C9A24D;            /* Changed from #B45309 */
  --accent: #6A1B1A;            /* New accent color */
  /* ... other colors ... */
}
```

---

### Step 3: Gopuram Frame for Movie Cards

**File:** `app/globals.css`

**Implementation:**
- Use CSS `::before` pseudo-element on `.glass-card` within `.varanasi` theme
- Position absolutely at top center of card
- Add padding-top to card to accommodate gopuram
- Include hover animation (fade-in effect)

**CSS Structure:**
```css
/* Varanasi Theme - Gopuram Frame on Movie Cards */
.varanasi .glass-card {
  position: relative;
  padding-top: 40px; /* Space for gopuram */
}

.varanasi .glass-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 40px;
  background: url("/gopuram.svg") no-repeat center;
  background-size: contain;
  opacity: 0.9;
  z-index: 1;
  transition: opacity 0.3s ease;
}

.varanasi .glass-card:hover::before {
  opacity: 1;
  filter: drop-shadow(0 0 8px rgba(201, 162, 77, 0.4));
}
```

**Note:** Ensure movie poster images start below the gopuram (adjust card structure if needed).

---

### Step 4: Trishul Underline for Section Headers

**File:** `app/globals.css`

**Implementation:**
- Replace current `::before` and `::after` text decorations (॥ ॥)
- Use `::after` pseudo-element with SVG background
- Position below text, centered
- Add subtle glow effect

**CSS Structure:**
```css
/* Varanasi Theme - Trishul Underline */
.varanasi .section-title::before {
  content: ""; /* Remove text decoration */
}

.varanasi .section-title::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 120px;
  height: 14px;
  background: url("/trishul.svg") no-repeat center;
  background-size: contain;
  opacity: 0.9;
  filter: drop-shadow(0 0 6px rgba(201, 162, 77, 0.6));
}

.varanasi .section-title {
  position: relative;
  display: inline-block;
  padding-bottom: 18px; /* Space for trishul */
}
```

**Also update:** `.varanasi-theme` class with same styles.

---

### Step 5: Animation & Polish

**File:** `app/globals.css`

**Animations:**
1. **Gopuram fade-in on card hover**
2. **Trishul glow on section enter** (optional, via Intersection Observer if needed)
3. **Smooth transitions** for all effects

**CSS Additions:**
```css
/* Gopuram hover animation */
.varanasi .glass-card::before {
  transition: opacity 0.3s ease, filter 0.3s ease;
}

/* Trishul glow effect */
.varanasi .section-title::after {
  transition: filter 0.3s ease, opacity 0.3s ease;
}
```

---

### Step 6: Component Integration Points

**Files to verify (already use `.glass-card` and `.section-title`):**

1. **Movie Cards:**
   - `app/page.tsx` (home page)
   - `app/genre/[id]/page.tsx`
   - `app/imdb-8-plus/page.tsx`
   - `app/rt-80-plus/page.tsx`
   - `app/watched/page.tsx`
   - `app/watchlist/page.tsx`
   - `app/components/PersonFilmography.tsx`

2. **Section Headers:**
   - `app/movie/[id]/page.tsx` (multiple sections)
   - All pages with `.section-title` class

**No component changes needed** - CSS-only implementation!

---

### Step 7: Performance Optimization

**SVG Optimization:**
- Minimize SVG file size (< 5KB each)
- Use `currentColor` for easy theme switching
- Remove unnecessary metadata

**CSS Performance:**
- Use `background-size: contain` for proper scaling
- Limit animations to transform/opacity (GPU-accelerated)
- Cache SVG files (browser will cache automatically)

**Loading Strategy:**
- SVGs load once, cached by browser
- No additional HTTP requests per card/header
- Scales perfectly on all devices

---

## 🧪 Testing Checklist

- [ ] Gopuram appears on all movie cards in Varanasi theme
- [ ] Trishul appears under all section titles in Varanasi theme
- [ ] Colors match specified palette
- [ ] Hover animations work smoothly
- [ ] Responsive on mobile (SVGs scale correctly)
- [ ] No layout shifts when SVGs load
- [ ] Works in both light and dark modes
- [ ] No performance degradation
- [ ] SVG colors match theme (gold #C9A24D)
- [ ] Other themes (toxic, rama) unaffected

---

## 📐 Size Specifications

| Element | Width | Height | Max Size |
|---------|-------|--------|----------|
| Gopuram | 80px | 40px | ≤ 40px height |
| Trishul | 120px | 14px | ≤ 14px height |

**Responsive Scaling:**
- Mobile: Scale down proportionally
- Tablet: Standard size
- Desktop: Standard size
- Use `background-size: contain` for automatic scaling

---

## 🎨 Visual Hierarchy

```
┌─────────────────────────┐
│    [Gopuram SVG]        │  ← 40px height
├─────────────────────────┤
│                         │
│    Movie Poster         │
│                         │
├─────────────────────────┤
│    Movie Title          │
└─────────────────────────┘

Section Title
─────────────
  [Trishul SVG]           ← 14px height, centered
```

---

## 🔄 Migration Notes

**Current State:**
- Varanasi theme uses text decorations: `॥ ... ॥`
- Movie cards have no frame decoration
- Colors: `#B45309` (orange), `#F5E6C8` (cream)

**New State:**
- Varanasi theme uses Trishul SVG underline
- Movie cards have Gopuram frame at top
- Colors: `#C9A24D` (gold), `#F5F3EE` (light cream), `#0E0B07` (dark background)

**Backward Compatibility:**
- Other themes (toxic, rama) remain unchanged
- If SVG files missing, fallback to current text decorations

---

## 🚀 Implementation Order

1. ✅ Create/optimize SVG files → `public/`
2. ✅ Update color scheme → `globals.css`
3. ✅ Add Gopuram styling → `globals.css`
4. ✅ Add Trishul styling → `globals.css`
5. ✅ Add animations → `globals.css`
6. ✅ Test across all pages
7. ✅ Performance check
8. ✅ Final polish

---

## 📝 Notes

- **SVG Color Control:** Use CSS `filter` or inline SVG with `currentColor` for theme-aware coloring
- **Accessibility:** Ensure sufficient contrast (gold on dark background)
- **Browser Support:** SVG backgrounds supported in all modern browsers
- **Fallback:** If SVG fails to load, elements gracefully degrade (no broken images)

---

## ✨ Expected Result

When Varanasi theme is active:
- Every movie card has a subtle Gopuram frame at the top
- Every section header has a Trishul underline
- Colors evoke Varanasi ghats at night (dark, gold accents)
- Smooth, tasteful animations enhance the experience
- Culturally authentic without being kitschy

---

**Status:** Ready for implementation  
**Estimated Time:** 2-3 hours  
**Complexity:** Medium (CSS-focused, minimal component changes)

