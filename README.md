# Domino’s Sri Lanka: ordering redesign (concept)

A clean, warm redesign of the Domino’s Sri Lanka online ordering site. The look takes its cue from soft marketplace designs: cream backgrounds, rounded cards and real food photography. The flow is rebuilt around the most common UX problems with pizza-ordering sites.

> Design concept only. Not affiliated with or endorsed by Domino’s Pizza. Menu items, prices, stores and the hotline number are placeholders.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pricing, deals and phone-number rules
npm run build
npm run check:photos   # confirms every food photo loads from Unsplash
```

## UX issues fixed

| Common issue | What this design does |
| --- | --- |
| Store/address prompt blocks the menu | Browse, see prices and build a cart before choosing a location. The location pill in the header changes it any time. |
| Location permission asked on load | Only asked when you tap “Use my current location”. If it’s denied, you pick your area from a list. |
| Switching delivery/pickup empties the cart | The cart is kept. A toast confirms the switch and the delivery fee updates. |
| Weak Sri Lankan address entry | Area search across stores, a house/street field and an optional **landmark** field (“Opposite the Keells, blue gate”). |
| “From Rs X” hides real prices | Every card lists Personal, Medium and Large prices. The customiser shows the total updating live as you choose. |
| Long multi-step customisation | One sheet for size, crust, toppings, cheese and quantity. Choices are kept if you close it by accident. |
| No add-to-cart feedback | A toast with **Undo** and **View cart**, an “in cart” badge on the card and the cart total in the header. |
| Hard to edit cart items | **Edit** reopens the customiser for that line. Quantity steppers, and removing an item can be undone. |
| Coupon hunting, vague errors | The best deal is applied automatically. Codes give specific reasons (“Add 1 more Medium pizza…”). Nudges only appear when they’d beat your current saving. |
| Fees revealed at the end | Delivery fee, minimum-order progress, free-delivery progress and “prices include taxes” are all shown in the cart. |
| Long, confusing checkout | Guest checkout on one page in three numbered sections. A fixed **+94** prefix accepts any common number format. Errors appear inline and clear as you fix them. |
| Unclear payment outcome | Cash, card on delivery or online. The online option explains that a failed payment won’t charge you and the cart stays saved. |
| Vague order tracking | A clear arrival window, step-by-step tracker, one-tap help (call, late, wrong item) and **Order again**. |
| Auto-sliding carousels | No autoplay. The rail scrolls by swipe or arrow buttons. |
| Category bar disappears on scroll | Sticky category chips plus **Veg only** and **Spicy** filters, and live search with a helpful empty state. |
| Lost cart offline | The cart is saved in the browser, with an offline banner and readable hash URLs (`#/checkout`, `#/order/DLK-12345`). |
| Accessibility gaps | 44px+ tap targets, readable contrast, labelled icon buttons, focus-trapped dialogs that close with Esc, a skip link and reduced-motion support. |

## Structure

```
src/
  data/        menu, sizes, crusts, stores (placeholder data)
  lib/         pricing + deals, phone parsing, hash router
  state/       cart/location/orders store (saved in localStorage), UI state
  components/  header, home, customiser, cart, checkout, tracking, dialogs
```

Built with React, TypeScript and Vite, with [GSAP](https://gsap.com) (ScrollTrigger, SplitText) for the hero intro, scroll effects and reveal animations. All motion is skipped when the visitor’s device is set to reduce motion. Fonts are self-hosted (Plus Jakarta Sans, Bricolage Grotesque).

## Icons

All icons are from [Lucide](https://lucide.dev), free under the ISC license, via the `lucide-react` package. `src/components/Icon.tsx` maps the names used across the site to Lucide icons, so swapping one is a one-line change there.

## Photos

All food photos are free photos from [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license). They load from Unsplash at the size each spot needs. If a photo can’t load, a plain tile is shown instead. The photo IDs live in `src/data/menu.ts`. For a production site, replace them with your own product photography.

| Item | Photo | Photographer |
| --- | --- | --- |
| Devilled Chicken | [ZXpVJ5G_TtY](https://unsplash.com/photos/ZXpVJ5G_TtY) | Omar Hakeem |
| Pepperoni Classic | [VzMuY7TEy68](https://unsplash.com/photos/VzMuY7TEy68) | Brett Jordan |
| Kochchi Paneer | [viyma_vheho](https://unsplash.com/photos/viyma_vheho) | VD Photography |
| Smoky BBQ Chicken | [MqT0asuoIcU](https://unsplash.com/photos/MqT0asuoIcU) | Chad Montano |
| Hot & Spicy Chicken | [LppAkC7s6u4](https://unsplash.com/photos/LppAkC7s6u4) | See photo page |
| Tomato & Rocket | [A4EtgLN1_Fw](https://unsplash.com/photos/A4EtgLN1_Fw) | See photo page |
| Veggie Paradise | [aV1agxacxUw](https://unsplash.com/photos/aV1agxacxUw) | Shoeib Abolhassani |
| Margherita | [frTrM7Gdkho](https://unsplash.com/photos/frTrM7Gdkho) | Nadya Filatova |
| Chicken Sausage Feast | [0XxRSfDgTBI](https://unsplash.com/photos/0XxRSfDgTBI) | See photo page |
| Garlic Bread | [yl33be56sbg](https://unsplash.com/photos/yl33be56sbg) | Louis Hansel |
| Hot Chicken Wings | [gE28aTnlqJA](https://unsplash.com/photos/gE28aTnlqJA) | Chad Montano |
| Crispy Fries | [lv7H9OKj_f4](https://unsplash.com/photos/lv7H9OKj_f4) | Vera Cho |
| Penne Pasta | [aeESmmFKH0M](https://unsplash.com/photos/aeESmmFKH0M) | Pixzolo Photography |
| Chocolate Fudge Cake | [lsqPDLZMy2I](https://unsplash.com/photos/lsqPDLZMy2I) | See photo page |
| Cola | [zJnhOqGDru0](https://unsplash.com/photos/zJnhOqGDru0) | blackieshoot |
| Lemon Iced Tea | [FM253_03JJw](https://unsplash.com/photos/FM253_03JJw) | An Nguyen |
