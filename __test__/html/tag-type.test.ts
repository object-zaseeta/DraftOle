import {
  TAG_TYPES,
  SELF_CLOSING_TAGS,
  getTagStructure,
  type TagType,
  type TagStructure,
} from '../../src/html/tags/tag-type';

describe('TAG_TYPES', () => {
  it('should contain exactly 97 tag entries (design.md spec)', () => {
    // design.md defines 97 unique tags across 11 categories:
    // basic(10) + semantic(9) + table(9) + list(6) + form(11) +
    // textDecoration(20) + heading(6) + media(5) + interactive(5) +
    // selfClosing(13) + other(3) = 97
    const tagCount = Object.keys(TAG_TYPES).length;
    expect(tagCount).toBe(97);
  });

  it('should have each key equal to its value', () => {
    for (const [key, value] of Object.entries(TAG_TYPES)) {
      expect(value).toBe(key);
    }
  });

  describe('basic tags', () => {
    it('should define html, head, body', () => {
      expect(TAG_TYPES.html).toBe('html');
      expect(TAG_TYPES.head).toBe('head');
      expect(TAG_TYPES.body).toBe('body');
    });

    it('should define div, p, span', () => {
      expect(TAG_TYPES.div).toBe('div');
      expect(TAG_TYPES.p).toBe('p');
      expect(TAG_TYPES.span).toBe('span');
    });

    it('should define script, root, text, doctype', () => {
      expect(TAG_TYPES.script).toBe('script');
      expect(TAG_TYPES.root).toBe('root');
      expect(TAG_TYPES.text).toBe('text');
      expect(TAG_TYPES.doctype).toBe('doctype');
    });
  });

  describe('semantic tags', () => {
    it('should define all semantic HTML5 tags', () => {
      expect(TAG_TYPES.header).toBe('header');
      expect(TAG_TYPES.footer).toBe('footer');
      expect(TAG_TYPES.nav).toBe('nav');
      expect(TAG_TYPES.main).toBe('main');
      expect(TAG_TYPES.section).toBe('section');
      expect(TAG_TYPES.article).toBe('article');
      expect(TAG_TYPES.aside).toBe('aside');
      expect(TAG_TYPES.figure).toBe('figure');
      expect(TAG_TYPES.figcaption).toBe('figcaption');
    });
  });

  describe('table tags', () => {
    it('should define all table-related tags', () => {
      expect(TAG_TYPES.table).toBe('table');
      expect(TAG_TYPES.thead).toBe('thead');
      expect(TAG_TYPES.tbody).toBe('tbody');
      expect(TAG_TYPES.tfoot).toBe('tfoot');
      expect(TAG_TYPES.tr).toBe('tr');
      expect(TAG_TYPES.th).toBe('th');
      expect(TAG_TYPES.td).toBe('td');
      expect(TAG_TYPES.caption).toBe('caption');
      expect(TAG_TYPES.colgroup).toBe('colgroup');
    });
  });

  describe('list tags', () => {
    it('should define all list-related tags', () => {
      expect(TAG_TYPES.ul).toBe('ul');
      expect(TAG_TYPES.ol).toBe('ol');
      expect(TAG_TYPES.li).toBe('li');
      expect(TAG_TYPES.dl).toBe('dl');
      expect(TAG_TYPES.dt).toBe('dt');
      expect(TAG_TYPES.dd).toBe('dd');
    });
  });

  describe('form tags', () => {
    it('should define all form-related tags', () => {
      expect(TAG_TYPES.form).toBe('form');
      expect(TAG_TYPES.label).toBe('label');
      expect(TAG_TYPES.button).toBe('button');
      expect(TAG_TYPES.select).toBe('select');
      expect(TAG_TYPES.option).toBe('option');
      expect(TAG_TYPES.optgroup).toBe('optgroup');
      expect(TAG_TYPES.textarea).toBe('textarea');
      expect(TAG_TYPES.fieldset).toBe('fieldset');
      expect(TAG_TYPES.legend).toBe('legend');
      expect(TAG_TYPES.datalist).toBe('datalist');
      expect(TAG_TYPES.output).toBe('output');
    });
  });

  describe('text decoration tags', () => {
    it('should define all text decoration tags', () => {
      expect(TAG_TYPES.strong).toBe('strong');
      expect(TAG_TYPES.em).toBe('em');
      expect(TAG_TYPES.b).toBe('b');
      expect(TAG_TYPES.i).toBe('i');
      expect(TAG_TYPES.u).toBe('u');
      expect(TAG_TYPES.s).toBe('s');
      expect(TAG_TYPES.mark).toBe('mark');
      expect(TAG_TYPES.small).toBe('small');
      expect(TAG_TYPES.sub).toBe('sub');
      expect(TAG_TYPES.sup).toBe('sup');
      expect(TAG_TYPES.code).toBe('code');
      expect(TAG_TYPES.pre).toBe('pre');
      expect(TAG_TYPES.blockquote).toBe('blockquote');
      expect(TAG_TYPES.q).toBe('q');
      expect(TAG_TYPES.cite).toBe('cite');
      expect(TAG_TYPES.abbr).toBe('abbr');
      expect(TAG_TYPES.address).toBe('address');
      expect(TAG_TYPES.time).toBe('time');
      expect(TAG_TYPES.kbd).toBe('kbd');
      expect(TAG_TYPES.samp).toBe('samp');
    });
  });

  describe('heading tags', () => {
    it('should define all heading tags h1-h6', () => {
      expect(TAG_TYPES.h1).toBe('h1');
      expect(TAG_TYPES.h2).toBe('h2');
      expect(TAG_TYPES.h3).toBe('h3');
      expect(TAG_TYPES.h4).toBe('h4');
      expect(TAG_TYPES.h5).toBe('h5');
      expect(TAG_TYPES.h6).toBe('h6');
    });
  });

  describe('media tags', () => {
    it('should define all media-related tags', () => {
      expect(TAG_TYPES.video).toBe('video');
      expect(TAG_TYPES.audio).toBe('audio');
      expect(TAG_TYPES.picture).toBe('picture');
      expect(TAG_TYPES.canvas).toBe('canvas');
      expect(TAG_TYPES.svg).toBe('svg');
    });
  });

  describe('interactive tags', () => {
    it('should define all interactive tags', () => {
      expect(TAG_TYPES.details).toBe('details');
      expect(TAG_TYPES.summary).toBe('summary');
      expect(TAG_TYPES.dialog).toBe('dialog');
      expect(TAG_TYPES.iframe).toBe('iframe');
      expect(TAG_TYPES.noscript).toBe('noscript');
    });
  });

  describe('self-closing tags', () => {
    it('should define all self-closing tags', () => {
      expect(TAG_TYPES.br).toBe('br');
      expect(TAG_TYPES.hr).toBe('hr');
      expect(TAG_TYPES.img).toBe('img');
      expect(TAG_TYPES.input).toBe('input');
      expect(TAG_TYPES.meta).toBe('meta');
      expect(TAG_TYPES.link).toBe('link');
      expect(TAG_TYPES.source).toBe('source');
      expect(TAG_TYPES.track).toBe('track');
      expect(TAG_TYPES.area).toBe('area');
      expect(TAG_TYPES.col).toBe('col');
      expect(TAG_TYPES.base).toBe('base');
      expect(TAG_TYPES.embed).toBe('embed');
      expect(TAG_TYPES.wbr).toBe('wbr');
    });
  });

  describe('other tags', () => {
    it('should define anchor, title, and var tags', () => {
      expect(TAG_TYPES.a).toBe('a');
      expect(TAG_TYPES.title).toBe('title');
      expect(TAG_TYPES.var).toBe('var');
    });
  });
});

