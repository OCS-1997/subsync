# 🧮 Floating Calculator Widget

A modern, draggable floating calculator widget for the Subsync application with complex mathematical operations and live currency conversion.

## ✨ Features

### Calculator Mode
- **Basic Operations**: Addition (+), Subtraction (−), Multiplication (×), Division (÷)
- **Complex Calculations**: 
  - Support for brackets/parentheses for order of operations
  - Extended calculations (chained operations)
  - Decimal point support
  - Percentage calculations
- **Functions**:
  - Clear (C) and Clear Entry (CE)
  - Backspace/Delete functionality
  - Memory functions (M+, M-, MR, MC)
- **Keyboard Support**: Full keyboard input for numbers, operators, and functions

### Currency Converter Mode
- **Top 10 Currencies**:
  - USD - US Dollar
  - EUR - Euro
  - GBP - British Pound
  - INR - Indian Rupee ⭐
  - ERN - Eritrean Nakfa ⭐
  - JPY - Japanese Yen
  - AUD - Australian Dollar
  - CAD - Canadian Dollar
  - CHF - Swiss Franc
  - CNY - Chinese Yuan

- **Live Exchange Rates**: Fetched from exchangerate-api.com
- **Real-time Conversion**: Updates as you type
- **Swap Currencies**: Quick button to swap from/to currencies
- **Caching**: Rates cached for 1 hour in localStorage
- **Offline Mode**: Uses cached rates when offline
- **Last Updated Timestamp**: Shows when rates were last fetched
- **Manual Refresh**: Button to force refresh rates

### Drag & Drop
- **Smooth Dragging**: Zero delay, butter-smooth drag experience
- **Drag Handle**: Drag by clicking the header/title bar
- **Visual Feedback**: Shadow elevation increases during drag
- **Boundary Constraints**: Stays within viewport
- **Position Persistence**: Saves position to localStorage
- **Responsive**: Handles window resize gracefully

### UI/UX
- **Modern Glassmorphism**: Semi-transparent background with backdrop blur
- **Smooth Animations**: 
  - Genie-like open/close animation
  - Button press animations
  - Ripple effects on clicks
  - Micro-animations on hover
- **Tab Switcher**: Easy toggle between Calculator and Currency modes
- **Responsive Design**: Works on all screen sizes
- **Theme Integration**: Matches Subsync design system

## 🎯 Usage

### Opening the Calculator
1. **NavBar Button**: Click the calculator icon in the navigation bar (near IP/login info)
2. **Keyboard Shortcut**: Press `Ctrl + Shift + C`
3. **Toggle Button**: Click the floating purple button

### Calculator Operations
- **Numbers**: Click buttons or use keyboard (0-9)
- **Operators**: Click +, −, ×, ÷ buttons or use keyboard (+, -, *, /)
- **Decimal**: Click . button or press .
- **Brackets**: Click () button
- **Equals**: Click = button or press Enter
- **Clear**: Click C button or press Delete
- **Clear Entry**: Click CE button
- **Backspace**: Click ⌫ button or press Backspace

### Memory Functions
- **M+**: Add current display to memory
- **M-**: Subtract current display from memory
- **MR**: Recall memory value
- **MC**: Clear memory

### Currency Conversion
1. Switch to "Currency" tab
2. Select "From" currency
3. Enter amount
4. Select "To" currency
5. View converted amount in real-time
6. Use swap button to reverse currencies
7. Click "Refresh Rates" to update exchange rates

### Dragging
- Click and hold the header (purple gradient area)
- Drag to desired position
- Release to drop
- Position is automatically saved

## 🎨 Design

### Colors
- **Primary Gradient**: Purple (#667eea) to Violet (#764ba2)
- **Number Buttons**: White with subtle shadow
- **Operator Buttons**: Blue gradient
- **Equals Button**: Green gradient
- **Function Buttons**: Gray gradient
- **Clear Button**: Red gradient

### Animations
- **Open/Close**: Scale + fade with spring physics
- **Button Press**: Scale down on click with ripple effect
- **Hover**: Subtle scale and shadow increase
- **Drag**: Shadow elevation increase

## 🔧 Technical Details

### Component Structure
```
FloatingCalculator/
├── FloatingCalculator.jsx       # Main component
├── FloatingCalculator.css       # Styles
├── CalculatorDisplay.jsx        # Display component
├── CalculatorButtons.jsx        # Button grid
├── CurrencyConverter.jsx        # Currency tab
├── useDraggable.js             # Dragging hook
├── useCalculator.js            # Calculator logic
├── useCurrencyConverter.js     # Currency logic
└── index.js                    # Exports
```

### State Management
- **LocalStorage Keys**:
  - `calculator-position`: { x, y }
  - `calculator-last-mode`: 'calculator' | 'currency'
  - `currency-rates-cache`: { data, timestamp }

### API
- **Exchange Rates**: https://api.exchangerate-api.com/v4/latest/USD
- **Cache Duration**: 1 hour
- **Fallback**: Uses cached rates if API fails

### Keyboard Shortcuts
- `Ctrl + Shift + C`: Toggle calculator
- `Escape`: Close calculator
- `0-9`: Input numbers
- `+ - * /`: Input operators
- `.`: Decimal point
- `Enter`: Calculate result
- `Backspace`: Delete last character
- `Delete`: Clear all

## 🚀 Integration

The calculator is integrated into the Subsync application:

1. **App.jsx**: FloatingCalculator component rendered globally
2. **NavBar.jsx**: Calculator icon button triggers custom event
3. **Custom Event**: `toggleCalculator` event toggles calculator visibility

## 📱 Responsive Behavior

- **Desktop**: Full 340px width
- **Mobile**: Adapts to 320px width
- **Position**: Adjusts on window resize to stay in viewport
- **Touch**: Supports touch events for dragging

## 🎯 Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: All buttons have proper labels
- **Focus Management**: Proper focus handling
- **Screen Reader**: Friendly for screen readers

## 🐛 Error Handling

- **Division by Zero**: Shows "Error"
- **Invalid Expression**: Shows "Error"
- **API Failure**: Falls back to cached rates
- **Offline Mode**: Indicator shows offline status
- **Network Error**: Graceful degradation

## 💾 Data Persistence

- **Position**: Saved to localStorage on drag end
- **Last Mode**: Remembers calculator/currency tab
- **Exchange Rates**: Cached for 1 hour
- **Auto-restore**: Position and mode restored on mount

## 🎨 Customization

To customize colors, edit `FloatingCalculator.css`:

```css
.calculator-toggle-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.calculator-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 📝 Notes

- Calculator uses safe expression evaluation (no eval)
- Currency rates update automatically every hour
- Position is constrained to viewport boundaries
- Smooth 60fps dragging with requestAnimationFrame
- Glassmorphism effect requires modern browser support

## 🔮 Future Enhancements

- [ ] Scientific calculator mode
- [ ] Calculation history
- [ ] More currencies
- [ ] Custom themes
- [ ] Export calculations
- [ ] Unit converter
- [ ] Tip calculator
- [ ] Tax calculator

---

**Built with ❤️ for Subsync**
