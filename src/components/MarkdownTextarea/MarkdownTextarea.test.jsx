import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownTextarea from './MarkdownTextarea';

describe('MarkdownTextarea', () => {
  it('forwards the textarea ref so call sites can still auto-resize', () => {
    const ref = createRef();
    render(<MarkdownTextarea ref={ref} value="" onChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('calls onChange with the user input', () => {
    const onChange = vi.fn();
    render(<MarkdownTextarea value="" onChange={onChange} aria-label="composer" />);
    const textarea = screen.getByLabelText('composer');
    fireEvent.change(textarea, { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('passes through arbitrary textarea props', () => {
    render(
      <MarkdownTextarea value="" onChange={() => {}} placeholder="Ask anything" rows={2} disabled />
    );
    const textarea = screen.getByPlaceholderText('Ask anything');
    expect(textarea).toBeDisabled();
    expect(textarea.rows).toBe(2);
  });

  it('applies the caller className to both the mirror and the textarea so metrics align', () => {
    const { container } = render(
      <MarkdownTextarea value="" onChange={() => {}} className="custom" />
    );
    const styled = container.querySelectorAll('.custom');
    expect(styled.length).toBe(2);
  });

  it('renders the mirror with aria-hidden so screen readers only see the textarea', () => {
    const { container } = render(<MarkdownTextarea value="# Heading" onChange={() => {}} />);
    const mirror = container.querySelector('[aria-hidden="true"]');
    expect(mirror).not.toBeNull();
  });

  it('mirrors the current value in the DOM', () => {
    const { container } = render(
      <MarkdownTextarea value="Hello **bold** world" onChange={() => {}} />
    );
    const mirror = container.querySelector('[aria-hidden="true"]');
    expect(mirror.textContent).toContain('Hello');
    expect(mirror.textContent).toContain('**bold**');
    expect(mirror.textContent).toContain('world');
  });

  it('invokes forwarded onScroll and keeps the mirror in sync', () => {
    const onScroll = vi.fn();
    const { container } = render(
      <MarkdownTextarea
        value={'line\n'.repeat(50)}
        onChange={() => {}}
        onScroll={onScroll}
        aria-label="composer"
      />
    );
    const textarea = screen.getByLabelText('composer');
    fireEvent.scroll(textarea, { target: { scrollTop: 120 } });
    expect(onScroll).toHaveBeenCalledTimes(1);
    const mirror = container.querySelector('[aria-hidden="true"]');
    expect(mirror.scrollTop).toBe(textarea.scrollTop);
  });
});
