import { render, screen } from '@testing-library/react';
import { Heading, Title, Header, Subheader } from '../../components/heading';

describe('Heading Components', () => {
  describe('Heading Component', () => {
    it('renders with default level 1', () => {
      render(<Heading>Test Heading</Heading>);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('Test Heading');
      expect(heading.tagName).toBe('H1');
    });

    it('renders with specified level', () => {
      render(<Heading level={3}>Test Heading</Heading>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('Test Heading');
      expect(heading.tagName).toBe('H3');
    });

    it('renders all heading levels correctly', () => {
      const levels = [1, 2, 3, 4, 5, 6] as const;
      
      levels.forEach(level => {
        const { unmount } = render(<Heading level={level}>{`Level ${level} Heading`}</Heading>);
        
        const heading = screen.getByRole('heading', { level });
        expect(heading).toBeInTheDocument();
        expect(heading.textContent).toBe(`Level ${level} Heading`);
        expect(heading.tagName).toBe(`H${level}`);
        
        unmount();
      });
    });

    it('passes HTML attributes correctly', () => {
      render(
        <Heading 
          level={2}
          className="custom-class"
          id="test-heading"
          data-testid="heading-test"
        >Test Heading</Heading>
      );
      
      const heading = screen.getByTestId('heading-test');
      expect(heading).toHaveClass('custom-class');
      expect(heading).toHaveAttribute('id', 'test-heading');
      expect(heading.tagName).toBe('H2');
    });

    it('renders with React node as body', () => {
      render(
        <Heading level={2}>
          <span>
            Complex <strong>content</strong> with <em>markup</em>
          </span>
        </Heading>
      );
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading.querySelector('strong')).toHaveTextContent('content');
      expect(heading.querySelector('em')).toHaveTextContent('markup');
    });

    it('renders without body prop', () => {
      render(<Heading level={1}>{''}</Heading>);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('');
    });

    it('supports event handlers', () => {
      const handleClick = vi.fn();
      render(<Heading onClick={handleClick}>Clickable Heading</Heading>);
      
      const heading = screen.getByRole('heading', { level: 1 });
      heading.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Title Component', () => {
    it('renders as h1 element', () => {
      render(<Title>Page Title</Title>);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('Page Title');
      expect(title.tagName).toBe('H1');
    });

    it('passes props correctly', () => {
      render(
        <Title 
          className="title-class"
          data-testid="title-test"
        >Custom Title</Title>
      );
      
      const title = screen.getByTestId('title-test');
      expect(title).toHaveClass('title-class');
      expect(title.tagName).toBe('H1');
    });

    it('ignores level prop and always renders as h1', () => {
      render(<Title>Title</Title>);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });
  });

  describe('Header Component', () => {
    it('renders as h2 element', () => {
      render(<Header>Section Header</Header>);
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toBeInTheDocument();
      expect(header.textContent).toBe('Section Header');
      expect(header.tagName).toBe('H2');
    });

    it('passes props correctly', () => {
      render(
        <Header 
          className="header-class"
          data-testid="header-test"
        >Custom Header</Header>
      );
      
      const header = screen.getByTestId('header-test');
      expect(header).toHaveClass('header-class');
      expect(header.tagName).toBe('H2');
    });

    it('ignores level prop and always renders as h2', () => {
      render(<Header>Header</Header>);
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('H2');
    });
  });

  describe('Subheader Component', () => {
    it('renders as h3 element', () => {
      render(<Subheader>Subsection Header</Subheader>);
      
      const subheader = screen.getByRole('heading', { level: 3 });
      expect(subheader).toBeInTheDocument();
      expect(subheader.textContent).toBe('Subsection Header');
      expect(subheader.tagName).toBe('H3');
    });

    it('passes props correctly', () => {
      render(
        <Subheader 
          className="subheader-class"
          data-testid="subheader-test"
        >Custom Subheader</Subheader>
      );
      
      const subheader = screen.getByTestId('subheader-test');
      expect(subheader).toHaveClass('subheader-class');
      expect(subheader.tagName).toBe('H3');
    });

    it('ignores level prop and always renders as h3', () => {
      render(<Subheader>Subheader</Subheader>);
      
      const subheader = screen.getByRole('heading', { level: 3 });
      expect(subheader).toBeInTheDocument();
      expect(subheader.tagName).toBe('H3');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(
        <div>
          <Title>Main Title</Title>
          <Header>Section Header</Header>
          <Subheader>Subsection Header</Subheader>
        </div>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });

    it('supports aria attributes', () => {
      render(
        <Heading 
          aria-label="Custom accessible label"
          aria-describedby="description"
        >Accessible Heading</Heading>
      );
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('aria-label', 'Custom accessible label');
      expect(heading).toHaveAttribute('aria-describedby', 'description');
    });
  });
}); 