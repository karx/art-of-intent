# Release Notes - v0.1.0

## 🎉 Initial Release

**Release Date**: October 24, 2025  
**Commit**: a6755d9

---

## What's New

### Core Game
The Art of Intent is a text-based game where you guide "Arty" (an AI haiku bot) to speak target words without using blacklisted words.

**Game Mechanics:**
- 3 target words to find each day
- 5-7 blacklisted words to avoid
- Daily challenges reset at midnight
- Score based on token efficiency
- Win by matching all target words
- Lose by using blacklisted words

### Features

#### 🎮 Gameplay
- Daily word generation with date-based seeding
- Real-time scoring and progress tracking
- Voice input support (Web Speech API)
- Code editor-style text input
- Game over modal with statistics
- Share score functionality

#### 🤖 AI Integration
- Gemini 2.0 Flash API
- Custom "Haiku Bot" system instructions
- Token usage tracking (prompt, output, total)
- Blacklist enforcement in AI responses
- Error handling and retry logic

#### 📊 Analytics
- Comprehensive event tracking
- Session management with unique IDs
- KPI calculations:
  - Success rate
  - Token efficiency
  - Attempt efficiency
  - Completion score
- Detailed metrics:
  - Prompt/response statistics
  - Token breakdown
  - Timing data
  - Event distribution
- JSON-LD export with Schema.org vocabulary

#### 🎨 User Interface
- Dark theme with GitHub-inspired aesthetics
- Responsive layout
- Real-time scorecard
- Response trail with full history
- Target/blacklist word displays
- Export session data button

#### 📚 Documentation
- **README.md**: Game overview and rules
- **SETUP.md**: Complete setup guide
- **TRACKING.md**: Analytics documentation
- **AGENTS.md**: Development guidelines
- **PROJECT_STATUS.md**: Roadmap and wishlist
- **example-session.jsonld**: Sample export

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Quick Start
1. Clone the repository
2. Edit `config.js` and add your API key
3. Run `python3 -m http.server 8000`
4. Open http://localhost:8000
5. Start playing!

See [SETUP.md](./SETUP.md) for detailed instructions.

---

## Technical Details

### Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: Google Gemini 2.0 Flash
- **Storage**: localStorage
- **Export Format**: JSON-LD

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (voice input requires HTTPS)
- Mobile: Responsive design, touch-friendly

### Performance
- Lightweight: ~2,700 lines of code
- No build step required
- Fast load times
- Minimal dependencies

---

## Security Notes

⚠️ **Important**: The current implementation exposes the API key in client-side code. This is suitable for:
- Local development
- Personal use
- Learning/experimentation

For production deployment, implement a backend proxy to secure your API key. See [SETUP.md](./SETUP.md) for details.

---

## Known Limitations

### Current Version
- API key exposed in client-side code
- No rate limiting
- localStorage can be cleared by user
- No user accounts or cloud sync
- Single difficulty level

### Browser Compatibility
- Voice input requires HTTPS (except localhost)
- Web Speech API not supported in all browsers
- localStorage required (no fallback)

---

## What's Next

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for the complete wishlist.

### High Priority
- Backend proxy for API key security
- Difficulty levels (Easy, Medium, Hard, Expert)
- Hint system
- Better visual feedback and animations
- Historical data storage (IndexedDB)

### Medium Priority
- Practice mode
- Challenge mode with time limits
- Leaderboard system
- Expanded word pools
- Multiple AI personalities

### Low Priority
- User accounts
- Achievements system
- Replay functionality
- Tutorial mode
- Mobile app

---

## Contributing

Contributions are welcome! Areas where help is needed:
- Security improvements (backend proxy)
- UI/UX enhancements
- Additional word pools
- Testing and bug reports
- Documentation improvements

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- Built with [Google Gemini API](https://ai.google.dev/)
- Inspired by word puzzle games
- Developed with [Ona](https://ona.com) AI assistance

---

## Support

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: Check the docs folder
- **API Help**: [Gemini API Documentation](https://ai.google.dev/docs)

---

## Stats

- **Files**: 15 core files
- **Lines of Code**: ~2,700
- **Features**: 25+ implemented
- **Documentation**: 1,500+ lines
- **Development Time**: 1 day

---

## Changelog

### v0.1.0 (2025-10-24)
- Initial release
- Core game mechanics
- Gemini API integration
- Comprehensive analytics
- JSON-LD export
- Full documentation

---

**Enjoy the game! 🎯**

Try to guide Arty with the fewest tokens possible. Share your best scores!
