

## Fix Bottom Tab Bar: Fixed, Centered, and Mobile-Responsive

The tab bar needs to be properly fixed at the bottom center of the screen and scale well on mobile devices.

### Changes

**File: `src/pages/Index.tsx`**

1. Update the tab bar container to use proper fixed positioning with horizontal centering and safe area padding for iPhones:
   - Use `fixed bottom-0 left-0 right-0` instead of `left-1/2 transform -translate-x-1/2` so it spans the full width
   - Add a flex container to center the TabsList within it
   - Add `pb-[env(safe-area-inset-bottom)]` for iPhone home indicator support
   - Add a subtle background blur behind the bar area for readability

2. Make the tab triggers smaller on mobile:
   - Reduce horizontal padding to `px-2.5 sm:px-4`
   - Use `text-[8px] sm:text-xs` for labels
   - Use `w-3 h-3 sm:w-4 sm:h-4` for icons

3. Ensure the main content has enough bottom padding (`pb-24 sm:pb-28`) so nothing is hidden behind the fixed bar.

### Technical Details

- The outer wrapper will be: `fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 sm:pb-6 px-2`
- The `TabsList` stays auto-width and centered via flexbox -- no transform hacks needed
- Safe area inset ensures the bar clears the iPhone home indicator

