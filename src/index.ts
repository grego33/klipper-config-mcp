#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { MoonrakerClient } from './moonraker-client.js';
import { ConfigParser } from './config-parser.js';
import {
  MoonrakerConfig,
  ToolNames,
  GetConfigFileArgs,
  ListConfigFilesArgs,
  ParseConfigArgs,
  GetConfigSectionArgs,
} from './types.js';

class KlipperConfigMCP {
  private server: Server;
  private moonraker: MoonrakerClient;
  private parser: ConfigParser;

  constructor() {
    this.server = new Server(
      {
        name: 'klipper-config-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const config: MoonrakerConfig = {
      host: process.env.MOONRAKER_HOST || 'localhost',
      port: parseInt(process.env.MOONRAKER_PORT || '7125'),
      ...(process.env.MOONRAKER_API_KEY && { apiKey: process.env.MOONRAKER_API_KEY }),
    };

    this.moonraker = new MoonrakerClient(config);
    this.parser = new ConfigParser();

    this.setupTools();
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: ToolNames.GET_CONFIG_FILE,
            description: 'Retrieve the contents of a Klipper configuration file',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Name of the configuration file to retrieve (e.g., printer.cfg)',
                },
              },
              required: ['filename'],
            },
          },
          {
            name: ToolNames.LIST_CONFIG_FILES,
            description: 'List all available Klipper configuration files',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  description: 'Optional pattern to filter files (supports wildcards)',
                },
              },
              required: [],
            },
          },
          {
            name: ToolNames.PARSE_CONFIG,
            description: 'Parse a Klipper configuration file and extract structured data',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Name of the configuration file to parse',
                },
                includeIncludes: {
                  type: 'boolean',
                  description: 'Whether to extract include statements',
                  default: true,
                },
              },
              required: ['filename'],
            },
          },
          {
            name: ToolNames.GET_CONFIG_SECTION,
            description: 'Get a specific section from a Klipper configuration file',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Name of the configuration file',
                },
                sectionName: {
                  type: 'string',
                  description: 'Name of the section to retrieve (e.g., extruder, stepper_x)',
                },
              },
              required: ['filename', 'sectionName'],
            },
          },
          {
            name: ToolNames.GET_PRINTER_STATUS,
            description: 'Get the current status of the 3D printer',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: ToolNames.GET_SYSTEM_INFO,
            description: 'Get system information from the printer host',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case ToolNames.GET_CONFIG_FILE:
            return await this.handleGetConfigFile(args as unknown as GetConfigFileArgs);

          case ToolNames.LIST_CONFIG_FILES:
            return await this.handleListConfigFiles(args as unknown as ListConfigFilesArgs);

          case ToolNames.PARSE_CONFIG:
            return await this.handleParseConfig(args as unknown as ParseConfigArgs);

          case ToolNames.GET_CONFIG_SECTION:
            return await this.handleGetConfigSection(args as unknown as GetConfigSectionArgs);

          case ToolNames.GET_PRINTER_STATUS:
            return await this.handleGetPrinterStatus();

          case ToolNames.GET_SYSTEM_INFO:
            return await this.handleGetSystemInfo();

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async handleGetConfigFile(args: GetConfigFileArgs) {
    const { filename } = args;

    if (!filename || filename.trim() === '') {
      throw new McpError(ErrorCode.InvalidParams, 'Filename is required');
    }

    const content = await this.moonraker.getConfigFile(filename);

    return {
      content: [
        {
          type: 'text',
          text: `Configuration file: ${filename}\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\n${content}`,
        },
      ],
    };
  }

  private async handleListConfigFiles(args: ListConfigFilesArgs) {
    const { pattern } = args;

    const files = await this.moonraker.listConfigFiles(pattern);

    const fileList = files
      .map((file) => {
        const sizeKB = (file.size / 1024).toFixed(1);
        const modDate = new Date(file.modified * 1000).toISOString();
        return `${file.path} (${sizeKB}KB, modified: ${modDate})`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Configuration files${pattern ? ` matching "${pattern}"` : ''}:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\n${fileList || 'No files found'}`,
        },
      ],
    };
  }

  private async handleParseConfig(args: ParseConfigArgs) {
    const { filename, includeIncludes = true } = args;

    if (!filename || filename.trim() === '') {
      throw new McpError(ErrorCode.InvalidParams, 'Filename is required');
    }

    const content = await this.moonraker.getConfigFile(filename);
    const parseResult = this.parser.parseConfig(content, true);

    let resultText = `Parsed configuration file: ${filename}\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\n`;

    if (parseResult.errors.length > 0) {
      resultText += `Parsing errors found:\n${parseResult.errors.join('\n')}\n\n`;
    }

    if (includeIncludes && parseResult.includes.length > 0) {
      resultText += `Include files:\n${parseResult.includes.map(inc => `- ${inc}`).join('\n')}\n\n`;
    }

    resultText += `Configuration sections:\n`;
    for (const [sectionName, section] of Object.entries(parseResult.config)) {
      resultText += `\n[${sectionName}]\n`;
      for (const [key, value] of Object.entries(section)) {
        resultText += `  ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  }

  private async handleGetConfigSection(args: GetConfigSectionArgs) {
    const { filename, sectionName } = args;

    if (!filename || filename.trim() === '') {
      throw new McpError(ErrorCode.InvalidParams, 'Filename is required');
    }

    if (!sectionName || sectionName.trim() === '') {
      throw new McpError(ErrorCode.InvalidParams, 'Section name is required');
    }

    const content = await this.moonraker.getConfigFile(filename);
    const parseResult = this.parser.parseConfig(content);

    const section = this.parser.getSection(parseResult.config, sectionName);

    if (!section) {
      return {
        content: [
          {
            type: 'text',
            text: `Section "${sectionName}" not found in ${filename}\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\nAvailable sections:\n${Object.keys(parseResult.config).join(', ')}`,
          },
        ],
      };
    }

    let resultText = `Section [${sectionName}] from ${filename}:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\n`;
    for (const [key, value] of Object.entries(section)) {
      resultText += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  }

  private async handleGetPrinterStatus() {
    try {
      const status = await this.moonraker.getPrinterStatus();

      const resultText = `Printer Status:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\nState: ${status.state}\nMessage: ${status.message || 'No message'}\nFilename: ${status.filename || 'No file'}\nPrint Duration: ${status.print_duration?.toFixed(1) || 'N/A'}s\nTotal Duration: ${status.total_duration?.toFixed(1) || 'N/A'}s\nFilament Used: ${status.filament_used?.toFixed(2) || 'N/A'}mm`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Printer Status Error:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\nError: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleGetSystemInfo() {
    try {
      const info = await this.moonraker.getSystemInfo();

      if (!info) {
        return {
          content: [
            {
              type: 'text',
              text: `System Information Error:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\nReceived null/undefined response from Moonraker`,
            },
          ],
        };
      }

      // Extract the actual system info from the nested structure
      const sysInfo = (info as any).system_info || info;

      let resultText = `System Information:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\n`;
      resultText += `CPU: ${sysInfo.cpu_info?.cpu_desc || sysInfo.cpu_info?.processor || 'N/A'} (${sysInfo.cpu_info?.cpu_count || 'N/A'} cores)\n`;
      resultText += `Model: ${sysInfo.cpu_info?.model || 'N/A'}\n`;
      resultText += `Memory: ${sysInfo.cpu_info?.total_memory || 'N/A'} ${sysInfo.cpu_info?.memory_units || 'N/A'}\n`;
      resultText += `OS: ${sysInfo.distribution?.name || 'N/A'} ${sysInfo.distribution?.version || 'N/A'}\n`;
      resultText += `Kernel: ${sysInfo.distribution?.kernel_version || 'N/A'}\n`;
      resultText += `Python: ${sysInfo.python?.version_string || 'N/A'}\n`;

      if (sysInfo.service_state) {
        resultText += `\nServices:\n`;
        resultText += `- Klipper: ${sysInfo.service_state.klipper?.active_state || 'N/A'} (${sysInfo.service_state.klipper?.sub_state || 'N/A'})\n`;
        resultText += `- Moonraker: ${sysInfo.service_state.moonraker?.active_state || 'N/A'} (${sysInfo.service_state.moonraker?.sub_state || 'N/A'})\n`;
        if (sysInfo.service_state.KlipperScreen) {
          resultText += `- KlipperScreen: ${sysInfo.service_state.KlipperScreen?.active_state || 'N/A'} (${sysInfo.service_state.KlipperScreen?.sub_state || 'N/A'})\n`;
        }
      }

      if (sysInfo.network && Object.keys(sysInfo.network).length > 0) {
        resultText += `\nNetwork Interfaces:\n`;
        for (const [iface, details] of Object.entries(sysInfo.network)) {
          const netDetails = details as any;
          resultText += `- ${iface}: ${netDetails.mac_address}\n`;
          for (const addr of netDetails.ip_addresses || []) {
            resultText += `  ${addr.address} (${addr.family})\n`;
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `System Information Error:\n\nConnection: ${this.moonraker.getConnectionInfo()}\n\nError: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Note: Don't use console.log in MCP servers as it interferes with JSON-RPC protocol
    // Logging should go to stderr or files, not stdout
  }
}

async function main() {
  try {
    const mcp = new KlipperConfigMCP();
    await mcp.run();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}