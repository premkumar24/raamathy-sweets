import { Injectable, signal } from '@angular/core';
import { Product } from './product';

export interface BuyNowItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuyNowService {

  private readonly storageKey =
    'raamathy_buy_now';

  private buyNowItem =
    signal<BuyNowItem | null>(
      this.load()
    );

  readonly item =
    this.buyNowItem.asReadonly();

  setItem(
    product: Product,
    quantity: number
  ): void {

    const item: BuyNowItem = {
      product,
      quantity
    };

    this.buyNowItem.set(item);

    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify(item)
    );
  }

  clear(): void {

    this.buyNowItem.set(null);

    sessionStorage.removeItem(
      this.storageKey
    );
  }

  private load(): BuyNowItem | null {

    const saved =
      sessionStorage.getItem(
        this.storageKey
      );

    if (!saved) {
      return null;
    }

    try {

      return JSON.parse(saved);

    } catch (error) {

      console.error(
        'Failed to load Buy Now item:',
        error
      );

      sessionStorage.removeItem(
        this.storageKey
      );

      return null;
    }
  }
}