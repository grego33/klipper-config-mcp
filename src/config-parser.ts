import ini from 'ini';
import {
  KlipperConfig,
  ConfigSection,
  ConfigParseResult,
} from './types.js';

export class ConfigParser {
  private static readonly INCLUDE_PATTERN = /^\[include\s+(.+?)\]\s*$/gm;
  private static readonly SECTION_PATTERN = /^\[([^\]]+)\]\s*$/gm;
  private static readonly COMMENT_PATTERN = /^\s*#/;
  private static readonly CONTINUATION_PATTERN = /\\\s*$/;

  parseConfig(content: string, validateSyntax: boolean = true): ConfigParseResult {
    const errors: string[] = [];
    const includes: string[] = [];

    try {
      const { cleanedContent, extractedIncludes } = this.extractIncludes(content);
      includes.push(...extractedIncludes);

      const config = this.parseKlipperConfig(cleanedContent, validateSyntax, errors);

      return {
        config,
        includes,
        errors,
      };
    } catch (error) {
      errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        config: {},
        includes,
        errors,
      };
    }
  }

  private extractIncludes(content: string): { cleanedContent: string; extractedIncludes: string[] } {
    const includes: string[] = [];
    let match;

    ConfigParser.INCLUDE_PATTERN.lastIndex = 0;
    while ((match = ConfigParser.INCLUDE_PATTERN.exec(content)) !== null) {
      const includeFile = match[1]?.trim();
      if (includeFile) {
        includes.push(includeFile);
      }
    }

    const cleanedContent = content.replace(ConfigParser.INCLUDE_PATTERN, '');

    return { cleanedContent, extractedIncludes: includes };
  }

  private parseKlipperConfig(content: string, validateSyntax: boolean, errors: string[]): KlipperConfig {
    const lines = content.split('\n');
    const config: KlipperConfig = {};
    let currentSection: string | null = null;
    let currentSectionData: ConfigSection = {};
    let lineNumber = 0;

    for (const rawLine of lines) {
      lineNumber++;
      let line = rawLine;

      if (ConfigParser.COMMENT_PATTERN.test(line) || line.trim() === '') {
        continue;
      }

      if (ConfigParser.CONTINUATION_PATTERN.test(line) && lineNumber < lines.length) {
        line = line.replace(ConfigParser.CONTINUATION_PATTERN, '');
        const nextLine = lines[lineNumber]?.trim() || '';
        line += ' ' + nextLine;
        lines[lineNumber] = '';
      }

      const sectionMatch = line.match(/^\[([^\]]+)\]\s*$/);
      if (sectionMatch) {
        if (currentSection) {
          config[currentSection] = { ...currentSectionData };
        }

        currentSection = sectionMatch[1]?.trim() || null;
        currentSectionData = {};

        if (validateSyntax && currentSection) {
          const validationError = this.validateSectionName(currentSection);
          if (validationError) {
            errors.push(`Line ${lineNumber}: ${validationError}`);
          }
        }
        continue;
      }

      if (!currentSection) {
        if (validateSyntax && line.trim()) {
          errors.push(`Line ${lineNumber}: Configuration outside of section: ${line.trim()}`);
        }
        continue;
      }

      const keyValueMatch = line.match(/^([^:=]+)[:=]\s*(.*)$/);
      if (keyValueMatch) {
        const key = keyValueMatch[1]?.trim();
        const value = keyValueMatch[2]?.trim();

        if (key && value !== undefined) {
          currentSectionData[key] = this.parseValue(value);

          if (validateSyntax) {
            const paramError = this.validateParameter(currentSection, key, value);
            if (paramError) {
              errors.push(`Line ${lineNumber}: ${paramError}`);
            }
          }
        } else if (validateSyntax) {
          errors.push(`Line ${lineNumber}: Invalid key-value pair: ${line.trim()}`);
        }
      } else if (validateSyntax && line.trim()) {
        errors.push(`Line ${lineNumber}: Invalid syntax: ${line.trim()}`);
      }
    }

    if (currentSection) {
      config[currentSection] = { ...currentSectionData };
    }

    return config;
  }

  private parseValue(value: string): any {
    if (value === '') return '';

    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue === 'true') return true;
    if (lowercaseValue === 'false') return false;

    const numberValue = Number(value);
    if (!isNaN(numberValue) && isFinite(numberValue)) {
      return numberValue;
    }

    if (value.includes(',')) {
      return value.split(',').map(v => this.parseValue(v.trim()));
    }

    return value;
  }

  private validateSectionName(sectionName: string): string | null {
    if (!sectionName || sectionName.trim() === '') {
      return 'Empty section name';
    }

    if (sectionName.includes(' ') && !this.isValidMultiWordSection(sectionName)) {
      return `Invalid section name: "${sectionName}"`;
    }

    return null;
  }

  private isValidMultiWordSection(sectionName: string): boolean {
    const validPrefixes = [
      'stepper_',
      'extruder',
      'heater_',
      'fan',
      'output_pin',
      'gcode_macro',
      'temperature_sensor',
      'filament_switch_sensor',
      'bed_mesh',
      'safe_z_home',
      'z_tilt',
      'quad_gantry_level',
      'screws_tilt_adjust',
      'bed_screws',
      'display',
      'menu',
      'delayed_gcode',
      'save_variables',
      'idle_timeout',
      'respond',
      'pause_resume',
      'firmware_retraction',
      'gcode_arcs',
      'exclude_object',
      'virtual_sdcard',
      'duplicate_pin_override'
    ];

    return validPrefixes.some(prefix => sectionName.startsWith(prefix));
  }

  private validateParameter(section: string, key: string, value: string): string | null {
    if (section === 'stepper_x' || section === 'stepper_y' || section === 'stepper_z') {
      if (key === 'step_pin' || key === 'dir_pin' || key === 'enable_pin') {
        if (!value.match(/^!?[A-Za-z]+\d+$/)) {
          return `Invalid pin format for ${key}: ${value}`;
        }
      }
      if (key === 'rotation_distance') {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          return `Invalid rotation_distance: must be positive number, got ${value}`;
        }
      }
    }

    if (section === 'extruder') {
      if (key === 'nozzle_diameter') {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          return `Invalid nozzle_diameter: must be positive number, got ${value}`;
        }
      }
      if (key === 'max_temp') {
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 500) {
          return `Invalid max_temp: must be between 0-500, got ${value}`;
        }
      }
    }

    return null;
  }

  getSection(config: KlipperConfig, sectionName: string): ConfigSection | null {
    return config[sectionName] || null;
  }

  getSectionsByPrefix(config: KlipperConfig, prefix: string): Record<string, ConfigSection> {
    const sections: Record<string, ConfigSection> = {};

    for (const [name, section] of Object.entries(config)) {
      if (name.startsWith(prefix)) {
        sections[name] = section;
      }
    }

    return sections;
  }

  getAllSectionNames(config: KlipperConfig): string[] {
    return Object.keys(config).sort();
  }

  getParameterValue(config: KlipperConfig, sectionName: string, parameterName: string): any {
    const section = this.getSection(config, sectionName);
    return section?.[parameterName] ?? null;
  }

  formatConfig(config: KlipperConfig, includes: string[] = []): string {
    let output = '';

    for (const include of includes) {
      output += `[include ${include}]\n`;
    }

    if (includes.length > 0) {
      output += '\n';
    }

    for (const [sectionName, section] of Object.entries(config)) {
      output += `[${sectionName}]\n`;

      for (const [key, value] of Object.entries(section)) {
        if (Array.isArray(value)) {
          output += `${key}: ${value.join(', ')}\n`;
        } else {
          output += `${key}: ${value}\n`;
        }
      }

      output += '\n';
    }

    return output.trim();
  }

  validateConfigSyntax(content: string): { isValid: boolean; errors: string[] } {
    const result = this.parseConfig(content, true);
    return {
      isValid: result.errors.length === 0,
      errors: result.errors,
    };
  }
}