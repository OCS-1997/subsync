# Floating Calculator Widget

A production-grade floating calculator widget with advanced features including standard calculator operations, memory functions, and currency conversion.

## Features

- **Standard Calculator**: Full arithmetic operations (addition, subtraction, multiplication, division)
- **Advanced Operations**: Parentheses, percentage calculations
- **Memory Functions**: M+, M-, MC, MR
- **Currency Converter**: Live exchange rates with 9 supported currencies
- **Keyboard Support**: Full keyboard input support
- **Smooth Animations**: Slide-up panel with backdrop blur
- **Responsive Design**: Works on desktop and mobile devices

## Installation

Before using the calculator, install the required dependency:

```bash
npm install mathjs
```

## Usage

The calculator is already integrated into `App.jsx` and will appear as a floating button in the bottom-right corner of the application.

### Manual Integration

If you need to add it to a different location:

```jsx
import FloatingCalculator from '@/components/FloatingCalculator/FloatingCalculator.jsx';

function YourComponent() {
  return (
    <>
      {/* Your other components */}
      <FloatingCalculator />
    </>
  );
}
```

## Component Structure

```
/components/FloatingCalculator/
    ├── FloatingCalculator.jsx      # Main component with floating button
    ├── CalculatorPanel.jsx         # Slide-up panel container
    ├── StandardCalculator.jsx      # Calculator with math operations
    ├── CurrencyConverter.jsx       # Currency conversion feature
    ├── styles.css                  # Component styles
    ├── currency-rates.json         # Fallback exchange rates
    └── README.md                   # This file
```

## Currency Support

The currency converter supports:
- USD (US Dollar)
- INR (Indian Rupee)
- EUR (Euro)
- GBP (British Pound)
- AED (UAE Dirham)
- AUD (Australian Dollar)
- CAD (Canadian Dollar)
- JPY (Japanese Yen)
- SGD (Singapore Dollar)

The converter attempts to fetch live rates from an API and falls back to the JSON file if the API is unavailable.

## Keyboard Shortcuts

- **Numbers (0-9)**: Input numbers
- **Operators (+, -, *, /)**: Mathematical operations
- **Enter or =**: Calculate result
- **Escape or C**: Clear calculator
- **Backspace**: Delete last character
- **%**: Calculate percentage
- **( )**: Parentheses for complex expressions

## Styling

The component uses CSS classes defined in `styles.css`. You can customize the appearance by modifying the CSS file or overriding classes with Tailwind CSS utilities.

## Notes

- The calculator uses `mathjs` for safe expression evaluation
- Currency rates are fetched from a free API with JSON fallback
- The panel closes on ESC key or click outside
- Body scroll is disabled when the panel is open

