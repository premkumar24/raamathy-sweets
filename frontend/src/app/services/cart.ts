import {
  Injectable,
  computed,
  signal
} from '@angular/core';

import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private currentUserId: string | null = null;

  private readonly guestStorageKey =
    'raamathy_cart_guest';


  private cartItems =
    signal<CartItem[]>([]);


  readonly items =
    this.cartItems.asReadonly();


  readonly itemCount =
    computed(() =>
      this.cartItems().reduce(
        (count, item) =>
          count + item.quantity,
        0
      )
    );


  // --------------------------------
  // Storage Key
  // --------------------------------

  private getStorageKey(): string {

    if (this.currentUserId) {

      return `raamathy_cart_${this.currentUserId}`;

    }

    return this.guestStorageKey;
  }


  // --------------------------------
  // Load Cart
  // --------------------------------

  private loadCart(): CartItem[] {

    const storageKey =
      this.getStorageKey();

    const savedCart =
      localStorage.getItem(storageKey);

    if (!savedCart) {
      return [];
    }

    try {

      return JSON.parse(savedCart);

    } catch (error) {

      console.error(
        'Failed to load cart:',
        error
      );

      return [];
    }
  }


  // --------------------------------
  // Save Cart
  // --------------------------------

  private saveCart(): void {

    const storageKey =
      this.getStorageKey();

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        this.cartItems()
      )
    );
  }


  // --------------------------------
  // Switch User / Guest
  // --------------------------------

  setUser(
    userId: string | null
  ): void {

    // ------------------------------
    // User is logging out
    // ------------------------------

    if (!userId) {

      this.currentUserId = null;

      this.cartItems.set(
        this.loadCart()
      );

      return;
    }


    // ------------------------------
    // User is logging in
    // ------------------------------

    const guestCart =
      this.getGuestCart();

    this.currentUserId = userId;

    const userCart =
      this.loadCart();

    const mergedCart =
      this.mergeCarts(
        userCart,
        guestCart
      );

    this.cartItems.set(
      mergedCart
    );

    this.saveCart();

    // Guest cart has now been merged
    // into the user's cart.

    localStorage.removeItem(
      this.guestStorageKey
    );

  }


  // --------------------------------
  // Get Guest Cart
  // --------------------------------

  private getGuestCart(): CartItem[] {

    const savedCart =
      localStorage.getItem(
        this.guestStorageKey
      );

    if (!savedCart) {
      return [];
    }

    try {

      return JSON.parse(savedCart);

    } catch (error) {

      console.error(
        'Failed to load guest cart:',
        error
      );

      return [];
    }
  }


  // --------------------------------
  // Merge Guest + User Cart
  // --------------------------------

  private mergeCarts(
    userCart: CartItem[],
    guestCart: CartItem[]
  ): CartItem[] {

    const mergedItems =
      [...userCart];


    guestCart.forEach(
      guestItem => {

        const existingItem =
          mergedItems.find(
            item =>
              item.product._id ===
              guestItem.product._id
          );


        // --------------------------
        // Product already exists
        // --------------------------

        if (existingItem) {

          const totalQuantity =
            existingItem.quantity +
            guestItem.quantity;

          existingItem.quantity =
            Math.min(
              totalQuantity,
              existingItem.product.stock
            );

          return;
        }


        // --------------------------
        // New product from guest cart
        // --------------------------

        if (
          guestItem.product.stock <= 0 ||
          !guestItem.product.isAvailable
        ) {

          return;
        }

        mergedItems.push({

          product:
            guestItem.product,

          quantity:
            Math.min(
              guestItem.quantity,
              guestItem.product.stock
            )

        });

      }
    );


    return mergedItems.filter(
      item =>
        item.quantity > 0 &&
        item.product.stock > 0 &&
        item.product.isAvailable
    );

  }


  // --------------------------------
  // Add To Cart
  // --------------------------------

  addToCart(
    product: Product
  ): void {

    const currentItems =
      this.cartItems();


    const existingItem =
      currentItems.find(
        item =>
          item.product._id ===
          product._id
      );


    if (existingItem) {

      if (
        existingItem.quantity >=
        product.stock
      ) {

        return;
      }


      this.cartItems.set(

        currentItems.map(
          item =>

            item.product._id ===
            product._id

              ? {
                  ...item,

                  quantity:
                    item.quantity + 1
                }

              : item
        )

      );

    } else {

      if (product.stock <= 0) {
        return;
      }


      this.cartItems.set([

        ...currentItems,

        {
          product,
          quantity: 1
        }

      ]);

    }


    this.saveCart();

  }


  // --------------------------------
  // Remove From Cart
  // --------------------------------

  removeFromCart(
    productId: string
  ): void {

    this.cartItems.set(

      this.cartItems().filter(
        item =>
          item.product._id !==
          productId
      )

    );

    this.saveCart();

  }


  // --------------------------------
  // Increase Quantity
  // --------------------------------

  increaseQuantity(
    productId: string
  ): void {

    const currentItems =
      this.cartItems();


    this.cartItems.set(

      currentItems.map(
        item => {

          if (
            item.product._id !==
            productId
          ) {

            return item;
          }


          if (
            item.quantity >=
            item.product.stock
          ) {

            return item;
          }


          return {

            ...item,

            quantity:
              item.quantity + 1

          };

        }
      )

    );


    this.saveCart();

  }


  // --------------------------------
  // Decrease Quantity
  // --------------------------------

  decreaseQuantity(
    productId: string
  ): void {

    this.cartItems.set(

      this.cartItems()

        .map(
          item =>

            item.product._id ===
            productId

              ? {
                  ...item,

                  quantity:
                    item.quantity - 1
                }

              : item
        )

        .filter(
          item =>
            item.quantity > 0
        )

    );


    this.saveCart();

  }


  // --------------------------------
  // Get Total
  // --------------------------------

  getTotal(): number {

    return this.cartItems().reduce(

      (total, item) =>

        total +
        item.product.price *
        item.quantity,

      0

    );

  }


  // --------------------------------
  // Get Item Count
  // --------------------------------

  getItemCount(): number {

    return this.cartItems().reduce(

      (count, item) =>

        count + item.quantity,

      0

    );

  }


  // --------------------------------
  // Clear Cart
  // --------------------------------

  clearCart(): void {

    this.cartItems.set([]);

    this.saveCart();

  }


  // --------------------------------
  // Sync Products
  // --------------------------------

  syncProducts(
    products: Product[]
  ): void {

    const productMap =
      new Map(

        products.map(
          product => [
            product._id,
            product
          ]
        )

      );


    const updatedItems =
      this.cartItems()

        .map(item => {

          const latestProduct =
            productMap.get(
              item.product._id
            );


          if (!latestProduct) {
            return null;
          }


          const quantity =
            Math.min(
              item.quantity,
              latestProduct.stock
            );


          if (
            !latestProduct.isAvailable ||
            quantity <= 0
          ) {

            return null;
          }


          return {

            product:
              latestProduct,

            quantity

          };

        })


        .filter(
          (item): item is CartItem =>
            item !== null
        );


    this.cartItems.set(
      updatedItems
    );

    this.saveCart();

  }

}