import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ComparisonBlock from './ComparisonBlock';

const twoItemSpec = JSON.stringify({
  items: [
    {
      name: 'Portsmouth to Fishbourne',
      description: 'Most popular vehicle route',
      pros: ['45-min crossing', 'Frequent sailings'],
      cons: ['Busy drive through Portsmouth'],
    },
    {
      name: 'Lymington to Yarmouth',
      description: 'Shortest crossing via the New Forest',
      pros: ['40-min crossing', 'Scenic drive'],
      cons: ['Fewer sailings'],
    },
  ],
});

describe('ComparisonBlock', () => {
  it('renders a card per item with name and description', () => {
    render(<ComparisonBlock spec={twoItemSpec} />);

    expect(screen.getByRole('heading', { name: 'Portsmouth to Fishbourne' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lymington to Yarmouth' })).toBeInTheDocument();
    expect(screen.getByText('Most popular vehicle route')).toBeInTheDocument();
    expect(screen.getByText('Shortest crossing via the New Forest')).toBeInTheDocument();
  });

  it('renders pros and cons for every item', () => {
    render(<ComparisonBlock spec={twoItemSpec} />);

    expect(screen.getAllByText('Pros')).toHaveLength(2);
    expect(screen.getAllByText('Cons')).toHaveLength(2);
    expect(screen.getByText('45-min crossing')).toBeInTheDocument();
    expect(screen.getByText('Frequent sailings')).toBeInTheDocument();
    expect(screen.getByText('Busy drive through Portsmouth')).toBeInTheDocument();
    expect(screen.getByText('Fewer sailings')).toBeInTheDocument();
  });

  it('assigns a sequential letter badge (A, B, C…) to each card', () => {
    render(<ComparisonBlock spec={twoItemSpec} />);
    const block = screen.getByTestId('comparison-block');
    const articles = block.querySelectorAll('article');
    expect(articles).toHaveLength(2);
    expect(within(articles[0]).getByText('A')).toBeInTheDocument();
    expect(within(articles[1]).getByText('B')).toBeInTheDocument();
  });

  it('renders a features section when provided', () => {
    const spec = JSON.stringify({
      items: [
        { name: 'Plan A', features: ['Fast', 'Reliable'] },
        { name: 'Plan B', features: ['Cheap'] },
      ],
    });
    render(<ComparisonBlock spec={spec} />);
    expect(screen.getAllByText('Features')).toHaveLength(2);
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('Cheap')).toBeInTheDocument();
  });

  it('accepts a pre-parsed spec object', () => {
    const parsed = JSON.parse(twoItemSpec);
    render(<ComparisonBlock spec={parsed} />);
    expect(screen.getByRole('heading', { name: 'Portsmouth to Fishbourne' })).toBeInTheDocument();
  });

  it('shows a skeleton while streaming with invalid JSON', () => {
    render(<ComparisonBlock spec={'{ bad json '} isStreaming />);
    expect(screen.getByText(/Building comparison/)).toBeInTheDocument();
  });

  it('shows an error when a final spec cannot be parsed', () => {
    render(<ComparisonBlock spec={'nope'} />);
    expect(screen.getByText('Could not parse comparison data')).toBeInTheDocument();
  });

  it('shows an error when fewer than two valid items exist', () => {
    const spec = JSON.stringify({ items: [{ name: 'Only one' }] });
    render(<ComparisonBlock spec={spec} />);
    expect(screen.getByText('Could not parse comparison data')).toBeInTheDocument();
  });

  it('applies the column count as a CSS custom property', () => {
    render(<ComparisonBlock spec={twoItemSpec} />);
    const grid = screen.getByTestId('comparison-block').firstChild;
    expect(grid.style.getPropertyValue('--comparison-cols')).toBe('2');
  });

  it('omits the pros section when the pros array is empty', () => {
    const spec = JSON.stringify({
      items: [
        { name: 'One', cons: ['bad'] },
        { name: 'Two', cons: ['worse'] },
      ],
    });
    render(<ComparisonBlock spec={spec} />);
    expect(screen.queryByText('Pros')).not.toBeInTheDocument();
    expect(screen.getAllByText('Cons')).toHaveLength(2);
  });
});
