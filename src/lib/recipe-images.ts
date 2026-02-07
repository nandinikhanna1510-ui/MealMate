// Recipe-specific image mappings using reliable stock image sources
// Using Lorem Picsum (picsum.photos) for reliable food-themed placeholder images
// Each recipe gets a consistent image based on its category

// Reliable image sources that always work
const FOOD_IMAGES = {
  // South Indian - specific dishes
  dosa: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  idli: 'https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  // Medu Vada - crispy fried South Indian donut
  meduVada: 'https://images.pexels.com/photos/14477877/pexels-photo-14477877.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  // Vada Pav - Mumbai street food
  vadaPav: 'https://images.pexels.com/photos/14477877/pexels-photo-14477877.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // North Indian - specific dishes
  // Paratha - stuffed Indian flatbread
  paratha: 'https://images.pexels.com/photos/9609835/pexels-photo-9609835.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  // Paneer Paratha - cheese stuffed flatbread
  paneerParatha: 'https://images.pexels.com/photos/9609835/pexels-photo-9609835.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  // Chole Bhature - fried bread with chickpea curry
  choleBhature: 'https://images.pexels.com/photos/12737919/pexels-photo-12737919.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  // Thalipeeth - Maharashtrian multigrain flatbread
  thalipeeth: 'https://images.pexels.com/photos/9609838/pexels-photo-9609838.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  // Rajma Chawal - kidney beans curry with rice
  rajmaChawal: 'https://images.pexels.com/photos/7353380/pexels-photo-7353380.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  chole: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  puri: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Rice dishes
  rice: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  biryani: 'https://images.pexels.com/photos/7426866/pexels-photo-7426866.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  friedRice: 'https://images.pexels.com/photos/3926133/pexels-photo-3926133.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Curries
  curry: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  dal: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  paneer: 'https://images.pexels.com/photos/9797029/pexels-photo-9797029.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  chicken: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Continental
  eggs: 'https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  pancakes: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  toast: 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  oats: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  smoothie: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Pasta & Noodles
  pasta: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  noodles: 'https://images.pexels.com/photos/1907244/pexels-photo-1907244.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Seafood
  fish: 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  prawn: 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Snacks
  samosa: 'https://images.pexels.com/photos/4449068/pexels-photo-4449068.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  pakora: 'https://images.pexels.com/photos/4449068/pexels-photo-4449068.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  chaat: 'https://images.pexels.com/photos/5410400/pexels-photo-5410400.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  sandwich: 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  kebab: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  wings: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  momos: 'https://images.pexels.com/photos/7363671/pexels-photo-7363671.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  rolls: 'https://images.pexels.com/photos/7363671/pexels-photo-7363671.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Drinks
  chai: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Healthy
  salad: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  bowl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Thali
  thali: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Wraps
  wrap: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // International
  hummus: 'https://images.pexels.com/photos/1618898/pexels-photo-1618898.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  bruschetta: 'https://images.pexels.com/photos/1618898/pexels-photo-1618898.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  nachos: 'https://images.pexels.com/photos/1108775/pexels-photo-1108775.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  soup: 'https://images.pexels.com/photos/1731535/pexels-photo-1731535.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Fruits & Snacks
  fruit: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  popcorn: 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',

  // Defaults by meal type
  breakfast: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  lunch: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  dinner: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  snack: 'https://images.pexels.com/photos/4449068/pexels-photo-4449068.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
};

