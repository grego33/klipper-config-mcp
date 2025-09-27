import { z } from 'zod';

export interface MoonrakerConfig {
  host: string;
  port: number;
  apiKey?: string | undefined;
}

export const ConfigFileSchema = z.object({
  path: z.string(),
  size: z.number(),
  modified: z.number(),
  permissions: z.string().optional(),
});

export const FileListResponseSchema = z.object({
  result: z.array(ConfigFileSchema),
});

export const ConfigSectionSchema = z.record(z.string(), z.any());

export const KlipperConfigSchema = z.record(z.string(), ConfigSectionSchema);

export interface ConfigFile {
  path: string;
  size: number;
  modified: number;
  permissions?: string;
}

export interface FileListResponse {
  result: ConfigFile[];
}

export interface ConfigSection {
  [key: string]: any;
}

export interface KlipperConfig {
  [sectionName: string]: ConfigSection;
}

export interface ConfigParseResult {
  config: KlipperConfig;
  includes: string[];
  errors: string[];
}

export interface MoonrakerFileResponse {
  result: {
    filename: string;
    content: string;
  };
}

export interface MoonrakerResponse<T = any> {
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

export enum ToolNames {
  GET_CONFIG_FILE = 'get_config_file',
  LIST_CONFIG_FILES = 'list_config_files',
  PARSE_CONFIG = 'parse_config',
  GET_CONFIG_SECTION = 'get_config_section',
  GET_PRINTER_STATUS = 'get_printer_status',
  GET_SYSTEM_INFO = 'get_system_info',
}

export interface GetConfigFileArgs {
  filename: string;
}

export interface ListConfigFilesArgs {
  pattern?: string;
}

export interface ParseConfigArgs {
  filename: string;
  includeIncludes?: boolean;
}

export interface GetConfigSectionArgs {
  filename: string;
  sectionName: string;
}

export interface PrinterState {
  filename: string;
  total_duration: number;
  print_duration: number;
  filament_used: number;
  state: string;
  message: string;
  info: {
    total_layer: number | null;
    current_layer: number | null;
  };
}

export interface SystemInfo {
  cpu_info: {
    cpu_count: number;
    bits: string;
    processor: string;
    cpu_desc: string;
    serial_number: string;
    hardware_desc: string;
    model: string;
    total_memory: number;
    memory_units: string;
  };
  sd_info: {
    manufacturer_id: string;
    manufacturer: string;
    oem_id: string;
    product_name: string;
    product_revision: string;
    serial_number: string;
    manufacturer_date: string;
    capacity: string;
    total_bytes: number;
  } | null;
  distribution: {
    name: string;
    id: string;
    version: string;
    version_parts: {
      major: string;
      minor: string;
      build_number: string;
    };
    like: string;
    codename: string;
  };
  virtualization: {
    virt_type: string;
    virt_identifier: string;
  };
  python: {
    version: string[];
    version_string: string;
  };
  network: Record<string, {
    mac_address: string;
    ip_addresses: Array<{
      family: string;
      address: string;
      is_link_local: boolean;
    }>;
  }>;
  canbus: {
    can0: {
      tx_queue_len: number;
      bitrate: number;
      driver: string;
    };
  } | null;
  service_state: {
    klipper: {
      active_state: string;
      sub_state: string;
    };
    moonraker: {
      active_state: string;
      sub_state: string;
    };
  };
}