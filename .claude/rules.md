# Project Rules

## Working Directory

**IMPORTANT**: This project's working directory is `/Users/jorge/Code Projects/aiclosetassistant`

Always use this full path when running bash commands to ensure you're in the correct directory.

## Terminology

**cf = Cloudflare** - When the user mentions "cf", they mean Cloudflare (Pages, Workers, D1, R2, etc.)

## Always Read Documentation First

**CRITICAL**: Before starting ANY task in this project, you MUST read the PROJECT_DOCUMENTATION.md file located at the root of this repository.

This file contains:
- Current project state and architecture
- Recent changes and breaking changes
- Known issues and solutions
- Deployment instructions
- API endpoint documentation
- Database schema
- Important decisions and why they were made

**Path**: `/Users/jorge/Code Projects/aiclosetassistant/PROJECT_DOCUMENTATION.md`

After completing ANY task, you MUST update the PROJECT_DOCUMENTATION.md file with:
- **Accurate timestamp** - Use `date +"%Y-%m-%d %H:%M %Z"` command (NEVER guess!)
- What was changed and why
- Any new issues discovered
- Status of the change (deployed, testing, etc.)
- Update BOTH the header "Last Updated" AND add entry to "Recent Breaking Changes"

## Development Philosophy

1. **Documentation First** - Always update PROJECT_DOCUMENTATION.md
2. **Always Use Latest Tools** - Migrate to latest versions immediately
3. **Test Before Committing** - Verify changes work before deployment
4. **Deploy After Major Changes** - Use `npx opennextjs-cloudflare deploy`
