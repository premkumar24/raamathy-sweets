import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart';
import { Product, ProductService } from '../../services/product';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { BuyNowService } from '../../services/buy-now';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css'
})
export class ProductDetails implements OnInit {

  product = signal<Product | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  quantity = signal(1);
  addingToCart = signal(false);
  buyingNow = signal(false);

constructor(
  private route: ActivatedRoute,
  private productService: ProductService,
  private cartService: CartService,
  private toastService : ToastService,
  private router: Router,
  private buyNowService: BuyNowService
) {}

  ngOnInit(): void {

    const productId = this.route.snapshot.paramMap.get('id');

    console.log('Product ID:', productId);

    if (!productId) {

      this.errorMessage.set('Product ID is missing.');
      this.loading.set(false);

      return;
    }

    this.loadProduct(productId);
  }

  loadProduct(id: string): void {

    this.loading.set(true);
    this.errorMessage.set('');

    this.productService.getProductById(id).subscribe({

      next: (response) => {

        console.log('PRODUCT DETAILS:', response);

        this.product.set(response.product);

        this.loading.set(false);

      },

      error: (error) => {

        console.error('PRODUCT DETAILS ERROR:', error);

        this.errorMessage.set(
          'Unable to load product details.'
        );

        this.loading.set(false);

      }

    });
  }

  increaseQuantity(): void {
  const product = this.product();

  if (!product) {
    return;
  }

  if (this.quantity() < product.stock) {
    this.quantity.update(
      quantity => quantity + 1
    );
  }
}



decreaseQuantity(): void {
  if (this.quantity() > 1) {
    this.quantity.update(
      quantity => quantity - 1
    );
  }
}

goToCart(): void {
  this.router.navigate(['/cart']);
}

  addToCart(): void {
  const product = this.product();

  if (!product) {
    return;
  }

  this.addingToCart.set(true);

  this.cartService.addToCart(product);

  for (let i = 1; i < this.quantity(); i++) {
    this.cartService.increaseQuantity(product._id);
  }

  this.toastService.show(
    'Product added to cart'
  );

  setTimeout(() => {
    this.addingToCart.set(false);
  }, 500);
}

buyNow(): void {

  const product = this.product();

  if (!product) {
    return;
  }

  if (
    !product.isAvailable ||
    product.stock <= 0
  ) {
    return;
  }

  this.buyingNow.set(true);

  this.buyNowService.setItem(
    product,
    this.quantity()
  );

  this.router.navigate(['/order']);

}

}