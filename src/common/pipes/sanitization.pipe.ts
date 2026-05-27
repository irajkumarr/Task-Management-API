import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Only sanitize user-submitted body data (skips params, queries, headers)
    if (metadata.type !== 'body' || !value) {
      return value;
    }

    return this.sanitizeData(value);
  }

  private sanitizeData(data: any): any {
    // 1. If it's a string, sanitize it immediately
    if (typeof data === 'string') {
      return xss.filterXSS(data); // Using filterXSS explicitly is safer with the 'xss' library
    }

    // 2. If it's an array, recursively sanitize every element
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    // 3. If it's a standard object, recursively sanitize every key property
    if (typeof data === 'object' && data !== null) {
      const sanitizedObject: Record<string, any> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitizedObject[key] = this.sanitizeData(data[key]);
        }
      }
      return sanitizedObject;
    }

    // 4. Return primitives like booleans, numbers, or null as-is
    return data;
  }
}
