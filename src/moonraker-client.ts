import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MoonrakerConfig,
  FileListResponse,
  MoonrakerFileResponse,
  MoonrakerResponse,
  PrinterState,
  SystemInfo,
  ConfigFile
} from './types.js';

export class MoonrakerClient {
  private client: AxiosInstance;
  private config: MoonrakerConfig;

  constructor(config: MoonrakerConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `http://${config.host}:${config.port}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-Api-Key': config.apiKey }),
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.code === 'ECONNREFUSED') {
          throw new Error(`Cannot connect to Moonraker at ${config.host}:${config.port}. Is the printer running?`);
        }
        if (error.code === 'ETIMEDOUT') {
          throw new Error(`Connection timeout to Moonraker at ${config.host}:${config.port}`);
        }
        throw error;
      }
    );
  }

  async getConfigFile(filename: string): Promise<string> {
    try {
      const response = await this.client.get<string>(`/server/files/config/${encodeURIComponent(filename)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Config file '${filename}' not found`);
        }
        if (error.response?.status === 403) {
          throw new Error(`Access denied to config file '${filename}'`);
        }
      }
      throw error;
    }
  }

  async listConfigFiles(pattern?: string): Promise<ConfigFile[]> {
    try {
      const url = '/server/files/list';
      const params = new URLSearchParams({
        root: 'config',
        ...(pattern && { extended: 'true' }),
      });

      const response = await this.client.get<FileListResponse>(`${url}?${params}`);

      let files = response.data.result;

      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
        files = files.filter(file => regex.test(file.path));
      }

      return files;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Config directory not found');
        }
      }
      throw error;
    }
  }

  async uploadConfigFile(filename: string, content: string): Promise<void> {
    try {
      const formData = new FormData();
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob, filename);
      formData.append('root', 'config');

      await this.client.post('/server/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error(`Access denied when uploading '${filename}'`);
        }
        if (error.response?.status === 409) {
          throw new Error(`File '${filename}' already exists`);
        }
      }
      throw error;
    }
  }

  async deleteConfigFile(filename: string): Promise<void> {
    try {
      await this.client.delete(`/server/files/config/${encodeURIComponent(filename)}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Config file '${filename}' not found`);
        }
        if (error.response?.status === 403) {
          throw new Error(`Access denied when deleting '${filename}'`);
        }
      }
      throw error;
    }
  }

  async getPrinterStatus(): Promise<PrinterState> {
    try {
      const response = await this.client.get<any>('/printer/objects/query?print_stats');

      if (!response.data?.result?.status?.print_stats) {
        throw new Error('Invalid response structure from Moonraker');
      }

      return response.data.result.status.print_stats;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          throw new Error('Klipper is not ready or not running');
        }
      }
      throw error;
    }
  }

  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await this.client.get<MoonrakerResponse<SystemInfo>>('/machine/system_info');
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  async restartKlipper(): Promise<void> {
    try {
      await this.client.post('/printer/restart');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          throw new Error('Cannot restart Klipper - service not available');
        }
      }
      throw error;
    }
  }

  async restartMoonraker(): Promise<void> {
    try {
      await this.client.post('/server/restart');
    } catch (error) {
      throw error;
    }
  }

  async emergencyStop(): Promise<void> {
    try {
      await this.client.post('/printer/emergency_stop');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          throw new Error('Cannot execute emergency stop - Klipper not available');
        }
      }
      throw error;
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.client.get('/server/info');
      return true;
    } catch (error) {
      return false;
    }
  }

  getConnectionInfo(): string {
    return `${this.config.host}:${this.config.port}${this.config.apiKey ? ' (with API key)' : ''}`;
  }
}