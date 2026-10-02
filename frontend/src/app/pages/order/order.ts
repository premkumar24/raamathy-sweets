import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { ToastService } from '../../services/toast';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CartService } from '../../services/cart';
import {
  CreateOrderRequest,
  OrderService
} from '../../services/order';
import { AuthService } from '../../services/auth';
import {
  BuyNowItem,
  BuyNowService
} from '../../services/buy-now';
import {
  CartCheckoutService
} from '../../services/cart-checkout';
import { PaymentService } from '../../services/payment';
import { load } from '@cashfreepayments/cashfree-js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './order.html',
  styleUrl: './order.css'
})
export class Order implements OnInit {

  isSubmitting = signal(false);

  orderSuccess = signal(false);

  errorMessage = signal('');

  orderNumber = signal('');
  orderId = signal('');

  buyNowItem =
    signal<BuyNowItem | null>(null);

  checkoutItems =
    signal<BuyNowItem[]>([]);

  cashfree: any;

  paymentMethod:
    'online' | 'offline' = 'online';

  orderForm = new FormGroup({

    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2)
      ]
    }),

    phone: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)
      ]
    }),

    address: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10)
      ]
    })

  });

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private productService: ProductService,
    private toastService: ToastService,
    private authService: AuthService,
    private buyNowService: BuyNowService,
    private cartCheckoutService: CartCheckoutService,
    private paymentService: PaymentService
  ) {}

  async ngOnInit(): Promise<void> {

    this.cashfree = await load({
      mode: 'sandbox'
    });

    const user =
      this.authService.currentUser();

    if (user) {

      this.orderForm.patchValue({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });

    }

    const buyNowItem =
      this.buyNowService.item();

    const cartCheckoutItems =
      this.cartCheckoutService.items();

    /*
     * BUY NOW
     *
     * Buy Now should always take priority.
     * This prevents old cart-checkout data
     * from overriding the new Buy Now product.
     */
    if (buyNowItem) {

      this.buyNowItem.set(
        buyNowItem
      );

      this.checkoutItems.set([
        buyNowItem
      ]);

    }

    /*
     * SELECTED CART ITEMS
     */
    else if (
      cartCheckoutItems.length > 0
    ) {

      this.checkoutItems.set(
        cartCheckoutItems
      );

      this.buyNowItem.set(null);

    }

    /*
     * NORMAL CART
     */
    else {

      this.checkoutItems.set(
        this.cartService.items()
      );

      this.buyNowItem.set(null);

    }

  }

  placeOrder(): void {

    if (this.orderSuccess()) {
      return;
    }

    if (this.orderForm.invalid) {

      this.orderForm.markAllAsTouched();

      return;
    }

    const buyNowItem =
      this.buyNowItem();

    const checkoutItems =
      buyNowItem
        ? [buyNowItem]
        : this.checkoutItems();

    if (checkoutItems.length === 0) {

      this.errorMessage.set(
        'Your cart is empty.'
      );

      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    /*
     * Get latest product information
     */
    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

          let latestCheckoutItems:
            BuyNowItem[] = [];

          /*
           * BUY NOW
           */
          if (buyNowItem) {

            const latestProduct =
              response.products.find(
                product =>
                  product._id ===
                  buyNowItem.product._id
              );

            if (
              !latestProduct ||
              !latestProduct.isAvailable ||
              latestProduct.stock <= 0
            ) {

              this.isSubmitting.set(false);

              this.errorMessage.set(
                'This product is no longer available.'
              );

              return;
            }

            if (
              buyNowItem.quantity >
              latestProduct.stock
            ) {

              this.isSubmitting.set(false);

              this.errorMessage.set(
                'The available stock is less than your selected quantity.'
              );

              return;
            }

            latestCheckoutItems = [
              {
                product: latestProduct,
                quantity: buyNowItem.quantity
              }
            ];

          }

          /*
           * SELECTED CART ITEMS
           */
          else {

            this.cartService.syncProducts(
              response.products
            );

            const selectedCheckoutItems =
              this.checkoutItems();

            latestCheckoutItems =
              selectedCheckoutItems
                .map(item => {

                  const latestProduct =
                    response.products.find(
                      product =>
                        product._id ===
                        item.product._id
                    );

                  if (
                    !latestProduct ||
                    !latestProduct.isAvailable ||
                    latestProduct.stock <= 0
                  ) {
                    return null;
                  }

                  if (
                    item.quantity >
                    latestProduct.stock
                  ) {
                    return null;
                  }

                  return {
                    product: latestProduct,
                    quantity: item.quantity
                  };

                })
                .filter(
                  (
                    item
                  ): item is BuyNowItem =>
                    item !== null
                );

            if (
              latestCheckoutItems.length === 0
            ) {

              this.isSubmitting.set(false);

              this.errorMessage.set(
                'Some selected products are no longer available.'
              );

              return;
            }

          }

          /*
           * CREATE ORDER REQUEST
           */
          const orderRequest:
            CreateOrderRequest = {

            customerName:
              this.orderForm.controls.name.value.trim(),

            phone:
              this.orderForm.controls.phone.value.trim(),

            address:
              this.orderForm.controls.address.value.trim(),

            paymentMethod:
              this.paymentMethod,

            items:
              latestCheckoutItems.map(item => ({

                productId:
                  item.product._id,

                quantity:
                  item.quantity

              }))

          };

          /*
           * CREATE ORDER
           */
          this.orderService
            .createOrder(orderRequest)
            .subscribe({

              next: (response) => {

                this.orderId.set(
                  response.order._id
                );

                this.orderNumber.set(
                  response.order.orderNumber
                );

                /*
                 * ONLINE PAYMENT
                 */
                if (
                  this.paymentMethod === 'online'
                ) {

                  this.startPayment(
                    response.order
                  );

                  return;
                }

                /*
                 * OFFLINE PAYMENT
                 */

                // Clear temporary Buy Now data.
                this.buyNowService.clear();

                /*
                 * Clear cart and cart-checkout
                 * data only for normal cart checkout.
                 */
                if (!buyNowItem) {

                  this.cartService.clearCart();

                  this.cartCheckoutService.clear();

                }

                this.isSubmitting.set(false);

                this.orderSuccess.set(true);

                setTimeout(() => {

                  this.downloadInvoice();

                }, 100);

              },

              error: (error) => {

                this.toastService.show(
                  'Failed to Place the Order, Try Sometime Later'
                );

                console.error(
                  'ORDER ERROR:',
                  error
                );

                this.isSubmitting.set(false);

                this.errorMessage.set(
                  error?.error?.message ||
                  'Unable to place the order. Please try again.'
                );

              }

            });

        },

        error: (error) => {

          console.error(
            'PRODUCT REFRESH ERROR:',
            error
          );

          this.isSubmitting.set(false);

          this.errorMessage.set(
            'Unable to verify product availability. Please try again.'
          );

        }

      });

  }

  async startPayment(order: any): Promise<void> {

  if (!this.cashfree) {
    this.errorMessage.set(
      'Payment system is not ready. Please try again.'
    );

    this.isSubmitting.set(false);
    return;
  }

  try {

    /*
     * Create Cashfree payment order.
     * Backend fetches amount and customer details
     * from the existing order in MongoDB.
     */
    const response = await this.paymentService
      .createPayment(order.orderNumber)
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
     * Remember whether this was
     * Buy Now or Cart checkout.
     */
    sessionStorage.setItem(
      'isBuyNowCheckout',
      this.buyNowItem() ? 'true' : 'false'
    );

    /*
     * Open Cashfree checkout.
     */
    await this.cashfree.checkout({
      paymentSessionId: response.paymentSessionId,
      redirectTarget: '_self'
    });

  } catch (error) {

    console.error(
      'PAYMENT ERROR:',
      error
    );

    this.isSubmitting.set(false);

    this.errorMessage.set(
      'Unable to start payment. Please try again.'
    );

  }

}

  downloadInvoice(): void {

    const orderId =
      this.orderId();

    if (!orderId) {
      return;
    }

    this.orderService
      .downloadInvoice(orderId)
      .subscribe({

        next: (blob) => {

          const url =
            window.URL.createObjectURL(blob);

          const link =
            document.createElement('a');

          link.href = url;

          link.download =
            `${this.orderNumber()}.pdf`;

          link.click();

          window.URL.revokeObjectURL(url);

        },

        error: (error) => {

          console.error(
            'INVOICE DOWNLOAD ERROR:',
            error
          );

          this.errorMessage.set(
            'Unable to download the invoice. Please try again.'
          );

        }

      });

  }

}