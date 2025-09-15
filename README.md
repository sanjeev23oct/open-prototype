# AI Prototype Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

An AI-powered code generator that creates preview-ready HTML5 + JavaScript prototypes with streaming generation and surgical editing capabilities.

## ✨ Features

### Core Generation
- 🤖 **AI-Powered Generation**: Support for multiple AI models (DeepSeek, OpenAI, Claude, etc.) via LiteLLM
- 🔄 **Real-time Streaming**: Live progress updates with WebSocket integration
- 📋 **Intelligent Planning**: Automated complexity analysis and generation planning
- 🎯 **Multi-Model Support**: Switch between different AI providers seamlessly

### Editing & Preview
- ✂️ **Surgical Editing**: Precise element selection and diff-patch modifications
- 📱 **Responsive Preview**: Desktop, tablet, and mobile preview modes with device frames
- 🖼️ **Interactive Preview**: Element highlighting and live interaction
- 🔍 **Live Code Streaming**: Watch code generation in real-time

### Code Management
- 📝 **Code Workspace**: Syntax highlighting with multi-language support
- 🗂️ **Section Navigation**: Organized code sections for easy browsing
- 📚 **Auto Documentation**: Generate comprehensive project documentation
- 💾 **Project Management**: Save, load, and manage multiple projects
- 📤 **Export Options**: Download as ZIP or individual files

### Quality & Performance
- 🧪 **Built-in Testing**: Quality assurance and automated testing
- 📊 **Performance Monitoring**: Real-time performance metrics and optimization
- 🚨 **Error Recovery**: Comprehensive error handling and recovery mechanisms
- 🔄 **Undo/Redo**: Full operation history with undo/redo support

### User Experience
- 🎨 **Beautiful UI**: Modern interface with TailwindCSS styling
- 📱 **Fully Responsive**: Optimized for all device sizes
- 🌙 **Theme Support**: Dark and light mode options
- 🔔 **Smart Notifications**: Toast notifications and loading states
- ⚡ **Optimized Performance**: Lazy loading and React 18 optimizations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript + WebSocket
- **Database**: PostgreSQL + Prisma ORM
- **AI**: LiteLLM Gateway integration

## Quick Start

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and LiteLLM configuration
   ```

3. **Set up database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Project Structure

```
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand state management
│   │   ├── services/      # API and WebSocket services
│   │   └── types/         # TypeScript type definitions
├── backend/           # Node.js + Express backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic services
│   │   ├── models/        # Database models
│   │   ├── websocket/     # WebSocket handlers
│   │   └── utils/         # Utility functions
└── prisma/           # Database schema and migrations
```

## Development

- All code files are kept under 300 lines for maintainability
- Modular architecture with clear separation of concerns
- TypeScript for type safety across the entire stack
- Comprehensive error handling and recovery mechanisms

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this project
- Built with amazing open source technologies
- Special thanks to the AI/ML community for inspiration

## 📞 Support

- 📧 Email: sanjeev23oct@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/sanjeev23oct/open-prototype/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/sanjeev23oct/open-prototype/discussions)

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by [Sanjeev Kumar](https://github.com/sanjeev23oct)**