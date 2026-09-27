import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  OrdersService,
  Order
} from '../../services/orders';

import {
  ProductService,
  Product
} from '../../services/product';

@Component({
  selector: 'app-admin-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './admin-dashboard.html',

  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  orders = signal<Order[]>([]);

  products = signal<Product[]>([]);

  loading = signal(true);

  errorMessage = signal('');

  constructor(
    private ordersService: OrdersService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {

    this.loading.set(true);

    this.errorMessage.set('');

    this.ordersService
      .getAllOrders()
      .subscribe({
        next: (response) => {

          this.orders.set(
            response.orders
          );

          this.loadProducts();

        },

        error: (error) => {

          console.error(
            'ADMIN DASHBOARD ORDERS ERROR:',
            error
          );

          this.errorMessage.set(
            'Unable to load dashboard data.'
          );

          this.loading.set(false);
        }
      });
  }

  private loadProducts(): void {

    this.productService
      .getProducts()
      .subscribe({
        next: (response) => {

          this.products.set(
            response.products
          );

          this.loading.set(false);
        },

        error: (error) => {

          console.error(
            'ADMIN DASHBOARD PRODUCTS ERROR:',
            error
          );

          this.errorMessage.set(
            'Unable to load dashboard data.'
          );

          this.loading.set(false);
        }
      });
  }

  getTotalOrders(): number {
    return this.orders().length;
  }

  getAwaitingConfirmation(): number {

    return this.orders()
      .filter(
        order =>
          order.status ===
          'AWAITING_CONFIRMATION'
      )
      .length;
  }

  getTotalProducts(): number {
    return this.products().length;
  }

  getLowStockProducts(): number {

    return this.products()
      .filter(
        product =>
          product.stock <= 5 &&
          product.isAvailable
      )
      .length;
  }
}