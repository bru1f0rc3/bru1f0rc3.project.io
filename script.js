function addToCart(productName, price) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: productName, price: price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

function removeFromCart(productName) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.name !== productName);
    localStorage.setItem('cart', JSON.stringify(cart));
}

function clearCart() {
    localStorage.removeItem('cart');
    location.reload();
}

document.addEventListener('DOMContentLoaded', function() {
  const cartItems = document.getElementById('cart-items');
  let totalPrice = 0;

  // Получение данных корзины из localStorage
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const itemCounts = {};

  // Подсчет количества каждого товара в корзине
  cart.forEach(item => {
      if (itemCounts[item.name]) {
          itemCounts[item.name] += item.quantity;
      } else {
          itemCounts[item.name] = item.quantity;
      }
  });

  // Отображение элементов корзины и подсчет общей стоимости
  Object.keys(itemCounts).forEach(name => {
      const quantity = itemCounts[name];
      const item = cart.find(item => item.name === name);
      const li = document.createElement('li');
      li.textContent = `${name} - ${item.price * quantity} руб x${quantity}`;
      cartItems.appendChild(li);
      totalPrice += item.price * quantity;
  });

  // Обновление общей стоимости в корзине
  const totalPriceElement = document.getElementById('total-price');
  totalPriceElement.textContent = `Общая стоимость: ${totalPrice} руб`;

  // Обновление общей стоимости на странице оформления заказа
  const checkoutTotalPriceElement = document.querySelector('#checkout #total-price');
  checkoutTotalPriceElement.textContent = `Общая сумма к оплате: ${totalPrice} руб`;

  // Функция для очистки корзины
  function clearCart() {
      localStorage.removeItem('cart');
  }

  document.querySelector('.btn').addEventListener('click', function(event) {
    event.preventDefault();
    const notification = document.getElementById('notification');
    const container = document.querySelector('.container');
    notification.innerHTML = "Ваш заказ оформлен! <br> Чек будет отправлен на вашу почту. <br> Ожидайте уведомление с трек-номером для отслеживания заказа.";
    container.style.display = "flex"; // Показать контейнер

    setTimeout(function() {
        container.style.display = "none"; // Скрыть контейнер через 2.5 секунды
        // Перенаправление на Digiseller после скрытия уведомления
        window.location.href = `https://www.digiseller.market/asp2/pay_wm.asp?id_d=4303600&lang=ru-RU&amount=${totalPrice}`;
    }, 2500);
});

  // Обработчик события отправки формы
  const checkoutForm = document.getElementById('checkout-form');
  checkoutForm.addEventListener('submit', function(event) {
      event.preventDefault();

      // Получение данных платежной карты
      const cardNumber = document.querySelector('.card-number input').value;
      const cardExpiry = document.querySelector('.card-expiry input').value;
      const cardCvc = document.querySelector('.card-cvc input').value;

      // Подготовка URL для перенаправления на Digiseller
      const paymentUrl = `https://www.digiseller.market/asp2/pay_wm.asp?id_d=4303600&lang=ru-RU&amount=${totalPrice}`;

      // Очистка корзины и перенаправление на Digiseller
      clearCart();
      window.location.href = paymentUrl;
  });
});

async function initializeDB() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('reviewsDB', 1);
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
      };
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  async function loadReviews() {
    const db = await initializeDB();
    const transaction = db.transaction(['reviews'], 'readonly');
    const objectStore = transaction.objectStore('reviews');
    if (!objectStore) {
      console.error('Объектное хранилище "reviews" не найдено');
      return;
    }
    const reviews = await new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  
    const reviewsContainer = document.getElementById("reviews-container");
    reviewsContainer.innerHTML = ""; // Очищаем контейнер с отзывами
  
    reviews.forEach((review) => {
      const reviewElement = document.createElement("div");
      reviewElement.classList.add("review");
      reviewElement.innerHTML = `
        <h3>${review.author}</h3>
        <p>${review.review}</p>
        <p class="rating">Оценка: ${review.rating}</p>
      `;
      reviewsContainer.appendChild(reviewElement);
    });
  }
  
  async function saveReview(author, review, rating) {
    const db = await initializeDB();
    const transaction = db.transaction(['reviews'], 'readwrite');
    const objectStore = transaction.objectStore('reviews');
    await new Promise((resolve, reject) => {
      const request = objectStore.add({ author, review, rating });
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
    await loadReviews(); // Обновляем список отзывов после сохранения нового
  }

  window.onload = loadReviews;

  document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (username) {
        updateLoginUsername(username);
    }
  
    const authorInput = document.getElementById('author');
    if (authorInput) {
        authorInput.value = username;
    }
  
    const nicknameInput = document.querySelector('input[name="nicknames"]');
    if (nicknameInput) {
        nicknameInput.value = username;
    }
  });
  
  function updateLoginUsername(username) {
    const loginUsernameElement = document.getElementById('login-username');
    const authorElement = document.getElementById('author');
    const nicknameInput = document.querySelector('input[name="nicknames"]');
  
    if (loginUsernameElement) {
      loginUsernameElement.textContent = username ? username : 'Нет имени пользователя';
    }
  
    if (authorElement) {
      authorElement.textContent = username ? username : 'Нет имени пользователя';
    }
  
    if (nicknameInput) {
      nicknameInput.value = username ? username : '';
    }
  }

function logout() {
  // Логика выхода пользователя из системы
  localStorage.removeItem('username');
  localStorage.removeItem('sessionToken');
  updateLoginUsername('');
  window.location.replace('header_index.html'); // Reload the header_index.html file
}

async function updateHeader() {
  try {
    const sessionToken = localStorage.getItem('sessionToken');
    let html;
    if (sessionToken) {
      // Пользователь авторизован, поэтому загружаем header_authenticated.html
      const response = await fetch('header_index.html', {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html'
        }
      });
      html = await response.text();
    } else {
      // Пользователь не авторизован, поэтому загружаем header_index.html
      const response = await fetch('header_index.html', {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html'
        }
      });
      html = await response.text();
    }

    // Обновляем содержимое <header> на странице index.html
    const header = document.querySelector('header');
    header.innerHTML = html;
  } catch (error) {
    console.error('Ошибка при обновлении шапки:', error);
  }
}

document.querySelector('form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form submission

  // Get form inputs
  var productName = document.getElementById('product-name').value;
  var productDescription = document.getElementById('product-description').value;
  var productPrice = document.getElementById('product-price').value;
  var productCategory = document.getElementById('product-category').value;
  var productImage = document.getElementById('product-image').files[0];

  // Save product details in local storage
  var products = JSON.parse(localStorage.getItem('products')) || [];
  products.push({
      name: productName,
      description: productDescription,
      price: productPrice,
      category: productCategory,
      image: productImage.name
  });
  localStorage.setItem('products', JSON.stringify(products));

  // Display success message
  alert('Товар добавлен!');

  // Reset form inputs
  document.querySelector('form').reset();
});

  window.onload = loadReviews;

  if (window.isUserAuthorized()) {
    // Пользователь авторизован
  } else {
    // Пользователь не авторизован
  }
