import {Component,OnInit,signal,computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router,RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { CartCheckoutService } from '../../services/cart-checkout';
import { BuyNowService } from '../../services/buy-now';

@Component({
  selector: 'app-cart',
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {

  selectedProductIds =
    signal<Set<string>>(new Set());

  selectedItemCount =
    computed(() => {

      return this.cartService
        .items()
        .filter(item =>
          this.selectedProductIds()
            .has(item.product._id)
        )
        .reduce(
          (count, item) =>
            count + item.quantity,
          0
        );

    });

  selectedTotal =
    computed(() => {

      return this.cartService
        .items()
        .filter(item =>
          this.selectedProductIds()
            .has(item.product._id)
        )
        .reduce(
          (total, item) =>
            total +
            item.product.price *
            item.quantity,
          0
        );

    });

  allSelected =
    computed(() => {

      const items =
        this.cartService.items();

      if (items.length === 0) {
        return false;
      }

      return items.every(item =>
        this.selectedProductIds()
          .has(item.product._id)
      );

    });

  constructor(
    public cartService: CartService,
    private productService: ProductService,
    private cartCheckoutService: CartCheckoutService,
    private buyNowService: BuyNowService,
     private router: Router
  ) {}

 ngOnInit(): void {
  this.refreshCartProducts();
}

 private refreshCartProducts(): void {
  this.productService
    .getProducts()
    .subscribe({
      next: (response) => {
        this.cartService.syncProducts(
          response.products
        );

        this.selectedProductIds.set(
          new Set(
            this.cartService
              .items()
              .map(item => item.product._id)
          )
        );

        this.removeInvalidSelections();
      },
      error: (error) => {
        console.error(
          'Unable to refresh cart products:',
          error
        );
      }
    });
}

  toggleItem(
    productId: string
  ): void {

    const selected =
      new Set(
        this.selectedProductIds()
      );

    if (selected.has(productId)) {

      selected.delete(productId);

    } else {

      selected.add(productId);

    }

    this.selectedProductIds.set(
      selected
    );

  }

  toggleAll(): void {

    const items =
      this.cartService.items();

    if (this.allSelected()) {

      this.selectedProductIds.set(
        new Set()
      );

      return;
    }

    this.selectedProductIds.set(
      new Set(
        items.map(
          item => item.product._id
        )
      )
    );

  }

  private removeInvalidSelections(): void {

    const validIds =
      new Set(
        this.cartService
          .items()
          .map(
            item => item.product._id
          )
      );

    const selected =
      new Set(
        this.selectedProductIds()
      );

    selected.forEach(
      productId => {

        if (!validIds.has(productId)) {
          selected.delete(productId);
        }

      }
    );

    this.selectedProductIds.set(
      selected
    );

  }

  increaseQuantity(
    productId: string
  ): void {

    this.cartService.increaseQuantity(
      productId
    );

  }

  decreaseQuantity(
    productId: string
  ): void {

    this.cartService.decreaseQuantity(
      productId
    );

  }

  removeItem(
    productId: string
  ): void {

    this.cartService.removeFromCart(
      productId
    );

    const selected =
      new Set(
        this.selectedProductIds()
      );

    selected.delete(productId);

    this.selectedProductIds.set(
      selected
    );

  }

  getTotal(): number {

    return this.cartService.getTotal();

  }

 proceedToCheckout(): void {

  const selectedItems =
    this.cartService
      .items()
      .filter(item =>
        this.selectedProductIds()
          .has(item.product._id)
      );

  if (selectedItems.length === 0) {
    return;
  }

  // This is a cart checkout,
  // so remove any previous Buy Now selection.
  this.buyNowService.clear();

  this.cartCheckoutService.setItems(
    selectedItems
  );

  this.router.navigate([
    '/order'
  ]);

}

}