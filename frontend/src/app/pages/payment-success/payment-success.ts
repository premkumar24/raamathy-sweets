import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { BuyNowService } from '../../services/buy-now';
import { CartCheckoutService } from '../../services/cart-checkout';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css'
})
export class PaymentSuccess implements OnInit {

  loading = signal(true);
  paymentSuccess = signal(false);
  paymentFailed = signal(false);
  paymentPending = signal(false);
  errorMessage = signal('');
  checkingPayment = signal(false);
  orderNotFound = signal(false);

  orderId = '';
  orderMongoId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private cartService: CartService,
    private orderService: OrderService,
    private buyNowService: BuyNowService,
    private cartCheckoutService: CartCheckoutService,
  ) {}

  ngOnInit(): void {

    const cashfreeOrderId =
      this.route.snapshot.queryParamMap
        .get('cashfree_order_id') || '';

    const raamathyOrderId =
      this.route.snapshot.queryParamMap
        .get('raamathy_order_id') || '';

    const isOrderRetryPayment =
      sessionStorage.getItem(
        'isOrderRetryPayment'
      ) === 'true';


    /*
     * Retry payment:
     *
     * Use the original Raamathy order number
     * saved in sessionStorage.
     */
    if (isOrderRetryPayment) {

      this.orderId =
        sessionStorage.getItem(
          'retryPaymentOrderNumber'
        ) || raamathyOrderId;

    } else {

      /*
       * Normal first-time payment:
       *
       * Use the original Raamathy order number
       * from the return URL.
       */
      this.orderId =
        raamathyOrderId;

    }


    /*
     * Make sure we have the original
     * Raamathy order number.
     */
    if (!this.orderId) {

      this.loading.set(false);

      this.orderNotFound.set(true);

      this.errorMessage.set(
        'Order ID was not found.'
      );

      return;
    }


    this.loading.set(true);
    this.paymentFailed.set(false);
    this.paymentPending.set(false);
    this.paymentSuccess.set(false);
    this.orderNotFound.set(false);
    this.errorMessage.set('');

    this.verifyPayment();
  }


  // ============================================================
  // VERIFY PAYMENT
  // ============================================================

  verifyPayment(): void {

    this.checkingPayment.set(true);

    this.paymentService
      .checkPaymentStatus(this.orderId)
      .subscribe({

        next: (response) => {

          this.checkingPayment.set(false);
          this.loading.set(false);

          this.orderMongoId =
            response.orderMongoId;


          // ====================================================
          // SUCCESS
          // ====================================================

          if (
            response?.success &&
            response?.paymentStatus === 'SUCCESS'
          ) {

            const isBuyNowCheckout =
              sessionStorage.getItem(
                'isBuyNowCheckout'
              ) === 'true';


            this.buyNowService.clear();


            if (!isBuyNowCheckout) {

              this.cartService.clearCart();

              this.cartCheckoutService.clear();

            }


            sessionStorage.removeItem(
              'isBuyNowCheckout'
            );

            sessionStorage.removeItem(
              'isOrderRetryPayment'
            );

            sessionStorage.removeItem(
              'retryPaymentOrderNumber'
            );


            this.paymentSuccess.set(true);


            setTimeout(() => {

              this.downloadInvoice();

            }, 100);

          }


          // ====================================================
          // FAILED
          // ====================================================

          else if (
            response?.success &&
            response?.paymentStatus === 'FAILED'
          ) {

            const isBuyNowCheckout =
              sessionStorage.getItem(
                'isBuyNowCheckout'
              ) === 'true';


            this.buyNowService.clear();


            if (!isBuyNowCheckout) {

              this.cartService.clearCart();

              this.cartCheckoutService.clear();

            }


            sessionStorage.removeItem(
              'isBuyNowCheckout'
            );

            sessionStorage.removeItem(
              'isOrderRetryPayment'
            );

            sessionStorage.removeItem(
              'retryPaymentOrderNumber'
            );


            this.paymentFailed.set(true);

            this.errorMessage.set(
              'Your payment was not successful.'
            );


            setTimeout(() => {

              this.downloadInvoice();

            }, 100);

          }


          // ====================================================
          // PENDING
          // ====================================================

          else {

            this.paymentPending.set(true);

            this.errorMessage.set(
              'Your payment is still being processed.'
            );

          }

        },


        // ======================================================
        // ERROR
        // ======================================================

        error: (error) => {

          this.checkingPayment.set(false);

          console.error(
            'PAYMENT VERIFICATION ERROR:',
            error
          );

          this.loading.set(false);


          if (error?.status === 404) {

            this.orderNotFound.set(true);

            this.errorMessage.set(
              'We could not find this order. Please check your order ID or contact us.'
            );

            return;

          }


          this.errorMessage.set(
            'Unable to verify your payment. Please try again.'
          );

        }

      });

  }


  // ============================================================
  // GO TO ORDERS
  // ============================================================

  goToOrders(): void {

    this.router.navigate([
      '/orders'
    ]);

  }


  // ============================================================
  // DOWNLOAD INVOICE
  // ============================================================

  downloadInvoice(): void {

    this.orderService
      .downloadInvoice(
        this.orderMongoId
      )
      .subscribe({

        next: (blob) => {

          const url =
            window.URL.createObjectURL(
              blob
            );

          const link =
            document.createElement('a');

          link.href =
            url;

          link.download =
            `invoice-${this.orderId}.pdf`;

          link.click();

          window.URL.revokeObjectURL(
            url
          );

        },

        error: (error) => {

          console.error(
            'INVOICE DOWNLOAD ERROR:',
            error
          );

        }

      });

  }


  // ============================================================
  // GO TO HOME
  // ============================================================

  goToHome(): void {

    this.router.navigate([
      '/'
    ]);

  }

}
