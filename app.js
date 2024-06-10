async function initializeDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('accountDB', 4);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Проверяем наличие объектного хранилища 'users' перед его созданием
      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        usersStore.createIndex('username', 'username', { unique: true });
        usersStore.createIndex('sessionToken', 'sessionToken', { unique: true });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  }).catch((error) => {
    console.error('Error initializing database:', error);
    throw error;
  });
}

  async function getObjectByIndex(index, value) {
    const request = index.get(value);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async function registerUser(username, password, email) {
    const db = await initializeDB();
    const transaction = db.transaction(['users'], 'readwrite');
    const usersStore = transaction.objectStore('users');
  
    // Проверяем, что хранилище 'users' существует
    if (!usersStore) {
      throw new Error('Хранилище "users" не найдено в базе данных');
    }
  
    // Проверяем, что пользователь с таким именем еще не существует
    const userIndex = usersStore.index('username');
    const user = await getObjectByIndex(userIndex, username);
    if (user) {
      throw new Error('Пользователь с таким именем уже существует');
    }
  
    // Добавляем нового пользователя
    await usersStore.add({ username, password, email });
    await transaction.complete;
  
    console.log('Пользователь успешно зарегистрирован!');
  }
  
  async function generateSessionToken() {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Функция для сохранения токена сессии
  function saveSessionToken(token) {
    localStorage.setItem('sessionToken', token);
    console.log('Токен сессии сохранен в localStorage');
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
          const sessionToken = await loginUser(username, password);
          console.log('Пользователь успешно авторизован!');
          saveSessionToken(sessionToken);
          updateHeader();
  
          // Открываем страницу index.html в текущей вкладке
          window.open('index.html', '_parent');
        } catch (error) {
          document.getElementById('result').textContent = error.message;
        }
      });
    }
  });
  
  // Функция для авторизации пользователя и создания сессии
  async function loginUser(username, password) {
    const db = await initializeDB();
    const transaction = db.transaction(['users'], 'readwrite');
    const usersStore = transaction.objectStore('users');
  
    // Проверяем, что хранилище 'users' существует
    if (!usersStore) {
      throw new Error('Хранилище "users" не найдено в базе данных');
    }
  
    // Проверяем, что пользователь с таким именем существует и пароль верный
    const userIndex = usersStore.index('username');
    const user = await getObjectByIndex(userIndex, username);
    if (!user || user.password !== password) {
      throw new Error('Неверное имя пользователя или пароль');
    }
  
    const sessionToken = await generateSessionToken();
    user.sessionToken = sessionToken;
    await usersStore.put(user);
    await saveSessionToken(sessionToken);
  
    // Обновляем содержимое <header>
    await updateHeader();
  
    console.log('Пользователь успешно авторизован!');
    return sessionToken;
  }

  // Обработчик регистрации
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registration-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const email = document.getElementById('email').value;
      try {
        await registerUser(username, password, email);
        document.getElementById('result').textContent = 'Пользователь успешно зарегистрирован!';
      } catch (error) {
        document.getElementById('result').textContent = error.message;
      }
    });
  });
  
  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
      const sessionToken = await loginUser(username, password);
      localStorage.setItem('sessionToken', sessionToken); // Сохраняем токен сессии в localStorage
      const resultElement = document.getElementById('result');
      if (resultElement) {
        // Display the session token in the result element (corrected)
        resultElement.textContent = `Пользователь успешно авторизован! \n Ваш токен сессии: ${sessionToken}`; 
      } else {
        console.error('Элемент с id="result" не найден в DOM');
      }
    } catch (error) {
      const resultElement = document.getElementById('result');
      if (resultElement) {
        resultElement.textContent = error.message;
      } else {
        console.error('Элемент с id="result" не найден в DOM');
      }
    }
  });

  function loginUser(username) {
    // логика авторизации
    localStorage.setItem('username', username);
    updateLoginUsername(username);
}

function updateLoginUsername(username) {
    const loginUsernameElement = document.getElementById('login-username');
    loginUsernameElement.textContent = username || 'Нет имени пользователя';
}

async function logout() {
  try {
    // Удаляем все данные пользователя из localStorage
    localStorage.clear();

    // Обновляем пользовательский интерфейс
    updateLoginUsername('');
    await updateHeader();

    // Перенаправляем на страницу входа
    window.location.replace('login.html');
    alert('Вы вышли из аккаунта.');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function checkAuthorization(callback) {
  const sessionToken = localStorage.getItem('sessionToken');
  if (sessionToken && sessionToken !== '') {
    callback();
  } else {
    const authPopup = document.getElementById('auth-popup');
    authPopup.style.display = 'block';
    setTimeout(() => {
      authPopup.style.display = 'none';
    }, 5000);
  }
}

function isUserAuthorized() {
  return !!localStorage.getItem('sessionToken');
}
window.isUserAuthorized = isUserAuthorized;

if (localStorage.getItem('sessionToken')) {
  console.log('User is authenticated!');
} else {
  window.location.href = 'index.html';
}