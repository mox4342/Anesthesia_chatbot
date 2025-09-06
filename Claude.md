# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Anesthesia Assistant - A production-ready chatbot providing evidence-based anesthesia information using free medical APIs, with future UpToDate integration capability.

## Current Status

**Version 1.1.0 Stable** - Production-ready application with core features implemented and tested.
- ✅ AI Chat with Claude integration (working)
- ✅ Adult drug calculators (3 calculators)
- ✅ Pediatric drug calculator (6 medications)
- ✅ Emergency protocols (3 protocols)
- ✅ PubMed integration for medical news
- ✅ Backend Express server with CORS handling
- ✅ Git version control with branching strategy
- 🚧 Currently developing v1.2.0 features on `feature/v1.2.0-enhancements` branch

## Completed Features (v1.1.0)

### AI Chat Assistant
- ✅ Claude API integration via secure backend proxy
- ✅ Medical context awareness
- ✅ PubMed citation integration
- ✅ Rate limiting (20 requests/minute)
- ✅ Conversation history

### Drug Calculators
#### Adult Calculators
- ✅ Propofol (standard/elderly dosing)
- ✅ Rocuronium (standard/RSI dosing)
- ✅ Local anesthetic maximum doses

#### Pediatric Calculator (v1.1.0)
- ✅ Fentanyl (multiple dosing scenarios)
- ✅ Midazolam (PO/IV/Intranasal routes)
- ✅ Ketamine (induction/sedation/analgesia)
- ✅ Atropine (with minimum dose enforcement)
- ✅ Propofol (pediatric specific)
- ✅ Succinylcholine (IV/IM routes)
- ✅ Age-based safety warnings
- ✅ Maximum dose limits
- ✅ Age categories (neonate/infant/child/adolescent)

### Emergency Protocols
- ✅ Malignant Hyperthermia
- ✅ Local Anesthetic Systemic Toxicity
- ✅ Anaphylaxis

### Medical News
- ✅ PubMed API integration
- ✅ Recent anesthesia literature
- ✅ Caching system (6-hour cache)

### Infrastructure
- ✅ Frontend: React + TypeScript + Vite
- ✅ Backend: Express server (port 3001)
- ✅ Styling: Tailwind CSS
- ✅ API proxy for CORS handling
- ✅ Environment variables for API keys
- ✅ Git version control with tagged releases

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Storage**: IndexedDB (via Dexie.js) for offline protocols
- **API Client**: Axios with interceptors for caching
- **Testing**: Jest + React Testing Library
- **Build**: Vite (preferred over Create React App for better performance)
- **Backend**: Express.js for API proxy and CORS handling

## Commands

### Development Commands
```bash
# Start both frontend and backend servers
npm run dev

# Access the application
# Frontend: http://localhost:5174
# Backend API: http://localhost:3001

# Git branch management
git checkout main                    # Switch to stable v1.1.0
git checkout feature/v1.2.0-enhancements  # Switch to development

# View version history
git log --oneline --graph --all --decorate

# Run individual servers (if needed)
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only

# Build for production
npm run build

# Run tests
npm run test

# Run linter
npm run lint
```

## Architecture

### Directory Structure (Actual Implementation)
```
anesthesia_chatbot/
├── src/
│   ├── components/
│   │   ├── ChatInterface/
│   │   │   ├── index.tsx          ✅ Implemented
│   │   │   └── ChatMessage.tsx    ✅ Implemented
│   │   ├── DrugCalculator/
│   │   │   ├── index.tsx          ✅ Implemented
│   │   │   ├── AdultCalculators.tsx ✅ Implemented
│   │   │   └── PediatricCalculator.tsx ✅ Implemented (v1.1.0)
│   │   ├── EmergencyProtocols/
│   │   │   └── index.tsx          ✅ Implemented
│   │   ├── NewsFeed/
│   │   │   └── index.tsx          ✅ Implemented
│   │   └── common/
│   │       └── MedicalDisclaimer.tsx ✅ Implemented
│   ├── services/
│   │   └── api/
│   │       ├── claude.service.ts  ✅ Implemented
│   │       └── pubmed.service.ts  ✅ Implemented
│   │   └── cache/
│   │       └── cacheManager.ts    ✅ Implemented
│   ├── utils/
│   │   └── calculations/
│   │       ├── drugDosing.ts      ✅ Implemented
│   │       └── pediatricDosing.ts ✅ Implemented (v1.1.0)
│   ├── pages/
│   │   ├── Dashboard.tsx          ✅ Implemented
│   │   ├── Chat.tsx               ✅ Implemented
│   │   ├── Calculators.tsx        ✅ Implemented
│   │   ├── Protocols.tsx          ✅ Implemented
│   │   └── News.tsx               ✅ Implemented
│   └── App.tsx                    ✅ Implemented
├── server.js                      ✅ Backend server implemented
├── .env.local                     ✅ Contains API keys (gitignored)
├── package.json                   ✅ v1.1.0
├── VERSION_HISTORY.md             ✅ Documented
├── BRANCHING_STRATEGY.md          ✅ Documented
└── RELEASE_NOTES_v1.1.0.md       ✅ Created
```

