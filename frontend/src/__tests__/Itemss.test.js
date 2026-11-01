import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Itemss from '../components/Itemss/Itemss';

const renderItem = () =>
  render(
    <MemoryRouter>
      <Itemss id={7} name="Green Zippered Jacket" image="jacket.png" new_price={85} old_price={120.5} />
    </MemoryRouter>
  );

test('shows the real product name (it used to print the text "props.name")', () => {
  renderItem();
  expect(screen.getByText('Green Zippered Jacket')).toBeInTheDocument();
  expect(screen.queryByText('props.name')).not.toBeInTheDocument();
});

test('shows both prices formatted', () => {
  renderItem();
  expect(screen.getByText('$85.00')).toBeInTheDocument();
  expect(screen.getByText('$120.50')).toBeInTheDocument();
});

test('links to the product page', () => {
  renderItem();
  expect(screen.getByRole('link')).toHaveAttribute('href', '/product/7');
});
