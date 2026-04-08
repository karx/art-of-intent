# Project Structure

**Version:** 1.0.0

## 📁 Directory Organization

```
art-of-intent/
├── src/                    # Source code
│   ├── js/                 # JavaScript modules
│   │   ├── version.js      # Centralized version management
│   │   ├── config.js       # API configuration
│   │   ├── game.js         # Core game logic
│   │   ├── firebase-*.js   # Firebase integration
│   │   ├── share-card-generator.js  # Share card SVG generation
│   │   ├── sound-effects.js         # Audio management
│   │   └── ui-components.js         # Reusable UI components
│   ├── css/                # Stylesheets
│   │   ├── dos-theme.css   # DOS aesthetic theme
│   │   └── styles.css      # Additional styles
│   └── assets/             # Images, icons, media
│       └── og_image.png    # Open Graph preview image
├── tests/                  # Unit tests
│   └── share-card-generator.test.js
├── docs/                   # Documentation (PARA Method)
│   ├── README.md           # Documentation guide
│   ├── projects/           # Active initiatives
│   │   ├── SHARE_CARD_FEATURE.md
│   │   ├── MOBILE_LAYOUT_REDESIGN.md
│   │   └── OPENGRAPH_TESTING.md
│   ├── areas/              # Standards & guidelines
│   │   ├── DOS_THEME_GUIDELINES.md
│   │   ├── FIREBASE_ARCHITECTURE.md
│   │   ├── SCHEMA_ORG.md
│   │   ├── TRACKING.md
│   │   └── VALIDATION.md
│   ├── resources/          # Reference materials
│   │   ├── FIREBASE_SETUP.md
│   │   ├── SETUP.md
│   │   ├── AGENTS.md
│   │   ├── ANALYTICS_PLAN.md
│   │   ├── OPENGRAPH.md
│   │   └── IMAGES.md
│   └── archives/           # Completed work
│       ├── FINAL_UPDATES_SUMMARY.md
│       ├── FIREBASE_IMPLEMENTATION.md
│       ├── RELEASE_NOTES.md
│       └── [other completed docs]
├── index.html              # Main game page
├── about.html              # About page
├── history.html            # Session history page
├── test-firebase.html      # Firebase testing page
├── package.json            # Project metadata
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
├── README.md               # Main documentation
└── PROJECT_STRUCTURE.md    # This file
```

## 🌱 PARA Method

We organize documentation using the PARA method for knowledge management:

### Projects/ - Active Initiatives
Time-bound work with specific goals and deadlines.
- Current features in development
- Sprint planning documents
- Implementation plans

### Areas/ - Standards & Guidelines
Ongoing responsibilities and standards to maintain.
- Architecture decisions
- Design guidelines
- Operational procedures
- Quality standards

### Resources/ - Reference Materials
Knowledge base and reference documentation.
- Technical guides
- API documentation
- Research notes
- External resources

### Archives/ - Historical Records
Completed projects and deprecated documentation.
- Completed feature implementations
- Old versions
- Deprecated documentation
- Historical decisions

## 📝 Version Management

Version is centralized in `src/js/version.js`:

```javascript
const APP_VERSION = {
    major: 1,
    minor: 0,
    patch: 0,
    get full() { return `${this.major}.${this.minor}.${this.patch}`; },
    get display() { return `v${this.full}`; }
};
```

Version is automatically synced across:
- UI display (`index.html`)
- Share cards (`share-card-generator.js`)
- Package metadata (`package.json`)
- Documentation

## 🔄 File Organization Principles

1. **Source Separation**: All source code in `src/`
2. **Test Isolation**: All tests in `tests/`
3. **Documentation Structure**: PARA method in `docs/`
4. **Root Simplicity**: Only essential files in root
5. **Asset Organization**: Media files in `src/assets/`

## 🚀 Development Workflow

```bash
# Serve locally
npm run serve

# Run tests
npm test

# Update version
# 1. Edit src/js/version.js
# 2. Update package.json
# 3. Commit with version tag
```

## 🌐 Entry Points

- **Main Game**: `index.html`
- **About**: `about.html`
- **History**: `history.html`
- **Firebase Test**: `test-firebase.html`

## 📦 Dependencies

The project uses vanilla JavaScript with no build step required. External dependencies:
- Firebase SDK (CDN)
- Google Fonts (CDN)
- Gemini API (runtime)

## 🧪 Testing

Tests are located in `tests/` directory:
- Unit tests for individual modules
- Integration tests for Firebase
- Manual testing pages

Run tests with: `npm test`

## 🌱 Digital Garden Philosophy

This project is maintained as a living digital garden:
- Documents evolve with the project
- Regular pruning and reorganization
- Cross-linking related concepts
- Version-controlled knowledge
- PARA method for organization

## 📚 Key Documentation

- **Main README**: [README.md](../README.md)
- **Setup Guide**: [docs/resources/SETUP.md](docs/resources/SETUP.md)
- **DOS Theme**: [docs/areas/DOS_THEME_GUIDELINES.md](docs/areas/DOS_THEME_GUIDELINES.md)
- **Firebase**: [docs/areas/FIREBASE_ARCHITECTURE.md](docs/areas/FIREBASE_ARCHITECTURE.md)
- **Tracking**: [docs/areas/TRACKING.md](docs/areas/TRACKING.md)

---

*Last updated: 2025-01-24*
