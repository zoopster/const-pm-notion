# Contributing to Construction PM - Notion Integration

Thank you for your interest in contributing to this construction project management system!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd const-pm-notion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Notion API credentials
   ```

4. **Run setup script**
   ```bash
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Quality
- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Format code: `npm run format`
- Run tests: `npm test`
- Check coverage: `npm run test:coverage`

### Testing
- Unit tests: Located in `src/tests/`
- E2E tests: Located in `src/tests/e2e/`
- Run all tests: `npm run validate`

### Documentation
- Generate API docs: `npm run docs`
- Update JSDoc comments for all public functions
- Keep README.md updated

## Project Structure

```
src/
├── api/          # Notion API integration
├── schemas/      # Data validation schemas
├── tests/        # Test files
└── utils/        # Utility functions

configs/          # Environment configurations
docs/             # Documentation
scripts/          # Build and setup scripts
```

## Coding Standards

- Follow ESLint configuration
- Use Prettier for formatting  
- Write JSDoc comments for functions
- Maintain test coverage above 70%
- Use semantic commit messages

## Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run quality checks: `npm run validate`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a pull request

## Need Help?

- Check existing issues
- Review documentation in `docs/`
- Ask questions in discussions