describe('SELF_CLOSING_TAGS', () => {
  it('should contain exactly 13 tags', () => {
    expect(SELF_CLOSING_TAGS.size).toBe(13);
  });

  it('should contain all 13 standard HTML void elements', () => {
    const expectedSelfClosing = [
      'br', 'hr', 'img', 'input', 'meta', 'link',
      'source', 'track', 'area', 'col', 'base', 'embed', 'wbr',
    ] as const;

    for (const tag of expectedSelfClosing) {
      expect(SELF_CLOSING_TAGS.has(tag)).toBe(true);
    }
  });

  it('should NOT contain doctype', () => {
    expect(SELF_CLOSING_TAGS.has('doctype' as TagType)).toBe(false);
  });

  it('should NOT contain pair tags', () => {
    const pairTags = ['div', 'p', 'span', 'h1', 'table', 'form'] as const;
    for (const tag of pairTags) {
      expect(SELF_CLOSING_TAGS.has(tag)).toBe(false);
    }
  });
});

describe('getTagStructure', () => {
  describe('self-closing tags', () => {
    it('should return "selfClosing" for br', () => {
      expect(getTagStructure('br')).toBe('selfClosing');
    });

    it('should return "selfClosing" for hr', () => {
      expect(getTagStructure('hr')).toBe('selfClosing');
    });

    it('should return "selfClosing" for img', () => {
      expect(getTagStructure('img')).toBe('selfClosing');
    });

    it('should return "selfClosing" for input', () => {
      expect(getTagStructure('input')).toBe('selfClosing');
    });

    it('should return "selfClosing" for meta', () => {
      expect(getTagStructure('meta')).toBe('selfClosing');
    });

    it('should return "selfClosing" for link', () => {
      expect(getTagStructure('link')).toBe('selfClosing');
    });

    it('should return "selfClosing" for source', () => {
      expect(getTagStructure('source')).toBe('selfClosing');
    });

    it('should return "selfClosing" for track', () => {
      expect(getTagStructure('track')).toBe('selfClosing');
    });

    it('should return "selfClosing" for area', () => {
      expect(getTagStructure('area')).toBe('selfClosing');
    });

    it('should return "selfClosing" for col', () => {
      expect(getTagStructure('col')).toBe('selfClosing');
    });

    it('should return "selfClosing" for base', () => {
      expect(getTagStructure('base')).toBe('selfClosing');
    });

    it('should return "selfClosing" for embed', () => {
      expect(getTagStructure('embed')).toBe('selfClosing');
    });

    it('should return "selfClosing" for wbr', () => {
      expect(getTagStructure('wbr')).toBe('selfClosing');
    });

    it('should return "selfClosing" for all 13 self-closing tags', () => {
      const selfClosingTags: TagType[] = [
        'br', 'hr', 'img', 'input', 'meta', 'link',
        'source', 'track', 'area', 'col', 'base', 'embed', 'wbr',
      ];
      for (const tag of selfClosingTags) {
        expect(getTagStructure(tag)).toBe('selfClosing');
      }
    });
  });

  describe('pair tags', () => {
    it('should return "pair" for basic tags (div, p, span)', () => {
      expect(getTagStructure('div')).toBe('pair');
      expect(getTagStructure('p')).toBe('pair');
      expect(getTagStructure('span')).toBe('pair');
    });

    it('should return "pair" for semantic tags', () => {
      const semanticTags: TagType[] = [
        'header', 'footer', 'nav', 'main', 'section',
        'article', 'aside', 'figure', 'figcaption',
      ];
      for (const tag of semanticTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for table tags', () => {
      const tableTags: TagType[] = [
        'table', 'thead', 'tbody', 'tfoot',
        'tr', 'th', 'td', 'caption', 'colgroup',
      ];
      for (const tag of tableTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for form tags', () => {
      const formTags: TagType[] = [
        'form', 'label', 'button', 'select', 'option',
        'optgroup', 'textarea', 'fieldset', 'legend',
        'datalist', 'output',
      ];
      for (const tag of formTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for heading tags (h1-h6)', () => {
      const headingTags: TagType[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      for (const tag of headingTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for media tags', () => {
      const mediaTags: TagType[] = [
        'video', 'audio', 'picture', 'canvas', 'svg',
      ];
      for (const tag of mediaTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for interactive tags', () => {
      const interactiveTags: TagType[] = [
        'details', 'summary', 'dialog', 'iframe', 'noscript',
      ];
      for (const tag of interactiveTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for special internal types (root, text)', () => {
      expect(getTagStructure('root')).toBe('pair');
      expect(getTagStructure('text')).toBe('pair');
    });

    it('should return "pair" for doctype', () => {
      expect(getTagStructure('doctype')).toBe('pair');
    });

    it('should return "pair" for text decoration tags', () => {
      const textTags: TagType[] = [
        'strong', 'em', 'b', 'i', 'u', 's',
        'mark', 'small', 'sub', 'sup', 'code', 'pre',
        'blockquote', 'q', 'cite', 'abbr', 'address',
        'time', 'kbd', 'samp',
      ];
      for (const tag of textTags) {
        expect(getTagStructure(tag)).toBe('pair');
      }
    });

    it('should return "pair" for other tags (a, title, var)', () => {
      expect(getTagStructure('a')).toBe('pair');
      expect(getTagStructure('title')).toBe('pair');
      expect(getTagStructure('var')).toBe('pair');
    });
  });
});

describe('Type safety', () => {
  it('TagType should be a union of string literals', () => {
    // This test verifies type-level correctness at compile time
    // If TAG_TYPES values are properly typed as const, this will compile
    const tag: TagType = TAG_TYPES.div;
    expect(tag).toBe('div');
  });

  it('TagStructure should only be "pair" or "selfClosing"', () => {
    const structure: TagStructure = getTagStructure('div');
    expect(['pair', 'selfClosing']).toContain(structure);
  });
});
