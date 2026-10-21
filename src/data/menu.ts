export type SizeId = 'personal' | 'medium' | 'large'
export type CrustId = 'hand' | 'thin' | 'pan' | 'burst'
export type CategoryId = 'pizza' | 'sides' | 'desserts' | 'drinks'
export type Tag = 'veg' | 'spicy' | 'chicken' | 'new'

export type Topping =
  | 'pepperoni'
  | 'chicken'
  | 'olive'
  | 'capsicum'
  | 'onion'
  | 'mushroom'
  | 'jalapeno'
  | 'tomato'
  | 'paneer'
  | 'prawn'
  | 'basil'
  | 'chilli'
  | 'sausage'
  | 'corn'

/** A free photo from Unsplash (unsplash.com/photos/<id>), used under the Unsplash License. */
export interface Photo {
  id: string
  by?: string
}

interface BaseProduct {
  id: string
  name: string
  description: string
  tags: Tag[]
  badge?: string
  photo: Photo
}

export interface PizzaProduct extends BaseProduct {
  category: 'pizza'
  prices: Record<SizeId, number>
}

export interface SimpleProduct extends BaseProduct {
  category: Exclude<CategoryId, 'pizza'>
  price: number
  unit: string
}

export type Product = PizzaProduct | SimpleProduct

export const SIZES: { id: SizeId; label: string; inches: number; serves: string }[] = [
  { id: 'personal', label: 'Personal', inches: 7, serves: 'Serves 1' },
  { id: 'medium', label: 'Medium', inches: 9, serves: 'Serves 2' },
  { id: 'large', label: 'Large', inches: 12, serves: 'Serves 3–4' },
]

export const CRUSTS: { id: CrustId; label: string; note: string; extra: Record<SizeId, number> }[] = [
  { id: 'hand', label: 'Hand Tossed', note: 'Soft & airy', extra: { personal: 0, medium: 0, large: 0 } },
  { id: 'thin', label: 'Thin Crust', note: 'Light & crispy', extra: { personal: 0, medium: 0, large: 0 } },
  { id: 'pan', label: 'Pan', note: 'Thick & buttery', extra: { personal: 200, medium: 300, large: 400 } },
  { id: 'burst', label: 'Cheese Burst', note: 'Molten cheese inside', extra: { personal: 450, medium: 650, large: 850 } },
]

export const EXTRA_TOPPINGS: { id: Topping; label: string; veg: boolean }[] = [
  { id: 'chicken', label: 'Chicken', veg: false },
  { id: 'pepperoni', label: 'Chicken Pepperoni', veg: false },
  { id: 'sausage', label: 'Chicken Sausage', veg: false },
  { id: 'prawn', label: 'Prawns', veg: false },
  { id: 'mushroom', label: 'Mushroom', veg: true },
  { id: 'onion', label: 'Onion', veg: true },
  { id: 'capsicum', label: 'Capsicum', veg: true },
  { id: 'olive', label: 'Black Olives', veg: true },
  { id: 'jalapeno', label: 'Jalapeño', veg: true },
  { id: 'tomato', label: 'Tomato', veg: true },
  { id: 'corn', label: 'Sweet Corn', veg: true },
  { id: 'paneer', label: 'Paneer', veg: true },
]

export const EXTRA_TOPPING_PRICE: Record<SizeId, number> = { personal: 150, medium: 220, large: 300 }
export const EXTRA_CHEESE_PRICE: Record<SizeId, number> = { personal: 200, medium: 300, large: 400 }

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'pizza', label: 'Pizzas' },
  { id: 'sides', label: 'Sides' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
]

