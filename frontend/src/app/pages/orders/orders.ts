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

import {
  PaymentService
} from '../../services/payment';

import {
  load
} from '@cashfreepayments/cashfree-js';

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

  /*
   * Stores the order number currently
   * being processed for payment.
   */
  payingOrderId = signal<string | null>(null);

  /*
   * Cashfree instance
   */
  cashfree: any;

  constructor(
    private ordersService: OrdersService,
    private paymentService: PaymentService
  ) {}

  async ngOnInit(): Promise<void> {

    /*
     * Load Cashfree
     */
    this.cashfree = await load({
      mode: 'sandbox'
    });

    /*
     * Load customer orders
     */
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

  /*
   * PAY NOW
   *
   * Creates a Cashfree payment session
   * for the existing order.
   *
   * It does NOT create a new application order.
   */
  async payNow(order: Order): Promise<void> {

    /*
     * Only online pending payments
     * can be paid from here.
     */
  if (
    order.payment?.status !== 'PENDING'
) {
    return;
}

    /*
     * Do not allow payment for cancelled orders.
     */
    if (
      order.status === 'CANCELLED'
    ) {
      return;
    }

    /*
     * Prevent double-clicking.
     */
    if (
      this.payingOrderId()
    ) {
      return;
    }

    /*
     * Make sure Cashfree is ready.
     */
    if (!this.cashfree) {

      this.errorMessage.set(
        'Payment system is not ready. Please try again.'
      );

      return;
    }

    this.errorMessage.set('');

    this.payingOrderId.set(
      order.orderNumber
    );

    try {

      /*
       * Create Cashfree payment session
       * for the existing order.
       *
       * Backend gets the amount,
       * customer details and payment
       * information from MongoDB.
       */
      const response =
        await this.paymentService
          .createPayment(
            order.orderNumber
          )
          .toPromise();

      if (
        !response?.success ||
        !response?.paymentSessionId
      ) {

        throw new Error(
          'Payment session could not be created.'
        );
      }

      /*
       * Tell payment-success page that
       * this is a payment retry from
       * the Orders page.
       *
       * This is important because the
       * customer may currently have
       * other items in their cart.
       */
      sessionStorage.setItem(
  'isOrderRetryPayment',
  'true'
);

sessionStorage.setItem(
  'retryPaymentOrderNumber',
  order.orderNumber
);

      /*
       * Open Cashfree checkout.
       */
      await this.cashfree.checkout({

        paymentSessionId:
          response.paymentSessionId,

        redirectTarget:
          '_self'

      });

    } catch (error) {

      console.error(
        'PAY NOW ERROR:',
        error
      );

      /*
       * Remove retry flag if Cashfree
       * checkout could not be started.
       */
      sessionStorage.removeItem(
        'isOrderRetryPayment'
      );

      this.errorMessage.set(
        'Unable to start payment. Please try again.'
      );

      this.payingOrderId.set(null);
    }
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

  getShipmentStatusLabel(
    status:
      | 'not_shipped'
      | 'in_transit'
      | 'out_for_delivery'
      | 'delivered'
      | undefined
  ): string {

    switch (status) {

      case 'not_shipped':
        return 'Not Shipped';

      case 'in_transit':
        return 'In Transit';

      case 'out_for_delivery':
        return 'Out for Delivery';

      case 'delivered':
        return 'Delivered';

      default:
        return 'Not Shipped';
    }
  }

  isShipmentStepCompleted(
    currentStatus:
      | 'not_shipped'
      | 'in_transit'
      | 'out_for_delivery'
      | 'delivered'
      | undefined,

    step:
      | 'not_shipped'
      | 'in_transit'
      | 'out_for_delivery'
      | 'delivered'
  ): boolean {

    const order = [
      'not_shipped',
      'in_transit',
      'out_for_delivery',
      'delivered'
    ];

    const currentIndex =
      order.indexOf(
        currentStatus || 'not_shipped'
      );

    const stepIndex =
      order.indexOf(step);

    return stepIndex <= currentIndex;
  }
}