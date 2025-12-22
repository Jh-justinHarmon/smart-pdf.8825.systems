# Smart PDF Companion - Design Guidelines

## Design Approach
**System**: Material Design + Linear-inspired productivity aesthetic
**Rationale**: Utility-focused PDF editing tool requires clean, functional interface with strong information hierarchy. Material Design provides robust component patterns while Linear's minimalist approach ensures focus on content.

## Core Design Principles
1. **Content-First**: PDF viewer takes visual priority, panels support without competing
2. **Clear Hierarchy**: Three-zone layout (PDF, Manifest, Chat) with distinct visual weights
3. **Purposeful Interaction**: Every UI element serves PDF editing workflow
4. **Responsive Intelligence**: Collapse/expand panels based on viewport, never compromise PDF viewing

## Typography System
**Font Families** (via Google Fonts CDN):
- Primary: Inter (400, 500, 600) - UI, body text, labels
- Monospace: JetBrains Mono (400, 500) - manifest data, version IDs

**Scale**:
- Headings: text-xl (20px) for panel titles, text-lg (18px) for section headers
- Body: text-base (16px) for chat, manifest content
- Labels: text-sm (14px) for metadata, timestamps
- Captions: text-xs (12px) for version history, file info

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12 (p-2, m-4, gap-6, py-8, px-12)

**Grid Structure**:
```
Desktop (lg+): Three-column [PDF: 60% | Manifest: 20% | Chat: 20%]
Tablet (md): Two-column [PDF: 70% | Sidebar Tabs: 30%]
Mobile: Single column, bottom sheet for manifest/chat
```

**Container Strategy**:
- Full viewport height (h-screen)
- No inner scrolling for main layout
- PDF viewer: overflow-auto within allocated space
- Panels: Independent scroll zones

## Component Library

**1. PDF Viewer Zone**
- Full-height canvas with padding-8
- Drop zone overlay: Dashed border (border-2), centered icon + text
- Zoom controls: Floating bottom-right, rounded-full buttons
- Page navigation: Floating bottom-center, compact pill design

**2. Manifest Panel**
- Fixed-width sidebar (w-80 on desktop)
- Section cards with border-l-4 accent for visual separation
- Collapsible sections using Lucide ChevronDown icons
- Metadata grid: 2-column layout for key-value pairs (text-sm labels, text-base values)
- Version timeline: Vertical line with circle markers

**3. Maestra Chat Overlay**
- Similar width to manifest (w-80)
- Message bubbles: User (bg-gray-100, rounded-lg), Maestra (bg-blue-50)
- Input zone: Fixed bottom, border-t, px-4 py-3
- Context indicator: Pill showing selected text excerpt (max 60 chars)
- Suggestion cards: Border, rounded-lg, hover:shadow transition

**4. Toolbar**
- Top bar: h-14, border-b
- Left: File name + Smart PDF badge
- Center: Mode indicator (View/Edit)
- Right: Actions (Download, Share, Settings icons)

**5. Navigation**
- Tabs for Manifest/Chat on tablet/mobile
- Active tab: border-b-2 accent
- Icons + labels for clarity

**6. Modals/Overlays**
- Preview modal: max-w-4xl, centered, backdrop blur
- Confirmation dialogs: max-w-md, centered
- Toast notifications: top-right, slide-in animation

## Icons
**Library**: Lucide Icons (via CDN)
**Usage**:
- File operations: FileText, Upload, Download
- Editing: Edit3, RotateCcw, Check, X
- Navigation: ChevronLeft/Right/Down, Menu
- Chat: MessageSquare, Send, RefreshCw
- Status: AlertCircle, CheckCircle, Info

## Interaction Patterns

**Text Selection in PDF**:
- On selection: Floating toolbar appears near cursor
- Toolbar: "Rewrite with Maestra" button (bg-blue-600, text-white)
- Click triggers chat panel opening + context binding

**Rewrite Flow**:
1. Chat opens with selected text highlighted (bg-yellow-100)
2. Suggestions appear as cards below chat
3. Preview button: border-blue-600, hover:bg-blue-50
4. Apply button: bg-blue-600 (only appears in preview state)

**Version History**:
- Timeline on manifest panel
- Click version: PDF updates, highlight changes (yellow overlay)
- Diff view toggle: Show/hide changed sections

## Responsive Breakpoints
- Mobile: < 768px (Stack all, bottom sheets)
- Tablet: 768px - 1024px (PDF + tabbed sidebar)
- Desktop: > 1024px (Three-column full layout)

## Accessibility
- Keyboard navigation: Tab through panels, Escape to close modals
- Focus indicators: 2px ring-blue-500 offset
- ARIA labels on all icon buttons
- Screen reader announcements for state changes

## Images
**None required** - This is a functional tool focused on PDF content. No hero images or marketing imagery needed. Interface relies on typography, clean spacing, and purposeful interactions.