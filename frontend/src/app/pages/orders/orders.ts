import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  OrdersService,
  Order
} from '../../services/orders';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {

  orders = signal<Order[]>([]);

  loading = signal(true);

  errorMessage = signal('');

  constructor(
    private ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {

    this.loading.set(true);
    this.errorMessage.set('');

    this.ordersService
      .getMyOrders()
      .subscribe({

        next: (response) => {

          this.orders.set(
            response.orders
          );

          this.loading.set(false);
        },

        error: (error) => {

          console.error(
            'GET MY ORDERS ERROR:',
            error
          );

          this.loading.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to load your orders.'
          );
        }
      });
  }

  getStatusLabel(
    status: string
  ): string {

    return status
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );
  }
}