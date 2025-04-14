import config from '../../config/config.json';
import AsyncStorage from '@react-native-community/async-storage';
import CryptoJS from 'crypto-js';

// Ключ шифрования (в реальном приложении должен храниться в безопасном месте)
const ENCRYPTION_KEY = 'your-secure-encryption-key';

// Функции для шифрования/дешифрования
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Валидация номера карты по алгоритму Луна
const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Валидация срока действия карты
const validateExpiryDate = (expiryDate) => {
  const [month, year] = expiryDate.split('/');
  if (!month || !year) return false;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  const cardYear = parseInt(year);
  const cardMonth = parseInt(month);
  
  if (cardYear < currentYear) return false;
  if (cardYear === currentYear && cardMonth < currentMonth) return false;
  if (cardMonth < 1 || cardMonth > 12) return false;
  
  return true;
};

// Определение типа карты по номеру
const getCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Visa
  if (/^4[0-9]{0,15}$/.test(cleaned)) {
    return 'visa';
  }
  
  // Mastercard
  if (/^5[1-5][0-9]{0,14}$/.test(cleaned)) {
    return 'mastercard';
  }
  
  // UzCard
  if (/^8600[0-9]{0,12}$/.test(cleaned)) {
    return 'uzcard';
  }
  
  // HUMO
  if (/^9860[0-9]{0,12}$/.test(cleaned)) {
    return 'humo';
  }
  
  return 'unknown';
};

// Получение иконки карты
export const getCardIcon = (cardType) => {
  switch (cardType) {
    case 'visa':
      return 'cc-visa';
    case 'mastercard':
      return 'cc-mastercard';
    case 'uzcard':
      return 'credit-card';
    case 'humo':
      return 'credit-card';
    default:
      return 'credit-card';
  }
};

// Получение цвета карты
export const getCardColor = (cardType) => {
  switch (cardType) {
    case 'visa':
      return '#1A1F71';
    case 'mastercard':
      return '#EB001B';
    case 'uzcard':
      return '#00A651';
    case 'humo':
      return '#FF6B00';
    default:
      return '#333333';
  }
};

export const processPayment = async (paymentMethod, amount, orderId, cardId = null) => {
  try {
    let cardData = null;
    
    if (cardId) {
      const savedCards = await getSavedCards();
      cardData = savedCards.find(card => card.id === cardId);
      if (!cardData) {
        throw new Error('Card not found');
      }
    }

    switch (paymentMethod) {
      case 'payme':
        return await processPaymePayment(amount, orderId, cardData);
      case 'click':
        return await processClickPayment(amount, orderId, cardData);
      case 'uzcard':
        return await processUzcardPayment(amount, orderId, cardData);
      case 'humo':
        return await processHumoPayment(amount, orderId, cardData);
      case 'cod':
        return { success: true, message: 'Оплата при получении' };
      default:
        throw new Error('Неизвестный метод оплаты');
    }
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};

const processPaymePayment = async (amount, orderId, cardData) => {
  // Здесь будет интеграция с Payme API
  return {
    success: true,
    message: 'Оплата через Payme успешно обработана'
  };
};

const processClickPayment = async (amount, orderId, cardData) => {
  // Здесь будет интеграция с Click API
  return {
    success: true,
    message: 'Оплата через Click успешно обработана'
  };
};

const processUzcardPayment = async (amount, orderId, cardData) => {
  // Здесь будет интеграция с UzCard API
  return {
    success: true,
    message: 'Оплата через UzCard успешно обработана'
  };
};

const processHumoPayment = async (amount, orderId, cardData) => {
  // Здесь будет интеграция с HUMO API
  return {
    success: true,
    message: 'Оплата через HUMO успешно обработана'
  };
};

export const saveCard = async (cardData) => {
  try {
    // Валидация данных карты
    if (!validateCardNumber(cardData.cardNumber)) {
      throw new Error('Неверный номер карты');
    }
    
    if (!validateExpiryDate(cardData.expiryDate)) {
      throw new Error('Неверный срок действия карты');
    }
    
    const savedCards = await AsyncStorage.getItem('saved_cards');
    const cards = savedCards ? decryptData(savedCards) : [];
    
    // Проверка на дубликаты
    const isDuplicate = cards.some(card => 
      card.cardNumber === cardData.cardNumber && 
      card.expiryDate === cardData.expiryDate
    );
    
    if (isDuplicate) {
      throw new Error('Эта карта уже сохранена');
    }
    
    // Определяем тип карты
    const cardType = getCardType(cardData.cardNumber);
    
    // Маскируем номер карты перед сохранением
    const maskedCard = {
      ...cardData,
      cardNumber: cardData.cardNumber.replace(/\d(?=\d{4})/g, '*'),
      cardType,
      icon: getCardIcon(cardType),
      color: getCardColor(cardType)
    };
    
    const newCard = {
      id: Date.now().toString(),
      ...maskedCard,
      lastUsed: new Date().toISOString()
    };
    
    cards.push(newCard);
    await AsyncStorage.setItem('saved_cards', encryptData(cards));
    return { success: true, card: newCard };
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
};

export const getSavedCards = async () => {
  try {
    const savedCards = await AsyncStorage.getItem('saved_cards');
    return savedCards ? decryptData(savedCards) : [];
  } catch (error) {
    console.error('Error getting saved cards:', error);
    throw error;
  }
};

export const deleteCard = async (cardId) => {
  try {
    const savedCards = await AsyncStorage.getItem('saved_cards');
    if (!savedCards) return { success: false };
    
    const cards = decryptData(savedCards);
    const updatedCards = cards.filter(card => card.id !== cardId);
    
    await AsyncStorage.setItem('saved_cards', encryptData(updatedCards));
    return { success: true };
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
}; 