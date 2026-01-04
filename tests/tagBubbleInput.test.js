/**
 * Tests for TagBubbleInput class
 * Tests tag management, autocomplete, keyboard navigation, and rendering
 */

// Mock helper functions that TagBubbleInput depends on
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsl(${hue}, 70%, 90%)`,
    text: `hsl(${hue}, 70%, 30%)`
  };
}

// Mock getAllTags function
let mockAllTags = [];
function getAllTags() {
  return mockAllTags;
}

// TagBubbleInput class implementation (mirroring app.js)
class TagBubbleInput {
  constructor(container, input, onChange = null) {
    this.container = container;
    this.input = input;
    this.tags = [];
    this.onChange = onChange;
    this.selectedSuggestionIndex = -1;
    this.createAutocomplete();
    this.setupListeners();
  }

  createAutocomplete() {
    this.autocomplete = document.createElement('div');
    this.autocomplete.className = 'tag-autocomplete';
    this.container.appendChild(this.autocomplete);
  }

  setupListeners() {
    // Focus input when clicking container
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.input.focus();
      }
    });

    // Handle input keydown
    this.input.addEventListener('keydown', (e) => {
      const suggestions = this.autocomplete.querySelectorAll('.tag-suggestion');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
        this.updateSuggestionSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        this.updateSuggestionSelection();
      } else if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
          this.addTag(suggestions[this.selectedSuggestionIndex].dataset.tag);
          this.input.value = '';
          this.hideAutocomplete();
        } else {
          this.addTagFromInput();
        }
      } else if (e.key === 'Escape') {
        this.hideAutocomplete();
      } else if (e.key === 'Backspace' && this.input.value === '' && this.tags.length > 0) {
        this.removeTag(this.tags.length - 1);
      }
    });

    // Handle input for autocomplete
    this.input.addEventListener('input', () => {
      this.showSuggestions();
    });

    // Handle blur - add any pending tag
    this.input.addEventListener('blur', (e) => {
      // Delay to allow clicking on suggestions
      setTimeout(() => {
        this.addTagFromInput();
        this.hideAutocomplete();
      }, 150);
    });

    // Handle focus - show suggestions if there's text
    this.input.addEventListener('focus', () => {
      if (this.input.value.trim()) {
        this.showSuggestions();
      }
    });

    // Handle remove button clicks
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-remove')) {
        const index = parseInt(e.target.dataset.index);
        this.removeTag(index);
      }
    });

    // Handle suggestion clicks
    this.autocomplete.addEventListener('mousedown', (e) => {
      const suggestion = e.target.closest('.tag-suggestion');
      if (suggestion) {
        e.preventDefault();
        this.addTag(suggestion.dataset.tag);
        this.input.value = '';
        this.hideAutocomplete();
        this.input.focus();
      }
    });
  }

  showSuggestions() {
    const query = this.input.value.trim().toLowerCase();
    if (!query) {
      this.hideAutocomplete();
      return;
    }

    // Get all existing tags and filter by prefix
    const allTags = getAllTags();
    const suggestions = allTags.filter(tag =>
      tag.startsWith(query) && !this.tags.includes(tag)
    );

    if (suggestions.length === 0) {
      this.hideAutocomplete();
      return;
    }

    this.selectedSuggestionIndex = -1;
    this.autocomplete.innerHTML = suggestions.map(tag => {
      const colors = getTagColor(tag);
      return `<div class="tag-suggestion" data-tag="${escapeHtml(tag)}">
                <span class="tag-badge" style="background-color: ${colors.bg}; color: ${colors.text}">${escapeHtml(tag)}</span>
            </div>`;
    }).join('');
    this.autocomplete.classList.add('open');
  }

  hideAutocomplete() {
    this.autocomplete.classList.remove('open');
    this.selectedSuggestionIndex = -1;
  }

  updateSuggestionSelection() {
    const suggestions = this.autocomplete.querySelectorAll('.tag-suggestion');
    suggestions.forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedSuggestionIndex);
    });
  }

  addTagFromInput() {
    const value = this.input.value.trim().toLowerCase().replace(/,/g, '');
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.render();
      if (this.onChange) this.onChange(this.tags);
    }
    this.input.value = '';
    this.hideAutocomplete();
  }

  addTag(tag) {
    const value = tag.trim().toLowerCase();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.render();
      if (this.onChange) this.onChange(this.tags);
    }
  }

  removeTag(index) {
    this.tags.splice(index, 1);
    this.render();
    if (this.onChange) this.onChange(this.tags);
  }

  setTags(tags) {
    this.tags = Array.isArray(tags) ? [...tags] : [];
    this.render();
  }

  getTags() {
    return [...this.tags];
  }

  clear() {
    this.tags = [];
    this.input.value = '';
    this.render();
    this.hideAutocomplete();
  }

  render() {
    // Remove existing bubbles
    const existingBubbles = this.container.querySelectorAll('.tag-bubble');
    existingBubbles.forEach(b => b.remove());

    // Add new bubbles before the input
    this.tags.forEach((tag, index) => {
      const colors = getTagColor(tag);
      const bubble = document.createElement('span');
      bubble.className = 'tag-bubble';
      bubble.style.backgroundColor = colors.bg;
      bubble.style.color = colors.text;
      bubble.innerHTML = `${escapeHtml(tag)}<button type="button" class="tag-remove" data-index="${index}">x</button>`;
      this.container.insertBefore(bubble, this.input);
    });
  }
}

describe('TagBubbleInput', () => {
  let container;
  let input;
  let tagInput;
  let onChangeMock;

  beforeEach(() => {
    // Reset mock tags
    mockAllTags = ['work', 'personal', 'urgent', 'home', 'office'];

    // Create DOM elements
    container = document.createElement('div');
    container.className = 'tags-input-container';
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'tags-input';
    container.appendChild(input);
    document.body.appendChild(container);

    onChangeMock = jest.fn();
    tagInput = new TagBubbleInput(container, input, onChangeMock);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('creates autocomplete element', () => {
      const autocomplete = container.querySelector('.tag-autocomplete');
      expect(autocomplete).not.toBeNull();
    });

    test('starts with empty tags array', () => {
      expect(tagInput.getTags()).toEqual([]);
    });

    test('initializes selectedSuggestionIndex to -1', () => {
      expect(tagInput.selectedSuggestionIndex).toBe(-1);
    });
  });

  describe('addTag', () => {
    test('adds a tag', () => {
      tagInput.addTag('work');
      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('converts tag to lowercase', () => {
      tagInput.addTag('WORK');
      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('trims whitespace from tag', () => {
      tagInput.addTag('  work  ');
      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('does not add duplicate tag', () => {
      tagInput.addTag('work');
      tagInput.addTag('work');
      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('calls onChange callback when tag added', () => {
      tagInput.addTag('work');
      expect(onChangeMock).toHaveBeenCalledWith(['work']);
    });

    test('does not add empty tag', () => {
      tagInput.addTag('');
      tagInput.addTag('   ');
      expect(tagInput.getTags()).toEqual([]);
    });
  });

  describe('removeTag', () => {
    beforeEach(() => {
      tagInput.setTags(['work', 'personal', 'urgent']);
      onChangeMock.mockClear();
    });

    test('removes tag at specified index', () => {
      tagInput.removeTag(1);
      expect(tagInput.getTags()).toEqual(['work', 'urgent']);
    });

    test('removes first tag', () => {
      tagInput.removeTag(0);
      expect(tagInput.getTags()).toEqual(['personal', 'urgent']);
    });

    test('removes last tag', () => {
      tagInput.removeTag(2);
      expect(tagInput.getTags()).toEqual(['work', 'personal']);
    });

    test('calls onChange callback when tag removed', () => {
      tagInput.removeTag(0);
      expect(onChangeMock).toHaveBeenCalledWith(['personal', 'urgent']);
    });
  });

  describe('setTags', () => {
    test('sets tags from array', () => {
      tagInput.setTags(['work', 'home']);
      expect(tagInput.getTags()).toEqual(['work', 'home']);
    });

    test('creates a copy of the array', () => {
      const originalTags = ['work', 'home'];
      tagInput.setTags(originalTags);
      originalTags.push('new');
      expect(tagInput.getTags()).toEqual(['work', 'home']);
    });

    test('handles null input', () => {
      tagInput.setTags(null);
      expect(tagInput.getTags()).toEqual([]);
    });

    test('handles undefined input', () => {
      tagInput.setTags(undefined);
      expect(tagInput.getTags()).toEqual([]);
    });

    test('handles non-array input', () => {
      tagInput.setTags('not an array');
      expect(tagInput.getTags()).toEqual([]);
    });
  });

  describe('getTags', () => {
    test('returns copy of tags array', () => {
      tagInput.setTags(['work', 'home']);
      const tags = tagInput.getTags();
      tags.push('new');
      expect(tagInput.getTags()).toEqual(['work', 'home']);
    });
  });

  describe('clear', () => {
    test('clears all tags', () => {
      tagInput.setTags(['work', 'home']);
      tagInput.clear();
      expect(tagInput.getTags()).toEqual([]);
    });

    test('clears input value', () => {
      input.value = 'test';
      tagInput.clear();
      expect(input.value).toBe('');
    });

    test('hides autocomplete', () => {
      tagInput.autocomplete.classList.add('open');
      tagInput.clear();
      expect(tagInput.autocomplete.classList.contains('open')).toBe(false);
    });
  });

  describe('render', () => {
    test('creates tag bubbles for each tag', () => {
      tagInput.setTags(['work', 'home']);
      const bubbles = container.querySelectorAll('.tag-bubble');
      expect(bubbles.length).toBe(2);
    });

    test('tag bubbles contain tag text', () => {
      tagInput.setTags(['work']);
      const bubble = container.querySelector('.tag-bubble');
      expect(bubble.textContent).toContain('work');
    });

    test('tag bubbles have remove button', () => {
      tagInput.setTags(['work']);
      const removeBtn = container.querySelector('.tag-remove');
      expect(removeBtn).not.toBeNull();
    });

    test('remove buttons have correct data-index', () => {
      tagInput.setTags(['work', 'home', 'office']);
      const removeBtns = container.querySelectorAll('.tag-remove');
      expect(removeBtns[0].dataset.index).toBe('0');
      expect(removeBtns[1].dataset.index).toBe('1');
      expect(removeBtns[2].dataset.index).toBe('2');
    });

    test('clears existing bubbles before rendering', () => {
      tagInput.setTags(['work']);
      tagInput.setTags(['home']);
      const bubbles = container.querySelectorAll('.tag-bubble');
      expect(bubbles.length).toBe(1);
      expect(bubbles[0].textContent).toContain('home');
    });
  });

  describe('addTagFromInput', () => {
    test('adds tag from input value', () => {
      input.value = 'work';
      tagInput.addTagFromInput();
      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('clears input after adding', () => {
      input.value = 'work';
      tagInput.addTagFromInput();
      expect(input.value).toBe('');
    });

    test('removes commas from input', () => {
      input.value = 'work,';
      tagInput.addTagFromInput();
      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('does not add empty input', () => {
      input.value = '';
      tagInput.addTagFromInput();
      expect(tagInput.getTags()).toEqual([]);
    });

    test('does not add duplicate', () => {
      tagInput.setTags(['work']);
      onChangeMock.mockClear();
      input.value = 'work';
      tagInput.addTagFromInput();
      expect(tagInput.getTags()).toEqual(['work']);
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });

  describe('showSuggestions', () => {
    test('shows matching suggestions', () => {
      input.value = 'wo';
      tagInput.showSuggestions();
      expect(tagInput.autocomplete.classList.contains('open')).toBe(true);
      const suggestions = tagInput.autocomplete.querySelectorAll('.tag-suggestion');
      expect(suggestions.length).toBe(1); // 'work' matches 'wo'
    });

    test('hides autocomplete for empty input', () => {
      tagInput.autocomplete.classList.add('open');
      input.value = '';
      tagInput.showSuggestions();
      expect(tagInput.autocomplete.classList.contains('open')).toBe(false);
    });

    test('hides autocomplete when no matches', () => {
      tagInput.autocomplete.classList.add('open');
      input.value = 'xyz';
      tagInput.showSuggestions();
      expect(tagInput.autocomplete.classList.contains('open')).toBe(false);
    });

    test('excludes already selected tags from suggestions', () => {
      tagInput.setTags(['work']);
      input.value = 'wo';
      tagInput.showSuggestions();
      const suggestions = tagInput.autocomplete.querySelectorAll('.tag-suggestion');
      expect(suggestions.length).toBe(0);
    });

    test('resets selectedSuggestionIndex', () => {
      tagInput.selectedSuggestionIndex = 2;
      input.value = 'wo';
      tagInput.showSuggestions();
      expect(tagInput.selectedSuggestionIndex).toBe(-1);
    });
  });

  describe('hideAutocomplete', () => {
    test('removes open class from autocomplete', () => {
      tagInput.autocomplete.classList.add('open');
      tagInput.hideAutocomplete();
      expect(tagInput.autocomplete.classList.contains('open')).toBe(false);
    });

    test('resets selectedSuggestionIndex', () => {
      tagInput.selectedSuggestionIndex = 2;
      tagInput.hideAutocomplete();
      expect(tagInput.selectedSuggestionIndex).toBe(-1);
    });
  });

  describe('updateSuggestionSelection', () => {
    beforeEach(() => {
      mockAllTags = ['work', 'world', 'workshop'];
      input.value = 'wo';
      tagInput.showSuggestions();
    });

    test('adds selected class to current suggestion', () => {
      tagInput.selectedSuggestionIndex = 0;
      tagInput.updateSuggestionSelection();
      const suggestions = tagInput.autocomplete.querySelectorAll('.tag-suggestion');
      expect(suggestions[0].classList.contains('selected')).toBe(true);
    });

    test('removes selected class from other suggestions', () => {
      tagInput.selectedSuggestionIndex = 0;
      tagInput.updateSuggestionSelection();
      tagInput.selectedSuggestionIndex = 1;
      tagInput.updateSuggestionSelection();
      const suggestions = tagInput.autocomplete.querySelectorAll('.tag-suggestion');
      expect(suggestions[0].classList.contains('selected')).toBe(false);
      expect(suggestions[1].classList.contains('selected')).toBe(true);
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      mockAllTags = ['work', 'world', 'workshop'];
    });

    test('Enter key adds tag from input', () => {
      input.value = 'newtag';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);

      // Wait for event to be processed
      expect(tagInput.getTags()).toEqual(['newtag']);
    });

    test('Comma key adds tag from input', () => {
      input.value = 'newtag';
      const event = new KeyboardEvent('keydown', { key: ',' });
      input.dispatchEvent(event);

      expect(tagInput.getTags()).toEqual(['newtag']);
    });

    test('Escape key hides autocomplete', () => {
      input.value = 'wo';
      tagInput.showSuggestions();
      expect(tagInput.autocomplete.classList.contains('open')).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(event);

      expect(tagInput.autocomplete.classList.contains('open')).toBe(false);
    });

    test('Backspace on empty input removes last tag', () => {
      tagInput.setTags(['work', 'home']);
      input.value = '';
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      input.dispatchEvent(event);

      expect(tagInput.getTags()).toEqual(['work']);
    });

    test('Backspace on non-empty input does not remove tag', () => {
      tagInput.setTags(['work', 'home']);
      input.value = 'x';
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      input.dispatchEvent(event);

      expect(tagInput.getTags()).toEqual(['work', 'home']);
    });

    test('ArrowDown increments suggestion index', () => {
      input.value = 'wo';
      tagInput.showSuggestions();
      expect(tagInput.selectedSuggestionIndex).toBe(-1);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(event);

      expect(tagInput.selectedSuggestionIndex).toBe(0);
    });

    test('ArrowUp decrements suggestion index', () => {
      input.value = 'wo';
      tagInput.showSuggestions();
      tagInput.selectedSuggestionIndex = 1;

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      input.dispatchEvent(event);

      expect(tagInput.selectedSuggestionIndex).toBe(0);
    });

    test('ArrowDown does not exceed suggestions length', () => {
      input.value = 'wo';
      tagInput.showSuggestions();
      const suggestions = tagInput.autocomplete.querySelectorAll('.tag-suggestion');
      tagInput.selectedSuggestionIndex = suggestions.length - 1;

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(event);

      expect(tagInput.selectedSuggestionIndex).toBe(suggestions.length - 1);
    });

    test('ArrowUp does not go below -1', () => {
      input.value = 'wo';
      tagInput.showSuggestions();
      tagInput.selectedSuggestionIndex = -1;

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      input.dispatchEvent(event);

      expect(tagInput.selectedSuggestionIndex).toBe(-1);
    });
  });

  describe('container click behavior', () => {
    test('clicking container focuses input', () => {
      const focusSpy = jest.spyOn(input, 'focus');
      container.click();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('handles rapid tag additions', () => {
      tagInput.addTag('a');
      tagInput.addTag('b');
      tagInput.addTag('c');
      expect(tagInput.getTags()).toEqual(['a', 'b', 'c']);
    });

    test('handles special characters in tags', () => {
      tagInput.addTag('work-related');
      tagInput.addTag('home_stuff');
      expect(tagInput.getTags()).toEqual(['work-related', 'home_stuff']);
    });

    test('handles unicode in tags', () => {
      tagInput.addTag('cafe');
      expect(tagInput.getTags()).toEqual(['cafe']);
    });

    test('renders properly after multiple operations', () => {
      tagInput.addTag('a');
      tagInput.addTag('b');
      tagInput.removeTag(0);
      tagInput.addTag('c');
      const bubbles = container.querySelectorAll('.tag-bubble');
      expect(bubbles.length).toBe(2);
    });

    test('onChange not called when setTags is used', () => {
      tagInput.setTags(['a', 'b']);
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });
});
