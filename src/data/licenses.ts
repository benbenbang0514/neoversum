export interface SourceLicense {
  license: string;
  title: string;
  author: string;
  url: string;
}

const licenses: Record<string, SourceLicense> = {
  'cc-by-4.0': {
    license: 'CC BY 4.0',
    title: 'Creative Commons Attribution 4.0 International',
    author: 'Various',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  'ogl-1.0a': {
    license: 'OGL 1.0a',
    title: 'Open Game License 1.0a',
    author: 'Wizards of the Coast',
    url: 'https://www.wizards.com/default.asp?x=d20/oglfaq/20040123',
  },
};

export const getSourceLicense = (id: string): SourceLicense => licenses[id] ?? { license: id, title: 'Unknown', author: '', url: '' };
