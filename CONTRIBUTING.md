# Contributing to AI Prototype Generator

Thank you for your interest in contributing to the AI Prototype Generator! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/sanjeev23oct/open-prototype.git
   cd open-prototype
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## 📋 How to Contribute

### Reporting Issues

- Use the GitHub issue tracker
- Check if the issue already exists
- Provide detailed reproduction steps
- Include environment information (OS, Node.js version, etc.)

### Suggesting Features

- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Explain why it would be valuable to users

### Code Contributions

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Coding Standards

### General Guidelines

- **File Size**: Keep files under 300 lines for maintainability
- **Modularity**: Use clear separation of concerns
- **TypeScript**: Use strict typing throughout
- **Error Handling**: Implement comprehensive error handling

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Component Guidelines

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use TypeScript interfaces for props
- Implement proper error boundaries

### Backend Guidelines

- Use async/await for asynchronous operations
- Implement proper error middleware
- Use Prisma for database operations
- Follow RESTful API conventions

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for utilities and services
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for good test coverage (>80%)

## 📚 Documentation

### Code Documentation

- Use JSDoc for functions and classes
- Document complex algorithms and business logic
- Keep README files up to date

### API Documentation

- Document all API endpoints
- Include request/response examples
- Update OpenAPI specification when adding endpoints

## 🔄 Pull Request Process

1. **Before submitting**
   - Ensure all tests pass
   - Run linting and type checking
   - Update documentation if needed
   - Rebase on the latest main branch

2. **PR Description**
   - Clearly describe what the PR does
   - Reference related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Review Process**
   - PRs require at least one approval
   - Address all review comments
   - Keep the PR focused and atomic

## 🏗️ Architecture Guidelines

### Frontend Architecture

- **State Management**: Use Zustand for global state
- **Routing**: Use React Router for navigation
- **Styling**: Use TailwindCSS for consistent styling
- **API Calls**: Use custom hooks for data fetching

### Backend Architecture

- **Routing**: Organize routes by feature
- **Services**: Keep business logic in service layers
- **Database**: Use Prisma for type-safe database access
- **WebSocket**: Use for real-time features

### Database Guidelines

- Use Prisma migrations for schema changes
- Follow naming conventions (camelCase for fields)
- Add proper indexes for performance
- Use transactions for data consistency

## 🚦 Commit Message Guidelines

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(frontend): add surgical editing component
fix(backend): resolve WebSocket connection issues
docs: update API documentation
refactor(services): improve code generation logic
```

## 🌟 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

## 📞 Getting Help

- Join our discussions on GitHub
- Ask questions in issues with the "question" label
- Check existing documentation and issues first

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to make AI Prototype Generator better! 🎉