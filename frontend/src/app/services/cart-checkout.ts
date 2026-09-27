import { Injectable, signal } from '@angular/core';
import { CartItem } from './cart';

@Injectable({
  providedIn: 'root'
})
export class CartCheckoutService {

  private readonly storageKey =
    'raamathy_cart_checkout';

  private selectedItems =
    signal<CartItem[]>(
      this.load()
    );

  readonly items =
    this.selectedItems.asReadonly();

  setItems(
    items: CartItem[]
  ): void {

    this.selectedItems.set(items);

    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify(items)
    );

  }

  clear(): void {

    this.selectedItems.set([]);

    sessionStorage.removeItem(
      this.storageKey
    );

  }

  private load(): CartItem[] {

    const saved =
      sessionStorage.getItem(
        this.storageKey
      );

    if (!saved) {
      return [];
    }

    try {

      return JSON.parse(saved);

    } catch (error) {

      console.error(
        'Failed to load cart checkout items:',
        error
      );

      sessionStorage.removeItem(
        this.storageKey
      );

      return [];

    }

  }

}