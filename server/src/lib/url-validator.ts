import { z } from 'zod';
import { URL } from 'url';

export function validatePublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    // Simple check to block internal/private IP addresses
    const hostname = url.hostname;
    
    // Block localhost and common local patterns
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    // Block IPv4 private spaces: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const ip4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ip4Pattern);
    
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      if (p1 === 10) return false;
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;
      if (p1 === 192 && p2 === 168) return false;
      if (p1 === 169 && p2 === 254) return false; // Link-local
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

export const publicUrlSchema = z.string().url().refine(validatePublicUrl, {
  message: "URL must be public and use http/https protocols",
});
