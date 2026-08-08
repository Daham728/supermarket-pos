import { useMemo, useState } from "react";

export function useCart() {
  const [cartItems, setCartItems] = useState([]);

  function addItem(product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id,
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          return currentItems;
        }

        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, newQuantity) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const safeQuantity = Math.min(
            Math.max(newQuantity, 0),
            item.stockQuantity,
          );

          return { ...item, quantity: safeQuantity };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [cartItems],
  );

  const totalItems = useMemo(
    () =>
      cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  return {
    cartItems,
    subtotal,
    totalItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}