// Map each recipe ID to an appropriate food category
const RECIPE_TO_CATEGORY: Record<string, keyof typeof FOOD_IMAGES> = {
  // ========== BREAKFAST - South Indian ==========
  'masala-dosa': 'dosa',
  'idli-sambar': 'idli',
  'medu-vada': 'meduVada',
  'pongal': 'rice',
  'uttapam': 'dosa',
  'appam': 'dosa',

  // ========== BREAKFAST - North Indian ==========
  'aloo-paratha': 'paratha',
  'gobi-paratha': 'paratha',
  'paneer-paratha': 'paneerParatha',
  'chole-bhature': 'choleBhature',
  'puri-aloo': 'puri',
  'poha': 'rice',
  'upma': 'rice',
  'sabudana-khichdi': 'rice',
  'misal-pav': 'chaat',
  'thalipeeth': 'thalipeeth',

  // ========== BREAKFAST - Continental ==========
  'english-breakfast': 'eggs',
  'pancakes': 'pancakes',
  'french-toast': 'toast',
  'avocado-toast': 'toast',
  'omelette': 'eggs',
  'scrambled-eggs': 'eggs',
  'smoothie-bowl': 'smoothie',
  'overnight-oats': 'oats',
  'muesli-bowl': 'oats',
  'besan-cheela': 'paratha',
  'moong-dal-cheela': 'paratha',

  // ========== LUNCH - Rice Combos ==========
  'dal-rice': 'dal',
  'rajma-chawal': 'rajmaChawal',
  'paneer-butter-masala': 'paneer',
  'biryani-veg': 'biryani',
  'chicken-biryani': 'biryani',
  'kadhi-chawal': 'dal',
  'sambar-rice': 'idli',
  'curd-rice': 'rice',
  'palak-paneer-rice': 'paneer',
  'aloo-gobi-roti': 'curry',
  'fish-curry-rice': 'fish',
  'egg-curry-rice': 'eggs',
  'pasta-red-sauce': 'pasta',
  'fried-rice-veg': 'friedRice',
  'noodles-veg': 'noodles',
  'dal-makhani': 'dal',
  'chana-masala': 'chole',
  'mutton-curry': 'chicken',
  'thali-veg': 'thali',
  'south-indian-thali': 'thali',
  'wrap-chicken': 'wrap',
  'quinoa-bowl': 'bowl',
  'thai-curry': 'curry',
  'lemon-rice': 'rice',
  'khichdi-comfort': 'rice',
  'pav-bhaji-lunch': 'chaat',

  // ========== DINNER - Curries & Mains ==========
  'butter-chicken': 'chicken',
  'palak-paneer': 'paneer',
  'dal-tadka': 'dal',
  'roti-sabzi': 'curry',
  'paneer-tikka-masala': 'paneer',
  'chicken-curry': 'chicken',
  'shahi-paneer': 'paneer',
  'bhindi-masala': 'curry',
  'aloo-matar': 'curry',
  'malai-kofta': 'paneer',
  'grilled-fish': 'fish',
  'pasta-white-sauce': 'pasta',
  'chicken-stir-fry': 'chicken',
  'dal-palak': 'dal',
  'mushroom-masala': 'curry',
  'keema-pav': 'chicken',
  'tofu-stir-fry': 'curry',
  'egg-bhurji': 'eggs',
  'veg-korma': 'curry',
  'soup-tom-yum': 'soup',
  'dal-fry': 'dal',
  'chilli-paneer': 'paneer',
  'cauliflower-steak': 'salad',
  'methi-chicken': 'chicken',
  'baingan-bharta': 'curry',
  'grilled-chicken-salad': 'salad',
  'momos': 'momos',
  'prawn-masala': 'prawn',

  // ========== SNACKS ==========
  'samosa': 'samosa',
  'pakora': 'pakora',
  'aloo-tikki': 'chaat',
  'bhel-puri': 'chaat',
  'pani-puri': 'chaat',
  'dahi-vada': 'chaat',
  'spring-rolls': 'rolls',
  'paneer-tikka': 'paneer',
  'chicken-pakora': 'pakora',
  'dhokla': 'samosa',
  'kachori': 'samosa',
  'masala-chai': 'chai',
  'vada-pav': 'vadaPav',
  'sandwich': 'sandwich',
  'popcorn-masala': 'popcorn',
  'fruit-chaat': 'fruit',
  'cutlet': 'pakora',
  'seekh-kebab': 'kebab',
  'bruschetta': 'bruschetta',
  'hummus': 'hummus',
  'nachos': 'nachos',
  'energy-balls': 'oats',
  'makhana': 'popcorn',
  'smoothie': 'smoothie',
  'cheese-toast': 'toast',
  'moong-sprouts': 'salad',
  'chicken-wings': 'wings',
  'toast-egg': 'eggs',
  'corn-chaat': 'chaat',
};

// Get image URL for a specific recipe
export function getRecipeImageUrl(
  recipeId: string,
  mealType: string,
  _cuisine: string,
  _options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  const normalizedId = recipeId.toLowerCase();

  // Get category for this recipe
  const category = RECIPE_TO_CATEGORY[normalizedId];

  if (category && FOOD_IMAGES[category]) {
    return FOOD_IMAGES[category];
  }

  // Fallback to meal type default
  const mealDefault = FOOD_IMAGES[mealType as keyof typeof FOOD_IMAGES];
  if (mealDefault) {
    return mealDefault;
  }

  // Ultimate fallback
  return FOOD_IMAGES.lunch;
}

// Get a placeholder gradient for loading states
export function getPlaceholderGradient(mealType: string): string {
  const gradients: Record<string, string> = {
    breakfast: 'linear-gradient(135deg, #FFD93D 0%, #F6D365 100%)',
    lunch: 'linear-gradient(135deg, #6BCB77 0%, #2ECC71 100%)',
    dinner: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)',
    snack: 'linear-gradient(135deg, #FF9F43 0%, #F39C12 100%)',
  };
  return gradients[mealType] || gradients.lunch;
}

// Preload images for better performance
export function preloadRecipeImages(recipeIds: string[], mealTypes: string[], cuisines: string[]): void {
  if (typeof window === 'undefined') return;

  recipeIds.forEach((id, index) => {
    const img = new Image();
    img.src = getRecipeImageUrl(id, mealTypes[index] || 'lunch', cuisines[index] || 'indian');
  });
}

// Export count for verification
export const TOTAL_MAPPED_RECIPES = Object.keys(RECIPE_TO_CATEGORY).length;
