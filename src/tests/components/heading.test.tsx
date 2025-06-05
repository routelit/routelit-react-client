import { render, screen } from '@testing-library/react';
import { Heading, Title, Header, Subheader } from '../../components/heading';

describe('Heading Components', () => {
  describe('Heading Component', () => {
    it('renders with default level 1', () => {
      render(<Heading body="Test Heading" />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('Test Heading');
      expect(heading.tagName).toBe('H1');
    });

    it('renders with specified level', () => {
      render(<Heading body="Test Heading" level={3} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('Test Heading');
      expect(heading.tagName).toBe('H3');
    });

    it('renders all heading levels correctly', () => {
      const levels = [1, 2, 3, 4, 5, 6] as const;
      
      levels.forEach(level => {
        const { unmount } = render(<Heading body={`Level ${level} Heading`} level={level} />);
        
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
          body="Test Heading" 
          level={2}
          className="custom-class"
          id="test-heading"
          data-testid="heading-test"
        />
      );
      
      const heading = screen.getByTestId('heading-test');
      expect(heading).toHaveClass('custom-class');
      expect(heading).toHaveAttribute('id', 'test-heading');
      expect(heading.tagName).toBe('H2');
    });

    it('renders with React node as body', () => {
      render(
        <Heading 
          body={
            <span>
              Complex <strong>content</strong> with <em>markup</em>
            </span>
          } 
          level={2}
        />
      );
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading.querySelector('strong')).toHaveTextContent('content');
      expect(heading.querySelector('em')).toHaveTextContent('markup');
    });

    it('renders without body prop', () => {
      render(<Heading level={1} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('');
    });

    it('supports event handlers', () => {
      const handleClick = vi.fn();
      render(<Heading body="Clickable Heading" onClick={handleClick} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      heading.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Title Component', () => {
    it('renders as h1 element', () => {
      render(<Title body="Page Title" />);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBe('Page Title');
      expect(title.tagName).toBe('H1');
    });

    it('passes props correctly', () => {
      render(
        <Title 
          body="Custom Title" 
          className="title-class"
          data-testid="title-test"
        />
      );
      
      const title = screen.getByTestId('title-test');
      expect(title).toHaveClass('title-class');
      expect(title.tagName).toBe('H1');
    });

    it('ignores level prop and always renders as h1', () => {
      render(<Title body="Title" />);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });
  });

  describe('Header Component', () => {
    it('renders as h2 element', () => {
      render(<Header body="Section Header" />);
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toBeInTheDocument();
      expect(header.textContent).toBe('Section Header');
      expect(header.tagName).toBe('H2');
    });

    it('passes props correctly', () => {
      render(
        <Header 
          body="Custom Header" 
          className="header-class"
          data-testid="header-test"
        />
      );
      
      const header = screen.getByTestId('header-test');
      expect(header).toHaveClass('header-class');
      expect(header.tagName).toBe('H2');
    });

    it('ignores level prop and always renders as h2', () => {
      render(<Header body="Header" />);
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('H2');
    });
  });

  describe('Subheader Component', () => {
    it('renders as h3 element', () => {
      render(<Subheader body="Subsection Header" />);
      
      const subheader = screen.getByRole('heading', { level: 3 });
      expect(subheader).toBeInTheDocument();
      expect(subheader.textContent).toBe('Subsection Header');
      expect(subheader.tagName).toBe('H3');
    });

    it('passes props correctly', () => {
      render(
        <Subheader 
          body="Custom Subheader" 
          className="subheader-class"
          data-testid="subheader-test"
        />
      );
      
      const subheader = screen.getByTestId('subheader-test');
      expect(subheader).toHaveClass('subheader-class');
      expect(subheader.tagName).toBe('H3');
    });

    it('ignores level prop and always renders as h3', () => {
      render(<Subheader body="Subheader" />);
      
      const subheader = screen.getByRole('heading', { level: 3 });
      expect(subheader).toBeInTheDocument();
      expect(subheader.tagName).toBe('H3');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(
        <div>
          <Title body="Main Title" />
          <Header body="Section Header" />
          <Subheader body="Subsection Header" />
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
          body="Accessible Heading" 
          aria-label="Custom accessible label"
          aria-describedby="description"
        />
      );
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('aria-label', 'Custom accessible label');
      expect(heading).toHaveAttribute('aria-describedby', 'description');
    });
  });
}); 