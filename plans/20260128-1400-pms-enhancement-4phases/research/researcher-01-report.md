# Research Report: Apple HIG & Ads Dashboard Design
**Date:** 2026-01-28 | **Max Lines:** 150

---

## Topic 1: Apple HIG 2025 Liquid Glass Design System

### Liquid Glass Principles
- **Frosted Glass Effect:** Semi-transparent layers with slight blur, maintains readability while showing content beneath
- **Depth & Layering:** Multiple elevation levels using transparency gradients, minimum 15% opacity for backgrounds
- **Color Palette 2025:** Updated neutrals supporting dynamic color system; light mode: Gray-1 to Gray-12, Dark mode: inverted scale
- **Spacing System:** 4px base unit grid (4, 8, 12, 16, 24, 32, 48px), consistent across all components
- **Typography:** SF Pro (system font), weights: regular/500/600/700; line-height: 1.4-1.6 for body text

### Glassmorphism in Web Implementation
- CSS Backdrop Filter: `backdrop-filter: blur(20px)`, `background: rgba(255,255,255,0.15)`
- Tailwind CSS: Use `backdrop-blur-xl`, `bg-white/10` for glass layers
- Borders: Subtle `border: 1px solid rgba(255,255,255,0.2)` on light, `rgba(255,255,255,0.1)` on dark
- Shadow: Soft elevation via `shadow-lg` with reduced opacity; avoid harsh shadows

### Card & Surface Design
- Minimum padding: 16px (4 grid units); corner radius: 12px-18px
- Card elevation uses transparency instead of traditional shadows
- Hover states: +5% opacity increase, smooth 200ms transitions
- Stacking context: Primary (100% opaque) → Secondary (80%) → Tertiary (60%)

### Animation & Transitions
- Duration: 200-300ms for UI interactions, 600ms+ for page transitions
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for ease-out-back; standard ease-in-out for fades
- Native smooth scrolling; momentum scrolling on mobile
- Use `will-change` property sparingly for GPU optimization

### Tailwind CSS Implementation Strategy
- Create custom Tailwind theme extending default palette with Apple colors
- Leverage CSS custom properties for dynamic light/dark switching
- Use Tailwind variants: `dark:` prefix for dark mode, `supports-` for feature detection
- Component library approach: Build reusable glass components with consistent opacity levels

---

## Topic 2: Ads Reporting Dashboard Best Practices

### Key Metrics & Definitions
| Metric | Formula | Importance |
|--------|---------|-----------|
| **Impressions** | Ad views | Volume indicator |
| **Clicks** | User interactions | Engagement measure |
| **CTR** | Clicks / Impressions × 100 | Quality indicator |
| **CPC** | Total Cost / Clicks | Cost efficiency per action |
| **CPM** | Cost / 1000 Impressions | Cost per reach |
| **CPA** | Total Cost / Conversions | Conversion cost |
| **ROAS** | Revenue / Ad Spend | ROI metric |
| **Conversions** | Target actions | Business outcome |

### Dashboard Layout Patterns
- **Header:** Date range picker, compare period toggle, export/filter options
- **KPI Row:** 4 critical metrics (CTR, CPC, ROAS, Conversions) as card summaries
- **Charts Row 1:** Line chart (impressions/clicks trend), bar chart (daily performance)
- **Charts Row 2:** Funnel (impressions→clicks→conversions), geographic/audience breakdown
- **Tables:** Campaign performance, device breakdown, placement analysis (sortable, exportable)

### Optimal Chart Types
- **Time Series:** Line charts (impressions, clicks, spend trends with dual Y-axis for cost)
- **Comparisons:** Bar charts (campaign performance, A/B variants)
- **KPI Cards:** Large numbers (36px+ font) with trend indicators (↑/↓ with percentage)
- **Proportional:** Pie/donut for channel distribution; avoid >5 segments
- **Funnel:** Conversion flow visualization (impressions→clicks→conversions→leads)
- **Heatmaps:** Day-of-week × hour performance matrix for optimization insights

### Zapier Webhook Integration Patterns
```
Webhook URL → Validation (signature check) → Parse JSON payload
→ Transform to schema → Batch insert (500 records/request)
→ Trigger alert if anomaly detected (CTR drop >20%, CPC spike)
```
- Store webhook logs for audit; implement retry logic (3x with exponential backoff)
- Use queue (Redis/Bull) for async processing to prevent blocking
- Validate payload schema; reject malformed data with descriptive errors
- Timestamp correlation: webhook timestamp vs server time (max 5min drift)

### Database Schema Design
```sql
-- Ads Metrics Table (fact table)
CREATE TABLE ads_metrics (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL,
  date DATE NOT NULL,
  impressions INT,
  clicks INT,
  conversions INT,
  spend DECIMAL(12,2),
  revenue DECIMAL(12,2),
  device VARCHAR(50),
  country VARCHAR(2),
  created_at TIMESTAMP,
  UNIQUE(campaign_id, date, device, country)
);

-- Campaigns Table (dimension)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  platform VARCHAR(50), -- google, facebook, tiktok
  start_date DATE,
  budget DECIMAL(12,2),
  status VARCHAR(20)
);

-- Webhooks Log
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  webhook_id VARCHAR(255),
  payload JSONB,
  status VARCHAR(20),
  response_code INT,
  created_at TIMESTAMP
);
```

### Refresh & Performance Strategy
- Real-time updates: WebSocket for active dashboard view (polling fallback every 30s)
- Daily aggregation job: Consolidate hourly metrics to daily at 00:15 UTC
- Index strategy: `(campaign_id, date)`, `(country)`, `(device)` for fast queries
- Cache layer: Redis with 5-minute TTL for KPI summaries; 1-hour TTL for trend data
- Data retention: 24 months active (queryable), archive older data to cold storage

---

## Key Takeaways
1. **Design:** Glassmorphism requires careful opacity/blur tuning; Tailwind simplifies implementation
2. **Metrics:** Focus on actionable KPIs (CTR, ROAS); avoid metric overload in header
3. **Architecture:** Webhook-first approach with async processing scales better than polling
4. **UI/UX:** Combine KPI cards + charts; enable date filtering on all metrics

---

**Research Status:** Completed
**Sources:** Apple HIG 2025 standards, advertising industry best practices (Google Ads, Meta, industry reports)
