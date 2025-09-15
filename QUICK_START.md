# 🚀 Quick Start Guide

Get up and running with AI Prototype Generator in minutes!

## 📋 Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL** database
- **AI Provider API Key** (OpenAI, Anthropic, DeepSeek, etc.)

## ⚡ 5-Minute Setup

### 1. Clone and Install

```bash
git clone https://github.com/sanjeev23oct/open-prototype.git
cd open-prototype
npm run install:all
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database (use your PostgreSQL connection string)
DATABASE_URL="postgresql://username:password@localhost:5432/ai_prototype_generator"

# AI Provider (choose one)
OPENAI_API_KEY="your-openai-key"
# OR
ANTHROPIC_API_KEY="your-anthropic-key"
# OR
DEEPSEEK_API_KEY="your-deepseek-key"

# LiteLLM (optional - for advanced model management)
LITELLM_BASE_URL="http://localhost:4000"
LITELLM_API_KEY="your-litellm-key"
```

### 3. Database Setup

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Development

```bash
npm run dev
```

🎉 **That's it!** Open http://localhost:3000 and start generating prototypes!

## 🐳 Docker Quick Start

Prefer Docker? Even easier:

```bash
git clone https://github.com/sanjeev23oct/open-prototype.git
cd open-prototype
cp .env.example .env
# Edit .env with your API keys
docker-compose up -d
```

## 🎯 First Prototype

1. **Open the app** at http://localhost:3000
2. **Enter a description**: "Create a modern landing page for a SaaS product"
3. **Click Generate** and watch the magic happen!
4. **Edit surgically** by clicking on elements in the preview
5. **Export your code** when you're happy with the result

## 🔧 Configuration Options

### AI Models

The app supports multiple AI providers:

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3, Claude-2
- **DeepSeek**: DeepSeek-Coder, DeepSeek-Chat
- **Custom**: Any LiteLLM-compatible model

### Database Options

- **Local PostgreSQL**: Full control, best for development
- **Supabase**: Free hosted PostgreSQL with auth
- **Railway**: Simple managed PostgreSQL
- **AWS RDS**: Production-grade managed database

## 📚 Next Steps

### Learn More
- 📖 [Full Documentation](README.md)
- 🗺️ [Project Roadmap](ROADMAP.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)

### Get Help
- 💬 [GitHub Discussions](https://github.com/sanjeev23oct/open-prototype/discussions)
- 🐛 [Report Issues](https://github.com/sanjeev23oct/open-prototype/issues)
- 📧 [Email Support](mailto:sanjeev23oct@gmail.com)

### Join the Community
- ⭐ [Star the repo](https://github.com/sanjeev23oct/open-prototype) if you find it useful
- 🍴 [Fork and contribute](CONTRIBUTING.md) to make it better
- 📢 Share your prototypes and feedback

## 🔍 Troubleshooting

### Common Issues

**Database connection failed?**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database if needed
npm run db:reset
```

**Build errors?**
```bash
# Clean install
npm run clean:install

# Check Node.js version
node --version  # Should be 18+
```

**API errors?**
- Verify your API keys in `.env`
- Check API provider rate limits
- Ensure sufficient API credits

### Performance Tips

- Use **DeepSeek** for cost-effective generation
- Enable **caching** for faster repeated requests
- Use **surgical editing** instead of full regeneration
- **Export frequently** to avoid losing work

## 🎉 Success!

You're now ready to create amazing prototypes with AI! 

**Happy prototyping!** 🚀

---

**Need help?** Don't hesitate to reach out to our friendly community!