## Version Control

### Current Git Structure
```
main (v1.1.0) - Stable Production
│
├── Tagged Releases:
│   ├── v1.0.0 - Initial release with core features
│   └── v1.1.0 - Added pediatric drug calculator
│
└── feature/v1.2.0-enhancements - Active Development
    └── Planned: Emergency cards, fluid calcs, offline mode
```

### Branch Strategy
- `main`: Always deployable, production-ready code
- `feature/*`: Development branches for new features
- All features tested before merging to main
- Semantic versioning (MAJOR.MINOR.PATCH)

## API Integration Specifications

### PubMed/NCBI E-utilities
```typescript
// Base configuration
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const DEFAULT_RETMAX = 20;

// Search queries to implement
const ANESTHESIA_QUERIES = [
  'anesthesiology[journal] AND ("last 7 days"[PDAT])',
  'regional anesthesia techniques',
  'perioperative complications',
  'pediatric anesthesia',
  'obstetric anesthesia'
];

// Required endpoints
// esearch.fcgi - Search for articles
// esummary.fcgi - Get article summaries
// efetch.fcgi - Get full article data (XML format)
```

### OpenFDA Configuration
```typescript
// Endpoints to implement
const FDA_ENDPOINTS = {
  adverseEvents: '/drug/event.json',
  drugLabel: '/drug/label.json',
  recalls: '/drug/enforcement.json'
};

// Focus on anesthesia-related drugs
const ANESTHESIA_DRUGS = [
  'propofol', 'sevoflurane', 'rocuronium', 
  'succinylcholine', 'fentanyl', 'midazolam',
  'dexmedetomidine', 'sugammadex'
];
```

### Caching Strategy
```typescript
// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  pubmed: 6 * 60 * 60 * 1000,      // 6 hours
  fda: 24 * 60 * 60 * 1000,        // 24 hours
  clinicalTrials: 12 * 60 * 60 * 1000, // 12 hours
  calculations: Infinity,            // Never expire
  protocols: Infinity                // Never expire
};
```

## Next Development Phase (v1.2.0)

### High Priority Features
1. **Emergency Dose Card Generator**
   - One-page printable reference
   - All weight-based emergency drugs
   - OR-ready format

2. **Pediatric Fluid Calculations**
   - 4-2-1 maintenance rule
   - NPO deficit calculation
   - Estimated blood volume

3. **Offline Mode**
   - Service worker implementation
   - Offline access to calculators and protocols
   - Sync indicator

### Medium Priority
- Dark mode toggle
- Print functionality for all calculators
- Export/save calculations
- Weight-based equipment sizing (ETT, blade)

### Future Considerations (v2.0+)
- User accounts and preferences
- Department-specific protocols
- Advanced analytics
- Multi-language support

## Critical Drug Calculations

### Must-Have Calculators
```typescript
// Propofol Induction
const propofolInduction = (weightKg: number, isElderly: boolean) => {
  const mgPerKg = isElderly ? 1.0 : 2.0;
  return weightKg * mgPerKg;
};

// Rocuronium Dosing
const rocuroniumDose = (weightKg: number, rsi: boolean) => {
  const mgPerKg = rsi ? 1.2 : 0.6;
  return weightKg * mgPerKg;
};

// Local Anesthetic Maximum
const localAnestheticMax = (
  weightKg: number, 
  drug: 'lidocaine' | 'bupivacaine',
  withEpi: boolean
) => {
  const maxDoses = {
    lidocaine: { without: 4.5, with: 7 },
    bupivacaine: { without: 2, with: 3 }
  };
  const mgPerKg = withEpi 
    ? maxDoses[drug].with 
    : maxDoses[drug].without;
  return Math.min(weightKg * mgPerKg, 
    drug === 'lidocaine' ? 500 : 175);
};
```

