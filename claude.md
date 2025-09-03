# Claude Instructions for Construction PM Notion Project

## Project Overview
This is a construction project management system that creates Notion templates via API automation. The system includes GitHub Actions deployment, mobile optimization, and enterprise integrations.

## Key Commands
- `npm run lint` - Run linting
- `npm run test` - Run test suite
- `npm run deploy` - Deploy construction template
- `npm run validate` - Validate configuration

## Project Structure
- `src/api/` - Core API implementation
- `src/schemas/` - Database schemas
- `src/integrations/` - Third-party integrations
- `src/utils/` - Utility functions
- `scripts/` - Deployment scripts
- `configs/` - Tier configurations

## Development Guidelines
- Follow existing patterns in the codebase
- Use the Notion API client from `@notionhq/client`
- Implement proper error handling and logging
- Respect API rate limits with delays
- Create mobile-optimized views

## Database Creation Order
1. clients
2. subcontractors  
3. projects
4. materials
5. permits
6. inspections

## Environment Variables Required
- `NOTION_TOKEN` - Notion API token
- `CLIENT_NAME` - Client company name
- `DEPLOYMENT_TIER` - starter/professional/enterprise
- `INCLUDE_SAMPLE_DATA` - true/false
- `CUSTOM_DOMAIN` - Optional custom domain
- `INTEGRATION_CONFIG` - JSON array of integrations

## Testing
- Run integration tests before deployment
- Test API rate limiting
- Validate all database schemas
- Test mobile view configurations

## Mobile Optimization
- Create "📱 Today's Work" view for field workers
- Add "📦 Deliveries Today" view for materials
- Include "🚨 Safety Alerts" for compliance
- Use mobile-friendly property names

## Security Notes
- Never commit API tokens
- Validate all user inputs
- Use proper error handling
- Follow construction industry compliance standards