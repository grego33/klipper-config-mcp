# Klipper Config MCP

A Model Context Protocol (MCP) server for interacting with Klipper 3D printer configurations through Moonraker API.

## Features

- **Configuration File Management**: Read and parse Klipper configuration files
- **Real-time Analysis**: Parse config syntax and validate parameters
- **System Integration**: Get printer status and system information
- **Claude Desktop Integration**: Seamless integration with Claude for configuration assistance

## Available Tools

### 🔧 Configuration Tools

- `get_config_file`: Retrieve contents of any Klipper configuration file
- `list_config_files`: List all available configuration files with metadata
- `parse_config`: Parse configuration files and extract structured data
- `get_config_section`: Get specific sections from configuration files

### 📊 System Tools

- `get_printer_status`: Get current printer state and status
- `get_system_info`: Retrieve system information from the printer host

## Installation

### Prerequisites

- Node.js 18+ and npm
- A running Klipper printer with Moonraker API access
- Network connectivity to your printer

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/yourusername/klipper-config-mcp.git
   cd klipper-config-mcp
   npm install
   npm run build
   ```

2. **Configure environment variables:**
   ```bash
   export MOONRAKER_HOST=192.168.1.100  # Your printer's IP
   export MOONRAKER_PORT=7125           # Moonraker port (default: 7125)
   export MOONRAKER_API_KEY=your_key    # Optional API key
   ```

3. **Test the connection:**
   ```bash
   npm run start
   ```

## Claude Desktop Configuration

Add this to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "klipper-config": {
      "command": "npx",
      "args": ["tsx", "/path/to/klipper-config-mcp/src/index.ts"],
      "env": {
        "MOONRAKER_HOST": "192.168.1.100",
        "MOONRAKER_PORT": "7125",
        "MOONRAKER_API_KEY": "your_api_key_if_needed"
      }
    }
  }
}
```

## Usage Examples

Once configured with Claude Desktop, you can ask Claude to help with your printer:

### Configuration Analysis
> "Show me my extruder configuration"
>
> "List all my configuration files"
>
> "Parse my printer.cfg and check for errors"

### Troubleshooting
> "What's my printer's current status?"
>
> "Show me the stepper motor settings"
>
> "Check my bed mesh configuration"

### System Information
> "What system is my printer running on?"
>
> "Show me network interface information"

## Configuration File Structure

The MCP server can parse and analyze standard Klipper configuration files including:

- `printer.cfg` - Main printer configuration
- `macros.cfg` - G-code macros
- `moonraker.conf` - Moonraker configuration
- Any included configuration files

### Supported Sections

- **Motion System**: `[stepper_x]`, `[stepper_y]`, `[stepper_z]`
- **Extruder**: `[extruder]`, `[extruder1]`, etc.
- **Heated Components**: `[heater_bed]`, `[heater_generic]`
- **Sensors**: `[temperature_sensor]`, `[filament_switch_sensor]`
- **Bed Leveling**: `[bed_mesh]`, `[z_tilt]`, `[quad_gantry_level]`
- **And many more Klipper sections**

## Development

### Project Structure

```
klipper-config-mcp/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── moonraker-client.ts   # Moonraker API client
│   ├── config-parser.ts      # Klipper config parsing
│   └── types.ts              # TypeScript definitions
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build    # Compile TypeScript
npm run dev      # Development mode with auto-reload
npm run test     # Run tests
```

### Testing

```bash
# Run all tests
npm test

# Test with a specific printer
MOONRAKER_HOST=192.168.1.100 npm test
```

## API Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MOONRAKER_HOST` | Printer hostname or IP | `localhost` | No |
| `MOONRAKER_PORT` | Moonraker API port | `7125` | No |
| `MOONRAKER_API_KEY` | API key for authentication | None | No |

### Error Handling

The MCP server provides detailed error messages for common issues:

- **Connection errors**: When Moonraker is unreachable
- **File not found**: When configuration files don't exist
- **Parse errors**: When configuration syntax is invalid
- **Permission errors**: When API access is denied

## Troubleshooting

### Common Issues

1. **Cannot connect to Moonraker**
   - Check that your printer is powered on and connected to network
   - Verify the IP address and port
   - Test with: `curl http://your-printer-ip:7125/server/info`

2. **Configuration files not found**
   - Ensure Moonraker has access to the config directory
   - Check file permissions on the printer

3. **Claude Desktop not loading the MCP**
   - Verify the path in `claude_desktop_config.json`
   - Check the environment variables
   - Restart Claude Desktop after configuration changes

### Debug Mode

Enable debug logging:
```bash
DEBUG=klipper-config-mcp npx tsx src/index.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/klipper-config-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/klipper-config-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/klipper-config-mcp/wiki)

## Related Projects

- [Klipper](https://github.com/Klipper3d/klipper) - 3D printer firmware
- [Moonraker](https://github.com/Arksine/moonraker) - Klipper API server
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript MCP SDK