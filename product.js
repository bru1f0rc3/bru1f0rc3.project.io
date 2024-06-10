let db;

async function initializeDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('productDB', 1);

    request.onerror = () => {
      console.error('Error opening IndexedDB', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      const productsStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
      const categoriesStore = db.createObjectStore('categories', { keyPath: 'name' });

      categoriesStore.add({ name: "Оплётка на рулевое колесо" });
      categoriesStore.add({ name: "Интерьер авто" });
      categoriesStore.add({ name: "Коврики" });
      categoriesStore.add({ name: "Электроника" });
      categoriesStore.add({ name: "Ароматизаторы" });
    };
  });
}

async function createProduct(product) {
  try {
    const db = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const productsStore = transaction.objectStore('products');
      const request = addToStore(productsStore, product);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
      transaction.oncomplete = () => {
        console.log('Transaction complete');
      };
      transaction.onabort = () => {
        console.error('Transaction aborted');
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

async function getProducts(category = '') {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['products'], 'readonly');
    const productsStore = transaction.objectStore('products');
    const request = productsStore.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let products = request.result;
        if (category) {
          products = products.filter(product => product.category === category);
        }
        resolve(products);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

async function addToStore(productsStore, product) {
  try {
    const request = productsStore.add(product);
    return request.result;
  } catch (error) {
    console.error('Error adding product to store:', error);
    throw error;
  }
}

async function addProduct(event) {
  event.preventDefault();
  const categoryName = document.getElementById('category').value;
  const product = {
    category: categoryName,
    name: document.getElementById('name').value,
    price: parseFloat(document.getElementById('price').value),
    imageUrl: document.getElementById('image-url').value
  };
  try {
    await createProduct(product);
    alert('Product added successfully!');
    productForm.reset();
  } catch (error) {
    alert('Error adding product: ' + error.message);
  }
}

async function getAllCategories() {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['categories'], 'readonly');
    const categoriesStore = transaction.objectStore('categories');
    const request = categoriesStore.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

async function updateProduct(id, updatedProduct) {
    try {
      const db = await initializeDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readwrite');
        const productsStore = transaction.objectStore('products');
        const request = productsStore.get(id);
  
        request.onsuccess = () => {
          const product = request.result;
          if (!product) {
            reject(new Error(`Product with ID ${id} not found`));
            return;
          }
  
          Object.assign(product, updatedProduct);
          const updateRequest = productsStore.put(product);
  
          updateRequest.onsuccess = () => {
            resolve(product);
          };
  
          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        };
  
        request.onerror = () => {
          reject(request.error);
        };
  
        transaction.oncomplete = () => {
          console.log('Transaction complete');
        };
  
        transaction.onabort = () => {
          console.error('Transaction aborted');
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async function loadProductToEdit(productName) {
    try {
      const db = await initializeDB();
      const transaction = db.transaction(['products'], 'readonly');
      const productsStore = transaction.objectStore('products');
      const request = productsStore.getAll();
  
      const products = await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
  
      const product = products.find(p => p.name === productName);
      if (product) {
        // Use the product data to populate the form
        console.log(product);
      } else {
        console.error(`Product with name "${productName}" not found.`);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  function deleteProduct(productName, category) {
    return initializeDB()
      .then(function(db) {
        const transaction = db.transaction(['products'], 'readwrite');
        const objectStore = transaction.objectStore('products');
  
        return new Promise(function(resolve, reject) {
          const request = objectStore.openCursor();
          let productToDelete;
  
          request.onsuccess = function() {
            const cursor = request.result;
            if (cursor) {
              const product = cursor.value;
              if (product.name === productName && product.category === category) {
                productToDelete = product;
              }
              cursor.continue();
            } else {
              if (productToDelete) {
                const deleteTransaction = db.transaction(['products'], 'readwrite');
                const deleteObjectStore = deleteTransaction.objectStore('products');
                deleteObjectStore.delete(productToDelete.id).onsuccess = function() {
                  console.log('Запись успешно удалена!');
                  resolve('Запись успешно удалена!');
                };
              } else {
                console.log('Запись не найдена.');
                resolve('Запись не найдена.');
              }
            }
          };
  
          request.onerror = function() {
            console.log('Ошибка при получении записей: ' + request.error);
            reject('Ошибка при получении записей: ' + request.error);
          };
        });
      })
      .catch(function(error) {
        console.log('Ошибка при удалении записи: ' + error);
        return 'Ошибка при удалении записи: ' + error;
      });
  }
  
  const deleteForm = document.getElementById('delete-form');
  deleteForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const productName = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    deleteProduct(productName, category)
      .then(function(result) {
        document.getElementById('result').textContent = result;
      })
      .catch(function(error) {
        document.getElementById('result').textContent = error;
      });
  });

  if (window.isUserAuthorized()) {
    // Пользователь авторизован
  } else {
    // Пользователь не авторизован
  }

  function getProductsWithAuthorization() {
    const token = localStorage.getItem('userToken');
    if (token) {
      // Используйте токен для запросов к серверу или других операций
      // ...
    } else {
      console.error('Токен не найден. Пользователь не авторизован.');
    }
  }