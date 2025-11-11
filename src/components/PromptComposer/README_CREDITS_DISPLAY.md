# Credits Display Component

## Overview

The `CreditsDisplay` component is a VIS-styled credits management UI that shows the user's available credits and provides a purchase modal for buying more credits.

## Location

```
src/components/PromptComposer/CreditsDisplay.tsx
```

## Features

- ✅ VIS color system styling (consistent with project design)
- ✅ Dynamic credit status display (no credits, low credits, normal)
- ✅ Color-coded warning states (red for 0, amber for low, teal for normal)
- ✅ Purchase modal with Stripe integration placeholder
- ✅ Responsive and accessible design
- ✅ Smooth transitions and hover effects

## Usage

### Basic Usage

```tsx
import { CreditsDisplay } from './PromptComposer/CreditsDisplay';

function MyComponent() {
  return (
    <CreditsDisplay
      credits={0}
      onPurchase={() => {
        console.log('Purchase initiated');
        // Integrate with your payment system here
      }}
    />
  );
}
```

### With Dynamic Credits

```tsx
import { CreditsDisplay } from './PromptComposer/CreditsDisplay';
import { useAppStore } from '../store/useAppStore';

function MyComponent() {
  // Assuming you add credits to your store
  const credits = useAppStore((state) => state.credits);
  
  return (
    <CreditsDisplay
      credits={credits}
      onPurchase={handlePurchase}
    />
  );
}
```

### With Custom Styling

```tsx
<CreditsDisplay
  credits={5}
  onPurchase={handlePurchase}
  className="mt-4 w-full max-w-sm"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `credits` | `number` | Yes | - | Number of credits the user has |
| `onPurchase` | `() => void` | No | `undefined` | Callback function when purchase is initiated |
| `className` | `string` | No | `''` | Additional CSS classes for the container |

## States

The component displays different visual states based on credit count:

### 1. No Credits (credits === 0)
- **Background**: `bg-red-900/20`
- **Border**: `border-red-700/50`
- **Icon Color**: Red
- **Message**: "No credits remaining. Purchase more credits to continue."

### 2. Low Credits (0 < credits < 10)
- **Background**: `bg-amber-900/20`
- **Border**: `border-amber-700/50`
- **Icon Color**: Amber
- **Message**: "Low credits remaining. Consider purchasing more."

### 3. Normal Credits (credits >= 10)
- **Background**: `bg-gray-900/70`
- **Border**: `border-gray-800/60`
- **Icon Color**: Gray/Teal
- **No Warning Message**

## Purchase Modal

The purchase modal includes:

1. **Credit Package Information**
   - Product name: "Nano Banana AI Image Editor (150 Credits)"
   - Price: $22
   - Total generations: 150

2. **Purchase Button**
   - Stripe integration ready (placeholder)
   - Yellow gradient styling
   - Credit card icon

3. **Security Notice**
   - Powered by Stripe message
   - Encryption guarantee

## Integration Points

### Adding to Store

To connect with a real credits system, add to `src/store/useAppStore.ts`:

```typescript
interface AppState {
  // ... existing state
  credits: number;
  
  // Actions
  setCredits: (credits: number) => void;
  decrementCredits: () => void;
  addCredits: (amount: number) => void;
}

// In the create function:
const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // ... existing state
        credits: 0,
        
        setCredits: (credits) => set({ credits }),
        decrementCredits: () => set((state) => ({ 
          credits: Math.max(0, state.credits - 1) 
        })),
        addCredits: (amount) => set((state) => ({ 
          credits: state.credits + amount 
        })),
      }),
      { name: 'app-store' }
    )
  )
);
```

### Stripe Integration

Replace the `handlePurchase` function in `CreditsDisplay.tsx`:

```typescript
const handlePurchase = async () => {
  try {
    // 1. Create Stripe checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: 'price_xxxxx', // Your Stripe price ID
        quantity: 1,
      }),
    });
    
    const { sessionId } = await response.json();
    
    // 2. Redirect to Stripe checkout
    const stripe = await loadStripe('pk_live_xxxxx');
    await stripe?.redirectToCheckout({ sessionId });
    
  } catch (error) {
    console.error('Purchase failed:', error);
  }
  
  setIsModalOpen(false);
};
```

## VIS Styling Reference

The component uses the following VIS classes:

- **Backgrounds**: `bg-gray-900/70`, `bg-gray-800`
- **Borders**: `border-gray-800/60`, `border-gray-700`
- **Text Colors**: `text-gray-300`, `text-gray-400`, `text-vis-teal-300`
- **Button Gradient**: `from-yellow-600 to-orange-600`
- **Info Box**: `bg-blue-900/20 border-blue-700/50`

## Accessibility

- ✅ Keyboard navigation support
- ✅ Focus states with ring styling
- ✅ Screen reader friendly
- ✅ Color contrast meets WCAG AA standards
- ✅ Clear visual feedback

## Browser Support

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## Future Enhancements

- [ ] Multiple credit packages
- [ ] Discount codes
- [ ] Credit usage history
- [ ] Auto-purchase when credits reach 0
- [ ] Subscription plans
- [ ] Gift credits feature

## Related Files

- `src/components/PromptComposer/CreditsDisplay.tsx` - Main component
- `src/components/PromptComposer.tsx` - Integration example
- `src/components/ui/dialog.tsx` - Modal dialog component
- `docs/VIS_COLOR_SYSTEM.md` - VIS styling guide
- `tailwind.config.js` - VIS color configuration

## Support

For issues or questions, refer to:
- VIS Documentation: `docs/VIS_*.md`
- Project README: `README.md`