export const PRODUCTS: Product[] = [
  {
    id: 'devilled-chicken',
    category: 'pizza',
    name: 'Devilled Chicken',
    description: 'Sri Lankan devilled chicken, onion, capsicum and a kick of chilli flakes.',
    tags: ['chicken', 'spicy'],
    badge: 'Most loved',
    prices: { personal: 1190, medium: 2490, large: 3690 },
    photo: { id: 'ZXpVJ5G_TtY', by: 'Omar Hakeem' },
  },
  {
    id: 'pepperoni-classic',
    category: 'pizza',
    name: 'Pepperoni Classic',
    description: 'Generous chicken pepperoni over 100% mozzarella and our signature tomato sauce.',
    tags: ['chicken'],
    badge: 'Classic',
    prices: { personal: 1090, medium: 2290, large: 3390 },
    photo: { id: 'VzMuY7TEy68', by: 'Brett Jordan' },
  },
  {
    id: 'kochchi-paneer',
    category: 'pizza',
    name: 'Kochchi Paneer',
    description: 'Paneer, capsicum, olives, baby corn and fiery jalapeño. A local favourite.',
    tags: ['veg', 'spicy', 'new'],
    badge: 'New',
    prices: { personal: 1090, medium: 2290, large: 3390 },
    photo: { id: 'viyma_vheho', by: 'VD Photography' },
  },
  {
    id: 'bbq-chicken',
    category: 'pizza',
    name: 'Smoky BBQ Chicken',
    description: 'Smoked chicken, pineapple and red onion on a smoky barbecue base.',
    tags: ['chicken'],
    prices: { personal: 1190, medium: 2490, large: 3690 },
    photo: { id: 'MqT0asuoIcU', by: 'Chad Montano' },
  },
  {
    id: 'hot-spicy-chicken',
    category: 'pizza',
    name: 'Hot & Spicy Chicken',
    description: 'Spicy chicken, fresh greens and red chilli. For those who like it hot.',
    tags: ['chicken', 'spicy'],
    prices: { personal: 1190, medium: 2490, large: 3690 },
    photo: { id: 'LppAkC7s6u4' },
  },
  {
    id: 'tomato-rocket',
    category: 'pizza',
    name: 'Tomato & Rocket',
    description: 'Juicy tomatoes, mozzarella and fresh rocket on a thin, crispy base.',
    tags: ['veg'],
    prices: { personal: 990, medium: 2090, large: 3090 },
    photo: { id: 'A4EtgLN1_Fw' },
  },
  {
    id: 'veggie-paradise',
    category: 'pizza',
    name: 'Veggie Paradise',
    description: 'Red and green capsicum, onion and plenty of melted cheese.',
    tags: ['veg'],
    prices: { personal: 990, medium: 2090, large: 3090 },
    photo: { id: 'aV1agxacxUw', by: 'Shoeib Abolhassani' },
  },
  {
    id: 'margherita',
    category: 'pizza',
    name: 'Margherita',
    description: 'Simply mozzarella, tomato sauce and fresh basil. Light and always right.',
    tags: ['veg'],
    prices: { personal: 890, medium: 1890, large: 2790 },
    photo: { id: 'frTrM7Gdkho', by: 'Nadya Filatova' },
  },
  {
    id: 'chicken-sausage-feast',
    category: 'pizza',
    name: 'Chicken Sausage Feast',
    description: 'Chicken sausage and chicken pepperoni piled high on extra mozzarella.',
    tags: ['chicken'],
    prices: { personal: 1290, medium: 2690, large: 3890 },
    photo: { id: '0XxRSfDgTBI' },
  },
  {
    id: 'garlic-bread',
    category: 'sides',
    name: 'Garlic Bread',
    description: 'Freshly baked bread brushed with garlic butter and herbs.',
    tags: ['veg'],
    price: 690,
    unit: '8 pcs',
    photo: { id: 'yl33be56sbg', by: 'Louis Hansel' },
  },
  {
    id: 'chicken-wings',
    category: 'sides',
    name: 'Hot Chicken Wings',
    description: 'Crispy wings tossed in a sticky chilli glaze.',
    tags: ['chicken', 'spicy'],
    badge: 'Most loved',
    price: 1290,
    unit: '6 pcs',
    photo: { id: 'gE28aTnlqJA', by: 'Chad Montano' },
  },
  {
    id: 'fries',
    category: 'sides',
    name: 'Crispy Fries',
    description: 'Golden, crispy and lightly salted.',
    tags: ['veg'],
    price: 590,
    unit: 'Regular',
    photo: { id: 'lv7H9OKj_f4', by: 'Vera Cho' },
  },
  {
    id: 'penne-pasta',
    category: 'sides',
    name: 'Penne Pasta',
    description: 'Penne baked in our rich house sauce.',
    tags: [],
    price: 1290,
    unit: 'Bowl',
    photo: { id: 'aeESmmFKH0M', by: 'Pixzolo Photography' },
  },
  {
    id: 'fudge-cake',
    category: 'desserts',
    name: 'Chocolate Fudge Cake',
    description: 'Rich, moist chocolate cake. The perfect finish.',
    tags: ['veg'],
    badge: 'Sweet pick',
    price: 590,
    unit: '1 slice',
    photo: { id: 'lsqPDLZMy2I' },
  },
  {
    id: 'cola',
    category: 'drinks',
    name: 'Cola',
    description: 'Ice-cold and fizzy. Best with something spicy.',
    tags: ['veg'],
    price: 450,
    unit: '1.5 L',
    photo: { id: 'zJnhOqGDru0', by: 'blackieshoot' },
  },
  {
    id: 'iced-tea',
    category: 'drinks',
    name: 'Lemon Iced Tea',
    description: 'Ceylon black tea, a squeeze of lemon, lightly sweetened.',
    tags: ['veg'],
    price: 390,
    unit: '500 ml',
    photo: { id: 'FM253_03JJw', by: 'An Nguyen' },
  },
]

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]))

export function fromPrice(p: Product): number {
  return p.category === 'pizza' ? p.prices.personal : p.price
}

export const TAG_LABEL: Record<Tag, string> = {
  veg: 'Veg',
  spicy: 'Spicy',
  chicken: 'Chicken',
  new: 'New',
}
