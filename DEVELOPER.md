# Developer Guide

This guide covers development, testing, and contributing to the Klipper Config MCP.

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- A running Klipper printer with Moonraker API access (for testing)

### Local Development

1. **Clone and install:**
   ```bash
   git clone https://github.com/grego33/klipper-config-mcp.git
   cd klipper-config-mcp
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your printer's details
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Testing

### Unit Tests
```bash
npm test
npm run test:watch  # Watch mode
```

### Manual Testing with MCP Inspector

Test all tools interactively:
```bash
npx @modelcontextprotocol/inspector tsx src/index.ts
```

With environment variables:
```bash
MOONRAKER_HOST=192.168.1.100 npx @modelcontextprotocol/inspector tsx src/index.ts
```

### Testing with Specific Printer
```bash
MOONRAKER_HOST=192.168.1.100 npm test
```

## Project Structure

```
klipper-config-mcp/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── moonraker-client.ts   # Moonraker API client
│   ├── config-parser.ts      # Klipper config parsing
│   └── types.ts              # TypeScript definitions
├── dist/                     # Built JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Building and Publishing

### Build Process
```bash
npm run clean    # Remove dist/
npm run build    # Compile TypeScript
npm run start    # Run built version
```

### Publishing to npm
```bash
npm login
npm publish --access public
```

## Architecture

### Core Components

1. **MCP Server** (`src/index.ts`)
   - Implements MCP protocol
   - Handles tool calls and responses
   - Error handling and validation

2. **Moonraker Client** (`src/moonraker-client.ts`)
   - HTTP client for Moonraker API
   - Connection management
   - API response parsing

3. **Config Parser** (`src/config-parser.ts`)
   - Parses Klipper configuration files
   - Validates syntax and structure
   - Extracts includes and sections

4. **Type Definitions** (`src/types.ts`)
   - TypeScript interfaces
   - Zod schemas for validation
   - Tool parameter definitions

### Available Tools

1. `get_config_file` - Retrieve configuration file contents
2. `list_config_files` - List all configuration files
3. `parse_config` - Parse and validate configuration syntax
4. `get_config_section` - Extract specific configuration sections
5. `get_printer_status` - Get current printer state
6. `get_system_info` - Retrieve system information

## Error Handling

The MCP server provides detailed error messages for:

- **Connection errors**: When Moonraker is unreachable
- **File not found**: When configuration files don't exist
- **Parse errors**: When configuration syntax is invalid
- **Permission errors**: When API access is denied

## Development Tips

1. **Use console.error() for logging** - console.log() interferes with MCP protocol
2. **Test with real printers** - Moonraker responses vary between setups
3. **Handle edge cases** - Not all printers have the same configuration structure
4. **Validate inputs** - Use Zod schemas for runtime type checking

## Troubleshooting

### Common Issues

1. **Cannot connect to Moonraker**
   - Check printer IP and port
   - Verify Moonraker is running
   - Test with: `curl http://printer-ip:7125/server/info`

2. **Configuration files not found**
   - Check Moonraker has access to config directory
   - Verify file permissions

3. **MCP Inspector connection errors**
   - Make sure no other instances are running
   - Check for port conflicts
   - Try restarting the inspector

### Debug Mode

Enable verbose logging:
```bash
DEBUG=klipper-config-mcp npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use meaningful commit messages

### Testing Requirements

- All new features must include tests
- Maintain existing test coverage
- Test with real Moonraker instances when possible

## API Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MOONRAKER_HOST` | Printer hostname or IP | `localhost` | No |
| `MOONRAKER_PORT` | Moonraker API port | `7125` | No |
| `MOONRAKER_API_KEY` | API key for authentication | None | No |
| `DEBUG` | Enable debug logging | None | No |

### Moonraker API Endpoints Used

- `/server/files/list?root=config` - List configuration files
- `/server/files/config/{filename}` - Get configuration file content
- `/printer/objects/query?print_stats` - Get printer status
- `/machine/system_info` - Get system information

## Related Documentation

- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs/)
- [Moonraker API Documentation](https://moonraker.readthedocs.io/en/latest/web_api/)
- [Klipper Configuration Reference](https://www.klipper3d.org/Config_Reference.html)