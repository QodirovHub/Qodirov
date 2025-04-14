import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScrollView, TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import FlatText from '../components/FlatText';
import Header from './../screens/section/Header';
import * as geolib from 'geolib';
import Toast from 'react-native-simple-toast';
import { Feather } from '@expo/vector-icons';

import config from '../../config/config.json';

import AsyncStorage from '@react-native-community/async-storage';
import { ActivityIndicator } from 'react-native-paper';
import { processPayment, getSavedCards, saveCard, validateCardNumber, validateExpiryDate, getCardIcon, getCardColor } from '../services/paymentService';


export default class Checkout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      latitude: 0,
      longitude: 0,
      storelatitude: 0,
      storelongitude: 0,
      city: "",
      address: "",
      name: "",
      km_fee: 0,
      delivery_fee: 0,
      dataCart: [],
      username: "",
      usernumber: "",
      authorization_key: null,
      vendor_id: null,
      place_order: "Place Order",
      error: false,
      paymentMethods: [
        { id: 'payme', name: 'Payme', icon: 'credit-card' },
        { id: 'click', name: 'Click', icon: 'credit-card' },
        { id: 'uzcard', name: 'UzCard', icon: 'credit-card' },
        { id: 'humo', name: 'HUMO', icon: 'credit-card' },
        { id: 'cod', name: 'Наличными при получении', icon: 'cash' }
      ],
      selectedPayment: 'cod',
      savedCards: [],
      selectedCard: null,
      showCardForm: false,
      newCard: {
        cardNumber: '',
        expiryDate: ''
      },
      cardErrors: {
        cardNumber: '',
        expiryDate: ''
      }
    };
  }

  componentDidMount() {

    AsyncStorage.getItem('login').then((login) => {
      if (login !== null) {
        const logininfo = JSON.parse(login)
        this.setState({ authorization_key: logininfo.token, isLoading: false });
      }
    })
      .catch((err) => {
        this.setState({
          isLoading: false,
          error: true
        });
      })

    AsyncStorage.getItem('store').then((storedata) => {
      if (storedata !== null) {
        const info = JSON.parse(storedata)
        this.setState({
          storelatitude: info.latitude,
          storelongitude: info.longitude,
          name: info.name,
          vendor_id: info.id,
          isLoading: false
        })
      }
    })
      .catch((err) => {
        this.setState({
          isLoading: false,
          error: true
        });
      });

    AsyncStorage.getItem('location').then((location) => {
      if (location !== null) {
        const locationdata = JSON.parse(location)
        this.setState({
          latitude: locationdata.latitude,
          longitude: locationdata.longitude,
          city: locationdata.city,
          address: locationdata.address,
          isLoading: false
        })
      }
    })
      .catch((err) => {
        this.setState({
          isLoading: false,
          error: true
        });
      });

    AsyncStorage.getItem('cart').then((cart) => {
      if (cart !== null) {
        // We have data!!
        const cartfood = JSON.parse(cart)
        this.setState({ dataCart: cartfood, isLoading: false })
      }
    })
      .catch((err) => {
        this.setState({
          isLoading: false,
          error: true
        });
      })

    fetch(config.APP_URL + '/api/delivery_fee', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((json) => {
        this.setState({
          km_fee: json,
          isLoading: false,
          refreshing: false,
        })

      })
      .catch((error) => {
        this.setState({
          isLoading: false,
          error: true
        })
      });



    this.distance();
    this.loadSavedCards();
  }


  loginCheck() {
    AsyncStorage.getItem('login').then((login) => {
      if (login !== null) {
        const logininfo = JSON.parse(login)
        this.setState({ authorization_key: logininfo.token });
      }
    })
      .catch((err) => {
        this.setState({
          isLoading: false,
          error: true
        });
      })
  }


  handleText = (text) => {
    this.setState({ username: text });
  };

  handlePhone = (text) => {
    this.setState({ usernumber: text });
  };

  distance() {
    setTimeout(() => {
      var data = geolib.getDistance(
        { latitude: this.state.latitude, longitude: this.state.longitude },
        { latitude: this.state.storelatitude, longitude: this.state.storelongitude }
      );

      var km = data / 1000;

      var delivery_fee = km * this.state.km_fee;
      this.setState({ delivery_fee: delivery_fee });

    }, 1000);
  }

  NumberFormat(number, decPlaces, decSep, thouSep) {
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
      decSep = typeof decSep === "undefined" ? "." : decSep;
    thouSep = typeof thouSep === "undefined" ? "," : thouSep;
    var sign = number < 0 ? "-" : "";
    var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
    var j = (j = i.length) > 3 ? j % 3 : 0;

    return sign +
      (j ? i.substr(0, j) + thouSep : "") +
      i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
      (decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
  }

  subtotal() {
    var total = 0;
    const cart = this.state.dataCart;

    for (var i = 0; i < cart.length; i++) {
      total = total + (cart[i].price * cart[i].quantity)
    }
    var total_price = this.NumberFormat(total);
    return total_price;
  }

  total() {
    var total = 0;
    const cart = this.state.dataCart;

    for (var i = 0; i < cart.length; i++) {
      total = total + (cart[i].price * cart[i].quantity)
    }
    var total_price = this.NumberFormat(total + this.state.delivery_fee);
    return total_price;
  }

  create_order = async () => {
    this.setState({ place_order: 'Please Wait...' });

    this.loginCheck();

    try {
      if (this.state.authorization_key == null) {
        this.props.navigation.navigate('Login', {
          screen: 'Checkout'
        });
        this.setState({ place_order: 'Place Order' });
        return true;
      }

      if (this.state.username == '') {
        Toast.showWithGravity('The Name filed is required', Toast.LONG, Toast.CENTER);
        this.setState({ place_order: 'Place Order' });
        return true;
      }

      if (this.state.usernumber == '') {
        Toast.showWithGravity(
          "The Phone Number filed is required",
          Toast.SHORT,
          Toast.CENTER
        );
        this.setState({ place_order: 'Place Order' });
        return true;
      }

      if (!this.state.dataCart.length > 0) {
        Toast.showWithGravity(
          "Your Cart is Empty",
          Toast.SHORT,
          Toast.CENTER
        );
        this.setState({ place_order: 'Place Order' });
        return true;
      }

      let str = this.NumberFormat(this.total());
      let totalAmount = str.replace(',', '');

      // Обработка платежа
      if (this.state.selectedPayment !== 'cod') {
        const paymentResult = await processPayment(
          this.state.selectedPayment,
          totalAmount,
          null // Здесь будет ID заказа после его создания
        );

        if (!paymentResult.success) {
          Toast.showWithGravity(
            'Ошибка при обработке платежа',
            Toast.SHORT,
            Toast.CENTER
          );
          this.setState({ place_order: 'Place Order' });
          return;
        }
      }

      // Создание заказа
      const response = await fetch(config.APP_URL + '/api/create_order', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: this.state.authorization_key
        },
        body: JSON.stringify({
          vendor_id: this.state.vendor_id,
          order_type: 1,
          payment_method: this.state.selectedPayment,
          payment_status: this.state.selectedPayment === 'cod' ? 0 : 1,
          total: totalAmount,
          shipping: this.state.delivery_fee,
          commission: 0,
          discount: 0.00,
          status: 2,
          name: this.state.username,
          phone: this.state.usernumber,
          delivery_address: this.state.address,
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          order_note: 'Lorem ispum',
          datacart: this.state.dataCart,
        })
      });

      const json = await response.json();
      
          this.setState({ place_order: 'Place Order' });
          AsyncStorage.removeItem('cart');
          AsyncStorage.removeItem('store');
          this.props.navigation.navigate('Thanks');
    } catch (error) {
      console.error('Order creation error:', error);
      Toast.showWithGravity(
        'Ошибка при создании заказа',
        Toast.SHORT,
        Toast.CENTER
      );
      this.setState({ place_order: 'Place Order' });
    }
  };

  loadSavedCards = async () => {
    try {
      const cards = await getSavedCards();
      this.setState({ savedCards: cards });
    } catch (error) {
      console.error('Error loading saved cards:', error);
    }
  };

  handleCardInput = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'cardNumber':
        if (!validateCardNumber(value)) {
          error = 'Неверный номер карты';
        }
        break;
      case 'expiryDate':
        if (!validateExpiryDate(value)) {
          error = 'Неверный срок действия';
        }
        break;
    }
    
    this.setState(prevState => ({
      newCard: {
        ...prevState.newCard,
        [field]: value
      },
      cardErrors: {
        ...prevState.cardErrors,
        [field]: error
      }
    }));
  };

  validateCardForm = () => {
    const { newCard } = this.state;
    const errors = {};
    
    if (!validateCardNumber(newCard.cardNumber)) {
      errors.cardNumber = 'Неверный номер карты';
    }
    
    if (!validateExpiryDate(newCard.expiryDate)) {
      errors.expiryDate = 'Неверный срок действия';
    }
    
    this.setState({ cardErrors: errors });
    return Object.keys(errors).length === 0;
  };

  renderCardForm = () => {
    const { newCard, cardErrors } = this.state;
    const cardType = getCardType(newCard.cardNumber);
    const cardIcon = getCardIcon(cardType);
    const cardColor = getCardColor(cardType);
    
    return (
      <View style={styles.cardForm}>
        <View style={[styles.cardPreview, { backgroundColor: cardColor }]}>
          <Feather name={cardIcon} size={24} color="#fff" />
          <FlatText 
            text={newCard.cardNumber ? newCard.cardNumber.replace(/\d(?=\d{4})/g, '*') : '**** **** **** ****'} 
            font="q_regular" 
            size={16} 
            color="#fff"
          />
        </View>
        
        <TextInput
          style={[styles.input, cardErrors.cardNumber && styles.inputError]}
          placeholder="Номер карты"
          value={newCard.cardNumber}
          onChangeText={(text) => this.handleCardInput('cardNumber', text.replace(/\D/g, ''))}
          keyboardType="numeric"
          maxLength={19}
        />
        {cardErrors.cardNumber ? (
          <FlatText text={cardErrors.cardNumber} font="q_regular" size={12} color="#ff3252" />
        ) : null}
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              style={[styles.input, cardErrors.expiryDate && styles.inputError]}
              placeholder="ММ/ГГ"
              value={newCard.expiryDate}
              onChangeText={(text) => this.handleCardInput('expiryDate', text)}
              maxLength={5}
            />
            {cardErrors.expiryDate ? (
              <FlatText text={cardErrors.expiryDate} font="q_regular" size={12} color="#ff3252" />
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  renderSavedCard = (card) => {
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.savedCard,
          { backgroundColor: card.color },
          this.state.selectedCard === card.id && styles.selectedCard
        ]}
        onPress={() => this.setState({ selectedCard: card.id })}
      >
        <Feather name={card.icon} size={24} color="#fff" />
        <View style={styles.cardDetails}>
          <FlatText 
            text={card.cardNumber} 
            font="q_regular" 
            size={16} 
            color="#fff"
          />
          <FlatText 
            text={card.expiryDate} 
            font="q_regular" 
            size={14} 
            color="rgba(255,255,255,0.8)"
          />
        </View>
      </TouchableOpacity>
    );
  };

  renderPaymentSection = () => {
    const { paymentMethods, selectedPayment, savedCards, selectedCard, showCardForm, newCard } = this.state;

    return (
      <View style={styles.paymentSection}>
        <View style={styles.paymentTitle}>
          <FlatText text="Способ оплаты" font="q_bold" size={18} />
        </View>
        <View style={styles.paymentMethods}>
          {paymentMethods.map((method, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.paymentMethod,
                selectedPayment === method.id && styles.selectedPayment
              ]}
              onPress={() => this.setState({ selectedPayment: method.id, selectedCard: null })}
            >
              <Feather 
                name={method.icon} 
                size={24} 
                color={selectedPayment === method.id ? '#fff' : '#333'} 
              />
              <FlatText 
                text={method.name} 
                font="q_regular" 
                size={16} 
                color={selectedPayment === method.id ? '#fff' : '#333'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {selectedPayment !== 'cod' && (
          <View style={styles.cardSection}>
            {savedCards.length > 0 && (
              <View style={styles.savedCards}>
                <FlatText text="Сохраненные карты" font="q_bold" size={16} />
                {savedCards.map(card => this.renderSavedCard(card))}
              </View>
            )}

            {!showCardForm ? (
              <TouchableOpacity
                style={styles.addCardButton}
                onPress={() => this.setState({ showCardForm: true })}
              >
                <Feather name="plus" size={20} color="#fff" />
                <FlatText text="Добавить новую карту" font="q_regular" size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.cardForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Номер карты"
                  value={newCard.cardNumber}
                  onChangeText={(text) => this.handleCardInput('cardNumber', text)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Имя владельца"
                  value={newCard.cardHolder}
                  onChangeText={(text) => this.handleCardInput('cardHolder', text)}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="ММ/ГГ"
                    value={newCard.expiryDate}
                    onChangeText={(text) => this.handleCardInput('expiryDate', text)}
                  />
                </View>
                <View style={styles.cardFormButtons}>
                  <TouchableOpacity
                    style={[styles.cardFormButton, styles.cancelButton]}
                    onPress={() => this.setState({ showCardForm: false })}
                  >
                    <FlatText text="Отмена" font="q_regular" size={16} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardFormButton, styles.saveButton]}
                    onPress={this.saveNewCard}
                  >
                    <FlatText text="Сохранить" font="q_regular" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.flex}>
          <Header />
          <View style={styles.container}>
            <ActivityIndicator color="#333" size="large" />
          </View>
        </View>
      );
    } else {
      if (this.state.error) {
        return (
          <View style={styles.flex}>
            <Header />
            <View style={styles.container}>
              <FlatText text="Something Went Wrong" font="q_regular" size={20} />
            </View>
          </View>
        );
      } else {
        return (
          <View>
            <Header />
            <ScrollView>
              <View style={styles.mainContainer}>
                <View style={styles.StoreName}>
                  <FlatText text={'Your Order ' + this.state.name} font="q_bold" size={18} />
                </View>
                <View style={styles.CartGroup}>
                  {this.state.dataCart.map((item, i) => {
                    return (
                      <View style={styles.cartItem} key={i}>
                        <View>
                          <FlatText text={item.quantity + ' * ' + item.food.title} font="q_semibold" color="#333" size={16} />
                        </View>
                        <View>
                          <FlatText text={config.CURRENCY_CODE + ' ' + item.price} font="q_semibold" color="#333" size={16} />
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View>
                  <View style={styles.cartItem}>
                    <View>
                      <FlatText text="Subtotal" font="q_semibold" color="#333" size={16} />
                    </View>
                    <View>
                      <FlatText text={config.CURRENCY_CODE + ' ' + this.subtotal()} font="q_semibold" color="#333" size={16} />
                    </View>
                  </View>
                  <View style={styles.cartItem}>
                    <View>
                      <FlatText text="Delivery Fee" font="q_semibold" color="#333" size={16} />
                    </View>
                    <View>
                      <FlatText text={config.CURRENCY_CODE + ' ' + this.NumberFormat(this.state.delivery_fee)} font="q_semibold" color="#333" size={16} />
                    </View>
                  </View>
                  <View style={styles.cartItem}>
                    <View>
                      <FlatText text="Total" font="q_bold" color="#333" size={17} />
                    </View>
                    <View>
                      <FlatText text={config.CURRENCY_CODE + ' ' + this.NumberFormat(this.total())} font="q_bold" color="#333" size={17} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.mainContainer}>
                <View style={styles.deliveryTitle}>
                  <FlatText text="Delivery Details" font="q_bold" size={18} />
                </View>
                <View style={styles.checkoutForm}>
                  <View style={styles.formGroup}>
                    <FlatText text="Name" font="q_regular" size={16} color="#333" />
                    <TextInput style={styles.inputText} placeholder="Name" placeholderTextColor="#ddd" onChangeText={(text) => this.handleText(text)} />
                  </View>
                  <View style={styles.formGroup}>
                    <FlatText text="Phone" font="q_regular" size={16} color="#333" />
                    <TextInput style={styles.inputText} keyboardType={'phone-pad'} placeholder="Phone" placeholderTextColor="#ddd" onChangeText={(text) => this.handlePhone(text)} />
                  </View>
                  <View style={styles.formGroup}>
                    <FlatText text="Address" font="q_regular" size={16} color="#333" />
                    <TextInput multiline={true} style={styles.textarea} placeholder="Address" placeholderTextColor="#ddd" value={this.state.address} editable={false} selectTextOnFocus={false} />
                  </View>
                  {this.renderPaymentSection()}
                  <View>
                    <TouchableOpacity style={styles.orderConfirm} onPress={() => this.create_order()}>
                      <FlatText text={this.state.place_order} font="q_semibold" color="#fff" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        );
      }
    }
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    marginHorizontal: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  checkoutForm: {
    marginVertical: 20
  },
  deliveryTitle: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 20
  },
  inputText: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    color: '#333'
  },
  formGroup: {
    marginBottom: 20
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    color: '#333',
    paddingBottom: 50
  },
  orderConfirm: {
    backgroundColor: '#ff3252',
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 80
  },
  StoreName: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 20,
    alignItems: 'center'
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15
  },
  CartGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 20
  },
  paymentSection: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  paymentTitle: {
    marginBottom: 15,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    gap: 10,
    minWidth: '45%',
  },
  selectedPayment: {
    backgroundColor: '#1B5E20',
  },
  flex: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardSection: {
    marginTop: 20,
  },
  savedCards: {
    marginBottom: 20,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#fff'
  },
  addCardButton: {
    backgroundColor: '#ff3252',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    gap: 10,
  },
  cardForm: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    width: '45%',
  },
  cardFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cardFormButton: {
    padding: 15,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#ff3252',
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },
  cardDetails: {
    marginLeft: 10,
    flex: 1
  },
});