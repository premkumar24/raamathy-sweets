import {
  Component,
  OnInit,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Order,
  OrdersService
} from '../../services/orders';

@Component({
  selector: 'app-admin-orders',

  imports: [
    CommonModule
  ],

  templateUrl: './admin-orders.html',

  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {

  orders = signal<Order[]>([]);

  loading = signal(true);

  errorMessage = signal('');

  updatingOrderId = signal<string | null>(null);

  // --------------------------------------------------
  // Filters
  // --------------------------------------------------

  searchOrderId = signal('');

  selectedStatus = signal('ALL');

  filteredOrders = computed(() => {

    const search =
      this.searchOrderId()
        .trim()
        .toLowerCase();

    const status =
      this.selectedStatus();

    return this.orders().filter(order => {

      const matchesOrderId =
        !search ||
        order.orderNumber
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        status === 'ALL' ||
        order.status === status;

      return (
        matchesOrderId &&
        matchesStatus
      );

    });

  });

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
      .getAllOrders()
      .subscribe({

        next: (response) => {

          this.orders.set(
            response.orders
          );

          this.loading.set(false);

        },

        error: (error) => {

          console.error(
            'ADMIN ORDERS ERROR:',
            error
          );

          this.errorMessage.set(
            'Unable to load orders.'
          );

          this.loading.set(false);

        }

      });

  }

  // --------------------------------------------------
  // Filter handlers
  // --------------------------------------------------

onSearchOrderId(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  this.searchOrderId.set(
    input.value
  );

}

onStatusChange(event: Event): void {

  const select =
    event.target as HTMLSelectElement;

  this.selectedStatus.set(
    select.value
  );

}

  clearFilters(): void {

    this.searchOrderId.set('');

    this.selectedStatus.set('ALL');

  }

  // --------------------------------------------------
  // Order status update
  // --------------------------------------------------

  updateStatus(
    orderId: string,
    status: string
  ): void {

    this.updatingOrderId.set(orderId);

    this.ordersService
      .updateOrderStatus(
        orderId,
        status
      )
      .subscribe({

        next: (response) => {

          this.orders.update(
            orders =>
              orders.map(order =>
                order._id === orderId
                  ? response.order
                  : order
              )
          );

          this.updatingOrderId.set(null);

        },

        error: (error) => {

          console.error(
            'UPDATE STATUS ERROR:',
            error
          );

          this.errorMessage.set(
            'Unable to update order status.'
          );

          this.updatingOrderId.set(null);

        }

      });

  }

  getNextStatuses(
    status: string
  ): string[] {

    switch (status) {

      case 'AWAITING_CONFIRMATION':

        return [
          'CONFIRMED',
          'CANCELLED'
        ];

      case 'CONFIRMED':

        return [
          'PROCESSING',
          'CANCELLED'
        ];

      case 'PROCESSING':

        return [
          'READY_FOR_DELIVERY',
          'CANCELLED'
        ];

      case 'READY_FOR_DELIVERY':

        return [
          'DELIVERED',
          'CANCELLED'
        ];

      case 'DELIVERED':

        return [];

      case 'CANCELLED':

        return [];

      default:

        return [];

    }

  }

  getStatusLabel(
    status: string
  ): string {

    switch (status) {

      case 'AWAITING_CONFIRMATION':

        return 'Awaiting Confirmation';

      case 'READY_FOR_DELIVERY':

        return 'Ready for Delivery';

      default:

        return status
          .replaceAll('_', ' ')
          .toLowerCase()
          .replace(
            /\b\w/g,
            char => char.toUpperCase()
          );

    }

  }

}