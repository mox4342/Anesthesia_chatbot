# AI Anesthesia Assistant

A production-ready AI-powered anesthesia assistant providing evidence-based information, drug calculators, and emergency protocols for healthcare professionals.

## Features

- **AI Chat Assistant**: Claude-powered chat interface for anesthesia-related queries
- **Drug Calculators**: Weight-based dosing for propofol, rocuronium, and local anesthetics
- **Emergency Protocols**: Quick access to critical procedures (MH, LAST, anaphylaxis)
- **Medical News**: Real-time PubMed integration for latest research
- **Clinical Context**: Add patient-specific context for more relevant responses
- **Offline Support**: Emergency protocols available without internet connection

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Claude API key (get one from [Anthropic Console](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anesthesia_chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Claude API key:
```env
VITE_CLAUDE_API_KEY=your_actual_claude_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Configuration

### API Keys

Edit `.env.local` to add your API keys:

```env
# Required for AI chat functionality
VITE_CLAUDE_API_KEY=sk-ant-api03-xxxxx

# Optional: For higher PubMed rate limits
VITE_PUBMED_API_KEY=

# Future integration
VITE_UPTODATE_API_KEY=
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run test     # Run tests
```

## Usage

### AI Chat Assistant

1. Navigate to the Chat page
2. Enter your anesthesia-related question
3. Optionally add clinical context (age, procedure, comorbidities)
4. Receive evidence-based responses with PubMed citations

### Drug Calculators

1. Go to Calculators page
2. Enter patient weight
3. Select calculation parameters (elderly, RSI, with/without epinephrine)
4. Get instant weight-based dosing calculations

### Emergency Protocols

1. Visit Protocols page
2. Click on any protocol to expand
3. Follow step-by-step instructions
4. Print protocol for offline use

### Medical News

1. Go to News page
2. Browse recent anesthesia articles from PubMed
3. Search for specific topics
4. Click to view full articles on PubMed

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State Management**: React Query (TanStack Query)
- **AI**: Claude API (Anthropic)
- **Medical Data**: PubMed E-utilities API
- **Storage**: LocalStorage for caching, IndexedDB for offline protocols

## Security & Compliance

- Medical disclaimer displayed prominently on all pages
- No patient data storage
- API keys stored in environment variables
- All medical information for educational purposes only
- CORS-compliant API requests

## Development

### Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── services/       # API services
│   ├── api/       # API integrations
│   └── cache/     # Cache management
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

### Adding New Features

1. Create feature branch
2. Add new components in appropriate directory
3. Update routing in App.tsx if needed
4. Add API service if required
5. Update types and utilities
6. Test thoroughly
7. Update documentation

## Troubleshooting

### Claude API Not Working

1. Check your API key in `.env.local`
2. Ensure the key starts with `sk-ant-`
3. Verify your Anthropic account has API access
4. Check browser console for specific error messages

### PubMed Search Issues

- PubMed has rate limits (3 requests/second without API key)
- Cached results expire after 6 hours
- Use the Refresh button to clear cache

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is for educational purposes only. Always consult institutional protocols and primary medical literature for clinical decisions.

## Support

For issues or questions, please open an issue on GitHub.

## Disclaimer

This tool is for educational and informational purposes only. Clinical judgment should always supersede AI recommendations. Always verify critical information from primary sources and institutional protocols.