# Klipper Config MCP

[![npm version](https://badge.fury.io/js/@grego33%2Fklipper-config-mcp.svg)](https://www.npmjs.com/package/@grego33/klipper-config-mcp)

A Model Context Protocol (MCP) server for reading Klipper 3D printer configurations, logs, and documentation through Moonraker API.

**📦 Install with:** `npx @grego33/klipper-config-mcp`

## Features

- **Configuration File Access**: Read and parse Klipper configuration files
- **Log File Access**: Retrieve Klipper log files for troubleshooting
- **Documentation Access**: Browse Klipper documentation files
- **Real-time Analysis**: Parse config syntax and validate parameters
- **System Integration**: Get printer status and system information
- **Universal Compatibility**: Works with any chat agent that supports the Model Context Protocol

## Available Tools

### 🔧 Configuration Tools

- `get_config_file`: Retrieve contents of any Klipper configuration file
- `list_config_files`: List all available configuration files with metadata
- `parse_config`: Parse configuration files and extract structured data
- `get_config_section`: Get specific sections from configuration files

### 📄 Log & Documentation Tools

- `get_log_file`: Retrieve contents of Klipper log files
- `list_log_files`: List all available log files with metadata
- `get_doc_file`: Retrieve Klipper documentation files
- `list_doc_files`: List all available documentation files

### 📊 System Tools

- `get_printer_status`: Get current printer state and status
- `get_system_info`: Retrieve system information from the printer host

## Prerequisites

- A running Klipper printer with Moonraker API access
- Network connectivity to your printer
- A chat agent that supports Model Context Protocol (MCP)

## Agent Configuration

### Claude Desktop

Add this to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

### Using npx (Recommended)
```json
{
  "mcpServers": {
    "klipper-config": {
      "command": "npx",
      "args": ["@grego33/klipper-config-mcp"],
      "env": {
        "MOONRAKER_HOST": "192.168.1.100",
        "MOONRAKER_PORT": "7125",
        "MOONRAKER_API_KEY": "your_api_key_if_needed"
      }
    }
  }
}
```


### Other MCP-Compatible Agents

This server implements the standard MCP protocol and can be integrated with any chat agent that supports MCP. Refer to your agent's documentation for specific configuration instructions.


## Environment Variables

Configure your printer connection using environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MOONRAKER_HOST` | Printer hostname or IP | `localhost` | No |
| `MOONRAKER_PORT` | Moonraker API port | `7125` | No |
| `MOONRAKER_API_KEY` | API key for authentication | None | No |

You can set these in a `.env` file:
```bash
cp .env.example .env
# Edit .env with your printer's details
```

## Usage Examples

Once configured with your chat agent, you can ask it to help with your printer:

### Configuration Analysis
> "Show me my extruder configuration"
>
> "List all my configuration files"
>
> "Parse my printer.cfg and check for errors"

### Log Analysis & Troubleshooting
> "Show me the latest Klipper log file"
>
> "List all available log files"
>
> "What's my printer's current status?"
>
> "Check recent error messages in the logs"

### Documentation Access
> "Show me Klipper documentation files"
>
> "List available documentation"

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

## Troubleshooting

### Common Issues

1. **Cannot connect to Moonraker**
   - Check that your printer is powered on and connected to network
   - Verify the IP address and port
   - Test with: `curl http://your-printer-ip:7125/server/info`

2. **Configuration files not found**
   - Ensure Moonraker has access to the config directory
   - Check file permissions on the printer

3. **Agent not loading the MCP**
   - Verify the configuration syntax
   - Check the environment variables
   - Restart your chat agent after configuration changes

## Contributing

See [DEVELOPER.md](DEVELOPER.md) for development setup, testing, and contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/grego33/klipper-config-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/grego33/klipper-config-mcp/discussions)
- **npm Package**: [@grego33/klipper-config-mcp](https://www.npmjs.com/package/@grego33/klipper-config-mcp)

If this project helps you, consider supporting its development:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/mattgregory33)