## Emergency Protocols Data Structure

```typescript
interface EmergencyProtocol {
  id: string;
  title: string;
  priority: 'critical' | 'urgent' | 'important';
  lastUpdated: Date;
  steps: ProtocolStep[];
  medications: MedicationDose[];
  references: string[];
}

// Store these permanently in IndexedDB
const CRITICAL_PROTOCOLS = [
  'malignant-hyperthermia',
  'local-anesthetic-toxicity',
  'anaphylaxis',
  'cannot-intubate-cannot-oxygenate',
  'massive-hemorrhage'
];
```

## UI/UX Requirements

### Component Library Usage
- Use Lucide React for icons (lightweight)
- Implement skeleton loaders for all async content
- Error states must suggest alternative actions
- All buttons need loading states

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- High contrast mode compatible
- Screen reader friendly

### Mobile Considerations
- Touch-friendly tap targets (min 44x44px)
- Swipeable calculator inputs
- Collapsible navigation
- Offline indicator prominent on mobile

## Testing Requirements

### Critical Path Tests
```typescript
// Must have 100% test coverage for:
// 1. All drug calculations
// 2. Emergency protocol display
// 3. Offline data retrieval
// 4. API error handling

describe('Drug Calculations', () => {
  test('propofol dosing accuracy', () => {
    expect(propofolInduction(70, false)).toBe(140);
    expect(propofolInduction(70, true)).toBe(70);
  });
});
```

## Environment Variables

```env
# .env.local
VITE_PUBMED_API_KEY=optional_for_higher_limits
VITE_CLAUDE_API_KEY=your_key_here
VITE_UPTODATE_API_KEY=future_integration
VITE_ENABLE_ANALYTICS=false
```

## Performance Targets

- Initial load: < 3 seconds
- API response (cached): < 100ms
- API response (network): < 2 seconds
- Calculator computation: < 50ms
- Protocol access (offline): < 200ms

## Medical Disclaimer Requirements

Every page must display:
```tsx
<MedicalDisclaimer 
  prominent={true}
  dismissible={false}
  position="top"
/>
```

Never store or log:
- Patient identifiers
- Actual patient data
- User medical queries (without consent)

## Troubleshooting

### Common Issues and Solutions

#### CORS Errors
- **Solution**: Backend server handles all API calls
- Server runs on port 3001 with proxy configuration

#### Module Import Errors
- **Issue**: lucide-react icon imports
- **Solution**: Use valid icons (Baby, User, AlertCircle, etc.)
- Clear cache: `rm -rf node_modules/.vite`

#### API Key Issues
- Ensure `.env.local` contains valid keys
- Never commit `.env.local` to git
- Restart dev server after changing environment variables

#### Port Conflicts
- If port 5174 is in use: `npm run dev -- --port 3000`
- If port 3001 is in use: Update server.js and vite.config.ts

## Deployment

### Quick Deploy to Vercel
```bash
# Ensure you're on main branch for stable deployment
git checkout main

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_CLAUDE_API_KEY=your_key_here
```

### Environment Variables Required
- `VITE_CLAUDE_API_KEY`: Anthropic API key (required)
- `VITE_PUBMED_API_KEY`: Optional for higher rate limits

## Future UpToDate Integration Prep

```typescript
// Abstract data source for easy swapping
interface MedicalDataProvider {
  name: string;
  search(query: string): Promise<Article[]>;
  getGuideline(topic: string): Promise<Guideline>;
  isAvailable(): boolean;
}

// Use factory pattern
class DataProviderFactory {
  static getProvider(): MedicalDataProvider {
    if (process.env.VITE_UPTODATE_API_KEY) {
      return new UpToDateProvider();
    }
    return new PubMedProvider();
  }
}
```

## Common Pitfalls to Avoid

1. **Don't forget XML parsing** - PubMed returns XML, not JSON
2. **Implement retry logic** - Medical APIs can be flaky
3. **Cache aggressively** - Reduce API load and improve speed
4. **Version your protocols** - Medical guidelines change
5. **Test calculations extensively** - Lives depend on accuracy

## Success Criteria

- [x] PubMed search returns relevant articles
- [x] All drug calculators match reference values
- [x] Emergency protocols accessible offline
- [x] Mobile responsive design works on iPhone/Android
- [x] Page load time under 3 seconds
- [ ] 90%+ test coverage on critical paths
- [x] Medical disclaimer prominently displayed