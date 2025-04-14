export const restaurants = [
  {
    id: 1,
    name: "Егамберди Ота Чойхонаси",
    image: require('../assets/restaurants/egamberdi.jpg'),
    rating: 4.7,
    deliveryTime: "25-35 мин",
    deliveryFee: 8000,
    minOrder: 40000,
    cuisine: "Узбекская",
    address: "Кувасай, ул. Егамберди, 15",
    coordinates: {
      latitude: 40.2972,
      longitude: 71.9789
    },
    menu: [
      {
        id: 1,
        name: "Плов",
        price: 40000,
        image: require('../assets/food/plov.jpg'),
        description: "Традиционный узбекский плов с бараниной"
      },
      {
        id: 2,
        name: "Шашлык",
        price: 30000,
        image: require('../assets/food/shashlik.jpg'),
        description: "Шашлык из баранины"
      },
      {
        id: 3,
        name: "Манты",
        price: 32000,
        image: require('../assets/food/manti.jpg'),
        description: "Манты с мясом"
      },
      {
        id: 4,
        name: "Самса",
        price: 12000,
        image: require('../assets/food/samsa.jpg'),
        description: "Самса с мясом"
      },
      {
        id: 5,
        name: "Чучвара",
        price: 25000,
        image: require('../assets/food/chuchvara.jpg'),
        description: "Домашняя чучвара"
      },
      {
        id: 6,
        name: "Шурпа",
        price: 28000,
        image: require('../assets/food/shurpa.jpg'),
        description: "Шурпа из баранины"
      }
    ]
  },
  {
    id: 2,
    name: "Milliy Taomlar",
    image: require('../assets/restaurants/milliy.jpg'),
    rating: 4.3,
    deliveryTime: "25-35 мин",
    deliveryFee: 8000,
    minOrder: 40000,
    cuisine: "Узбекская",
    address: "Кувасай, ул. Алишера Навои, 12",
    coordinates: {
      latitude: 40.2975,
      longitude: 71.9792
    },
    menu: [
      {
        id: 1,
        name: "Манты",
        price: 32000,
        image: require('../assets/food/manti.jpg'),
        description: "Манты с мясом"
      },
      {
        id: 2,
        name: "Лагман",
        price: 28000,
        image: require('../assets/food/lagman.jpg'),
        description: "Домашний лагман"
      },
      {
        id: 3,
        name: "Курутоб",
        price: 35000,
        image: require('../assets/food/kurutob.jpg'),
        description: "Курутоб с зеленью"
      },
      {
        id: 4,
        name: "Сомса",
        price: 12000,
        image: require('../assets/food/somsa.jpg'),
        description: "Сомса с мясом"
      }
    ]
  },
  {
    id: 3,
    name: "Fast Food City",
    image: require('../assets/restaurants/fastfood.jpg'),
    rating: 4.0,
    deliveryTime: "20-30 мин",
    deliveryFee: 5000,
    minOrder: 30000,
    cuisine: "Фастфуд",
    address: "Кувасай, ул. Мирзо Улугбека, 78",
    coordinates: {
      latitude: 40.2981,
      longitude: 71.9778
    },
    menu: [
      {
        id: 1,
        name: "Бургер",
        price: 22000,
        image: require('../assets/food/burger.jpg'),
        description: "Классический бургер"
      },
      {
        id: 2,
        name: "Пицца",
        price: 55000,
        image: require('../assets/food/pizza.jpg'),
        description: "Пицца Маргарита"
      },
      {
        id: 3,
        name: "Хот-дог",
        price: 15000,
        image: require('../assets/food/hotdog.jpg'),
        description: "Хот-дог классический"
      },
      {
        id: 4,
        name: "Картошка фри",
        price: 12000,
        image: require('../assets/food/fries.jpg'),
        description: "Картошка фри с соусом"
      }
    ]
  }
]; 