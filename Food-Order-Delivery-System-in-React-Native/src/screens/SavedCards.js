import React, { Component } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FlatText } from '../components/FlatText';
import AsyncStorage from '@react-native-community/async-storage';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-simple-toast';

export default class SavedCards extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      isLoading: true
    };
  }

  componentDidMount() {
    this.loadSavedCards();
  }

  loadSavedCards = async () => {
    try {
      const savedCards = await AsyncStorage.getItem('saved_cards');
      if (savedCards) {
        this.setState({ cards: JSON.parse(savedCards) });
      }
    } catch (error) {
      console.error('Error loading saved cards:', error);
      Toast.showWithGravity(
        'Ошибка при загрузке сохраненных карт',
        Toast.SHORT,
        Toast.CENTER
      );
    } finally {
      this.setState({ isLoading: false });
    }
  };

  deleteCard = async (cardId) => {
    try {
      const updatedCards = this.state.cards.filter(card => card.id !== cardId);
      await AsyncStorage.setItem('saved_cards', JSON.stringify(updatedCards));
      this.setState({ cards: updatedCards });
      Toast.showWithGravity(
        'Карта успешно удалена',
        Toast.SHORT,
        Toast.CENTER
      );
    } catch (error) {
      console.error('Error deleting card:', error);
      Toast.showWithGravity(
        'Ошибка при удалении карты',
        Toast.SHORT,
        Toast.CENTER
      );
    }
  };

  renderCard = (card) => {
    const lastFourDigits = card.cardNumber.slice(-4);
    return (
      <View key={card.id} style={styles.cardContainer}>
        <View style={styles.cardInfo}>
          <Feather name="credit-card" size={24} color="#333" />
          <View style={styles.cardDetails}>
            <FlatText text={`**** **** **** ${lastFourDigits}`} font="q_regular" size={16} />
            <FlatText text={`${card.cardHolder} | ${card.expiryDate}`} font="q_regular" size={14} color="#666" />
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => this.deleteCard(card.id)}
          style={styles.deleteButton}
        >
          <Feather name="trash-2" size={20} color="#ff3252" />
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.container}>
          <FlatText text="Загрузка..." font="q_regular" size={16} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <FlatText text="Сохраненные карты" font="q_bold" size={20} />
        </View>
        {this.state.cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="credit-card" size={48} color="#ddd" />
            <FlatText text="У вас нет сохраненных карт" font="q_regular" size={16} color="#666" />
          </View>
        ) : (
          this.state.cards.map(this.renderCard)
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardDetails: {
    marginLeft: 10
  },
  deleteButton: {
    padding: 5
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  }
}); 