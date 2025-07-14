import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import initManager from '../../core/initializer';
import { RouteLitManager } from '../../core/manager';

// Mock the RouteLitManager
vi.mock('../../core/manager', () => ({
  RouteLitManager: vi.fn(),
}));

describe('initManager', () => {
  let mockGetElementById: ReturnType<typeof vi.fn>;
  let originalGetElementById: typeof document.getElementById;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Store the original getElementById
    originalGetElementById = document.getElementById;
    
    // Mock getElementById
    mockGetElementById = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document.getElementById as any) = mockGetElementById;
  });

  afterEach(() => {
    // Restore the original getElementById
    document.getElementById = originalGetElementById;
  });

  it('initializes manager with components tree from DOM element', () => {
    const mockComponentsTree = [
      {
        name: 'test-component',
        key: 'test-1',
        props: {},
        children: undefined,
        address: undefined,
        stale: false,
      },
    ];

    const mockElement = {
      value: JSON.stringify(mockComponentsTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    const result = initManager('test-selector');

    expect(mockGetElementById).toHaveBeenCalledWith('test-selector');
    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: mockComponentsTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });

  it('throws error when element is not found', () => {
    mockGetElementById.mockReturnValue(null);

    expect(() => {
      initManager('non-existent-selector');
    }).toThrow("'non-existent-selector' element not found.");
  });

  it('handles complex components tree structure', () => {
    const complexComponentsTree = [
      {
        name: 'container',
        key: 'container-1',
        props: { className: 'main-container' },
        children: [
          {
            name: 'input',
            key: 'input-1',
            props: { type: 'text', placeholder: 'Enter text' },
            children: undefined,
            address: [0],
            stale: false,
          },
          {
            name: 'button',
            key: 'button-1',
            props: { text: 'Submit' },
            children: undefined,
            address: [1],
            stale: false,
          },
        ],
        address: undefined,
        stale: false,
      },
    ];

    const mockElement = {
      value: JSON.stringify(complexComponentsTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    const result = initManager('complex-selector');

    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: complexComponentsTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });

  it('handles empty components tree', () => {
    const emptyComponentsTree: unknown[] = [];

    const mockElement = {
      value: JSON.stringify(emptyComponentsTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    const result = initManager('empty-selector');

    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: emptyComponentsTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });

  it('handles components tree with nested children', () => {
    const nestedComponentsTree = [
      {
        name: 'form',
        key: 'form-1',
        props: { id: 'test-form' },
        children: [
          {
            name: 'fieldset',
            key: 'fieldset-1',
            props: { legend: 'Personal Information' },
            children: [
              {
                name: 'input',
                key: 'name-input',
                props: { type: 'text', label: 'Name' },
                children: undefined,
                address: [0, 0],
                stale: false,
              },
              {
                name: 'input',
                key: 'email-input',
                props: { type: 'email', label: 'Email' },
                children: undefined,
                address: [0, 1],
                stale: false,
              },
            ],
            address: [0],
            stale: false,
          },
        ],
        address: undefined,
        stale: false,
      },
    ];

    const mockElement = {
      value: JSON.stringify(nestedComponentsTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    const result = initManager('nested-selector');

    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: nestedComponentsTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });

  it('handles components with stale flag', () => {
    const staleComponentsTree = [
      {
        name: 'stale-component',
        key: 'stale-1',
        props: {},
        children: undefined,
        address: undefined,
        stale: true,
      },
    ];

    const mockElement = {
      value: JSON.stringify(staleComponentsTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    const result = initManager('stale-selector');

    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: staleComponentsTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });

  it('handles components with address arrays', () => {
    const addressedComponentsTree = [
      {
        name: 'addressed-component',
        key: 'addressed-1',
        props: {},
        children: undefined,
        address: [1, 2, 3, 4],
        stale: false,
      },
    ];

    const mockElement = {
      value: JSON.stringify(addressedComponentsTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    const result = initManager('addressed-selector');

    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: addressedComponentsTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });

  it('handles invalid JSON gracefully', () => {
    const mockElement = {
      value: 'invalid json string',
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    expect(() => {
      initManager('invalid-json-selector');
    }).toThrow();
  });

  it('handles malformed components tree', () => {
    const malformedTree = [
      {
        name: 'component',
        // Missing required properties
      },
    ];

    const mockElement = {
      value: JSON.stringify(malformedTree),
    } as HTMLInputElement;

    mockGetElementById.mockReturnValue(mockElement);

    // Should not throw, but the manager might handle it
    const result = initManager('malformed-selector');

    expect(RouteLitManager).toHaveBeenCalledWith({ componentsTree: malformedTree });
    expect(result).toBeInstanceOf(RouteLitManager);
  });
}); 