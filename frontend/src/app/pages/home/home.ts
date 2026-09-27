import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast';

@Component({
  imports: [CommonModule , RouterLink],
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  products = signal<Product[]>([]);

  loading = signal(true);

  errorMessage = signal('');
  addingToCartId = signal<string | null>(null);

  constructor(
  private productService: ProductService,
  private cartService: CartService,
  private toastService: ToastService
) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {

    console.log('loadProducts() started');

    this.loading.set(true);
    this.errorMessage.set('');

    this.productService.getProducts().subscribe({

      next: (response) => {

        console.log('API SUCCESS:', response);

        this.products.set(response.products);

        console.log('Products:', response.products);

        this.loading.set(false);

      },

      error: (error) => {

        console.error('API ERROR:', error);

        this.errorMessage.set(
          'Unable to load products. Please try again.'
        );

        this.loading.set(false);

      },

      complete: () => {
        console.log('API request completed');
      }

    });
  }

  addToCart(product: Product): void {
  this.addingToCartId.set(product._id);
  this.cartService.addToCart(product);
  this.toastService.show(
    'Product added to cart'
  );
   setTimeout(() => {
    this.addingToCartId.set(null);
  }, 500);
}
}