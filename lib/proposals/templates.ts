import fs from 'fs';
import path from 'path';
import type { ServiceKey, ServiceTemplate } from './types';

const TEMPLATES_DIR = path.join(process.cwd(), 'proposal-templates');

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  if (!raw.startsWith('---')) return { data: {}, content: raw };
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { data: {}, content: raw };
  const yamlPart = raw.slice(4, end).trim();
  const content = raw.slice(end + 4).trim();
  const data: Record<string, unknown> = {};
  const lines = yamlPart.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const listKey = line.match(/^([\w-]+)\s*:\s*$/);
    const kv = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (listKey) {
      const key = listKey[1];
      const items: string[] = [];
      i++;
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s/, '').trim());
        i++;
      }
      data[key] = items;
    } else if (kv) {
      data[kv[1]] = kv[2].trim();
      i++;
    } else {
      i++;
    }
  }
  return { data, content };
}

export function loadTemplate(key: ServiceKey): ServiceTemplate {
  const file = path.join(TEMPLATES_DIR, `${key}.md`);
  let raw = '';
  try {
    raw = fs.readFileSync(file, 'utf-8');
  } catch {
    raw = fs.readFileSync(path.join(TEMPLATES_DIR, 'general.md'), 'utf-8');
  }
  const { data, content } = parseFrontmatter(raw);
  return {
    title: String(data.title ?? 'Логистика из Китая'),
    description: content,
    benefits: (data.benefits as string[]) ?? [],
    processSteps: (data.processSteps as string[]) ?? [],
    deliveryTime: String(data.deliveryTime ?? ''),
  };
}

export function detectServiceKey(service?: string): ServiceKey {
  if (!service) return 'general';
  const s = service.toLowerCase();
  if (s.includes('сборн') || s.includes('lcl') || s.includes('консолид')) return 'consolidation';
  if (s.includes('контейнер') || s.includes('fcl')) return 'container';
  if (s.includes('поставщик') || s.includes('supplier')) return 'supplier-search';
  if (s.includes('инспекц') || s.includes('контроль кач')) return 'inspection';
  if (s.includes('карго') || s.includes('cargo')) return 'cargo';
  if (s.includes('1688') || s.includes('выкуп') || s.includes('taobao')) return '1688-buyout';
  return 'general';
}
